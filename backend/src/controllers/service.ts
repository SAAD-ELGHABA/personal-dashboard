import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Service from '../models/Service';
import ServiceHealthCheck from '../models/ServiceHealthCheck';
import ServiceAvailabilityStats from '../models/ServiceAvailabilityStats';
import ServicePerformanceMetrics from '../models/ServicePerformanceMetrics';
import { MonitoringTask } from '../models/MonitoringTask';
import { Project } from '../models/Project';
import mongoose from 'mongoose';

// Create a new service for a project
export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const {
      projectId,
      name,
      type,
      baseUrl,
      probePath,
      expectedHttpStatus,
      timeoutMs,
      isCritical,
      isPublic,
      isActive,
    } = req.body;

    // Verify project exists and user has access
    const project = await Project.findOne({
      _id: projectId,
      ownerId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Create service
    const service = new Service({
      projectId,
      name,
      type,
      baseUrl,
      probePath: probePath || '/health',
      expectedHttpStatus: expectedHttpStatus || 200,
      timeoutMs: timeoutMs || 5000,
      isCritical: isCritical !== undefined ? isCritical : true,
      isPublic: isPublic !== undefined ? isPublic : false,
      isActive: isActive !== undefined ? isActive : true,
    });

    await service.save();

    // Create default monitoring tasks for the service
    if (service.isActive) {
      const defaultTasks = [
        { type: 'HEALTH', intervalSeconds: 300 }, // Every 5 minutes
        { type: 'PERFORMANCE', intervalSeconds: 600 }, // Every 10 minutes
        { type: 'SSL', intervalSeconds: 86400 }, // Daily
        { type: 'DNS', intervalSeconds: 3600 }, // Hourly
      ];

      const now = new Date();
      const tasks = defaultTasks.map((task) => ({
        serviceId: service._id,
        type: task.type,
        intervalSeconds: task.intervalSeconds,
        nextRunAt: now,
        isActive: true,
      }));

      await MonitoringTask.insertMany(tasks);
    }

    res.status(201).json(service);
  } catch (error: any) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Error creating service', error: error.message });
  }
};

// Get all services for a project
export const getProjectServices = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    // Verify project access
    const project = await Project.findOne({
      _id: projectId,
      ownerId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    const services = await Service.find({ projectId }).sort({ createdAt: -1 });

    // Get latest health check for each service
    const servicesWithHealth = await Promise.all(
      services.map(async (service) => {
        const latestHealth = await ServiceHealthCheck.findOne({
          serviceId: service._id,
        }).sort({ checkedAt: -1 });

        return {
          ...service.toObject(),
          latestHealth: latestHealth || null,
        };
      })
    );

    res.json(servicesWithHealth);
  } catch (error: any) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
};

// Get a single service by ID
export const getServiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId).populate('projectId');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Verify user has access to the project
    const project = await Project.findOne({
      _id: service.projectId,
      ownerId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({ message: 'Access denied' });
    }

    // Get latest metrics
    const [latestHealth, availabilityStats, latestPerformance] = await Promise.all([
      ServiceHealthCheck.findOne({ serviceId: service._id }).sort({ checkedAt: -1 }),
      ServiceAvailabilityStats.find({ serviceId: service._id }),
      ServicePerformanceMetrics.findOne({ serviceId: service._id }).sort({
        calculatedAt: -1,
      }),
    ]);

    res.json({
      ...service.toObject(),
      latestHealth,
      availabilityStats,
      latestPerformance,
    });
  } catch (error: any) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Error fetching service', error: error.message });
  }
};

// Update a service
export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.params;
    const updates = req.body;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Verify user has access to the project
    const project = await Project.findOne({
      _id: service.projectId,
      ownerId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({ message: 'Access denied' });
    }

    // Update service
    Object.assign(service, updates);
    await service.save();

    res.json(service);
  } catch (error: any) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Error updating service', error: error.message });
  }
};

// Delete a service
export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Verify user has access to the project
    const project = await Project.findOne({
      _id: service.projectId,
      ownerId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({ message: 'Access denied' });
    }

    // Delete related monitoring tasks and health data
    await Promise.all([
      MonitoringTask.deleteMany({ serviceId: service._id }),
      ServiceHealthCheck.deleteMany({ serviceId: service._id }),
      ServiceAvailabilityStats.deleteMany({ serviceId: service._id }),
      ServicePerformanceMetrics.deleteMany({ serviceId: service._id }),
    ]);

    await service.deleteOne();

    res.json({ message: 'Service deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Error deleting service', error: error.message });
  }
};

// Get service health history
export const getServiceHealthHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { limit = '100' } = req.query;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Verify access
    const project = await Project.findOne({
      _id: service.projectId,
      ownerId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({ message: 'Access denied' });
    }

    const healthHistory = await ServiceHealthCheck.find({ serviceId })
      .sort({ checkedAt: -1 })
      .limit(parseInt(limit as string));

    res.json(healthHistory);
  } catch (error: any) {
    console.error('Error fetching health history:', error);
    res
      .status(500)
      .json({ message: 'Error fetching health history', error: error.message });
  }
};

// Get service performance history
export const getServicePerformanceHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { limit = '100' } = req.query;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Verify access
    const project = await Project.findOne({
      _id: service.projectId,
      ownerId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({ message: 'Access denied' });
    }

    const performanceHistory = await ServicePerformanceMetrics.find({ serviceId })
      .sort({ calculatedAt: -1 })
      .limit(parseInt(limit as string));

    res.json(performanceHistory);
  } catch (error: any) {
    console.error('Error fetching performance history:', error);
    res
      .status(500)
      .json({ message: 'Error fetching performance history', error: error.message });
  }
};
