import React from "react";

import Dashboard from "./Dashboard/Dashboard.jsx";
import DomainList from "./views/DomainList.jsx";
import Inventory from "./views/Inventory.jsx";
import Reports from "./views/Reports.jsx";
import UsersList from "./views/UsersList.jsx";
import AddonsList from "./views/AddonsList.jsx";
import ScheduledReportList from "./views/ScheduledReportList.jsx";
import ExportList from "./views/export.jsx";
import Conversion from "./views/Conversion.jsx";
import Creatives from "./views/Creatives.jsx";
import PrivateMarketplace from "./views/PrivateMarketplace.jsx";
import Campaigns from "./views/Campaigns.jsx"
import DetailedReporting from "./views/DetailedReporting.jsx";
import DetailedAdView from "./views/DetailedAdView.jsx";
import BillingHistory from "./views/BillingHistory.jsx";
import Devices from "./views/Devices.jsx";
import Locations from "./views/Locations.jsx";
import Exchanges from "./views/Exchanges.jsx";
import ActivityLog from "./views/ActivityLog.jsx";
import Settings from "./views/Settings.jsx";
import SystemHealth from "./views/SystemHealth.jsx";
import CreateCampaign from "./views/editors/campcreate.jsx";
import CampaignDetails from "./views/DashboardView/CampaignDetails.jsx";
import CampaignCreatives from "./views/CampaignCreatives.jsx"
import DailyReporting from "./views/DailyReporting.jsx";
import DetailedDomainExchange from "./views/DetailedDomainExchange.jsx";
import DetailedExchangeView from "./views/exchangereport/DetailedExchangeView.jsx";
import CampaignExchange from "./views/CampaignExchange.jsx";
import CampaignDailyInsights from "./views/editors/CampaignDailyInsights.jsx";
import PubmaticReport from "./views/PubmaticReport.jsx";
import ClickLog from "./views/ClickLog.jsx";
import ConversionLog from "./views/ConversionLog.jsx";
import PostbackLog from "./views/PostbackLog.jsx";
import VlionReport from "./views/VlionReport.jsx";
import Rules from       "./views/Rules.jsx"
import RuleEditor from "./views/editors/RuleEditor.jsx"
import  CampaignConversion from "./views/CampaignConversion.jsx"
const routes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "fa fa-home",
    component: Dashboard,
    layout: "/admin",
    showInSidebar: true,
    category: "views",
  },
   {
    path: "/private-marketplace",
    name: "Private Marketplace",
    icon: "fa fa-handshake-o",
    component: PrivateMarketplace,
    layout: "/admin",
    showInSidebar: true,
    category: "views",
    allowedRoles: ["ROLE_SUPER_ADMIN"],
  },
    {
    path: "/billing-history",
    name: "Billing History",
    icon: "fa fa-usd",
    component: BillingHistory,
    layout: "/admin",
    showInSidebar: false,
  },
  {
    collapse: true,
    name: "Campaign",
    icon: "fa fa-bullseye",
    state: "campaignCollapse",
    showInSidebar: true,
    category: "views",
    views: [
      {
        path: "/campaign-details",
        name: "Manage Campaign",
        icon: "fa fa-tasks",
        component: CampaignDetails,
        layout: "/admin",
      },
      {
        path: "/campcreate",
        name: "Create Campaign",
        icon: "fa fa-plus-circle",
        component: CreateCampaign,
        layout: "/admin",
      },
      {
        path: "/campcreatives",
        name: "Creatives",
        icon: "fa fa-paint-brush",
        component: Creatives,
        layout: "/admin",
      },
      {
        path: "/domainlists",
        name: "Domain List",
        icon: "fa fa-globe",
        component: DomainList,
        layout: "/admin",
      },
      {
        path: "/ExportList",
        name: "Export Segments",
        icon: "fa fa-folder-open",
        component: ExportList,
        layout: "/admin",
      },
      {
        path: "/add-ons",
        name: "Add-On",
        icon: "fa fa-puzzle-piece",
        component: AddonsList,
        layout: "/admin",
      },
    ],
  },


  {
    collapse: true,
    name: "Planning Tool",
    path: "/planning-tool",
    icon: "fa fa-cogs",
    state: "planningCollapse",
    showInSidebar: true,
    category: "views",
    views: [
      {
        path: "/inventory",
        name: "Inventory",
        icon: "fa fa-cube",
        component: Inventory,
        layout: "/admin",
      },
      {
        path: "/Devices",
        name: "Devices",
        icon: "fa fa-laptop",
        component: Devices,
        layout: "/admin",
      },
      {
        path: "/Locations",
        name: "Locations",
        icon: "fa fa-map-marker",
        component: Locations,
        layout: "/admin",
      },
    ],
  },

  {
    collapse: true,
    name: "Admin",
    path: "/admin",
    icon: "fa fa-sliders",
    state: "adminCollapse",
    showInSidebar: true,
    category: "views",
    views: [
      {
        path: "/manage-user",
        name: "Users List",
        icon: "fa fa-users",
        component: UsersList,
        layout: "/admin",
      },
      {
        path: "/activity-log",
        name: "Activity Log",
        icon: "fa fa-history",
        component: ActivityLog,
        layout: "/admin",
      },
      {
        path: "/system-health",
        name: "System Health",
        icon: "fa fa-heartbeat",
        component: SystemHealth,
        layout: "/admin",
      },
      {
        path: "/permissions",
        name: "Roles & Permissions",
        icon: "fa fa-cog",
        component: Settings,
        layout: "/admin",
      },

    ],
  },

  {
    collapse: true,
    name: "Reports",
    path: "/reports",
    icon: "fa fa-pie-chart",
    state: "reportsCollapse",
    showInSidebar: true,
    category: "reports",
    views: [
      {
        path: "/reports",
        name: "One-Time-Reports",
        icon: "fa fa-calendar",
        component: Reports,
        layout: "/admin",
      },
      {
        path: "/schedulereporting",
        name: "Scheduled Report",
        icon: "fa fa-calendar-check-o",
        component: ScheduledReportList,
        layout: "/admin",
      },
      {
        path: "/ads",
        name: "Ads",
        icon: "fa fa-video-camera",
        component: CampaignCreatives,
        layout: "/admin",
      },
      {
        path: "/domains",
        name: "Domains",
        icon: "fa fa-globe",
        component: DetailedDomainExchange,
        layout: "/admin",
      },
      {
        path: "/exchanges",
        name: "Exchanges",
        icon: "fa fa-exchange",
        component: CampaignExchange,
        layout: "/admin",
      },
      {
        path: "/conversions",
        name: "Conversions",
        icon: "fa fa-line-chart",
        component: CampaignConversion,
        layout: "/admin",
      },
      {
        path: "/daily-reporting",
        name: "Daily reporting",
        icon: "fa fa-bar-chart",
        component: DailyReporting,
        layout: "/admin",
      },
      {
        path: "/campaign-report",
        name: "Campaign Report",
        icon: "fa fa-area-chart",
        component: CampaignDailyInsights,
        layout: "/admin",
      },
      {
        path: "/pubmaticreport",
        name: "Pubmatic Report",
        icon: "fa fa-calendar",
        component: PubmaticReport,
        layout: "/admin",
        showInSidebar: false,
        showOnBrandDetail: true,
      },
      {
        path: "/vlionreport",
        name: "Vlion Report",
        icon: "fa fa-calendar",
        component: VlionReport,
        layout: "/admin",
        showInSidebar: false,
        showOnBrandDetail: true,
      },
      {
        path: "/logs/click",
        name: "Click Log",
        icon: "fa fa-hand-pointer-o",
        component: ClickLog,
        layout: "/admin",
      },
      {
        path: "/logs/conversion",
        name: "Conversion Log",
        icon: "fa fa-line-chart",
        component: ConversionLog,
        layout: "/admin",
      },
      {
        path: "/logs/postback",
        name: "Postback Log",
        icon: "fa fa-share-square-o",
        component: PostbackLog,
        layout: "/admin",
      },
    ],
  },


 
  {
    path: "/exchange",
    name: "Exchange",
    icon: "fa fa-link",
    component: Exchanges,
    layout: "/admin",
    showInSidebar: true,
    category: "reports",
  },

  {
    path: "/campcreate/:campaign_id",
    name: "Edit Campaign",
    component: CreateCampaign,
    layout: "/admin",
    showInSidebar: false,
  },
  {
    path: "/campaign-editor-update/:campaign_id",
    name: "Edit Campaign",
    component: CreateCampaign,
    layout: "/admin",
    showInSidebar: false,
  },
  {
    path: "/creatives",
    name: "My Ads",
    icon: "fa fa-video-camera",
    component: Creatives,
    layout: "/admin",
    showInSidebar: false,
    showOnBrandDetail: true,
  },

  {
    path: "/conversion",
    name: "Conversion",
    icon: "fa fa-id-card-o",
    component: Conversion,
    layout: "/admin",
    showInSidebar: true,
    showOnBrandDetail: true,
  },

  {
    path: "/conversion/:brandId",
    name: "Conversion",
    icon: "fa fa-id-card-o",
    component: Conversion,
    layout: "/admin",
    showInSidebar: false,
    showOnBrandDetail: true,
  },
  {
    path: "/campaign/:campaignId/detailed-reporting/:section",
    name: "Detailed Reporting",
    icon: "fa fa-chart-bar",
    component: DetailedReporting,
    layout: "/admin",
    showInSidebar: false,
    isDetailedReporting: true,
  },
  {
    path: "/campaign/:campaignId/detailed-reporting/:section/:reportDate",
    name: "Detailed Reporting",
    icon: "fa fa-chart-bar",
    component: DetailedReporting,
    layout: "/admin",
    showInSidebar: false,
    isDetailedReporting: true,
  },
  {
    path: "/campaign/:campaignId/detailed-ad-view/:section",
    name: "Detailed Ad View",
    icon: "fa fa-chart-bar",
    component: DetailedAdView,
    layout: "/admin",
    showInSidebar: false,
    isDetailedAdView: true,
  },
  {
    path: "/campaign/:campaignId/detailed-ad-view/:section/:reportDate",
    name: "Detailed Ad View",
    icon: "fa fa-chart-bar",
    component: DetailedAdView,
    layout: "/admin",
    showInSidebar: false,
    isDetailedAdView: true,
  },
  {
    path: "/exchange/:exchangeId/detailed-exchange-view/:section",
    name: "Detailed Exchange View",
    icon: "fa fa-chart-bar",
    component: DetailedExchangeView,
    layout: "/admin",
    showInSidebar: false,
    isDetailedExchangeView: true,
  },
 
];

export default routes;



