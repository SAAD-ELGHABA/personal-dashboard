export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiToken {
  id: string;
  name: string;
  token?: string;
  scopes: ('read' | 'write' | 'admin')[];
  expiresAt: string;
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

export interface ModelType {
  _id: string;
  key: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  apiToken: {
    _id: string;
    name: string;
    scopes: string[];
    expiresAt: string;
    lastUsedAt?: string;
    isActive: boolean;
  };
  modelTypesAllowed: ModelType[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSettings {
  _id: string;
  projectId: string;
  allowedModelTypes: ModelType[];
  maxRequestSize: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  modelTypesAllowed: string[];
  maxRequestSize?: number;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  modelTypesAllowed?: string[];
}

export interface UpdateProjectSettingsDTO {
  allowedModelTypes?: string[];
  maxRequestSize?: number;
  isActive?: boolean;
}

export interface N8nStats {
  workflows: {
    total: number;
    active: number;
    inactive: number;
  };
  executions: {
    total: number;
    successful: number;
    failed: number;
    successRate: string;
  };
  recentExecutions: Array<{
    id: string;
    workflowId: string;
    status: 'success' | 'failed';
    startTime: string;
    duration: number | null;
  }>;
  error?: string;
}

export interface PortfolioStats {
  visitors: {
    total: number;
    last7Days: number;
    byDay: Array<{
      date: string;
      count: number;
    }>;
  };
  projects: {
    total: number;
    mostViewed: Array<{
      id: string;
      name: string;
      views: number;
    }>;
  };
  error?: string;
}

export interface DashboardStats {
  totalWorkflowRuns: number;
  totalPortfolioVisits: number;
  connectedApps: number;
}

