import mongoose, { Document, Schema } from 'mongoose';

interface IServicePerformanceMetrics extends Document {
  serviceId: mongoose.Types.ObjectId;
  avgLatencyMs: number;
  p95LatencyMs: number;
  errorRate: number;
  sampleSize: number;
  calculatedAt: Date;
}

const servicePerformanceMetricsSchema = new Schema<IServicePerformanceMetrics>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    avgLatencyMs: {
      type: Number,
      required: true,
      min: 0,
    },
    p95LatencyMs: {
      type: Number,
      required: true,
      min: 0,
    },
    errorRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    sampleSize: {
      type: Number,
      required: true,
      min: 0,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Index for querying recent metrics
servicePerformanceMetricsSchema.index({ serviceId: 1, calculatedAt: -1 });

const ServicePerformanceMetrics = mongoose.model<IServicePerformanceMetrics>(
  'ServicePerformanceMetrics',
  servicePerformanceMetricsSchema
);

export default ServicePerformanceMetrics;
export type { IServicePerformanceMetrics };
