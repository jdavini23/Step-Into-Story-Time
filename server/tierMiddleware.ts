import { Request, Response, NextFunction } from 'express';
import { 
  canUserGenerateStory, 
  getUserTier, 
  canAccessTheme, 
  canAccessLength,
  TIER_LIMITS,
  SubscriptionTier 
} from './tierManager';

// Extend Request type to include tier information
declare global {
  namespace Express {
    interface Request {
      userTier?: SubscriptionTier;
      tierLimits?: typeof TIER_LIMITS[SubscriptionTier];
    }
  }
}

/**
 * Middleware to check if user can generate a story
 */
export const checkStoryGenerationPermissions = async (
  req: any, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.claims?.sub;
    
    if (!userId) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to generate stories' 
      });
      return;
    }

    // Check if user can generate a story
    const permissionCheck = await canUserGenerateStory(userId);
    
    if (!permissionCheck.canGenerate) {
      let message = 'Story generation not allowed';
      let upgradeRequired = false;

      if (permissionCheck.reason === 'Weekly story limit reached') {
        message = 'You\'ve reached your weekly limit of 3 stories. Upgrade to Premium for unlimited stories.';
        upgradeRequired = true;
      } else if (permissionCheck.reason === 'Subscription is not active') {
        message = 'Your subscription is not active. Please check your billing or contact support.';
        upgradeRequired = true;
      }

      res.status(403).json({ 
        error: 'Generation limit reached',
        message,
        upgradeRequired,
        storiesRemaining: permissionCheck.storiesRemaining || 0
      });
      return;
    }

    // Get user tier for request context
    const { tier } = await getUserTier(userId);
    req.userTier = tier;
    req.tierLimits = TIER_LIMITS[tier];

    next();
  } catch (error) {
    console.error('Error checking story generation permissions:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Unable to verify story generation permissions' 
    });
  }
};

/**
 * Middleware to validate story parameters based on user tier
 */
export const validateStoryParameters = async (
  req: any, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.claims?.sub;
    
    if (!userId) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to generate stories' 
      });
      return;
    }

    const { tier } = await getUserTier(userId);
    const { favoriteThemes, tone, length } = req.body;

    // Validate themes
    if (favoriteThemes) {
      const themes = favoriteThemes.split(',').map((t: string) => t.trim());
      const invalidThemes = themes.filter((theme: string) => !canAccessTheme(tier, theme));
      
      if (invalidThemes.length > 0) {
        res.status(403).json({
          error: 'Theme access restricted',
          message: `Free users can only access these themes: bedtime, fantasy, adventure. Upgrade to Premium for access to all themes.`,
          restrictedThemes: invalidThemes
        });
        return;
      }
    }

    // Validate story length
    if (length && !canAccessLength(tier, length)) {
      res.status(403).json({
        error: 'Length access restricted',
        message: 'Free users can only generate short stories. Upgrade to Premium for medium and long stories.',
        requestedLength: length,
        allowedLengths: tier === 'free' ? ['short'] : ['short', 'medium', 'long']
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validating story parameters:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Unable to validate story parameters' 
    });
  }
};

/**
 * Middleware to add tier information to response
 */
export const addTierInfoToResponse = async (
  req: any, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.claims?.sub;
    
    if (userId) {
      const { tier } = await getUserTier(userId);
      req.userTier = tier;
      req.tierLimits = TIER_LIMITS[tier];
    }

    next();
  } catch (error) {
    console.error('Error adding tier information:', error);
    // Don't fail the request, just continue without tier info
    next();
  }
};