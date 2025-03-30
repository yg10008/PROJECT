import React, { useState } from 'react';
import axios from 'axios';

const Signup = () => {
    const [verificationSent, setVerificationSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/signup', formData);
            setVerificationSent(true);
        } catch (error) {
            console.error('Signup failed:', error);
        }
    };

    if (verificationSent) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
                <p className="text-gray-600">
                    We've sent a verification link to your email address.
                    Please check your inbox and click the link to verify your account.
                </p>
            </div>
        );
    }

    // ... rest of the component
};

export default Signup; 