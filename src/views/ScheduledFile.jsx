import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import AddonModal from "./Modal/AddonModal";
import { FaCaretDown, FaCog } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { getAllAddons,editAddon } from "../views/api/Api";
var undef;
const getStatusText = (code) => {
  const statusMap = {
    1: "On",
    2: "Off",
    3: "Archived",
    "1": "On",
    "2": "Off",
    "3": "Archived"
  };
  return statusMap[code] || code;
};



const ScheduledFile = (props) => {
  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };

  const vx = useViewContext();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const toggleaddonModal = () => setAddonModalOpen(!addonModalOpen);
  const [selectedAddons, setSelectedAddons] = useState(null);
  const [rowData, setRowData] = useState([]);
  useEffect(() => {
    if (vx.loggedIn) loadDataOnce();
  }, []);

  const redraw = () => {
    setCount(count + 1);
  };
  const refresh = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
       // fetchAddonsList();
        redraw();
      } catch (error) {
        console.error("Error refreshing data:", error);
      } finally {
        setLoading(false);
      }
    }, 900);
  };

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState([]);

const editaddons = async (id) => {
  console.log("Editing addon ID:", id);
  try {
    const response = await editAddon(id);
    console.log("Full API Response for edit:", response.data);
    
    let addonsData;
    if (response.data?.data?.addonsList) {
      addonsData = response.data.data.addonsList[0];
    } else if (response.data?.addonsList) {
      addonsData = response.data.addonsList[0];
    } else if (response.data?.data) {
      addonsData = response.data.data;
    } else {
      addonsData = response.data;
    }
  
    console.log("Extracted addon data:", addonsData);
    
    if (addonsData) {
      const formattedAddons = {
        id: addonsData.addonsId || addonsData.id || id,
        addonsId: addonsData.addonsId || addonsData.id || id,
        name: addonsData.name || "Unnamed Addon",
        serviceProvider: addonsData.serviceProvider || "",
        addOnAmount: addonsData.addOnAmount || addonsData.addOnAmount || "0",
        addOnType: addonsData.addOnType || addonsData.addontype || "CPM", // Fixed field name
        ...addonsData
      };
      
      console.log("Setting addon to modal:", formattedAddons);
      setSelectedAddons(formattedAddons);
      setTimeout(() => {
        setAddonModalOpen(true);
      }, 50);
    } else {
      alert("No addon data found");
    }
  } catch (err) {
    console.error("Error fetching addon:", err);
    alert(`Error: ${err.message}`);
  }
};
  const [modal, setModal] = useState(false);
  const [id, setId] = useState(0);
  const modalCallback = (doit) => {
    if (doit) {
      deleteAudience(id);
    }
    setModal(!modal);
  };

  const showModal = (e, x) => {
    if (e.ctrlKey) {
      deleteAudience(x);
      return;
    }
    setId(x);
    setModal(true);
  };

  const deleteAudience = async (id, key) => {
    await vx.deleteAudience(id, key);
    await vx.getDbAudience();
    setCreative(null);
    redraw();
  };

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading && rowData.length > 0) {
      setSelectedIds([rowData[0].id]);
    }
  }, [loading, rowData]);

  const fetchAddonsList = async () => {
    setLoading(true);
    try {
      const res = await getAllAddons();
      const list = res?.data?.data?.addonsList || [];
      console.log("API Response:", list);
      const formatted = list.map((item) => ({
        id: item.addonsId || item.id || item.addonsId,
        addonsId: item.addonsId || item.addonsId || item.addonsId,
        name: item.name || item.name || "Unnamed Audience",
        serviceProvider: item.serviceProvider || item.serviceProvider || "",
        addOnAmount: item.addOnAmount || item.addOnAmount || "0",
        addontype: item.addontype || item.addontype || "CPM",
        originalData: item
      }));

      console.log("Formatted data:", formatted);
      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching exchanges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    //fetchAddonsList();
  }, []);

  const CustomLoader = () => (
    <div className="customloader" >
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const NoDataComponent = () => (
    <div
      className="nodataavilable"
    >
      <div className="py-4 fw-bold text-secondary">
        {"No data available"}
      </div>
    </div>
  );

 const customStyles = {
  table: {
      style: {
      backgroundColor: "#fff",
      minWidth: "1500px",
    },
  },
  headRow: {
    style: {
      minHeight: "56px",
      backgroundColor: "#eef4fa",
      borderBottom: "1px solid #dfe7f1",
      height: "57px",
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

  const IDCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.addonsId}
      </div>
    );
  };

  const NameCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.name}
      </div>
    );
  };

  const AddonCell = ({ row }) => {
    const formatCurrency = (value) => {
      const numValue = typeof value === 'number'
        ? value
        : parseFloat(String(value).replace(/[$,]/g, '')) || 0;

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numValue);
    };

    return (
      <div className="gOorhn">
        {formatCurrency(row.addOnAmount)}
      </div>
    );
  };

  const ServiceCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.serviceProvider}
      </div>
    );
  };

  const AddTypeCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.addontype}
      </div>
    );
  };

  const columns = [
    {
      name: "Name",
      cell: (row) => <AudienceActionsCell row={row} />,
      grow: 1,
      width: "100px",
    },

    {
      name: "Status",
      selector: (row) => row.addonsId,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      width: "162px",
    },
    {
      name: "Generated",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 3,
       width: "262px",
    },
    {
      name: "Expires",
      selector: (row) => row.serviceProvider,
      cell: (row) => <ServiceCell row={row} />,
      sortable: true,
      grow: 4,
     
    },
   

  ];

  const conditionalRowStyles = [
     {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: '#FBEDEF !important',
        '& .gOorhn': {
          color: 'black !important',
        }
      },
    },
  ];

  const handleRowClicked = (row) => {
    setSelectedIds([row.id]);
  };

  const filteredData = useMemo(() => {
    return rowData.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rowData, searchTerm]);

  const AudienceActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);

    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="settings">
          <FaCog style={{ marginRight: "5px" }} />
          <FaCaretDown />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={() => editaddons(row.id)}>
            Edit List
          </DropdownItem>
          <DropdownItem onClick={(e) => showModal(e, row.id)}>
            Delete List
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddonsSave = (savedAudience) => {
    console.log("Audience saved:", savedAudience);
    setAddonModalOpen(false);
    setSelectedAddons(null);
    setLoading(true);
    setTimeout(() => {
      fetchAddonsList();
    }, 800);
  };

  return (
    <>
      <div style={{  backgroundColor: "rgb(248, 250, 252)", fontFamily: "Inter, sans-serif" }}>
        <div className="campaign-daily-content">
          {modal && (
            <DecisionModal
              title="Really delete Audience?"
              message="Only the db admin can undo this if you delete it!!!"
              name="DELETE"
              callback={modalCallback}
            />
          )}

            <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
              <CardBody className="py-3" style={{ overflow: "visible" }}>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div
                      className="cd-date-range-wrapper"
                      style={{
                        position: "relative",
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        width: "max-content",
                      }}
                    >
                <input
                  type="text"
                  placeholder="Search"
                  className="input-search-box"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px", width: "200px" }}
                />
              </div>

              <button className="cdi-refresh-btn" onClick={refresh} title="Refresh Data" style={{ padding: "6px 12px", border: "1px solid #e2e8f0", backgroundColor: "#fff", borderRadius: "4px", cursor: "pointer" }}>
                <i className={"fa fa-repeat " + (loading ? "fa-spin" : "")}></i>
              </button>
            </div>
          </div>
          </CardBody>
          </Card>

          <AddonModal
            isOpen={addonModalOpen}
            toggle={toggleaddonModal}
            audience={selectedAddons}
            callback={handleAddonsSave}
          />
          <div className="campaign-daily-table-wrapper">
            <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "hidden" }}>
              <div style={{ minWidth: "1600px" }}>
                <DataTable
                  keyField="id"
                  className="data-table"
                  columns={columns}
                  data={filteredData}
                  customStyles={customStyles}
                  striped
                  dense
                  highlightOnHover
                  pointerOnHover
                  persistTableHead
                  fixedHeader
                  fixedHeaderScrollHeight="80vh"
                  responsive={false}
                  conditionalRowStyles={conditionalRowStyles}
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
        </div>
      </div>
    </>
  );
};

export default ScheduledFile;
