import mongoose, { Document, Schema } from 'mongoose';

interface IModelStatistics extends Document {
  modelId: mongoose.Types.ObjectId;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatency: number;
  lastUsedAt?: Date;
  monthlyUsage: number;
  monthlyLimit: number;
}

const modelStatisticsSchema = new Schema<IModelStatistics>(
  {
    modelId: {
      type: Schema.Types.ObjectId,
      ref: 'Model',
      required: true,
      unique: true,
      index: true,
    },
    totalRequests: {
      type: Number,
      required: true,
      default: 0,
    },
    successfulRequests: {
      type: Number,
      required: true,
      default: 0,
    },
    failedRequests: {
      type: Number,
      required: true,
      default: 0,
    },
    avgLatency: {
      type: Number,
      required: true,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
    },
    monthlyUsage: {
      type: Number,
      required: true,
      default: 0,
    },
    monthlyLimit: {
      type: Number,
      required: true,
      default: 10000,
    },
  },
  { timestamps: true }
);

const ModelStatistics = mongoose.model<IModelStatistics>(
  'ModelStatistics',
  modelStatisticsSchema
);

export { ModelStatistics, IModelStatistics };
