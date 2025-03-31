const { ClarifaiStub, grpc } = require('clarifai-nodejs-grpc');
const tf = require('@tensorflow/tfjs-node');
const { logger, logError, logPerformance } = require('./logger');
const { validateImageType, validateFileSize } = require('./validation');
const { cacheGet, cacheSet } = require('./cache');

// Constants
const CACHE_PREFIX = 'image_analysis:';
const CACHE_DURATION = 3600; // 1 hour
const MODEL_PATH = process.env.MODEL_PATH || 'file://./models/classroom-analysis/model.json';

// Initialize Clarifai
const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set('authorization', `Key ${process.env.CLARIFAI_API_KEY}`);

// Local model management
let localModel;
const loadLocalModel = async () => {
    try {
        if (!localModel) {
            localModel = await tf.loadLayersModel(MODEL_PATH);
            logger.info('Local model loaded successfully');
        }
        return localModel;
    } catch (error) {
        logError('Error loading local model:', error);
        throw error;
    }
};

const analyzeImage = async (imageBuffer, options = {}) => {
    const startTime = Date.now();
    
    try {
        // Validate image
        if (!validateImageType(imageBuffer.mimetype)) {
            throw new Error('Invalid image type');
        }
        if (!validateFileSize(imageBuffer.size)) {
            throw new Error('Image size too large');
        }

        // Check cache
        const cacheKey = `${CACHE_PREFIX}${imageBuffer.md5}`;
        const cachedResult = await cacheGet(cacheKey);
        if (cachedResult && !options.skipCache) {
            logPerformance('imageAnalysis', Date.now() - startTime, {
                source: 'cache',
                success: true
            });
            return cachedResult;
        }

        // Parallel analysis
        const [clarifaiResults, localResults] = await Promise.all([
            analyzeClarifai(imageBuffer),
            analyzeLocal(imageBuffer)
        ]);

        // Combine results
        const results = combineResults(clarifaiResults, localResults);

        // Cache results
        await cacheSet(cacheKey, results, CACHE_DURATION);

        logPerformance('imageAnalysis', Date.now() - startTime, {
            source: 'analysis',
            success: true
        });

        return results;
    } catch (error) {
        logError('Image analysis failed:', error);
        logPerformance('imageAnalysis', Date.now() - startTime, {
            success: false,
            error: error.message
        });
        throw error;
    }
};

const analyzeClarifai = async (imageBuffer) => {
    try {
        const response = await new Promise((resolve, reject) => {
            stub.PostModelOutputs(
                {
                    user_app_id: {
                        user_id: process.env.CLARIFAI_USER_ID,
                        app_id: process.env.CLARIFAI_APP_ID
                    },
                    model_id: 'classroom-analysis',
                    inputs: [{
                        data: {
                            image: { base64: imageBuffer.toString('base64') }
                        }
                    }]
                },
                metadata,
                (err, response) => {
                    if (err) reject(err);
                    if (response.status.code !== 10000) {
                        reject(new Error(response.status.description));
                    }
                    resolve(response);
                }
            );
        });

        return processClarifaiResponse(response);
    } catch (error) {
        logError('Clarifai analysis failed:', error);
        throw error;
    }
};

const analyzeLocal = async (imageBuffer) => {
    try {
        if (!localModel) await loadLocalModel();

        // Preprocess image
        const tensor = await tf.node.decodeImage(imageBuffer);
        const processed = await preprocessImage(tensor);
        
        // Get predictions
        const predictions = await localModel.predict(processed);
        
        return processLocalPredictions(predictions);
    } catch (error) {
        logError('Local analysis failed:', error);
        throw error;
    }
};

const preprocessImage = async (tensor) => {
    return tf.tidy(() => {
        // Resize to expected dimensions
        const resized = tf.image.resizeBilinear(tensor, [224, 224]);
        // Normalize pixel values
        const normalized = resized.div(255.0);
        // Add batch dimension
        return normalized.expandDims(0);
    });
};

const processClarifaiResponse = (response) => {
    const concepts = response.outputs[0].data.concepts;
    return {
        concepts: concepts.map(c => ({
            name: c.name,
            value: c.value
        })),
        engagementScore: calculateEngagementScore(concepts),
        safetyCheck: performSafetyCheck(concepts)
    };
};

const processLocalPredictions = (predictions) => {
    const values = predictions.dataSync();
    return {
        studentCount: estimateStudentCount(values),
        activityType: determineActivityType(values),
        attentionLevel: calculateAttentionLevel(values)
    };
};

const combineResults = (clarifaiResults, localResults) => {
    return {
        ...clarifaiResults,
        ...localResults,
        timestamp: new Date(),
        confidence: calculateOverallConfidence(clarifaiResults, localResults)
    };
};

// Helper functions
const calculateEngagementScore = (concepts) => {
    const engagementIndicators = [
        'attentive', 'participating', 'writing', 'reading',
        'discussing', 'presenting', 'collaborating'
    ];

    return concepts
        .filter(c => engagementIndicators.includes(c.name))
        .reduce((score, c) => score + c.value, 0) / engagementIndicators.length * 100;
};

const performSafetyCheck = (concepts) => {
    const safetyIssues = [
        'violence', 'weapons', 'inappropriate',
        'dangerous', 'unsafe'
    ];

    const issues = concepts
        .filter(c => safetyIssues.includes(c.name) && c.value > 0.5)
        .map(c => ({
            issue: c.name,
            confidence: c.value
        }));

    return {
        safe: issues.length === 0,
        issues
    };
};

const estimateStudentCount = (values) => {
    // Implementation depends on model output structure
    return {
        count: Math.round(values[0]),
        confidence: values[1]
    };
};

const calculateOverallConfidence = (clarifaiResults, localResults) => {
    // Weighted average of confidence scores
    const weights = {
        clarifai: 0.6,
        local: 0.4
    };

    return (
        clarifaiResults.concepts[0]?.value * weights.clarifai +
        localResults.studentCount.confidence * weights.local
    );
};

module.exports = {
    analyzeImage,
    loadLocalModel,
    // Export for testing
    analyzeClarifai,
    analyzeLocal,
    preprocessImage
};