import React, { useState, useEffect } from "react";
import { Button, Input, FormGroup, Label } from "reactstrap";
import { useViewContext } from "./ViewContext.jsx";
import { useNavigate } from "react-router-dom";
import routes from "./routes.js";
import { RUN_API_URL } from "./consts.jsx";
import logo from "../src/assets/img/adxpro.png";
import Swal from "sweetalert2";
import { signin, syncTokenToAxios, GetAccess } from "../src/views/api/Api.jsx";
import { useGlobalTabs } from "./context/TabContext";
import axios from "axios";
import menuRoutes from "./utils/routeConstent.js";
import warningIcon from "../src/assets/img/warning_triangle_small.png";

const buildRouteLookup = (routeItems = []) => {
  const lookup = {};

  const visit = (items = []) => {
    items.forEach((item) => {
      if (!item) return;

      if (item.views && Array.isArray(item.views)) {
        visit(item.views);
        return;
      }

      if (item.name && item.path) {
        const fullPath = `${item.layout || ""}${item.path}`;
        lookup[item.name] = fullPath;
      }
    });
  };

  visit(routeItems);
  return lookup;
};

const routeLookupFromConfig = buildRouteLookup(routes);

const LoginModal = (props) => {
  const { refreshUser } = useGlobalTabs();
  const vx = useViewContext();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [remembered, setRemembered] = useState(false);
  const showValidationError = async (message) => {
    await Swal.fire({
      html: `
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
          <img src="${warningIcon}"
            style="width:18px;height:18px;"
            alt="Warning"
          />
          <span style="font-size:16px;font-weight:bold;">Error</span>
        </div>
        <div style="margin-top:10px;font-size:13px;text-align:center;">
          ${message}
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      width: 320,
      padding: "1em",
    });
  };

  useEffect(() => {
    const handleEnterKey = (e) => {
      if (e.key === "Enter") {
        login();
      }
    };

    document.addEventListener("keydown", handleEnterKey);

    return () => {
      document.removeEventListener("keydown", handleEnterKey);
    };
  }, [name, password]);

  const login = async (e) => {
    if (e) e.preventDefault();
    if (!name || !password) {
      await showValidationError("All fields are required");
      return;
    }

    try {
      const payload = { email: name, password: password };
      const response = await signin(payload);
      const data = response.data;

      if (!data || !data.token) {
        await showValidationError("Invalid email or password");
        return;
      }
      localStorage.setItem("username", data.username || name);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("token", data.token);
      localStorage.setItem("roles", JSON.stringify(data.roles || []));
      localStorage.setItem("roleId", data.roleId);
      localStorage.setItem("agencyId", data.agencyId !== null && data.agencyId !== undefined ? data.agencyId : "null");
      localStorage.setItem("advertiserId", data.advertiserId !== null && data.advertiserId !== undefined ? data.advertiserId : "null");
      localStorage.setItem("advertiserListResponse", JSON.stringify(data.advertiserListResponse || []));
      localStorage.setItem("accountManager", JSON.stringify(data.accountManager || {}));
      syncTokenToAxios();
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      axios.defaults.headers.common["user_id"] = data.userId;

      (async () => {
        try {
          console.log("⏱️ Calling GetAccess...");
          const accessResponse = await GetAccess({});

          console.log("📊 GetAccess Full Response:", accessResponse);
          if (accessResponse && accessResponse.data) {
            let accessArray = [];
            if (Array.isArray(accessResponse.data)) {
              accessArray = accessResponse.data;
            } else if (Array.isArray(accessResponse.data.data)) {
              accessArray = accessResponse.data.data;
            } else if (accessResponse.data.menus && Array.isArray(accessResponse.data.menus)) {
              accessArray = accessResponse.data.menus;
            }
            let dashboardAccessible = false;
            let firstAccessibleMenuName = null;
            let firstAccessibleRoute = null;
            const processedAccessKeys = new Set();

            const getRouteForAccessItem = (item) => {
              const accessName = item?.subMenuName || item?.menuName;
              if (!accessName) return null;
              return menuRoutes[accessName] || routeLookupFromConfig[accessName] || `/admin/${accessName.toLowerCase().replace(/\s+/g, "-")}`;
            };

            accessArray.forEach(item => {
              if (!item) return;

              const hasAccess = item.canView === 1 || item.canCreate === 1 ||
                item.canUpdate === 1 || item.canDelete === 1 ||
                item.canReport === 1;

              if (!hasAccess) return;

              if (item.menuName === "Dashboard" && item.subMenuId === null) {
                dashboardAccessible = true;
                console.log("✓ Dashboard is accessible");
              }

              const accessKey = item.subMenuId !== null && item.subMenuId !== undefined
                ? `${item.menuId}_${item.subMenuId}`
                : `${item.menuId}`;

              if (item.menuName !== "Dashboard" && !processedAccessKeys.has(accessKey)) {
                const route = getRouteForAccessItem(item);
                if (route) {
                  firstAccessibleMenuName = item.subMenuName || item.menuName;
                  firstAccessibleRoute = route;
                  processedAccessKeys.add(accessKey);
                  console.log(`✓ First accessible menu found: "${firstAccessibleMenuName}" -> ${firstAccessibleRoute}`);
                }
              }
            });
            const flattenedMenus = [];
            const processedMenus = new Set();

            accessArray.forEach(item => {
              if (!item) return;

              // For submenu items
              if (item.subMenuId !== null && item.subMenuId !== undefined && item.subMenuName) {
                const menuName = item.subMenuName;
                const key = `${item.menuId}_${item.subMenuId}`;

                if (!processedMenus.has(key)) {
                  flattenedMenus.push({
                    menuName: menuName,
                    subMenuName: menuName,
                    create: item.canCreate || 0,
                    view: item.canView || 0,
                    edit: item.canEdit || 0,
                    canEdit: item.canEdit || 0,
                    update: item.canUpdate || 0,
                    delete: item.canDelete || 0,
                    canDelete: item.canDelete || 0,
                    report: item.canReport || 0,
                    canReport: item.canReport || 0,
                    approve: item.canApprove || 0,
                    canApprove: item.canApprove || 0,
                    menuId: item.menuId,
                    subMenuId: item.subMenuId,
                    parentMenuName: item.menuName
                  });
                  processedMenus.add(key);
                }
              } else if (item.subMenuId === null || item.subMenuId === undefined) {
                // For parent menus
                const menuName = item.menuName;
                const key = `${item.menuId}`;

                if (!processedMenus.has(key) && menuName) {
                  flattenedMenus.push({
                    menuName: menuName,
                    create: item.canCreate || 0,
                    view: item.canView || 0,
                    edit: item.canEdit || 0,
                    canEdit: item.canEdit || 0,
                    update: item.canUpdate || 0,
                    delete: item.canDelete || 0,
                    canDelete: item.canDelete || 0,
                    report: item.canReport || 0,
                    canReport: item.canReport || 0,
                    approve: item.canApprove || 0,
                    canApprove: item.canApprove || 0,
                    menuId: item.menuId,
                    subMenuId: null
                  });
                  processedMenus.add(key);
                }
              }
            });

            if (flattenedMenus.length > 0) {
              console.log("✓ Valid access data structure. Menus count:", flattenedMenus.length);
              localStorage.setItem("accessData", JSON.stringify({ menus: flattenedMenus }));
              console.log("✓ GetAccess data saved to localStorage");
            } else {
              console.warn("⚠️ No menus found.");
            }
            let redirectRoute = "/admin/dashboard";
            if (dashboardAccessible) {
              redirectRoute = "/admin/dashboard";
              console.log(`📍 Dashboard is accessible. User redirecting to: ${redirectRoute}`);
            } else if (firstAccessibleRoute) {
              redirectRoute = firstAccessibleRoute;
              console.log(`📍 Dashboard is NOT accessible. User redirecting to first accessible menu: ${firstAccessibleMenuName} -> ${redirectRoute}`);
            } else {
              console.warn("⚠️ User has no accessible menus. Redirecting to Dashboard as fallback.");
            }

            navigate(redirectRoute, { replace: true });
          } else {
            console.error("✗ No data in GetAccess response");
            navigate('/admin/dashboard', { replace: true });
          }
        } catch (error) {
          console.error("✗ Error calling GetAccess:", error);
          navigate('/admin/dashboard', { replace: true });
        }
      })();
    } catch (error) {
      console.error("login error", error);
      await showValidationError("Login failed. Please check credentials.");
    }
  };

  return (
    <div style={styles.page}>
      <div className="loginbox">
        <div style={styles.logo} className="logo">
          <img
            src={logo}
            alt="logo"
            style={{
              width: "250px",
              height: "auto",
              objectFit: "contain",
              display: "block"
            }}
          />
        </div>


        <form onSubmit={login}>
          <FormGroup>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              className="loginname"
              placeholder="Username"
            />
          </FormGroup>

          <FormGroup>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              className="loginname"
              placeholder="Password"
            />
          </FormGroup>

          <Button
            type="submit"
            className="loginbutton"
            style={styles.button}
          >
            Log in
          </Button>
        </form>

        <FormGroup style={styles.rememberGroup}>
          <Label style={styles.rememberLabel}>
            <Input
              type="checkbox"
              checked={remembered}
              onChange={() => setRemembered(!remembered)}
            />
            <span style={styles.rememberText}>Remember Me</span>
          </Label>
        </FormGroup>

        <div className="forgot">
          <a href="/forgot-password" className="forgetpassword">
            Forgot your password?
          </a>
        </div>

        <div className="footers">
          <small>
            © All Rights Reserved.{" "}
            <a
              href="https://adaxx.com/terms-and-conditions/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#e73f32" }}
            >
              Privacy
            </a>{" "}
            and{" "}
            <a
              href="https://adaxx.com/terms-and-conditions/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#e73f32" }}
            >
              Terms
            </a>
          </small>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: "#ffffff",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  logo: {
    display: "flex",
    justifyContent: "center",
    padding: "10px"
  },
  button: {
    width: "100%",
    marginTop: 20
  },
  rememberGroup: {
    display: "flex",
    justifyContent: "center",
    marginTop: 10
  },
  rememberLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer"
  },
  rememberText: {
    fontSize: "14px"
  }
};

export default LoginModal;
