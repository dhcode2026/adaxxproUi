import React, { useMemo, useState, useEffect } from "react";
import { Spinner } from "reactstrap";
import Header from "./Header";
import MetricsCard from "./MetricsCard";
import OverviewView from "./OverviewView";
import ImpressionsCTRView from "./ImpressionsCTRView";
import AdsCostRevenueView from "./AdsCostRevenueView";
import { getDashboardOverview } from "../views/api/Api";
import { canView } from "../utils/permissionHelper";

function toIsoDate(d) {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function defaultDateRangeLast7Days() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 6);
  return { from: toIsoDate(from), to: toIsoDate(today) };
}

const normalizeName = (name, type) => {
  if (!name) {
    if (type === "exchange") return "Other Channel";
    if (type === "format") return "Other Format";
    if (type === "campaign") return "Other Campaign";
    if (type === "ad") return "Other Ad";
    return "Other";
  }
  const lower = name.toLowerCase();
  if (lower === "unknown") {
    if (type === "exchange") return "Other Channel";
    if (type === "format") return "Other Format";
    if (type === "campaign") return "Other Campaign";
    if (type === "ad") return "Other Ad";
    return "Other";
  }
  if (lower.includes("unknown")) {
    if (type === "exchange") return "Other Channel";
    if (type === "format") return "Other Format";
    if (type === "campaign") return "Other Campaign";
    if (type === "ad") return "Other Ad";
    return name.replace(/unknown/ig, "Other");
  }
  return name;
};


function Dashboard() {
  const [meta, setMeta] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [overviewDataRaw, setOverviewDataRaw] = useState(null);
  const [yesterdayData, setYesterdayData] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");
  const defaultRange = useMemo(() => {
    if (meta?.fromdate && meta?.todate) return { from: meta.fromdate, to: meta.todate };
    return defaultDateRangeLast7Days();
  }, [meta]);
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [isLoading, setIsLoading] = useState(false);



  const [overviewSelectedChannel, setOverviewSelectedChannel] = useState(null);
  const [overviewSelectedFrom, setOverviewSelectedFrom] = useState(null);
  const [overviewSelectedAdFormat, setOverviewSelectedAdFormat] = useState(null);
  const [overviewSelectedCampaign, setOverviewSelectedCampaign] = useState(null);
  const [overviewSelectedAd, setOverviewSelectedAd] = useState(null);

  const [impressionsSelectedChannel, setImpressionsSelectedChannel] = useState(null);
  const [impressionsSelectedCampaign, setImpressionsSelectedCampaign] = useState(null);

  const [adCostSelectedChannel, setAdCostSelectedChannel] = useState(null);
  const [adCostSelectedCampaign, setAdCostSelectedCampaign] = useState(null);
  const [canViewUser, setCanViewUser] = useState(false);

  const overviewAvailableChannels = useMemo(
    () => (overviewData?.exchanges ?? []).map((e) => e.name).filter(Boolean),
    [overviewData]
  );

  const overviewAvailableCampaigns = useMemo(() => {
    const exchange = (overviewData?.exchanges ?? []).find((e) => e.name?.toLowerCase() === overviewSelectedChannel?.toLowerCase());
    if (!exchange) return [];
    const set = new Set();
    (exchange.adFormats ?? []).forEach((format) => {
      (format.campaigns ?? []).forEach((camp) => {
        if (camp?.campaign) set.add(camp.campaign);
      });
    });
    return Array.from(set);
  }, [overviewData, overviewSelectedChannel]);

  const handleDateFromChange = (val) => {
    setDateFrom(val);
  };

  const headerChannel =
    activeTab === "overview"
      ? overviewSelectedChannel
      : activeTab === "impressions"
        ? impressionsSelectedChannel
        : adCostSelectedChannel;

  const headerCampaign =
    activeTab === "overview"
      ? overviewSelectedCampaign
      : activeTab === "impressions"
        ? impressionsSelectedCampaign
        : adCostSelectedCampaign;

  useEffect(() => {
    const fetchData = async () => {
      const startTime = Date.now();
      try {
        if (!dateFrom || !dateTo) return;
        setIsLoading(true);
        const payload = {
          startDate: dateFrom,
          endDate: dateTo,
          channel: "all",
          campaign: "all"
        };

        const yDate = new Date(dateTo);
        yDate.setDate(yDate.getDate() - 1);
        const yDateStr = toIsoDate(yDate);
        const yesterdayPayload = {
          startDate: yDateStr,
          endDate: yDateStr,
          channel: "all",
          campaign: "all"
        };

        const [response, yResponse] = await Promise.all([
          getDashboardOverview(payload),
          getDashboardOverview(yesterdayPayload)
        ]);

        const formatData = (rawData) => {
          const firstItem = rawData[0] || {};
          const exchangesList = firstItem.exchangeNameBased || [];

          if (exchangesList.length === 0) return null;

          return {
            exchanges: exchangesList.map(ex => {
              const exchangeName = normalizeName(ex.exchangeName, "exchange");

              const typeMap = {};

              (ex.campaignData || []).forEach(camp => {
                const campName = normalizeName(camp.campaignName, "campaign");

                if (!camp.adsData || camp.adsData.length === 0) {
                  const campMetrics = {
                    impressions: camp.totalImpressions || 0,
                    clicks: camp.totalClicks || 0,
                    conversion: camp.totalConversion || 0,
                    spend: camp.totalSpend || 0,
                    total_spend: camp.totalSpend || 0,
                    ctr: camp.totalCtr || 0
                  };
                  const typeName = "Unknown";
                  if (!typeMap[typeName]) typeMap[typeName] = {};
                  if (!typeMap[typeName][campName]) typeMap[typeName][campName] = { metrics: campMetrics, ads: [] };
                } else {
                  camp.adsData.forEach(ad => {
                    const typeName = normalizeName(ad.type, "format");
                    if (!typeMap[typeName]) typeMap[typeName] = {};
                    if (!typeMap[typeName][campName]) {
                      typeMap[typeName][campName] = {
                        metrics: { impressions: 0, clicks: 0, conversion: 0, spend: 0, total_spend: 0, ctr: 0 },
                        ads: []
                      };
                    }
                    const target = typeMap[typeName][campName];
                    target.metrics.impressions = camp.totalImpressions || 0;
                    target.metrics.clicks = camp.totalClicks || 0;
                    target.metrics.conversion = camp.totalConversion || 0;
                    target.metrics.spend = camp.totalSpend || 0;
                    target.metrics.total_spend = camp.totalSpend || 0;
                    target.metrics.ctr = camp.totalCtr || 0;

                    target.ads.push({
                      ad: normalizeName(ad.name, "ad"),
                      metrics: {
                        impressions: ad.totalWin || 0,
                        clicks: ad.totalClicks || 0,
                        conversion: ad.totalConversion || 0,
                        spend: ad.totalSpend || 0,
                        requests: ad.totalRequest || 0,
                        responses: ad.totalResponse || 0
                      }
                    });
                  });
                }
              });

              const mappedAdFormats = Object.keys(typeMap).map(typeName => {
                const campaignsObj = typeMap[typeName];
                const formatCampaigns = Object.keys(campaignsObj).map(campName => ({
                  campaign: campName,
                  metrics: campaignsObj[campName].metrics,
                  ads: campaignsObj[campName].ads
                }));


                const formatSummary = {
                  totalimpressions: formatCampaigns.reduce((acc, c) => acc + (c.metrics?.impressions || 0), 0),
                  totalclicks: formatCampaigns.reduce((acc, c) => acc + (c.metrics?.clicks || 0), 0),
                  totalconversion: formatCampaigns.reduce((acc, c) => acc + (c.metrics?.conversion || 0), 0),
                  total_spend: formatCampaigns.reduce((acc, c) => acc + (c.metrics?.spend || 0), 0)
                };

                return {
                  format: typeName,
                  summary: formatSummary,
                  campaigns: formatCampaigns
                };
              });

              const rawFormatImp = mappedAdFormats.reduce((acc, f) => acc + (f.summary?.totalimpressions || 0), 0);
              const rawFormatClk = mappedAdFormats.reduce((acc, f) => acc + (f.summary?.totalclicks || 0), 0);
              const rawFormatConv = mappedAdFormats.reduce((acc, f) => acc + (f.summary?.totalconversion || 0), 0);
              const rawFormatSpend = mappedAdFormats.reduce((acc, f) => acc + (f.summary?.total_spend || 0), 0);

              const exSummary = {
                totalimpressions: ex.totalImpressions !== undefined ? ex.totalImpressions : rawFormatImp,
                totalclicks: ex.totalClicks !== undefined ? ex.totalClicks : rawFormatClk,
                totalconversion: ex.totalConversion !== undefined ? ex.totalConversion : rawFormatConv,
                total_spend: ex.totalSpend !== undefined ? ex.totalSpend : rawFormatSpend
              };

              return {
                exchangeid: ex.exchangeName,
                name: exchangeName,
                summary: exSummary,
                adFormats: mappedAdFormats
              };
            })
          };
        };

        setOverviewData(formatData(response.data || []));
        setOverviewDataRaw(response.data);
        setYesterdayData(formatData(yResponse.data || []));
      } catch (err) {
        console.error(err);
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    };
    fetchData();
  }, [dateFrom, dateTo]);

  const selectedChannelForCampaigns =
    activeTab === "overview"
      ? overviewSelectedChannel
      : activeTab === "impressions"
        ? impressionsSelectedChannel
        : adCostSelectedChannel;

  const availableChannels = overviewAvailableChannels;

  const availableCampaigns = useMemo(() => {
    if (!selectedChannelForCampaigns) return [];
    const exchange = (overviewData?.exchanges ?? []).find((e) => e.name?.toLowerCase() === selectedChannelForCampaigns?.toLowerCase());
    if (!exchange) return [];
    const set = new Set();
    (exchange.adFormats ?? []).forEach((format) => {
      (format.campaigns ?? []).forEach((camp) => {
        if (camp?.campaign) set.add(camp.campaign);
      });
    });
    return Array.from(set);
  }, [overviewData, selectedChannelForCampaigns]);

  const resetOverview = () => {
    setOverviewSelectedChannel(null);
    setOverviewSelectedFrom(null);
    setOverviewSelectedAdFormat(null);
    setOverviewSelectedCampaign(null);
    setOverviewSelectedAd(null);
  };

  const handleHeaderChannelChange = (next) => {
    if (activeTab === "overview") {
      setOverviewSelectedChannel(next || null);
      setOverviewSelectedFrom(null);
      setOverviewSelectedAdFormat(null);
      setOverviewSelectedCampaign(null);
      setOverviewSelectedAd(null);
      return;
    }
    if (activeTab === "impressions") {
      setImpressionsSelectedChannel(next || null);
      setImpressionsSelectedCampaign(null);
      return;
    }
    setAdCostSelectedChannel(next || null);
    setAdCostSelectedCampaign(null);
  };

  const handleHeaderCampaignChange = (next) => {
    if (activeTab === "overview") {
      setOverviewSelectedCampaign(next || null);
      setOverviewSelectedAdFormat(null);
      setOverviewSelectedAd(null);
      if (!overviewSelectedChannel && next) {
        setOverviewSelectedChannel("pubmatic");
      }
      return;
    }
    if (activeTab === "impressions") {
      setImpressionsSelectedCampaign(next || null);
      return;
    }
    setAdCostSelectedCampaign(next || null);
  };

  const handleHeaderReset = () => {
    if (activeTab === "overview") {
      resetOverview();
      return;
    }
    if (activeTab === "impressions") {
      setImpressionsSelectedChannel(null);
      setImpressionsSelectedCampaign(null);
      return;
    }
    setAdCostSelectedChannel(null);
    setAdCostSelectedCampaign(null);
  };

  const extractMetrics = (dataSrc) => {
    let imp = 0, clk = 0, conv = 0, cost = 0;
    if (!dataSrc) return { imp, clk, conv, cost };
    const exchanges = dataSrc.exchanges ?? [];

    if (activeTab !== "overview") {
      exchanges.forEach(ex => {
        imp += ex.summary?.totalimpressions || 0;
        clk += ex.summary?.totalclicks || 0;
        conv += ex.summary?.totalconversion || 0;
        cost += ex.summary?.total_spend || 0;
      });
    } else if (!overviewSelectedChannel) {
      exchanges.forEach(ex => {
        imp += ex.summary?.totalimpressions || 0;
        clk += ex.summary?.totalclicks || 0;
        conv += ex.summary?.totalconversion || 0;
        cost += ex.summary?.total_spend || 0;
      });
    } else {
      const ex = exchanges.find(e => e.name?.toLowerCase() === overviewSelectedChannel?.toLowerCase());
      if (ex) {
        if (!overviewSelectedAdFormat) {
          imp = ex.summary?.totalimpressions || 0;
          clk = ex.summary?.totalclicks || 0;
          conv = ex.summary?.totalconversion || 0;
          cost = ex.summary?.total_spend || 0;
        } else {
          const fmt = ex.adFormats.find(f => f.format === overviewSelectedAdFormat);
          if (fmt) {
            if (!overviewSelectedCampaign) {
              imp = fmt.summary?.totalimpressions || 0;
              clk = fmt.summary?.totalclicks || 0;
              conv = fmt.summary?.totalconversion || 0;
              cost = fmt.summary?.total_spend || 0;
            } else {
              const camp = fmt.campaigns.find(c => c.campaign === overviewSelectedCampaign);
              if (camp) {
                if (!overviewSelectedAd) {
                  imp = camp.metrics?.impressions || 0;
                  clk = camp.metrics?.clicks || 0;
                  conv = camp.metrics?.conversion || 0;
                  cost = camp.metrics?.spend || 0;
                } else {
                  const ad = camp.ads.find(a => a.ad === overviewSelectedAd);
                  if (ad) {
                    imp = ad.metrics?.impressions || 0;
                    clk = ad.metrics?.clicks || 0;
                    conv = ad.metrics?.conversion || 0;
                    cost = ad.metrics?.spend || 0;
                  }
                }
              }
            }
          }
        }
      }
    }
    return { imp, clk, conv, cost };
  };

  const getDynamicMetrics = () => {
    const current = extractMetrics(overviewData);
    const yesterday = extractMetrics(yesterdayData);

    const formatVal = (v) => {
      if (v === undefined || v === null || isNaN(v)) return "0";
      if (v >= 1000000) return (v / 1000000).toFixed(2) + "M";
      if (v >= 1000) return (v / 1000).toFixed(2) + "K";
      return Number.isInteger(v) ? v.toString() : v.toFixed(2);
    };

    const ctr = current.imp > 0 ? ((current.clk / current.imp) * 100).toFixed(2) : "0.00";
    const cpc = current.conv > 0 ? (current.cost / current.conv).toFixed(2) : "0.00";
    const profit = current.cost * 8.5;
    const ppc = current.conv > 0 ? (profit / current.conv).toFixed(2) : "0.00";

    return [
      { title: "Impressions", value: formatVal(current.imp), comparison: formatVal(yesterday.imp), isNegative: false },
      { title: "Clicks", value: formatVal(current.clk), comparison: formatVal(yesterday.clk), isNegative: false },
      { title: "Conversions", value: formatVal(current.conv), comparison: formatVal(yesterday.conv), isNegative: false },
      { title: "Spend", value: `$${formatVal(current.cost)}`, comparison: `$${formatVal(yesterday.cost)}`, isNegative: false },
    ];
  };
  useEffect(() => {
    const hasViewPermission = canView("Dashboard");
    setCanViewUser(hasViewPermission);
  }, []);

  const metricsData = getDynamicMetrics();

  return (
    <>
      {canViewUser && (
        <div className="db-main-container" style={{ position: 'relative', minHeight: '100vh' }}>
          <div className={`campaign-loader-overlay ${isLoading ? "show" : ""}`}>
            <Spinner
              className="campaign-loader-spinner"
              style={{ width: "3.5rem", height: "3.5rem" }}
            />
          </div>
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={handleDateFromChange}
            onDateToChange={setDateTo}
            channel={headerChannel}
            campaign={headerCampaign}
            availableChannels={availableChannels}
            availableCampaigns={availableCampaigns}
            onChannelChange={handleHeaderChannelChange}
            onCampaignChange={handleHeaderCampaignChange}
            onReset={handleHeaderReset}
            overviewData={overviewData}
          />

          <div className="db-flex-container">
            <div className="db-content">
              {activeTab === "overview" && (
                <div className="db-metrics-grid">
                  {metricsData.map((metric, idx) => {
                    return (
                      <MetricsCard
                        key={idx}
                        title={metric.title}
                        value={metric.value}
                        comparison={metric.comparison}
                        isNegative={metric.isNegative}
                        dateTo={dateTo}
                        isLoading={isLoading}
                      />
                    );
                  })}
                </div>
              )}
              {activeTab === "overview" && (
                <OverviewView
                  overviewData={overviewData}
                  overviewDataRaw={overviewDataRaw}
                  selectedChannel={overviewSelectedChannel}
                  setSelectedChannel={setOverviewSelectedChannel}
                  selectedFrom={overviewSelectedFrom}
                  setSelectedFrom={setOverviewSelectedFrom}
                  selectedAdFormat={overviewSelectedAdFormat}
                  setSelectedAdFormat={setOverviewSelectedAdFormat}
                  selectedCampaign={overviewSelectedCampaign}
                  setSelectedCampaign={setOverviewSelectedCampaign}
                  selectedAd={overviewSelectedAd}
                  setSelectedAd={setOverviewSelectedAd}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  isLoading={isLoading}
                />
              )}
              {activeTab === "impressions" && (
                <ImpressionsCTRView
                  headerSelectedChannel={impressionsSelectedChannel}
                  headerSelectedCampaign={impressionsSelectedCampaign}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  isLoading={isLoading}
                />
              )}
              {activeTab === "adcost" && (
                <AdsCostRevenueView
                  overviewDataRaw={overviewDataRaw}
                  headerSelectedChannel={adCostSelectedChannel}
                  headerSelectedCampaign={adCostSelectedCampaign}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>
        </div>
      )}
      {!canViewUser && (
        <div className="alert alert-warning mt-3" style={{ margin: '20px' }}>
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Dashboard.
        </div>
      )}
    </>
  );
}

const styles = {};

export default Dashboard;
