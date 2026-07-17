import React, { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { FaCaretDown, FaCopy, FaCheck } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import {
  Row,
  Col,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import DataTable from "react-data-table-component";
import { getAllExchange, saveExchange, updateExchange, deleteExchange, editExchange, getExchangeId } from "./api/Api";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs, TabHeaderName } from "../context/TabContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import ReportingExchange from "../views/exchangereport/ReportingExchange";
import HourlyReportingExchange from "../views/exchangereport/HourlyReportingExchange";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import ExchangeModal from "./Modal/ExchangeModal";
import Swal from "sweetalert2";
import "./editors/campcreate.css";

const Exchanges = () => {
  const vx = useViewContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { globalTabsList: tabsList, addTab, removeTab, updateTab, initializePageTab } = useGlobalTabs();

  const [rowData, setRowData] = useState([]);
  const [unfilteredExchanges, setUnfilteredExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [count, setCount] = useState(0);
  const [newRow, setNewRow] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [nextExchangeId, setNextExchangeId] = useState(null);
  const [modal, setModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editRowId, setEditRowId] = useState(null);
  const [editRowData, setEditRowData] = useState({});
  const [postbackModal, setPostbackModal] = useState(false);
  const [postbackRow, setPostbackRow] = useState(null);
  const [postbackData, setPostbackData] = useState({ conversionId: "", conversionUrl: "" });
  const [copied, setCopied] = useState(false);
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
  ];
  const redraw = () => setCount((c) => c + 1);
  const toBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return ["1", "true", "yes", "y", "on"].includes(normalized);
    }
    return false;
  };
  const formatDateForApi = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };
  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const res = await getAllExchange();
      console.log("Fetched exchanges:", res);
      const list =
        res?.data?.data?.informationExchanges ||
        res?.data?.data?.exchangeList ||
        res?.data?.data ||
        res?.data?.exchangeList ||
        res?.data ||
        [];

      const allEx = (Array.isArray(list) ? list : []).map((item, index) => {
        const exchangeId = item.exchangeId || item.id || index + 1;
        return {
          id: exchangeId,
          name: item.name || item.exchangeName || "",
          exchangeEKey: item.exchangeEKey || item.extEKey || item.extensionEKey || item.eKey || "",
          exchangeIKey: item.exchangeIKey || item.extIKey || item.extensionIKey || item.iKey || "",
        };
      });
      setUnfilteredExchanges(allEx);

      const formatted = (Array.isArray(list) ? list : [])
        .map((item, index) => {
          const exchangeId = item.exchangeId || item.id || index + 1;
          return {
            id: exchangeId,
            rowKey: `exchange-${exchangeId}`,
            exchangeId,
            name: item.name || item.exchangeName || "",
            exchangeEKey: item.exchangeEKey || item.extEKey || item.extensionEKey || item.eKey || "",
            exchangeIKey: item.exchangeIKey || item.extIKey || item.extensionIKey || item.iKey || "",
            supplyChain: toBoolean(item.supplyChain),
            multiBidder: toBoolean(item.multiBidder),
            openRtbVersion: item.openRtbVersion || "",
            exchangeUrl: item.exchangeUrl || "",
            postbackConversionId: item.postbackConversionId || "",
            postbackConversionUrl: item.postbackConversionUrl || "",
            originalData: item,
          };
        });

      const uniqueRows = Array.from(new Map(formatted.map((item) => [item.exchangeId, item])).values());
      setRowData(uniqueRows);

      try {
        const idRes = await getExchangeId();
        console.log("Fetched next exchange ID:", idRes);
        const fetchedId = idRes?.data?.data ?? idRes?.data;
        setNextExchangeId(fetchedId);
      } catch (idErr) {
        console.error("Error fetching next exchange ID:", idErr);
      }
    } catch (err) {
      console.error("Error fetching exchanges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();
  }, []);

  // ========== NEW: automatically select the first row ==========
  useEffect(() => {
    if (rowData.length > 0 && selectedIds.length === 0) {
      setSelectedIds([rowData[0].rowKey]);
    }
  }, [rowData, selectedIds.length]);
  // ==============================================================
  useEffect(() => {
    const hasCreatePermission = canCreate("Exchange");
    const hasViewPermission = canView("Exchange");
    const hasEditPermission = canEdit("Exchange");
    const hasDeletePermission = canDelete("Exchange");
    const hasUpdatePermission = canUpdate("Exchange");

    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
  }, []);
  const refresh = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        await fetchExchanges();
        redraw();
      } catch (err) {
        console.error("Error refreshing exchanges:", err);
      } finally {
        setLoading(false);
      }
    }, 900);
  };

  const handleAddExchange = () => {
    setNewRow(true);
  };

  const handleSaveNew = async (exchangeData) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save this Exchange?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, save it!",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        popup: "campaign-save-swal-popup",
        title: "campaign-save-swal-title",
        htmlContainer: "campaign-save-swal-message",
        actions: "campaign-save-swal-actions",
        confirmButton: "campaign-save-swal-confirm",
        cancelButton: "campaign-save-swal-cancel",
      },
    });

    if (!result.isConfirmed) return;

    setSavingNew(true);
    const payload = {
      exchangeId: nextExchangeId || exchangeData.exchangeId,
      name: exchangeData.name,
      exchangeEKey: exchangeData.exchangeEKey,
      exchangeIKey: exchangeData.exchangeIKey,
      supplyChain: exchangeData.supplyChain ? 1 : 0,
      multiBidder: exchangeData.multiBidder ? 1 : 0,
      openRtbVersion: exchangeData.openRtbVersion,
      exchangeUrl: exchangeData.exchangeUrl,
      postbackConversionId: "",
      postbackConversionUrl: "",
    };
    try {
      await saveExchange(payload);
      setNewRow(false);
      await fetchExchanges();
      await Swal.fire({
        html: `
          <div style="
            padding: 40px 30px;
            text-align: center;
            font-family: Arial, sans-serif;
          ">
            <div style="
              width: 90px;
              height: 90px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(40,167,69,0.1);
              border-radius: 50%;
            ">
              <i class="fa fa-check-circle" style="
                font-size: 50px;
                color: #28a745;
              "></i>
            </div>

            <h2 style="
              margin: 0 0 10px;
              font-size: 28px;
              font-weight: 700;
              color: #1e293b;
            ">
              Exchange Created!
            </h2>

            <p style="
              margin: 0;
              font-size: 16px;
              color: #64748b;
            ">
              Successfully exchange created.
            </p>
          </div>
        `,
        timer: 2000,
        showConfirmButton: false,
        width: 500,
        padding: 0,
        background: "#ffffff",
        allowOutsideClick: false,
        customClass: {
          popup: "campaign-save-swal-popup",
        },
      });
    } catch (err) {
      console.error("Error saving exchange:", err);
      await Swal.fire({
        title: "Error!",
        text: err.message || "Failed to save exchange.",
        icon: "error",
      });
    } finally {
      setSavingNew(false);
    }
  };

  const handleEditRow = async (id) => {
    try {
      const res = await editExchange(id);
      const item =
        res?.data?.data?.exchange ||
        res?.data?.data ||
        res?.data?.exchange ||
        res?.data ||
        {};
      setEditRowId(id);
      setEditRowData({
        name: item.name || item.exchangeName || "",
        exchangeEKey: item.exchangeEKey || item.extEKey || item.extensionEKey || item.eKey || "",
        exchangeIKey: item.exchangeIKey || item.extIKey || item.extensionIKey || item.iKey || "",
        supplyChain: toBoolean(item.supplyChain),
        multiBidder: toBoolean(item.multiBidder),
        openRtbVersion: item.openRtbVersion || "",
        exchangeUrl: item.exchangeUrl || "",
        postbackConversionId: item.postbackConversionId || "",
        postbackConversionUrl: item.postbackConversionUrl || "",
      });
    } catch (err) {
      console.error("Error loading exchange for edit:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setEditRowData({});
  };

  const handleSaveEdit = async (id) => {
    const trimmedName = editRowData.name?.trim();
    if (!trimmedName) {
      alert("Exchange Name is required.");
      return;
    }

    // Check duplicate name against all other exchanges (case-insensitive)
    const isDuplicate = unfilteredExchanges.some(
      (item) =>
        item.id !== id &&
        item.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      alert("Exchange Name already exists.");
      return;
    }

    // Check duplicate E Key against all other exchanges (case-insensitive)
    const trimmedEKey = editRowData.exchangeEKey?.trim();
    if (trimmedEKey) {
      const isEKeyDuplicate = unfilteredExchanges.some(
        (item) =>
          item.id !== id &&
          item.exchangeEKey &&
          item.exchangeEKey.trim().toLowerCase() === trimmedEKey.toLowerCase()
      );
      if (isEKeyDuplicate) {
        alert("Exchange E Key already exists.");
        return;
      }
    }

    // Check duplicate I Key against all other exchanges (case-insensitive)
    const trimmedIKey = editRowData.exchangeIKey?.trim();
    if (trimmedIKey) {
      const isIKeyDuplicate = unfilteredExchanges.some(
        (item) =>
          item.id !== id &&
          item.exchangeIKey &&
          item.exchangeIKey.trim().toLowerCase() === trimmedIKey.toLowerCase()
      );
      if (isIKeyDuplicate) {
        alert("Exchange I Key already exists.");
        return;
      }
    }

    try {
      await updateExchange(id, {
        name: trimmedName,
        exchangeEKey: editRowData.exchangeEKey,
        exchangeIKey: editRowData.exchangeIKey,
        supplyChain: editRowData.supplyChain ? 1 : 0,
        multiBidder: editRowData.multiBidder ? 1 : 0,
        openRtbVersion: editRowData.openRtbVersion,
        exchangeUrl: editRowData.exchangeUrl || `https://somexxx.com/${trimmedName}`,
        postbackConversionId: editRowData.postbackConversionId,
        postbackConversionUrl: editRowData.postbackConversionUrl,
      });
      setEditRowId(null);
      setEditRowData({});
      await fetchExchanges();
    } catch (err) {
      console.error("Error updating exchange:", err);
    }
  };

  const modalCallback = async (doit) => {
    if (doit && deleteId) {
      try {
        await deleteExchange(deleteId);
        await fetchExchanges();
      } catch (err) {
        console.error("Error deleting exchange:", err);
      }
    }
    setDeleteId(null);
    setModal(false);
  };

  const showDeleteModal = (e, id) => {
    if (e.ctrlKey) {
      deleteExchange(id).then(() => fetchExchanges());
      return;
    }
    setDeleteId(id);
    setModal(true);
  };

  const handleSupplyChainToggle = useCallback(async (row, newValue) => {
    if (editRowId === row.id) {
      setEditRowData((p) => ({ ...p, supplyChain: newValue }));
      return;
    }

    // Update UI immediately
    setRowData(prevData =>
      prevData.map(item =>
        item.id === row.id
          ? {
            ...item,
            supplyChain: newValue,
            originalData: {
              ...item.originalData,
              supplyChain: newValue ? 1 : 0
            }
          }
          : item
      )
    );

    // Save to API in background — don't revert UI on failure
    try {
      await updateExchange(row.id, {
        name: row.name,
        exchangeEKey: row.exchangeEKey,
        exchangeIKey: row.exchangeIKey,
        supplyChain: newValue ? 1 : 0,
      });
    } catch (err) {
      console.error("Error saving supply chain toggle:", err);
    }
  }, [editRowId]);

  const handleMultiBidderToggle = useCallback(async (row, newValue) => {
    if (editRowId === row.id) {
      setEditRowData((p) => ({ ...p, multiBidder: newValue }));
      return;
    }

    // Update UI immediately
    setRowData(prevData =>
      prevData.map(item =>
        item.id === row.id
          ? {
            ...item,
            multiBidder: newValue,
            originalData: {
              ...item.originalData,
              multiBidder: newValue ? 1 : 0
            }
          }
          : item
      )
    );

    // Save to API in background
    try {
      await updateExchange(row.id, {
        name: row.name,
        exchangeEKey: row.exchangeEKey,
        exchangeIKey: row.exchangeIKey,
        multiBidder: newValue ? 1 : 0,
      });
    } catch (err) {
      console.error("Error saving multi bidder toggle:", err);
    }
  }, [editRowId]);

  const handleSavePostback = async () => {
    if (!postbackRow) return;
    try {
      await updateExchange(postbackRow.id, {
        ...postbackRow,
        postbackConversionId: postbackData.conversionId,
        postbackConversionUrl: postbackData.conversionUrl,
      });
      setPostbackModal(false);
      await fetchExchanges();
    } catch (err) {
      console.error("Error saving postback data:", err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      ID: item.exchangeId,
      Name: item.name,
      "Exchange E Key": item.exchangeEKey,
      "Exchange I Key": item.exchangeIKey,
      "Supply Chain": item.supplyChain ? "Yes" : "No",
      "Multi Bidder": item.multiBidder ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exchanges");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "exchanges.xlsx");
  };

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return rowData.filter((item) =>
      item.name?.toLowerCase().includes(term) ||
      String(item.exchangeId || "").includes(searchTerm) ||
      item.exchangeEKey?.toLowerCase().includes(term) ||
      item.exchangeIKey?.toLowerCase().includes(term)
    );
  }, [rowData, searchTerm]);

  const selectedRow = useMemo(() => {
    return rowData.find((r) => r.rowKey === selectedIds[0]);
  }, [rowData, selectedIds]);

  const tableData = useMemo(() => {
    return filteredData;
  }, [filteredData]);

  const handleRowClicked = (row) => {
    setSelectedIds([row.rowKey]);
  };

  const CustomLoader = () => (
    <div className="customloader">
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const NoDataComponent = () => (
    <div className="nodataavilable">
      <div className="py-4 fw-bold text-secondary">No data available</div>
    </div>
  );

  const customStyles = {
    table: {
      style: {
        backgroundColor: "#fff",
        minWidth: "1000px",
      },
    },
    headRow: {
      style: {
        minHeight: "56px",
        backgroundColor: "#eef4fa",
        borderBottom: "1px solid #dfe7f1",
        height: "56px",
      },
    },
    headCells: {
      style: {
        color: "#64748b",
        fontSize: "12px",
        fontWeight: 800,
        textTransform: "uppercase",
        paddingLeft: "12px",
        paddingRight: "12px",
        borderRight: "1px solid #e6ebf2",
      },
    },
    rows: {
      style: {
        minHeight: "56px",
        borderBottom: "1px solid #eef2f7",
        height: "50px",
      },
    },
    cells: {
      style: {
        paddingLeft: "14px",
        paddingRight: "14px",
        paddingTop: "10px",
        paddingBottom: "10px",
        borderRight: "1px solid #f1f5f9",
        whiteSpace: "nowrap",
      },
    },
  };

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.rowKey),
      style: {
        backgroundColor: "#FBEDEF !important",
        "& .gOorhn": { color: "black !important" },
      },
    },
    {
      when: (row) => row._isNew === true,
    },
  ];

  const ActionsCell = ({ row }) => {
    if (editRowId === row.id) {
      return (
        <div className="d-flex gap-1">
          <button
            type="button"
            className="btn btn-success btn-sm py-0 px-1 rounded-0"
            style={{ fontSize: "10px" }}
            onClick={() => handleSaveEdit(row.id)}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm py-0 px-1 rounded-0"
            style={{ fontSize: "10px" }}
            onClick={handleCancelEdit}
          >
            Cancel
          </button>
        </div>
      );
    }

    return null;
  };

  const columns = [
    {
      name: "S.No",
      cell: (row, index) => <div className="gOorhn">{index + 1}</div>,
      sortable: false,
      width: "70px",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => {
        if (editRowId === row.id) {
          return (
            <Input
              className="form-control py-0 px-1 rounded-0"
              style={{ fontSize: "11px", height: "22px" }}
              type="text"
              value={editRowData.name}
              onChange={(e) => {
                const newName = e.target.value;
                setEditRowData((p) => ({
                  ...p,
                  name: newName,
                  exchangeUrl: `https://somexxx.com/${newName.trim()}`
                }));
              }}
            />
          );
        }
        return (
          <div
            className="gOorhn">
            {row.name}
          </div>
        );
      },
      sortable: true,
      grow: 3,
    },
    {
      name: "Exchange E Key",
      selector: (row) => row.exchangeEKey,
      cell: (row) => {
        if (editRowId === row.id) {
          return (
            <Input
              className="form-control py-0 px-1 rounded-0"
              style={{ fontSize: "11px", height: "22px" }}
              type="text"
              value={editRowData.exchangeEKey}
              onChange={(e) => setEditRowData((p) => ({ ...p, exchangeEKey: e.target.value }))}
            />
          );
        }
        return <div className="gOorhn">{row.exchangeEKey}</div>;
      },
      sortable: true,
      grow: 3,
    },
    {
      name: "Exchange I Key",
      selector: (row) => row.exchangeIKey,
      cell: (row) => {
        if (editRowId === row.id) {
          return (
            <Input
              className="form-control py-0 px-1 rounded-0"
              style={{ fontSize: "11px", height: "22px" }}
              type="text"
              value={editRowData.exchangeIKey}
              onChange={(e) => setEditRowData((p) => ({ ...p, exchangeIKey: e.target.value }))}
            />
          );
        }
        return <div className="gOorhn">{row.exchangeIKey}</div>;
      },
      sortable: true,
      grow: 3,
    },
      {
           name: "Daily Reporting",
           cell: (row) => {
        const targetExchangeId = row.exchangeId;
        const targetExchangeName = row.name || row.exchangeName;
        const handleDailyReporting = () => {
          if (!targetExchangeId || !targetExchangeName) {
            console.warn("Missing data for daily reporting navigation", { targetExchangeId, targetExchangeName });
            return;
          }

          const finalEnd = new Date();
          const finalStart = new Date();
          finalStart.setDate(finalEnd.getDate() - 29);

          navigate(`/admin/exchange/${targetExchangeId}/detailed-exchange-view/daily-reporting`, {
            state: {
              exchangeId: targetExchangeId,
              exchangeName: targetExchangeName,
              startDate: formatDateForApi(finalStart),
              endDate: formatDateForApi(finalEnd),
            },
          });
        };

        return (
          <Button
            color="success"
            size="sm"
            id="dailyreporting"
            onClick={handleDailyReporting}
          >
            View Daily Report
          </Button>
        );
      },
    },
    {
      name: "Multi Bidder",
      selector: (row) => row.multiBidder,
      cell: (row) => {
        const isEditing = editRowId === row.id;

        const getCheckedState = () => {
          if (isEditing) return !!editRowData.multiBidder;
          return !!row.multiBidder;
        };

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Input
              key={`checkbox-${row.id}`}
              type="checkbox"
              className="m-0 cursor-pointer"
              checked={Boolean(getCheckedState())}
              onChange={(e) => handleMultiBidderToggle(row, e.target.checked)}
              style={{ width: "16px", height: "16px" }}
            />
          </div>
        );
      },
      sortable: true,
      width: "150px",
      center: true,
      ignoreRowClick: true,
    },
    {
      name: "Supply Chain",
      selector: (row) => row.supplyChain,
      cell: (row) => {
        const isEditing = editRowId === row.id;

        const getCheckedState = () => {
          if (isEditing) return !!editRowData.supplyChain;
          return !!row.supplyChain;
        };

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Input
              key={`checkbox-${row.id}`}
              type="checkbox"
              className="m-0 cursor-pointer"
              checked={Boolean(getCheckedState())}
              onChange={(e) => handleSupplyChainToggle(row, e.target.checked)}
              style={{ width: "16px", height: "16px" }}
            />
          </div>
        );
      },
      sortable: true,
      width: "150px",
      center: true,
      ignoreRowClick: true,
    },

    ...(editRowId
      ? [
        {
          name: "Actions",
          cell: (row) => <ActionsCell row={row} />,
          ignoreRowClick: true,
          allowOverflow: true,
          button: true,
          width: "100px",
        },
      ]
      : []),
  ];

  return (
    <>
      {canViewUser ? (
        <>
          <div className="campaign-daily-container">
            <div className="campaign-daily-content">
              {modal && (
                <DecisionModal
                  title="Really delete Exchange?"
                  message="Only the db admin can undo this if you delete it!!!"
                  name="DELETE"
                  callback={modalCallback}
                />
              )}
              <div className="campaign-daily-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div>
                  <div className="campaign-daily-title">
                    <h2>Exchanges</h2>
                  </div>
                </div>
              </div>
              <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
                <CardBody className="py-3" style={{ overflow: "visible" }}>
                  <div className="campaign-daily-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div className="cdi-controls-left" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: '12px', whiteSpace: 'nowrap' }}>
                      <div className="cdi-search-box">
                        <input
                          type="text"
                          placeholder="Search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '13px', width: '200px' }}
                        />
                      </div>

                      <button className="cdi-refresh-btn" onClick={refresh} title="Refresh Data" style={{ padding: '6px 12px', border: '1px solid #e2e8f0', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                        <i className={"fa fa-repeat " + (loading ? "fa-spin" : "")}></i>
                      </button>
                    </div>

                    <div className="cdi-controls-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                      <button className="cdi-export-btn" onClick={handleExport} style={{ backgroundColor: '#dc2626', color: 'white', borderColor: '#dc2626', height: '30px' }}>
                        <i className="fa fa-download me-1"></i> EXPORT
                      </button>
                      {canCreateUser && (
                        <button
                          type="button"
                          className="cdi-export-btn"
                          style={{ backgroundColor: '#0ea5e9', color: 'white', borderColor: '#e2e8f0', marginLeft: '8px', height: '30px' }}
                          onClick={handleAddExchange}
                          disabled={!!newRow}
                          id="newexchange"
                        >
                          + ADD EXCHANGE
                        </button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
              <div className="campaign-daily-table-wrapper">
                <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "auto", maxHeight: "70vh" }}>
                  <div style={{ minWidth: "1000px" }}>
                    <DataTable
                      keyField="rowKey"
                      className="data-table"
                      columns={columns}
                      data={tableData}
                      customStyles={customStyles}
                      highlightOnHover
                      pointerOnHover
                      persistTableHead
                      striped
                      dense
                      fixedHeader
                      fixedHeaderScrollHeight="100%"
                      responsive={false}
                      // conditionalRowStyles={conditionalRowStyles}
                      onRowClicked={handleRowClicked}
                      progressPending={loading}
                      progressComponent={<CustomLoader />}
                      noDataComponent={
                        <div className="py-5 text-center text-secondary">
                          No data available
                        </div>
                      }
                    />
                  </div>
                </div>
              </div>

              <Col xs="12" className="p-0">
                <Fragment>
                  <div className="panel_Container brandpanel">
                    <div className="brandlist">
                      <Row
                        className="inventory-row align-items-center border"
                        id="subtable-exe"
                      >
                        <Col
                          xs="12"
                          md="2"
                          className="d-flex align-items-center"
                        >
                          <i className="tim-icons icon-triangle-down me-2 opacity-75"></i>
                        </Col>

                        <Col
                          xs="auto"
                          className="d-flex flex-wrap align-items-center ms-auto"
                        >
                          {steps.map((item, i) => {
                            const isActive = i === step;

                            return (
                              <div
                                key={i}
                                onClick={() => setStep(i)}
                                style={{ cursor: "pointer" }}
                                className={`tab-step d-flex align-items-center mx-2 px-2 py-1 ${isActive ? "active" : ""
                                  }`}
                              >
                                <i
                                  className={`tim-icons ${item.icon} me-2 ${isActive ? "" : "text-muted"
                                    }`}
                                  style={
                                    isActive
                                      ? { color: "#3a3d40", opacity: 1 }
                                      : {}
                                  }
                                />
                                <span
                                  className={`fw-semibold ${isActive ? "" : "text-muted"
                                    }`}
                                  id="subgroupname"
                                  style={
                                    isActive
                                      ? { color: "#3a3d40", opacity: 1 }
                                      : {}
                                  }
                                >
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </Col>
                      </Row>
                      <div style={{ flexGrow: 1 }} />
                    </div>
                  </div>
                  {/* {step === 0 && <ReportingExchange exchangeName={selectedRow?.name?.toLowerCase()} exchangeId={selectedRow?.id} />} */}
                  {step === 1 && <HourlyReportingExchange exchangeName={selectedRow?.name?.toLowerCase()} exchangeId={selectedRow?.id} />}
                </Fragment>
              </Col>
            </div>
          </div>

          <Modal isOpen={postbackModal} toggle={() => setPostbackModal(!postbackModal)} centered>
            <ModalHeader toggle={() => setPostbackModal(!postbackModal)}>
              Postback Settings - {postbackRow?.name}
            </ModalHeader>
            <ModalBody>
              <Row className="mb-3">
                <Col md="4">
                  <label className="fw-bold small">Conversion ID</label>
                  <Input
                    type="text"
                    placeholder="Conversion ID"
                    value={postbackData.conversionId}
                    onChange={(e) => setPostbackData(p => ({ ...p, conversionId: e.target.value }))}
                    className="form-control-sm rounded-0"
                  />
                </Col>
                <Col md="8">
                  <label className="fw-bold small">Conversion URL</label>
                  <Input
                    type="text"
                    placeholder="Conversion URL"
                    value={postbackData.conversionUrl}
                    onChange={(e) => setPostbackData(p => ({ ...p, conversionUrl: e.target.value }))}
                    className="form-control-sm rounded-0"
                  />
                </Col>
              </Row>
              <Row>
                <Col md="12">
                  <label className="fw-bold small">Tracking URL (Read-only)</label>
                  <div className="d-flex gap-2">
                    <Input
                      type="textarea"
                      readOnly
                      rows="3"
                      value={postbackData.conversionId.trim() && postbackData.conversionUrl.trim()
                        ? "https://dsp.adaxxpro.com/postback?af_click_id={af_click_id}&campaign_id={campaign_id}&af_ad_id={creative_id}&af_sub3={imp_id}&event={event_name}&revenue={af_revenue}"
                        : ""
                      }
                      className="form-control-sm rounded-0 bg-light"
                      style={{ fontSize: "11px" }}
                    />
                    {postbackData.conversionId.trim() && postbackData.conversionUrl.trim() && (
                      <Button
                        color="info"
                        size="sm"
                        className="rounded-0 p-2 d-flex align-items-center justify-content-center"
                        style={{ height: "36px" }}
                        onClick={() => copyToClipboard("https://tracker.adaxxpro.com/postback?af_click_id={af_click_id}&campaign_id={campaign_id}&af_ad_id={creative_id}&af_sub3={imp_id}&event={event_name}&revenue={af_revenue}")}
                        title="Copy Link"
                      >
                        {copied ? <FaCheck className="text-white" /> : <FaCopy />}
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter>
              <Button color="success" size="sm" className="rounded-0" onClick={handleSavePostback}>
                Save
              </Button>
              <Button color="secondary" size="sm" className="rounded-0" onClick={() => setPostbackModal(false)}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>

          <ExchangeModal
            isOpen={newRow}
            toggle={() => setNewRow(!newRow)}
            onSave={handleSaveNew}
            saving={savingNew}
            existingExchanges={unfilteredExchanges}
            nextExchangeId={nextExchangeId}
          />
        </>
      ) : (
        <div className="alert alert-warning mt-3" style={{ margin: '20px' }}>
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Exchange.
        </div>
      )}
    </>
  );
};

export default Exchanges;
