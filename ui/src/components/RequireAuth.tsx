import React from "react";
import { useLocation, Navigate } from "react-router-dom";

import UserFrontend from "../frontend/user-frontend";

function RequireAuth() {
  const location = useLocation();

  if (!UserFrontend.isAuthenticated() && location.pathname !== "/login") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  } else {
    return <div />;
  }
}

export default RequireAuth;
