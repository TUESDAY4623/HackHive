import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hackhive_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('hackhive_token');
      localStorage.removeItem('hackhive_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ===================== AUTH =====================
export const authApi = {
  register: (data: { name: string; handle: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// ===================== USERS =====================
export const usersApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  getByHandle: (handle: string) => api.get(`/users/handle/${handle}`),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/me', data),
  updateSkills: (skills: unknown[]) => api.put('/users/me/skills', { skills }),
  deleteAccount: () => api.delete('/users/me'),
};

// ===================== PROJECTS =====================
export const projectsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/projects', { params }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: Record<string, unknown>) => api.post('/projects', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  like: (id: string) => api.put(`/projects/${id}/like`),
  addComment: (id: string, text: string) =>
    api.post(`/projects/${id}/comments`, { text }),
  requestJoin: (id: string, message?: string) =>
    api.post(`/projects/${id}/join`, { message }),
  handleJoin: (id: string, requestId: string, status: string, role?: string) =>
    api.put(`/projects/${id}/join/${requestId}`, { status, role }),
};

// ===================== HACKATHONS =====================
export const hackathonsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/hackathons', { params }),
  getById: (id: string) => api.get(`/hackathons/${id}`),
  create: (data: Record<string, unknown>) => api.post('/hackathons', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/hackathons/${id}`, data),
  delete: (id: string) => api.delete(`/hackathons/${id}`),
  register: (id: string) => api.put(`/hackathons/${id}/register`),
};

// ===================== CONVERSATIONS =====================
export const conversationsApi = {
  getAll: () => api.get('/conversations'),
  getOrCreate: (recipientId: string) =>
    api.post('/conversations', { recipientId }),
  getMessages: (convId: string, page = 1) =>
    api.get(`/conversations/${convId}/messages`, { params: { page } }),
  sendMessage: (convId: string, text: string) =>
    api.post(`/conversations/${convId}/messages`, { text }),
};

// ===================== TEAMS =====================
export const teamsApi = {
  getAll: (params?: Record<string, string>) => api.get('/teams', { params }),
  getMine: () => api.get('/teams/mine'),
  getById: (id: string) => api.get(`/teams/${id}`),
  create: (data: Record<string, unknown>) => api.post('/teams', data),
  requestJoin: (id: string, message?: string, role?: string) =>
    api.post(`/teams/${id}/join`, { message, role }),
  handleRequest: (id: string, requestId: string, action: 'accept' | 'reject', role?: string) =>
    api.put(`/teams/${id}/requests/${requestId}`, { action, role }),
  leave: (id: string) => api.delete(`/teams/${id}/leave`),
  delete: (id: string) => api.delete(`/teams/${id}`),
};

export default api;
