
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StoryGenerationRequest {
  childName: string;
  childAge: number;
  childGender: 'boy' | 'girl' | 'other';
  favoriteThemes?: string;
  tone: 'calming' | 'educational' | 'adventurous' | 'funny';
  length: 'short' | 'medium' | 'long';
  bedtimeMessage?: string;
}

export interface StoryGenerationResponse {
  id: number;
  title: string;
  content: string;
  userTier: 'free' | 'premium' | 'family';
  tierLimits: any;
}

export interface SubscriptionCreateRequest {
  tier: 'premium' | 'family';
  billing?: 'monthly' | 'yearly';
}

export interface NotificationData {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  progress?: {
    current: number;
    max: number;
  };
}
