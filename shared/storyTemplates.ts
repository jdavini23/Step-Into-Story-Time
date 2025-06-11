export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  structure: string;
  suitable_for: string[];
  example_title: string;
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: "classic-adventure",
    name: "Classic Adventure",
    description: "A hero's journey with challenges and triumph",
    icon: "🗺️",
    structure: "The story follows {childName} as they discover a magical world, face a challenge that tests their courage, meet helpful friends along the way, and return home with new wisdom and confidence.",
    suitable_for: ["adventurous", "educational"],
    example_title: "The Brave Quest of {childName}"
  },
  {
    id: "friendship-tale",
    name: "Friendship Tale",  
    description: "Stories about making friends and kindness",
    icon: "🤝",
    structure: "In this heartwarming story, {childName} meets a new friend who seems different at first. Through kindness and understanding, they discover how much they have in common and form a wonderful friendship.",
    suitable_for: ["calming", "educational"],
    example_title: "{childName} and the New Friend"
  },
  {
    id: "magical-discovery",
    name: "Magical Discovery",
    description: "Finding wonder in everyday moments",
    icon: "✨",
    structure: "{childName} discovers something magical hidden in an ordinary place. As they explore this wonder, they learn that magic can be found everywhere when you look with curious eyes.",
    suitable_for: ["adventurous", "silly", "calming"],
    example_title: "The Secret Magic of {childName}"
  },
  {
    id: "problem-solver",
    name: "Problem Solver",
    description: "Using creativity to overcome obstacles", 
    icon: "🧩",
    structure: "When {childName} encounters a tricky problem, they use their creativity and determination to find a clever solution. Along the way, they discover that every problem has a solution if you think creatively.",
    suitable_for: ["educational", "adventurous"],
    example_title: "{childName} the Problem Solver"
  },
  {
    id: "bedtime-journey",
    name: "Bedtime Journey",
    description: "Gentle adventures that end with peaceful sleep",
    icon: "🌙",
    structure: "As {childName} gets ready for bed, they embark on a gentle, dreamy adventure. The story gradually becomes more peaceful and soothing, ending with {childName} drifting off to sleep in their cozy bed.",
    suitable_for: ["calming"],
    example_title: "{childName}'s Dreamy Adventure"
  },
  {
    id: "silly-mishap",
    name: "Silly Mishap",
    description: "Funny situations that teach gentle lessons",
    icon: "😄", 
    structure: "{childName} finds themselves in a series of funny, harmless mishaps that lead to giggles and surprises. Through laughter and persistence, they turn every silly situation into something wonderful.",
    suitable_for: ["silly"],
    example_title: "The Silly Day of {childName}"
  }
];

export function getRecommendedTemplates(tone: string): StoryTemplate[] {
  return STORY_TEMPLATES.filter(template => 
    template.suitable_for.includes(tone)
  );
}

export function getTemplateById(id: string): StoryTemplate | undefined {
  return STORY_TEMPLATES.find(template => template.id === id);
}