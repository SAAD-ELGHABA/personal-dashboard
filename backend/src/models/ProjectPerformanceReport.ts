import mongoose, { Document, Schema } from 'mongoose';

interface IProjectPerformanceReport extends Document {
  projectId: mongoose.Types.ObjectId;
  lighthouseScore?: number;
  performanceScore?: number;
  htmlSizeBytes: number;
  cssSizeBytes: number;
  jsSizeBytes: number;
  totalSizeBytes: number;
  firstContentfulPaintMs?: number;
  timeToInteractiveMs?: number;
  screenshotUrl?: string;
  scannedAt: Date;
}

const projectPerformanceReportSchema = new Schema<IProjectPerformanceReport>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    lighthouseScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    htmlSizeBytes: {
      type: Number,
      default: 0,
    },
    cssSizeBytes: {
      type: Number,
      default: 0,
    },
    jsSizeBytes: {
      type: Number,
      default: 0,
    },
    totalSizeBytes: {
      type: Number,
      default: 0,
    },
    firstContentfulPaintMs: {
      type: Number,
    },
    timeToInteractiveMs: {
      type: Number,
    },
    screenshotUrl: {
      type: String,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  { timestamps: false }
);

// Compound index for efficient queries
projectPerformanceReportSchema.index({ projectId: 1, scannedAt: -1 });

const ProjectPerformanceReport = mongoose.model<IProjectPerformanceReport>(
  'ProjectPerformanceReport',
  projectPerformanceReportSchema
);

export { ProjectPerformanceReport, IProjectPerformanceReport };
