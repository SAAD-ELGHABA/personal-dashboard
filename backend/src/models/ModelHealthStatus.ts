import mongoose, { Document, Schema } from 'mongoose';

interface IModelHealthStatus extends Document {
  modelId: mongoose.Types.ObjectId;
  lastCheckedAt: Date;
  latencyMs: number;
  errorRate: number;
  isHealthy: boolean;
  lastError?: string;
  cpuUsage?: number;
  memoryUsage?: number;
}

const modelHealthStatusSchema = new Schema<IModelHealthStatus>(
  {
    modelId: {
      type: Schema.Types.ObjectId,
      ref: 'Model',
      required: true,
      unique: true,
      index: true,
    },
    lastCheckedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    latencyMs: {
      type: Number,
      required: true,
      default: 0,
    },
    errorRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    isHealthy: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    lastError: {
      type: String,
    },
    cpuUsage: {
      type: Number,
      min: 0,
      max: 100,
    },
    memoryUsage: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

const ModelHealthStatus = mongoose.model<IModelHealthStatus>(
  'ModelHealthStatus',
  modelHealthStatusSchema
);

export { ModelHealthStatus, IModelHealthStatus };
