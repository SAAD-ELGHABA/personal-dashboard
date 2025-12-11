import mongoose, { Document, Schema } from 'mongoose';

interface IProjectUsageStatistics extends Document {
  projectId: mongoose.Types.ObjectId;
  modelTypeId: mongoose.Types.ObjectId;
  totalRequests: number;
  thisMonth: number;
  limitsPerMonth: number;
  lastAccessAt?: Date;
}

const projectUsageStatisticsSchema = new Schema<IProjectUsageStatistics>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    modelTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'ModelType',
      required: true,
      index: true,
    },
    totalRequests: {
      type: Number,
      required: true,
      default: 0,
    },
    thisMonth: {
      type: Number,
      required: true,
      default: 0,
    },
    limitsPerMonth: {
      type: Number,
      required: true,
      default: 10000,
    },
    lastAccessAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index for project-modelType lookup
projectUsageStatisticsSchema.index({ projectId: 1, modelTypeId: 1 }, { unique: true });

const ProjectUsageStatistics = mongoose.model<IProjectUsageStatistics>(
  'ProjectUsageStatistics',
  projectUsageStatisticsSchema
);

export { ProjectUsageStatistics, IProjectUsageStatistics };
