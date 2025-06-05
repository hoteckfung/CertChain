import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ProtectedRoute from "../../components/ProtectedRoute";
import { ROLES } from "../../utils/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import mysql from "../../utils/mysql";
import { Loader2 } from "lucide-react";

export default function AdminDatabasePage() {
  const [dbStatus, setDbStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { connected, error } = await mysql.checkConnection();
        setDbStatus(connected ? "connected" : "error");
      } catch (error) {
        console.error("Error checking connection:", error);
        setDbStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Database Management | Admin Dashboard</title>
          <meta name="description" content="View database connection status" />
        </Head>

        <main className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-8">Database Management</h1>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Status</CardTitle>
                  <CardDescription>
                    Current connection status to your MySQL database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-4">
                    <div
                      className={`h-3 w-3 rounded-full mr-2 ${
                        dbStatus === "connected" ? "bg-green-500" : "bg-red-500"
                      }`}></div>
                    <span>
                      {dbStatus === "connected" ? "Connected" : "Not Connected"}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md border">
                    <h3 className="font-medium mb-2">Connection Details:</h3>
                    <div className="text-sm text-gray-600">
                      <p>Host: {process.env.MYSQL_HOST || "localhost"}</p>
                      <p>
                        Database: {process.env.MYSQL_DATABASE || "certchain"}
                      </p>
                      <p>User: {process.env.MYSQL_USER || "root"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
