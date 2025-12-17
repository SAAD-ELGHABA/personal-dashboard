import mongoose, { Document, Schema } from 'mongoose';

interface IServicePrompt extends Document {
  serviceId: mongoose.Types.ObjectId;
  modelTypeId: mongoose.Types.ObjectId;
  name: string;
  promptText: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const servicePromptSchema = new Schema<IServicePrompt>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    modelTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'ModelType',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    promptText: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying active prompts by service and model type
servicePromptSchema.index({ serviceId: 1, modelTypeId: 1, isActive: 1 });

// Ensure only one active prompt per service-modelType combination
servicePromptSchema.pre('save', async function (next) {
  if (this.isActive && this.isModified('isActive')) {
    await mongoose.model('ServicePrompt').updateMany(
      {
        serviceId: this.serviceId,
        modelTypeId: this.modelTypeId,
        _id: { $ne: this._id },
      },
      { isActive: false }
    );
  }
  next();
});

const ServicePrompt = mongoose.model<IServicePrompt>('ServicePrompt', servicePromptSchema);

export { ServicePrompt, IServicePrompt };
export default ServicePrompt;
