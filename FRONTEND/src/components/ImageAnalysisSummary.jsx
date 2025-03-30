import PropTypes from 'prop-types';

const ImageAnalysisSummary = ({ data }) => {
    if (!data || data.totalImages === 0) {
        return <div className="text-center text-gray-600">No analysis data available</div>;
    }

    const getEngagementColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Analysis Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Total Images Analyzed:</p>
                    <p className="text-2xl font-bold">{data.totalImages}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Average Engagement:</p>
                    <p className={`text-2xl font-bold ${getEngagementColor(data.averageEngagement)}`}>
                        {data.averageEngagement}%
                    </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Flagged Images:</p>
                    <p className="text-2xl font-bold text-red-600">{data.flaggedImages}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Average Student Count:</p>
                    <p className="text-2xl font-bold">{data.averageStudentCount}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold mb-4">Activity Type Distribution</h3>
                    <div className="space-y-3">
                        {Object.entries(data.activityBreakdown).map(([type, percentage]) => (
                            <div key={type} className="flex justify-between items-center">
                                <span className="text-gray-600">
                                    {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                                </span>
                                <span className="font-semibold">{percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Most Common Objects</h3>
                    <div className="space-y-2">
                        {data.commonObjects.map((item, index) => (
                            <div key={index} className="flex items-center">
                                <div className="flex-grow bg-gray-200 rounded-full h-4">
                                    <div
                                        className="bg-blue-600 h-4 rounded-full"
                                        style={{ width: `${item.count}%` }}
                                    />
                                </div>
                                <span className="ml-3 text-sm text-gray-600">
                                    {item.object} ({item.count}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Time of Day Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(data.timeOfDayAnalysis).map(([timeOfDay, stats]) => (
                        <div key={timeOfDay} className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-600 capitalize">{timeOfDay}:</p>
                            <p className={`font-semibold ${getEngagementColor(stats.avgEngagement)}`}>
                                {stats.count} images, {stats.avgEngagement}% engagement
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

ImageAnalysisSummary.propTypes = {
    data: PropTypes.shape({
        totalImages: PropTypes.number.isRequired,
        averageEngagement: PropTypes.number.isRequired,
        activityBreakdown: PropTypes.objectOf(PropTypes.number).isRequired,
        flaggedImages: PropTypes.number.isRequired,
        averageStudentCount: PropTypes.number.isRequired,
        commonObjects: PropTypes.arrayOf(PropTypes.shape({
            object: PropTypes.string.isRequired,
            count: PropTypes.number.isRequired
        })).isRequired,
        timeOfDayAnalysis: PropTypes.objectOf(PropTypes.shape({
            count: PropTypes.number.isRequired,
            avgEngagement: PropTypes.number.isRequired
        })).isRequired
    }).isRequired
};

export default ImageAnalysisSummary; 