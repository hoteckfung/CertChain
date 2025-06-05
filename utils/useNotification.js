import { useState } from "react";

/**
 * Custom hook for managing notification state
 * @returns {Object} Notification state and methods
 */
export default function useNotification() {
  const [notification, setNotification] = useState({
    show: false,
    type: "info", // 'success', 'error', 'warning', 'info'
    message: "",
    duration: 5000, // Default duration in ms
  });

  /**
   * Show a notification
   * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
   * @param {string} message - Notification message
   * @param {number} duration - Duration in ms (optional)
   */
  const showNotification = (type, message, duration = 5000) => {
    setNotification({
      show: true,
      type,
      message,
      duration,
    });

    // Auto-hide notification after duration
    if (duration > 0) {
      setTimeout(() => {
        hideNotification();
      }, duration);
    }
  };

  /**
   * Hide the current notification
   */
  const hideNotification = () => {
    setNotification((prev) => ({
      ...prev,
      show: false,
    }));
  };

  /**
   * Show a success notification
   * @param {string} message - Notification message
   * @param {number} duration - Duration in ms (optional)
   */
  const showSuccess = (message, duration) => {
    showNotification("success", message, duration);
  };

  /**
   * Show an error notification
   * @param {string} message - Notification message
   * @param {number} duration - Duration in ms (optional)
   */
  const showError = (message, duration) => {
    showNotification("error", message, duration);
  };

  /**
   * Show a warning notification
   * @param {string} message - Notification message
   * @param {number} duration - Duration in ms (optional)
   */
  const showWarning = (message, duration) => {
    showNotification("warning", message, duration);
  };

  /**
   * Show an info notification
   * @param {string} message - Notification message
   * @param {number} duration - Duration in ms (optional)
   */
  const showInfo = (message, duration) => {
    showNotification("info", message, duration);
  };

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
