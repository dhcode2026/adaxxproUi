import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "reactstrap";
import {
  FaLink,
  FaPlus,
  FaSlidersH,
  FaTimes,
  FaTrash,
   FaSearch,
  FaCheck,
} from "react-icons/fa";
import Swal from "sweetalert2";

const createBlankRow = () => ({ name: "", value: "" });

const parseUrlToRows = (url, externalCampaignName, campaignName) => {
  const raw = String(url || "").trim();
  if (!raw) {
    return { baseUrl: "", rows: [createBlankRow()] };
  }

  const questionIndex = raw.indexOf("?");
  const baseUrl = questionIndex >= 0 ? raw.slice(0, questionIndex) : raw;
  const queryString = questionIndex >= 0 ? raw.slice(questionIndex + 1) : "";

  const rows = queryString
    ? queryString
        .split("&")
        .filter(Boolean)
        .map((pair) => {
          const equalsIndex = pair.indexOf("=");
          const name =
            equalsIndex >= 0 ? pair.slice(0, equalsIndex) : pair.trim();
          let value =
            equalsIndex >= 0 ? pair.slice(equalsIndex + 1) : "";
          const resolvedName = externalCampaignName || campaignName;
          if (name === "c" && resolvedName) {
            if (value === "{c}" || !value) {
              value = resolvedName;
            }
          }
          return {
            name,
            value,
          };
        })
    : [];

  return {
    baseUrl,
    rows: rows.length > 0 ? rows : [createBlankRow()],
  };
};

const buildUrlFromRows = (baseUrl, rows, externalCampaignName, campaignName) => {
  const cleanBase = String(baseUrl || "").trim();
  const query = (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const name = String(row?.name || "").trim();
      let value = String(row?.value || "").trim();
      const resolvedName = externalCampaignName || campaignName;
      if (name === "c" && value === "{c}" && resolvedName) {
        value = resolvedName;
      }
      return { name, value };
    })
    .filter((row) => row.name || row.value)
    .map((row) => `${row.name}=${row.value}`)
    .join("&");

  if (!cleanBase) return query ? `?${query}` : "";
  return query ? `${cleanBase}?${query}` : cleanBase;
};

const MACRO_GROUPS = [
  {
    title: "Campaign Macros",
    items: [
      { name: "{name}", desc: "Title of Campaign" },
      { name: "{campaign_id}", desc: "Internal campaign ID" },
      { name: "{campaign_uuid}", desc: "Campaign UUID" },
      { name: "{external_campaign_id}", desc: "External campaign ID" },
      { name: "{external_campaign_name}", desc: "External campaign name" }
    ]
  },
  {
    title: "Advertiser & Publisher",
    items: [
      { name: "{advertiser_id}", desc: "Advertiser ID" },
      { name: "{publisher_id}", desc: "Publisher ID" }
    ]
  },
  {
    title: "Click & Impression",
    items: [
      { name: "{click_id}", desc: "Unique click ID" },
      { name: "{external_click_id}", desc: "External click ID" },
      { name: "{impression_id}", desc: "Associated impression ID" }
    ]
  },
  {
    title: "Device & User",
    items: [
      { name: "{device_ip}", desc: "Device IP address" },
      { name: "{user_agent}", desc: "Device User Agent" },
      { name: "{source}", desc: "Traffic Source" },
      { name: "{creative_name}", desc: "Creative / Ad Name" },
      { name: "{creative_id}", desc: "Creative / Ad ID" },
       { name: "{creative_type}", desc: "Creative Type" },
      { name: "{creative_format}", desc: "Creative Format" },
      { name: "{attribution_window}", desc: "Attribution Window" },
      { name: "{exchange_id}", desc: "Exchange ID" },
      { name: "{af_adset}", desc: "Adset Name" },
      { name: "{device_type}", desc: "Device Type" },
      { name: "{advertising_id}", desc: "Advertising ID" },
      { name: "{android_id}", desc: "Android ID" },
      { name: "{os_version}", desc: "OS Version" }
    ]
  }
];

const ConversionParametersModal = ({
  isOpen,
  toggle,
  title = "Edit Parameters",
  initialUrl = "",
  externalCampaignName = "",
  campaignName = "",
  size = "lg",
  onApply,
}) => {
  const [baseUrl, setBaseUrl] = useState("");
  const [rows, setRows] = useState([createBlankRow()]);
  const [activeMacroDropdownIndex, setActiveMacroDropdownIndex] = useState(null);
  const [macroSearchTerm, setMacroSearchTerm] = useState("");
  const scrollContainerRef = useRef(null);

  useEffect(() => {
     if (!isOpen) {
      setActiveMacroDropdownIndex(null);
      setMacroSearchTerm("");
      return;
    }
    const parsed = parseUrlToRows(initialUrl, externalCampaignName, campaignName);
    setBaseUrl(parsed.baseUrl);
    setRows(parsed.rows);
  }, [isOpen, initialUrl, externalCampaignName, campaignName]);

   const filteredMacroGroups = (search) => {
    if (!search) return MACRO_GROUPS;
    return MACRO_GROUPS.map((group) => {
      const items = group.items.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.desc.toLowerCase().includes(search.toLowerCase()),
      );
      return { ...group, items };
    }).filter((group) => group.items.length > 0);
  };

  const finalUrl = useMemo(
    () => buildUrlFromRows(baseUrl, rows, externalCampaignName, campaignName),
    [baseUrl, rows, externalCampaignName, campaignName],
  );

  const handleRowChange = (index, key, value) => {
    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createBlankRow()]);
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50);
  };

  const handleDeleteRow = (index) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        return [createBlankRow()];
      }
      return prev.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  const handleRowAction = (index) => {
    setRows((prev) =>
      prev.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        if (String(row.value || "").trim()) return row;
        const name = String(row.name || "").trim();
        if (!name) return row;
        return {
          ...row,
          value: `{${name}}`,
        };
      }),
    );
  };

  const handleApply = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to apply these parameters?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, apply",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc243a",
      cancelButtonColor: "#6c757d",
      width: 380,
    });

    if (!result.isConfirmed) return;

    if (typeof onApply === "function") {
      onApply({
        url: finalUrl,
        rows,
        baseUrl,
      });
    }

    if (typeof toggle === "function") {
      toggle();
    }
  };

  return (
    <>
      <style>{`
        @media (min-width: 576px) {
          .conversion-parameters-modal {
            margin: 1.75rem auto;
          }
        }

        .conversion-parameters-modal .modal-content {
          border: none;
          border-radius: 16px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
          overflow: hidden;
        }

        .conversion-parameters-modal .modal-header-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          border-bottom: 1px solid #e8edf4;
        }

        .conversion-parameters-modal .modal-title {
          color: #0f172a;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }

        .conversion-parameters-modal .modal-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .conversion-parameters-modal .add-param-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-color: #ef4444 !important;
          color: #ef4444 !important;
          background: #fff !important;
          border-radius: 12px;
          font-weight: 700;
          padding: 8px 14px;
        }

        .conversion-parameters-modal .add-param-btn:hover,
        .conversion-parameters-modal .add-param-btn:focus {
          background: #fff5f5 !important;
          box-shadow: none !important;
        }

        .conversion-parameters-modal .close-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid #d7dde8 !important;
          background: #fff !important;
          color: #64748b !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          box-shadow: none !important;
          transition: all 0.2s ease;
        }

        .conversion-parameters-modal .close-btn:hover,
        .conversion-parameters-modal .close-btn:focus,
        .conversion-parameters-modal .close-btn:active {
          background: #f1f5f9 !important;
          color: #1e293b !important;
          border-color: #cbd5e1 !important;
        }

        .conversion-parameters-modal .modal-body {
          padding: 0;
        }

        .conversion-parameters-modal .modal-body-scroll-content {
          padding: 16px 22px 20px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .conversion-parameters-modal .final-url-card {
          border: 1px solid #fee2e2 !important;
          background: #fff8f8 !important;
          border-radius: 12px !important;
          padding: 16px !important;
          margin-bottom: 20px !important;
        }

        .conversion-parameters-modal .section-label {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          color: #ef4444 !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          letter-spacing: 0.04em !important;
          text-transform: uppercase !important;
          margin-bottom: 8px !important;
        }

        .conversion-parameters-modal .final-url-text {
          width: 100% !important;
          user-select: all !important;
          -webkit-user-select: all !important;
          -moz-user-select: all !important;
          -ms-user-select: all !important;
          word-break: break-all !important;
          cursor: text !important;
          white-space: pre-wrap !important;
          color: #1f2937 !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
          margin-top: 8px !important;
          border: 0 !important;
          background: transparent !important;
          padding: 0 !important;
        }

        .conversion-parameters-modal .table-shell {
          border: 1px solid #e4e8f0;
          border-radius: 14px;
          overflow: hidden;
        }

        .conversion-parameters-modal .table-head {
          display: grid;
          grid-template-columns: 1.1fr 1.2fr 120px;
          gap: 0;
          background: #f8fafc;
          border-bottom: 1px solid #e4e8f0;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .conversion-parameters-modal .table-head > div,
        .conversion-parameters-modal .table-row > div {
          padding: 14px 16px;
        }

        .conversion-parameters-modal .table-row {
          display: grid;
          grid-template-columns: 1.1fr 1.2fr 120px;
          gap: 0;
          border-bottom: 1px solid #edf2f7;
          align-items: center;
        }

        .conversion-parameters-modal .table-row:last-child {
          border-bottom: 0;
        }

        .conversion-parameters-modal .param-input {
          border-radius: 12px;
          min-height: 40px;
          height: 40px;
          border-color: #d7dde8;
          font-size: 14px;
        }

        .conversion-parameters-modal .action-cell {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          position: relative;
        }

        .conversion-parameters-modal .row-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid #f5c8c8 !important;
          color: #ef4444 !important;
          background: #fff !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          box-shadow: none !important;
          transition: all 0.2s ease;
        }

        .conversion-parameters-modal .row-icon-btn:hover,
        .conversion-parameters-modal .row-icon-btn:focus,
        .conversion-parameters-modal .row-icon-btn:active {
          background: #fff5f5 !important;
          color: #ef4444 !important;
          border-color: #ef4444 !important;
        }

        .conversion-parameters-modal .macro-dropdown-menu {
          position: absolute;
          top: 44px;
          right: 0;
          width: 320px;
          background: #fff;
          border: 1px solid #e4e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .conversion-parameters-modal .macro-search-container {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid #edf2f7;
          background: #fff;
        }
        .conversion-parameters-modal .macro-search-icon {
          color: #94a3b8;
          flex-shrink: 0;
        }
        .conversion-parameters-modal .macro-search-input {
          border: 0 !important;
          padding: 0 !important;
          font-size: 13px !important;
          font-family: inherit;
          color: #1e293b;
          width: 100%;
          outline: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .conversion-parameters-modal .macro-list-scroll {
          max-height: 240px;
          overflow-y: auto;
          padding: 6px 0;
        }
        .conversion-parameters-modal .macro-group-title {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          padding: 8px 14px 4px;
          letter-spacing: 0.05em;
        }
        .conversion-parameters-modal .macro-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .conversion-parameters-modal .macro-item:hover {
          background: #f8fafc;
        }
        .conversion-parameters-modal .macro-item-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .conversion-parameters-modal .macro-item-name {
          font-size: 13px;
          font-weight: 700;
          color: #ef4444;
          word-break: break-all;
        }
        .conversion-parameters-modal .macro-item-desc {
          font-size: 11px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .conversion-parameters-modal .macro-check-icon {
          color: #ef4444;
          flex-shrink: 0;
          margin-left: 10px;
        }


        .conversion-parameters-modal .trash-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid #f5c8c8 !important;
          color: #ef4444 !important;
          background: #fff !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          box-shadow: none !important;
          transition: all 0.2s ease;
        }

        .conversion-parameters-modal .trash-btn:hover,
        .conversion-parameters-modal .trash-btn:focus,
        .conversion-parameters-modal .trash-btn:active {
          background: #fff5f5 !important;
          color: #ef4444 !important;
          border-color: #ef4444 !important;
        }

        .conversion-parameters-modal .modal-footer {
          border-top: 1px solid #e8edf4 !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .conversion-parameters-modal .footer-wrap {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 12px !important;
          padding: 16px 22px 20px !important;
          border-top: 0 !important;
          margin-top: 0 !important;
          width: 100% !important;
        }

        .conversion-parameters-modal .cancel-btn {
          color: #64748b !important;
          font-weight: 700 !important;
          background: transparent !important;
          border: 0 !important;
          box-shadow: none !important;
          text-decoration: none !important;
          margin: 0 !important;
          padding: 0 !important;
          width: auto !important;
          display: inline-block !important;
        }

        .conversion-parameters-modal .apply-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          background: #dc243a !important;
          border-color: #dc243a !important;
          border-radius: 12px !important;
          padding: 10px 20px !important;
          font-weight: 700 !important;
          box-shadow: none !important;
          width: auto !important;
          margin: 0 !important;
        }

        .conversion-parameters-modal .apply-btn:hover,
        .conversion-parameters-modal .apply-btn:focus {
          background: #c81d31 !important;
          border-color: #c81d31 !important;
        }

        @media (max-width: 768px) {
          .conversion-parameters-modal .table-head,
          .conversion-parameters-modal .table-row {
            grid-template-columns: 1fr;
          }

          .conversion-parameters-modal .action-cell {
            padding-top: 0;
            padding-bottom: 16px;
          }
        }
      `}</style>

      <Modal
        isOpen={isOpen}
        toggle={toggle}
        centered
        backdrop="static"
        keyboard={false}
        className="conversion-parameters-modal"
        size={size}
      >
        <div className="modal-header-wrap">
          <div className="modal-title">{title}</div>
          <div className="modal-header-actions">
            <Button
              type="button"
              className="add-param-btn"
              onClick={handleAddRow}
              color="light"
            >
              <FaPlus size={12} />
              Add Parameter
            </Button>
            <Button
              type="button"
              className="close-btn"
              onClick={toggle}
              aria-label="Close"
            >
              <FaTimes size={14} />
            </Button>
          </div>
        </div>

        <ModalBody>
          <div ref={scrollContainerRef} className="modal-body-scroll-content">
            <div className="final-url-card">
              <div className="section-label">
                <FaLink size={11} />
                Final URL
              </div>
              <div
                className="final-url-text"
                onClick={(e) => {
                  const range = document.createRange();
                  range.selectNodeContents(e.target);
                  const selection = window.getSelection();
                  selection.removeAllRanges();
                  selection.addRange(range);
                }}
              >
                {finalUrl}
              </div>
            </div>

            <div className="table-shell">
              <div className="table-head">
                <div>Parameter Name</div>
                <div>Macro / Value</div>
                <div>Action</div>
              </div>

              {rows.map((row, index) => (
                <div className="table-row" key={`parameter-row-${index}`}>
                  <div>
                    <Input
                      type="text"
                      value={row.name}
                      onChange={(e) =>
                        handleRowChange(index, "name", e.target.value)
                      }
                      className="param-input"
                      placeholder="e.g. utm_source"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      value={row.value}
                      onChange={(e) =>
                        handleRowChange(index, "value", e.target.value)
                      }
                      className="param-input"
                      placeholder="Type value or search macros..."
                    />
                  </div>
                  <div className="action-cell">
                    <Button
                      type="button"
                      className="row-icon-btn"
                      onClick={() => {
                        if (activeMacroDropdownIndex === index) {
                          setActiveMacroDropdownIndex(null);
                        } else {
                          setActiveMacroDropdownIndex(index);
                          setMacroSearchTerm("");
                        }
                      }}
                      title="Insert macro"
                      aria-label="Insert macro"
                    >
                      <FaSlidersH size={12} />
                    </Button>

                      {activeMacroDropdownIndex === index && (
                      <>
                        <div
                          style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999,
                            backgroundColor: "transparent"
                          }}
                          onClick={() => setActiveMacroDropdownIndex(null)}
                        />
                        {(() => {
                          const openUpwards = index > 0 && index >= rows.length - 2;
                          return (
                            <div
                              className="macro-dropdown-menu"
                              style={{
                                zIndex: 1000,
                                ...(openUpwards ? { top: "auto", bottom: "44px" } : {})
                              }}
                            >
                              <div className="macro-search-container">
                                <FaSearch size={12} className="macro-search-icon" />
                                <input
                                  type="text"
                                  placeholder="Search available macros..."
                                  value={macroSearchTerm}
                                  onChange={(e) => setMacroSearchTerm(e.target.value)}
                                  className="macro-search-input"
                                  autoFocus
                                />
                              </div>
                             <div className="macro-list-scroll">
                                {filteredMacroGroups(macroSearchTerm).map((group) => (
                                  <div key={group.title}>
                                    <div className="macro-group-title">{group.title}</div>
                                    {group.items.map((item) => {
                                      const isSelected = row.value === item.name;
                                      return (
                                        <div
                                          key={item.name}
                                          className="macro-item"
                                          onClick={() => {
                                            handleRowChange(index, "value", item.name);
                                          }}
                                        >
                                          <div className="macro-item-left">
                                            <span className="macro-item-name">{item.name}</span>
                                            <span className="macro-item-desc">{item.desc}</span>
                                          </div>
                                          {isSelected && (
                                            <FaCheck size={12} className="macro-check-icon" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                                {filteredMacroGroups(macroSearchTerm).length === 0 && (
                                  <div style={{ textAlign: "center", padding: "16px", color: "#94a3b8", fontSize: "12px" }}>
                                    No macros found
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}



                    <Button
                      type="button"
                      className="trash-btn"
                      onClick={() => handleDeleteRow(index)}
                      title="Delete row"
                      aria-label="Delete row"
                    >
                      <FaTrash size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="border-top-0 p-0">
          <div className="footer-wrap w-100">
            <Button
              type="button"
              className="cancel-btn"
              color="link"
              onClick={toggle}
            >
              Cancel
            </Button>
            <Button type="button" className="apply-btn" onClick={handleApply}>
              Apply Parameters
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default ConversionParametersModal;