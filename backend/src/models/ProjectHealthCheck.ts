import mongoose, { Document, Schema } from 'mongoose';

interface IProjectHealthCheck extends Document {
  projectId: mongoose.Types.ObjectId;
  status: 'UP' | 'DOWN';
  httpStatus: number;
  responseTimeMs: number;
  checkedAt: Date;
}

const projectHealthCheckSchema = new Schema<IProjectHealthCheck>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['UP', 'DOWN'],
      required: true,
    },
    httpStatus: {
      type: Number,
      required: true,
    },
    responseTimeMs: {
      type: Number,
      required: true,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  { timestamps: false }
);

// Compound index for efficient queries
projectHealthCheckSchema.index({ projectId: 1, checkedAt: -1 });

const ProjectHealthCheck = mongoose.model<IProjectHealthCheck>(
  'ProjectHealthCheck',
  projectHealthCheckSchema
);

export { ProjectHealthCheck, IProjectHealthCheck };
