import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import AdsDailyReporting from "./AdsDailyReporting.jsx";
import AdsHourlyReporting from "./AdsHourlyReporting.jsx";
import CampaignCreatives from "./CampaignCreatives.jsx";
const DetailedAdView = (props) => {
  const { campaignId, section, reportDate } = useParams();
  const location = useLocation();
  const [creativeId, setCreativeId] = useState(
    location.state?.creativeId || props.creativeId || campaignId
  );
  useEffect(() => {
    if (location.state?.creativeId) {
      setCreativeId(location.state.creativeId);
    } else if (props.creativeId) {
      setCreativeId(props.creativeId);
    } else if (campaignId) {
      setCreativeId(campaignId);
    }
  }, [location.state?.creativeId, props.creativeId, campaignId]);

  const renderContent = () => {
    console.log("Rendering section:", section);
    console.log("Using creativeId:", creativeId);
    
    switch (section) {
      case "ads":
        return <CampaignCreatives campaignId={campaignId} {...props} />;
      case "daily-reporting":
        return (
          <AdsDailyReporting
            campaignId={campaignId}
            creativeId={creativeId}
            {...props}
          />
        );
      case "hourly-reporting":
        return (
          <AdsHourlyReporting
            campaignId={campaignId}
            creativeId={creativeId}
            reportDate={reportDate}
            {...props}
          />
        );
      default:
        return (
          <AdsDailyReporting
            campaignId={campaignId}
            creativeId={creativeId}
            {...props}
          />
        );
    }
  };

  return (
    <div className="content">
      {renderContent()}
    </div>
  );
};

export default DetailedAdView;