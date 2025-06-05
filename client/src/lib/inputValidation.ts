
// Client-side input validation and sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Basic XSS prevention - remove dangerous patterns
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function validateChildName(name: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized) {
    return { isValid: false, error: "Child name is required" };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: "Child name must be 50 characters or less" };
  }
  
  if (!/^[a-zA-Z\s\-']+$/.test(sanitized)) {
    return { isValid: false, error: "Child name can only contain letters, spaces, hyphens, and apostrophes" };
  }
  
  return { isValid: true };
}

export function validateThemes(themes: string): { isValid: boolean; error?: string } {
  if (!themes) return { isValid: true }; // Optional field
  
  const sanitized = sanitizeInput(themes);
  
  if (sanitized.length > 200) {
    return { isValid: false, error: "Themes must be 200 characters or less" };
  }
  
  if (!/^[a-zA-Z\s,\-']+$/.test(sanitized)) {
    return { isValid: false, error: "Themes can only contain letters, spaces, commas, hyphens, and apostrophes" };
  }
  
  return { isValid: true };
}

export function validateBedtimeMessage(message: string): { isValid: boolean; error?: string } {
  if (!message) return { isValid: true }; // Optional field
  
  const sanitized = sanitizeInput(message);
  
  if (sanitized.length > 500) {
    return { isValid: false, error: "Bedtime message must be 500 characters or less" };
  }
  
  return { isValid: true };
}

// Rate limiting helper for client-side
export class ClientRateLimiter {
  private attempts: number[] = [];
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000
  ) {}
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.attempts = this.attempts.filter(time => now - time < this.windowMs);
    
    if (this.attempts.length >= this.maxAttempts) {
      return false;
    }
    
    this.attempts.push(now);
    return true;
  }
  
  getTimeUntilNextRequest(): number {
    if (this.attempts.length < this.maxAttempts) return 0;
    
    const oldestAttempt = Math.min(...this.attempts);
    return Math.max(0, this.windowMs - (Date.now() - oldestAttempt));
  }
}
