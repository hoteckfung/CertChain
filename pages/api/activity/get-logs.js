import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      page = 1,
      limit = 50,
      type,
      walletAddress,
      startDate,
      endDate,
      searchTerm,
    } = req.query;

    // Build filters for the getActivityLogs function
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Use the existing getActivityLogs function from mysql utils
    const { data: logs, error } = await mysql.getActivityLogs(
      parseInt(limit),
      offset,
      null, // userIdFilter - not used in this context
      type && type !== "all" ? type : null, // categoryFilter
      null // actionFilter
    );

    if (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    // Apply additional filtering that isn't supported by the base function
    let filteredLogs = logs || [];

    if (walletAddress) {
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.wallet_address === walletAddress ||
          log.target_wallet_address === walletAddress
      );
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.created_at) >= new Date(startDate)
      );
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.created_at) <= new Date(endDate)
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log) =>
          (log.details && log.details.toLowerCase().includes(searchLower)) ||
          (log.wallet_address &&
            log.wallet_address.toLowerCase().includes(searchLower)) ||
          (log.target_wallet_address &&
            log.target_wallet_address.toLowerCase().includes(searchLower))
      );
    }

    // Get total count (approximation since we're filtering after query)
    const totalCount = filteredLogs.length;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Handle date conversion safely
    const processedLogs = filteredLogs.map((log) => {
      let created_at;
      if (log.created_at instanceof Date) {
        created_at = log.created_at.toISOString();
      } else if (typeof log.created_at === "string") {
        // Try to parse as date string
        const dateObj = new Date(log.created_at);
        created_at = isNaN(dateObj.getTime())
          ? log.created_at
          : dateObj.toISOString();
      } else {
        // Handle invalid/missing created_at without corrupting data
        console.warn(
          `Invalid created_at format for log ${log.id}:`,
          typeof log.created_at,
          log.created_at
        );
        // Keep original value or set to null to indicate invalid data
        created_at = log.created_at || null;
      }

      return {
        ...log,
        created_at,
      };
    });

    res.status(200).json({
      success: true,
      logs: processedLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({
      error: "Failed to fetch activity logs",
      details: error.message,
    });
  }
}
