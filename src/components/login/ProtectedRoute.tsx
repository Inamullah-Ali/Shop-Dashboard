// import { Navigate } from "react-router-dom";
// import { useAuth } from "./authContext";
// import type { JSX } from "react";

// export default function ProtectedRoute({ children }: { children: JSX.Element }) {
//   const { user, isLoggedIn } = useAuth();
//   if (!isLoggedIn) {
//     return <Navigate to="/" replace />;
//   }
//   if (user.role !== "admin" || user.status !== true) {
//     return <Navigate to="/" replace />;
//   }
//   return children;
// }

import { Navigate } from "react-router";
import { useAuth } from "./authContext";
import type { JSX } from "react";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
}
