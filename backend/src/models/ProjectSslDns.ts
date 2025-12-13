import mongoose, { Document, Schema } from 'mongoose';

interface IProjectSslDns extends Document {
  projectId: mongoose.Types.ObjectId;
  ipAddress: string;
  dnsProvider?: string;
  sslIssuer?: string;
  sslValidFrom?: Date;
  sslValidTo?: Date;
  daysRemaining?: number;
  lastCheckedAt: Date;
}

const projectSslDnsSchema = new Schema<IProjectSslDns>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    dnsProvider: {
      type: String,
    },
    sslIssuer: {
      type: String,
    },
    sslValidFrom: {
      type: Date,
    },
    sslValidTo: {
      type: Date,
    },
    daysRemaining: {
      type: Number,
    },
    lastCheckedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: false }
);

const ProjectSslDns = mongoose.model<IProjectSslDns>(
  'ProjectSslDns',
  projectSslDnsSchema
);

export { ProjectSslDns, IProjectSslDns };
