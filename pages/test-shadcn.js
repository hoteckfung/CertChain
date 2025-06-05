import React from "react";
import Head from "next/head";

// Import with relative paths
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

export default function TestShadcn() {
  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Test Shadcn</title>
      </Head>

      <h1 className="text-3xl font-bold mb-6">Testing Shadcn Components</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-4">Button Component</h2>
          <div className="flex gap-2">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Card Component</h2>
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card Description</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card Content goes here</p>
            </CardContent>
            <CardFooter>
              <Button>Card Action</Button>
            </CardFooter>
          </Card>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Alert Component</h2>
          <Alert>
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              This is an informational alert for testing purposes.
            </AlertDescription>
          </Alert>
        </section>
      </div>
    </div>
  );
}
