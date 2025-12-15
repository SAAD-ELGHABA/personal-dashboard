import mongoose, { Document, Schema } from 'mongoose';

interface ISslReport extends Document {
  serviceId: mongoose.Types.ObjectId;
  issuer: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  isValid: boolean;
  checkedAt: Date;
}

const sslReportSchema = new Schema<ISslReport>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    issuer: {
      type: String,
      default: null,
    },
    validFrom: {
      type: Date,
      default: null,
    },
    validTo: {
      type: Date,
      default: null,
    },
    isValid: {
      type: Boolean,
      default: false,
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

// Index for querying recent SSL reports
sslReportSchema.index({ serviceId: 1, checkedAt: -1 });

const SslReport = mongoose.model<ISslReport>('SslReport', sslReportSchema);

export default SslReport;
export type { ISslReport };
