import React, { useEffect, useMemo, useState } from 'react';
import { spendandrevenue } from "../views/api/Api";
import { Spinner } from 'reactstrap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import DataTable from 'react-data-table-component';

const getSliceName = (sliceLike) => sliceLike?.name ?? sliceLike?.payload?.name ?? null;

const customTableStyles = {
  headRow: {
    style: {
      backgroundColor: '#f3f4f6',
      minHeight: '36px',
      borderBottomWidth: '1px',
      borderBottomColor: '#e5e7eb',
      fontWeight: 'bold',
      fontSize: '13px',
      color: '#374151',
    },
  },
  rows: {
    style: {
      minHeight: '32px',
      fontSize: '12px',
      color: '#4b5563',
      '&:not(:last-of-type)': {
        borderBottomStyle: 'solid',
        borderBottomWidth: '1px',
        borderBottomColor: '#f3f4f6',
      },
    },
  },
  cells: {
    style: {
      paddingLeft: '10px',
      paddingRight: '10px',
    },
  },
};

const DataTableTooltip = ({ active, payload, label, lists }) => {
  const data = useMemo(() => {
    if (!active || !payload || payload.length === 0) return [];
    const item = payload[0] ?? {};
    if (!item.value) return [];

    // Fix for "value" showing instead of the actual channel name
    let name = 'Data';
    if (item.payload && item.payload.name) {
      name = item.payload.name;
    } else if (label) {
      name = label;
    } else if (item.name && item.name !== 'value') {
      name = item.name;
    }

    const cities = lists?.cities ?? [];
    const campaigns = lists?.campaigns ?? [];
    const devices = lists?.campaigns ?? ['Desktop', 'Mobile'];
    const ads = lists?.ads ?? [];

    let rows = [];
    for (let i = 0; i < 11; i++) {
      rows.push({
        id: i,
        channel: name,
        city: cities[i % 3],
        campaign: campaigns[i % 3],
        device: devices[i % 2],
        ad: ads[i % 2],
        profit: Math.abs((100 - i * 8) * ((name.length || 5) / 8) + 10),
        cost: Math.abs((0.5 + i * 0.1) * ((name.length || 5) / 5))
      });
    }
    return rows.sort((a, b) => b.profit - a.profit);
  }, [active, payload, label, lists]);

  const maxProfit = Math.max(...data.map(d => d.profit), 1);
  const maxCost = Math.max(...data.map(d => d.cost), 1);
  const totalProfit = data.length > 0 ? data.reduce((sum, row) => sum + row.profit, 0) / data.length : 0;
  const totalCost = data.length > 0 ? data.reduce((sum, row) => sum + row.cost, 0) / data.length : 0;

  const tableData = [...data, {
    id: 'total',
    isTotal: true,
    channel: 'Total',
    city: '',
    campaign: '',
    device: '',
    ad: '',
    profit: totalProfit,
    cost: totalCost
  }];

  const columns = useMemo(() => [
    {
      name: 'Channel',
      selector: row => row.channel,
      width: '90px',
      cell: row => {
        if (row.isTotal) return <strong className="acr-table-total-text">{row.channel}</strong>;
        return <span title={row.channel}>{row.channel?.length > 10 ? row.channel.substring(0, 10) + '...' : row.channel}</span>;
      }
    },
    { name: 'City', selector: row => row.city, width: '100px' },
    { name: 'Campaign', selector: row => row.campaign, width: '90px' },

    { name: 'Ad', selector: row => row.ad, width: '90px' },
    {
      name: 'Profit / conversion',
      selector: row => row.profit,
      width: '160px',
      cell: row => {
        if (row.isTotal) return <strong className="acr-table-total-text">${row.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>;
        return (
          <div className="acr-table-bar-cell">
            <div className="acr-table-bar-wrapper">
              <div className="acr-table-bar-profit" style={{ width: `${(row.profit / maxProfit) * 100}%` }} />
            </div>
            <span className="acr-table-bar-value">${row.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        );
      }
    },
    {
      name: 'Cost / conversion',
      selector: row => row.cost,
      width: '150px',
      cell: row => {
        if (row.isTotal) return <strong className="acr-table-total-text">${row.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>;
        return (
          <div className="acr-table-bar-cell">
            <div className="acr-table-bar-wrapper">
              <div className="acr-table-bar-cost" style={{ width: `${(row.cost / maxCost) * 100}%` }} />
            </div>
            <span className="acr-table-bar-value">${row.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        );
      }
    },
  ], [maxProfit, maxCost]);

  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0] ?? {};
  if (!item.value) return null;

  return (
    <div className="acr-data-table-tooltip-wrapper">
      <DataTable
        columns={columns}
        data={tableData}
        dense
        customStyles={customTableStyles}
      />
    </div>
  );
};

const RechartTooltip = ({ active, payload, label, valueFormatter }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0] ?? {};
  const name = item?.name ?? item?.payload?.name ?? label ?? '';
  const value = item?.value ?? item?.payload?.value;
  const color = item?.payload?.fill ?? item?.color ?? '#9ca3af';
  const formattedValue = valueFormatter ? valueFormatter(value, item) : value;

  return (
    <div className="acr-tooltip-container">
      <div className="acr-tooltip-title">{name}</div>
      <div className="acr-tooltip-row">
        <span className="acr-tooltip-dot" style={{ background: color }} />
        <span className="acr-tooltip-value">{formattedValue}</span>
      </div>
    </div>
  );
};

export default function AdsCostRevenueView({
  overviewDataRaw,
  headerSelectedChannel,
  headerSelectedCampaign,
  dateFrom,
  dateTo,
  isLoading
}) {
  void dateFrom;
  void dateTo;

  const [loading, setLoading] = useState(false);
  const isDataLoading = isLoading || loading;
  const [dashboardData, setDashboardData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!dateFrom || !dateTo) return;
        setLoading(true);
        const payload = {
          startDate: dateFrom,
          endDate: dateTo,
          channel: "all",
          campaign: "all"
        };
        const response = await spendandrevenue(payload);
        const data = response.data?.data || response.data;
        if (data && data.overview && data.overview.exchanges) {
          setDashboardData(data.overview.exchanges);
        } else {
          setDashboardData([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateFrom, dateTo]);

  const COLORS = ['#5c7cfa', '#f67d59', '#c1232b', '#fbbc05', '#e52d27', '#0077b5', '#38bdf8', '#fb7185', '#34d399', '#a78bfa'];

  const DATA_SPENDING_LOCAL = [];
  const DATA_REVENUE_LOCAL = [];
  const SPENDING_DRILL_LOCAL = {};
  const REVENUE_DRILL_LOCAL = {};
  const campaignBuckets = {};
  const scatterSeries = {};

  const dataCostConversion = [];
  const dataRevenueConversion = [];
  const campaignDataCost = {};
  const adDataCost = {};
  const campaignRevenueData = {};
  const adDataRevenue = {};

  dashboardData.forEach((ch, chIdx) => {
    const chName = ch.exchange || `Channel ${chIdx}`;
    const chColor = COLORS[chIdx % COLORS.length];

    const chSpend = ch.summary?.spend || 0;
    const chRevenue = ch.summary?.revenue || 0;
    const chClicks = ch.summary?.clicks || 0;
    const chConv = ch.summary?.conversion || 0;

    DATA_SPENDING_LOCAL.push({ name: chName, value: chSpend, fill: chColor });
    DATA_REVENUE_LOCAL.push({ name: chName, value: chRevenue, fill: chColor });

    const scatterData = [];

    const chCostPerConv = chConv > 0 ? chSpend / chConv : chSpend;
    const chRevPerConv = chConv > 0 ? chRevenue / chConv : chRevenue;

    dataCostConversion.push({ name: chName, value: chCostPerConv, fill: chColor });
    dataRevenueConversion.push({ name: chName, value: chRevPerConv, fill: chColor });

    SPENDING_DRILL_LOCAL[chName] = { campaigns: [] };
    REVENUE_DRILL_LOCAL[chName] = { campaigns: [] };

    campaignDataCost[chName] = [];
    campaignRevenueData[chName] = [];
    adDataCost[chName] = {};
    adDataRevenue[chName] = {};

    const campaignsMap = new Map();

    (ch.countries || []).forEach(country => {
      (country.campaigns || []).forEach(camp => {
        const cName = camp.campaignname || `Unknown Campaign`;
        if (!campaignsMap.has(cName)) {
          campaignsMap.set(cName, { name: cName, spend: 0, revenue: 0, clicks: 0, conversion: 0, ads: new Map() });
        }
        const campRef = campaignsMap.get(cName);
        campRef.spend += (camp.summary?.spend || 0);
        campRef.revenue += (camp.summary?.revenue || 0);
        campRef.clicks += (camp.summary?.clicks || 0);
        campRef.conversion += (camp.summary?.conversion || 0);

        (camp.adtypes || []).forEach(adtype => {
          (adtype.ads || []).forEach(ad => {
            const aName = ad.adname || `Unknown Ad`;
            if (!campRef.ads.has(aName)) {
              campRef.ads.set(aName, { name: aName, spend: 0, revenue: 0, clicks: 0, conversion: 0 });
            }
            const adRef = campRef.ads.get(aName);
            adRef.spend += (ad.metrics?.spend || 0);
            adRef.revenue += (ad.metrics?.revenue || 0);
            adRef.clicks += (ad.metrics?.clicks || 0);
            adRef.conversion += (ad.metrics?.conversion || 0);
          });
        });
      });
    });

    const campaigns = Array.from(campaignsMap.values());

    campaigns.forEach((camp, cIdx) => {
      const cName = camp.name;
      const cColor = COLORS[(chIdx + cIdx + 1) % COLORS.length];

      SPENDING_DRILL_LOCAL[chName].campaigns.push({ name: cName, value: camp.spend, fill: cColor });
      REVENUE_DRILL_LOCAL[chName].campaigns.push({ name: cName, value: camp.revenue, fill: cColor });

      const campCostPerConv = camp.conversion > 0 ? camp.spend / camp.conversion : camp.spend;
      const campRevPerConv = camp.conversion > 0 ? camp.revenue / camp.conversion : camp.revenue;

      campaignDataCost[chName].push({ name: cName, value: campCostPerConv, fill: cColor });
      campaignRevenueData[chName].push({ name: cName, value: campRevPerConv, fill: cColor });

      adDataCost[chName][cName] = [];
      adDataRevenue[chName][cName] = [];
      campaignBuckets[cName] = [];

      const ads = Array.from(camp.ads.values());
      ads.forEach((ad, aIdx) => {
        const aName = ad.name;
        const aColor = COLORS[(chIdx + cIdx + aIdx + 2) % COLORS.length];

        campaignBuckets[cName].push({ name: aName, value: ad.spend, fill: aColor });

        const adCostPerConv = ad.conversion > 0 ? ad.spend / ad.conversion : ad.spend;
        const adRevPerConv = ad.conversion > 0 ? ad.revenue / ad.conversion : ad.revenue;

        adDataCost[chName][cName].push({ name: aName, value: adCostPerConv, fill: aColor });
        adDataRevenue[chName][cName].push({ name: aName, value: adRevPerConv, fill: aColor });

        scatterData.push({ x: ad.clicks || 0, y: ad.conversion || 0, name: aName });
      });
    });

    scatterSeries[chName] = { data: scatterData, fill: chColor };
  });

  const getChannelColorLocal = (name) =>
    DATA_SPENDING_LOCAL.find((d) => d.name === name)?.fill ?? DATA_REVENUE_LOCAL.find((d) => d.name === name)?.fill ?? '#6b7280';

  const getCollectionDiscountLocal = (campaign) => campaignBuckets?.[campaign] ?? [];
  const getGroupsLocal = (bucket) => [];

  const tooltipListsLocal = {
    cities: ['Global'],
    campaigns: [],
    devices: ['Desktop', 'Mobile'],
    ads: [],
  };
  const chartNoOutlineCss = `
    .recharts-wrapper:focus,
    .recharts-wrapper:focus-visible,
    .recharts-surface:focus,
    .recharts-surface:focus-visible,
    .recharts-layer:focus,
    .recharts-layer:focus-visible,
    .recharts-sector:focus,
    .recharts-sector:focus-visible {
      outline: none !important;
    }
  `;

  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const visibleScatterKeys = selectedChannel ? [selectedChannel] : Object.keys(scatterSeries);

  const [spendingChannel, setSpendingChannel] = useState(null);
  const [spendingCampaign, setSpendingCampaign] = useState(null);
  const [spendingBucket, setSpendingBucket] = useState(null);
  const [spendingShowSingleChannel, setSpendingShowSingleChannel] = useState(false);

  const [revenueChannel, setRevenueChannel] = useState(null);
  const [revenueCampaign, setRevenueCampaign] = useState(null);
  const [revenueBucket, setRevenueBucket] = useState(null);
  const [revenueShowSingleChannel, setRevenueShowSingleChannel] = useState(false);

  useEffect(() => {
    if (headerSelectedChannel === undefined) return;
    setSelectedChannel(headerSelectedChannel || null);
    setSelectedCampaign(null);
  }, [headerSelectedChannel]);

  useEffect(() => {
    if (headerSelectedCampaign === undefined) return;
    setSelectedCampaign(headerSelectedCampaign || null);
  }, [headerSelectedCampaign]);

  const filteredCostConversion = selectedCampaign
    ? (adDataCost[selectedChannel]?.[selectedCampaign] || [])
    : selectedChannel
      ? (campaignDataCost[selectedChannel] || [])
      : dataCostConversion;

  const filteredRevenueConversion = selectedCampaign
    ? (adDataRevenue[selectedChannel]?.[selectedCampaign] || [])
    : selectedChannel
      ? (campaignRevenueData[selectedChannel] || [])
      : dataRevenueConversion;


  const spendingPieData = useMemo(() => {
    if (spendingShowSingleChannel && selectedChannel) {
      return [{ name: selectedChannel, value: 100, fill: getChannelColorLocal(selectedChannel) }];
    }
    if (!spendingChannel) return DATA_SPENDING_LOCAL;
    if (!spendingCampaign) {
      return SPENDING_DRILL_LOCAL[spendingChannel]?.campaigns || [];
    }
    return getCollectionDiscountLocal(spendingCampaign) || [];
  }, [selectedChannel, spendingBucket, spendingChannel, spendingCampaign, spendingShowSingleChannel, dashboardData]);

  const revenuePieData = useMemo(() => {
    if (revenueShowSingleChannel && selectedChannel) {
      return [{ name: selectedChannel, value: 100, fill: getChannelColorLocal(selectedChannel) }];
    }
    if (!revenueChannel) return DATA_REVENUE_LOCAL;
    if (!revenueCampaign) {
      return REVENUE_DRILL_LOCAL[revenueChannel]?.campaigns || [];
    }
    return getCollectionDiscountLocal(revenueCampaign) || [];
  }, [revenueBucket, revenueChannel, revenueCampaign, revenueShowSingleChannel, selectedChannel, dashboardData]);

  const onSpendingSliceClick = (slice) => {
    const name = getSliceName(slice);
    if (!name) return;
    if (!spendingChannel) {
      setSpendingChannel(name);
      setSpendingShowSingleChannel(false);
      setSelectedChannel(name);
      setRevenueChannel(null);
      setRevenueCampaign(null);
      setRevenueBucket(null);
      setRevenueShowSingleChannel(true);
      return;
    }
    if (!spendingCampaign) {
      setSpendingCampaign((prev) => (prev === name ? null : name));
      setSpendingBucket(null);
      return;
    }
  };

  const onRevenueSliceClick = (slice) => {
    const name = getSliceName(slice);
    if (!name) return;
    if (revenueShowSingleChannel) {
      setRevenueShowSingleChannel(false);
    }
    if (!revenueChannel) {
      setRevenueChannel(name);
      setSelectedChannel(name);
      setSpendingChannel(null);
      setSpendingCampaign(null);
      setSpendingBucket(null);
      setSpendingShowSingleChannel(true);
      return;
    }
    if (!revenueCampaign) {
      setRevenueCampaign((prev) => (prev === name ? null : name));
      setRevenueBucket(null);
      return;
    }
  };

  const resetSpending = () => {
    if (spendingBucket) return setSpendingBucket(null);
    if (spendingCampaign) return setSpendingCampaign(null);
    setSpendingBucket(null);
    setSpendingCampaign(null);
    setSpendingChannel(null);
    setSelectedChannel(null);
    setSpendingShowSingleChannel(false);
    setRevenueShowSingleChannel(false);
  };

  const resetRevenue = () => {
    if (selectedChannel || spendingShowSingleChannel || revenueShowSingleChannel) {
      setSelectedChannel(null);
      setSpendingShowSingleChannel(false);
      setSpendingBucket(null);
      setSpendingCampaign(null);
      setSpendingChannel(null);
      setRevenueShowSingleChannel(false);
      setRevenueBucket(null);
      setRevenueCampaign(null);
      setRevenueChannel(null);
      return;
    }
    if (revenueBucket) return setRevenueBucket(null);
    if (revenueCampaign) return setRevenueCampaign(null);
    setRevenueBucket(null);
    setRevenueCampaign(null);
    setRevenueChannel(null);
  };

  const renderDonutLabel = ({ cx, cy, midAngle, outerRadius, name, value, fill, percent }) => {
    if (value === 0 || (percent && percent < 0.03)) return null;

    const RADIAN = Math.PI / 180;
    // Uniform, shorter radius for a clean look without jagged uneven lines
    const radius = outerRadius + 15;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Start line right at the outer edge of the pie
    const lineX = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const lineY = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';
    const shortName = name && name.length > 12 ? name.substring(0, 12) + '...' : name;

    return (
      <g>
        <path d={`M${lineX},${lineY} L${x},${y}`} stroke="#d1d5db" fill="none" />
        <text x={x + (x > cx ? 4 : -4)} y={y} fill="#4b5563" textAnchor={textAnchor} dominantBaseline="central" fontSize={11}>
          {shortName}
        </text>
      </g>
    );
  };

  const formatScatterX = (tickItem) => {
    if (tickItem === 0) return '0.00';
    return `${(tickItem / 1000).toFixed(2)}K`;
  };

  const formatScatterY = (tickItem) => {
    return tickItem.toFixed(2);
  };



  return (
    <div className="acr-container" style={{ position: 'relative', minHeight: '100%' }}>
      <div className={`campaign-loader-overlay ${isDataLoading ? "show" : ""}`}>
        <Spinner
          className="campaign-loader-spinner"
          style={{ width: "3.5rem", height: "3.5rem" }}
        />
      </div>
      <div className="acr-section">
        <div className="acr-section-header">
          <h2 className="acr-section-title">1. Spend and Revenue</h2>
          <span className="acr-section-subtitle">- Level of detail: Channel/City --&gt; Campaign --&gt; Ads</span>
          {/* <button className="acr-insights-btn">ⓘ Insights</button> */}
        </div>

        <div className="acr-card">
          <div className="acr-row3">

            <div className="acr-chart-col">
              <div className="acr-chart-header">
                <span className="acr-chart-title">Ads Spending by Channel, Campaign and Ad</span>
              </div>

              <div className="acr-chart-wrapper">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={spendingPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={renderDonutLabel}
                      labelLine={false}
                      onClick={onSpendingSliceClick}
                    >
                      {spendingPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      cursor={false}
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ outline: 'none', zIndex: 50 }}
                      content={<RechartTooltip valueFormatter={(v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {(spendingChannel || spendingCampaign || spendingBucket) && (
                  <div
                    onClick={resetSpending}
                    title="Back"
                    className="acr-back-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4472C4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </div>
                )}
              </div>
            </div>


            <div className="acr-chart-col">
              <div className="acr-chart-header">
                <span className="acr-chart-title">Revenue by Channel, Campaign and Ad</span>
              </div>

              <div className="acr-chart-wrapper">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={revenuePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={renderDonutLabel}
                      labelLine={false}
                      onClick={onRevenueSliceClick}
                    >
                      {revenuePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      cursor={false}
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ outline: 'none', zIndex: 50 }}
                      content={<RechartTooltip valueFormatter={(v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {(selectedChannel || spendingShowSingleChannel || revenueShowSingleChannel || revenueChannel || revenueCampaign || revenueBucket) && (
                  <div
                    onClick={resetRevenue}
                    title="Back"
                    className="acr-back-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4472C4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </div>
                )}
              </div>
            </div>


            <div className="acr-chart-col">
              <div className="acr-chart-header">
                <span className="acr-chart-title">Clicks and Conversion relationship</span>
              </div>
              <div className="acr-legend-container">
                {visibleScatterKeys.map((name) => (
                  <span key={name} className="acr-legend-item">
                    <span className="acr-legend-dot" style={{ background: scatterSeries[name]?.fill ?? '#9ca3af' }}></span> {name}
                  </span>
                ))}
              </div>
              <div className="acr-chart-wrapper">
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" opacity={0.8} />
                    <XAxis type="number" dataKey="x" name="Clicks" tickFormatter={formatScatterX} tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 8000]} />
                    <YAxis type="number" dataKey="y" name="Conversions" tickFormatter={formatScatterY} tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 1200]} />
                    <Tooltip
                      cursor={{ stroke: '#9ca3af', strokeDasharray: '3 3' }}
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ outline: 'none', zIndex: 50 }}
                      content={
                        <RechartTooltip
                          valueFormatter={(v, item) => {
                            const x = item?.payload?.x;
                            const y = item?.payload?.y;
                            if (typeof x === 'number' && typeof y === 'number') return `${x.toLocaleString()} clicks • ${y.toLocaleString()} conv`;
                            return v;
                          }}
                        />
                      }
                    />
                    {visibleScatterKeys.map((name) => (
                      <Scatter key={name} name={name} data={scatterSeries[name]?.data ?? []} fill={scatterSeries[name]?.fill ?? '#9ca3af'} shape="circle" />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>

              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="acr-section">
        <div className="acr-section-header">
          <h2 className="acr-section-title">2. Spend and Revenue per Conversion</h2>
          <span className="acr-section-subtitle">- Level of detail: Exchange --&gt; Campaign --&gt; Ads</span>
        </div>

        <div className="acr-card">
          <div className="acr-row2">

            <div className="acr-chart-col-half">
              <div className="acr-chart-header-actions">
                <div className="acr-actions-left">
                  <span
                    className="acr-action-text"
                    style={{ opacity: (selectedChannel || selectedCampaign) ? 1 : 0.5 }}
                    onClick={() => {
                      if (selectedCampaign) {
                        setSelectedCampaign(null);
                      } else if (selectedChannel) {
                        setSelectedChannel(null);
                      }
                    }}
                  >↶ Back</span>

                </div>
                <span className="acr-chart-title-center">Cost per conversion detail</span>
                <div className="acr-actions-right">

                </div>
              </div>
              <div className="acr-bar-chart-wrapper">
                <ResponsiveContainer>
                  <BarChart data={filteredCostConversion} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      {filteredCostConversion.map((entry, index) => (
                        <linearGradient key={`cost-grad-${index}`} id={`cost-grad-${index}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={entry.fill} stopOpacity={0.65} />
                          <stop offset="100%" stopColor={entry.fill} stopOpacity={1} />
                        </linearGradient>
                      ))}
                      <filter id="barShadowCost" x="-10%" y="-10%" width="130%" height="130%">
                        <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.12" />
                      </filter>
                    </defs>
                    <CartesianGrid stroke="#d1d5db" strokeDasharray="4 4" horizontal={false} vertical strokeOpacity={0.6} />
                    <XAxis type="number" tickFormatter={(val) => `$${val.toFixed(2)}`} tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 'auto']} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#1f2937' }} tickFormatter={(val) => val && val.length > 7 ? val.substring(0, 7) + '...' : val} />
                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ outline: 'none', zIndex: 50 }}
                      content={<DataTableTooltip lists={tooltipListsLocal} />}
                    />
                    <Bar
                      dataKey="value"
                      barSize={32}
                      radius={[0, 6, 6, 0]}
                      onClick={(data) => {
                        if (!data || !data.name) return;
                        if (!selectedChannel) {
                          setSelectedChannel(data.name);
                        } else if (!selectedCampaign) {
                          setSelectedCampaign(data.name);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {filteredCostConversion.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#cost-grad-${index})`}
                          filter="url(#barShadowCost)"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>


            <div className="acr-chart-col-half">
              <div className="acr-chart-header-actions">
                <div className="acr-actions-left">
                  <span
                    className="acr-action-text"
                    style={{ opacity: (selectedChannel || selectedCampaign) ? 1 : 0.5 }}
                    onClick={() => {
                      if (selectedCampaign) {
                        setSelectedCampaign(null);
                      } else if (selectedChannel) {
                        setSelectedChannel(null);
                      }
                    }}
                  >↶ Back</span>

                </div>
                <span className="acr-chart-title-center">Revenue per conversion detail</span>
                <div className="acr-actions-right">

                </div>
              </div>
              <div className="acr-bar-chart-wrapper">
                <ResponsiveContainer>
                  <BarChart data={filteredRevenueConversion} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      {filteredRevenueConversion.map((entry, index) => {
                        const cellColor = selectedChannel ? '#5671be' : entry.fill;
                        return (
                          <linearGradient key={`rev-grad-${index}`} id={`rev-grad-${index}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={cellColor} stopOpacity={0.65} />
                            <stop offset="100%" stopColor={cellColor} stopOpacity={1} />
                          </linearGradient>
                        );
                      })}
                      <filter id="barShadowRev" x="-10%" y="-10%" width="130%" height="130%">
                        <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.12" />
                      </filter>
                    </defs>
                    <CartesianGrid stroke="#d1d5db" strokeDasharray="4 4" horizontal={false} vertical strokeOpacity={0.6} />
                    <XAxis type="number" tickFormatter={(val) => `$${val.toFixed(2)}`} tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 'auto']} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#1f2937' }} tickFormatter={(val) => val && val.length > 7 ? val.substring(0, 8) + '...' : val} />
                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ outline: 'none', zIndex: 50 }}
                      content={<DataTableTooltip lists={tooltipListsLocal} />}
                    />
                    <Bar
                      dataKey="value"
                      barSize={32}
                      radius={[0, 6, 6, 0]}
                      onClick={(data) => {
                        if (!data || !data.name) return;
                        if (!selectedChannel) {
                          setSelectedChannel(data.name);
                        } else if (!selectedCampaign) {
                          setSelectedCampaign(data.name);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {filteredRevenueConversion.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#rev-grad-${index})`}
                          filter="url(#barShadowRev)"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

