import { Model } from '../models/Model';
import { ModelHealthStatus } from '../models/ModelHealthStatus';
import { ModelStatistics } from '../models/ModelStatistics';
import { ApiError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

interface ModelScore {
  modelId: mongoose.Types.ObjectId;
  model: any;
  score: number;
  metrics: {
    healthScore: number;
    performanceScore: number;
    availabilityScore: number;
    costScore: number;
  };
}

interface CachedModel {
  model: any;
  timestamp: number;
  score: number;
}

/**
 * In-memory cache for selected models with TTL
 * Key format: "projectId:modelTypeId"
 */
class ModelCache {
  private cache: Map<string, CachedModel> = new Map();
  private readonly TTL = 60 * 60 * 1000; // 1 hour in milliseconds

  set(projectId: string, modelTypeId: string, model: any, score: number): void {
    const key = `${projectId}:${modelTypeId}`;
    this.cache.set(key, {
      model,
      timestamp: Date.now(),
      score,
    });
    console.log(`[ModelCache] Cached model for key: ${key}, score: ${score.toFixed(2)}`);
  }

  get(projectId: string, modelTypeId: string): any | null {
    const key = `${projectId}:${modelTypeId}`;
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    const age = Date.now() - cached.timestamp;
    if (age > this.TTL) {
      console.log(`[ModelCache] Cache expired for key: ${key}, age: ${Math.round(age / 1000)}s`);
      this.cache.delete(key);
      return null;
    }

    const remainingTime = Math.round((this.TTL - age) / 1000);
    console.log(`[ModelCache] Cache hit for key: ${key}, remaining TTL: ${remainingTime}s`);
    return cached.model;
  }

  clear(projectId?: string, modelTypeId?: string): void {
    if (projectId && modelTypeId) {
      const key = `${projectId}:${modelTypeId}`;
      this.cache.delete(key);
      console.log(`[ModelCache] Cleared cache for key: ${key}`);
    } else {
      this.cache.clear();
      console.log('[ModelCache] Cleared all cache');
    }
  }

  getStats(): { size: number; entries: Array<{ key: string; age: number; score: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: Math.round((Date.now() - value.timestamp) / 1000),
      score: value.score,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

class ModelLoadBalancer {
  private cache = new ModelCache();

  /**
   * Get the best available model for a given model type with intelligent load balancing
   * Uses health-based scoring and caching for 1 hour
   */
  async getBestModel(
    modelTypeId: mongoose.Types.ObjectId,
    projectId: mongoose.Types.ObjectId
  ): Promise<any> {
    const projectIdStr = projectId.toString();
    const modelTypeIdStr = modelTypeId.toString();

    // Check cache first
    const cachedModel = this.cache.get(projectIdStr, modelTypeIdStr);
    if (cachedModel) {
      return cachedModel;
    }

    console.log(`[LoadBalancer] No cache hit, evaluating models for type: ${modelTypeIdStr}`);

    // Get all active models of this type that the project has access to
    const models = await Model.find({
      typeId: modelTypeId,
      status: 'active',
      $or: [
        { projectsAssigned: projectId },
        { isPublic: true },
      ],
    }).select('+apiKey +encryptionIV');

    if (!models || models.length === 0) {
      throw new ApiError(
        503,
        `No available models found for this model type. Please configure a model in the dashboard.`
      );
    }

    console.log(`[LoadBalancer] Found ${models.length} candidate models`);

    // Score all models in parallel
    const scoredModels = await Promise.all(
      models.map(model => this.scoreModel(model))
    );

    // Sort by score (highest first)
    scoredModels.sort((a, b) => b.score - a.score);

    // Log top 3 models for transparency
    console.log('[LoadBalancer] Top 3 models by score:');
    scoredModels.slice(0, 3).forEach((scored, idx) => {
      console.log(`  ${idx + 1}. ${scored.model.name} (${scored.model.provider})`);
      console.log(`     Total Score: ${scored.score.toFixed(2)}`);
      console.log(`     - Health: ${scored.metrics.healthScore.toFixed(2)}`);
      console.log(`     - Performance: ${scored.metrics.performanceScore.toFixed(2)}`);
      console.log(`     - Availability: ${scored.metrics.availabilityScore.toFixed(2)}`);
      console.log(`     - Cost: ${scored.metrics.costScore.toFixed(2)}`);
    });

    // Select the best model
    const bestModel = scoredModels[0];

    // Cache the best model for 1 hour
    this.cache.set(projectIdStr, modelTypeIdStr, bestModel.model, bestModel.score);

    return bestModel.model;
  }

  /**
   * Score a model based on multiple health and performance criteria
   */
  private async scoreModel(model: any): Promise<ModelScore> {
    const [healthStatus, statistics] = await Promise.all([
      ModelHealthStatus.findOne({ modelId: model._id }),
      ModelStatistics.findOne({ modelId: model._id }),
    ]);

    // Calculate individual metric scores (0-100)
    const healthScore = this.calculateHealthScore(healthStatus, model);
    const performanceScore = this.calculatePerformanceScore(statistics, healthStatus);
    const availabilityScore = this.calculateAvailabilityScore(statistics, model);
    const costScore = this.calculateCostScore(model, statistics);

    // Weighted total score
    // Weights: Health=35%, Performance=30%, Availability=25%, Cost=10%
    const totalScore =
      healthScore * 0.35 +
      performanceScore * 0.30 +
      availabilityScore * 0.25 +
      costScore * 0.10;

    return {
      modelId: model._id,
      model,
      score: totalScore,
      metrics: {
        healthScore,
        performanceScore,
        availabilityScore,
        costScore,
      },
    };
  }

  /**
   * Calculate health score based on health status data
   */
  private calculateHealthScore(healthStatus: any | null, model: any): number {
    if (!healthStatus) {
      // No health data yet, give moderate score if model is active
      return model.status === 'active' ? 60 : 0;
    }

    let score = 0;

    // Is the model healthy? (40 points)
    if (healthStatus.isHealthy) {
      score += 40;
    }

    // Error rate score (30 points)
    // Lower error rate = higher score
    const errorRateScore = Math.max(0, 30 - healthStatus.errorRate * 0.3);
    score += errorRateScore;

    // Latency score (30 points)
    // Lower latency = higher score
    // Excellent: <500ms, Good: <1000ms, Fair: <2000ms, Poor: >2000ms
    let latencyScore = 0;
    if (healthStatus.latencyMs < 500) {
      latencyScore = 30;
    } else if (healthStatus.latencyMs < 1000) {
      latencyScore = 25;
    } else if (healthStatus.latencyMs < 2000) {
      latencyScore = 15;
    } else if (healthStatus.latencyMs < 5000) {
      latencyScore = 5;
    }
    score += latencyScore;

    // Recent health check bonus (10 points if checked within last 5 minutes)
    const timeSinceCheck = Date.now() - healthStatus.lastCheckedAt.getTime();
    if (timeSinceCheck < 5 * 60 * 1000) {
      score += 10;
    } else if (timeSinceCheck < 15 * 60 * 1000) {
      score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate performance score based on statistics
   */
  private calculatePerformanceScore(statistics: any | null, healthStatus: any | null): number {
    if (!statistics) {
      return 50; // Default moderate score for new models
    }

    let score = 0;

    // Success rate score (50 points)
    if (statistics.totalRequests > 0) {
      const successRate = (statistics.successfulRequests / statistics.totalRequests) * 100;
      score += successRate * 0.5;
    } else {
      score += 25; // New model, no data yet
    }

    // Average latency score (30 points)
    if (statistics.avgLatency > 0) {
      let latencyScore = 0;
      if (statistics.avgLatency < 500) {
        latencyScore = 30;
      } else if (statistics.avgLatency < 1000) {
        latencyScore = 25;
      } else if (statistics.avgLatency < 2000) {
        latencyScore = 15;
      } else if (statistics.avgLatency < 5000) {
        latencyScore = 5;
      }
      score += latencyScore;
    } else {
      score += 15; // No latency data
    }

    // Recent usage bonus (20 points)
    if (statistics.lastUsedAt) {
      const timeSinceUse = Date.now() - statistics.lastUsedAt.getTime();
      if (timeSinceUse < 60 * 60 * 1000) { // Within last hour
        score += 20;
      } else if (timeSinceUse < 24 * 60 * 60 * 1000) { // Within last day
        score += 15;
      } else if (timeSinceUse < 7 * 24 * 60 * 60 * 1000) { // Within last week
        score += 10;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate availability score based on rate limits and current usage
   */
  private calculateAvailabilityScore(statistics: any | null, model: any): number {
    let score = 0;

    // Base score from model priority and weight (40 points)
    const priorityScore = (model.priority / 10) * 20; // Max priority is 10
    const weightScore = (model.weight / 100) * 20; // Max weight is 100
    score += priorityScore + weightScore;

    // Monthly usage quota score (40 points)
    if (statistics && statistics.monthlyLimit > 0) {
      const usagePercentage = (statistics.monthlyUsage / statistics.monthlyLimit) * 100;
      
      if (usagePercentage < 70) {
        score += 40; // Plenty of quota available
      } else if (usagePercentage < 85) {
        score += 30;
      } else if (usagePercentage < 95) {
        score += 15;
      } else {
        score += 5; // Almost at limit
      }
    } else {
      score += 20; // No quota tracking
    }

    // Rate limit headroom score (20 points)
    if (model.maxRequestsPerMinute) {
      // Higher limit = higher score
      const rpmScore = Math.min(20, (model.maxRequestsPerMinute / 100) * 10);
      score += rpmScore;
    } else {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate cost score (lower cost = higher score)
   */
  private calculateCostScore(model: any, statistics: any | null): number {
    if (!model.costPerRequest || model.costPerRequest === 0) {
      return 100; // Free models get highest cost score
    }

    // Score inversely proportional to cost
    // $0.001 per request = 90 points
    // $0.01 per request = 50 points
    // $0.1 per request = 10 points
    let score = 100;

    if (model.costPerRequest < 0.001) {
      score = 100;
    } else if (model.costPerRequest < 0.01) {
      score = 90 - (model.costPerRequest - 0.001) * 4000; // Linear scale
    } else if (model.costPerRequest < 0.1) {
      score = 50 - (model.costPerRequest - 0.01) * 400; // Linear scale
    } else {
      score = 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Clear cache for a specific model type or all cache
   */
  clearCache(projectId?: string, modelTypeId?: string): void {
    this.cache.clear(projectId, modelTypeId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return this.cache.getStats();
  }

  /**
   * Force re-evaluation of models without caching
   * Useful for testing or manual refresh
   */
  async evaluateModels(
    modelTypeId: mongoose.Types.ObjectId,
    projectId: mongoose.Types.ObjectId
  ): Promise<ModelScore[]> {
    const models = await Model.find({
      typeId: modelTypeId,
      status: 'active',
      $or: [
        { projectsAssigned: projectId },
        { isPublic: true },
      ],
    }).select('+apiKey +encryptionIV');

    const scoredModels = await Promise.all(
      models.map(model => this.scoreModel(model))
    );

    scoredModels.sort((a, b) => b.score - a.score);

    return scoredModels;
  }
}

// Export singleton instance
export const modelLoadBalancer = new ModelLoadBalancer();
