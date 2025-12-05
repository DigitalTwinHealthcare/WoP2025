import api from './api';

export const twinService = {
    analyzeScan: async (file) => {
        return await api.analyzeScan(file);
    },

    initTwin: async (patientId, baseline) => {
        return await api.initTwin(patientId);
    }
};
