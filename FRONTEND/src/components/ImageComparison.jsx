import { useState } from 'react';

const ImageComparison = ({ images }) => {
    const [selectedImages, setSelectedImages] = useState([]);
    const [comparisonMode, setComparisonMode] = useState('engagement'); // engagement, attendance, or activity

    const handleImageSelect = (image) => {
        if (selectedImages.length < 2) {
            setSelectedImages([...selectedImages, image]);
        }
    };

    const handleImageDeselect = (imageId) => {
        setSelectedImages(selectedImages.filter(img => img._id !== imageId));
    };

    const getComparisonValue = (image, mode) => {
        switch (mode) {
            case 'engagement':
                return image.analysisResult.basicMetrics.engagementScore;
            case 'attendance':
                return image.analysisResult.detailedAnalysis.studentCount;
            case 'activity':
                return image.analysisResult.detailedAnalysis.activityType;
            default:
                return 0;
        }
    };

    const renderComparison = () => {
        if (selectedImages.length !== 2) return null;

        const [image1, image2] = selectedImages;
        const value1 = getComparisonValue(image1, comparisonMode);
        const value2 = getComparisonValue(image2, comparisonMode);

        return (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Comparison Results</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <div className="text-sm text-gray-600 mb-2">Image 1</div>
                        <div className="text-2xl font-bold text-blue-600">{value1}</div>
                        <div className="text-sm text-gray-500">
                            {new Date(image1.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 mb-2">Image 2</div>
                        <div className="text-2xl font-bold text-green-600">{value2}</div>
                        <div className="text-sm text-gray-500">
                            {new Date(image2.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                {comparisonMode !== 'activity' && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-600">Difference</div>
                        <div className={`text-xl font-bold ${
                            value1 > value2 ? 'text-red-600' : 'text-green-600'
                        }`}>
                            {Math.abs(value1 - value2)}%
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Compare Images</h3>
                    <select
                        value={comparisonMode}
                        onChange={(e) => setComparisonMode(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="engagement">Engagement</option>
                        <option value="attendance">Attendance</option>
                        <option value="activity">Activity Type</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((image) => (
                        <div
                            key={image._id}
                            className={`relative rounded-lg overflow-hidden border-2 ${
                                selectedImages.some(img => img._id === image._id)
                                    ? 'border-blue-500'
                                    : 'border-gray-200'
                            }`}
                        >
                            <img
                                src={image.imageUrl}
                                alt="Classroom"
                                className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleImageSelect(image)}
                                    className="bg-white text-gray-900 px-4 py-2 rounded-md text-sm font-medium"
                                >
                                    Select for Comparison
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedImages.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Images</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedImages.map((image) => (
                                <div
                                    key={image._id}
                                    className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                                >
                                    <span className="text-sm text-gray-700">
                                        {new Date(image.createdAt).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => handleImageDeselect(image._id)}
                                        className="ml-2 text-gray-500 hover:text-gray-700"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {renderComparison()}
        </div>
    );
};

export default ImageComparison; 