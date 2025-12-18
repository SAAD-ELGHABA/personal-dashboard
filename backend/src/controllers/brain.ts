import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project';
import { ServicePrompt } from '../models/ServicePrompt';
import { Model } from '../models/Model';
import { ModelType } from '../models/ModelType';
import Service from '../models/Service';
import { ApiError } from '../middleware/errorHandler';
import axios from 'axios';

interface BrainRequest extends Request {
  projectId?: string;
}

/**
 * Middleware to authenticate using Bearer token and validate project access
 */
export const authenticateBrainRequest = async (
  req: BrainRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization header with Bearer token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const actualToken = token.startsWith('sk_proj_') ? token.substring(8) : token;
    // Validate project access and get project details
    const { project } = await projectService.validateProjectAccess(actualToken);

    // Attach project ID to request
    req.projectId = project._id.toString();

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Execute AI model based on request
 * POST /brain/v1/run
 */
export const runBrainModel = async (
  req: BrainRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelType, input, options } = req.body;

    // Validate required fields
    if (!modelType || !input) {
      throw new ApiError(400, 'modelType and input are required');
    }

    // Get the origin URL from the request
    const origin = req.headers.origin || req.headers.referer;
    
    if (!origin) {
      throw new ApiError(400, 'Origin or Referer header is required to identify the service');
    }

    // Extract base URL from origin (remove trailing slashes and paths)
    let serviceUrl: string;
    try {
      const url = new URL(origin);
      serviceUrl = `${url.protocol}//${url.host}`;
    } catch (error) {
      throw new ApiError(400, 'Invalid origin URL format');
    }

    // Find service by URL and project
    const service = await Service.findOne({
      baseUrl: serviceUrl,
      projectId: req.projectId,
      isActive: true,
    });

    if (!service) {
      throw new ApiError(
        404, 
        `No active service found with URL '${serviceUrl}' for this project. Please register this service in the dashboard first.`
      );
    }

    // Get model type by key
    const modelTypeDoc = await ModelType.findOne({
      key: modelType,
      isActive: true,
    });

    if (!modelTypeDoc) {
      throw new ApiError(404, `Model type '${modelType}' not found or inactive`);
    }

    console.log('Found model type:', {
      id: modelTypeDoc._id,
      key: modelTypeDoc.key,
      name: modelTypeDoc.name
    });

    // Validate project has access to this model type
    const token = req.headers.authorization!.substring(7);
    const actualToken = token.startsWith('sk_proj_') ? token.substring(8) : token;
    
    const { project } = await projectService.validateProjectAccess(
      actualToken,
      modelType
    );

    console.log('Project validated:', {
      id: project._id,
      name: project.name
    });

    // Get active prompt for this service and model type
    const activePrompt = await ServicePrompt.findOne({
      serviceId: service._id,
      modelTypeId: modelTypeDoc._id,
      isActive: true,
    });

    if (!activePrompt) {
      throw new ApiError(
        404,
        `No active prompt found for service '${service.name}' and model type '${modelType}'`
      );
    }

    console.log('Found active prompt:', {
      id: activePrompt._id,
      name: activePrompt.name,
      promptLength: activePrompt.promptText.length
    });

    // Get an available model of this type
    console.log('Looking for model with criteria:', {
      typeId: modelTypeDoc._id,
      status: 'active',
      projectId: project._id
    });

    const model = await Model.findOne({
      typeId: modelTypeDoc._id,
      status: 'active',
      $or: [
        { projectsAssigned: project._id },
        { isPublic: true },
      ],
    })
      .select('+apiKey +encryptionIV')
      .sort({ priority: -1, weight: -1 });

    console.log('Model lookup result:', {
      found: !!model,
      modelName: model?.name,
      modelVersion: model?.version,
      modelProvider: model?.provider,
      modelEndpoint: model?.endpoint
    });

    if (!model) {
      throw new ApiError(
        503,
        `No available model found for type '${modelType}'. Please configure a model in the dashboard.`
      );
    }

    // Build the prompt by combining service prompt with user input
    const fullPrompt = buildFullPrompt(activePrompt.promptText, input, options);

    // Execute the model
    const result = await executeModel(model, fullPrompt, options);

    // Return the result
    res.json({
      success: true,
      data: {
        result,
        model: {
          name: model.name,
          version: model.version,
          provider: model.provider,
        },
        service: {
          id: service._id,
          name: service.name,
        },
        prompt: {
          id: activePrompt._id,
          name: activePrompt.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Build the full prompt by combining service prompt template with user input
 */
function buildFullPrompt(
  promptTemplate: string,
  userInput: string,
  options?: any
): string {
  // Replace {{input}} placeholder in the prompt template
  let fullPrompt = promptTemplate.replace(/\{\{input\}\}/g, userInput);

  // Replace any additional placeholders from options
  if (options) {
    Object.keys(options).forEach((key) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      fullPrompt = fullPrompt.replace(placeholder, options[key]);
    });
  }

  return fullPrompt;
}

/**
 * Execute the AI model with the given prompt
 */
async function executeModel(
  model: any,
  prompt: string,
  options?: any
): Promise<any> {
  try {
    // Validate model has required fields
    if (!model.endpoint) {
      throw new ApiError(500, 'Model endpoint is not configured');
    }
    
    if (!model.version) {
      throw new ApiError(500, `Model version is not configured for model '${model.name}'`);
    }

    const decryptedApiKey = model.decryptApiKey();

    if (!decryptedApiKey) {
      throw new ApiError(500, 'Model API key is not configured or could not be decrypted');
    }

    // Build request based on provider
    let requestData: any;
    let headers: any = {
      'Content-Type': 'application/json',
    };

    switch (model.provider) {
      case 'openai':
        headers['Authorization'] = `Bearer ${decryptedApiKey}`;
        requestData = {
          model: options?.modelVersion || model.version,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 1000,
        };
        break;

      case 'anthropic':
        headers['x-api-key'] = decryptedApiKey;
        headers['anthropic-version'] = '2023-06-01';
        requestData = {
          model: options?.modelVersion || model.version,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: options?.maxTokens || 1000,
        };
        break;

      case 'google':
        // Google AI (Gemini) API format
        headers['x-goog-api-key'] = decryptedApiKey;
        requestData = {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: options?.temperature || 0.7,
            maxOutputTokens: options?.maxTokens || 1000,
          },
        };
        break;

      case 'custom':
        // For custom models, check if endpoint suggests OpenAI compatibility
        if (model.endpoint.includes('openrouter.ai') || model.endpoint.includes('chat/completions')) {
          // Use OpenAI-compatible format
          headers['Authorization'] = `Bearer ${decryptedApiKey}`;
          requestData = {
            model: model.name, // Use model name as the model identifier
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: options?.temperature || 0.7,
            max_tokens: options?.maxTokens || 1000,
          };
        } else {
          // Generic custom format
          headers['Authorization'] = `Bearer ${decryptedApiKey}`;
          requestData = {
            prompt,
            ...options,
          };
        }
        break;
      case 'local':
        // For custom/local models, assume a generic format
        headers['Authorization'] = `Bearer ${decryptedApiKey}`;
        requestData = {
          prompt,
          ...options,
        };
        break;

      default:
        throw new ApiError(400, `Unsupported model provider: ${model.provider}`);
    }

    console.log('Executing model:', {
      name: model.name,
      provider: model.provider,
      endpoint: model.endpoint,
      version: model.version,
      requestData: { ...requestData, prompt: prompt.substring(0, 100) + '...' }
    });

    // Make the API call
    const response = await axios.post(model.endpoint, requestData, {
      headers,
      timeout: (model.timeoutSeconds || 30) * 1000,
    });

    // Extract the response based on provider
    let result: any;
    switch (model.provider) {
      case 'openai':
        result = {
          text: response.data.choices[0].message.content,
          usage: response.data.usage,
        };
        break;

      case 'anthropic':
        result = {
          text: response.data.content[0].text,
          usage: response.data.usage,
        };
        break;

      case 'google':
        // Parse Google AI (Gemini) response
        result = {
          text: response.data.candidates[0].content.parts[0].text,
          usage: response.data.usageMetadata,
        };
        break;

      case 'custom':
        // Check if response is OpenAI-compatible
        if (response.data.choices && response.data.choices[0]?.message?.content) {
          result = {
            text: response.data.choices[0].message.content,
            usage: response.data.usage,
          };
        } else {
          result = response.data;
        }
        break;
      
      case 'local':
        result = response.data;
        break;

      default:
        result = response.data;
    }

    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || error.response?.data?.error 
        || error.message;
      
      console.error('Model execution error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });
      
      throw new ApiError(
        error.response?.status || 500,
        `Model execution failed: ${errorMessage}`
      );
    }
    throw error;
  }
}
