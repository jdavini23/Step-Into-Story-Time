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

export async function generateBedtimeStory(params: StoryGenerationParams): Promise<{
  title: string;
  content: string;
}> {
  // Define size limits based on story length
  const MAX_CONTENT_SIZE = params.length === 'short' ? 2000 : 4000; // characters
  const { childName, childAge, childGender, favoriteThemes, tone, length, bedtimeMessage } = params;
  
  // Create dynamic length specification
  const lengthSpec = length === 'short' ? '2-3 minutes' : '4-5 minutes';
  const paragraphCount = length === 'short' ? '4-5 paragraphs' : '6-8 paragraphs';
  
  // Build theme specification
  const themeSpec = favoriteThemes ? ` featuring ${favoriteThemes}` : '';
  
  // Build bedtime message
  const messageSpec = bedtimeMessage ? 
    `\n\nEnd the story with this personalized bedtime message in a special highlighted box: "${bedtimeMessage}"` : 
    `\n\nEnd with a gentle goodnight message encouraging sweet dreams.`;

  // Create appropriate pronouns based on gender
  const pronouns = childGender === 'boy' ? { they: 'he', them: 'him', their: 'his' } :
                   { they: 'she', them: 'her', their: 'her' };

  const prompt = `Create a magical ${tone} bedtime story for a ${childAge}-year-old ${childGender} named ${childName}${themeSpec}. 

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
      temperature: 0.8, // Some creativity while maintaining consistency
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result.title || !result.content) {
      throw new Error("Invalid response format from OpenAI");
    }

    // Validate content size
    if (result.content.length > MAX_CONTENT_SIZE) {
      console.warn(`Story content too large: ${result.content.length} characters, truncating to ${MAX_CONTENT_SIZE}`);
      result.content = result.content.substring(0, MAX_CONTENT_SIZE) + "...";
    }

    return {
      title: result.title,
      content: result.content,
    };
  } catch (error) {
    console.error("Failed to generate bedtime story:", error);
    throw new Error("Failed to generate story. Please try again.");
  }
}
