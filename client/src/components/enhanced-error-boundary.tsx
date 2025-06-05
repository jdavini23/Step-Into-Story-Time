
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Bug, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorCategory {
  type: 'network' | 'auth' | 'validation' | 'permission' | 'server' | 'client' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  userMessage: string;
  technicalMessage: string;
}

export class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error details
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return {
        type: 'network',
        severity: 'medium',
        recoverable: true,
        userMessage: 'Connection problem. Please check your internet and try again.',
        technicalMessage: 'Network request failed or connection was interrupted.',
      };
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('auth') || message.includes('401')) {
      return {
        type: 'auth',
        severity: 'high',
        recoverable: true,
        userMessage: 'You need to sign in again. Redirecting to login...',
        technicalMessage: 'Authentication token expired or invalid.',
      };
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('400')) {
      return {
        type: 'validation',
        severity: 'low',
        recoverable: true,
        userMessage: 'Please check your input and try again.',
        technicalMessage: 'Input validation failed or invalid data format.',
      };
    }

    // Permission errors
    if (message.includes('forbidden') || message.includes('permission') || message.includes('403')) {
      return {
        type: 'permission',
        severity: 'medium',
        recoverable: false,
        userMessage: "You don't have permission to perform this action.",
        technicalMessage: 'Insufficient permissions for requested operation.',
      };
    }

    // Server errors
    if (message.includes('500') || message.includes('server') || message.includes('internal')) {
      return {
        type: 'server',
        severity: 'high',
        recoverable: true,
        userMessage: 'Server error. Our team has been notified.',
        technicalMessage: 'Internal server error or service unavailable.',
      };
    }

    // Client-side React errors
    if (stack.includes('react') || message.includes('render') || message.includes('component')) {
      return {
        type: 'client',
        severity: 'medium',
        recoverable: true,
        userMessage: 'Something went wrong with the page display.',
        technicalMessage: 'React component error or rendering issue.',
      };
    }

    // Unknown errors
    return {
      type: 'unknown',
      severity: 'medium',
      recoverable: true,
      userMessage: 'An unexpected error occurred.',
      technicalMessage: 'Unclassified error type.',
    };
  }

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userId: localStorage.getItem('userId') || 'anonymous',
      };

      // Send to error reporting service
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private handleRetry = () => {
    const maxRetries = 3;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    // Progressive delay: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000;

    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  private handleReportIssue = () => {
    const { error, errorId } = this.state;
    const githubUrl = `https://github.com/yourusername/yourrepo/issues/new?title=Error%20Report&body=Error%20ID:%20${errorId}%0AError:%20${encodeURIComponent(error?.message || 'Unknown error')}`;
    window.open(githubUrl, '_blank');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { error, errorId, retryCount } = this.state;
    const category = this.categorizeError(error!);
    const maxRetries = 3;
    const canRetry = category.recoverable && retryCount < maxRetries;

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'critical': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-2xl border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-800 dark:text-red-200 mb-2">
              Oops! Something went wrong
            </CardTitle>
            <div className="flex justify-center space-x-2">
              <Badge className={`${getSeverityColor(category.severity)} border`}>
                {category.type} error
              </Badge>
              <Badge variant="outline" className="text-xs">
                {category.severity} severity
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-red-700 dark:text-red-300 mb-2">
                {category.userMessage}
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-700">
                    🔧 Developer Details
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 dark:bg-red-900 rounded text-xs">
                    <p><strong>Technical:</strong> {category.technicalMessage}</p>
                    <p><strong>Error ID:</strong> {errorId}</p>
                    <p><strong>Message:</strong> {error?.message}</p>
                    {error?.stack && (
                      <div className="mt-2">
                        <strong>Stack:</strong>
                        <pre className="mt-1 overflow-auto max-h-32 text-xs">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center space-x-2"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}</span>
                </Button>
              )}

              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reset</span>
              </Button>

              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Page</span>
              </Button>

              {this.props.showReportButton && (
                <Button
                  onClick={this.handleReportIssue}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Bug className="h-4 w-4" />
                  <span>Report Issue</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>Error ID: {errorId}</p>
              <p>If this problem persists, please contact support.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

// HOC for wrapping components with error boundary
export function withEnhancedErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    showReportButton?: boolean;
  }
) {
  return function WrappedComponent(props: P) {
    return (
      <EnhancedErrorBoundary {...options}>
        <Component {...props} />
      </EnhancedErrorBoundary>
    );
  };
}
