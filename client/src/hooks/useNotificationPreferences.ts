import { useState, useEffect } from "react";

const STORAGE_KEY = "dismissed_notifications";

export function useNotificationPreferences() {
  const [dismissedNotifications, setDismissedNotifications] = useState<
    string[]
  >([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDismissedNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to load notification preferences:", error);
    }
  }, []);

  const dismissNotification = (id: string) => {
    const updated = [...dismissedNotifications, id];
    setDismissedNotifications(updated);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save notification preference:", error);
    }
  };

  const clearAllDismissed = () => {
    setDismissedNotifications([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear notification preferences:", error);
    }
  };

  const isDismissed = (id: string) => dismissedNotifications.includes(id);

  return {
    dismissedNotifications,
    dismissNotification,
    clearAllDismissed,
    isDismissed,
  };
}
