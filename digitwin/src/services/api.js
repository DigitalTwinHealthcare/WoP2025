import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = 'http://localhost:8001';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include auth token
apiClient.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        try {
            const token = await user.getIdToken();
            console.log("Injecting token:", token.substring(0, 10) + "...");
            config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
            console.error("Error getting auth token:", error);
        }
    } else {
        console.warn("No user logged in when making request to:", config.url);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const api = {
    // Patients
    getPatients: async () => {
        const response = await apiClient.get('/patients');
        return response.data;
    },

    getRecentPatients: async () => {
        const response = await apiClient.get('/patients/recent');
        return response.data;
    },

    getPatient: async (id) => {
        const response = await apiClient.get(`/patients/${id}`);
        return response.data;
    },

    createPatient: async (patientData) => {
        // patientData should be a FormData object if it contains a file, 
        // or a plain object if using the JSON endpoint (though backend uses Form for creation)
        // The backend create_patient endpoint expects Form fields.

        // If we are sending JSON, we need to convert to Form data for the specific endpoint structure
        // OR use the endpoint as designed (Form parameters).

        const formData = new FormData();
        Object.keys(patientData).forEach(key => {
            if (patientData[key] !== null && patientData[key] !== undefined) {
                formData.append(key, patientData[key]);
            }
        });

        const response = await apiClient.post('/patients', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deletePatient: async (id) => {
        await apiClient.delete(`/patients/${id}`);
    },

    // EHR & Files
    uploadEHR: async (patientId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/patients/${patientId}/upload-ehr`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    uploadOrthopedicScan: async (patientId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/patients/${patientId}/orthopedic/scan`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Twin / Simulation
    analyzeScan: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/twin/analyze_scan', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    initTwin: async (patientId) => {
        const response = await apiClient.post('/twin/init', { patient_id: patientId });
        return response.data;
    },

    runSimulation: async (simulationData) => {
        const response = await apiClient.post('/twin/simulate', simulationData);
        return response.data;
    },

    exportReport: async (patientId, type, file) => {
        const formData = new FormData();
        formData.append('patient_id', patientId);
        formData.append('type', type);
        formData.append('file', file);

        const response = await apiClient.post('/twin/export', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    }
};

export default api;
