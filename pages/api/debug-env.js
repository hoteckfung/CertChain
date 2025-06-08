export default function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  res.status(200).json({
    env: {
      MYSQL_HOST: process.env.MYSQL_HOST ? "✅ Set" : "❌ Missing",
      MYSQL_PORT: process.env.MYSQL_PORT ? "✅ Set" : "❌ Missing",
      MYSQL_USER: process.env.MYSQL_USER ? "✅ Set" : "❌ Missing",
      MYSQL_PASSWORD: process.env.MYSQL_PASSWORD ? "✅ Set" : "❌ Missing",
      MYSQL_DATABASE: process.env.MYSQL_DATABASE ? "✅ Set" : "❌ Missing",
    },
    values: {
      MYSQL_HOST: process.env.MYSQL_HOST || "undefined",
      MYSQL_PORT: process.env.MYSQL_PORT || "undefined",
      MYSQL_USER: process.env.MYSQL_USER || "undefined",
      MYSQL_DATABASE: process.env.MYSQL_DATABASE || "undefined",
      // Don't expose password in debug
    },
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
