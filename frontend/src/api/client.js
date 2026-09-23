import axios from 'axios';

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const startInterview = async (resume, targetRole) => {
  const formData = new FormData();
  formData.append('resume', resume);
  formData.append('target_role', targetRole);
  const response = await api.post('/interview/start', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const submitAnswer = async (interviewId, answer) => {
  const response = await api.post(`/interview/${interviewId}/answer`, { answer });
  return response.data;
};

export const finishInterview = async (interviewId) => {
  const response = await api.post(`/interview/${interviewId}/finish`);
  return response.data;
};

export const getInterview = async (interviewId) => {
  const response = await api.get(`/interview/${interviewId}`);
  return response.data;
};

export const getEvaluation = async (interviewId) => {
  const response = await api.get(`/evaluation/${interviewId}`);
  return response.data;
};
