import mongoose, { Document, Schema } from 'mongoose';

interface IProjectCrawledPages extends Document {
  projectId: mongoose.Types.ObjectId;
  url: string;
  status: number;
  isBroken: boolean;
  contentType?: string;
  foundAt: Date;
}

const projectCrawledPagesSchema = new Schema<IProjectCrawledPages>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      required: true,
    },
    isBroken: {
      type: Boolean,
      default: false,
    },
    contentType: {
      type: String,
    },
    foundAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: false }
);

// Compound index for efficient queries and uniqueness
projectCrawledPagesSchema.index({ projectId: 1, url: 1 }, { unique: true });
projectCrawledPagesSchema.index({ projectId: 1, isBroken: 1 });

const ProjectCrawledPages = mongoose.model<IProjectCrawledPages>(
  'ProjectCrawledPages',
  projectCrawledPagesSchema
);

export { ProjectCrawledPages, IProjectCrawledPages };
