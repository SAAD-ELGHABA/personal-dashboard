import { Model, IModel, ModelStatus } from '../models/Model';
import { ModelType } from '../models/ModelType';
import { ModelHealthStatus } from '../models/ModelHealthStatus';
import { ModelStatistics } from '../models/ModelStatistics';
import { ApiError } from '../middleware/errorHandler';
import mongoose from 'mongoose';
import axios from 'axios';

interface CreateModelDTO {
  name: string;
  typeId: string;
  version: string;
  provider: string;
  endpoint: string;
  apiKey: string;
  priority?: number;
  weight?: number;
  maxRequestsPerMinute?: number;
  maxConcurrentRequests?: number;
  timeoutSeconds?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  costPerRequest?: number;
  expirationDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
  projectsAssigned?: string[];
  isPublic?: boolean;
  requiresApproval?: boolean;
}

interface UpdateModelDTO {
  name?: string;
  version?: string;
  endpoint?: string;
  apiKey?: string;
  status?: ModelStatus;
  priority?: number;
  weight?: number;
  maxRequestsPerMinute?: number;
  maxConcurrentRequests?: number;
  timeoutSeconds?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  costPerRequest?: number;
  expirationDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
  projectsAssigned?: string[];
  isPublic?: boolean;
  requiresApproval?: boolean;
}

interface ModelFilters {
  typeId?: string;
  provider?: string;
  status?: ModelStatus;
  isPublic?: boolean;
  projectId?: string;
  tags?: string[];
}

class ModelService {
  /**
   * Validate model type ID
   */
  private async validateModelType(typeId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      throw new ApiError(400, 'Invalid model type ID format');
    }

    const modelType = await ModelType.findById(typeId);
    if (!modelType) {
      throw new ApiError(404, 'Model type not found');
    }

    if (!modelType.isActive) {
      throw new ApiError(400, 'Model type is not active');
    }
  }

  /**
   * Create a new model instance
   */
  async createModel(data: CreateModelDTO): Promise<IModel> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate model type
      await this.validateModelType(data.typeId);

      // Check for duplicate names
      const existingModel = await Model.findOne({ name: data.name });
      if (existingModel) {
        throw new ApiError(409, 'Model with this name already exists');
      }

      // Create model
      const model = new Model({
        name: data.name,
        typeId: data.typeId,
        version: data.version,
        provider: data.provider,
        endpoint: data.endpoint,
        priority: data.priority || 1,
        weight: data.weight || 1,
        maxRequestsPerMinute: data.maxRequestsPerMinute || 60,
        maxConcurrentRequests: data.maxConcurrentRequests || 10,
        timeoutSeconds: data.timeoutSeconds || 30,
        retryAttempts: data.retryAttempts || 3,
        retryDelayMs: data.retryDelayMs || 1000,
        costPerRequest: data.costPerRequest,
        expirationDate: data.expirationDate,
        tags: data.tags || [],
        metadata: data.metadata || {},
        projectsAssigned: data.projectsAssigned || [],
        isPublic: data.isPublic || false,
        requiresApproval: data.requiresApproval !== undefined ? data.requiresApproval : true,
        status: 'active',
      });

      // Encrypt API key before saving
      model.encryptApiKey(data.apiKey);
      await model.save({ session });

      // Create health status record
      await ModelHealthStatus.create([{
        modelId: model._id,
        lastCheckedAt: new Date(),
        latencyMs: 0,
        errorRate: 0,
        isHealthy: true,
      }], { session });

      // Create statistics record
      await ModelStatistics.create([{
        modelId: model._id,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgLatency: 0,
        monthlyUsage: 0,
        monthlyLimit: 10000,
      }], { session });

      await session.commitTransaction();

      return model;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get all models with optional filters
   */
  async getModels(filters?: ModelFilters): Promise<any[]> {
    const query: any = {};

    if (filters?.typeId) {
      query.typeId = filters.typeId;
    }

    if (filters?.provider) {
      query.provider = filters.provider;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.isPublic !== undefined) {
      query.isPublic = filters.isPublic;
    }

    if (filters?.projectId) {
      query.projectsAssigned = filters.projectId;
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    const models = await Model.find(query)
      .populate('typeId', 'key name description category')
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    // Fetch health status for each model
    const modelsWithHealth = await Promise.all(
      models.map(async (model: any) => {
        const healthStatus = await ModelHealthStatus.findOne({ modelId: model._id })
          .sort({ lastCheckedAt: -1 })
          .lean();
        
        return {
          ...model,
          healthStatus: healthStatus || null,
        };
      })
    );

    return modelsWithHealth as any[];
  }

  /**
   * Get a single model by ID
   */
  async getModelById(modelId: string, includeApiKey: boolean = false): Promise<IModel> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      throw new ApiError(400, 'Invalid model ID format');
    }

    let query = Model.findById(modelId).populate('typeId', 'key name description category');

    if (includeApiKey) {
      query = query.select('+apiKey +encryptionIV');
    }

    const model = await query;

    if (!model) {
      throw new ApiError(404, 'Model not found');
    }

    return model;
  }

  /**
   * Update a model
   */
  async updateModel(modelId: string, data: UpdateModelDTO): Promise<IModel> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      throw new ApiError(400, 'Invalid model ID format');
    }

    const model = await Model.findById(modelId).select('+apiKey +encryptionIV');
    if (!model) {
      throw new ApiError(404, 'Model not found');
    }

    // Update fields
    if (data.name) model.name = data.name;
    if (data.version) model.version = data.version;
    if (data.endpoint) model.endpoint = data.endpoint;
    if (data.status) model.status = data.status;
    if (data.priority !== undefined) model.priority = data.priority;
    if (data.weight !== undefined) model.weight = data.weight;
    if (data.maxRequestsPerMinute !== undefined) model.maxRequestsPerMinute = data.maxRequestsPerMinute;
    if (data.maxConcurrentRequests !== undefined) model.maxConcurrentRequests = data.maxConcurrentRequests;
    if (data.timeoutSeconds !== undefined) model.timeoutSeconds = data.timeoutSeconds;
    if (data.retryAttempts !== undefined) model.retryAttempts = data.retryAttempts;
    if (data.retryDelayMs !== undefined) model.retryDelayMs = data.retryDelayMs;
    if (data.costPerRequest !== undefined) model.costPerRequest = data.costPerRequest;
    if (data.expirationDate !== undefined) model.expirationDate = data.expirationDate;
    if (data.tags !== undefined) model.tags = data.tags;
    if (data.metadata !== undefined) model.metadata = data.metadata;
    if (data.projectsAssigned !== undefined) model.projectsAssigned = data.projectsAssigned.map(id => new mongoose.Types.ObjectId(id));
    if (data.isPublic !== undefined) model.isPublic = data.isPublic;
    if (data.requiresApproval !== undefined) model.requiresApproval = data.requiresApproval;

    // Re-encrypt API key if provided
    if (data.apiKey) {
      model.encryptApiKey(data.apiKey);
    }

    await model.save();

    return model.populate('typeId', 'key name description category');
  }

  /**
   * Delete a model
   */
  async deleteModel(modelId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      throw new ApiError(400, 'Invalid model ID format');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const model = await Model.findById(modelId);
      if (!model) {
        throw new ApiError(404, 'Model not found');
      }

      // Delete related records
      await Promise.all([
        Model.findByIdAndDelete(modelId, { session }),
        ModelHealthStatus.deleteOne({ modelId }, { session }),
        ModelStatistics.deleteOne({ modelId }, { session }),
      ]);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get model health status
   */
  async getModelHealth(modelId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      throw new ApiError(400, 'Invalid model ID format');
    }

    const model = await Model.findById(modelId).populate('typeId', 'key name');
    if (!model) {
      throw new ApiError(404, 'Model not found');
    }

    const health = await ModelHealthStatus.findOne({ modelId });
    const statistics = await ModelStatistics.findOne({ modelId });

    return {
      model: {
        _id: model._id,
        name: model.name,
        status: model.status,
        provider: model.provider,
        typeId: model.typeId,
      },
      health: health || null,
      statistics: statistics || null,
    };
  }

  /**
   * Get available models for a specific model type (with load balancing)
   */
  async getAvailableModelsForType(
    typeId: string,
    projectId?: string
  ): Promise<any[]> {
    const query: any = {
      typeId,
      status: 'active',
      $or: [
        { expirationDate: { $exists: false } },
        { expirationDate: { $gt: new Date() } },
      ],
    };

    // If projectId provided, filter models assigned to this project or public models
    if (projectId) {
      query.$and = [
        {
          $or: [
            { isPublic: true },
            { projectsAssigned: projectId },
          ],
        },
      ];
    } else {
      query.isPublic = true;
    }

    const models = await Model.find(query)
      .sort({ priority: -1, weight: -1 })
      .lean();

    return models as any[];
  }

  /**
   * Select best model using load balancing strategy
   */
  async selectModel(
    typeId: string,
    projectId?: string,
    strategy: 'round_robin' | 'least_connections' | 'weighted' | 'random' = 'weighted'
  ): Promise<IModel | null> {
    const models = await this.getAvailableModelsForType(typeId, projectId);

    if (models.length === 0) {
      return null;
    }

    // Simple weighted random selection based on priority and weight
    if (strategy === 'weighted') {
      const totalWeight = models.reduce((sum, model) => sum + (model.weight || 1) * (model.priority || 1), 0);
      let random = Math.random() * totalWeight;

      for (const model of models) {
        random -= (model.weight || 1) * (model.priority || 1);
        if (random <= 0) {
          return model;
        }
      }
    }

    // Random selection
    if (strategy === 'random') {
      return models[Math.floor(Math.random() * models.length)];
    }

    // Default: return highest priority model
    return models[0];
  }

  /**
   * Test model connection
   */
  async testModelConnection(modelId: string): Promise<{
    success: boolean;
    latencyMs?: number;
    error?: string;
  }> {
    const model = await this.getModelById(modelId, true);

    const startTime = Date.now();
    try {

        const res = await axios.post(
        model.endpoint,
        {
            model: model.version,
            messages: [{ role: "user", content: "ping" }]
        },
        {
            headers: {
            Authorization: `Bearer ${model.apiKey}`,
            "Content-Type": "application/json"
            },
            timeout: 5000,
            validateStatus: () => true,
        }
        );
        console.log(res.status);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const latencyMs = Date.now() - startTime;

    const isHealthy = [200, 401, 429].includes(res.status);
      await ModelHealthStatus.updateOne(
        { modelId },
        {
          lastCheckedAt: new Date(),
          latencyMs,
          isHealthy,
          lastError: isHealthy ? undefined : `HTTP ${res.status}`,
        }
      );

      await Model.updateOne(
        { _id: modelId },
        { lastHealthCheck: new Date(),
        status: isHealthy ? 'active' : 'unhealthy' }
      );

    if (!isHealthy) {
      return {
        success: false,
        latencyMs,
        error: `AI API returned HTTP ${res.status}`
      };
    }

    return { success: true, latencyMs };
    
    } catch (error: any) {
        const latencyMs = Date.now() - startTime;
      await ModelHealthStatus.updateOne(
        { modelId },
        {
        lastCheckedAt: new Date(),
        latencyMs,
        isHealthy: false,
        lastError: error.message,
        }
      );

      // Update model status
      await Model.updateOne(
        { _id: modelId },
        { lastHealthCheck: new Date(), status: 'unhealthy' }
      );

      return { success: false, error: error.message };
    }
  }
}

export const modelService = new ModelService();
export { CreateModelDTO, UpdateModelDTO, ModelFilters };
