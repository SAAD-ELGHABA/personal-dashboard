import { ModelType } from '../models/ModelType';

/**
 * Initialize default model types
 */
export const initializeModelTypes = async (): Promise<void> => {
  try {
    const defaultModelTypes = [
      {
        key: 'text-generation',
        name: 'Text Generation',
        description: 'Large language models for text completion and chat',
        category: 'text',
        icon: '💬',
        capabilities: ['chat', 'completion', 'conversation', 'qa'],
        isActive: true,
        requiresAuth: true,
        defaultMaxTokens: 2000,
        defaultTemperature: 0.7,
        order: 1,
      },
      {
        key: 'image-generation',
        name: 'Image Generation',
        description: 'AI models for generating images from text prompts',
        category: 'image',
        icon: '🎨',
        capabilities: ['text-to-image', 'image-editing', 'style-transfer'],
        isActive: true,
        requiresAuth: true,
        defaultMaxTokens: 1000,
        defaultTemperature: 0.8,
        order: 2,
      },
      {
        key: 'image-analysis',
        name: 'Image Analysis',
        description: 'Computer vision models for analyzing and understanding images',
        category: 'image',
        icon: '🔍',
        capabilities: ['object-detection', 'classification', 'ocr', 'face-detection'],
        isActive: true,
        requiresAuth: true,
        defaultMaxTokens: 1000,
        defaultTemperature: 0.5,
        order: 3,
      },
      {
        key: 'speech-to-text',
        name: 'Speech to Text',
        description: 'Audio transcription and speech recognition models',
        category: 'audio',
        icon: '🎤',
        capabilities: ['transcription', 'speech-recognition', 'translation'],
        isActive: true,
        requiresAuth: true,
        defaultMaxTokens: 1000,
        defaultTemperature: 0.5,
        order: 4,
      },
      {
        key: 'text-to-speech',
        name: 'Text to Speech',
        description: 'Voice synthesis and text-to-speech models',
        category: 'audio',
        icon: '🔊',
        capabilities: ['voice-synthesis', 'speech-generation', 'voice-cloning'],
        isActive: true,
        requiresAuth: true,
        defaultMaxTokens: 500,
        defaultTemperature: 0.7,
        order: 5,
      },
      {
        key: 'embeddings',
        name: 'Embeddings',
        description: 'Vector embedding models for semantic search and similarity',
        category: 'embedding',
        icon: '🧠',
        capabilities: ['text-embedding', 'semantic-search', 'similarity'],
        isActive: true,
        requiresAuth: true,
        defaultMaxTokens: 8000,
        defaultTemperature: 0.0,
        order: 6,
      },
      {
        key: 'code-generation',
        name: 'Code Generation',
        description: 'AI models specialized for code completion and generation',
        category: 'text',
        icon: '💻',
        capabilities: ['code-completion', 'code-generation', 'code-review', 'debugging'],
        isActive: true,
        requiresAuth: true,
        defaultMaxTokens: 4000,
        defaultTemperature: 0.3,
        order: 7,
      },
    ];

    for (const modelType of defaultModelTypes) {
      const existing = await ModelType.findOne({ key: modelType.key });
      
      if (!existing) {
        await ModelType.create(modelType);
        console.log(`Created model type: ${modelType.name}`);
      } else {
        // Update existing model types to ensure they have all fields
        await ModelType.updateOne(
          { key: modelType.key },
          { 
            $set: {
              ...modelType,
              updatedAt: new Date()
            }
          }
        );
        console.log(`Updated model type: ${modelType.name}`);
      }
    }

    console.log('Model types initialization completed');
  } catch (error) {
    console.error('Error initializing model types:', error);
    throw error;
  }
};
