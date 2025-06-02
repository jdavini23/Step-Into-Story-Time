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

    // For now, allow all authenticated users to generate stories
    // We'll implement proper tier checking after fixing the basic flow
    req.userTier = 'free';
    req.tierLimits = TIER_LIMITS['free'];

    next();
  } catch (error) {
    console.error('Error checking story generation permissions:', error);
    // Don't block story generation due to tier checking errors
    req.userTier = 'free';
    req.tierLimits = TIER_LIMITS['free'];
    next();
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
    // For now, allow all parameters to pass validation
    // We'll implement proper validation after the basic flow works
    next();
  } catch (error) {
    console.error('Error validating story parameters:', error);
    // Don't block story generation due to validation errors
    next();
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