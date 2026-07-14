import React, { useState, useEffect,useRef } from "react";

// reactstrap components
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Row,
  Col,
   Input,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import LoginModal from "../LoginModal";
import CreativeEditor from "./editors/CreativeEditor";
import DecisionModal from "../DecisionModal";
import ConversionModal from "./Modal/ConversionModal";

import DatePicker from "react-datepicker";
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from "react-icons/fa";
import { FaEdit, FaTrash, FaCog, FaCaretUp, FaCaretDown } from "react-icons/fa";

var undef;

const Postback = (props) => {
  const loadDataOnce = async () => {
    await vx.listCreatives();
  };

  const vx = useViewContext();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const toggleconversiontModal = () =>
    setConversionModalOpen(!conversionModalOpen);
  useEffect(() => {
    if (vx.loggedIn) loadDataOnce();
  }, []);

  const redraw = () => {
    setCount(count + 1);
  };

  const setDates = (c) => {
    var date = new Date();
    c.interval_start = date.getTime();
    c.interval_end = date.setDate(date.getDate() + 30);
    return c;
  };

  const deleteCreative = async (id, key) => {
    await vx.deleteCreative(id, key);
    await vx.listCreatives();
    setCreative(null);
    redraw();
  };

  const refresh = async () => {
    await vx.listCreatives();
    redraw();
  };

  const makeNewAudio = async () => {
    if (creative !== null) return;

    var c = await vx.getNewCreative("audio");
    c = setDates(c);
    c.isVideo = false;
    c.isAudio = true;
    c.isNative = false;
    c.isBanner = false;
    c.price = c.bid_ecpm;
    c.siteorapp = "";

    c.dealType = 1;
    c.deals = undef;

    setCreative(c);
  };

  const editCreative = async (mode, id, key) => {
    var c = await vx.getCreative(id, key);
    if (!c) {
      alert("Server error!");
      return;
    }
    if (c.campaign_id !== 0) {
      var camp = await vx.getDbCampaign(c.campaign_id);
      c.campaign_name = camp.name;
    } else {
      c.campaign_name = "Unassigned";
    }

    if (mode === "VIEW") c.readOnly = true;
    if (c.dealSpec !== undef) {
      var rc = c.dealSpec.split(",");
      var array = [];
      for (var i = 0; i < rc.length; i++) {
        var d = rc[i];
        array.push({ id: d.split(":")[0], price: d.split(":")[1] });
      }
      if (c.price === 0) c.dealType = 2;
      else c.dealType = 3;
      c.deals = array;
    } else {
      c.dealType = 1;
      c.deals = undef;
    }

    if (c.ext_spec !== undef) {
      var map = {};
      for (var i = 0; i < c.ext_spec.length; i++) {
        var str = c.ext_spec[i];
        var n = str.split(":#:");
        map[n[0]] = n[1];
      }
      c.extensions = map;
      if (map["site_or_app"] !== undef) c.siteorapp = map["site_or_app"];
    }

    if (c.nativead) {
      c.nativead.assets = [];
      for (var i = 0; i < c.nativead.native_assets.length; i++) {
        var asset = JSON.parse(c.nativead.native_assets[i]);
        c.nativead.assets.push(asset);
      }
    }

    c.bid_ecpm = c.price;
    setCreative(c);
  };

  const update = (x) => {
    if (x !== null) {
      // rewrite the deals if they are present
      if (x.deals !== undef && x.deals.length > 0) {
        var deals = x.deals;
        var str = "";
        for (var i = 0; i < deals.length; i++) {
          str += deals[i].id + ":" + deals[i].price;
          if (i + 1 < deals.length) str += ",";
        }
        x.deals = str;
      }

      x.bid_ecpm = x.price;

      /** Map the nativead to the database equivalent */
      if (x.nativead) {
        alert(JSON.stringify(x.nativead.assets, null, 2));

        x.native_context = x.nativead.native_context;
        x.native_contextsubtype = x.nativead.native_contextsubtype;
        x.native_plcmttype = x.nativead.native_plcmttype;
        x.native_plcmtcnt = x.nativead.native_plcmtcnt = 1;
        x.native_link = x.nativead.native_link;
        x.native_trk_urls = [];
        if (x.nativead.native_trk_urls !== "")
          x.native_trk_urls.push(x.nativead.native_trk_urls);
        x.native_js_tracker = x.nativead.native_js_tracker;
        x.native_assets = [];
        for (var j = 0; j < x.nativead.assets.length; j++) {
          var asset = x.nativead.assets[j];
          x.native_assets.push(JSON.stringify(asset));
        }
      }

      vx.addNewCreative(x);
    }

    setCreative(null);
    setTimeout(refresh, 2000);
  };

  const sortedCreatives = () => {
    var creatives = vx.creatives;
    creatives.sort(function (a, b) {
      a = a.customer_id + a.name;
      b = b.customer_id + b.name;
      return (a > b) - (a < b);
    });
    return creatives;
  };

  const getBannersView = () => {
    return sortedCreatives()
      .filter((e) => e.type === "banner")
      .map((row, index) => (
        <tr key={"banner-" + row}>
          <td>{index}</td>
          <td key={"banner-name-" + index} className="text-left">
            {row.name}
          </td>
          <td key={"banner-owner-" + index} className="text-left">
            {vx.getCampaignNameById(row.campaign_id)}
          </td>
          {vx.user.sub_id === "superuser" && (
            <td key={"banner-cust-" + index} className="text-left">
              {row.customer_id}
            </td>
          )}
          <td key={"banner-id-" + index} className="text-right">
            {row.id}
          </td>
          <td className="text-center">
            <Button
              color="success"
              size="sm"
              onClick={() => editCreative("VIEW", row.id, "banner")}
            >
              View
            </Button>
            &nbsp;
            <Button
              color="warning"
              size="sm"
              onClick={() => editCreative("EDIT", row.id, "banner")}
            >
              Edit
            </Button>
            &nbsp;
            <Button
              color="danger"
              size="sm"
              onClick={(e) => showModal(e, row.id, "banner")}
            >
              Delete
            </Button>
          </td>
        </tr>
      ));
  };

  const setInstances = () => {};

  const [modal, setModal] = useState(false);
  const [id, setId] = useState(0);
  const [type, setType] = useState("");

  const modalCallback = (doit) => {
    if (doit) {
      deleteCreative(id, type);
    }
    setModal(!modal);
  };
  const showModal = (e, x, y) => {
    if (e.ctrlKey) {
      deleteCreative(x, y);
      return;
    }
    setId(x);
    setType(y);
    setModal(true);
  };

   // State
    const [showCalendar, setShowCalendar] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedLabel, setSelectedLabel] = useState(""); // ✅ new state for label
  
    // Toggle calendar
    const toggleCalendar = () => setShowCalendar((prev) => !prev);
  
    // Apply just closes popup (keeps selected range)
    const handleApply = () => setShowCalendar(false);
  
    // Apply All (you can extend logic for global range apply)
    const handleApplyAll = () => {
      console.log("Applied all ranges:", { startDate, endDate });
      setShowCalendar(false);
    };
  
    // ✅ Quick select presets (with label tracking)
    const handleQuickSelect = (type) => {
      const today = new Date();
      let start, end;
  
      switch (type) {
        case "Today":
          start = end = today;
          break;
        case "Yesterday":
          start = end = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 1
          );
          break;
        case "2 Days Ago":
          start = end = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 2
          );
          break;
        case "Last 7 Days":
          end = today;
          start = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 6
          );
          break;
        case "Last 30 Days":
          end = today;
          start = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 29
          );
          break;
        default:
          start = end = null;
      }
  
      setSelectedLabel(type); // ✅ show label text in input
      setStartDate(start);
      setEndDate(end);
    };
  
    // ✅ Nicely formatted date or label display
    const formatDateRange = () => {
      if (selectedLabel) return selectedLabel; // ✅ show label if chosen
      if (startDate && endDate) {
        const options = { year: "numeric", month: "short", day: "numeric" };
        return `${startDate.toLocaleDateString(
          undefined,
          options
        )} - ${endDate.toLocaleDateString(undefined, options)}`;
      } else if (startDate) {
        return startDate.toLocaleDateString();
      } else {
        return "";
      }
    };


    const ConversionActionsCell = ({ data }) => {
        const row = data.row;
        const [dropdownOpen, setDropdownOpen] = useState(false);
        const toggle = () => setDropdownOpen(!dropdownOpen);
    
        return (
          <Dropdown isOpen={dropdownOpen} toggle={toggle}>
            <DropdownToggle
              tag="span"
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 3px",
                backgroundColor: "#fff",
                color: "#8a8a8a",
              }}
            >
              <FaCog style={{ marginRight: "5px" }} />
              <FaCaretDown />
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem >
                Edit Brand
              </DropdownItem>
              <DropdownItem onClick={(e) => showModal(e, row.id)}>
                Delete Brand
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      };
    
      const [loading, setLoading] = useState(false);
      const [selectedRowId, setSelectedRowId] = useState(null);
      const [selectedHeader, setSelectedHeader] = useState(null);
      const [rowData, setRowData] = useState([]);
    
      const handleHeaderClick = (index) => {
        setSelectedHeader(index);
      };
    
      const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    
      const sortRows = (key) => {
        setLoading(true);
        setTimeout(() => {
          let direction = "asc";
          if (sortConfig.key === key && sortConfig.direction === "asc")
            direction = "desc";
    
          const sorted = [...rowData].sort((a, b) => {
            let valA = a[key]?.toString().toLowerCase() || "";
            let valB = b[key]?.toString().toLowerCase() || "";
            if (valA < valB) return direction === "asc" ? -1 : 1;
            if (valA > valB) return direction === "asc" ? 1 : -1;
            return 0;
          });
    
          setRowData(sorted);
          setSortConfig({ key, direction });
          setLoading(false);
        }, 900);
      };
    
      // Column resizing
      const [columnWidths, setColumnWidths] = useState({
        actions: 80,
        name: 150,
        list_type: 150,
        domain_count: 100,
        DefaultValue: 120,
      });
      const guideLineRef = useRef(null);
      const tableWrapperRef = useRef(null);
      const resizingCol = useRef(null);
      const startX = useRef(0);
      const startWidth = useRef(0);
      const tableScrollRef = useRef(null);
    
      const handleMouseDown = (e, colKey) => {
        e.preventDefault();
        resizingCol.current = colKey;
        startX.current = e.clientX;
        startWidth.current = columnWidths[colKey];
        const tableRect = tableWrapperRef.current.getBoundingClientRect();
        const guideLine = guideLineRef.current;
        guideLine.style.top = "0px";
        guideLine.style.height = tableWrapperRef.current.offsetHeight + "px";
        guideLine.style.left = `${e.clientX - tableRect.left}px`;
        guideLine.style.display = "block";
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "none";
      };
    
      const handleMouseMove = (e) => {
        if (!resizingCol.current) return;
        const tableRect = tableWrapperRef.current.getBoundingClientRect();
        let posX = e.clientX - tableRect.left;
        posX = Math.max(0, Math.min(posX, tableRect.width));
        guideLineRef.current.style.left = `${posX}px`;
      };
    
      const handleMouseUp = (e) => {
        if (!resizingCol.current) return;
        const dx = e.clientX - startX.current;
        const newWidth = Math.max(startWidth.current + dx, 50);
        setColumnWidths((prev) => ({ ...prev, [resizingCol.current]: newWidth }));
        guideLineRef.current.style.display = "none";
        resizingCol.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "";
      };
    
      useEffect(() => {
        if (!loading && rowData.length > 0) {
          setSelectedRowId(rowData[0].id);
        }
      }, [loading, rowData]);
  
    const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="content1">
      <div class="content-wrapper">
        {/* {!vx.isLoggedIn && <LoginModal callback={setInstances} />} */}
        {modal && (
          <DecisionModal
            title="Really delete creative?"
            message="Only the db admin can undo this if you delete it!!!"
            name="DELETE"
            callback={modalCallback}
          />
        )}
        {creative === null && (
          <>
            <Row>
              <Col xs="12">
                <div className="row mb-2">
                  <div className="col-xl-12 col-lg-12">
                     <Row className="inventory-row m-0 p-0">
                      <Col xs="12" className="m-0 p-0">
                        <div className="d-flex justify-content-center m-0 p-0">
                          <strong className="w-100 text-center border border-1 menu_header mb-1 d-flex align-items-center justify-content-center">
                            <i className="tim-icons icon-badge me-2"></i>
                           <span className="myads"> Postback Config</span>
                          </strong>
                        </div>
                      </Col>
                    </Row>

                    <Row className="align-items-center mt-2">
                      <Col md="2">
                        <Input
                          type="text"
                          placeholder="Search..."
                          className="border border-1 rounded-0 py-1 ms-2"
                          style={{ height: "26px" }}
                          id="seaching"
                          value={searchTerm}
                          // onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </Col>

                      <Col md="1" className="position-relative">
                        <div className="date-input-wrapper">
                          <FaCalendarAlt className="calendar-icon" />
                          <input
                            type="text"
                            value={startDate ? formatDateRange() : "Today"} // default value Today
                            onClick={toggleCalendar}
                            readOnly
                            className="date-input"
                          />
                        </div>

                        {/* Calendar Popup */}
                        {showCalendar && (
                          <Card className="calendar-popup shadow">
                            {/* Two-Month Calendar */}
                            <div>
                              <DatePicker
                                selected={startDate || new Date()} // default selected today
                                onChange={(dates) => {
                                  const [start, end] = dates;
                                  setSelectedLabel("");
                                  setStartDate(start);
                                  setEndDate(end);
                                }}
                                startDate={startDate}
                                endDate={endDate}
                                selectsRange
                                inline
                                monthsShown={2}
                                calendarClassName="custom-calendar"
                              />
                            </div>

                            {/* Quick Select Section */}
                            <div className="quick-select-section">
                              <div className="quick-select-buttons d-flex flex-column">
                                {[
                                  "Today",
                                  "Yesterday",
                                  "2 Days Ago",
                                  "Last 7 Days",
                                  "Last 30 Days",
                                ].map((label) => (
                                  <button
                                    key={label}
                                    onClick={() => handleQuickSelect(label)}
                                    className="quick-select-btn btn btn-sm mb-2 text-start rounded-0"
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>

                              <div className="apply-buttons d-flex flex-column mt-2">
                                <Button
                                  color="success"
                                  size="sm"
                                  className="mb-2 rounded-0 apply-btn"
                                  onClick={handleApply}
                                >
                                  Apply
                                </Button>
                                <Button
                                  color="success"
                                  size="sm"
                                  className="rounded-0 apply-btn"
                                  onClick={handleApplyAll}
                                >
                                  Apply All
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )}
                      </Col>

                      <Col md="1" className="d-flex align-items-center">
                        <input
                          type="checkbox"
                          id="archivedCheckbox"
                          className="form-check-input"
                        />
                        <label
                          htmlFor="archivedCheckbox"
                          className="ms-2 mb-0 mt-2"
                          style={{ fontSize: "11px" }}
                        >
                          Show Archived
                        </label>
                      </Col>

                      <Col xs="auto">
                        <button
                          type="button"
                          onClick={refresh}
                          className="form-control py-1 px-2 rounded-0 d-flex align-items-center justify-content-center"
                          style={{ height: "26px", fontSize: "11px" }}
                          id="refresh"
                        >
                          <i className="fa fa-repeat me-1"></i>
                          Refresh
                        </button>
                      </Col>
                      <Col md="4" style={{ maxWidth: "130px" }}></Col>
                      <Col></Col>
                      <Col xs="auto" style={{ maxWidth: "130px" }}>
                        <button
                          type="button"
                          className="form-control py-1 px-2 me-4 rounded-0"
                          onClick={toggleconversiontModal}
                         id="newaudience"
                        >
                          <span className="linkto">New Postback</span>
                        </button>
                      </Col>
                      <Col xs="auto" className=" me-1 p-0">
                        <Button
                          type="btn"
                          className="form-control py-1 px-1 rounded-0 adsheight custom-select-input"
                           id="export"
                        >
                            <span className="lasttime">Bulk Export</span>
                        </Button>
                      </Col>
                      <Col xs="auto" className=" me-3 p-0">
                        <Button
                          type="btn"
                          className="form-control py-1 px-1 rounded-0 adsheight custom-select-input"
                        id="export"
                        >
                          <span className="lasttime">Customization Columns</span>
                        </Button>
                      </Col>
                    </Row>
                    
                    <ConversionModal
                      isOpen={conversionModalOpen}
                      toggle={toggleconversiontModal}
                    />
                  </div>
                </div>
                
                  <div className="table-wrapper" ref={tableWrapperRef}>
  <div className="resize-guide" ref={guideLineRef}></div>
  <div className="table-responsive" ref={tableScrollRef}>
    <Table
      key={"banners-table-" + count}
      className="table table-hover custom-table w-100 h-100"
      size="sm"
      striped
    >
      <thead className="table-light">
        <tr>
          {[
            "Actions",
            "Name",
            "ID",
            "Default Value",
            "Status",
            "Number of Hits",
            "Conversion Count",
           
          ].map((header, index) => {
            const keyMap = {
             Actions: "actions",
              Name: "name",
              ID: "id",
              "Default Value": "default_value",
              Status: "status",
              "Number of Hits": "numberOfHits",
              "Conversion Count": "conversionCounts",
              
            };
            const key = keyMap[header];

            let textAlign = "center";
            if (header === "#" || header === "Number of Hits" || header === "Conversion Count") {
              textAlign = "right";
            }

            return (
              <th
                key={index}
                className={selectedHeader === index ? "selected" : ""}
                style={{
                  cursor: key && key !== "actions" ? "pointer" : "default",
                  position: "relative",
                  width: columnWidths[key],
                  textAlign: textAlign,
                }}
                onClick={() => {
                  handleHeaderClick(index);
                  if (key && key !== "actions") sortRows(key);
                }}
                id="throws"
              >
                {header}
                {sortConfig.key === key && (
                  <span className="ms-1">
                    {sortConfig.direction === "asc" ? <FaCaretUp /> : <FaCaretDown />}
                  </span>
                )}
                <div
                  className="resizer"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    height: "100%",
                    width: "5px",
                    cursor: "col-resize",
                  }}
                  onMouseDown={(e) => handleMouseDown(e, key)}
                ></div>
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td colSpan="8" className="text-center py-5">
              <div className="full-page-loader">
                <div className="loader" role="status"></div>
                <span className="ms-2 fw-bold">Loading...</span>
              </div>
            </td>
          </tr>
        ) : rowData.length > 0 ? (
          rowData.map((row, idx) => (
            <tr
              key={row.id || idx}
              className={selectedRowId === row.id ? "selected-row" : ""}
              onClick={(e) => {
                if (
                  e.target.closest(".dropdown-menu") ||
                  e.target.closest(".dropdown-toggle")
                )
                  return;
                setSelectedRowId(row.id);
              }}
            >
              <td className="text-center">
                <ConversionActionsCell data={{ row }} />
              </td>
              <td className="text-center">{row.name}</td>
              <td className="text-center">{row.id}</td>
              <td className="text-center">{row.default_value}</td>
              <td className="text-center">{row.status}</td>
              <td className="text-right">{row.numberOfHits}</td>
              <td className="text-right">{row.conversionCounts}</td>
              
            </tr>
          ))
        ) : (
          <div
          className="position-absolute top-50 start-50 translate-middle text-center fw-bold text-secondary"
          style={{ fontSize: "1.1rem" }}
        >
          No data available
        </div>
        )}
      </tbody>
    </Table>
  </div>
</div>

                  
              </Col>
            </Row>
          </>
        )}
      </div>
    </div>
  );
};

export default Postback;
