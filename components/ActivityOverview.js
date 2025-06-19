import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  FileText,
  Ban,
  User,
  Shield,
  Activity,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// Activity configurations matching your CertChain system
const ACTIVITY_CONFIGS = {
  user_login: {
    label: "User Authentication",
    icon: User,
    badge: "Blockchain",
    badgeColor: "bg-purple-100 text-purple-800",
    description: "Wallet connections and user sessions",
    color: "#8B5CF6",
  },
  certificate_issued: {
    label: "Certificate Issuance",
    icon: FileText,
    badge: "Live Data",
    badgeColor: "bg-green-100 text-green-800",
    description: "Real-time certificate minting on blockchain",
    color: "#10B981",
  },
  certificate_revoked: {
    label: "Certificate Revocation",
    icon: Ban,
    badge: "Live Data",
    badgeColor: "bg-red-100 text-red-800",
    description: "Certificate revocation events",
    color: "#EF4444",
  },
};

export default function ActivityOverview({ className = "" }) {
  const [activityStats, setActivityStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch activity statistics
  const fetchActivityStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recent activity data for statistics
      const response = await fetch("/api/activity/get-logs?limit=100");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch activity data");
      }

      // Process activity statistics
      const stats = processActivityStats(data.logs);
      setActivityStats(stats);

      // Generate weekly timeline data
      const weeklyTimeline = generateWeeklyTimeline(data.logs);
      setWeeklyData(weeklyTimeline);
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Process activity logs into statistics
  const processActivityStats = (logs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(
      today.getTime() - today.getDay() * 24 * 60 * 60 * 1000
    );

    const stats = {
      today: { total: 0, byType: {} },
      thisWeek: { total: 0, byType: {} },
      total: { total: 0, byType: {} },
    };

    logs.forEach((log) => {
      const logDate = new Date(log.created_at);
      const activityType = log.action?.toLowerCase();

      // Initialize counters
      ["today", "thisWeek", "total"].forEach((period) => {
        if (!stats[period].byType[activityType]) {
          stats[period].byType[activityType] = 0;
        }
      });

      // Count total activities
      stats.total.total++;
      stats.total.byType[activityType]++;

      // Count this week's activities
      if (logDate >= thisWeek) {
        stats.thisWeek.total++;
        stats.thisWeek.byType[activityType]++;
      }

      // Count today's activities
      if (logDate >= today) {
        stats.today.total++;
        stats.today.byType[activityType]++;
      }
    });

    return stats;
  };

  // Generate weekly timeline data for chart
  const generateWeeklyTimeline = (logs) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const weekData = [];

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayLogs = logs.filter((log) => {
        const logDate = new Date(log.created_at);
        return logDate >= dayStart && logDate <= dayEnd;
      });

      weekData.push({
        day: days[dayStart.getDay()],
        date: dayStart.toISOString().split("T")[0],
        total: dayLogs.length,
        user_login: dayLogs.filter((l) => l.action === "USER_LOGIN").length,
        certificate_issued: dayLogs.filter(
          (l) => l.action === "CERTIFICATE_ISSUED"
        ).length,
        certificate_revoked: dayLogs.filter(
          (l) => l.action === "CERTIFICATE_REVOKED"
        ).length,
      });
    }

    return weekData;
  };

  // Load data on component mount
  useEffect(() => {
    fetchActivityStats();
  }, []);

  // Format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  // Get activity count for display
  const getActivityCount = (activityType) => {
    if (!activityStats) return 0;
    const typeKey = activityType.toLowerCase();
    return activityStats.thisWeek.byType[typeKey] || 0;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">
              Loading activity data...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Failed to load activity data: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Overview
        </CardTitle>
        <p className="text-sm text-gray-600">
          View detailed activity logs in the Activity Log tab
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Activity Types Overview */}
        <div className="space-y-3">
          {Object.entries(ACTIVITY_CONFIGS).map(([key, config]) => {
            const Icon = config.icon;
            const count = getActivityCount(key);

            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="text-xs text-gray-500">
                      {config.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {formatNumber(count)}
                  </span>
                  <Badge className={config.badgeColor}>{config.badge}</Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Activity Stats */}
        {activityStats && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(activityStats.today.total)}
              </p>
              <p className="text-xs text-blue-600">Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(activityStats.thisWeek.total)}
              </p>
              <p className="text-xs text-blue-600">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(activityStats.total.total)}
              </p>
              <p className="text-xs text-blue-600">All Time</p>
            </div>
          </div>
        )}

        {/* Activity Timeline Chart */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-700">
              Activity Timeline
            </p>
          </div>

          {weeklyData.length > 0 ? (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-gray-600">{data.date}</p>
                            <p className="text-sm">
                              <span className="font-medium">
                                Total Activities:{" "}
                              </span>
                              {data.total}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="#3B82F6"
                    radius={[2, 2, 0, 0]}
                    stroke="#2563EB"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-sm text-gray-500">
                No activity data available
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
