import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Outlet, useLocation, Navigate } from "react-router-dom";
import LoginModal from "../../LoginModal";
import { useNavigate } from "react-router-dom";
import RequestModal from "./RequestSupport.jsx"
import CreativePolicies from "./CreativePolicies.jsx";
import AccountRepresent from "./AccountRep.jsx";
import ContactInfo from "./ContactInfo.jsx";
import ChangePassword from "./ChangePassword.jsx";
import { useGlobalTabs } from "../../context/TabContext";
import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import { Button, Input, FormGroup, Label } from "reactstrap";
import routes from "../../routes.js";
import { useViewContext } from "../../ViewContext";
import { getUserRoles } from "../../utils/roleHelper.js";
import logo from "../../assets/img/adxpro.png";
import { FaUser } from "react-icons/fa";
import { edituser, syncTokenToAxios } from "../../views/api/Api";
import axios from "axios";
import { hasAnyAccess } from "../../utils/permissionHelper";

const Admin = (props) => {
  const navigate = useNavigate();
  const [userLoggedin, setUserLoggedin] = useState(localStorage.getItem("token"));
  const [firstName, setFirstName] = useState("");
  const { globalTabsList, addTab, setActiveTabValue } = useGlobalTabs();

  const TOKEN_EXPIRY_TIME = 30 * 60 * 1000;
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    setUserLoggedin(token);
    if (token) {
      syncTokenToAxios();
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      if (userId) {
        axios.defaults.headers.common["user_id"] = userId;
      }
      console.log("✓ Admin component: Token and userId synced to axios");
    }
  }, []);

  if (userLoggedin) {
  }

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      edituser(userId)
        .then((response) => {
          if (
            response.data &&
            response.data.data &&
            response.data.data.informationUsers &&
            response.data.data.informationUsers.length > 0
          ) {
            const user = response.data.data.informationUsers[0];
            setFirstName(user.firstName);
          }
        })
        .catch((error) => {
          console.error("Error fetching user data in Admin layout:", error);
        });
    }
  }, []);

  const location = useLocation();
  useEffect(() => {
    const userRoles = getUserRoles();
    const isRestrictedRole = userRoles.includes("ROLE_READ_ONLY") || userRoles.includes("ROLE_READ_WRITE");

    if (isRestrictedRole) {
      const path = location.pathname;
      const allowedPatterns = [
        '/admin/grouplist',
        '/admin/group/',
        '/admin/audience',
        '/admin/crmaudience',
        '/admin/conversion',
        '/admin/universalpixel',
        '/admin/creatives',
        '/admin/campaign-editor',
        '/admin/PacingList',
        '/admin/logs',
      ];
      const isAllowedPage = allowedPatterns.some(pattern => path.includes(pattern));

      if (!isAllowedPage) {
        const brandId = localStorage.getItem("userBrandId");
        if (brandId) {
          navigate(`/admin/grouplist/${brandId}`, { replace: true });
        }
      }
    }
  }, [location.pathname, navigate]);
  const useTokenExpiry = () => {
    useEffect(() => {
      const checkTokenExpiry = () => {
        console.log("Check expire");
        const savedAt = parseInt(localStorage.getItem("tokenSavedAt"), 10);
        const now = Date.now();

        if (savedAt && now - savedAt > TOKEN_EXPIRY_TIME) {
          localStorage.removeItem("token");
          localStorage.removeItem("tokenSavedAt");
          localStorage.removeItem("username");
          localStorage.removeItem("userId");
          localStorage.removeItem("roles");
          localStorage.removeItem("brandId");
          localStorage.removeItem("brandNameMap");
          localStorage.removeItem("userBrandId");
          localStorage.removeItem("login_username");
          localStorage.removeItem("currentBrandName");
          localStorage.removeItem("currentBrandId");
          localStorage.removeItem("currentGroupName");
          localStorage.removeItem("currentGroupId");
          localStorage.removeItem("brands");
          window.location.href = location.pathname;
        }
      };

      checkTokenExpiry();
      const interval = setInterval(checkTokenExpiry, 60 * 1000);
      return () => clearInterval(interval);
    }, [location.pathname]);
  };
  useTokenExpiry();
  const [open, setOpen] = useState(false);
  const [openCreativePolicies, setOpenCreativePolicies] = useState(false);
  const [openAccountRepresent, setOpenAccountRepresent] = useState(false);
  const [openContactInfo, setOpenContactInfo] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("blue");
  const [sidebarOpened, setSidebarOpened] = useState(
    document.documentElement.className.indexOf("nav-open") !== -1
  );
  const toggleSidebar = () => {
    document.documentElement.classList.toggle("nav-open");
    setSidebarOpened(!sidebarOpened);
  };
  const hideSidebarPaths = ["/admin/campaign-editor"];
  const shouldHideSidebar = hideSidebarPaths.some((path) =>
    location.pathname.startsWith(path)
  );
  const hasAccess = hasAnyAccess();
  const billingRef = useRef(null);
  const accountRef = useRef(null);
  const openBillingDropdown = () => setShowBillingDropdown(true);
  const openAccountDropdown = () => setShowAccountDropdown(true);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (billingRef.current && !billingRef.current.contains(event.target)) {
        setShowBillingDropdown(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccountDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [showBillingDropdown, setShowBillingDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const toggleBillingDropdown = () => {
    const userRoles = getUserRoles();
    const isRestrictedRole = userRoles.includes("ROLE_READ_ONLY") || userRoles.includes("ROLE_READ_WRITE");

    if (!isRestrictedRole) {
      setShowBillingDropdown(!showBillingDropdown);
      setShowAccountDropdown(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenSavedAt");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("roles");
    localStorage.removeItem("roleId");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("tokenSavedAt");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("roles");
    sessionStorage.removeItem("roleId");
    console.log("User logged out - storage cleared");
    window.location.href = "/login";
  };

  const toggleAccountDropdown = () => {
    setShowAccountDropdown(!showAccountDropdown);
    setShowBillingDropdown(false);
  };
  const imgMandel = require("../../assets/img/Programmaticbuyig-3.jpg");
  const getBrandText = (path) => {
    return "Brand";
  };
  const handleBillingHistoryClick = () => {
    const userRoles = getUserRoles();
    const isRestrictedRole = userRoles.includes("ROLE_READ_ONLY") || userRoles.includes("ROLE_READ_WRITE");
    if (isRestrictedRole) {
      setShowBillingDropdown(false);
      return;
    }

    const billingRoute = "/admin/billing-history";
    const existingBillingTab = globalTabsList.find((tab) => tab.route === billingRoute);

    if (existingBillingTab) {
      setActiveTabValue(existingBillingTab.value);
      navigate(billingRoute);
    } else {
      addTab({
        route: billingRoute,
        header: (
          <>
            <i className="fa fa-usd me-2"></i>
            Billing History
          </>
        ),
      });
      navigate(billingRoute);
    }

    setShowBillingDropdown(false);
  };
  console.log("userLoggedin=>", userLoggedin);
  const accountDisplayName = firstName || localStorage.getItem("username") || "Account";
  const storedAccountManager = (() => {
    try {
      const raw = localStorage.getItem("accountManager");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
      console.error("Error parsing accountManager from localStorage", error);
      return null;
    }
  })();
  const accountManagerDisplayName = [storedAccountManager?.firstName, storedAccountManager?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const accountRepLabel = accountManagerDisplayName
    ? `Account Rep - ${accountManagerDisplayName}`
    : "Account Rep";
  const storedRoleNames = Array.isArray(getUserRoles())
    ? getUserRoles().map((role) => {
        if (typeof role === "string") return role;
        if (role && typeof role === "object") {
          return role.name || role.roleName || role.role || "";
        }
        return "";
      })
    : [];

  const shouldShowAccountRepMenu = storedRoleNames.some((roleName) => {
    const normalizedRole = String(roleName || "").trim().toLowerCase().replace(/\s+/g, " ");
    return [
      "agency",
      "advertiser",
      "account rep",
      "role_agency",
      "role_advertiser",
      "role_account_rep",
      "accountrep",
      "role_accountrep",
    ].includes(normalizedRole) ||
      normalizedRole.includes("agency") ||
      normalizedRole.includes("advertiser") ||
      normalizedRole.includes("account rep") ||
      normalizedRole.includes("accountrep");
  });

  if (userLoggedin) {
    if (!hasAccess) {
      return (
        <>
          <div className="container-scroller">
            <nav className="navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
              <div className="navbar-brand-wrapper d-flex justify-content-center">
                <div className="navbar-brand-inner-wrapper d-flex justify-content-between align-items-center w-100">
                  <a className="navbar-brand brand-logo">
                    <img src={logo} alt="My logo" style={{ width: "auto" }} />
                  </a>
                  <a className="navbar-brand brand-logo-mini">
                    <img src="../assets/images/logo-mini.svg" alt="logos" />
                  </a>
                  <button
                    className="navbar-toggler navbar-toggler align-self-center"
                    type="button"
                    data-toggle="minimize"
                  >
                    <span className="typcn typcn-th-menu"></span>
                  </button>
                </div>
              </div>
              <div className="navbar-menu-wrapper d-flex align-items-center justify-content-end">
                <ul className="navbar-nav me-lg-2">
                  <li className="nav-item nav-profile dropdown">
                    <a
                      className="nav-link"
                      href="#"
                      data-bs-toggle="dropdown"
                      id="profileDropdown"
                    ></a>
                    <div
                      className="dropdown-menu dropdown-menu-right navbar-dropdown"
                      aria-labelledby="profileDropdown"
                    >
                      <a className="dropdown-item">
                        <i className="typcn typcn-cog-outline text-primary"></i>
                        Settings
                      </a>
                      <a className="dropdown-item">
                        <i className="typcn typcn-eject text-primary"></i>
                        Logout
                      </a>
                    </div>
                  </li>
                </ul>
                <ul className="navbar-nav navbar-nav-right">
                  <li className="nav-item dropdown me-0" ref={billingRef}>
                    <Button
                      type="button"
                      className="w-100 text-start rounded-0 form-control-sm d-flex align-items-center justify-content-center"
                      id="usdaccount"
                      onClick={toggleBillingDropdown}
                      disabled={
                        getUserRoles().includes("ROLE_READ_ONLY") ||
                        getUserRoles().includes("ROLE_READ_WRITE")
                      }
                      style={{
                        backgroundColor: "#6b6b6b",
                        borderColor: "#6b6b6b",
                        color: "#ffffff !important",
                        opacity:
                          getUserRoles().includes("ROLE_READ_ONLY") ||
                          getUserRoles().includes("ROLE_READ_WRITE")
                            ? 0.5
                            : 1,
                        cursor:
                          getUserRoles().includes("ROLE_READ_ONLY") ||
                          getUserRoles().includes("ROLE_READ_WRITE")
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      <span style={{ color: "#fff" }}>$ 0.00 USD</span>
                    </Button>
                  </li>
                  <li className="nav-item dropdown me-2 header-user-sidebar" ref={accountRef}>
                    <div className="text-center mt-0 position-relative">
                      <Button
                        type="button"
                        className="w-100 border rounded-0 form-control-sm d-flex align-items-center justify-content-center"
                        id="usdaccount"
                        onClick={toggleAccountDropdown}
                        style={{
                          backgroundColor: "#6b6b6b",
                          color: "#ffffff",
                        }}
                      >
                        <FaUser className="me-2 text-white account-user-icon" />
                        <span className="text-white account-user-name" title={accountDisplayName}>
                          {accountDisplayName}
                        </span>
                      </Button>
                      {showAccountDropdown && (
                        <div
                          className="dropdown-menu show"
                          style={{
                            position: "absolute",
                            top: "46px",
                            left: "20px",
                            display: "block",
                            height: "auto",
                          }}
                        >
                          <li
                            className="dropdown-item menus-height"
                            onClick={() => {
                              setShowAccountDropdown(false);
                              handleLogout();
                            }}
                          >
                            Logout
                          </li>
                        </div>
                      )}
                    </div>
                  </li>
                </ul>
              </div>
            </nav>

            <div className="page-body-wrapper">
              <div
                className="main-panel d-flex page-main-panel-ad"
                data={backgroundColor} 
              >
                <div className="content-wrapper d-flex align-items-center justify-content-center content-area-ad" >
                  <div className="text-center bg-white shadow-sm rounded-4 p-5 error-card-ad">
                    <div  className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle error-icon-ad">
                      !
                    </div>
                    <h3 className="mb-3 fw-bold text-dark">There is no access</h3>
                    <p className="mb-0 text-secondary fs-6">
                      Please contact your administrator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <style>{`
          .cd-date-range-popup {
            overflow-x: hidden !important;
            overflow-y: auto !important;
            max-height: calc(100vh - 220px) !important;
            align-items: flex-start !important;
          }
          @media (max-height: 680px) {
            .cd-date-range-popup-floating,
            .cd-date-range-popup-top,
            .cd-date-range-popup-top-table {
              top: 80px !important;
            }
            .cd-date-range-popup {
              max-height: calc(100vh - 100px) !important;
            }
          }
        `}</style>
        <div className="container-scroller">
          <nav className="navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
            <div className="navbar-brand-wrapper d-flex justify-content-center">
              <div className="navbar-brand-inner-wrapper d-flex justify-content-between align-items-center w-100">
                <a className="navbar-brand brand-logo">
                  <img src={logo} alt="My logo" style={{ width: "auto" }} />
                </a>
                <a className="navbar-brand brand-logo-mini">
                  <img src="../assets/images/logo-mini.svg" alt="logos" />
                </a>
                <button
                  className="navbar-toggler navbar-toggler align-self-center"
                  type="button"
                  data-toggle="minimize"
                >
                  <span className="typcn typcn-th-menu"></span>
                </button>
              </div>
            </div>
            <div className="navbar-menu-wrapper d-flex align-items-center justify-content-end">
              <ul className="navbar-nav me-lg-2">
                <li className="nav-item nav-profile dropdown">
                  <a
                    className="nav-link"
                    href="#"
                    data-bs-toggle="dropdown"
                    id="profileDropdown"
                  ></a>
                  <div
                    className="dropdown-menu dropdown-menu-right navbar-dropdown"
                    aria-labelledby="profileDropdown"
                  >
                    <a className="dropdown-item">
                      <i className="typcn typcn-cog-outline text-primary"></i>
                      Settings
                    </a>
                    <a className="dropdown-item">
                      <i className="typcn typcn-eject text-primary"></i>
                      Logout
                    </a>
                  </div>
                </li>
              </ul>
              <ul className="navbar-nav navbar-nav-right">
                <li className="nav-item dropdown me-0" ref={billingRef}>
            <Button
              type="button"
              className="w-100 text-start rounded-0 form-control-sm d-flex align-items-center justify-content-center"
              id="usdaccount"
              onClick={toggleBillingDropdown}
              disabled={
                getUserRoles().includes("ROLE_READ_ONLY") ||
                getUserRoles().includes("ROLE_READ_WRITE")
              }
              style={{
                backgroundColor: "#6b6b6b",
                borderColor: "#6b6b6b",
                color: "#ffffff !important",
                
                opacity:
                  getUserRoles().includes("ROLE_READ_ONLY") ||
                  getUserRoles().includes("ROLE_READ_WRITE")
                    ? 0.5
                    : 1,
                cursor:
                  getUserRoles().includes("ROLE_READ_ONLY") ||
                  getUserRoles().includes("ROLE_READ_WRITE")
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              <span style={{ color: "#fff" }}>$ 0.00 USD</span>
            </Button>

                  {showBillingDropdown && (
                    <div
                      className="dropdown-menu show"
                      style={{
                        position: "absolute",
                        top: "50px",
                        right: "0",
                        display: "block",
                      }}
                    >
                    <a className="dropdown-item dropdown-item-button" href=" " onClick={(e) => {
                        e.preventDefault();
                        handleBillingHistoryClick();
                      }}>
                        Billing History
                      </a>
                    </div>
                  )}
                </li>
                <li className="nav-item dropdown me-2 header-user-sidebar" ref={accountRef}>
                  <div className="text-center mt-0 position-relative">
                  <Button
                    type="button"
                    className="w-100 border rounded-0 form-control-sm d-flex align-items-center justify-content-center"
                    id="usdaccount"
                    onClick={toggleAccountDropdown}
                    style={{
                      backgroundColor: "#6b6b6b",
                      color: "#ffffff",
                    }}
                  >
                    <FaUser className="me-2 text-white account-user-icon" />
                    <span className="text-white account-user-name" title={accountDisplayName}>
                      {accountDisplayName}
                    </span>
                  </Button>

                    {showAccountDropdown && (
                      <div
                        className="dropdown-menu show"
                        style={{
                          position: "absolute",
                          top: "46px",
                          left: "0px",
                          display: "block",
                          height: "auto",
                        }}
                      >
                        <a className="dropdown-item menus-height" >
                          HELP
                        </a>
                        <hr className="divider" />

                        <li
                          className="dropdown-item menus-height"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            setOpen(true);
                          }}
                        >
                          Request Support
                        </li>

                        <li
                          className="dropdown-item menus-height"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            setOpenCreativePolicies(true);
                          }}
                        >
                          Creative Policies
                        </li>

                        {shouldShowAccountRepMenu && (
                          <li
                            className="dropdown-item menus-height"
                            onClick={() => {
                              setShowAccountDropdown(false);
                              setOpenAccountRepresent(true);
                            }}
                          >
                          <span class="accountreplabel">{accountRepLabel}</span>
                          </li>
                        )}
                        <a className="dropdown-item menus-height" href="https://adaxx.com/privacy-policy/" target="_blank" rel="noopener noreferrer">
                          Show User Agreement
                        </a>
                        <a className="dropdown-item menus-height" href="https://adaxx.com/terms-and-conditions/" target="_blank" rel="noopener noreferrer">
                          Show API Terms of Service
                        </a>
                        <a
                          href=" "
                          className="dropdown-item menus-height"
                          onClick={(e) => {
                            e.preventDefault();
                            handleLogout();
                          }}
                        >
                          Logout
                        </a>


                      </div>
                    )}
                    <RequestModal isOpen={open} onClose={() => setOpen(false)} />
                    <CreativePolicies isOpen={openCreativePolicies} onClose={() => setOpenCreativePolicies(false)} />
                    <AccountRepresent isOpen={openAccountRepresent} onClose={() => setOpenAccountRepresent(false)} />
                    <ContactInfo isOpen={openContactInfo} onClose={() => setOpenContactInfo(false)} />
                    <ChangePassword isOpen={openChangePassword} onClose={() => setOpenChangePassword(false)} />
                  </div>
                </li>
              </ul>
              <button
                className="navbar-toggler navbar-toggler-right d-lg-none align-self-center"
                type="button"
                data-toggle="offcanvas"
              >
                <span className="typcn typcn-th-menu"></span>
              </button>
            </div>
          </nav>

          {/* end of navbar end  */}

          <div className=" page-body-wrapper">
            {!shouldHideSidebar && (
              <Sidebar
                {...props}
                routes={routes}
                bgColor="black"
                toggleSidebar={toggleSidebar}
              />
            )}

            <div className="main-panel" data={backgroundColor}>
              <div className="content-wrapper">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } else {
    console.log("Else part");
    return <Navigate to="/" replace />;
  }
};

export default Admin;
