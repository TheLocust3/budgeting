import React from "react";
import { useLocation, Navigate } from "react-router-dom";

import UserFrontend from "../frontend/user-frontend";

function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();

  if (UserFrontend.isAuthenticated()) {
    return children;
  } else {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
}

export default RequireAuth;
