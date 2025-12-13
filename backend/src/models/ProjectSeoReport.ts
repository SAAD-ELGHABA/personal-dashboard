import mongoose, { Document, Schema } from 'mongoose';

interface IProjectSeoReport extends Document {
  projectId: mongoose.Types.ObjectId;
  pageTitle?: string;
  metaDescription?: string;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  brokenLinks: number;
  warnings: number;
  errorCount: number;
  scanDate: Date;
}

const projectSeoReportSchema = new Schema<IProjectSeoReport>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    pageTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    hasRobotsTxt: {
      type: Boolean,
      default: false,
    },
    hasSitemap: {
      type: Boolean,
      default: false,
    },
    brokenLinks: {
      type: Number,
      default: 0,
    },
    warnings: {
      type: Number,
      default: 0,
    },
    errorCount: {
      type: Number,
      default: 0,
    },
    scanDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  { timestamps: false }
);

// Compound index for efficient queries
projectSeoReportSchema.index({ projectId: 1, scanDate: -1 });

const ProjectSeoReport = mongoose.model<IProjectSeoReport>(
  'ProjectSeoReport',
  projectSeoReportSchema
);

export { ProjectSeoReport, IProjectSeoReport };
