import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { imageService } from '../services/api';
import ImageCard from '../components/ImageCard';

const ImageAnalysis = () => {
    const { institutionId } = useParams();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        dateRange: {
            startDate: '',
            endDate: ''
        },
        activityType: 'all',
        engagementRange: 'all',
        flaggedOnly: false
    });

    useEffect(() => {
        fetchImages();
    }, [institutionId, filters]);

    const fetchImages = async () => {
        try {
            const params = {};
            if (filters.dateRange.startDate) params.startDate = filters.dateRange.startDate;
            if (filters.dateRange.endDate) params.endDate = filters.dateRange.endDate;

            const response = await imageService.getAll(params);
            const institutionImages = response.data.filter(
                img => img.institutionId === institutionId
            );
            setImages(institutionImages);
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching images');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            dateRange: {
                ...prev.dateRange,
                [name]: value
            }
        }));
    };

    const filteredImages = images.filter(image => {
        const activityType = image.analysisResult.detailedAnalysis.activityType;
        const engagement = image.analysisResult.basicMetrics.engagementScore;
        const isFlagged = image.analysisResult.basicMetrics.flagged;

        if (filters.activityType !== 'all' && activityType !== filters.activityType) {
            return false;
        }

        if (filters.engagementRange !== 'all') {
            const [min, max] = filters.engagementRange.split('-').map(Number);
            if (engagement < min || engagement > max) {
                return false;
            }
        }

        if (filters.flaggedOnly && !isFlagged) {
            return false;
        }

        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Image Analysis</h1>
                <p className="mt-2 text-gray-600">View and analyze classroom images</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                            Start Date
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={filters.dateRange.startDate}
                            onChange={handleDateChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                            End Date
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={filters.dateRange.endDate}
                            onChange={handleDateChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="activityType" className="block text-sm font-medium text-gray-700">
                            Activity Type
                        </label>
                        <select
                            id="activityType"
                            name="activityType"
                            value={filters.activityType}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="all">All Types</option>
                            <option value="computer_activity">Computer Activity</option>
                            <option value="reading">Reading</option>
                            <option value="lecture">Lecture</option>
                            <option value="group_activity">Group Activity</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="engagementRange" className="block text-sm font-medium text-gray-700">
                            Engagement Range
                        </label>
                        <select
                            id="engagementRange"
                            name="engagementRange"
                            value={filters.engagementRange}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="all">All Ranges</option>
                            <option value="0-40">Low (0-40%)</option>
                            <option value="41-70">Medium (41-70%)</option>
                            <option value="71-100">High (71-100%)</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4">
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            name="flaggedOnly"
                            checked={filters.flaggedOnly}
                            onChange={handleFilterChange}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show only flagged images</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredImages.map((image) => (
                    <ImageCard key={image._id} image={image} />
                ))}
            </div>

            {filteredImages.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400">
                        <svg
                            className="mx-auto h-12 w-12"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your filters to see more results.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ImageAnalysis; 