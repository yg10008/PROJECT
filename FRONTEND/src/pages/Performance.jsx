import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { performanceService } from '../services/api';

const Performance = () => {
    const { institutionId } = useParams();
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchPerformance();
    }, [institutionId, dateRange]);

    const fetchPerformance = async () => {
        try {
            const params = {};
            if (dateRange.startDate) params.startDate = dateRange.startDate;
            if (dateRange.endDate) params.endDate = dateRange.endDate;

            const response = await performanceService.getInstitutionPerformance(institutionId, params);
            setPerformance(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching performance data');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e) => {
        setDateRange({
            ...dateRange,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return <div className="text-center py-12">Loading performance data...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center py-12">{error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Performance Metrics</h1>
                <p className="mt-2 text-gray-600">View institution performance analytics</p>
            </div>

            <div className="mb-6 flex space-x-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                        Start Date
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={dateRange.startDate}
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
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">Average Engagement</h3>
                    <p className="mt-2 text-3xl font-bold text-blue-600">
                        {performance.averageEngagement.toFixed(1)}%
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">Average Attendance</h3>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                        {performance.averageAttendance.toFixed(1)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">Total Images</h3>
                    <p className="mt-2 text-3xl font-bold text-purple-600">
                        {performance.totalImages}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">Flagged Images</h3>
                    <p className="mt-2 text-3xl font-bold text-red-600">
                        {performance.flaggedImages}
                    </p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Distribution</h2>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="space-y-4">
                        {Object.entries(performance.activityTypes).map(([type, count]) => (
                            <div key={type} className="flex items-center">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-900">
                                            {type.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className="text-gray-500">{count} images</span>
                                    </div>
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{
                                                width: `${(count / performance.totalImages) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Flag Distribution</h2>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="space-y-4">
                        {Object.entries(performance.flags).map(([type, count]) => (
                            <div key={type} className="flex items-center">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-900">
                                            {type.toUpperCase()}
                                        </span>
                                        <span className="text-gray-500">{count} flags</span>
                                    </div>
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-red-600 h-2 rounded-full"
                                            style={{
                                                width: `${(count / performance.flaggedImages) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Performance; 