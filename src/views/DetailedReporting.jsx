import React from "react";
import { useParams } from "react-router-dom";

import CampaignCreatives from "./CampaignCreatives.jsx";
import CampaignDaily from "./CampaignDaily.jsx";

import CampaignExchange from "./CampaignExchange.jsx";
import Campaignhourly from "./Campaignhourly.jsx";
import DetailedReportDomain from "./DetailedReportDomain.jsx";
import DomainCampaigns from "./DomainCampaigns.jsx";


const DetailedReporting = (props) => {
  const { campaignId, section, reportDate } = useParams();

  const renderContent = () => {
    switch (section) {
      case "domains":
        return <DetailedReportDomain campaignId={campaignId} {...props} />;
      case "ads":
        return <CampaignCreatives campaignId={campaignId} {...props} />;
      case "exchanges":
        return <CampaignExchange campaignId={campaignId} {...props} />;
      case "daily-reporting":
        return <CampaignDaily campaignId={campaignId} {...props} />;
      case "hourly-reporting":
        return <Campaignhourly campaignId={campaignId} {...props} />;
      default:
        return <DetailedReportDomain campaignId={campaignId} {...props} />;
    }
  };

  return (
    <div className="content">
      {renderContent()}
    </div>
  );
};

export default DetailedReporting;
