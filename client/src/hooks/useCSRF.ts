
import { useState, useEffect } from "react";

interface CSRFState {
  token: string | null;
  loading: boolean;
  error: string | null;
}

export function useCSRF() {
  const [state, setState] = useState<CSRFState>({
    token: null,
    loading: true,
    error: null,
  });

  const fetchCSRFToken = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch("/api/csrf-token", {
        credentials: "include",
      });

      if (!response.ok) {
        // For non-critical errors, still allow the app to function
        console.warn(`CSRF token fetch failed with status ${response.status}`);
        setState({
          token: null,
          loading: false,
          error: `HTTP ${response.status}`,
        });
        return;
      }

      const data = await response.json();
      setState({
        token: data.csrfToken,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("CSRF token fetch error:", error);
      setState({
        token: null,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const refreshToken = () => {
    fetchCSRFToken();
  };

  useEffect(() => {
    fetchCSRFToken();
  }, []);

  return {
    token: state.token,
    loading: state.loading,
    error: state.error,
    refreshToken,
  };
}
