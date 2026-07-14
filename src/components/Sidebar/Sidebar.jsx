import React from "react";
import { NavLink, Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { PropTypes } from "prop-types";
import PerfectScrollbar from "perfect-scrollbar";
import { Nav } from "reactstrap";
import { FaAngleLeft, FaAngleRight, FaUser, FaBriefcase } from "react-icons/fa";
import { HiBars3 } from "react-icons/hi2";

import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { isSuperAdmin, isReadOnly, getUserRoles } from "../../utils/roleHelper";
import { edituser, GetAccess } from "../../views/api/Api";
import { safeJsonParse } from "../../Utils";
var ps;

const normalizeSidebarPath = (pathname = "") =>
  pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

const getSidebarCollapseStateFromPath = (pathname = "") => {
  const normalizedPath = normalizeSidebarPath(pathname);
  const startsWithAny = (paths = []) =>
    paths.some((path) => normalizedPath === path || normalizedPath.startsWith(path + "/"));

  return {
    creativesCollapse: false,
    campaignCollapse: startsWithAny([
      "/admin/campaign-details",
      "/admin/campcreate",
      "/admin/campcreatives",
      "/admin/domainlists",
      "/admin/ExportList",
      "/admin/add-ons",
    ]),
    planningCollapse: startsWithAny([
      "/admin/inventory",
      "/admin/Devices",
      "/admin/Locations",
    ]),
    adminCollapse: startsWithAny([
      "/admin/manage-user",
      "/admin/activity-log",
      "/admin/system-health",
      "/admin/permissions",
    ]),
    reportsCollapse: startsWithAny([
      "/admin/reports",
      "/admin/schedulereporting",
      "/admin/ads",
      "/admin/domains",
      "/admin/exchanges",

      "/admin/conversions",
      "/admin/daily-reporting",
      "/admin/campaign-report",
      "/admin/pubmaticreport",
      "/admin//vlionreport",
      "/admin/logs",
    ]),
  };
};

const SidebarWrapper = (props) => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  return <Sidebar {...props} location={location} params={params} navigate={navigate} />;
};
class Sidebar extends React.Component {
  constructor(props) {
    super(props);

    const collapseState = getSidebarCollapseStateFromPath(
      props.location?.pathname || "",
    );

    this.state = {
      ...collapseState,
      collapsed: false,
      firstName: "",
      lastName: "",
      username: localStorage.getItem("username") || "",
      dynamicMenus: [],
      menuCollapse: {},
      accessDataLoading: false,
    };
  }
  toggleCollapse = (key) => {
    this.setState((prevState) => {
      const nextState = {};

      Object.keys(prevState).forEach((stateKey) => {
        if (
          stateKey.endsWith("Collapse") &&
          stateKey !== "menuCollapse" &&
          stateKey !== key
        ) {
          nextState[stateKey] = false;
        }
      });

      nextState[key] = !prevState[key];

      return nextState;
    });
  };

  toggleMenuCollapse = (menuId) => {
    this.setState((prevState) => {
      const nextMenuCollapse = {};
      const currentMenus = prevState.menuCollapse || {};

      Object.keys(currentMenus).forEach((key) => {
        nextMenuCollapse[key] = false;
      });

      nextMenuCollapse[menuId] = !currentMenus[menuId];

      return {
        menuCollapse: nextMenuCollapse,
      };
    });
  };

  closeAllDropdowns = () => {
    this.setState({
      campaignCollapse: false,
      planningCollapse: false,
      adminCollapse: false,
      reportsCollapse: false,
      menuCollapse: {},
    });
  };

  handleSidebarItemClick = () => {
    if (this.state.collapsed) {
      this.setState({ collapsed: false });
    }
    this.closeAllDropdowns();
  };

  handleSidebarChildItemClick = () => {
    if (this.state.collapsed) {
      this.setState({ collapsed: false });
    }
  };

  renderCollapsedTooltipIcon = (label, iconClassName, key) => {
    const iconNode = <i className={iconClassName} aria-hidden="true" />;

    if (!this.state.collapsed) {
      return iconNode;
    }

    return (
      <OverlayTrigger
        placement="right"
        delay={{ show: 120, hide: 80 }}
        overlay={<Tooltip id={`sidebar-tooltip-${key}`}>{label}</Tooltip>}
      >
        <span
          className="sidebar-tooltip-icon"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          {iconNode}
        </span>
      </OverlayTrigger>
    );
  };

  getRouteForMenu = (menuName) => {
    const menuRoutes = {
      "Dashboard": "/admin/dashboard",
      "Campaign": "/admin/campaign-details",
      "Manage Campaign": "/admin/campaign-details",
      "Create Campaign": "/admin/campcreate",
      "Creatives": "/admin/campcreatives",
      "Domain List": "/admin/domainlists",
      "Domain Lists": "/admin/domainlists",
      "Export Segments": "/admin/ExportList",
      "Add-On": "/admin/add-ons",
      "Add-ons": "/admin/add-ons",

      "Planning Tool": "/admin/inventory",
      "Inventory": "/admin/inventory",
      "Devices": "/admin/Devices",
      "Locations": "/admin/Locations",
      "Admin": "/admin/manage-user",
      "Manage User": "/admin/manage-user",
      "Users List": "/admin/manage-user",
      "Activity Log": "/admin/activity-log",
      "System Health": "/admin/system-health",

      "Reports": "/admin/reports",
      "One-Time-Reports": "/admin/reports",
      "Pubmatic Report": "/admin/pubmaticreport",
      "Vlion Report": "/admin/vlionreport",
      "Scheduled Report": "/admin/schedulereporting",
      "Scheduled Reporting": "/admin/schedulereporting",
      "Click Log": "/admin/logs/click",
      "Conversion Log": "/admin/logs/conversion",
      "Postback Log": "/admin/logs/postback",
      "Audience": "/admin/audience",
      "CRMAudience": "/admin/crmaudience",
      "CRM Audience": "/admin/crmaudience",
      "Conversion": "/admin/conversion",

      "Universal Pixel": "/admin/universalpixel",
      "Universalpixel": "/admin/universalpixel",
      "GroupList": "/admin/grouplist",
      "Groups": "/admin/grouplist",
      "Roles & Permissions": "/admin/permissions",
      "Exchanges": "/admin/exchanges",
      "Brands": "/admin/brands",
      "Add Fund Manager": "/admin/billing-history",
      "Fund Management": "/admin/billing-history",
      "Billing History": "/admin/billing-history",
      "Rules": "/admin/rules",
    };
    if (menuRoutes[menuName]) {
      return menuRoutes[menuName];
    }
    return `/admin/${menuName.toLowerCase().replace(/\s+/g, '-')}`;
  };

  getIconForMenu = (menuName) => {
    const iconMap = {
      "Admin": "fa fa-cog",
      "Users List": "fa fa-users",
      "Manage User": "fa fa-users",
      "Activity Log": "fa fa-history",
      "System Health": "fa fa-heartbeat",
      "Private Marketplace": "fa fa-shopping-cart",
      "Roles & Permissions": "fa fa-user-secret",

      "Reports": "fa fa-bar-chart",
      "One-Time-Reports": "fa fa-file-text",
      "Scheduled Report": "fa fa-calendar",
      "Scheduled Reporting": "fa fa-calendar",
      "Click Log": "fa fa-hand-pointer-o",
      "Conversion Log": "fa fa-line-chart",
      "Postback Log": "fa fa-share-square-o",
      "Exchange": "fa fa-exchange",
      "Exchanges": "fa fa-exchange",
      "Conversion": "fa fa-random",
      "Campaign": "fa fa-bullseye",
      "Manage Campaign": "fa fa-bullseye",
      "Create Campaign": "fa fa-plus-circle",
      "Creatives": "fa fa-image",
      "Domain List": "fa fa-globe",
      "Domain Lists": "fa fa-globe",
      "Export Segments": "fa fa-download",
      "Add-On": "fa fa-puzzle-piece",
      "Add-ons": "fa fa-puzzle-piece",

      "Planning Tool": "fa fa-pencil-square",
      "Inventory": "fa fa-inbox",
      "Devices": "fa fa-mobile",
      "Locations": "fa fa-map-marker",

      "Audience": "fa fa-users",
      "My Audiences": "fa fa-users",
      "CRMAudience": "fa fa-address-book",
      "CRM Audience": "fa fa-address-book",
      "Universal Pixel": "fa fa-crosshairs",
      "Universalpixel": "fa fa-crosshairs",
      "Groups": "fa fa-object-group",
      "GroupList": "fa fa-object-group",

      "Dashboard": "fa fa-dashboard",
      "Brands": "fa fa-shield",
      "Settings": "fa fa-sliders",
      "Ads": "fa fa-video-camera",
      "Conversions": "fa fa-line-chart",
      "Daily reporting": "fa fa-bar-chart",
      "Domains": "fa fa-globe",
      "Deals": "fa fa-handshake-o",
      "Hourly reporting": "fa fa-clock-o",
      "Hourly Reporting": "fa fa-clock-o",
      "Add Fund Manager": "fa fa-usd",
      "Fund Management": "fa fa-usd",
      "Billing History": "fa fa-usd",
      "Rules": "fa fa-gavel",
    };

    if (iconMap[menuName]) {
      return iconMap[menuName];
    }

    return "fa fa-file";
  };

  handleMenuClick = (menuName) => {
    const route = this.getRouteForMenu(menuName);
    console.log(`Navigating from menu "${menuName}" to route: "${route}"`);

    if (this.props.navigate) {
      console.log("Using navigate hook to navigate");
      this.props.navigate(route);
    } else if (this.props.history) {
      console.log("Using history.push to navigate");
      this.props.history.push(route);
    } else {
      console.log("Using window.location.href to navigate");
      window.location.href = route;
    }
  };

  navigateToRoute = (route) => {
    if (!route) {
      return;
    }

    if (this.props.navigate) {
      this.props.navigate(route);
    } else if (this.props.history) {
      this.props.history.push(route);
    } else {
      window.location.href = route;
    }
  };

  isCurrentPathInsideRoute = (route) => {
    if (!route) {
      return false;
    }

    const currentPath = normalizeSidebarPath(this.props.location?.pathname || "");
    const normalizedRoute = normalizeSidebarPath(route);

    return (
      currentPath === normalizedRoute ||
      currentPath.startsWith(`${normalizedRoute}/`)
    );
  };

  processAccessData = (accessData) => {
    console.log("Processing access data:", accessData);

    const dashboardItem = accessData.find(item => item.menuName === "Dashboard");
    const otherItems = accessData.filter(item => item.menuName !== "Dashboard");

    const accessibleItems = otherItems.filter(item => {
      const hasAccess = item.canView === 1 ||
        item.canCreate === 1 ||
        item.canUpdate === 1 ||
        item.canDelete === 1 ||
        item.canReport === 1;
      return hasAccess;
    });

    console.log("Accessible items after permission check:", accessibleItems);

    const dashboardHasAccess = dashboardItem && (
      dashboardItem.canView === 1 ||
      dashboardItem.canCreate === 1 ||
      dashboardItem.canUpdate === 1 ||
      dashboardItem.canDelete === 1 ||
      dashboardItem.canReport === 1
    );

    const itemsToProcess = (dashboardItem && dashboardHasAccess) ? [dashboardItem, ...accessibleItems] : accessibleItems;

    console.log("Items to process:", itemsToProcess);

    const menuMap = {};
    itemsToProcess.forEach(item => {
      const menuName = item.menuName === "Add Fund Manager" ? "Fund Management" : item.menuName;
      if (!menuMap[menuName]) {
        menuMap[menuName] = {
          menuId: item.menuId,
          menuName: menuName,
          subMenus: [],
          canView: item.canView === 1,
          canCreate: item.canCreate === 1,
          canUpdate: item.canUpdate === 1,
          canDelete: item.canDelete === 1,
          canReport: item.canReport === 1,
        };
      }

      if (item.subMenuId !== null && item.subMenuName) {
        const subMenuExists = menuMap[item.menuName].subMenus.some(
          submenu => submenu.subMenuId === item.subMenuId
        );

        if (!subMenuExists) {
          menuMap[item.menuName].subMenus.push({
            subMenuId: item.subMenuId,
            subMenuName: item.subMenuName,
            canView: item.canView === 1,
            canCreate: item.canCreate === 1,
            canUpdate: item.canUpdate === 1,
            canDelete: item.canDelete === 1,
            canReport: item.canReport === 1,
          });
        }
      }
    });

    const dynamicMenus = Object.values(menuMap)
      .sort((a, b) => a.menuId - b.menuId);
    dynamicMenus.forEach(menu => {
      menu.subMenus.sort((a, b) => a.subMenuId - b.subMenuId);
    });

    const adminIndex = dynamicMenus.findIndex(
      (menu) => menu.menuName && menu.menuName.toLowerCase() === "admin"
    );
    if (adminIndex > -1) {
      const [adminMenu] = dynamicMenus.splice(adminIndex, 1);
      dynamicMenus.push(adminMenu);
    }

    console.log("Processed dynamic menus:", dynamicMenus);

    dynamicMenus.forEach(menu => {
      const route = this.getRouteForMenu(menu.menuName);
      console.log(`Menu: "${menu.menuName}" -> Route: "${route}"`);
      menu.subMenus.forEach(subMenu => {
        const subRoute = this.getRouteForMenu(subMenu.subMenuName);
        console.log(`  SubMenu: "${subMenu.subMenuName}" -> Route: "${subRoute}"`);
      });
    });

    return dynamicMenus;
  };

  fetchAccessData = async () => {
    this.setState({ accessDataLoading: true });
    try {
      const response = await GetAccess();
      console.log("Access data response:", response);

      let accessArray = [];
      if (Array.isArray(response?.data)) {
        accessArray = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        accessArray = response.data.data;
      } else if (response?.data) {
        accessArray = Array.isArray(response.data) ? response.data : [];
      }

      console.log("Raw access array:", accessArray);
      const processedMenus = this.processAccessData(accessArray);
      console.log("Processed menus:", processedMenus);
      this.setState({ dynamicMenus: processedMenus });
    } catch (error) {
      console.error("Error fetching access data:", error);
      this.setState({ dynamicMenus: [] });
    } finally {
      this.setState({ accessDataLoading: false });
    }
  };
  toggleSidebarCollapse = () => {
    this.setState((prevState) => {
      const nextCollapsed = !prevState.collapsed;

      return {
        collapsed: nextCollapsed,
        ...(nextCollapsed
          ? {
            campaignCollapse: false,
            planningCollapse: false,
            adminCollapse: false,
            reportsCollapse: false,
            menuCollapse: {},
          }
          : {}),
      };
    });
  };
  componentDidMount() {
    if (navigator.platform.indexOf("Win") > -1) {
      ps = new PerfectScrollbar(this.refs.sidebar, {
        suppressScrollX: true,
        suppressScrollY: false,
      });
    }

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
            this.setState({
              firstName: user.firstName,
              lastName: user.lastName,
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    }

    this.fetchAccessData();

    const currentPath = this.props.location?.pathname || '';
    const normalizedPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
    if (normalizedPath === '/admin/campcreate' || normalizedPath.startsWith('/admin/campcreate/')) {
      this.setState({ collapsed: true });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      const currentPath = this.props.location?.pathname || '';
      const normalizedPath = normalizeSidebarPath(currentPath);
      const prevPath = prevProps.location?.pathname || '';
      const prevNormalizedPath = normalizeSidebarPath(prevPath);

      const wasCreate = prevNormalizedPath === '/admin/campcreate' || prevNormalizedPath.startsWith('/admin/campcreate/');
      const isCreate = normalizedPath === '/admin/campcreate' || normalizedPath.startsWith('/admin/campcreate/');

      const nextCollapseState = getSidebarCollapseStateFromPath(normalizedPath);
      this.setState((prevState) => ({
        ...prevState,
        ...nextCollapseState,
      }));

      if (isCreate && !wasCreate) {
        this.setState({ collapsed: true });
      } else if (!isCreate && wasCreate) {
        this.setState({ collapsed: false });
      }
    }
  }

  componentWillUnmount() {
    if (navigator.platform.indexOf("Win") > -1) {
      ps.destroy();
    }
  }
  render() {
    const { bgColor, routes, rtlActive, logo, location, params } = this.props;
    const { firstName, lastName, username } = this.state;
    const isSidebarCollapsed = this.state.collapsed;
    const currentUsername =
      firstName || lastName
        ? `${firstName || ""} ${lastName || ""}`.trim()
        : username;

    let logoImg = null;
    let logoText = null;

    if (logo !== undefined) {
      if (logo.outterLink !== undefined) {
        logoImg = (
          <a
            href={logo.outterLink}
            className="simple-text logo-mini"
            target="_blank"
            rel="noopener noreferrer"
            onClick={this.props.toggleSidebar}
          >
            <div className="logo-img">
              <img src={logo.imgSrc} alt="react-logo" />
            </div>
          </a>
        );
        logoText = (
          <a
            href={logo.outterLink}
            className="simple-text logo-normal"
            target="_blank"
            rel="noopener noreferrer"
            onClick={this.props.toggleSidebar}
          >
            {logo.text}
          </a>
        );
      } else {
        logoImg = (
          <Link
            to={logo.innerLink}
            className="simple-text logo-mini"
            onClick={this.props.toggleSidebar}
          >
            <div className="logo-img">
              <img src={logo.imgSrc} alt="react-logo" />
            </div>
          </Link>
        );
        logoText = (
          <Link
            to={logo.innerLink}
            className="simple-text logo-normal"
            onClick={this.props.toggleSidebar}
          >
            {logo.text}
          </Link>
        );
      }
    }

    const currentPath = location?.pathname || '';
    const normalizedPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
    const isCreateCampaignPage = normalizedPath === '/admin/campcreate' || normalizedPath.startsWith('/admin/campcreate/');

    let routesToShow = [];
    const isAdmin = isSuperAdmin();
    const readOnly = isReadOnly();
    const userRoles = getUserRoles();

    if (isAdmin) {
      console.log('Super Admin detected - showing all menus');
      routesToShow = routes.filter(route => {
        if (route.restrictedRoles && route.restrictedRoles.length > 0) {
          const hasRestrictedRole = route.restrictedRoles.some((role) =>
            userRoles.includes(role)
          );
          if (hasRestrictedRole) {
            return false;
          }
        }

        return (
          route.showInSidebar === true &&
          route.name &&
          route.icon
        );
      });
      console.log('Routes to show for super admin:', routesToShow.length);
    } else if (readOnly) {
      const allowedPaths = [
        '/inventory',
        '/reports',
        '/schedulereporting',
        '/planning-tool',
        '/logs'
      ];
      routesToShow = routes.filter(route => {
        if (route.restrictedRoles && route.restrictedRoles.length > 0) {
          const hasRestrictedRole = route.restrictedRoles.some((role) =>
            userRoles.includes(role)
          );
          if (hasRestrictedRole) {
            return false;
          }
        }
        if (route.allowedRoles && route.allowedRoles.length > 0) {
          const hasAllowedRole = route.allowedRoles.some((role) =>
            userRoles.includes(role)
          );
          if (!hasAllowedRole) {
            return false;
          }
        }

        return (
          route.showInSidebar === true &&
          route.name &&
          route.icon &&
          allowedPaths.some(path => route.path === path || (route.path && route.path.startsWith(path + '/')))
        );
      });
    } else {
      console.log('Default role handling - showing all accessible menus');
      routesToShow = routes.filter(route => {
        if (route.restrictedRoles && route.restrictedRoles.length > 0) {
          const hasRestrictedRole = route.restrictedRoles.some((role) =>
            userRoles.includes(role)
          );
          if (hasRestrictedRole) {
            return false;
          }
        }

        if (route.allowedRoles && route.allowedRoles.length > 0) {
          const hasAllowedRole = route.allowedRoles.some((role) =>
            userRoles.includes(role)
          );
          if (!hasAllowedRole) {
            return false;
          }
        }

        return (
          route.showInSidebar === true &&
          route.name &&
          route.icon
        );
      });
    }

    return (
      <div
        className={`sidebar sidebar-offcanvas ${this.state.collapsed ? "collapsed" : ""
          }`}
        id="sidebar"
        data={bgColor}
      >
        <div className="sidebar-wrapper" ref="sidebar">
          {logoImg !== null || logoText !== null ? (
            <div className="logo">
              {logoImg}
              {logoText}
            </div>
          ) : null}

          <div className="nav-item collapse-btn-container sidebar-navlink1">
            <div
              className="collapse-space"
              onClick={this.toggleSidebarCollapse}
            >
              {this.state.collapsed ? <HiBars3 size={14} color="#10182a" /> : <HiBars3 size={14} color="#10182a" />}
            </div>
          </div>

          <Nav className="sidebar-nav">
            {(() => {
              if (this.state.dynamicMenus && this.state.dynamicMenus.length > 0) {
                console.log("Rendering dynamic menus:", this.state.dynamicMenus);
                const elements = [];

                this.state.dynamicMenus.forEach((menu, menuIdx) => {
                  const hasSubMenus = menu.subMenus && menu.subMenus.length > 0;
                  const menuKey = `menu-${menu.menuId}`;
                  const isCollapsed = this.state.menuCollapse[menu.menuId];
                  const menuRoute = this.getRouteForMenu(menu.menuName);
                  const hideSubMenusOnCreateCampaign = isSidebarCollapsed && isCreateCampaignPage && menu.menuName === "Campaign";
                  const firstChildRoute = hasSubMenus ? this.getRouteForMenu(menu.subMenus[0].subMenuName) : null;
                  const shouldDefaultToFirstChild = hasSubMenus && firstChildRoute && !this.isCurrentPathInsideRoute(firstChildRoute);

                  console.log(`Menu: ${menu.menuName}, Route: ${menuRoute}, HasSubMenus: ${hasSubMenus}`);

                  if (hasSubMenus) {
                    elements.push(
                      <li className="nav-item" key={menuKey} style={{ margin: "4px 0" }}>
                        <a
                          href="#"
                          className="nav-link sidebar-navlink"
                          onClick={(e) => {
                            e.preventDefault();
                            if (this.state.collapsed) {
                              this.setState({ collapsed: false }, () => {
                                this.toggleMenuCollapse(menu.menuId);
                                if (shouldDefaultToFirstChild) {
                                  this.navigateToRoute(firstChildRoute);
                                }
                              });
                              return;
                            }

                            const willOpen = !isCollapsed;
                            this.toggleMenuCollapse(menu.menuId);
                            if (willOpen && shouldDefaultToFirstChild) {
                              this.navigateToRoute(firstChildRoute);
                            }
                          }}
                        >
                          <div
                            className="d-flex align-items-center justify-content-between"
                            style={{ width: "100%" }}
                          >
                            <div className="d-flex align-items-center">
                              {this.renderCollapsedTooltipIcon(
                                menu.menuName,
                                this.getIconForMenu(menu.menuName),
                                `dynamic-menu-${menu.menuId}`,
                              )}
                              {!isSidebarCollapsed && (
                                <span className="sidebar-text"
                                  title={menu.menuName}
                                  style={{
                                    marginLeft: "10px",
                                    marginBottom: "0px",
                                  }}
                                >
                                  {menu.menuName}
                                </span>
                              )}
                            </div>
                            {!isSidebarCollapsed && (
                              <i
                                className={`fa ${isCollapsed
                                  ? "fa-caret-up"
                                  : "fa-caret-down"
                                  }`}
                                style={{ fontSize: "14px" }}
                              />
                            )}
                          </div>
                        </a>
                        {isCollapsed && !hideSubMenusOnCreateCampaign && (
                          <div
                            className="collapse show sidebar-collapsed-submenu"
                          >
                            {menu.subMenus.map((subMenu, subIdx) => (
                              <NavLink
                                to={this.getRouteForMenu(subMenu.subMenuName)}
                                className={`sidebar-navlink ${isSidebarCollapsed ? "sidebar-submenu-icon-only" : ""}`}
                                activeClassName="active"
                                onClick={this.handleSidebarChildItemClick}
                                key={subIdx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                                  paddingLeft: isSidebarCollapsed ? "0" : undefined,
                                  paddingRight: isSidebarCollapsed ? "0" : undefined,
                                  gap: isSidebarCollapsed ? "0" : "8px",
                                }}
                              >
                                {this.renderCollapsedTooltipIcon(
                                  subMenu.subMenuName,
                                  `${this.getIconForMenu(subMenu.subMenuName)} sidebar-icon`,
                                  `dynamic-submenu-${menu.menuId}-${subIdx}`,
                                )}
                                {!isSidebarCollapsed && (
                                  <span className="sidebar-text">
                                    {subMenu.subMenuName}
                                  </span>
                                )}
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  } else {
                    elements.push(
                      <li className="nav-item" key={menuKey} style={{ margin: "4px 0" }} >
                        <NavLink
                          to={menuRoute}
                          className="sidebar-navlink"
                          activeClassName="active"
                          onClick={this.handleSidebarItemClick}
                        >
                          {this.renderCollapsedTooltipIcon(
                            menu.menuName,
                            `${this.getIconForMenu(menu.menuName)} sidebar-icon`,
                            `dynamic-simple-${menu.menuId}`,
                          )}
                          <span className="sidebar-text">
                            {menu.menuName}
                          </span>
                        </NavLink>
                      </li>
                    );
                  }
                });

                return elements;
              }

              const routesByCategory = {};
              const categoryOrder = ["views", "reports", "other", "admin"];

              routesToShow.forEach(route => {
                let category = route.category || "other";
                if (route.name && route.name.toLowerCase() === "admin") {
                  category = "admin";
                }
                if (!routesByCategory[category]) {
                  routesByCategory[category] = [];
                }
                routesByCategory[category].push(route);
              });

              const elements = [];
              let elementKey = 0;

              categoryOrder.forEach(category => {
                if (routesByCategory[category] && routesByCategory[category].length > 0) {
                  if (category !== "other" && category !== "admin") {
                    elements.push(
                      <li className="nav-item sidebar-category-heading" key={`heading-${category}`} style={{ padding: "0px 15px", marginTop: "0px", marginBottom: "0px" }}>
                        {!this.state.collapsed && (
                          <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#9A9A9A", letterSpacing: "0.5px" }}>

                          </span>
                        )}
                      </li>
                    );
                  }

                  routesByCategory[category].forEach((prop, idx) => {
                    const propKey = `${category}-${idx}`;
                    if (prop.redirect) return;

                    if (prop.isClickable === false) {
                      elements.push(
                        <li className="nav-item" key={propKey} style={{ margin: "4px 0" }}>
                          <div className="sidebar-navlink active current-page" style={{ cursor: "default", backgroundColor: "transparent" }}>
                            {this.renderCollapsedTooltipIcon(
                              rtlActive ? prop.rtlName : prop.name,
                              `${prop.icon} sidebar-icon`,
                              `static-active-${propKey}`,
                            )}
                            <span className="sidebar-text" title={rtlActive ? prop.rtlName : prop.name}>
                              {rtlActive ? prop.rtlName : prop.name}
                            </span>
                          </div>
                        </li>
                      );
                      return;
                    }

                    if (prop.collapse) {
                      const hideSubMenusOnCreateCampaign = isSidebarCollapsed && isCreateCampaignPage && prop.name === "Campaign";
                      const firstChildRoute = prop.views && prop.views[0]
                        ? `${prop.views[0].layout}${prop.views[0].path}`
                        : null;
                      const shouldDefaultToFirstChild = firstChildRoute && !this.isCurrentPathInsideRoute(firstChildRoute);

                      elements.push(
                        <li className="nav-item" key={propKey} style={{ margin: "4px 0" }}>
                          <a
                            href="#"
                            className="nav-link sidebar-navlink"
                            onClick={(e) => {
                              e.preventDefault();
                              if (this.state.collapsed) {
                                this.setState({ collapsed: false }, () => {
                                  this.toggleCollapse(prop.state);
                                  if (shouldDefaultToFirstChild) {
                                    this.navigateToRoute(firstChildRoute);
                                  }
                                });
                                return;
                              }

                              const willOpen = !this.state[prop.state];
                              this.toggleCollapse(prop.state);
                              if (willOpen && shouldDefaultToFirstChild) {
                                this.navigateToRoute(firstChildRoute);
                              }
                            }}
                          >
                            <div
                              className="d-flex align-items-center justify-content-between"
                              id="mainsidebar"
                            >
                              <div className="d-flex align-items-center">
                                {this.renderCollapsedTooltipIcon(
                                  rtlActive ? prop.rtlName : prop.name,
                                  `${prop.icon} `,
                                  `static-collapse-${propKey}`,
                                )}
                                {!isSidebarCollapsed && (
                                  <span
                                    className="sidebar-text "
                                    title={rtlActive ? prop.rtlName : prop.name}
                                    id="mainsidebartext">
                                    {rtlActive ? prop.rtlName : prop.name}
                                  </span>
                                )}
                              </div>
                              {!isSidebarCollapsed && (
                                <i
                                  className={`fa ${this.state[prop.state]
                                    ? "fa-caret-up"
                                    : "fa-caret-down"
                                    }`}
                                     id="mainsidebaricon"
                                />
                              )}
                            </div>
                          </a>

                          <div
                            className={`collapse ${this.state[prop.state] ? "show" : ""} ${isSidebarCollapsed ? "sidebar-collapsed-submenu" : ""}`}
                          >
                            {hideSubMenusOnCreateCampaign ? null : prop.views.map((child, cKey) => (
                              <div
                                className="nav-item  mb-1"
                                key={cKey}
                                style={child.name === "Scheduled Report" ? { marginBottom: "20px" } : {}}
                              >
                                <NavLink
                                  to={child.layout + child.path}
                                  className={`sidebar-navlink ${isSidebarCollapsed ? "sidebar-submenu-icon-only" : ""}`}
                                  activeClassName="active"
                                  onClick={this.handleSidebarChildItemClick}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                                    paddingLeft: isSidebarCollapsed ? "0" : undefined,
                                    paddingRight: isSidebarCollapsed ? "0" : undefined,
                                    gap: isSidebarCollapsed ? "0" : "8px",
                                  }}
                                >
                                  <i
                                    className={` ${child.icon} sidebar-icon`}
                                  />
                                  {!isSidebarCollapsed && (
                                    <span className="sidebar-text">
                                      {child.name}
                                    </span>
                                  )}
                                </NavLink>
                              </div>
                            ))}
                          </div>
                        </li>
                      );
                      return;
                    }

                    if (prop.isActivePage) {
                      elements.push(
                        <li className="nav-item" key={propKey} style={{ margin: "4px 0" }}>
                          <NavLink
                            to={prop.state ? { pathname: prop.layout + prop.path, state: prop.state } : prop.layout + prop.path}
                            className="sidebar-navlink active current-page sidebar-navlink1"
                            activeClassName="active"
                            onClick={this.handleSidebarItemClick}
                        
                          >
                            {this.renderCollapsedTooltipIcon(
                              rtlActive ? prop.rtlName : prop.name,
                              `${prop.icon} sidebar-icon`,
                              `static-item-collapsed-${propKey}`,
                            )}
                            <span className="sidebar-text">
                              {rtlActive ? prop.rtlName : prop.name}
                            </span>
                          </NavLink>
                        </li>
                      );
                      return;
                    }

                    elements.push(
                      <li className="nav-item" key={propKey} id="sidebarmainlink">
                        {this.state.collapsed ? (
                          <NavLink
                            to={prop.state ? { pathname: prop.layout + prop.path, state: prop.state } : prop.layout + prop.path}
                            className="sidebar-navlink"
                            activeClassName="active"
                            onClick={this.handleSidebarItemClick}
                          >
                            {this.renderCollapsedTooltipIcon(
                              rtlActive ? prop.rtlName : prop.name,
                              `${prop.icon} sidebar-icon`,
                              `static-item-${propKey}`,
                            )}
                            <span className="sidebar-text">
                              {rtlActive ? prop.rtlName : prop.name}
                            </span>
                          </NavLink>
                        ) : (
                          <NavLink
                            exact
                            to={prop.state ? { pathname: prop.layout + prop.path, state: prop.state } : prop.layout + prop.path}
                            className="sidebar-navlink"
                            activeClassName="active"
                            onClick={this.handleSidebarItemClick}
                          >
                            {this.renderCollapsedTooltipIcon(
                              rtlActive ? prop.rtlName : prop.name,
                              `${prop.icon} sidebar-icon`,
                              `static-item-active-${propKey}`,
                            )}
                            <span className="sidebar-text">
                              {rtlActive ? prop.rtlName : prop.name}
                            </span>
                          </NavLink>
                        )}
                      </li>
                    );
                  });
                }
              });

              return elements;
            })()}
          </Nav>
        </div>
      </div>
    );
  }
}

Sidebar.defaultProps = {
  rtlActive: false,
  bgColor: "black",
  routes: [{}],
};

Sidebar.propTypes = {
  rtlActive: PropTypes.bool,
  bgColor: PropTypes.oneOf([
    "primary",
    "blue",
    "green",
    "red",
    "dark-gray",
    "black",
  ]),
  routes: PropTypes.arrayOf(PropTypes.object),
  logo: PropTypes.shape({
    innerLink: PropTypes.string,
    outterLink: PropTypes.string,
    text: PropTypes.node,
    imgSrc: PropTypes.string,
  }),
  location: PropTypes.object,
  params: PropTypes.object,
};

export default SidebarWrapper;