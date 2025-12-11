import mongoose, { Document, Schema } from 'mongoose';

type LogLevel = 'info' | 'warn' | 'error' | 'critical';

interface ISystemLog extends Document {
  level: LogLevel;
  message: string;
  context: Record<string, any>;
  createdAt: Date;
}

const systemLogSchema = new Schema<ISystemLog>(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'critical'],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    context: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for time-based queries
systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ level: 1, createdAt: -1 });

const SystemLog = mongoose.model<ISystemLog>('SystemLog', systemLogSchema);

export { SystemLog, ISystemLog, LogLevel };
