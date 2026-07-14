import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Col, Table, Input, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Label } from "reactstrap";
import { getAllDealsCached, getAllExchangeCached } from "../api/Api.jsx";
import { FaCaretDown, FaCaretRight, FaCaretUp } from "react-icons/fa";
import NewDealGroupPmp from "../Modal/NewDealGroupPmp";

const DealsEditor = (props) => {
    const { formData, setFormData } = props || {};

    const parseDeals = (deals) => {
        if (!deals) return [];
        if (Array.isArray(deals)) return deals.slice();
        if (typeof deals === "string") {
            const m = deals.match(/deals\[(.*)\]/);
            if (!m) return [];
            const inner = m[1].trim();
            if (!inner) return [];
            return inner.split(",").map(s => s.trim()).filter(Boolean).map(s => (s === "" ? s : (isNaN(s) ? s : Number(s))));
        }
        return [];
    };
    const [selectedRowIds, setSelectedRowIds] = useState(() => parseDeals(formData?.deals));
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [selectedHeader, setSelectedHeader] = useState(null);
    const [count, setCount] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const guideLineRef = useRef(null);
    const tableWrapperRef = useRef(null);
    const resizingCol = useRef(null);
    const startX = useRef(0);
    const startWidth = useRef(0);
    const dealsCount = (formData && formData.deals) ? parseDeals(formData.deals).length : selectedRowIds.length;
    const rows = [`Deals (${dealsCount})`, "Deals Groups (0)"];
    useEffect(() => {
        setSelectedRowIds(parseDeals(formData?.deals));
    }, [formData?.deals]);
    useEffect(() => {
        let mounted = true;
        const loadDeals = async () => {
            try {
                const ids = parseDeals(formData?.deals || []);
                if (!ids || ids.length === 0) return;

                // fetch exchanges to resolve exchange names (cached)
                const exResp = await getAllExchangeCached();
                const exchangeMap = {};
                if (exResp?.data?.data?.informationExchanges) {
                    exResp.data.data.informationExchanges.forEach(ex => {
                        exchangeMap[ex.exchangeId] = ex.name;
                        exchangeMap[String(ex.exchangeId)] = ex.name;
                    });
                }

                const res = await getAllDealsCached();
                if (!res?.data?.data?.informationDeal) return;
                const all = res.data.data.informationDeal;
                // build map for quick lookup
                const dealMap = {};
                all.forEach(deal => {
                    dealMap[String(deal.dealId)] = deal;
                });

                const mapped = ids.map(id => {
                    const d = dealMap[String(id)];
                    if (!d) return { id, name: `Deal ${id}`, status: "Available", publishers: d?.publisher || "-", type: "-", exchange: "-", price: d?.price || "-", auction: d?.auctions || "-" };
                    const exchangeName = d.exchange ? (exchangeMap[d.exchange] || exchangeMap[String(d.exchange)] || d.exchange) : "-";
                    return {
                        id: d.dealId,
                        name: d.dealName || d.name || `Deal ${d.dealId}`,
                        status: d.status || "Available",
                        publishers: d.publisher || d.publishers || "-",
                        type: d.type || "-",
                        exchange: exchangeName,
                        price: d.price ? `$${parseFloat(d.price).toFixed(2)}` : (d.price || "-"),
                        auction: d.auctions || d.auction || "-",
                    };
                }).filter(Boolean);

                if (mounted && mapped.length > 0) {
                    setRowData((prev) => {
                        // merge without duplicates by id
                        const map = {};
                        prev.forEach(r => { if (r && r.id !== undefined) map[String(r.id)] = r; });
                        mapped.forEach(r => { map[String(r.id)] = r; });
                        return Object.values(map);
                    });
                    setSelectedRowIds(ids.map(String));
                    if (setFormData) {
                        // ensure parent has plain array
                        setFormData((fprev) => {
                            const prevDeals = fprev.deals || [];
                            const isSame = Array.isArray(prevDeals) && prevDeals.length === ids.length && prevDeals.every((val, idx) => val === ids[idx]);
                            if (isSame) return fprev;
                            return { ...fprev, deals: ids };
                        });
                    }
                }
            } catch (e) {
                console.warn("Failed to load deals for DealsEditor:", e);
            }
        };

        loadDeals();
        return () => { mounted = false; };
    }, [formData?.deals]);

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

    const sortRows = (key) => {
        setLoading(true);
        setTimeout(() => {
            let direction = "asc";
            if (sortConfig.key === key && sortConfig.direction === "asc") {
                direction = "desc";
            }
            const sorted = [...rowData].sort((a, b) => {
                let valA = a[key];
                let valB = b[key];
                valA = valA !== null && valA !== undefined ? valA.toString().toLowerCase() : "";
                valB = valB !== null && valB !== undefined ? valB.toString().toLowerCase() : "";
                if (valA < valB) return direction === "asc" ? -1 : 1;
                if (valA > valB) return direction === "asc" ? 1 : -1;
                return 0;
            });
            setRowData(sorted);
            setSortConfig({ key, direction });
            setLoading(false);
        }, 900);
    };

    const handleHeaderClick = (index) => {
        setSelectedHeader(index);
    };

    const [columnWidths, setColumnWidths] = useState({
        actions: 120,
        name: 150,
        list_type: 150,
        domain_count: 100,
    });

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

    const handleMouseMove = (e) => {
        if (!resizingCol.current) return;
        const tableRect = tableWrapperRef.current.getBoundingClientRect();
        let posX = e.clientX - tableRect.left;
        posX = Math.max(0, Math.min(posX, tableRect.width));
        guideLineRef.current.style.left = `${posX}px`;
    };

    const [isDealGroupStepTwo, setIsDealGroupStepTwo] = useState(false);
    const [shownewdealgroup, setShownewdealgroup] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const isEmptyState = !loading && rowData.length === 0;

    return (
        <>
            <div>
                <div className="step-scroll" style={{ margin: "0 -16px -18px -16px" }}>
                    <Row className="m-0">
                        {/* LEFT SIDEBAR */}
                        <Col md="2" lg="2" xl="2" className="p-0 deals-col" style={{ height: "auto", borderBottomLeftRadius: "12px", overflow: "hidden" }}>
                            <div className="deals-wrapper" style={{ borderBottomLeftRadius: "12px", overflow: "hidden" }}>
                                <table className="w-100 deals-table border-0" style={{ border: "none" }}>
                                    <tbody>
                                        {rows.map((text, index) => (
                                            <tr key={index}>
                                                <td
                                                    className={`dealsmenu border-0 ${selectedIndex === index ? "active" : ""}`}
                                                    onClick={() => setSelectedIndex(index)}
                                                    style={{ border: "none" }}
                                                >
                                                    {text}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Col>


                        <Col md="10" className="p-0 deals-right-col">


                            <div
                                className="deals-header px-3 py-2 saveselected"
                            >
                                <div
                                    className="d-flex align-items-center justify-content-between flex-nowrap"
                                    style={{ minHeight: "40px" }}
                                >
                                    <div className="d-flex align-items-center flex-nowrap" style={{ minWidth: 0, gap: "4px" }}>
                                        <Button
                                            type="button"
                                            id="dealsbtn"
                                            size="sm"
                                            className="selecteddeals flex-shrink-0"
                                            style={{ whiteSpace: "nowrap", padding: "0.35rem 0.65rem" }}
                                            onClick={() => {
                                                // keep for compatibility - this can open a grouping modal later
                                                // currently selections are synced automatically on row click
                                            }}
                                        >
                                            Save Selected Deals to Deal Group
                                        </Button>

                                        <div
                                            className="d-flex align-items-center flex-nowrap"
                                            id="alsotarget"
                                            style={{ gap: "4px", minWidth: 0 }}
                                        >
                                            <Input
                                                type="checkbox"
                                                id="rewarded"
                                                className="m-0"
                                                style={{ cursor: "pointer", flexShrink: 0 }}
                                            />
                                            <Label
                                                for="rewarded"
                                                className="mb-0"
                                                style={{
                                                    cursor: "pointer",
                                                    whiteSpace: "nowrap",
                                                    fontSize: "0.78rem",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                Also target impressions that are outside of Deal IDs
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center flex-shrink-0 flex-nowrap" style={{ gap: "4px" }}>
                                        <Button
                                            type="button"
                                            id="dealsbtn"
                                            size="sm"
                                            style={{ whiteSpace: "nowrap", padding: "0.35rem 0.65rem" }}
                                            onClick={() => setIsOpen(true)}
                                        >
                                            Add Deals &amp; Deals Group
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="rounded-0 custom-select-input"
                                            id="export"
                                            style={{ whiteSpace: "nowrap", padding: "0.35rem 0.65rem" }}
                                            onClick={() => {
                                                if (!setFormData) return;
                                                setFormData((prev) => ({ ...prev, deals: [] }));
                                                setSelectedRowIds([]);
                                            }}
                                        >
                                            <span className="lasttime">Clear All</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>



                            <div
                                ref={tableWrapperRef}
                                className="position-relative"
                                style={{
                                    overflowX: "auto",
                                    overflowY: "auto",
                                    maxHeight: "450px",
                                    height: "105px",
                                    marginRight: "15px",
                                }}
                            >

                                <div
                                    ref={guideLineRef}
                                    style={{
                                        display: "none",
                                        position: "absolute",
                                        top: 0,
                                        width: "2px",
                                        background: "#0d6efd",
                                        zIndex: 10,
                                        pointerEvents: "none",
                                    }}
                                />

                                <Table
                                    key={"banners-table-" + count}
                                    size="sm"
                                    hover
                                    className="table mb-0 text-center border-bottom-0"
                                    style={{ tableLayout: "fixed", marginBottom: 0, borderBottom: "none" }}
                                >
                                    <thead className="table-light">
                                        <tr>
                                            {[
                                                "Name",
                                                "Status",
                                                "Publishers",
                                                "Type",
                                                "Exchange",
                                                "Price(cpm)",
                                                "Y'days Auction",
                                            ].map((header, index) => {
                                                const keyMap = {
                                                    Actions: "actions",
                                                    ID: "id",
                                                    "Remaining Reports": "reports",
                                                    "Created On": "createdOn",
                                                    Status: "status",
                                                    Name: "name",
                                                    Repeats: "repeats",
                                                };
                                                const key = keyMap[header];
                                                return (
                                                    <th
                                                        key={index}
                                                        className={selectedHeader === index ? "selected" : ""}
                                                        style={{
                                                            cursor: key && key !== "actions" ? "pointer" : "default",
                                                            position: "relative",
                                                            width: columnWidths[key],
                                                            textAlign: "center",
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
                                                                {sortConfig.direction === "asc"
                                                                    ? <FaCaretUp />
                                                                    : <FaCaretDown />}
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
                                                        />
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-3">
                                                    <div className="full-page-loader">
                                                        <div className="loader" role="status" />
                                                        <span className="ms-2 fw-bold">Loading...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : rowData.length > 0 ? (
                                            rowData.map((row, index) => (
                                                <tr
                                                    key={row.id || index}
                                                    className={selectedRowIds.some((v) => String(v) === String(row.id)) ? "selected-row" : ""}
                                                    onClick={(e) => {
                                                        if (
                                                            e.target.closest(".dropdown-menu") ||
                                                            e.target.closest(".dropdown-toggle")
                                                        ) return;
                                                        // toggle selection
                                                        const id = row.id;
                                                        setSelectedRowIds((prev) => {
                                                            const exists = prev.some((v) => String(v) === String(id));
                                                            const next = exists ? prev.filter((v) => String(v) !== String(id)) : [...prev, id];
                                                            // sync to parent formData
                                                            if (setFormData) {
                                                                setFormData((fprev) => ({ ...fprev, deals: next }));
                                                            }
                                                            return next;
                                                        });
                                                    }}
                                                >
                                                    <td>{row.name}</td>
                                                    <td>{row.status}</td>
                                                    <td>{row.publishers}</td>
                                                    <td>{row.type}</td>
                                                    <td>{row.exchange}</td>
                                                    <td>{row.price}</td>
                                                    <td>{row.auction}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr style={{ borderBottom: "none" }}>
                                                <td
                                                    colSpan="7"
                                                    className="text-center text-secondary fw-bold p-0 border-0"
                                                    style={{ borderBottom: "none" }}
                                                >
                                                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60px", fontSize: "0.85rem" }}>
                                                        No deals available
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>


                        </Col>
                    </Row>
                </div>
            </div>


            <NewDealGroupPmp
                isOpen={isOpen}
                toggle={() => setIsOpen(!isOpen)}
                onApplySelectedDeals={(selectedData) => {
                    if (!Array.isArray(selectedData) || selectedData.length === 0) return;
                    // Map incoming selectedData to row shape expected by this table
                    const mapped = selectedData.map(d => ({
                        id: d.id,
                        name: d.name || d.dealName || "",
                        status: d.status || "Available",
                        publishers: d.publisher || d.publishers || "-",
                        type: d.type || "-",
                        exchange: d.exchange || "-",
                        price: d.price || d.priceType || "-",
                        auction: d.auctions || d.auction || "-",
                    }));

                    setRowData((prev) => {
                        // merge without duplicates by id
                        const map = {};
                        prev.forEach(r => { if (r && r.id !== undefined) map[String(r.id)] = r; });
                        mapped.forEach(r => { map[String(r.id)] = r; });
                        return Object.values(map);
                    });

                    // mark as selected
                    setSelectedRowIds((prev) => {
                        const nextSet = new Set(prev.map(String));
                        mapped.forEach(r => nextSet.add(String(r.id)));
                        const next = Array.from(nextSet);
                        if (setFormData) {
                            setFormData((fprev) => ({ ...fprev, deals: next }));
                        }
                        return next;
                    });
                }}
            />
        </>
    );
};

export default DealsEditor;
