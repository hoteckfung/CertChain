/**
 * This endpoint is deprecated and no longer functional.
 * The localStorage migration mechanism has been removed.
 * All certificates are now stored directly in the database.
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("⚠️ Deprecated migrate-localStorage API was called");

  // Return a success response to prevent errors, but don't actually do anything
  res.status(200).json({
    success: true,
    message:
      "Migration system has been deprecated. All certificates are now stored directly in the database.",
    summary: {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
    },
    results: [],
  });
}
