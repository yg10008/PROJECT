import { useState } from 'react';
import PropTypes from 'prop-types';

const ImageCard = ({ image }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getEngagementColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const formatActivityType = (type) => {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="relative">
                <img
                    src={image.imageUrl}
                    alt="Classroom"
                    className="w-full h-48 object-cover rounded cursor-pointer"
                    onClick={() => setIsExpanded(true)}
                />
                {image.analysisResult.basicMetrics.flagged && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                        This image has been flagged for review
                    </div>
                )}
            </div>

            <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-600">Engagement Score</p>
                        <p className={`text-xl font-bold ${getEngagementColor(image.analysisResult.basicMetrics.engagementScore)}`}>
                            {image.analysisResult.basicMetrics.engagementScore}%
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600">Student Count</p>
                        <p className="text-xl font-bold">
                            {image.analysisResult.detailedAnalysis.studentCount} students
                        </p>
                    </div>
                </div>

                <div className="mt-4">
                    <p className="text-gray-600">Activity Type</p>
                    <p className="font-semibold">
                        {formatActivityType(image.analysisResult.detailedAnalysis.activityType).toUpperCase()}
                    </p>
                </div>

                <div className="mt-4">
                    <p className="text-gray-600">Detected Objects</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {image.analysisResult.detailedAnalysis.detectedObjects.map((object, index) => (
                            <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                            >
                                {object}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="relative">
                        <button
                            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2"
                            onClick={() => setIsExpanded(false)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img
                            src={image.imageUrl}
                            alt="Classroom"
                            className="max-w-full max-h-[80vh] object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

ImageCard.propTypes = {
    image: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        imageUrl: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
        analysisResult: PropTypes.shape({
            basicMetrics: PropTypes.shape({
                engagementScore: PropTypes.number.isRequired,
                flagged: PropTypes.bool.isRequired
            }).isRequired,
            detailedAnalysis: PropTypes.shape({
                studentCount: PropTypes.number.isRequired,
                activityType: PropTypes.string.isRequired,
                detectedObjects: PropTypes.arrayOf(PropTypes.string).isRequired
            }).isRequired
        }).isRequired
    }).isRequired
};

export default ImageCard; 