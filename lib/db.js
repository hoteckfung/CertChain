import mysql from "mysql2/promise";

// Database connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "mysql",
  database: process.env.MYSQL_DATABASE || "certchain",
};

// Function to create a database connection
export async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}

export default { connectToDatabase };
