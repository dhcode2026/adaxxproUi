import React from "react";
import { Navigate } from "react-router-dom";
import { getUserRoles, isSuperAdmin } from "../utils/roleHelper";

/**
 * ProtectedRoute - Controls access to routes based on user roles and authentication
 * @param {JSX.Element} element - The component to render
 * @param {Array} allowedRoles - Array of roles that can access this route
 * @param {Array} restrictedRoles - Array of roles that cannot access this route
 * @param {string} redirectPath - Path to redirect to if access is denied (default: "/")
 */
const ProtectedRoute = ({
  element,
  allowedRoles,
  restrictedRoles,
  redirectPath = "/",
}) => {
  // Check if user is authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = getUserRoles();
  if (!userRoles || userRoles.length === 0) {
    //return <Navigate to="/login" replace />;
  }

  // Block restricted roles first (explicit deny)
  if (restrictedRoles && restrictedRoles.length > 0) {
    const hasRestrictedRole = restrictedRoles.some((role) =>
      userRoles.includes(role)
    );
    if (hasRestrictedRole) {
      return <Navigate to={redirectPath} replace />;
    }
  }
  const superAdmin = isSuperAdmin();
  if (!superAdmin) {
    if (allowedRoles && allowedRoles.length > 0) {
      const hasAllowedRole = allowedRoles.some((role) => userRoles.includes(role));
      if (!hasAllowedRole) {
        return <Navigate to={redirectPath} replace />;
      }
    }
  }

  return element;
};

export default ProtectedRoute;
