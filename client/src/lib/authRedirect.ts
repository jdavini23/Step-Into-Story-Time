export const handleAuthRedirect = (showToast: (options: any) => void) => {
  showToast({
    title: "Session Required",
    description: "Redirecting to login...",
    variant: "destructive",
  });

  setTimeout(() => {
    window.location.href = "/api/login";
  }, 500);
};

export const handleUnauthorizedError = (
  error: Error,
  showToast: (options: any) => void,
) => {
  showToast({
    title: "Session Expired",
    description: "Redirecting to login...",
    variant: "destructive",
  });

  setTimeout(() => {
    window.location.href = "/api/login";
  }, 500);
};
