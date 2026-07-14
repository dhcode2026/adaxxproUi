
import React from "react";
import ReactDOM from "react-dom";
import { createBrowserHistory } from "history";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from "./layouts/Admin/Admin.jsx";
import "./assets/css/nucleo-icons.css";
import routes from "./routes.js";
import LoginModal from './LoginModal.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import ResetPassword from './ResetPassword.jsx';
import { useViewContext } from './ViewContext.jsx';
import { getUserRoles } from './utils/roleHelper.js';
import ConversionEditor from './views/editors/ConversionEditor.jsx';
import DealsEditor from './views/editors/DealsEditor.jsx';
import LinkedAdsEditor from './views/editors/LinkedAdsEditor.jsx';
import InventoryEditor from './views/editors/InventoryEditor.jsx';
import { ModuleRegistry } from "ag-grid-community";
import { TabProvider } from './context/TabContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import axios from 'axios';
import './views/api/Api.jsx';
ModuleRegistry.registerModules([]);
const hist = createBrowserHistory();
const restoreAuthState = () => {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  if (userId) {
    axios.defaults.headers.common["user_id"] = userId;
  }
  console.log("✓ index.js: Auth state restored. Token:", token ? "present" : "missing", "| UserId:", userId ? "present" : "missing");
};
restoreAuthState();
document.body.classList.add("white-content");
const contextValue = {};
const getRoutes = (routes) => {
  return routes.flatMap((prop, key) => {
    if (prop.views) {
      return getRoutes(prop.views);
    }
    if (prop.layout === "/admin" && prop.path && prop.component) {
      return (
        <Route
          key={key}
          path={prop.layout + prop.path}
          element={
            <ProtectedRoute
              element={<prop.component />}
              allowedRoles={prop.allowedRoles}
              restrictedRoles={prop.restrictedRoles}
              redirectPath="/"
            />
          }
        />
      );
    }
    return [];
  });
};
const ProtectedRoutes = () => {
  const userLoggedin = localStorage.getItem("token");
  const userRoles = getUserRoles();
  
  if (!userLoggedin || !userRoles || userRoles.length === 0) {
    return <LoginModal />;
  }
  const isRestrictedRole = userRoles.includes("ROLE_READ_ONLY") || userRoles.includes("ROLE_READ_WRITE");
  if (isRestrictedRole) {
    const brandId = localStorage.getItem("userBrandId");
    return <Navigate to={`/admin/grouplist/${brandId}`} replace />;
  }
  
  return <Navigate to="/admin/dashboard" replace />;
};

ReactDOM.render(
  <BrowserRouter>
  <TabProvider>
    <useViewContext.Provider value={contextValue}>
      <Routes>
        <Route path="/login" element={<LoginModal />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uuid" element={<ResetPassword />} />
        <Route path="/" element={<ProtectedRoutes />} />
        <Route path="/admin" element={<AdminLayout />}>
          {getRoutes(routes)}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </useViewContext.Provider>
    </TabProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
