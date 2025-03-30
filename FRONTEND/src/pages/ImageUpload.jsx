import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { imageService } from '../services/api';

const ImageUpload = () => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            setFile(selectedFile);
            setError(null);
            setSuccess(false);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select an image');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('institutionId', user.institutionId);

            const response = await imageService.upload(formData);
            setSuccess(true);
            setFile(null);
            setPreview(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Error uploading image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Upload Classroom Image</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="image-upload"
                    />
                    <label
                        htmlFor="image-upload"
                        className="cursor-pointer block"
                    >
                        {preview ? (
                            <img
                                src={preview}
                                alt="Preview"
                                className="max-h-64 mx-auto"
                            />
                        ) : (
                            <div className="text-gray-500">
                                <p>Click to select an image</p>
                                <p className="text-sm">Maximum file size: 5MB</p>
                            </div>
                        )}
                    </label>
                </div>

                {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                )}

                {success && (
                    <div className="text-green-500 text-sm">
                        Image uploaded successfully!
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !file}
                    className={`w-full py-2 px-4 rounded ${
                        loading || !file
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                >
                    {loading ? 'Uploading...' : 'Upload Image'}
                </button>
            </form>
        </div>
    );
};

export default ImageUpload; 