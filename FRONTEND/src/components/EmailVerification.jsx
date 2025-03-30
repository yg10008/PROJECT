import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EmailVerification = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying');
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                await axios.get(`/api/auth/verify-email/${token}`);
                setStatus('success');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setStatus('error');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {status === 'verifying' && (
                    <div className="text-center">
                        <h2 className="text-xl font-bold">Verifying your email...</h2>
                        <div className="mt-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center text-green-600">
                        <h2 className="text-xl font-bold">Email Verified Successfully!</h2>
                        <p className="mt-2">Redirecting to login page...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center text-red-600">
                        <h2 className="text-xl font-bold">Verification Failed</h2>
                        <p className="mt-2">The verification link is invalid or has expired.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailVerification; 