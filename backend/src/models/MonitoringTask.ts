import mongoose, { Document, Schema } from 'mongoose';

type MonitoringTaskType = 
  | 'UPTIME' 
  | 'SEO' 
  | 'PERFORMANCE' 
  | 'DNS_SSL' 
  | 'CRAWL' 
  | 'BACKLINKS';

interface IMonitoringTask extends Document {
  projectId: mongoose.Types.ObjectId;
  type: MonitoringTaskType;
  intervalMinutes: number;
  lastRunAt?: Date;
  nextRunAt: Date;
  isActive: boolean;
}

const monitoringTaskSchema = new Schema<IMonitoringTask>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['UPTIME', 'SEO', 'PERFORMANCE', 'DNS_SSL', 'CRAWL', 'BACKLINKS'],
      required: true,
    },
    intervalMinutes: {
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
monitoringTaskSchema.index({ projectId: 1, type: 1 }, { unique: true });
monitoringTaskSchema.index({ isActive: 1, nextRunAt: 1 });

const MonitoringTask = mongoose.model<IMonitoringTask>(
  'MonitoringTask',
  monitoringTaskSchema
);

export { MonitoringTask, IMonitoringTask, MonitoringTaskType };
