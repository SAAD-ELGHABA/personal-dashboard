import mongoose, { Document, Schema } from 'mongoose';

export type ProjectHealthStatus = 'UP' | 'DEGRADED' | 'DOWN';

interface IProjectHealthSnapshot extends Document {
  projectId: mongoose.Types.ObjectId;
  status: ProjectHealthStatus;
  reason: string | null;
  checkedAt: Date;
}

const projectHealthSnapshotSchema = new Schema<IProjectHealthSnapshot>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['UP', 'DEGRADED', 'DOWN'],
      required: true,
    },
    reason: {
      type: String,
      default: null,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Index for querying recent snapshots
projectHealthSnapshotSchema.index({ projectId: 1, checkedAt: -1 });

const ProjectHealthSnapshot = mongoose.model<IProjectHealthSnapshot>(
  'ProjectHealthSnapshot',
  projectHealthSnapshotSchema
);

export default ProjectHealthSnapshot;
export type { IProjectHealthSnapshot };
