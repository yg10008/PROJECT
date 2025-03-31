const ClarifaiStub = require('clarifai-nodejs-grpc').grpc;
const { logError } = require('./logger');

const stub = ClarifaiStub.json();

const analyzeClassroomImage = async (imageBuffer) => {
    try {
        const imageBase64 = imageBuffer.toString('base64');

        const response = await new Promise((resolve, reject) => {
            stub.PostModelOutputs(
                {
                    user_app_id: {
                        user_id: process.env.CLARIFAI_USER_ID,
                        app_id: process.env.CLARIFAI_APP_ID
                    },
                    model_id: 'classroom-analysis-model',
                    inputs: [{
                        data: {
                            image: { base64: imageBase64 }
                        }
                    }]
                },
                process.env.CLARIFAI_API_KEY,
                (err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                }
            );
        });

        return processAnalysisResponse(response);
    } catch (error) {
        logError('Clarifai analysis failed', error);
        throw new Error('Image analysis failed');
    }
};

// Helper functions
function calculateEngagementScore(concepts) {
    const engagementIndicators = ['person', 'student', 'writing', 'reading', 'computer', 'book'];
    const score = concepts
        .filter(c => engagementIndicators.includes(c.name))
        .reduce((sum, c) => sum + c.value, 0);
    return Math.min(Math.round(score * 100), 100);
}

function checkForSafetyIssues(concepts) {
    const safetyIssues = ['danger', 'weapon', 'fire', 'smoke'];
    return concepts.some(c => safetyIssues.includes(c.name) && c.value > 0.5);
}

function estimateStudentCount(concepts) {
    const personConcept = concepts.find(c => c.name === 'person');
    return personConcept ? Math.round(personConcept.value * 30) : 0;
}

function determineActivityType(concepts) {
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
}

module.exports = {
    analyzeClassroomImage
}; 