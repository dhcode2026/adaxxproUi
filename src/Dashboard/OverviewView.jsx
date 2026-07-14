import React from "react";
import AdSpendingAnalysis from "../views/DashboardView/AdSpendingAnalysis";
import ChannelDeviceAnalytics from "../views/DashboardView/ChannelDeviceAnalytics";
import ImpressionTimeInsights from "../views/DashboardView/ImpressionTimeInsights";
import WorldMapAnalytics from "../views/DashboardView/worldmap";

export default function OverviewView({
  overviewData,
  overviewDataRaw,
  selectedChannel,
  setSelectedChannel,
  selectedFrom,
  setSelectedFrom,
  selectedAdFormat,
  setSelectedAdFormat,
  selectedCampaign,
  setSelectedCampaign,
  selectedAd,
  setSelectedAd,
  dateFrom,
  dateTo,
  isLoading,
}) {
  const handleSetChannel = (channel) => {
    setSelectedChannel(channel);
    if (!channel) {
      setSelectedFrom(null);
      setSelectedAdFormat(null);
      setSelectedCampaign(null);
      setSelectedAd(null);
    }
  };

  const commonProps = {
    overviewData, overviewDataRaw,
    selectedChannel, setSelectedChannel: handleSetChannel,
    selectedFrom, setSelectedFrom,
    selectedAdFormat, setSelectedAdFormat,
    selectedCampaign, setSelectedCampaign,
    selectedAd, setSelectedAd,
    dateFrom, dateTo, isLoading
  };

  return (
    <div style={styles.container}>
      <ChannelDeviceAnalytics {...commonProps}>
        <div className="db-donut-chart-container">
          <AdSpendingAnalysis {...commonProps} />
        </div>
      </ChannelDeviceAnalytics>
      <div className="db-overview-grid">
        <div style={styles.gridItem}>
          <ImpressionTimeInsights {...commonProps} />
        </div>
        <div style={styles.gridItem}>
          <WorldMapAnalytics {...commonProps} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  grid: {},
  gridItem: {
    // backgroundColor: "#fff",
    border: "1px solid #e8e8ec",
    borderRadius: 8,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",

  },
  fullWidth: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: "20px",
    overflow: "hidden",
  },
};