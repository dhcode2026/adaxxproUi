import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';
import { countrywise } from '../views/api/Api.jsx';
import { Spinner } from 'reactstrap';

const CHANNEL_FILL = {
  Facebook: '#5c7cfa',
  Instagram: '#ff8787',
  Pinterest: '#fa5252',
};

const ChartTooltip = ({ active, payload, label, labelFormatter, valueFormatter }) => {
  if (!active || !payload || payload.length === 0) return null;
  const title = labelFormatter ? labelFormatter(label, payload) : label;

  return (
    <div className="ic-tooltip-container">
      {title ? <div className="ic-tooltip-title">{title}</div> : null}
      {payload.map((item) => {
        const color = item?.payload?.fill ?? item?.color ?? '#9ca3af';
        const seriesName = item?.name ?? item?.dataKey ?? '';
        const rawValue = item?.value ?? item?.payload?.value;
        const formattedValue = valueFormatter ? valueFormatter(rawValue, item) : rawValue;

        return (
          <div key={`${seriesName}-${color}`} className="ic-tooltip-row">
            <span className="ic-tooltip-row-left">
              <span className="ic-tooltip-dot" style={{ background: color }} />
              <span className="ic-tooltip-sub">{seriesName}</span>
            </span>
            <span className="ic-tooltip-value">{formattedValue}</span>
          </div>
        );
      })}
    </div>
  );
};

const formatIndianNumber = (num) => {
  if (num == null) return '0';
  const val = Number(num);
  if (isNaN(val)) return '0';
  if (val >= 10000000) return (val / 10000000).toFixed(2) + 'c';
  if (val >= 100000) return (val / 100000).toFixed(2) + 'L';
  if (val >= 1000) return (val / 1000).toFixed(2) + 'k';
  return Number.isInteger(val) ? val.toString() : val.toFixed(2);
};

export default function ImpressionsCTRView({
  headerSelectedChannel,
  headerSelectedCampaign,
  dateFrom,
  dateTo,
  isLoading
}) {
  const [loading, setLoading] = useState(false);
  const isDataLoading = isLoading || loading;

  const [countrywiseData, setCountrywiseData] = useState([]);

  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCitySeason, setSelectedCitySeason] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [channelSource, setChannelSource] = useState(null);
  const [clicksLevel, setClicksLevel] = useState(0);
  const [conversionsLevel, setConversionsLevel] = useState(0);


  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        if (!dateFrom || !dateTo) return;
        setLoading(true);
        const payload = { startDate: dateFrom, endDate: dateTo };
        const response = await countrywise(payload);
        setCountrywiseData(response.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCountryData();
  }, [dateFrom, dateTo]);

  const {
    dataChannel,
    channelDetailedData,
    dataClicksChannelAll,
    clicksSeasonData,
    dataConversionsChannelAll,
    conversionsSeasonData,
    dataCity,
    cityDetailedData,
    dataAdAll,
    adsDrilled,
    dataClicksAdsAll,
    dataConversionsAdsAll,
    clicksAdsDrilled,
    conversionsAdsDrilled
  } = useMemo(() => {
    const dataChannel = [];
    const channelDetailedData = {};
    const dataClicksChannelAll = [];
    const clicksSeasonData = {};
    const dataConversionsChannelAll = [];
    const conversionsSeasonData = {};

    const dataCity = [];
    const cityDetailedData = {};

    let adImpTotals = {};
    let adClickTotals = {};
    let adConvTotals = {};

    const groupedAds = {};
    const groupedClicksAds = {};
    const groupedConversionsAds = {};

    const list = countrywiseData[0]?.impressionCtrCountries || [];

    const channelAgg = {};
    const channelCampAgg = {};

    const countryAgg = {};
    const countryCampAgg = {};

    list.forEach(countryItem => {
      const countryName = countryItem.country || "Unknown";
      if (!countryAgg[countryName]) {
        countryAgg[countryName] = { imp: 0, click: 0, conv: 0, ctrSum: 0, ctrCount: 0 };
        countryCampAgg[countryName] = {};
      }

      const cData = countryItem.countryData || [];
      cData.forEach(cRow => {
        const exchange = cRow.exchange ? cRow.exchange.charAt(0).toUpperCase() + cRow.exchange.slice(1) : "Other";
        const campName = cRow.campaignName || "Unknown Campaign";
        const imp = cRow.totalImpressions || 0;
        const click = cRow.totalClicks || 0;
        const conv = cRow.totalConversion || 0;
        const ctr = cRow.totalCtr || 0;

        if (!channelAgg[exchange]) {
          channelAgg[exchange] = { imp: 0, click: 0, conv: 0, ctrSum: 0, ctrCount: 0 };
          channelCampAgg[exchange] = {};
          groupedAds[exchange] = {};
          groupedClicksAds[exchange] = {};
          groupedConversionsAds[exchange] = {};
        }
        channelAgg[exchange].imp += imp;
        channelAgg[exchange].click += click;
        channelAgg[exchange].conv += conv;
        channelAgg[exchange].ctrSum += ctr;
        channelAgg[exchange].ctrCount += 1;

        if (!channelCampAgg[exchange][campName]) {
          channelCampAgg[exchange][campName] = { imp: 0, click: 0, conv: 0, ctrSum: 0, ctrCount: 0 };
        }
        channelCampAgg[exchange][campName].imp += imp;
        channelCampAgg[exchange][campName].click += click;
        channelCampAgg[exchange][campName].conv += conv;
        channelCampAgg[exchange][campName].ctrSum += ctr;
        channelCampAgg[exchange][campName].ctrCount += 1;

        if (!selectedChannel || exchange.toLowerCase() === selectedChannel.toLowerCase()) {
          countryAgg[countryName].imp += imp;
          countryAgg[countryName].click += click;
          countryAgg[countryName].conv += conv;
          countryAgg[countryName].ctrSum += ctr;
          countryAgg[countryName].ctrCount += 1;

          if (!countryCampAgg[countryName][campName]) {
            countryCampAgg[countryName][campName] = { imp: 0, click: 0, conv: 0, ctrSum: 0, ctrCount: 0 };
          }
          countryCampAgg[countryName][campName].imp += imp;
          countryCampAgg[countryName][campName].click += click;
          countryCampAgg[countryName][campName].conv += conv;
          countryCampAgg[countryName][campName].ctrSum += ctr;
          countryCampAgg[countryName][campName].ctrCount += 1;
        }

        const matchChannel = !selectedChannel || exchange.toLowerCase() === selectedChannel.toLowerCase();
        const matchCity = !selectedCity || countryName === selectedCity;

        if (matchChannel && matchCity) {
          if (!adImpTotals[campName]) {
            adImpTotals[campName] = 0;
            adClickTotals[campName] = 0;
            adConvTotals[campName] = 0;
          }
          adImpTotals[campName] += imp;
          adClickTotals[campName] += click;
          adConvTotals[campName] += conv;
        }

        if (matchCity) {
          if (!groupedAds[exchange][campName]) groupedAds[exchange][campName] = 0;
          if (!groupedClicksAds[exchange][campName]) groupedClicksAds[exchange][campName] = 0;
          if (!groupedConversionsAds[exchange][campName]) groupedConversionsAds[exchange][campName] = 0;

          groupedAds[exchange][campName] += imp;
          groupedClicksAds[exchange][campName] += click;
          groupedConversionsAds[exchange][campName] += conv;
        }
      });
    });

    Object.keys(channelAgg).forEach(exchange => {
      dataChannel.push({
        name: exchange,
        impression: channelAgg[exchange].imp,
        ctr: Number((channelAgg[exchange].ctrSum / (channelAgg[exchange].ctrCount || 1)).toFixed(2))
      });

      dataClicksChannelAll.push({
        name: exchange,
        value: channelAgg[exchange].click,
        fill: CHANNEL_FILL[exchange] || '#5c7cfa'
      });

      dataConversionsChannelAll.push({
        name: exchange,
        value: channelAgg[exchange].conv,
        fill: CHANNEL_FILL[exchange] || '#5c7cfa'
      });

      channelDetailedData[exchange] = Object.keys(channelCampAgg[exchange]).map(camp => ({
        name: camp,
        impression: channelCampAgg[exchange][camp].imp,
        value: channelCampAgg[exchange][camp].click,
        conversions: channelCampAgg[exchange][camp].conv,
        ctr: Number((channelCampAgg[exchange][camp].ctrSum / channelCampAgg[exchange][camp].ctrCount).toFixed(2))
      })).sort((a, b) => b.impression - a.impression).slice(0, 5);

      clicksSeasonData[exchange] = channelDetailedData[exchange].map(d => ({ name: d.name, value: d.value })).sort((a, b) => b.value - a.value).slice(0, 5);
      conversionsSeasonData[exchange] = channelDetailedData[exchange].map(d => ({ name: d.name, value: d.conversions })).sort((a, b) => b.value - a.value).slice(0, 5);
    });

    Object.keys(countryAgg).forEach(countryName => {
      if (countryAgg[countryName].imp > 0 || !selectedChannel) {
        const cTotal = list.find(c => c.country === countryName);
        const finalImp = selectedChannel ? countryAgg[countryName].imp : (cTotal?.totalImpressions || 0);
        const finalCtr = selectedChannel
          ? (countryAgg[countryName].ctrCount > 0 ? countryAgg[countryName].ctrSum / countryAgg[countryName].ctrCount : 0)
          : (cTotal?.totalCtr || 0);

        dataCity.push({
          name: countryName,
          impression: finalImp,
          ctr: Number(finalCtr.toFixed(2))
        });

        cityDetailedData[countryName] = Object.keys(countryCampAgg[countryName]).map(camp => ({
          name: camp,
          impression: countryCampAgg[countryName][camp].imp,
          ctr: Number((countryCampAgg[countryName][camp].ctrSum / countryCampAgg[countryName][camp].ctrCount).toFixed(2))
        })).sort((a, b) => b.impression - a.impression).slice(0, 5);
      }
    });
    dataCity.sort((a, b) => b.impression - a.impression).splice(5);

    const dataAdAll = Object.keys(adImpTotals).map(camp => ({
      name: camp,
      value: adImpTotals[camp]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    const dataClicksAdsAll = Object.keys(adClickTotals).map(camp => ({
      name: camp,
      clicks: adClickTotals[camp]
    })).sort((a, b) => b.clicks - a.clicks).slice(0, 5);

    const dataConversionsAdsAll = Object.keys(adConvTotals).map(camp => ({
      name: camp,
      conversions: adConvTotals[camp]
    })).sort((a, b) => b.conversions - a.conversions).slice(0, 5);

    const adsDrilled = {};
    const clicksAdsDrilled = {};
    const conversionsAdsDrilled = {};

    Object.keys(groupedAds).forEach(exchange => {
      adsDrilled[exchange] = Object.keys(groupedAds[exchange]).map(camp => ({
        name: camp,
        value: groupedAds[exchange][camp]
      })).sort((a, b) => b.value - a.value).slice(0, 5);

      clicksAdsDrilled[exchange] = Object.keys(groupedClicksAds[exchange]).map(camp => ({
        name: camp,
        clicks: groupedClicksAds[exchange][camp]
      })).sort((a, b) => b.clicks - a.clicks).slice(0, 5);

      conversionsAdsDrilled[exchange] = Object.keys(groupedConversionsAds[exchange]).map(camp => ({
        name: camp,
        conversions: groupedConversionsAds[exchange][camp]
      })).sort((a, b) => b.conversions - a.conversions).slice(0, 5);
    });

    return {
      dataChannel,
      channelDetailedData,
      dataClicksChannelAll,
      clicksSeasonData,
      dataConversionsChannelAll,
      conversionsSeasonData,
      dataCity,
      cityDetailedData,
      dataAdAll,
      adsDrilled,
      dataClicksAdsAll,
      dataConversionsAdsAll,
      clicksAdsDrilled,
      conversionsAdsDrilled
    };
  }, [countrywiseData, selectedChannel, selectedCity]);

  const cityDeviceData = useMemo(() => ({}), []);
  const channelDeviceData = useMemo(() => ({}), []);
  const clicksDeviceData = useMemo(() => [], []);
  const conversionsDeviceData = useMemo(() => [], []);




  useEffect(() => {
    if (headerSelectedChannel === undefined) return;
    setSelectedChannel(headerSelectedChannel || null);
    setSelectedSeason(null);
    setSelectedCity(null);
    setSelectedCitySeason(null);
    setSelectedAd(null);
    setChannelSource(null);
    setClicksLevel(0);
    setConversionsLevel(0);
  }, [headerSelectedChannel]);

  useEffect(() => {
    if (headerSelectedCampaign === undefined) return;
    setSelectedSeason(headerSelectedCampaign || null);
    setSelectedCity(null);
    setSelectedCitySeason(null);
    setSelectedAd(null);
    setChannelSource(null);
    setClicksLevel(0);
    setConversionsLevel(0);
  }, [headerSelectedCampaign]);

  const displayChannelData = !selectedChannel
    ? dataChannel
    : channelSource === 'bar'
      ? selectedSeason
        ? (channelDeviceData[selectedChannel]?.[selectedSeason] ?? [])
        : (channelDetailedData[selectedChannel] || [])
      : dataChannel.filter(item => item.name === selectedChannel);
  const displayClicksData = !selectedChannel
    ? dataClicksChannelAll
    : clicksLevel === 2
      ? clicksDeviceData
      : clicksLevel === 1
        ? clicksSeasonData[selectedChannel] || []
        : [{ name: selectedChannel, value: dataClicksChannelAll.find(c => c.name === selectedChannel)?.value || 0, fill: CHANNEL_FILL[selectedChannel] ?? '#5c7cfa' }];
  const displayConversionsData = !selectedChannel
    ? dataConversionsChannelAll
    : conversionsLevel === 2
      ? conversionsDeviceData
      : conversionsLevel === 1
        ? conversionsSeasonData[selectedChannel] || []
        : [{ name: selectedChannel, value: dataConversionsChannelAll.find(c => c.name === selectedChannel)?.value || 0, fill: CHANNEL_FILL[selectedChannel] ?? '#5c7cfa' }];
  const displayAdData = selectedChannel ? (adsDrilled[selectedChannel] || []) : dataAdAll;
  const baseClicksAds = selectedChannel ? (clicksAdsDrilled[selectedChannel] || []) : dataClicksAdsAll;
  const baseConversionsAds = selectedChannel ? (conversionsAdsDrilled[selectedChannel] || []) : dataConversionsAdsAll;
  const displayClicksAds = selectedAd ? baseClicksAds.filter(d => d.name === selectedAd) : baseClicksAds;
  const displayConversionsAds = selectedAd ? baseConversionsAds.filter(d => d.name === selectedAd) : baseConversionsAds;



  const selectChannel = (name, source = 'bar') => {
    if (!name || selectedChannel) return;
    setSelectedChannel(name);
    setSelectedSeason(null);
    setChannelSource(source);
    if (source === 'conversions') {
      setClicksLevel(0);
      setConversionsLevel(1);
    } else if (source === 'clicks') {
      setClicksLevel(1);
      setConversionsLevel(0);
    } else {
      setClicksLevel(0);
      setConversionsLevel(0);
    }
  };

  const selectSeason = (name) => {
    if (!name || !selectedChannel || selectedSeason) return;
    const allowed = (channelDetailedData[selectedChannel] ?? []).some((row) => row?.name === name);
    if (!allowed) return;
    setSelectedSeason(name);
  };

  const handleChannelClick = (evt) => {
    const name = evt?.activePayload?.[0]?.payload?.name ?? evt?.payload?.name ?? evt?.name ?? null;
    selectChannel(name);
  };

  const handleSeasonClick = (evt) => {
    const name = evt?.activePayload?.[0]?.payload?.name ?? evt?.payload?.name ?? evt?.name ?? null;
    selectSeason(name);
  };

  const handleReset = () => {
    if (selectedAd) return setSelectedAd(null);
    if (selectedSeason) return setSelectedSeason(null);
    setSelectedChannel(null);
    setSelectedSeason(null);
    setSelectedAd(null);
    setChannelSource(null);
    setClicksLevel(0);
    setConversionsLevel(0);
  };

  const handleClicksBack = () => {
    if (clicksLevel === 2) {
      setClicksLevel(1);
      setSelectedSeason(null);
    } else if (clicksLevel === 1 && conversionsLevel === 0) {
      handleReset();
    } else if (clicksLevel === 1) {
      setClicksLevel(0);
    } else {
      handleReset();
    }
  };

  const handleConversionsBack = () => {
    if (conversionsLevel === 2) {
      setConversionsLevel(1);
      setSelectedSeason(null);
    } else if (conversionsLevel === 1 && clicksLevel === 0) {
      handleReset();
    } else if (conversionsLevel === 1) {
      setConversionsLevel(0);
    } else {
      handleReset();
    }
  };

  const displayCityData = !selectedCity
    ? dataCity
    : selectedCitySeason
      ? (cityDeviceData[selectedCity]?.[selectedCitySeason] ?? [])
      : cityDetailedData[selectedCity] || [];

  const selectCity = (name) => {
    if (!name || selectedCity) return;
    setSelectedCity(name);
    setSelectedCitySeason(null);
  };

  const selectCitySeason = (name) => {
    if (!name || !selectedCity || selectedCitySeason) return;
    const allowed = (cityDetailedData[selectedCity] ?? []).some((row) => row?.name === name);
    if (!allowed) return;
    setSelectedCitySeason(name);
  };

  const handleCityClick = (evt) => {
    const name = evt?.activePayload?.[0]?.payload?.name ?? evt?.payload?.name ?? evt?.name ?? null;
    selectCity(name);
  };

  const handleCitySeasonClick = (evt) => {
    const name = evt?.activePayload?.[0]?.payload?.name ?? evt?.payload?.name ?? evt?.name ?? null;
    selectCitySeason(name);
  };

  const handleCityReset = () => {
    if (selectedCitySeason) return setSelectedCitySeason(null);
    setSelectedCity(null);
    setSelectedCitySeason(null);
  };

  const COLORS_DONUT_1 = ['#0369a1', '#0ea5e9', '#38bdf8', '#7dd3fc'];
  const COLORS_DONUT_2 = selectedChannel ? ['#5c7cfa', '#7dc7f2', '#c8e8fb'] : ['#5c7cfa', '#ff8787', '#fa5252'];

  const hasChannelData = displayChannelData && displayChannelData.length > 0 && displayChannelData.some(d => d.impression > 0 || d.ctr > 0);
  const hasCityData = displayCityData && displayCityData.length > 0 && displayCityData.some(d => d.impression > 0 || d.ctr > 0);
  const hasAdData = displayAdData && displayAdData.length > 0 && displayAdData.some(d => d.value > 0);
  const hasClicksData = displayClicksData && displayClicksData.length > 0 && displayClicksData.some(d => d.value > 0);
  const hasConversionsData = displayConversionsData && displayConversionsData.length > 0 && displayConversionsData.some(d => d.value > 0);
  const hasClicksAdsData = displayClicksAds && displayClicksAds.length > 0 && displayClicksAds.some(d => d.clicks > 0);
  const hasConversionsAdsData = displayConversionsAds && displayConversionsAds.length > 0 && displayConversionsAds.some(d => d.conversions > 0);

  const NoDataView = ({ onBack, showBack }) => (
    <div className="ic-no-data">
      <div>No data available</div>
      {showBack && (
        <button onClick={onBack} className="ic-center-back-btn" title="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );

  const displayedTotalImpressions = (() => {
    if (!selectedChannel) return dataChannel.reduce((sum, row) => sum + (Number(row.impression) || 0), 0);
    if (!selectedSeason) return dataChannel.find((row) => row.name === selectedChannel)?.impression ?? 0;
    return channelDetailedData[selectedChannel]?.find((row) => row.name === selectedSeason)?.impression ?? 0;
  })();

  // Fixed donut label to prevent text overlap
  const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 15; // pull text closer to the line end
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';

    const shortName = name.length > 10 ? name.substring(0, 10) + "..." : name;

    // Adjust line start for better visibility
    const lineX1 = cx + (outerRadius + 2) * Math.cos(-midAngle * RADIAN);
    const lineY1 = cy + (outerRadius + 2) * Math.sin(-midAngle * RADIAN);
    const lineX2 = cx + (outerRadius + 10) * Math.cos(-midAngle * RADIAN);
    const lineY2 = cy + (outerRadius + 10) * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} stroke="#9ca3af" strokeWidth={1} />
        <text
          x={x + (x > cx ? 4 : -4)}
          y={y}
          fill="#4b5563"
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize={10}
          fontWeight={500}
        >
          <tspan x={x + (x > cx ? 4 : -4)} dy="-0.4em">{shortName}</tspan>
          <tspan x={x + (x > cx ? 4 : -4)} dy="1.2em">{`${(percent * 100).toFixed(1)}%`}</tspan>
        </text>
      </g>
    );
  };

  const ChannelYAxisTick = ({ x, y, payload }) => {
    const name = payload?.value;
    const isChannel = !selectedChannel && (dataChannel ?? []).some((row) => row?.name === name);
    const isSecondLevel = !!selectedChannel && !selectedSeason && (channelDetailedData[selectedChannel] ?? []).some((row) => row?.name === name);
    const isClickable = isChannel || isSecondLevel;

    const handleClick = () => {
      if (!selectedChannel && isChannel) {
        selectChannel(name, 'bar');
      } else if (selectedChannel && !selectedSeason && isSecondLevel) {
        selectSeason(name);
      }
    };

    const shortName = name && name.length > 11 ? name.substring(0, 11) : name;

    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="end"
        fill="#1f2937"
        className={isClickable ? "ic-pointer ic-clickable-text" : "ic-default-cursor ic-clickable-text"}
        onClick={handleClick}
      >
        {shortName}
      </text>
    );
  };

  const CityYAxisTick = ({ x, y, payload }) => {
    const name = payload?.value;
    const isClickable = !selectedCity || (selectedCity && !selectedCitySeason);
    const shortName = name && name.length > 10 ? name.substring(0, 10) + "..." : name;

    const handleClick = () => {
      if (!selectedCity) {
        selectCity(name);
      } else if (selectedCity && !selectedCitySeason) {
        selectCitySeason(name);
      }
    };

    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="end"
        fill="#1f2937"
        className={isClickable ? "ic-pointer ic-clickable-text" : "ic-default-cursor ic-clickable-text"}
        onClick={handleClick}
      >
        <title>{name}</title>
        {shortName}
      </text>
    );
  };

  return (
    <div className="ic-container" style={{ position: 'relative', minHeight: '100%' }}>
      <div className={`campaign-loader-overlay ${isDataLoading ? "show" : ""}`}>
        <Spinner
          className="campaign-loader-spinner"
          style={{ width: "3.5rem", height: "3.5rem" }}
        />
      </div>

      {/* Section 1 */}
      <div className="ic-section">
        <div className="ic-section-header">
          <h2 className="ic-section-title">1. Impressions and CTR Breakdown</h2>
          <span className="ic-section-subtitle">- Level of detail: Channel/Country --&gt; Campaign --&gt; Ads</span>

        </div>

        <div className="ic-card">
          <div className="ic-row3">
            {/* Chart 1.1 */}
            <div className="ic-chart-col">
              <div className="ic-chart-header">
                <span className="ic-chart-title">by Channel and Campaign</span>

              </div>
              {selectedChannel ? (
                <div className="ic-chart-controls">
                  <span className="ic-chart-controls-text">Selected: <strong>{selectedChannel}</strong></span>
                  <button onClick={handleReset} className="ic-reset-btn">↻ Reset</button>
                </div>
              ) : selectedCity ? (
                <div className="ic-chart-spacer" />
              ) : null}
              <div className="ic-bar-chart-wrapper">
                {!hasChannelData ? (
                  <NoDataView />
                ) : (
                  <ResponsiveContainer>
                    <BarChart
                      data={displayChannelData}
                      layout="vertical"
                      margin={{ top: 20, right: 80, left: 20, bottom: 5 }}
                      onClick={!selectedChannel ? handleChannelClick : !selectedSeason ? handleSeasonClick : undefined}
                    >
                      <CartesianGrid stroke="transparent" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={<ChannelYAxisTick />} width={90} />
                      <Tooltip
                        cursor={false}
                        allowEscapeViewBox={{ x: false, y: true }}
                        wrapperClassName="ic-tooltip-wrapper"
                        content={
                          <ChartTooltip
                            valueFormatter={(v, item) => {
                              if (item?.dataKey === 'ctr') return `${Number(v).toFixed(2)}%`;
                              return `${Number(v).toLocaleString()}`;
                            }}
                          />
                        }
                      />
                      <Legend wrapperStyle={{ top: -10, fontSize: 12 }} iconType="circle" />
                      <Bar
                        dataKey="impression"
                        name="Impression"
                        fill="#58c4a0"
                        barSize={16}
                        radius={[0, 4, 4, 0]}
                        activeBar={false}
                        className={(!selectedChannel || !selectedSeason) ? "ic-pointer" : "ic-default-cursor"}
                        onClick={(data) => {
                          const name = data?.payload?.name;
                          if (!selectedChannel) {
                            selectChannel(name, 'bar');
                          } else if (!selectedSeason && (channelDetailedData[selectedChannel] ?? []).some((row) => row?.name === name)) {
                            selectSeason(name);
                          }
                        }}
                      >
                        {displayChannelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#58c4a0" />
                        ))}
                        <LabelList dataKey="impression" position="right" formatter={(v) => `${v}`} className="ic-label-list" offset={10} />
                      </Bar>
                      <Bar
                        dataKey="ctr"
                        name="CTR"
                        fill="#0f4a7a"
                        barSize={16}
                        radius={[0, 4, 4, 0]}
                        activeBar={false}
                        className={(!selectedChannel || !selectedSeason) ? "ic-pointer" : "ic-default-cursor"}
                        onClick={(data) => {
                          const name = data?.payload?.name;
                          if (!selectedChannel) {
                            selectChannel(name, 'bar');
                          } else if (!selectedSeason && (channelDetailedData[selectedChannel] ?? []).some((row) => row?.name === name)) {
                            selectSeason(name);
                          }
                        }}
                      >
                        {displayChannelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#0f4a7a" />
                        ))}
                        <LabelList dataKey="ctr" position="right" formatter={(v) => `${v}%`} className="ic-label-list" offset={10} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 1.2 */}
            <div className="ic-chart-col">
              <div className="ic-chart-header">
                <span className="ic-chart-title">by Country and Campaign</span>

              </div>
              {selectedCity ? (
                <div className="ic-chart-controls">
                  <span className="ic-chart-controls-text">Selected: <strong>{selectedCity}</strong></span>
                  <button onClick={handleCityReset} className="ic-reset-btn">↻ Reset</button>
                </div>
              ) : selectedChannel ? (
                <div className="ic-chart-spacer" />
              ) : null}
              <div className="ic-bar-chart-wrapper">
                {!hasCityData ? (
                  <NoDataView />
                ) : (
                  <ResponsiveContainer>
                    <BarChart
                      data={displayCityData}
                      layout="vertical"
                      margin={{ top: 20, right: 80, left: 20, bottom: 5 }}
                      onClick={!selectedCity ? handleCityClick : selectedCitySeason ? undefined : handleCitySeasonClick}
                    >
                      <CartesianGrid stroke="transparent" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={<CityYAxisTick />} width={90} />
                      <Tooltip
                        cursor={false}
                        allowEscapeViewBox={{ x: false, y: true }}
                        wrapperClassName="ic-tooltip-wrapper"
                        content={
                          <ChartTooltip
                            valueFormatter={(v, item) => {
                              if (item?.dataKey === 'ctr') return `${Number(v).toFixed(2)}%`;
                              return `${Number(v).toLocaleString()}`;
                            }}
                          />
                        }
                      />
                      <Legend wrapperStyle={{ top: -10, fontSize: 12 }} iconType="circle" />
                      <Bar
                        dataKey="impression"
                        name="Impression"
                        fill="#58c4a0"
                        barSize={16}
                        radius={[0, 4, 4, 0]}
                        activeBar={false}
                        className={!selectedCity || (selectedCity && !selectedCitySeason) ? "ic-pointer" : "ic-default-cursor"}
                        onClick={(data) => {
                          if (!selectedCity) return selectCity(data?.payload?.name);
                          if (selectedCity && !selectedCitySeason) return selectCitySeason(data?.payload?.name);
                          return null;
                        }}
                      >
                        {displayCityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#58c4a0" />
                        ))}
                        <LabelList dataKey="impression" position="right" formatter={(v) => `${v}`} className="ic-label-list" offset={10} />
                      </Bar>
                      <Bar
                        dataKey="ctr"
                        name="CTR"
                        fill="#0f4a7a"
                        barSize={16}
                        radius={[0, 4, 4, 0]}
                        activeBar={false}
                        className={!selectedCity || (selectedCity && !selectedCitySeason) ? "ic-pointer" : "ic-default-cursor"}
                        onClick={(data) => {
                          if (!selectedCity) return selectCity(data?.payload?.name);
                          if (selectedCity && !selectedCitySeason) return selectCitySeason(data?.payload?.name);
                          return null;
                        }}
                      >
                        {displayCityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#0f4a7a" />
                        ))}
                        <LabelList dataKey="ctr" position="right" formatter={(v) => `${v}%`} className="ic-label-list" offset={10} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 1.3 */}
            <div className="ic-chart-col">
              <div className="ic-chart-header">
                <span className="ic-chart-title">by Ad</span>
              </div>
              {selectedChannel || selectedCity ? (
                <div className="ic-chart-spacer" />
              ) : null}
              <div className="ic-pie-chart-wrapper">
                <ResponsiveContainer>
                  <PieChart className="ic-overflow-visible">
                    <Pie
                      data={displayAdData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      label={renderDonutLabel}
                      labelLine={true}
                      className="ic-cursor-pointer"
                      onClick={(data) => {
                        const name = data?.name ?? data?.payload?.name;
                        setSelectedAd(prev => prev === name ? null : name);
                      }}
                    >
                      {displayAdData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS_DONUT_1[index % COLORS_DONUT_1.length]}
                          opacity={selectedAd && selectedAd !== entry.name ? 0.3 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      cursor={false}
                      allowEscapeViewBox={{ x: false, y: true }}
                      wrapperClassName="ic-tooltip-wrapper"
                      content={<ChartTooltip valueFormatter={(v) => Number(v).toLocaleString()} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="ic-donut-center">
                  <div className="ic-donut-center-value">{formatIndianNumber(displayedTotalImpressions)}</div>
                  <div className="ic-donut-center-label">Impressions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="ic-section">
        <div className="ic-section-header">
          <h2 className="ic-section-title">2. Clicks and Conversion Breakdown</h2>
          <span className="ic-section-subtitle">- Level of detail: Channel/Country --&gt; Campaign --&gt; Ads</span>
        </div>

        <div className="ic-card">
          <div className="ic-row3">
            {/* Chart 2.1 */}
            <div className="ic-chart-col">
              <div className="ic-sub-chart-title">
                Clicks by Channel and Campaign
              </div>
              <div className="ic-legend-container">
                {displayClicksData.map((entry, index) => {
                  const shortName = entry.name && entry.name.length > 10 ? entry.name.substring(0, 10) + "..." : entry.name;
                  return (
                    <span key={entry.name} className="ic-legend-item" title={entry.name}>
                      <span className="ic-legend-dot" style={{ background: entry.fill ?? COLORS_DONUT_2[index % COLORS_DONUT_2.length] }}></span>
                      {shortName}
                    </span>
                  );
                })}
              </div>
              <div className="ic-clicks-chart-wrapper">
                {!hasClicksData ? (
                  <NoDataView showBack={!!selectedChannel} onBack={handleClicksBack} />
                ) : (
                  <>
                    <ResponsiveContainer>
                      <PieChart style={{ overflow: 'visible' }}>
                        <Pie
                          data={displayClicksData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          label={renderDonutLabel}
                          labelLine={true}
                          style={{ cursor: 'pointer' }}
                          onClick={(data) => {
                            const name = data?.name ?? data?.payload?.name;
                            if (!selectedChannel) {
                              selectChannel(name, 'clicks');
                            } else if (clicksLevel === 0) {
                              setClicksLevel(1);
                            } else if (clicksLevel === 1) {
                              setClicksLevel(2);
                              if ((channelDetailedData[selectedChannel] ?? []).some((row) => row?.name === name)) setSelectedSeason(name);
                            }
                          }}
                        >
                          {displayClicksData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill ?? COLORS_DONUT_2[index % COLORS_DONUT_2.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          cursor={false}
                          allowEscapeViewBox={{ x: false, y: true }}
                          wrapperClassName="ic-tooltip-wrapper"
                          content={<ChartTooltip valueFormatter={(v) => Number(v).toLocaleString()} />}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {selectedChannel && (
                      <div className="ic-clicks-donut-center">
                        <button onClick={handleClicksBack} className="ic-center-back-btn" title="Back">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Chart 2.2 */}
            <div className="ic-chart-col">
              <div className="ic-sub-chart-title">
                Conversions by Channel and Campaign
              </div>
              <div className="ic-legend-container">
                {displayConversionsData.map((entry, index) => {
                  const shortName = entry.name && entry.name.length > 10 ? entry.name.substring(0, 10) + "..." : entry.name;
                  return (
                    <span key={entry.name} className="ic-legend-item" title={entry.name}>
                      <span className="ic-legend-dot" style={{ background: entry.fill ?? COLORS_DONUT_2[index % COLORS_DONUT_2.length] }}></span>
                      {shortName}
                    </span>
                  );
                })}
              </div>
              <div className="ic-clicks-chart-wrapper">
                {!hasConversionsData ? (
                  <NoDataView showBack={!!selectedChannel} onBack={handleConversionsBack} />
                ) : (
                  <>
                    <ResponsiveContainer>
                      <PieChart style={{ overflow: 'visible' }}>
                        <Pie
                          data={displayConversionsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          label={renderDonutLabel}
                          labelLine={true}
                          style={{ cursor: 'pointer' }}
                          onClick={(data) => {
                            const name = data?.name ?? data?.payload?.name;
                            if (!selectedChannel) {
                              selectChannel(name, 'conversions');
                            } else if (conversionsLevel === 0) {
                              setConversionsLevel(1);
                            } else if (conversionsLevel === 1) {
                              setConversionsLevel(2);
                              if ((channelDetailedData[selectedChannel] ?? []).some((row) => row?.name === name)) setSelectedSeason(name);
                            }
                          }}
                        >
                          {displayConversionsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill ?? COLORS_DONUT_2[index % COLORS_DONUT_2.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          cursor={false}
                          allowEscapeViewBox={{ x: false, y: true }}
                          wrapperClassName="ic-tooltip-wrapper"
                          content={<ChartTooltip valueFormatter={(v) => Number(v).toLocaleString()} />}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {selectedChannel && (
                      <div className="ic-clicks-donut-center">
                        <button onClick={handleConversionsBack} className="ic-center-back-btn" title="Back">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Chart 2.3 & 2.4 - Bars */}
            <div className="ic-chart-col ic-col-stack">
              {/* Clicks by Ads */}
              <div className="ic-flex-1">
                <div className="ic-small-sub-chart-title">
                  Click by Ads
                </div>
                <div className="ic-small-chart-wrapper">
                  {!hasClicksAdsData ? (
                    <NoDataView />
                  ) : (
                    <ResponsiveContainer>
                      <BarChart data={displayClicksAds} layout="vertical" margin={{ top: 0, right: 80, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#1f2937' }} width={110} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + "..." : val} />
                        <Tooltip
                          cursor={false}
                          allowEscapeViewBox={{ x: false, y: true }}
                          wrapperClassName="ic-tooltip-wrapper"
                          content={<ChartTooltip valueFormatter={(v) => Number(v).toLocaleString()} />}
                        />
                        <Bar dataKey="clicks" name="Clicks" fill="#0ea5e9" barSize={12} radius={[0, 4, 4, 0]}>
                          {displayClicksAds.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#0284c7" />
                          ))}
                          <LabelList dataKey="clicks" position="right" formatter={(v) => Number(v).toLocaleString()} className="ic-label-list" offset={10} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Conversion by Ads */}
              <div className="ic-flex-1">
                <div className="ic-small-sub-chart-title">
                  Conversion by Ads
                </div>
                <div className="ic-small-chart-wrapper">
                  {!hasConversionsAdsData ? (
                    <NoDataView />
                  ) : (
                    <ResponsiveContainer>
                      <BarChart data={displayConversionsAds} layout="vertical" margin={{ top: 0, right: 80, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#1f2937' }} width={110} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + "..." : val} />
                        <Tooltip
                          cursor={false}
                          allowEscapeViewBox={{ x: false, y: true }}
                          wrapperClassName="ic-tooltip-wrapper"
                          content={<ChartTooltip valueFormatter={(v) => Number(v).toLocaleString()} />}
                        />
                        <Bar dataKey="conversions" name="Conversions" fill="#0ea5e9" barSize={12} radius={[0, 4, 4, 0]}>
                          {displayConversionsAds.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#0284c7" />
                          ))}
                          <LabelList dataKey="conversions" position="right" formatter={(v) => Number(v).toLocaleString()} className="ic-label-list" offset={10} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

