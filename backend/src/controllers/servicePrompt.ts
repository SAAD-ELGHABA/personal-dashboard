import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ServicePrompt } from '../models/ServicePrompt';
import Service from '../models/Service';
import { Project } from '../models/Project';
import { ModelType } from '../models/ModelType';
import { ApiError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

/**
 * Create a new service prompt
 */
export const createServicePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { modelTypeId, name, promptText, isActive } = req.body;

    // Validate required fields
    if (!modelTypeId || !name || !promptText) {
      return res.status(400).json({
        success: false,
        message: 'modelTypeId, name, and promptText are required',
      });
    }

    // Verify service exists and user has access
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const project = await Project.findOne({
      _id: service.projectId,
      ownerId: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Verify model type exists
    const modelType = await ModelType.findById(modelTypeId);
    if (!modelType) {
      return res.status(404).json({
        success: false,
        message: 'Model type not found',
      });
    }

    // If setting as active, deactivate other prompts for this service-modelType combination
    if (isActive) {
      await ServicePrompt.updateMany(
        { serviceId, modelTypeId },
        { isActive: false }
      );
    }

    // Create service prompt
    const servicePrompt = new ServicePrompt({
      serviceId,
      modelTypeId,
      name,
      promptText,
      isActive: isActive !== undefined ? isActive : false,
    });

    await servicePrompt.save();

    const populatedPrompt = await ServicePrompt.findById(servicePrompt._id)
      .populate('modelTypeId', 'key name')
      .populate('serviceId', 'name type');

    res.status(201).json({
      success: true,
      data: { prompt: populatedPrompt },
      message: 'Service prompt created successfully',
    });
  } catch (error: any) {
    console.error('Error creating service prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating service prompt',
      error: error.message,
    });
  }
};

/**
 * Get all prompts for a service
 */
export const getServicePrompts = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { modelTypeId } = req.query;

    // Verify service exists and user has access
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const project = await Project.findOne({
      _id: service.projectId,
      ownerId: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Build query
    const query: any = { serviceId };
    if (modelTypeId) {
      query.modelTypeId = modelTypeId;
    }

    const prompts = await ServicePrompt.find(query)
      .populate('modelTypeId', 'key name description')
      .sort({ isActive: -1, createdAt: -1 });

    res.json({
      success: true,
      data: { prompts },
    });
  } catch (error: any) {
    console.error('Error fetching service prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service prompts',
      error: error.message,
    });
  }
};

/**
 * Get a specific service prompt by ID
 */
export const getServicePromptById = async (req: AuthRequest, res: Response) => {
  try {
    const { promptId } = req.params;

    const prompt = await ServicePrompt.findById(promptId)
      .populate('modelTypeId', 'key name description')
      .populate('serviceId', 'name type');

    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Service prompt not found',
      });
    }

    // Verify user has access
    const service = await Service.findById(prompt.serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const project = await Project.findOne({
      _id: service.projectId,
      ownerId: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    res.json({
      success: true,
      data: { prompt },
    });
  } catch (error: any) {
    console.error('Error fetching service prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service prompt',
      error: error.message,
    });
  }
};

/**
 * Update a service prompt
 */
export const updateServicePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const { promptId } = req.params;
    const { name, promptText, isActive } = req.body;

    const prompt = await ServicePrompt.findById(promptId);
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Service prompt not found',
      });
    }

    // Verify user has access
    const service = await Service.findById(prompt.serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const project = await Project.findOne({
      _id: service.projectId,
      ownerId: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // If setting as active, deactivate other prompts
    if (isActive === true && !prompt.isActive) {
      await ServicePrompt.updateMany(
        {
          serviceId: prompt.serviceId,
          modelTypeId: prompt.modelTypeId,
          _id: { $ne: promptId },
        },
        { isActive: false }
      );
    }

    // Update prompt
    if (name !== undefined) prompt.name = name;
    if (promptText !== undefined) prompt.promptText = promptText;
    if (isActive !== undefined) prompt.isActive = isActive;

    await prompt.save();

    const updatedPrompt = await ServicePrompt.findById(promptId)
      .populate('modelTypeId', 'key name')
      .populate('serviceId', 'name type');

    res.json({
      success: true,
      data: { prompt: updatedPrompt },
      message: 'Service prompt updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating service prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating service prompt',
      error: error.message,
    });
  }
};

/**
 * Set a prompt as active (deactivates others for same service-modelType)
 */
export const setActivePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const { promptId } = req.params;

    const prompt = await ServicePrompt.findById(promptId);
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Service prompt not found',
      });
    }

    // Verify user has access
    const service = await Service.findById(prompt.serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const project = await Project.findOne({
      _id: service.projectId,
      ownerId: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Deactivate all other prompts for this service-modelType combination
    await ServicePrompt.updateMany(
      {
        serviceId: prompt.serviceId,
        modelTypeId: prompt.modelTypeId,
        _id: { $ne: promptId },
      },
      { isActive: false }
    );

    // Activate this prompt
    prompt.isActive = true;
    await prompt.save();

    const updatedPrompt = await ServicePrompt.findById(promptId)
      .populate('modelTypeId', 'key name')
      .populate('serviceId', 'name type');

    res.json({
      success: true,
      data: { prompt: updatedPrompt },
      message: 'Prompt set as active successfully',
    });
  } catch (error: any) {
    console.error('Error setting active prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting active prompt',
      error: error.message,
    });
  }
};

/**
 * Delete a service prompt
 */
export const deleteServicePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const { promptId } = req.params;

    const prompt = await ServicePrompt.findById(promptId);
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Service prompt not found',
      });
    }

    // Verify user has access
    const service = await Service.findById(prompt.serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const project = await Project.findOne({
      _id: service.projectId,
      ownerId: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    await ServicePrompt.deleteOne({ _id: promptId });

    res.json({
      success: true,
      message: 'Service prompt deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting service prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting service prompt',
      error: error.message,
    });
  }
};
