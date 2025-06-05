
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
        throw new Error("Failed to fetch CSRF token");
      }

      const data = await response.json();
      setState({
        token: data.csrfToken,
        loading: false,
        error: null,
      });
    } catch (error) {
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
