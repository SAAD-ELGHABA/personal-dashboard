import mongoose, { Document, Schema } from 'mongoose';

export type ServiceType = 'FRONTEND' | 'API' | 'AI' | 'WORKER' | 'GATEWAY';

interface IService extends Document {
  projectId: mongoose.Types.ObjectId;
  name: string;
  type: ServiceType;
  baseUrl: string;
  probePath: string;
  expectedHttpStatus: number;
  timeoutMs: number;
  isCritical: boolean;
  isPublic: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['FRONTEND', 'API', 'AI', 'WORKER', 'GATEWAY'],
      required: true,
    },
    baseUrl: {
      type: String,
      required: true,
      trim: true,
    },
    probePath: {
      type: String,
      default: '/health',
      trim: true,
    },
    expectedHttpStatus: {
      type: Number,
      default: 200,
    },
    timeoutMs: {
      type: Number,
      default: 5000,
    },
    isCritical: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying services by project
serviceSchema.index({ projectId: 1, type: 1 });
serviceSchema.index({ projectId: 1, isActive: 1 });

const Service = mongoose.model<IService>('Service', serviceSchema);

export default Service;
export type { IService };
