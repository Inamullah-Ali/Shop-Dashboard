
import { Navigate } from "react-router";
import { useAuth } from "./authContext";
import type { JSX } from "react";

export default function UnProtectedRoute({ children }: { children: JSX.Element }) {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
