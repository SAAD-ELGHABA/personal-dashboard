import mongoose, { Document, Schema } from 'mongoose';

type MonitoringTaskType = 
  | 'HEALTH'
  | 'PERFORMANCE' 
  | 'SEO' 
  | 'SSL' 
  | 'DNS';

interface IMonitoringTask extends Document {
  serviceId: mongoose.Types.ObjectId;
  type: MonitoringTaskType;
  intervalSeconds: number;
  lastRunAt?: Date;
  nextRunAt: Date;
  isActive: boolean;
}

const monitoringTaskSchema = new Schema<IMonitoringTask>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['HEALTH', 'PERFORMANCE', 'SEO', 'SSL', 'DNS'],
      required: true,
    },
    intervalSeconds: {
      type: Number,
      required: true,
      min: 1,
    },
    lastRunAt: {
      type: Date,
    },
    nextRunAt: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
monitoringTaskSchema.index({ serviceId: 1, type: 1 }, { unique: true });
monitoringTaskSchema.index({ isActive: 1, nextRunAt: 1 });

const MonitoringTask = mongoose.model<IMonitoringTask>(
  'MonitoringTask',
  monitoringTaskSchema
);

export { MonitoringTask, IMonitoringTask, MonitoringTaskType };
