import axios from 'axios';
import type { AuthResponse, ApiToken, N8nStats, PortfolioStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  private api: ReturnType<typeof axios.create>;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/api/auth/me');
    return response.data;
  }

  // API Token endpoints
  async getApiTokens(): Promise<{ success: boolean; data: { tokens: ApiToken[] } }> {
    const response = await this.api.get('/api/tokens');
    return response.data;
  }

  async createApiToken(
    name: string,
    scopes: string[],
    expiresIn: number
  ): Promise<{ success: boolean; data: { token: ApiToken }; message: string }> {
    const response = await this.api.post('/api/tokens', {
      name,
      scopes,
      expiresIn,
    });
    return response.data;
  }

  async revokeApiToken(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.delete(`/api/tokens/${id}`);
    return response.data;
  }

  // Stats endpoints
  async getN8nStats(): Promise<{ success: boolean; data: N8nStats }> {
    const response = await this.api.get('/api/stats/n8n');
    return response.data;
  }

  async getPortfolioStats(): Promise<{ success: boolean; data: PortfolioStats }> {
    const response = await this.api.get('/api/stats/portfolio');
    return response.data;
  }
}

export const apiService = new ApiService();
