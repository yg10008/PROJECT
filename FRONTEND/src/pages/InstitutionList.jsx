import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { institutionService } from '../services/api';

const InstitutionList = () => {
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInstitutions();
    }, []);

    const fetchInstitutions = async () => {
        try {
            const response = await institutionService.getAll();
            setInstitutions(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching institutions');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this institution?')) {
            return;
        }

        try {
            await institutionService.delete(id);
            setInstitutions(institutions.filter(inst => inst._id !== id));
        } catch (err) {
            setError(err.response?.data?.message || 'Error deleting institution');
        }
    };

    const filteredInstitutions = institutions.filter(institution =>
        institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        institution.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="text-center py-12">Loading institutions...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center py-12">{error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Institutions</h1>
                <Link
                    to="/institutions/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Add New Institution
                </Link>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search institutions..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {filteredInstitutions.map((institution) => (
                        <li key={institution._id}>
                            <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-blue-600 truncate">
                                            {institution.name}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {institution.location}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <Link
                                            to={`/institution/${institution._id}`}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View Details
                                        </Link>
                                        <Link
                                            to={`/institution/${institution._id}/edit`}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(institution._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {filteredInstitutions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No institutions found
                </div>
            )}
        </div>
    );
};

export default InstitutionList; 