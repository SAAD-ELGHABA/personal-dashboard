import mongoose, { Document, Schema } from 'mongoose';

interface IProjectBacklinks extends Document {
  projectId: mongoose.Types.ObjectId;
  sourceUrl: string;
  domainAuthority?: number;
  anchorText?: string;
  discoveredAt: Date;
}

const projectBacklinksSchema = new Schema<IProjectBacklinks>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    sourceUrl: {
      type: String,
      required: true,
    },
    domainAuthority: {
      type: Number,
      min: 0,
      max: 100,
    },
    anchorText: {
      type: String,
    },
    discoveredAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: false }
);

// Compound index for efficient queries and uniqueness
projectBacklinksSchema.index({ projectId: 1, sourceUrl: 1 }, { unique: true });
projectBacklinksSchema.index({ projectId: 1, discoveredAt: -1 });

const ProjectBacklinks = mongoose.model<IProjectBacklinks>(
  'ProjectBacklinks',
  projectBacklinksSchema
);

export { ProjectBacklinks, IProjectBacklinks };
