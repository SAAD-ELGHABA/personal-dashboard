import crypto from 'crypto';
import { Project, IProject } from '../models/Project';
import { ProjectSettings, IProjectSettings } from '../models/ProjectSettings';
import { ApiToken } from '../models/ApiToken';
import { ModelType } from '../models/ModelType';
import { ApiError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

interface CreateProjectDTO {
  name: string;
  description?: string;
  modelTypesAllowed: string[];
  ownerId: string;
  maxRequestSize?: number;
}

interface UpdateProjectDTO {
  name?: string;
  description?: string;
  modelTypesAllowed?: string[];
}

interface UpdateProjectSettingsDTO {
  allowedModelTypes?: string[];
  maxRequestSize?: number;
  isActive?: boolean;
}

class ProjectService {
  /**
   * Hash API token for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate a secure API token
   */
  private generateApiToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate model type IDs
   */
  private async validateModelTypes(modelTypeIds: string[]): Promise<void> {
    if (!modelTypeIds || modelTypeIds.length === 0) {
      throw new ApiError(400, 'At least one model type must be specified');
    }

    const validIds = modelTypeIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length !== modelTypeIds.length) {
      throw new ApiError(400, 'Invalid model type ID format');
    }

    const modelTypes = await ModelType.find({ _id: { $in: validIds } });
    if (modelTypes.length !== validIds.length) {
      throw new ApiError(400, 'One or more model types not found');
    }
  }

  /**
   * Create a new project with API token and default settings
   */
  async createProject(data: CreateProjectDTO): Promise<{
    project: IProject;
    apiToken: string;
    settings: IProjectSettings;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate model types
      await this.validateModelTypes(data.modelTypesAllowed);

      // Check if project name already exists for this owner
      const existingProject = await Project.findOne({
        name: data.name,
        ownerId: data.ownerId,
      });

      if (existingProject) {
        throw new ApiError(409, 'Project with this name already exists');
      }

      // Generate API token
      const rawToken = this.generateApiToken();
      const hashedToken = this.hashToken(rawToken);

      // Create API token document
      const apiTokenDoc = await ApiToken.create(
        [
          {
            name: `${data.name} - API Token`,
            token: hashedToken,
            scopes: ['read', 'write'],
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            projectId: new mongoose.Types.ObjectId(), // Temporary, will be updated
            isActive: true,
          },
        ],
        { session }
      );

      // Create project
      const project = await Project.create(
        [
          {
            name: data.name,
            description: data.description || '',
            apiToken: apiTokenDoc[0]._id,
            modelTypesAllowed: data.modelTypesAllowed,
            ownerId: data.ownerId,
          },
        ],
        { session }
      );

      // Update API token with correct projectId
      await ApiToken.updateOne(
        { _id: apiTokenDoc[0]._id },
        { projectId: project[0]._id },
        { session }
      );

      // Create default project settings
      const settings = await ProjectSettings.create(
        [
          {
            projectId: project[0]._id,
            allowedModelTypes: data.modelTypesAllowed,
            maxRequestSize: data.maxRequestSize || 1048576, // 1MB default
            isActive: true,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      return {
        project: project[0],
        apiToken: rawToken, // Return raw token only once
        settings: settings[0],
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get all projects for a user
   */
  async getProjectsByOwner(
    ownerId: string,
    includeInactive: boolean = false
  ): Promise<IProject[]> {
    const query: any = { ownerId };

    const projects = await Project.find(query)
      .populate('modelTypesAllowed', 'key name')
      .populate('apiToken', '-token')
      .sort({ createdAt: -1 });

    // Filter by active status if needed
    if (!includeInactive) {
      const projectIds = projects.map((p) => p._id);
      const activeSettings = await ProjectSettings.find({
        projectId: { $in: projectIds },
        isActive: true,
      });
      const activeProjectIds = activeSettings.map((s) =>
        s.projectId.toString()
      );
      return projects.filter((p) => activeProjectIds.includes(p._id.toString()));
    }

    return projects;
  }

  /**
   * Get a single project by ID
   */
  async getProjectById(
    projectId: string,
    ownerId: string
  ): Promise<{
    project: IProject;
    settings: IProjectSettings;
  }> {
    const project = await Project.findOne({
      _id: projectId,
      ownerId,
    })
      .populate('modelTypesAllowed', 'key name description')
      .populate('apiToken', '-token');

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const settings = await ProjectSettings.findOne({ projectId });

    if (!settings) {
      throw new ApiError(404, 'Project settings not found');
    }

    return { project, settings };
  }

  /**
   * Update project details
   */
  async updateProject(
    projectId: string,
    ownerId: string,
    data: UpdateProjectDTO
  ): Promise<IProject> {
    // Validate model types if provided
    if (data.modelTypesAllowed) {
      await this.validateModelTypes(data.modelTypesAllowed);
    }

    const project = await Project.findOneAndUpdate(
      { _id: projectId, ownerId },
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('modelTypesAllowed', 'key name')
      .populate('apiToken', '-token');

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Update settings if model types changed
    if (data.modelTypesAllowed) {
      await ProjectSettings.updateOne(
        { projectId },
        { allowedModelTypes: data.modelTypesAllowed }
      );
    }

    return project;
  }

  /**
   * Update project settings
   */
  async updateProjectSettings(
    projectId: string,
    ownerId: string,
    data: UpdateProjectSettingsDTO
  ): Promise<IProjectSettings> {
    // Verify project ownership
    const project = await Project.findOne({ _id: projectId, ownerId });
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Validate model types if provided
    if (data.allowedModelTypes) {
      await this.validateModelTypes(data.allowedModelTypes);
    }

    const settings = await ProjectSettings.findOneAndUpdate(
      { projectId },
      { $set: data },
      { new: true, runValidators: true }
    ).populate('allowedModelTypes', 'key name description');

    if (!settings) {
      throw new ApiError(404, 'Project settings not found');
    }

    return settings;
  }

  /**
   * Delete a project and all related data
   */
  async deleteProject(projectId: string, ownerId: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const project = await Project.findOne({ _id: projectId, ownerId });
      if (!project) {
        throw new ApiError(404, 'Project not found');
      }

      // Delete API token
      await ApiToken.deleteOne({ _id: project.apiToken }, { session });

      // Delete project settings
      await ProjectSettings.deleteOne({ projectId }, { session });

      // Delete project
      await Project.deleteOne({ _id: projectId }, { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Regenerate API token for a project
   */
  async regenerateApiToken(
    projectId: string,
    ownerId: string
  ): Promise<string> {
    const project = await Project.findOne({ _id: projectId, ownerId });
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Generate new token
    const rawToken = this.generateApiToken();
    const hashedToken = this.hashToken(rawToken);

    // Update API token
    await ApiToken.updateOne(
      { _id: project.apiToken },
      { token: hashedToken, lastUsedAt: undefined }
    );

    return rawToken;
  }

  /**
   * Validate project access for API requests
   */
  async validateProjectAccess(
    apiToken: string,
    modelTypeKey?: string
  ): Promise<{
    project: IProject;
    settings: IProjectSettings;
  }> {
    const hashedToken = this.hashToken(apiToken);

    const tokenDoc = await ApiToken.findOne({
      token: hashedToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      throw new ApiError(401, 'Invalid or expired API token');
    }

    const project = await Project.findById(tokenDoc.projectId).populate(
      'modelTypesAllowed',
      'key name'
    );

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const settings = await ProjectSettings.findOne({
      projectId: project._id,
    }).populate('allowedModelTypes', 'key name');

    if (!settings) {
      throw new ApiError(404, 'Project settings not found');
    }

    if (!settings.isActive) {
      throw new ApiError(403, 'Project is currently inactive');
    }

    // Validate model type if provided
    if (modelTypeKey) {
      const allowedKeys = (settings.allowedModelTypes as any[]).map(
        (mt) => mt.key
      );
      if (!allowedKeys.includes(modelTypeKey)) {
        throw new ApiError(403, 'Model type not allowed for this project');
      }
    }

    // Update last used timestamp
    await ApiToken.updateOne(
      { _id: tokenDoc._id },
      { lastUsedAt: new Date() }
    );

    return { project, settings };
  }

  /**
   * Get available model types
   */
  async getAvailableModelTypes() {
    return await ModelType.find().sort({ name: 1 });
  }
}

export const projectService = new ProjectService();
