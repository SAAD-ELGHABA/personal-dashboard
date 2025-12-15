import mongoose, { Document, Schema } from 'mongoose';

interface ISeoReport extends Document {
  projectId: mongoose.Types.ObjectId;
  url: string;
  title: string | null;
  metaDescription: string | null;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  canonicalUrl: string | null;
  indexable: boolean;
  checkedAt: Date;
}

const seoReportSchema = new Schema<ISeoReport>(
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
      trim: true,
    },
    title: {
      type: String,
      default: null,
    },
    metaDescription: {
      type: String,
      default: null,
    },
    hasRobotsTxt: {
      type: Boolean,
      default: false,
    },
    hasSitemap: {
      type: Boolean,
      default: false,
    },
    canonicalUrl: {
      type: String,
      default: null,
    },
    indexable: {
      type: Boolean,
      default: true,
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

// Index for querying recent SEO reports
seoReportSchema.index({ projectId: 1, checkedAt: -1 });

const SeoReport = mongoose.model<ISeoReport>('SeoReport', seoReportSchema);

export default SeoReport;
export type { ISeoReport };
