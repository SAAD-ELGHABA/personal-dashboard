import mongoose, { Document, Schema } from 'mongoose';

export type DnsRecordType = 'A' | 'AAAA' | 'CNAME';

interface IDnsReport extends Document {
  serviceId: mongoose.Types.ObjectId;
  domain: string;
  resolved: boolean;
  resolutionTimeMs: number | null;
  recordType: DnsRecordType | null;
  checkedAt: Date;
}

const dnsReportSchema = new Schema<IDnsReport>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolutionTimeMs: {
      type: Number,
      default: null,
    },
    recordType: {
      type: String,
      enum: ['A', 'AAAA', 'CNAME', null],
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

// Index for querying recent DNS reports
dnsReportSchema.index({ serviceId: 1, checkedAt: -1 });

const DnsReport = mongoose.model<IDnsReport>('DnsReport', dnsReportSchema);

export default DnsReport;
export type { IDnsReport };
