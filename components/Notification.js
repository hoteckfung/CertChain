import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

/**
 * Notification component for displaying alerts
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether to show the notification
 * @param {string} props.type - Notification type ('success', 'error', 'warning', 'info')
 * @param {string} props.message - Notification message
 * @param {Function} props.onClose - Callback when notification is closed
 * @returns {React.ReactElement|null} Notification component or null if not shown
 */
const Notification = ({ show, type = "info", message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Handle animation
  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match transition duration

      return () => clearTimeout(timer);
    }
  }, [show]);

  // Don't render if not visible
  if (!show && !isVisible) {
    return null;
  }

  // Define notification styles based on type
  const notificationStyles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-500",
      text: "text-green-800",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-500",
      text: "text-red-800",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-500",
      text: "text-amber-800",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-500",
      text: "text-blue-800",
      icon: <Info className="h-5 w-5 text-blue-500" />,
    },
  };

  const styles = notificationStyles[type] || notificationStyles.info;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        show ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}>
      <div
        className={`min-w-80 max-w-96 w-auto shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${styles.bg} border-l-4 ${styles.border}`}>
        <div className="flex-1 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">{styles.icon}</div>
            <div className="ml-3 flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${styles.text} break-words leading-relaxed`}>
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={onClose}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
