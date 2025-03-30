import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth Services
export const authService = {
    login: async (credentials) => {
        return axiosInstance.post('/auth/login', credentials);
    },
    register: async (userData) => {
        return axiosInstance.post('/auth/register', userData);
    },
    logout: () => {
        localStorage.removeItem('token');
    },
    getCurrentUser: () => axiosInstance.get('/auth/me')
};

// Institution Services
export const institutionService = {
    getAll: async () => {
        return axiosInstance.get('/institutions');
    },
    getById: async (id) => {
        return axiosInstance.get(`/institutions/${id}`);
    },
    create: async (institutionData) => {
        return axiosInstance.post('/institutions', institutionData);
    },
    update: async (id, institutionData) => {
        return axiosInstance.put(`/institutions/${id}`, institutionData);
    },
    delete: async (id) => {
        return axiosInstance.delete(`/institutions/${id}`);
    }
};

// Image Services
export const imageService = {
    upload: async (formData, config) => {
        return axiosInstance.post('/images/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            ...config
        });
    },
    getAll: async (params) => {
        return axiosInstance.get('/images', { params });
    },
    getById: async (id) => {
        return axiosInstance.get(`/images/${id}`);
    },
    getSummary: async (institutionId, params) => {
        return axiosInstance.get(`/institution/${institutionId}/summary`, { params });
    },
    delete: async (imageId) => {
        return axiosInstance.delete(`/images/${imageId}`);
    }
};

// Curriculum Services
export const curriculumService = {
    getAll: () => axiosInstance.get('/curriculum'),
    getById: (id) => axiosInstance.get(`/curriculum/${id}`),
    create: (data) => axiosInstance.post('/curriculum', data),
    update: (id, data) => axiosInstance.put(`/curriculum/${id}`, data)
};

// Performance Services
export const performanceService = {
    getInstitutionPerformance: (institutionId) => axiosInstance.get(`/performance/institution/${institutionId}`),
    getAnalytics: (params) => axiosInstance.get('/performance/analytics', { params })
};

export default axiosInstance; 