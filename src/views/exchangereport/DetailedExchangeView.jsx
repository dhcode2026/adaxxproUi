import React from "react";
import { useParams } from "react-router-dom";

import CampaignDaily from "../CampaignCreatives.jsx";
import Campaignhourly from "../Campaignhourly.jsx";
import HourlyReportingExchange from "./HourlyReportingExchange.jsx";
import DailyReportingExchange from "./DailyReportingExchange.jsx";
const DetailedExchangeView = (props) => {
  const { campaignId, section, reportDate } = useParams();

  const renderContent = () => {
    switch (section) {
      case "daily-reporting":
        return <DailyReportingExchange />;
      case "hourly-reporting":
        return <HourlyReportingExchange />;
      default:
        return <CampaignDaily />;
    }
  };

  return (
    <div className="content">
      {renderContent()}
    </div>
  );
};

export default DetailedExchangeView;
