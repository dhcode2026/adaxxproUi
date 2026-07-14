import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import { FaCaretDown } from "react-icons/fa";
import { Input } from "reactstrap";

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const getCurrentWeekRange = () => {
  const today = new Date();
  const start = startOfDay(today);
  start.setDate(start.getDate() - 6);

  return {
    startDate: start,
    endDate: endOfDay(today),
  };
};

const isSameDay = (first, second) => {
  if (!first || !second) return false;
  return startOfDay(first).getTime() === startOfDay(second).getTime();
};

const isSameDateRange = (firstRange, secondRange) => (
  isSameDay(firstRange?.startDate, secondRange?.startDate) &&
  isSameDay(firstRange?.endDate, secondRange?.endDate)
);
export default function Header({
  activeTab,
  setActiveTab,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  channel,
  campaign,
  availableChannels,
  availableCampaigns,
  onChannelChange,
  onCampaignChange,
  onReset,
  overviewData,
}) {
  const [localDateFrom, setLocalDateFrom] = useState(dateFrom || "");
  const [localDateTo, setLocalDateTo] = useState(dateTo || "");
  const [localChannel, setLocalChannel] = useState(channel || null);
  const [localCampaign, setLocalCampaign] = useState(campaign || null);
  const [openCampaignDropdown, setOpenCampaignDropdown] = useState(false);
  const [openChannelDropdown, setOpenChannelDropdown] = useState(false);

  const dateRangePopupRef = useRef(null);
  const tableDateRangeRef = useRef(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState({
    startDate: dateFrom ? new Date(dateFrom) : null,
    endDate: dateTo ? new Date(dateTo) : null,
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dateRangePopupRef.current &&
        !dateRangePopupRef.current.contains(event.target) &&
        tableDateRangeRef.current &&
        !tableDateRangeRef.current.contains(event.target)
      ) {
        setShowDateRangePicker(false);
      }
      // Close channel dropdown when clicking outside
      const channelWrapper = document.getElementById("channel-wrapper");
      if (channelWrapper && !channelWrapper.contains(event.target)) {
        setOpenChannelDropdown(false);
      }
      // Close campaign dropdown when clicking outside
      const campaignWrapper = document.getElementById("campaign-wrapper");
      if (campaignWrapper && !campaignWrapper.contains(event.target)) {
        setOpenCampaignDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPresetRange = useCallback((preset) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    switch (preset) {
      case "Last 7 days":
        return getCurrentWeekRange();
      case "Today":
        return { startDate: startOfToday, endDate: endOfToday };
      case "Yesterday": {
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 1);
        const end = new Date(endOfToday);
        end.setDate(end.getDate() - 1);
        return { startDate: start, endDate: end };
      }
      case "Last 30 days": {
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 29);
        return { startDate: start, endDate: endOfToday };
      }
      case "This month": {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: start, endDate: endOfToday };
      }
      case "Last month": {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        return { startDate: start, endDate: end };
      }
      case "Last 3 months": {
        const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        return { startDate: start, endDate: endOfToday };
      }
      default:
        return { startDate: null, endDate: null };
    }
  }, []);

  const handlePresetSelect = useCallback((preset) => {
    const range = getPresetRange(preset);
    setDraftDateRange(range);
  }, [getPresetRange]);

  const formatPickerValue = useCallback((date) => {
    if (!date) return "-- / -- / ----";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day} / ${month} / ${year}`;
  }, []);

  const formatPayloadDate = useCallback((date) => {
    if (!date) return null;
    const normalized = new Date(date);
    if (Number.isNaN(normalized.getTime())) return null;

    const year = normalized.getFullYear();
    const month = String(normalized.getMonth() + 1).padStart(2, "0");
    const day = String(normalized.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const handleDateRangeClear = useCallback(() => {
    setDraftDateRange({ startDate: null, endDate: null });
    setLocalDateFrom("");
    setLocalDateTo("");
    setShowDateRangePicker(false);
  }, []);

  const handleDateRangeApply = useCallback(() => {
    if (!draftDateRange.startDate || !draftDateRange.endDate) {
      return;
    }

    const startDate = draftDateRange.startDate <= draftDateRange.endDate
      ? draftDateRange.startDate
      : draftDateRange.endDate;
    const endDate = draftDateRange.startDate <= draftDateRange.endDate
      ? draftDateRange.endDate
      : draftDateRange.startDate;

    const newDateFrom = formatPayloadDate(startDate);
    const newDateTo = formatPayloadDate(endDate);

    setLocalDateFrom(newDateFrom);
    setLocalDateTo(newDateTo);
    setShowDateRangePicker(false);

    onDateFromChange?.(newDateFrom);
    onDateToChange?.(newDateTo);
    onChannelChange?.(localChannel);
    onCampaignChange?.(localCampaign);
  }, [
    draftDateRange.endDate,
    draftDateRange.startDate,
    formatPayloadDate,
    onDateFromChange,
    onDateToChange,
    onChannelChange,
    onCampaignChange,
    localChannel,
    localCampaign,
  ]);

  const openDateRangePicker = useCallback(() => {
    setDraftDateRange({
      startDate: localDateFrom ? new Date(localDateFrom) : null,
      endDate: localDateTo ? new Date(localDateTo) : null,
    });
    setShowDateRangePicker(true);
  }, [localDateFrom, localDateTo]);

  const toggleDateRangePicker = useCallback(() => {
    if (showDateRangePicker) {
      setShowDateRangePicker(false);
    } else {
      openDateRangePicker();
    }
  }, [showDateRangePicker, openDateRangePicker]);

  const dateDisplayOptions = useMemo(() => ({
    day: "numeric",
    month: "short",
    year: "numeric"
  }), []);
  const currentWeekRange = useMemo(() => getCurrentWeekRange(), []);

  const formatDateRangeLabel = useCallback((startDateStr, endDateStr) => {
    if (startDateStr && endDateStr) {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      if (isSameDateRange({ startDate, endDate }, currentWeekRange)) {
        return "Last 7 days";
      }
      return `${startDate.toLocaleDateString(undefined, dateDisplayOptions)} - ${endDate.toLocaleDateString(undefined, dateDisplayOptions)}`;
    }
    return "Date Range";
  }, [currentWeekRange, dateDisplayOptions]);

  const dateRangeLabel = useMemo(() => (
    formatDateRangeLabel(localDateFrom, localDateTo)
  ), [localDateFrom, localDateTo, formatDateRangeLabel]);

  useEffect(() => {
    setLocalDateFrom(dateFrom || "");
  }, [dateFrom]);

  useEffect(() => {
    setLocalDateTo(dateTo || "");
  }, [dateTo]);

  useEffect(() => {
    setLocalChannel(channel || null);
  }, [channel]);

  useEffect(() => {
    setLocalCampaign(campaign || null);
  }, [campaign]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "impressions", label: "Impressions & CTR" },
    { id: "adcost", label: "Spend & Revenue" },
  ];

  const handleLocalChannelChange = (newChannel) => {
    setLocalChannel(newChannel || null);
    setLocalCampaign(null);
  };

  const handleLocalCampaignChange = (newCampaign) => {
    setLocalCampaign(newCampaign || null);
  };

  const localAvailableCampaigns = useMemo(() => {
    if (!localChannel) return [];
    const exchange = (overviewData?.exchanges ?? []).find((e) => e.name?.toLowerCase() === localChannel?.toLowerCase());
    if (!exchange) return [];
    const set = new Set();
    (exchange.adFormats ?? []).forEach((format) => {
      (format.campaigns ?? []).forEach((camp) => {
        if (camp?.campaign) set.add(camp.campaign);
      });
    });
    return Array.from(set);
  }, [overviewData, localChannel]);

  const campaignsList = localAvailableCampaigns.length > 0
    ? localAvailableCampaigns
    : (localChannel === channel ? (availableCampaigns ?? []) : []);

  const handleApply = () => {
    onDateFromChange?.(localDateFrom);
    onDateToChange?.(localDateTo);
    onChannelChange?.(localChannel);
    onCampaignChange?.(localCampaign);
  };

  return (
    <div className="db-header-container">
      <div className="db-header-row">
        <div className="db-header-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`db-tab ${activeTab === tab.id
                ? "db-tab-active"
                : "db-tab-inactive"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="db-filters-container">


          <div className="db-group">
            <label>Date:</label>

            <div className="cd-date-range-wrapper" ref={tableDateRangeRef} style={{ position: 'relative' }}>
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
              <button
                type="button"
                className="db-select"
                style={{ width: "auto", minWidth: "130px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "0 10px" }}
                onClick={toggleDateRangePicker}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}>
                  <FontAwesomeIcon icon={faCalendarAlt} size="sm" />
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>{dateRangeLabel}</span>
                </div>
              </button>
              {showDateRangePicker && (
                <div className="cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top" ref={dateRangePopupRef} style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000 }}>
                  <div className="cd-date-range-presets">
                    <div className="cd-date-range-presets-title">Preset Ranges</div>
                    {[
                      "Today",
                      "Last 7 days",
                      "Yesterday",
                      "Last 30 days",
                      "This month",
                      "Last month",
                      "Last 3 months",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`cd-date-range-preset-btn ${isSameDateRange(draftDateRange, getPresetRange(preset)) ? "is-active" : ""}`}
                        onClick={() => handlePresetSelect(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <div className="cd-date-range-panel">
                    <div className="cd-date-range-fields">
                      <div className="cd-date-range-field">
                        <span className="cd-date-range-field-label">From</span>
                        <div className={`cd-date-range-field-value ${!draftDateRange.startDate ? "is-empty" : ""}`}>
                          {formatPickerValue(draftDateRange.startDate)}
                        </div>
                      </div>
                      <div className="cd-date-range-field">
                        <span className="cd-date-range-field-label">To</span>
                        <div className={`cd-date-range-field-value ${!draftDateRange.endDate ? "is-empty" : ""}`}>
                          {formatPickerValue(draftDateRange.endDate)}
                        </div>
                      </div>
                    </div>
                    <DatePicker
                      selected={draftDateRange.startDate || new Date()}
                      onChange={(dates) => {
                        const [start, end] = dates;
                        setDraftDateRange({ startDate: start, endDate: end });
                      }}
                      startDate={draftDateRange.startDate}
                      endDate={draftDateRange.endDate}
                      selectsRange
                      inline
                      monthsShown={2}
                      calendarClassName="cd-range-calendar"
                    />
                    <div className="cd-date-range-footer">
                      <button
                        type="button"
                        className="cd-date-range-btn cd-date-range-btn-secondary"
                        onClick={handleDateRangeClear}
                        disabled={!draftDateRange.startDate && !draftDateRange.endDate}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className="cd-date-range-btn cd-date-range-btn-secondary"
                        onClick={() => setShowDateRangePicker(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="cd-date-range-btn cd-date-range-btn-primary"
                        onClick={handleDateRangeApply}
                        disabled={!draftDateRange.startDate || !draftDateRange.endDate}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="db-group">
            <label>Channel:</label>

            <div id="channel-wrapper" className="position-relative">
              <div className="campaign-select-wrapper">
                <Input
                  readOnly
                  value={localChannel || "All"}
                  className="campaign-select-input"
                  style={{
                    height: "30px",
                    minHeight: "30px",
                    borderRadius: "13px",
                    padding: "10px 34px 10px 12px",
                  }}
                  onClick={() => {
                    if ((availableChannels ?? []).length) {
                      setOpenChannelDropdown(!openChannelDropdown);
                      setOpenCampaignDropdown(false);
                    }
                  }}
                  tabIndex={0}
                  disabled={!(availableChannels ?? []).length}
                />
                <FaCaretDown
                  className={`custom-select-icon campaign-select-icon ${openChannelDropdown ? "open" : ""
                    }`}
                />
              </div>

              {openChannelDropdown && (availableChannels ?? []).length > 0 && (
                <div className="custom-dropdown-menu biddeript-b">
                  <div
                    onClick={() => {
                      setLocalChannel(null);
                      setOpenChannelDropdown(false);
                    }}
                    className={`custom-dropdown-option ${!localChannel ? "selected" : ""
                      }`}
                    style={{ height: "40px" }}
                  >
                    <span className="tick-icon">
                      {!localChannel && "✓"}
                    </span>
                    <span>All</span>
                  </div>
                  {(availableChannels ?? []).map((c) => {
                    const isSelected = localChannel === c;
                    return (
                      <div
                        key={c}
                        onClick={() => {
                          handleLocalChannelChange(c);
                          setOpenChannelDropdown(false);
                        }}
                        className={`custom-dropdown-option ${isSelected ? "selected" : ""
                          }`}
                        style={{ height: "40px" }}
                      >
                        <span className="tick-icon">
                          {isSelected && "✓"}
                        </span>
                        <span>{c}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="db-group">
            <label>Campaign:</label>

            <div id="campaign-wrapper" className="position-relative">
              <div className="campaign-select-wrapper">
                <Input
                  readOnly
                  value={localCampaign || "All"}
                  className="campaign-select-input"
                  style={{
                    height: "30px",
                    minHeight: "30px",
                    borderRadius: "13px",
                    padding: "10px 34px 10px 12px",
                  }}
                  onClick={() => {
                    if (campaignsList.length) {
                      setOpenCampaignDropdown(!openCampaignDropdown);
                      setOpenChannelDropdown(false);
                    }
                  }}
                  tabIndex={0}
                  disabled={!campaignsList.length}
                />
                <FaCaretDown
                  className={`custom-select-icon campaign-select-icon ${openCampaignDropdown ? "open" : ""
                    }`}
                />
              </div>

              {openCampaignDropdown && campaignsList.length > 0 && (
                <div className="custom-dropdown-menu biddeript-b campaign-dropdown-menu">
                  <div
                    title="All"
                    onClick={() => {
                      setLocalCampaign(null);
                      setOpenCampaignDropdown(false);
                    }}
                    className={`custom-dropdown-option campaign-dropdown-option ${!localCampaign ? "selected" : ""
                      }`}
                  >
                    <span className="tick-icon">
                      {!localCampaign && "✓"}
                    </span>
                    <span className="campaign-dropdown-label">All</span>
                  </div>
                  {campaignsList.map((c, idx) => {
                    const isSelected = localCampaign === c;
                    return (
                      <div
                        key={idx}
                        title={c}
                        onClick={() => {
                          setLocalCampaign(c);
                          setOpenCampaignDropdown(false);
                        }}
                        className={`custom-dropdown-option campaign-dropdown-option ${isSelected ? "selected" : ""
                          }`}
                      >
                        <span className="tick-icon">
                          {isSelected && "✓"}
                        </span>
                        <span className="campaign-dropdown-label">{c}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            className="db-apply-btn"
            onClick={handleApply}
          >
            Apply
          </button>

        </div>
      </div>
    </div>
  );
}
