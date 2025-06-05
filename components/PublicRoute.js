import React from "react";

// PublicRoute component - ensures pages are accessible without authentication
// This is specifically for the verifier access which should be public
const PublicRoute = ({ children }) => {
  // No authentication checks needed - simply render the children
  return <>{children}</>;
};

export default PublicRoute;
