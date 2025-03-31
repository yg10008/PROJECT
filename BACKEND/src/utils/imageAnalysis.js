const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const logger = require('./logger');

// Initialize Clarifai client correctly
const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", `Key ${process.env.CLARIFAI_API_KEY}`);

const analyzeClassroomImage = async (imageBuffer) => {
    try {
        // Convert buffer to base64
        const imageBase64 = imageBuffer.toString('base64');

        // Prepare the request for Clarifai
        const request = {
            user_app_id: {
                user_id: process.env.CLARIFAI_USER_ID,
                app_id: process.env.CLARIFAI_APP_ID
            },
            inputs: [
                {
                    data: {
                        image: {
                            base64: imageBase64
                        }
                    }
                }
            ],
            model: {
                model_id: 'general-image-recognition' // or your specific model ID
            }
        };

        // Make the prediction
        const response = await new Promise((resolve, reject) => {
            stub.PostModelOutputs(request, metadata, (err, response) => {
                if (err) {
                    reject(err);
                }
                resolve(response);
            });
        });

        if (response.status.code !== 10000) {
            throw new Error(`Clarifai API error: ${response.status.description}`);
        }

        // Process and return the analysis results
        return processAnalysisResults(response);

    } catch (error) {
        logger.logError('Image analysis failed', error);
        throw error;
    }
};

const processAnalysisResults = (response) => {
    try {
        const concepts = response.outputs[0].data.concepts;
        return {
            concepts: concepts.map(concept => ({
                name: concept.name,
                confidence: concept.value
            })),
            engagementScore: calculateEngagementScore(concepts),
            safetyCheck: performSafetyCheck(concepts),
            studentCount: estimateStudentCount(concepts),
            activityType: determineActivityType(concepts)
        };
    } catch (error) {
        logger.logError('Error processing analysis results', error);
        throw error;
    }
};

// Helper functions
const calculateEngagementScore = (concepts) => {
    const engagementIndicators = ['person', 'student', 'writing', 'reading', 'computer', 'book'];
    const score = concepts
        .filter(c => engagementIndicators.includes(c.name))
        .reduce((sum, c) => sum + c.value, 0);
    return Math.min(Math.round(score * 100), 100);
};

const performSafetyCheck = (concepts) => {
    const safetyIssues = ['danger', 'weapon', 'fire', 'smoke'];
    return {
        safe: !concepts.some(c => safetyIssues.includes(c.name) && c.value > 0.5),
        concerns: concepts.filter(c => safetyIssues.includes(c.name) && c.value > 0.5)
    };
};

const estimateStudentCount = (concepts) => {
    const personConcept = concepts.find(c => c.name === 'person');
    return personConcept ? Math.round(personConcept.value * 30) : 0;
};

const determineActivityType = (concepts) => {
    const activities = {
        lecture: ['whiteboard', 'presentation', 'teacher', 'projector'],
        group_work: ['group', 'collaboration', 'discussion'],
        individual_work: ['writing', 'reading', 'computer', 'book'],
        lab_work: ['laboratory', 'experiment', 'microscope', 'computer']
    };

    let maxScore = 0;
    let activityType = 'other';

    for (const [type, indicators] of Object.entries(activities)) {
        const score = concepts
            .filter(c => indicators.includes(c.name))
            .reduce((sum, c) => sum + c.value, 0);
        
        if (score > maxScore) {
            maxScore = score;
            activityType = type;
        }
    }

    return activityType;
};

module.exports = {
    analyzeClassroomImage
}; 