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
      },
      {
        key: 'image-generation',
        name: 'Image Generation',
        description: 'AI models for generating images from text prompts',
      },
      {
        key: 'image-analysis',
        name: 'Image Analysis',
        description: 'Computer vision models for analyzing and understanding images',
      },
      {
        key: 'speech-to-text',
        name: 'Speech to Text',
        description: 'Audio transcription and speech recognition models',
      },
      {
        key: 'text-to-speech',
        name: 'Text to Speech',
        description: 'Voice synthesis and text-to-speech models',
      },
      {
        key: 'embeddings',
        name: 'Embeddings',
        description: 'Vector embedding models for semantic search and similarity',
      },
      {
        key: 'code-generation',
        name: 'Code Generation',
        description: 'AI models specialized for code completion and generation',
      },
    ];

    for (const modelType of defaultModelTypes) {
      const existing = await ModelType.findOne({ key: modelType.key });
      
      if (!existing) {
        await ModelType.create(modelType);
        console.log(`Created model type: ${modelType.name}`);
      }
    }

    console.log('Model types initialization completed');
  } catch (error) {
    console.error('Error initializing model types:', error);
    throw error;
  }
};
