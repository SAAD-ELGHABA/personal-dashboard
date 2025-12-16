import axios from 'axios';
import type { 
  AuthResponse, 
  ApiToken, 
  N8nStats, 
  PortfolioStats,
  Project,
  ProjectSettings,
  ModelType,
  Model,
  ModelHealthStatus,
  ModelStatistics,
  CreateProjectDTO,
  UpdateProjectDTO,
  UpdateProjectSettingsDTO,
  Service,
  CreateServiceDTO,
  UpdateServiceDTO,
  ServiceHealthCheck,
  ServicePerformanceMetrics
} from '../types';

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
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/register', {
      username,
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

  // Project Management endpoints
  async getProjects(includeInactive?: boolean): Promise<{ success: boolean; data: { projects: Project[] } }> {
    const response = await this.api.get('/api/projects', {
      params: { includeInactive },
    });
    return response.data;
  }

  async getProject(id: string): Promise<{ success: boolean; data: { project: Project; settings: ProjectSettings } }> {
    const response = await this.api.get(`/api/projects/${id}`);
    return response.data;
  }

  async createProject(
    data: CreateProjectDTO
  ): Promise<{ 
    success: boolean; 
    data: { 
      project: Project; 
      apiToken: string; 
      settings: ProjectSettings 
    }; 
    message: string 
  }> {
    const response = await this.api.post('/api/projects', data);
    return response.data;
  }

  async updateProject(
    id: string,
    data: UpdateProjectDTO
  ): Promise<{ success: boolean; data: { project: Project }; message: string }> {
    const response = await this.api.put(`/api/projects/${id}`, data);
    return response.data;
  }

  async updateProjectSettings(
    id: string,
    data: UpdateProjectSettingsDTO
  ): Promise<{ success: boolean; data: { settings: ProjectSettings }; message: string }> {
    const response = await this.api.put(`/api/projects/${id}/settings`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.delete(`/api/projects/${id}`);
    return response.data;
  }

  async regenerateApiToken(id: string): Promise<{ success: boolean; data: { apiToken: string }; message: string }> {
    const response = await this.api.post(`/api/projects/${id}/regenerate-token`);
    return response.data;
  }

  async getModelTypes(): Promise<{ success: boolean; data: { modelTypes: ModelType[]; count: number } }> {
    const response = await this.api.get('/api/model-types');
    return response.data;
  }

  // Model Management endpoints
  async getModels(filters?: {
    typeId?: string;
    provider?: string;
    status?: string;
    isPublic?: boolean;
    projectId?: string;
    tags?: string[];
  }): Promise<{ success: boolean; data: { models: Model[]; count: number } }> {
    const params = new URLSearchParams();
    if (filters?.typeId) params.append('typeId', filters.typeId);
    if (filters?.provider) params.append('provider', filters.provider);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.isPublic !== undefined) params.append('isPublic', String(filters.isPublic));
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.tags) params.append('tags', filters.tags.join(','));

    const response = await this.api.get(`/api/models?${params.toString()}`);
    return response.data;
  }

  async getModel(id: string): Promise<{ success: boolean; data: { model: Model } }> {
    const response = await this.api.get(`/api/models/${id}`);
    return response.data;
  }

  async createModel(data: Partial<Model>): Promise<{ success: boolean; data: { model: Model }; message: string }> {
    const response = await this.api.post('/api/models', data);
    return response.data;
  }

  async updateModel(id: string, data: Partial<Model>): Promise<{ success: boolean; data: { model: Model }; message: string }> {
    const response = await this.api.put(`/api/models/${id}`, data);
    return response.data;
  }

  async deleteModel(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.delete(`/api/models/${id}`);
    return response.data;
  }

  async getModelHealth(id: string): Promise<{ 
    success: boolean; 
    data: { 
      model: Partial<Model>;
      health: ModelHealthStatus | null;
      statistics: ModelStatistics | null;
    } 
  }> {
    const response = await this.api.get(`/api/models/${id}/health`);
    return response.data;
  }

  async testModelConnection(id: string): Promise<{ 
    success: boolean; 
    data: { success: boolean; latencyMs?: number; error?: string };
    message: string;
  }> {
    const response = await this.api.post(`/api/models/${id}/test`);
    return response.data;
  }

  async getAvailableModels(typeId: string, projectId?: string): Promise<{ 
    success: boolean; 
    data: { models: Model[]; count: number } 
  }> {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await this.api.get(`/api/models/type/${typeId}/available${params}`);
    return response.data;
  }

  // Model Type Management endpoints
  async getModelType(id: string): Promise<{ success: boolean; data: { modelType: ModelType } }> {
    const response = await this.api.get(`/api/model-types/${id}`);
    return response.data;
  }

  async getModelTypesByCategory(category: string): Promise<{ 
    success: boolean; 
    data: { modelTypes: ModelType[]; count: number } 
  }> {
    const response = await this.api.get(`/api/model-types/category/${category}`);
    return response.data;
  }

  async getModelTypeWithStats(id: string): Promise<{ 
    success: boolean; 
    data: { 
      modelType: ModelType;
      stats: {
        totalModels: number;
        activeModels: number;
        inactiveModels: number;
        unhealthyModels: number;
      };
    } 
  }> {
    const response = await this.api.get(`/api/model-types/${id}/stats`);
    return response.data;
  }

  async createModelType(data: Partial<ModelType>): Promise<{ 
    success: boolean; 
    data: { modelType: ModelType }; 
    message: string 
  }> {
    const response = await this.api.post('/api/model-types', data);
    return response.data;
  }

  async updateModelType(id: string, data: Partial<ModelType>): Promise<{ 
    success: boolean; 
    data: { modelType: ModelType }; 
    message: string 
  }> {
    const response = await this.api.put(`/api/model-types/${id}`, data);
    return response.data;
  }

  async deleteModelType(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.delete(`/api/model-types/${id}`);
    return response.data;
  }

  async updateModelTypeOrder(orders: { id: string; order: number }[]): Promise<{ 
    success: boolean; 
    message: string 
  }> {
    const response = await this.api.post('/api/model-types/reorder', { orders });
    return response.data;
  }

  // Service Management endpoints
  async createService(data: CreateServiceDTO): Promise<Service> {
    const response = await this.api.post('/api/services', data);
    return response.data;
  }

  async getProjectServices(projectId: string): Promise<Service[]> {
    const response = await this.api.get(`/api/services/project/${projectId}`);
    return response.data;
  }

  async getServiceById(serviceId: string): Promise<Service & {
    availabilityStats?: any[];
    latestPerformance?: ServicePerformanceMetrics;
  }> {
    const response = await this.api.get(`/api/services/${serviceId}`);
    return response.data;
  }

  async getService(serviceId: string): Promise<Service & {
    availabilityStats?: any[];
    latestPerformance?: ServicePerformanceMetrics;
  }> {
    const response = await this.api.get(`/api/services/${serviceId}`);
    return response.data;
  }

  async updateService(serviceId: string, data: UpdateServiceDTO): Promise<Service> {
    const response = await this.api.put(`/api/services/${serviceId}`, data);
    return response.data;
  }

  async deleteService(serviceId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/api/services/${serviceId}`);
    return response.data;
  }

  async getServiceHealthHistory(serviceId: string, limit: number = 100): Promise<ServiceHealthCheck[]> {
    const response = await this.api.get(`/api/services/${serviceId}/health-history?limit=${limit}`);
    return response.data;
  }

  async getServicePerformanceHistory(serviceId: string, limit: number = 100): Promise<ServicePerformanceMetrics[]> {
    const response = await this.api.get(`/api/services/${serviceId}/performance-history?limit=${limit}`);
    return response.data;
  }

  async testServiceHealth(serviceId: string): Promise<any> {
    const response = await this.api.post(`/api/services/${serviceId}/test-health`);
    return response.data;
  }
}

export const apiService = new ApiService();
