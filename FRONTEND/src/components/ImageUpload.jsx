import { useState, useRef } from 'react';
import { imageService } from '../services/api';

const ImageUpload = ({ institutionId, onUploadSuccess }) => {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            await handleFile(files[0]);
        }
    };

    const handleChange = async (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            await handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload file
        const formData = new FormData();
        formData.append('image', file);
        formData.append('institutionId', institutionId);

        try {
            setError(null);
            setUploadProgress(0);

            const response = await imageService.upload(formData, {
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(progress);
                }
            });

            onUploadSuccess(response.data);
            setPreview(null);
            setUploadProgress(0);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
            setPreview(null);
            setUploadProgress(0);
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                />

                <div className="space-y-4">
                    <div className="text-gray-600">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <p className="mt-2 text-sm">
                            Drag and drop your image here, or{' '}
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="text-blue-600 hover:text-blue-500"
                            >
                                browse
                            </button>
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            PNG, JPG, JPEG up to 5MB
                        </p>
                    </div>

                    {preview && (
                        <div className="mt-4">
                            <img
                                src={preview}
                                alt="Preview"
                                className="mx-auto max-h-48 rounded-lg"
                            />
                        </div>
                    )}

                    {uploadProgress > 0 && (
                        <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                                Uploading: {uploadProgress}%
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 text-red-600 text-sm">{error}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageUpload; 