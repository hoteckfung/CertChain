/**
 * Utility functions for handling blockchain transaction errors
 */

/**
 * Check if an error is a user rejection (MetaMask cancellation)
 * @param {Error|Object} error - The error object to check
 * @returns {boolean} - True if the error is a user rejection
 */
export const isUserRejectionError = (error) => {
  if (!error) return false;

  // Check main error properties
  if (
    error.code === "ACTION_REJECTED" ||
    error.code === 4001 ||
    error.reason === "rejected"
  ) {
    return true;
  }

  // Check error message patterns
  if (error.message) {
    if (
      error.message.includes("user rejected") ||
      error.message.includes("User denied transaction") ||
      error.message.includes("ACTION_REJECTED") ||
      error.message.includes("ethers-user-denied") ||
      error.message.includes(
        "MetaMask Tx Signature: User denied transaction signature"
      ) ||
      error.message.includes("User denied")
    ) {
      return true;
    }
  }

  // Check nested error info (common in ethers v6)
  if (error.info && error.info.error) {
    if (
      error.info.error.code === 4001 ||
      (error.info.error.message &&
        (error.info.error.message.includes("User denied") ||
          error.info.error.message.includes("ethers-user-denied") ||
          error.info.error.message.includes(
            "MetaMask Tx Signature: User denied transaction signature"
          )))
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Check if a result object indicates a user rejection
 * @param {Object} result - Result object from a blockchain function
 * @returns {boolean} - True if the result indicates user rejection
 */
export const isResultUserRejection = (result) => {
  return (
    result?.userRejected === true ||
    (result?.error && result.error.includes("Transaction was rejected by user"))
  );
};
