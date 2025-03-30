import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { institutionService, imageService, performanceService } from '../services/api';

const Dashboard = () => {
    const { user, isAdmin, isInstitution } = useAuth();
    const [stats, setStats] = useState({
        totalImages: 0,
        averageEngagement: 0,
        averageAttendance: 0,
        flaggedImages: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                if (isInstitution) {
                    const summary = await imageService.getSummary(user.institutionId);
                    setStats(summary.data);
                } else if (isAdmin) {
                    const institutions = await institutionService.getAll();
                    const performance = await performanceService.getAnalytics();
                    setStats({
                        totalInstitutions: institutions.data.length,
                        totalImages: performance.data.totalImages,
                        averageEngagement: performance.data.averageEngagement,
                        flaggedImages: performance.data.flaggedImages
                    });
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Error fetching dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, isAdmin, isInstitution]);

    if (loading) {
        return <div className="text-center py-12">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center py-12">{error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome, {user.name}
                </h1>
                <p className="mt-2 text-gray-600">
                    {isAdmin ? 'Admin Dashboard' : isInstitution ? 'Institution Dashboard' : 'Student Dashboard'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Quick Stats */}
                {isInstitution && (
                    <>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">Total Images</h3>
                            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalImages}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">Average Engagement</h3>
                            <p className="mt-2 text-3xl font-bold text-green-600">
                                {stats.averageEngagement.toFixed(1)}%
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">Average Attendance</h3>
                            <p className="mt-2 text-3xl font-bold text-purple-600">
                                {stats.averageAttendance.toFixed(1)}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">Flagged Images</h3>
                            <p className="mt-2 text-3xl font-bold text-red-600">{stats.flaggedImages}</p>
                        </div>
                    </>
                )}

                {isAdmin && (
                    <>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">Total Institutions</h3>
                            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalInstitutions}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">Total Images</h3>
                            <p className="mt-2 text-3xl font-bold text-green-600">{stats.totalImages}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">Average Engagement</h3>
                            <p className="mt-2 text-3xl font-bold text-purple-600">
                                {stats.averageEngagement.toFixed(1)}%
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">Flagged Images</h3>
                            <p className="mt-2 text-3xl font-bold text-red-600">{stats.flaggedImages}</p>
                        </div>
                    </>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isInstitution && (
                        <>
                            <Link
                                to="/upload"
                                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                            >
                                <h3 className="text-lg font-medium text-gray-900">Upload Image</h3>
                                <p className="mt-1 text-gray-600">Upload and analyze classroom images</p>
                            </Link>
                            <Link
                                to={`/analysis/${user.institutionId}`}
                                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                            >
                                <h3 className="text-lg font-medium text-gray-900">View Analysis</h3>
                                <p className="mt-1 text-gray-600">Check image analysis results</p>
                            </Link>
                            <Link
                                to={`/performance/${user.institutionId}`}
                                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                            >
                                <h3 className="text-lg font-medium text-gray-900">Performance</h3>
                                <p className="mt-1 text-gray-600">View institution performance metrics</p>
                            </Link>
                        </>
                    )}

                    {isAdmin && (
                        <>
                            <Link
                                to="/institutions"
                                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                            >
                                <h3 className="text-lg font-medium text-gray-900">Manage Institutions</h3>
                                <p className="mt-1 text-gray-600">View and manage all institutions</p>
                            </Link>
                            <Link
                                to="/performance"
                                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                            >
                                <h3 className="text-lg font-medium text-gray-900">Performance Overview</h3>
                                <p className="mt-1 text-gray-600">View overall system performance</p>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 