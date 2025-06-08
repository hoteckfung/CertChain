import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

// Performance monitoring component for authentication operations
const PerformanceMonitor = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    roleVerifications: 0,
    cacheHits: 0,
    apiCalls: 0,
    avgResponseTime: 0,
    lastUpdate: null,
  });

  useEffect(() => {
    // Monitor performance in development mode
    if (process.env.NODE_ENV === "development") {
      const interval = setInterval(async () => {
        try {
          const start = Date.now();
          const response = await fetch("/api/auth/verify-role", {
            method: "GET",
            credentials: "include",
          });
          const end = Date.now();

          if (response.ok) {
            setMetrics((prev) => ({
              ...prev,
              roleVerifications: prev.roleVerifications + 1,
              avgResponseTime:
                (prev.avgResponseTime * prev.apiCalls + (end - start)) /
                (prev.apiCalls + 1),
              apiCalls: prev.apiCalls + 1,
              lastUpdate: new Date().toISOString(),
            }));
          }
        } catch (error) {
          console.error("Performance monitoring error:", error);
        }
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== "development" || !user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs max-w-xs opacity-75 hover:opacity-100 transition-opacity">
      <div className="font-bold mb-1">🔧 Auth Performance</div>
      <div>Role Verifications: {metrics.roleVerifications}</div>
      <div>Avg Response: {metrics.avgResponseTime.toFixed(0)}ms</div>
      <div>Cache Status: Active</div>
      <div>User Role: {user.role}</div>
      {metrics.lastUpdate && (
        <div className="text-gray-300 mt-1">
          Last: {new Date(metrics.lastUpdate).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
