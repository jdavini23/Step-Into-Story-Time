
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface StoryGenerationParams {
  childName: string;
  childAge: number;
  childGender: string; // 'boy', 'girl', 'other'
  favoriteThemes?: string;
  tone: string; // 'adventurous', 'silly', 'calming', 'educational'
  length: string; // 'short', 'medium'
  bedtimeMessage?: string;
}

const MAX_CONTENT_SIZE_MAP = {
  short: 2000,
  medium: 4000,
};

const createPrompt = (params: StoryGenerationParams) => {
  const { childName, childAge, childGender, favoriteThemes, tone, length, bedtimeMessage } = params;
  
  const lengthSpec = length === 'short' ? '2-3 minutes' : '4-5 minutes';
  const paragraphCount = length === 'short' ? '4-5 paragraphs' : '6-8 paragraphs';
  const themeSpec = favoriteThemes ? ` featuring ${favoriteThemes}` : '';
  const messageSpec = bedtimeMessage ? 
    `\n\nEnd the story with this personalized bedtime message in a special highlighted box: "${bedtimeMessage}"` : 
    `\n\nEnd with a gentle goodnight message encouraging sweet dreams.`;

  const pronouns = childGender === 'boy' ? { they: 'he', them: 'him', their: 'his' } :
                   childGender === 'girl' ? { they: 'she', them: 'her', their: 'her' } :
                   { they: 'they', them: 'them', their: 'their' };

  return `Create a magical ${tone} bedtime story for a ${childAge}-year-old ${childGender} named ${childName}${themeSpec}. 

The story should be:
- Perfect for bedtime reading (${lengthSpec} long)
- ${paragraphCount} with engaging but calming content
- Age-appropriate for ${childAge}-year-olds
- ${tone} in tone while still being suitable for bedtime
- Include ${childName} as the main character (use pronouns: ${pronouns.they}/${pronouns.them}/${pronouns.their})
- Have a clear beginning, middle, and satisfying end
- End on a peaceful, sleepy note perfect for bedtime

${messageSpec}

Please respond with a JSON object containing:
- "title": A magical story title
- "content": The complete story text formatted with proper paragraphs

Make it enchanting and memorable while being perfect for bedtime!`;
};

export async function generateBedtimeStory(params: StoryGenerationParams): Promise<{
  title: string;
  content: string;
}> {
  const MAX_CONTENT_SIZE = MAX_CONTENT_SIZE_MAP[params.length as keyof typeof MAX_CONTENT_SIZE_MAP] || MAX_CONTENT_SIZE_MAP['medium'];
  
  const prompt = createPrompt(params);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional children's bedtime story writer who creates magical, age-appropriate stories that help children drift off to sleep. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result || !result.title || !result.content) {
      throw new Error("Invalid response: Title or content missing.");
    }

    if (result.content.length > MAX_CONTENT_SIZE) {
      console.warn(`Story content too large: ${result.content.length} characters, truncating to ${MAX_CONTENT_SIZE}`);
      result.content = result.content.substring(0, MAX_CONTENT_SIZE) + "...";
    }

    return {
      title: result.title,
      content: result.content,
    };
  } catch (error) {
    console.error("Error generating bedtime story:", error);
    throw new Error(`Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
