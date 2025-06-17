import OpenAI from "openai";
import crypto from "crypto";
import { STORY_TEMPLATES } from "../shared/storyTemplates";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// Simple in-memory cache for story generation
interface CacheEntry {
  story: { title: string; content: string };
  timestamp: number;
}

const storyCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Usage tracking for rate limiting
interface UsageData {
  count: number;
  windowStart: number;
}

const userUsage = new Map<string, UsageData>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 stories per hour per user

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const usage = userUsage.get(userId);

  if (!usage || now - usage.windowStart > RATE_LIMIT_WINDOW) {
    userUsage.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (usage.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  usage.count++;
  return true;
};

const trackUsage = (userId: string, tokensUsed: number = 0) => {
  // Could integrate with a proper analytics service here
  console.log(
    `Story generated for user ${userId}, estimated tokens: ${tokensUsed}`,
  );
};

const generateCacheKey = (params: StoryGenerationParams): string => {
  // Create a cache key based on core parameters (excluding bedtime message for variability)
  const keyData = {
    childName: params.childName,
    childAge: params.childAge,
    childGender: params.childGender,
    favoriteThemes: params.favoriteThemes,
    tone: params.tone,
    length: params.length,
    storyTemplate: params.storyTemplate,
  };
  return crypto.createHash("md5").update(JSON.stringify(keyData)).digest("hex");
};

const getCachedStory = (
  cacheKey: string,
): { title: string; content: string } | null => {
  const cached = storyCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    storyCache.delete(cacheKey);
    return null;
  }

  return cached.story;
};

const setCachedStory = (
  cacheKey: string,
  story: { title: string; content: string },
) => {
  storyCache.set(cacheKey, {
    story,
    timestamp: Date.now(),
  });
};
const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY_ENV_VAR ||
    "default_key",
});

export interface StoryGenerationParams {
  childName: string;
  childAge: number;
  childGender: string; // 'boy', 'girl', 'other'
  favoriteThemes?: string;
  tone: string; // 'adventurous', 'silly', 'calming', 'educational'
  length: string; // 'short', 'medium'
  storyTemplate?: string;
  bedtimeMessage?: string;
  customCharacters?: string[]; // Array of custom character IDs
}

const MAX_CONTENT_SIZE_MAP = {
  short: 2000,
  medium: 4000,
};

const createPrompt = (params: StoryGenerationParams, customCharacters?: any[]) => {
  const {
    childName,
    childAge,
    childGender,
    favoriteThemes,
    tone,
    length,
    storyTemplate,
    bedtimeMessage,
  } = params;

  const lengthSpec = length === "short" ? "2-3 minutes" : "4-5 minutes";
  const paragraphCount =
    length === "short" ? "4-5 paragraphs" : "6-8 paragraphs";
  const themeSpec = favoriteThemes ? ` featuring ${favoriteThemes}` : "";
  const messageSpec = bedtimeMessage
    ? `\n\nEnd the story with this personalized bedtime message in a special highlighted box: "${bedtimeMessage}"`
    : `\n\nEnd with a gentle goodnight message encouraging sweet dreams.`;

  const pronouns =
    childGender === "boy"
      ? { they: "he", them: "him", their: "his" }
      : childGender === "girl"
        ? { they: "she", them: "her", their: "her" }
        : { they: "they", them: "them", their: "their" };

  let templateSpec = "";
  if (storyTemplate && storyTemplate !== "") {
    const template = STORY_TEMPLATES.find((t: any) => t.id === storyTemplate);
    if (template) {
      templateSpec = `\n\nFollow this story structure: ${template.structure.replace('{childName}', childName)}`;
    }
  }

  let charactersSpec = "";
  if (customCharacters && customCharacters.length > 0) {
    charactersSpec = `\n\nInclude these custom characters in the story:\n${customCharacters.map(char => 
      `- ${char.name} (${char.role}): ${char.description}. Appearance: ${char.appearance}. Personality: ${char.personality}.${char.specialAbilities ? ` Special abilities: ${char.specialAbilities}.` : ''}`
    ).join('\n')}`;
  }

  return `Create a magical ${tone} bedtime story for a ${childAge}-year-old ${childGender} named ${childName}${themeSpec}. 

The story should be:
- Perfect for bedtime reading (${lengthSpec} long)
- ${paragraphCount} with engaging but calming content
- Age-appropriate for ${childAge}-year-olds
- ${tone} in tone while still being suitable for bedtime
- Include ${childName} as the main character (use pronouns: ${pronouns.they}/${pronouns.them}/${pronouns.their})
- Have a clear beginning, middle, and satisfying end
- End on a peaceful, sleepy note perfect for bedtime
- Use creative and varied story openings - avoid starting with "Once upon a time" and instead use engaging, original beginnings that immediately draw the reader in${templateSpec}${charactersSpec}

${messageSpec}

Please respond with a JSON object containing:
- "title": A magical story title
- "content": The complete story text formatted with proper paragraphs

Make it enchanting and memorable while being perfect for bedtime!`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Check if it's a retryable error
      const isRetryable =
        error instanceof Error &&
        (error.message.includes("rate limit") ||
          error.message.includes("timeout") ||
          error.message.includes("503") ||
          error.message.includes("502"));

      if (!isRetryable) throw error;

      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.warn(
        `API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
      );
      await sleep(delay);
    }
  }
  throw new Error("Max retries exceeded");
}

export async function generateBedtimeStory(
  params: StoryGenerationParams,
  userId?: string,
): Promise<{
  title: string;
  content: string;
}> {
  // Rate limiting check
  if (userId && !checkRateLimit(userId)) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
  const MAX_CONTENT_SIZE =
    MAX_CONTENT_SIZE_MAP[params.length as keyof typeof MAX_CONTENT_SIZE_MAP] ||
    MAX_CONTENT_SIZE_MAP["medium"];

  // Check cache first (only if no custom bedtime message)
  if (!params.bedtimeMessage) {
    const cacheKey = generateCacheKey(params);
    const cachedStory = getCachedStory(cacheKey);
    if (cachedStory) {
      console.log("Returning cached story for similar request");
      return cachedStory;
    }
  }

  const prompt = createPrompt(params, customCharacters);

  // Adjust content length based on story length
  let targetWords: number;
  let targetParagraphs: number;

  switch (params.length) {
    case "short":
      targetWords = 200;
      targetParagraphs = 4;
      break;
    case "medium":
      targetWords = 400;
      targetParagraphs = 6;
      break;
    case "long":
      targetWords = 800;
      targetParagraphs = 10;
      break;
    default:
      targetWords = 200;
      targetParagraphs = 4;
  }

  try {
    const response = await retryWithBackoff(() =>
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a professional children's bedtime story writer who creates magical, age-appropriate stories that help children drift off to sleep. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    );

    const result = JSON.parse(response.choices[0].message.content || "{}");

    if (!result || !result.title || !result.content) {
      throw new Error("Invalid response: Title or content missing.");
    }

    // Validate content safety and appropriateness
    const validateContent = (content: string, title: string) => {
      // Check for minimum content length
      if (content.length < 100) {
        throw new Error("Generated story is too short");
      }

      // Check for inappropriate content (basic filtering)
      const inappropriateWords = [
        "violence",
        "scary",
        "frightening",
        "nightmare",
      ];
      const lowercaseContent = content.toLowerCase();
      const foundInappropriate = inappropriateWords.find((word) =>
        lowercaseContent.includes(word),
      );

      if (foundInappropriate) {
        console.warn(
          `Potentially inappropriate content detected: ${foundInappropriate}`,
        );
        // Could regenerate or filter content here
      }

      // Ensure the child's name appears in the story
      const childNameLower = params.childName.toLowerCase();
      if (
        !lowercaseContent.includes(childNameLower) &&
        !title.toLowerCase().includes(childNameLower)
      ) {
        console.warn(`Child's name "${params.childName}" not found in story`);
      }

      return true;
    };

    validateContent(result.content, result.title);

    if (result.content.length > MAX_CONTENT_SIZE) {
      console.warn(
        `Story content too large: ${result.content.length} characters, truncating to ${MAX_CONTENT_SIZE}`,
      );
      result.content = result.content.substring(0, MAX_CONTENT_SIZE) + "...";
    }

    const finalStory = {
      title: result.title,
      content: result.content,
    };

    // Cache the result if no custom bedtime message
    if (!params.bedtimeMessage) {
      const cacheKey = generateCacheKey(params);
      setCachedStory(cacheKey, finalStory);
    }

    // Track usage
    if (userId) {
      const estimatedTokens = response.usage?.total_tokens || 0;
      trackUsage(userId, estimatedTokens);
    }

    return finalStory;
  } catch (error) {
    console.error("Error generating bedtime story:", error);
    throw new Error(
      `Failed to generate story: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
