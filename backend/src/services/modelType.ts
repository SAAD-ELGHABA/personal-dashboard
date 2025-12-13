import { ModelType, IModelType } from '../models/ModelType';
import { Model } from '../models/Model';
import { ApiError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

interface CreateModelTypeDTO {
  key: string;
  name: string;
  description: string;
  category: 'text' | 'image' | 'audio' | 'video' | 'embedding' | 'multimodal' | 'tool';
  icon?: string;
  capabilities?: string[];
  requiresAuth?: boolean;
  defaultMaxTokens?: number;
  defaultTemperature?: number;
  order?: number;
}

interface UpdateModelTypeDTO {
  name?: string;
  description?: string;
  category?: 'text' | 'image' | 'audio' | 'video' | 'embedding' | 'multimodal' | 'tool';
  icon?: string;
  capabilities?: string[];
  isActive?: boolean;
  requiresAuth?: boolean;
  defaultMaxTokens?: number;
  defaultTemperature?: number;
  order?: number;
}

class ModelTypeService {
  /**
   * Create a new model type (Admin only)
   */
  async createModelType(data: CreateModelTypeDTO): Promise<IModelType> {
    // Validate key format
    const keyRegex = /^[a-z0-9_-]+$/;
    if (!keyRegex.test(data.key)) {
      throw new ApiError(
        400,
        'Model type key must contain only lowercase letters, numbers, hyphens, and underscores'
      );
    }

    // Check for duplicate key
    const existingType = await ModelType.findOne({ key: data.key.toLowerCase() });
    if (existingType) {
      throw new ApiError(409, 'Model type with this key already exists');
    }

    const modelType = await ModelType.create({
      key: data.key.toLowerCase(),
      name: data.name,
      description: data.description,
      category: data.category,
      icon: data.icon,
      capabilities: data.capabilities || [],
      isActive: true,
      requiresAuth: data.requiresAuth !== undefined ? data.requiresAuth : true,
      defaultMaxTokens: data.defaultMaxTokens,
      defaultTemperature: data.defaultTemperature || 0.7,
      order: data.order || 0,
    });

    return modelType;
  }

  /**
   * Get all model types
   */
  async getModelTypes(includeInactive: boolean = false): Promise<IModelType[]> {
    const query: any = {};
    
    if (!includeInactive) {
      query.isActive = true;
    }

    const modelTypes = await ModelType.find(query).sort({ order: 1, name: 1 });
    return modelTypes;
  }

  /**
   * Get model types by category
   */
  async getModelTypesByCategory(
    category: string,
    includeInactive: boolean = false
  ): Promise<IModelType[]> {
    const query: any = { category };
    
    if (!includeInactive) {
      query.isActive = true;
    }

    const modelTypes = await ModelType.find(query).sort({ order: 1, name: 1 });
    return modelTypes;
  }

  /**
   * Get a single model type by ID or key
   */
  async getModelType(identifier: string): Promise<IModelType> {
    let modelType: IModelType | null;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      modelType = await ModelType.findById(identifier);
    } else {
      modelType = await ModelType.findOne({ key: identifier.toLowerCase() });
    }

    if (!modelType) {
      throw new ApiError(404, 'Model type not found');
    }

    return modelType;
  }

  /**
   * Update a model type
   */
  async updateModelType(
    identifier: string,
    data: UpdateModelTypeDTO
  ): Promise<IModelType> {
    const modelType = await this.getModelType(identifier);

    // Update fields
    if (data.name !== undefined) modelType.name = data.name;
    if (data.description !== undefined) modelType.description = data.description;
    if (data.category !== undefined) modelType.category = data.category;
    if (data.icon !== undefined) modelType.icon = data.icon;
    if (data.capabilities !== undefined) modelType.capabilities = data.capabilities;
    if (data.isActive !== undefined) modelType.isActive = data.isActive;
    if (data.requiresAuth !== undefined) modelType.requiresAuth = data.requiresAuth;
    if (data.defaultMaxTokens !== undefined) modelType.defaultMaxTokens = data.defaultMaxTokens;
    if (data.defaultTemperature !== undefined) modelType.defaultTemperature = data.defaultTemperature;
    if (data.order !== undefined) modelType.order = data.order;

    await modelType.save();
    return modelType;
  }

  /**
   * Delete a model type (only if no models are using it)
   */
  async deleteModelType(identifier: string): Promise<void> {
    const modelType = await this.getModelType(identifier);

    // Check if any models are using this type
    const modelsCount = await Model.countDocuments({ typeId: modelType._id });
    if (modelsCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete model type: ${modelsCount} model(s) are still using it`
      );
    }

    await ModelType.findByIdAndDelete(modelType._id);
  }

  /**
   * Get model type with model count
   */
  async getModelTypeWithStats(identifier: string): Promise<{
    modelType: IModelType;
    stats: {
      totalModels: number;
      activeModels: number;
      inactiveModels: number;
      unhealthyModels: number;
    };
  }> {
    const modelType = await this.getModelType(identifier);

    const [totalModels, activeModels, inactiveModels, unhealthyModels] = await Promise.all([
      Model.countDocuments({ typeId: modelType._id }),
      Model.countDocuments({ typeId: modelType._id, status: 'active' }),
      Model.countDocuments({ typeId: modelType._id, status: 'inactive' }),
      Model.countDocuments({ typeId: modelType._id, status: 'unhealthy' }),
    ]);

    return {
      modelType,
      stats: {
        totalModels,
        activeModels,
        inactiveModels,
        unhealthyModels,
      },
    };
  }

  /**
   * Bulk update model type order
   */
  async updateModelTypeOrder(orders: { id: string; order: number }[]): Promise<void> {
    const bulkOps: any = orders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { order } },
      },
    }));

    await ModelType.bulkWrite(bulkOps);
  }
}

export const modelTypeService = new ModelTypeService();
export { CreateModelTypeDTO, UpdateModelTypeDTO };
