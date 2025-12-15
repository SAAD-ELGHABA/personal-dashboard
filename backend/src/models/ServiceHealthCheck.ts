import mongoose, { Document, Schema } from 'mongoose';

export type ServiceHealthStatus = 'UP' | 'DEGRADED' | 'DOWN';

interface IServiceHealthCheck extends Document {
  serviceId: mongoose.Types.ObjectId;
  status: ServiceHealthStatus;
  httpStatus: number | null;
  responseTimeMs: number | null;
  dnsResolved: boolean;
  sslValid: boolean;
  errorMessage: string | null;
  checkedAt: Date;
}

const serviceHealthCheckSchema = new Schema<IServiceHealthCheck>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['UP', 'DEGRADED', 'DOWN'],
      required: true,
    },
    httpStatus: {
      type: Number,
      default: null,
    },
    responseTimeMs: {
      type: Number,
      default: null,
    },
    dnsResolved: {
      type: Boolean,
      default: false,
    },
    sslValid: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
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

// Index for querying recent health checks
serviceHealthCheckSchema.index({ serviceId: 1, checkedAt: -1 });
serviceHealthCheckSchema.index({ status: 1, checkedAt: -1 });

const ServiceHealthCheck = mongoose.model<IServiceHealthCheck>(
  'ServiceHealthCheck',
  serviceHealthCheckSchema
);

export default ServiceHealthCheck;
export type { IServiceHealthCheck };
