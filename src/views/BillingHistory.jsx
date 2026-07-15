import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Button, Col, Row, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, Table, Card, CardBody } from "reactstrap";
import { useLocation } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useGlobalTabs } from "../context/TabContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faDownload, faChevronRight, faChevronDown, faPlus, faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { createBilling, getAlladvertiserLogin, updateBilling, updateBillingStatus, getAllBillingHistory } from "./api/Api";
import { canCreate, canApprove, canView } from "../utils/permissionHelper";
import logo from "../assets/img/adxpro.png";
import "./billinghistory.css";

const CustomDropdown = ({ options, value, onChange, placeholder, style, triggerStyle, dropdownStyle, className, triggerClassName, dropdownClassName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={containerRef} className={`bh-dropdown-container ${className || ""}`} style={style}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`bh-dropdown-trigger ${selectedOption ? "has-value" : ""} ${triggerClassName || ""}`}
        style={triggerStyle}
      >
        <span>{selectedOption ? selectedOption.label : placeholder || "Select..."}</span>
        <FontAwesomeIcon
          icon={faCaretDown}
          className={`bh-dropdown-trigger-icon${isOpen ? " is-open" : ""}`}
        />
      </div>

      {isOpen && (
        <div className={`bh-dropdown-menu ${dropdownClassName || ""}`} style={dropdownStyle}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`bh-dropdown-item${isSelected ? " is-selected" : ""}`}
              >
                <span className="bh-dropdown-item-check">
                  {isSelected ? "✓" : ""}
                </span>
                <span>{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const perPageOptions = [
  { label: "10 per page", value: 10 },
  { label: "20 per page", value: 20 },
  { label: "25 per page", value: 25 },
  { label: "50 per page", value: 50 },
  { label: "100 per page", value: 100 },
  { label: "250 per page", value: 250 },
  { label: "500 per page", value: 500 },
];

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "-" || isNaN(Number(val))) return "-";
  const num = Number(val);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
};

const readPendingLockIds = (storageKey) => {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
};

const getBillingAmount = (item) => {
  const rawAmount = item?.fundAdd ?? item?.totalFund ?? item?.availableFund ?? item?.fund ?? 0;
  const numericAmount = Number(String(rawAmount).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numericAmount) ? numericAmount.toFixed(2) : "0.00";
};

const getBillingSignature = (item) => {
  const userKey = String(item?.userId ?? "").trim().toLowerCase();
  const advertiserKey = String(item?.advertiserId ?? item?.userName ?? item?.name ?? "").trim().toLowerCase();
  const amountKey = getBillingAmount(item);
  return `${userKey}|${advertiserKey}|${amountKey}`;
};

const getBillingSortTime = (item, index) => {
  const timeSource = item?.createdAt || item?.approvedAt || item?.updatedAt || item?.created_at || item?.updated_at;
  const parsedTime = Date.parse(timeSource);
  return Number.isFinite(parsedTime) ? parsedTime : index;
};

const buildPendingLockedIds = (rawData) => {
  const finalStatuses = new Set(["approved", "rejected"]);
  const lockedIds = new Set();
  const pendingStacks = new Map();

  const sortedRows = rawData
    .map((item, index) => ({ item, index, sortTime: getBillingSortTime(item, index) }))
    .sort((a, b) => a.sortTime - b.sortTime || a.index - b.index);

  sortedRows.forEach(({ item }) => {
    const rowId = item?.billingHistoryId ?? item?.id;
    const normalizedStatus = String(item?.status || item?.xstatus || "Pending").trim().toLowerCase();
    const signature = getBillingSignature(item);

    if (normalizedStatus === "pending") {
      const queue = pendingStacks.get(signature) || [];
      queue.push(String(rowId));
      pendingStacks.set(signature, queue);
      return;
    }

    if (!finalStatuses.has(normalizedStatus)) return;

    const queue = pendingStacks.get(signature);
    if (queue && queue.length > 0) {
      const lockedPendingId = queue.pop();
      lockedIds.add(lockedPendingId);
      pendingStacks.set(signature, queue);
    }
  });

  return lockedIds;
};

const escapePdfText = (text) =>
  String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const concatUint8Arrays = (arrays) => {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  arrays.forEach((arr) => {
    result.set(arr, offset);
    offset += arr.length;
  });
  return result;
};

const base64ToUint8Array = (base64) => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const loadLogoImageData = (imageSrc) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const width = 220;
      const height = 80;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas is not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });

const buildInvoicePdf = async (row) => {
  const encoder = new TextEncoder();
  const invoiceNumber = `INV-${String(row?.id ?? Date.now()).padStart(6, "0")}`;
  const imageDataUrl = await loadLogoImageData(logo);
  const match = imageDataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Unable to load logo image");
  }

  const imageBytes = base64ToUint8Array(match[2]);
  const imageWidth = 220;
  const imageHeight = 80;

  const invoiceLines = [
    `Invoice No: ${invoiceNumber}`,
    `Advertiser: ${row?.agencyName || "-"}`,
    `Fund: ${row?.rawFund ?? row?.fund ?? "-"}`,
    `Status: ${row?.status || "-"}`,
    `Approved By: ${row?.approvedBy || "-"}`,
    `Approved At: ${row?.approvedAt || "-"}`,
    `Generated: ${new Date().toLocaleString()}`,
  ];

  const contentStreamLines = [
    "q",
    `220 0 0 80 72 680 cm`,
    "/Im1 Do",
    "Q",
  ];

  invoiceLines.forEach((line, index) => {
    const y = 640 - index * 18;
    contentStreamLines.push(`BT /F1 10 Tf 72 ${y} Td (${escapePdfText(line)}) Tj ET`);
  });

  const contentStream = contentStreamLines.join("\n");
  const objects = [
    encoder.encode("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"),
    encoder.encode("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"),
    encoder.encode("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> /XObject << /Im1 6 0 R >> >> >>\nendobj\n"),
    encoder.encode(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`),
    encoder.encode("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"),
    encoder.encode(`6 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`),
    imageBytes,
    encoder.encode("\nendstream\nendobj\n"),
  ];

  const pdfChunks = [encoder.encode("%PDF-1.4\n")];
  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(pdfChunks.reduce((sum, chunk) => sum + chunk.length, 0));
    pdfChunks.push(obj);
  });

  const xrefOffset = pdfChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  pdfChunks.push(encoder.encode(`xref\n0 ${objects.length + 1}\n`));
  pdfChunks.push(encoder.encode("0000000000 65535 f \n"));
  offsets.slice(1).forEach((offset) => {
    pdfChunks.push(encoder.encode(`${String(offset).padStart(10, "0")} 00000 n \n`));
  });
  pdfChunks.push(encoder.encode(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));

  return concatUint8Arrays(pdfChunks);
};

const BillingHistory = () => {
  const location = useLocation();
  const {
    globalTabsList: tabsList,
    addTab,
    removeTab,
    updateTab,
    initializePageTab,
  } = useGlobalTabs();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [canCreateFund, setCanCreateFund] = useState(canCreate("Fund Management"));
  const [canApproveFund, setCanApproveFund] = useState(canApprove("Fund Management"));
  const [canViewUser, setCanViewUser] = useState(canView("Fund Management"));
  const pendingLockStorageKey = useMemo(
    () => `billing-pending-locks:${localStorage.getItem("userId") || "anonymous"}`,
    [],
  );
  const [disabledPendingIds, setDisabledPendingIds] = useState(() => readPendingLockIds(pendingLockStorageKey));

  const persistDisabledPendingIds = useCallback((nextIds) => {
    const values = Array.from(nextIds).map(String);
    try {
      localStorage.setItem(pendingLockStorageKey, JSON.stringify(values));
    } catch {
      // Ignore storage failures; the in-memory lock still works for the session.
    }
  }, [pendingLockStorageKey]);

  const lockPendingButton = useCallback((rowId) => {
    if (rowId === undefined || rowId === null) return;
    setDisabledPendingIds((prev) => {
      const next = new Set(prev);
      next.add(String(rowId));
      persistDisabledPendingIds(next);
      return next;
    });
  }, [persistDisabledPendingIds]);

  const fetchBillings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllBillingHistory();
      if (response && response.data) {
        const rawData =
          response.data.data?.informationBillingHistory ||
          response.data.informationBillingHistory ||
          response.data.data?.informationBillings ||
          response.data.informationBillings ||
          (Array.isArray(response.data) ? response.data : []);
        const pendingLockedIds = buildPendingLockedIds(rawData);
        const lockedIds = readPendingLockIds(pendingLockStorageKey);
        const mappedData = rawData.map((item, index) => {
          let fundValue = 0;
          if (item.totalFund !== null && item.totalFund !== undefined && item.totalFund !== 0) {
            fundValue = item.totalFund;
          } else if (item.fundAdd !== null && item.fundAdd !== undefined && item.fundAdd !== 0) {
            fundValue = item.fundAdd;
          } else if (item.availableFund !== null && item.availableFund !== undefined && item.availableFund !== 0) {
            fundValue = item.availableFund;
          } else if (item.fund !== null && item.fund !== undefined) {
            fundValue = item.fund;
          } else {
            fundValue = item.totalFund ?? item.fundAdd ?? item.availableFund ?? item.fund ?? 0;
          }

          let formattedFund = formatCurrency(fundValue);
          const rowId = item.billingHistoryId ?? item.id;
          const rowStatus = (() => {
            const rawStatus = item.status || item.xstatus || "Pending";
            return rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
          })();

          const formatDateTime = (dateStr) => {
            if (!dateStr) return "-";
            return dateStr.replace("T", " ").substring(0, 19);
          };

          return {
            sno: index + 1,
            id: rowId,
            userId: item.userId,
            advertiserId: item.advertiserId,
            agencyName: item.name || "-",
            userName: item.userName || item.name || "-",
            campaignName: item.campaignName || "-",
            fundAdd: formatCurrency(item.fundAdd),
            totalFund: formatCurrency(item.totalFund),
            fundSub: formatCurrency(item.fundSub),
            availableFund: formatCurrency(item.availableFund),
            fund: formattedFund,
            rawFund: fundValue,
            addedAt: formatDateTime(item.createdAt),
            status: rowStatus,
            statusUpdatedBy: item.statusUpdatedBy || item.approvedBy || "-",
            approvedBy: item.statusUpdatedBy || item.approvedBy || "-",
            approvedAt: formatDateTime(item.approvedAt),
            comments: item.comments || "",
            pendingLocked: lockedIds.has(String(rowId)) || pendingLockedIds.has(String(rowId)),
          };
        });
        setRows(mappedData);
      }
    } catch (err) {
      console.error("Failed to fetch billings:", err);
    } finally {
      setLoading(false);
    }
  }, [pendingLockStorageKey]);

  const [isAddFundOpen, setIsAddFundOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [addComments, setAddComments] = useState("");

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [statusValue, setStatusValue] = useState("");
  const [statusComments, setStatusComments] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyRow, setHistoryRow] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [statusFund, setStatusFund] = useState("");

  const [agencyList, setAgencyList] = useState([]);

  useEffect(() => {
    if (!isHistoryOpen) {
      setHistoryList([]);
    }
  }, [isHistoryOpen]);

  const fetchAdvertisers = useCallback(async () => {
    try {
      const response = await getAlladvertiserLogin();
      if (response && response.data) {
        const advertisersData = Array.isArray(response.data)
          ? response.data
          : (response.data.data || []);
        setAgencyList(advertisersData);
      }
    } catch (err) {
      console.error("Failed to fetch advertisers:", err);
    }
  }, []);

  const agencyOptions = useMemo(() => {
    return agencyList
      .map(agency => {
        const name = typeof agency === "string"
          ? agency
          : (agency.name || agency.firstName || agency.email || "");
        const value = typeof agency === "string" ? agency : (agency.userId || agency.id || name);
        return { label: name, value: value };
      })
      .filter(opt => opt.value !== "");
  }, [agencyList]);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (perPageRef.current && !perPageRef.current.contains(event.target)) {
        setIsPerPageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase().trim();
    return rows.filter((row) => {
      return (
        String(row.agencyName || "").toLowerCase().includes(term) ||
        String(row.status || "").toLowerCase().includes(term) ||
        String(row.approvedBy || "").toLowerCase().includes(term) ||
        String(row.comments || "").toLowerCase().includes(term) ||
        String(row.id || "").toLowerCase().includes(term)
      );
    });
  }, [rows, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredRows.slice(startIndex, startIndex + perPage);
  }, [filteredRows, currentPage, perPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  useEffect(() => {
    initializePageTab("Billing History", "fa fa-usd", "/admin/billing-history");
    updateTab("default", {
      header: (
        <>
          <i className="fa fa-usd me-2"></i>
          Billing History
        </>
      ),
      route: "/admin/billing-history",
    });
  }, [initializePageTab, updateTab]);

  useEffect(() => {
    setCanCreateFund(canCreate("Fund Management"));
    setCanApproveFund(canApprove("Fund Management"));
    setCanViewUser(canView("Fund Management"));
  }, []);

  useEffect(() => {
    fetchBillings();
    fetchAdvertisers();
  }, [fetchBillings, fetchAdvertisers]);

  const handleRefresh = () => {
    fetchBillings();
    fetchAdvertisers();
  };

  const handleDownloadInvoice = async (row) => {
    if (!row) {
      alert("No invoice data available");
      return;
    }

    try {
      const pdfContent = await buildInvoicePdf(row);
      const blob = new Blob([pdfContent], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice_${row.id || row.sno || "billing"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download invoice PDF:", err);
      alert("Unable to download invoice PDF");
    }
  };

  const handleOpenStatusModal = useCallback((row) => {
    const normalizedStatus = String(row?.status || "").trim().toLowerCase();
    if (normalizedStatus !== "pending" || row?.pendingLocked || disabledPendingIds.has(String(row?.id))) return;
    setSelectedRow(row);
    setStatusValue(row.status);
    setStatusComments(row.comments || "");
    const numericStr = row.rawFund !== undefined ? String(row.rawFund) : row.fund.replace(/[^0-9.]/g, "");
    setStatusFund(numericStr);
    setIsStatusOpen(true);
  }, [disabledPendingIds]);

  const handleOpenHistoryModal = useCallback(async (row) => {
    setHistoryRow(row);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const response = await getAllBillingHistory({
        billingId: row.id,
        advertiserId: row.advertiserId,
        userId: row.userId
      });
      if (response && response.data) {
        const historyData = response.data.data?.informationBillingHistory || response.data.informationBillingHistory || [];
        
        const filtered = historyData.filter(item => {
          const matchBilling = !item.billingId || String(item.billingId) === String(row.id);
          const matchAdvertiser = !item.advertiserId || String(item.advertiserId) === String(row.advertiserId);
          const matchUser = !item.userId || String(item.userId) === String(row.userId);
          return matchBilling && matchAdvertiser && matchUser;
        });

        const mapped = filtered.map((item) => {
          const formatVal = (val) => {
            return formatCurrency(val);
          };

          const formatDateTime = (dateStr) => {
            if (!dateStr || dateStr === "-") return "-";
            return dateStr.replace("T", " ").substring(0, 19);
          };

          return {
            campaignName: item.campaignName || item.campaign_name || "-",
            credit: formatVal(item.budgetCredit || item.budget_credit || item.credit || item.fund || "-"),
            debit: formatVal(item.budgetDebit || item.budget_debit || item.debit || "-"),
            creditedDate: formatDateTime(item.creditedDate || item.credited_date || item.createdAt || "-"),
            debitedDate: formatDateTime(item.debitedDate || item.debited_date || item.updatedAt || "-"),
            addedBy: item.addedBy || item.added_by || "Admin",
            approvedBy: item.approvedBy || item.approved_by || "-",
          };
        });
        setHistoryList(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch billing history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedRow) return;

    try {
      const parsedFund = parseFloat(statusFund);
      if (isNaN(parsedFund) || parsedFund <= 0) {
        alert("Please enter a valid fund amount");
        return;
      }

      // Update the fund amount using updateBilling API if it was changed
      const originalFund = selectedRow.rawFund !== undefined ? selectedRow.rawFund : parseFloat(selectedRow.fund.replace(/[^0-9.]/g, ""));
      if (parsedFund !== originalFund) {
        const fundRes = await updateBilling(selectedRow.id, { totalFund: parsedFund });
        if (!(fundRes && (fundRes.status === 200 || fundRes.data?.status === 200))) {
          alert("Failed to update fund amount: " + (fundRes?.data?.message || "Unknown error"));
          return;
        }
      }

      const payload = {
        billingHistoryId: selectedRow.id,
        status: statusValue.toLowerCase(),
        userId: Number(selectedRow.userId),
      };

      const response = await updateBillingStatus(payload);
      if (response && (response.status === 200 || response.status === 201 || response.data?.status === 200 || response.data?.status === 201)) {
        if (["approved", "rejected"].includes(statusValue.toLowerCase())) {
          lockPendingButton(selectedRow.id);
        }
        fetchBillings();
        setIsStatusOpen(false);
        setSelectedRow(null);
      } else {
        alert("Failed to update status: " + (response?.data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error updating billing status/fund:", err);
      alert("An error occurred while updating the billing.");
    }
  };

  const handleSaveAddFund = async (e) => {
    e.preventDefault();
    if (!selectedAgency) {
      alert("Please select an agency");
      return;
    }
    if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) {
      alert("Please enter a valid fund amount");
      return;
    }

    try {
      const parsedFund = parseFloat(fundAmount);
      
      const selectedAdv = agencyList.find(agency => {
        const value = typeof agency === "string" ? agency : (agency.userId || agency.id || "");
        return value === selectedAgency;
      });
      const agencyName = selectedAdv 
        ? (typeof selectedAdv === "string" ? selectedAdv : (selectedAdv.name || selectedAdv.firstName || selectedAdv.email || ""))
        : "";

      const payload = {
        name: agencyName,
        fundAdd: parsedFund,
        comments: addComments || "",
        userId: Number(selectedAgency),
      };

      const response = await createBilling(payload);
      if (response && (response.status === 200 || response.status === 201 || response.data?.status === 200 || response.data?.status === 201)) {
        setIsAddFundOpen(false);
        setSelectedAgency("");
        setFundAmount("");
        setAddComments("");
        fetchBillings();
      } else {
        alert("Failed to add fund: " + (response?.data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error creating billing:", err);
      alert("Error adding fund: " + (err.response?.data?.message || err.message || "Request failed"));
    }
  };

  const columns = useMemo(
    () => [
      {
        name: "SNo",
        selector: (row) => row.sno,
        sortable: true,
        width: "70px",
        cell: (row) => <span className="fw-semibold">{row.sno}</span>,
      },
      {
        name: "Advertiser Name",
        selector: (row) => row.userName,
        sortable: true,
        minWidth: "150px",
        grow: 1,
      },
      {
        name: "Campaign Name",
        selector: (row) => row.campaignName,
        sortable: true,
        minWidth: "150px",
        grow: 1,
      },
      {
        name: "Credited Fund",
        selector: (row) => row.fundAdd,
        sortable: true,
        width: "120px",
        cell: (row) => <span className="fw-semibold">{row.fundAdd}</span>,
      },
      {
        name: "Total Fund",
        selector: (row) => row.totalFund,
        sortable: true,
        width: "120px",
        cell: (row) => <span className="fw-semibold">{row.totalFund}</span>,
      },
      {
        name: "Debited Fund",
        selector: (row) => row.fundSub,
        sortable: true,
        width: "120px",
        cell: (row) => <span className="fw-semibold">{row.fundSub}</span>,
      },
      {
        name: "Available Fund",
        selector: (row) => row.availableFund,
        sortable: true,
        width: "130px",
        cell: (row) => <span className="fw-semibold text-success">{row.availableFund}</span>,
      },
      {
        name: "Status",
        selector: (row) => row.status,
        sortable: true,
        width: "135px",
        cell: (row) => (
          (canApproveFund && row.status.toLowerCase() === "pending") ? (() => {
            const isLocked = row.pendingLocked || disabledPendingIds.has(String(row.id));
            return (
            <button
              type="button"
              className="onoffbutton bh-status-pill bh-status-pill-button"
              disabled={isLocked}
              onClick={() => !isLocked && handleOpenStatusModal(row)}
            >
              {row.status}
              <i className="fa fa-caret-down bh-status-caret"></i>
            </button>
            );
          })() : (
            <span className={`bh-status-pill status-${row.status.toLowerCase()}`}>
              {row.status}
            </span>
          )
        ),
      },
      {
        name: "Approved By",
        selector: (row) => row.statusUpdatedBy,
        sortable: true,
        width: "160px",
      },
      {
        name: "Approved At",
        selector: (row) => row.approvedAt,
        sortable: true,
        width: "160px",
      },
    ],
    [
      handleOpenStatusModal,
      handleOpenHistoryModal,
      rows,
      canApproveFund,
      disabledPendingIds,
    ]
  );

  const customStyles = useMemo(
    () => ({
      table: {
        style: {
          backgroundColor: "#fff",
          minWidth: "1400px",
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
          height: "56px",
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
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      },
    }),
    []
  );
  const handleExportCSV = () => {
    if (!filteredRows || filteredRows.length === 0) {
      alert("No data to export");
      return;
    }
    const exportColumns = columns.filter(c => c.name !== 'Actions');
    const headers = exportColumns.map(c => c.name).join(",");
    const csvRows = filteredRows.map(row => {
      return exportColumns.map(col => {
        let val = col.selector ? col.selector(row) : "";
        if (val === undefined || val === null) val = "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",");
    });

    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `billing_history_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canViewUser) {
    return (
      <div className="alert alert-warning mt-3 bh-alert-warning">
        <i className="fa fa-exclamation-triangle me-2"></i>
        <strong>Access Denied:</strong> You do not have permission to view the Billing History.
      </div>
    );
  }

  return (
    <div className="campaign-daily-container">
        <div className="campaign-daily-header bh-header-borderless">
          <div>
            <div className="campaign-daily-title">
              <h2>Fund Management</h2>
            </div>
          </div>
        </div>

        <Card className="mb-3 bh-card-container">
          <CardBody className="py-3 bh-card-body">
            <div className="campaign-daily-controls bh-controls-row">
              <div className="bh-controls-left">
                <button
                  className="cdi-icon-btn bh-refresh-btn"
                  onClick={handleRefresh}
                >
                  <FontAwesomeIcon
                    icon={faSync}
                    className={loading ? "fa-spin bh-refresh-icon" : "bh-refresh-icon"}
                  />
                  Refresh
                </button>

                <div className="position-relative bh-search-wrapper">
                  <Input
                    className="form-control py-1 px-3 custom-select-input bh-search-input"
                    type="text"
                    id="searching"
                    placeholder="Search billing history..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>

              <div className="cdi-pagination-controls bh-pagination-controls-wrapper">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="cd-pagination-summary bh-pagination-summary">
                    {filteredRows.length
                      ? `${Math.min(currentPage * perPage, filteredRows.length)} of ${filteredRows.length} entries`
                      : "0 entries"}
                  </div>
                  <div className="cd-pagination-toolbar bh-pagination-toolbar">
                    {totalPages > 1 && (
                      <div className="cd-pagination-controls bh-pagination-nav-container">
                        <button
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          disabled={currentPage === 1}
                          className="cd-pagination-nav-btn bh-page-nav-btn"
                          type="button"
                        >
                          <FontAwesomeIcon icon={faChevronRight} className="bh-page-nav-icon-prev" />
                        </button>
                        <button
                          className="cd-pagination-page-btn is-active bh-page-btn-active"
                          type="button"
                        >
                          {currentPage}
                        </button>
                        <span className="bh-page-separator">of</span>
                        <button
                          className="cd-pagination-page-btn bh-page-btn-total"
                          type="button"
                        >
                          {totalPages}
                        </button>
                        <button
                          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                          disabled={currentPage >= totalPages}
                          className="cd-pagination-nav-btn bh-page-nav-btn"
                          type="button"
                        >
                          <FontAwesomeIcon icon={faChevronRight} className="bh-page-nav-icon-next" />
                        </button>
                      </div>
                    )}
                    <div className="bh-per-page-dropdown-container">
                      <CustomDropdown
                        options={perPageOptions}
                        value={perPage}
                        onChange={(val) => {
                          setPerPage(val);
                          setCurrentPage(1);
                        }}
                        className="bh-per-page-container"
                        triggerClassName="bh-per-page-trigger"
                        dropdownClassName="bh-per-page-dropdown"
                      />
                    </div>
                  </div>

                  <button
                    className="cdi-export-btn bh-export-btn"
                    onClick={handleExportCSV}
                  >
                    <FontAwesomeIcon icon={faDownload} className="bh-refresh-icon" />
                    EXPORT CSV
                  </button>
                  {canCreateFund && (
                    <button
                      className="cdi-export-btn bh-add-fund-btn"
                      onClick={() => setIsAddFundOpen(true)}
                    >
                      <FontAwesomeIcon icon={faPlus} className="bh-refresh-icon" />
                      ADD FUND
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="campaign-daily-table-wrapper">
          <div className="bh-table-wrapper">
            <div className="bh-table-inner">
              <DataTable
                className="data-table"
                columns={columns}
                data={paginatedData}
                customStyles={customStyles}
                dense
                fixedHeader
                fixedHeaderScrollHeight="100%"
                highlightOnHover
                noDataComponent={
                  <div className="nogroupdataavilable">
                    <div className="fw-bold text-secondary">
                      No billing history found
                    </div>
                  </div>
                }
                persistTableHead
                progressPending={loading}
              />
            </div>
          </div>
        </div>

        {/* Add Fund Modal */}
        <Modal isOpen={isAddFundOpen} toggle={() => setIsAddFundOpen(false)} centered>
          <ModalHeader toggle={() => setIsAddFundOpen(false)}>Add Fund</ModalHeader>
          <Form onSubmit={handleSaveAddFund}>
            <ModalBody>
              <FormGroup>
                <Label for="agencySelect">Advertiser</Label>
                <CustomDropdown
                  options={agencyOptions}
                  value={selectedAgency}
                  onChange={setSelectedAgency}
                  placeholder="Select Advertiser"
                />
              </FormGroup>
              <FormGroup>
                <Label for="fundAmountInput">Fund</Label>
                <Input
                  type="number"
                  name="fund"
                  id="fundAmountInput"
                  placeholder="Enter fund amount"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="commentsInput">Comments</Label>
                <Input
                  type="textarea"
                  name="comments"
                  id="commentsInput"
                  placeholder="Enter comments"
                  value={addComments}
                  onChange={(e) => setAddComments(e.target.value)}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter className="bh-modal-footer">
              <Button
                type="button"
                className="cancels"
                onClick={() => setIsAddFundOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="savebuttons"
              >
                Save
              </Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* Update Status Modal */}
        <Modal isOpen={isStatusOpen} toggle={() => setIsStatusOpen(false)} centered>
          <ModalHeader toggle={() => setIsStatusOpen(false)}>Update Status</ModalHeader>
          <Form onSubmit={handleSaveStatus}>
            <ModalBody>
              <FormGroup>
                <Label for="statusAgencyName">Advertiser Name</Label>
                <Input
                  type="text"
                  id="statusAgencyName"
                  value={selectedRow ? (selectedRow.userName || selectedRow.agencyName || "") : ""}
                  readOnly
                  disabled
                />
              </FormGroup>
              <FormGroup>
                <Label for="statusFundAmount">Fund</Label>
                <Input
                  type="number"
                  id="statusFundAmount"
                  value={statusFund}
                  readOnly
                  disabled
                />
              </FormGroup>
              <FormGroup>
                <Label for="statusCommentsInput">Comments</Label>
                <Input
                  type="textarea"
                  id="statusCommentsInput"
                  value={statusComments}
                  onChange={(e) => setStatusComments(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label for="statusSelect">Status</Label>
                <CustomDropdown
                  options={[
                    { label: "Approved", value: "Approved" },
                    { label: "Rejected", value: "Rejected" },
                  ]}
                  value={statusValue}
                  onChange={setStatusValue}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter className="bh-modal-footer">
              <Button
                type="button"
                className="cancels"
                onClick={() => setIsStatusOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="savebuttons"
              >
                Save
              </Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* Billing History/Details Modal */}
        <Modal isOpen={isHistoryOpen} toggle={() => setIsHistoryOpen(false)} centered size="lg">
          <ModalHeader toggle={() => setIsHistoryOpen(false)}>
            <i className="fa fa-info-circle me-2 text-primary"></i>
            Billing Record Details
          </ModalHeader>
          <ModalBody className="bh-history-modal-body">
            {historyLoading ? (
              <div className="text-center py-5">
                <i className="fa fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                <div className="text-muted font-weight-bold bh-history-fetching-text">
                  Fetching billing history details...
                </div>
              </div>
            ) : historyRow && (
              <div className="table-responsive bh-history-table-wrapper">
                <Table hover striped className="bh-history-table">
                  <thead>
                    <tr className="bh-history-thead-tr">
                      <th className="bh-history-th">S.No</th>
                      <th className="bh-history-th">Campaign Name</th>
                      <th className="bh-history-th">Budget Credit</th>
                      <th className="bh-history-th">Budget Debit</th>
                      <th className="bh-history-th">Credited Date</th>
                      <th className="bh-history-th">Debited Date</th>
                      <th className="bh-history-th">Added By</th>
                      <th className="bh-history-th">Approved By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList && historyList.length > 0 ? (
                      historyList.map((item, idx) => (
                        <tr key={idx} className="bh-history-tbody-tr">
                          <td className="bh-history-td">{idx + 1}</td>
                          <td className="bh-history-td">{item.campaignName}</td>
                          <td className={`bh-history-td ${item.credit !== "-" ? "bh-history-td-credit" : "bh-history-td-credit-dash"}`}>
                            {item.credit}
                          </td>
                          <td className={`bh-history-td ${item.debit !== "-" ? "bh-history-td-debit" : "bh-history-td-debit-dash"}`}>
                            {item.debit}
                          </td>
                          <td className="bh-history-td">{item.creditedDate}</td>
                          <td className="bh-history-td">{item.debitedDate}</td>
                          <td className="bh-history-td">
                            <span className="bh-badge-addedby">
                              {item.addedBy}
                            </span>
                          </td>
                          <td className="bh-history-td">
                            {item.approvedBy !== "-" && item.approvedBy !== "Pending Approval" ? (
                              <span className="bh-badge-approvedby">
                                {item.approvedBy}
                              </span>
                            ) : (
                              <span>{item.approvedBy}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="bh-no-history-td">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="bh-modal-footer">
            <Button
              type="button"
              className="cancels"
              onClick={() => setIsHistoryOpen(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </div>
  );
};

export default BillingHistory;
