import mongoose, { Document, Schema } from 'mongoose';

export type AvailabilityPeriod = '24h' | '7d' | '30d';

interface IServiceAvailabilityStats extends Document {
  serviceId: mongoose.Types.ObjectId;
  period: AvailabilityPeriod;
  uptimePercentage: number;
  downtimeMinutes: number;
  lastCalculatedAt: Date;
}

const serviceAvailabilityStatsSchema = new Schema<IServiceAvailabilityStats>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ['24h', '7d', '30d'],
      required: true,
    },
    uptimePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    downtimeMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Unique constraint: one record per service per period
serviceAvailabilityStatsSchema.index({ serviceId: 1, period: 1 }, { unique: true });

const ServiceAvailabilityStats = mongoose.model<IServiceAvailabilityStats>(
  'ServiceAvailabilityStats',
  serviceAvailabilityStatsSchema
);

export default ServiceAvailabilityStats;
export type { IServiceAvailabilityStats };
