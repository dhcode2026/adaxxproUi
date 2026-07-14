import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle, } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Row,
  Col,
  Input,
  Label,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { FaCaretDown, FaCaretRight, FaCaretUp, FaCog } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { useViewContext } from "../../ViewContext";
import DomainModal from "../Modal/DomainModal";
import AddSetListModal from "../Modal/AddSetListModal"
import { getAllDomainlist, editDomain } from "../../views/api/Api";
import AddSetModal from "../Modal/AddSetModal";
import Swal from "sweetalert2";

const SelectDomain = forwardRef(({ isOpen, toggle, domainlist, data }, ref) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [count, setCount] = useState(0);
  const [creative, setCreative] = useState(null);
  const [id, setId] = useState(0);
  const [type, setType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState(false);
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const toggledomaintModal = () => setDomainModalOpen(!domainModalOpen);
  const vx = useViewContext();
  const [rowData, setRowData] = useState([]);
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [addsetlistModalOpen, setAddsetlistModalOpen] = useState(false);
  const toggleaddsetlistModal = () => setAddsetlistModalOpen(!addsetlistModalOpen);
  const [addsetModalOpen, setAddsetModalOpen] = useState(false);
  const toggleaddsetModal = () => setAddsetModalOpen(!addsetModalOpen);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [seleteddomaindata, setseleteddomaindata] = useState([]);
  useImperativeHandle(ref, () => ({
    updateValue(deleted) {
      console.log(deleted);
      let remainingrows = seleteddomaindata.filter(row => row.id != deleted.id);
      console.log("remainingrows", remainingrows)
      setSelectedIds(remainingrows.map(item => item.id))
      setseleteddomaindata(remainingrows);
    }
  }));


  const showValidationError = async () => {
    await Swal.fire({
      html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
               style="width: 18px; height: 18px;" />
          <span style="font-size:16px; font-weight:bold;">Error</span>
        </div>
        <div style="margin-top: 10px; font-size:13px; text-align:center;">
         Please select at least one domain list
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      width: 268,
      padding: 0,
      customClass: {
        popup: "swal2-custom-size",
        confirmButton: "swal2-small-btn",
      },
    });
  };

  const handleAddSetListClick = () => {
    if (selectedIds.length === 0) {
      showValidationError();
      return;
    }
    toggleaddsetlistModal();
  };

  const handleSaveAsNewSetClick = () => {
    if (selectedIds.length === 0) {
      showValidationError();
      return;
    }
    toggleaddsetModal();
  };

  const handleDoneClick = () => {
    if (selectedIds.length === 0) {
      showValidationError();
      return;
    }
    toggle();
    console.log(seleteddomaindata)
    domainlist(seleteddomaindata)
  };

  const handleHeaderClick = (index) => {
    setSelectedHeader(index);
  };

  const filteredData = useMemo(() => {
    return rowData.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  }, [rowData, searchTerm]);

  const isAllFilteredSelected = useMemo(() => {
    console.log("seletedid", selectedIds)
    if (filteredData.length === 0) return false;
    return filteredData.every(item => selectedIds.includes(item.id));
  }, [filteredData, selectedIds]);

  const redraw = () => {
    setCount(count + 1);
  };

  const deleteInventory = async (id, key) => {
    await vx.deleteInventory(id, key);
    await vx.getDbInventory();
    setCreative(null);
    redraw();
  };


  const showModal = (e, x, y) => {
    if (e.ctrlKey) {
      deleteInventory(x, y);
      return;
    }
    setId(x);
    setType(y);
    setModal(true);
  };

  const handleCheckboxChange = (id, checked, itemData) => {
    setSelectedIds(prev => {
      const isAlreadySelected = prev.includes(id);
      const shouldBeSelected = checked !== undefined ? checked : !isAlreadySelected;
      
      if (shouldBeSelected) {
        return isAlreadySelected ? prev : [...prev, id];
      } else {
        return prev.filter(itemId => itemId !== id);
      }
    });

    setseleteddomaindata(prev => {
      const isAlreadySelected = prev.some(item => item.id === id);
      const shouldBeSelected = checked !== undefined ? checked : !isAlreadySelected;

      if (shouldBeSelected) {
        if (isAlreadySelected) return prev;
        const newItem = itemData || rowData.find(item => item.id === id);
        return newItem ? [...prev, newItem] : prev;
      } else {
        return prev.filter(item => item.id !== id);
      }
    });
  };

  const handleSelectAllChange = () => {
    const filteredIds = filteredData.map(item => item.id);

    if (isAllFilteredSelected) {
      // 🔴 UNSELECT ALL (visible rows)

      const newSelectedIds = selectedIds.filter(
        id => !filteredIds.includes(id)
      );

      setSelectedIds(newSelectedIds);

      const selectedRows = rowData.filter(item =>
        newSelectedIds.includes(item.id)
      );

      setseleteddomaindata(selectedRows);

    } else {
      // 🟢 SELECT ALL (visible rows)

      const newSelectedIds = [...selectedIds];

      filteredIds.forEach(id => {
        if (!newSelectedIds.includes(id)) {
          newSelectedIds.push(id);
        }
      });

      setSelectedIds(newSelectedIds);

      const selectedRows = rowData.filter(item =>
        newSelectedIds.includes(item.id)
      );

      setseleteddomaindata(selectedRows);
    }
  };




  const handleRefresh = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        fetchDomainList();
        redraw();
      } catch (error) {
        console.error("Error refreshing data:", error);
      } finally {
        setLoading(false);
      }
    }, 900);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const DomainActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);

    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="settings">
          <FaCog style={{ marginRight: "5px" }} />
          <FaCaretDown />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={() => editdomain(row.id)}>
            Edit Domain List
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  const customStyles = {
    table: {
      style: {
        backgroundColor: '#f8f9fa',
        height: '100%',
      },
    },
    headRow: {
      style: {},
    },
    headCells: {
      style: {
        borderRight: '1px solid #d4d4d4',
        borderTop: '1px solid #d4d4d4',
        '&:first-of-type': {
          paddingLeft: '16px',
        },
        '&:last-of-type': {
          borderRight: 'none',
        },
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        '&:first-of-type': {
          paddingLeft: '16px',
        },
      },
    },
    rows: {
      style: {},
    },
  };

  const NameCell = ({ row }) => {
    const isSelected = selectedIds.includes(row.id);
    return (
      <div
        className="gOorhn"
        style={isSelected ? {
          color: 'white !important',
          backgroundColor: 'transparent'
        } : {}}
      >
        {row.name}
      </div>
    );
  };

  const IDCell = ({ row }) => {
    const isSelected = selectedIds.includes(row.id);
    return (
      <div
        className="gOorhn"
        style={isSelected ? {
          color: 'white !important',
          backgroundColor: 'transparent'
        } : {}}
      >
        {row.domainListId}
      </div>
    );
  };

  const ListtypeCell = ({ row }) => {
    const isSelected = selectedIds.includes(row.id);
    return (
      <div
        className="gOorhn"
        style={isSelected ? {
          color: 'white !important',
          backgroundColor: 'transparent'
        } : {}}
      >
        {row.listType}
      </div>
    );
  };


  const DomainCell = ({ row }) => {
    const isSelected = selectedIds.includes(row.id);
    return (
      <div
        className="gOorhn"
        style={isSelected ? {
          color: 'white !important',
          backgroundColor: 'transparent'
        } : {}}
      >
        {row.domainListCount}
      </div>
    );
  };

  const columns = [
    {
      name: (
        <Input
          type="checkbox"
          checked={isAllFilteredSelected}
          onChange={handleSelectAllChange}
          disabled={filteredData.length === 0}
        />
      ),
      cell: (row) => {
        return (
          <Input
            type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={(e) => {
              e.stopPropagation();
              handleCheckboxChange(row.id, e.target.checked);
            }}
          />
        );
      },
      width: "50px",
    },
    {
      name: "Actions",
      cell: (row) => <DomainActionsCell row={row} />,
      grow: 1,
      width: "100px",
    },
    {
      name: "ID",
      selector: (row) => row.domainListId,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      width: "62px",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 2,
    },

    {
      name: "List Type",
      selector: (row) => row.listType,
      cell: (row) => <ListtypeCell row={row} />,
      sortable: true,
      grow: 1,
    },
    {
      name: "URL Count",
      selector: (row) => row.domainListCount,
      cell: (row) => <DomainCell row={row} />,
      sortable: true,
      grow: 1,
    },
  ];

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: '#62903e !important',
        '& .gOorhn': {
          color: 'white !important',
        }
      },
    },
  ];

  const fetchDomainList = async () => {
    setLoading(true);
    try {
      const res = await getAllDomainlist();
      const list = res?.data?.data?.informationDomainList || [];
      const formatted = list.map((item) => ({
        id: item.domainListId || item.id || item.domainListId,
        domainListId: item.domainListId || item.domainListId || item.domainListId,
        name: item.name || item.name || "Unnamed Domain",
        listType: item.listType || item.listType,
        domainListCount: item.domainListCount || item.domainListCount,
        domains: item.domains || [],
        // originalData: item,
        checked: false
      }));

      setRowData(formatted);
      return formatted;
    } catch (err) {
      console.error("Error fetching exchanges:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDomainList();
    }
  }, [isOpen]);

  const editdomain = async (id) => {
    console.log("Editing Domain ID:", id);
    try {
      const response = await editDomain(id);
      console.log("Full API Response for edit:", response.data);

      let domainData;
      if (response.data?.data?.informationDomainList) {
        domainData = response.data.data.informationDomainList[0];
      } else if (response.data?.informationDomainList) {
        domainData = response.data.informationDomainList[0];
      } else if (response.data?.data) {
        domainData = response.data.data;
      } else {
        domainData = response.data;
      }

      console.log("Extracted domain data:", domainData);

      if (domainData) {
        // Map API response to modal form data
        const formattedDomain = {
          id: domainData.domainListId || domainData.id || id,
          name: domainData.name || "Unnamed Domain List",
          list_type: domainData.listType === "ALLOWLIST" || domainData.listType === "allowlist" ? "allowlist" : "blocklist",
          // Convert domains array to newline-separated string
          domain_name: Array.isArray(domainData.domains)
            ? domainData.domains.join('\n')
            : (domainData.domains || ""),
          domainListCount: domainData.domainListCount || 0,
          ...domainData
        };

        console.log("Setting domain to modal:", formattedDomain);
        setSelectedDomain(formattedDomain);
        setTimeout(() => {
          setDomainModalOpen(true);
        }, 50);
      } else {
        alert("No domain data found");
      }
    } catch (err) {
      console.error("Error fetching domain:", err);
      alert(`Error: ${err.message}`);
    }
  };

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

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      size="lg"
      centered
      className="selectdomain"
    >
      <div className="modal-header border-bottom editable">
        <h5 className="modal-title mb-0 headingtittle">
          Select Domain Lists
        </h5>
        <Button close onClick={toggle} />
      </div>

      <ModalBody
        className="p-0"
      >
        <Row className="linkads">
          <Col xs="12" className="h-100 d-flex flex-column">
            <Row className="align-items-center mt-2 mb-2 sltgt">
              <Col md="2" sm="6" className="p-0 ms-2 " id="maximing">
                <div className="position-relative ms-2">
                  <Input
                    className="form-control py-1 px-1  rounded-0 adsheight custom-select-input"
                    type="text"
                    id="seaching"
                    style={{ fontSize: "0.685rem" }}
                    placeholder="search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />

                </div>
              </Col>
              <Col xs="auto" className="ms-2">
                <button
                  type="button"
                  className="form-control py-1 px-2  rounded-0 d-flex align-items-center justify-content-center"
                  style={{ height: "26px", fontSize: "11px" }}
                  id="refresh"
                  onClick={handleRefresh}
                >
                  <i className="fa fa-repeat me-1"></i>
                  Refresh
                </button>
              </Col>

              <Col xs="auto" className="ms-2">
                <div className="position-relative">
                  <button
                    type="button"
                    className="form-control py-1 px-2 rounded-0"
                    id="newaudience"
                    onClick={toggleaddsetlistModal}
                  >
                    <span className="linkto">Ad Set</span>
                  </button>
                </div>
              </Col>

              <Col xs="auto" className="ms-2">
                <button
                  type="button"
                  className="form-control py-1 px-2  rounded-0 d-flex align-items-center justify-content-center"
                  style={{ height: "26px", fontSize: "11px" }}
                  id="refresh"
                  onClick={handleSaveAsNewSetClick}>
                  Save as New set
                </button>
              </Col>
              <Col md="2"></Col>
              <Col md="3" className="sltdomain" >
                <Label className="zerodomainlist">{selectedIds.length} Domain Lists Selected</Label>
              </Col>
              <Col xs="auto">
                <div className="position-relative">
                  <button
                    type="button"
                    className="form-control py-1 px-2 rounded-0"
                    onClick={toggledomaintModal}
                    id="newaudience">
                    <span className="linkto">New Domain List</span>
                  </button>
                </div>
              </Col>
            </Row>

            <DomainModal
              isOpen={domainModalOpen}
              toggle={toggledomaintModal}
              inventory={selectedInventory}
              callback={async (updated) => {
                const refreshedData = await fetchDomainList();
                if (updated) {
                  let newId = updated.data?.informationDomainList?.[0]?.domainListId 
                            || updated.informationDomainList?.[0]?.domainListId
                            || updated.id;
                  
                  if (newId) {
                    const newItem = refreshedData.find(d => d.id == newId);
                    handleCheckboxChange(newId, true, newItem);
                  }
                }
              }}
            />

            <AddSetListModal
              isOpen={addsetlistModalOpen}
              toggle={toggleaddsetlistModal}
              inventory={selectedInventory}
              callback={(updated) =>
                console.log("Modal callback:", updated)
              }
            />
            <AddSetModal
              isOpen={addsetModalOpen}
              toggle={toggleaddsetModal}
              inventory={selectedInventory}
              callback={(updated) =>
                console.log("Modal callback:", updated)
              }
            />


            <div
              className="flex-grow-1 position-relative"
              style={{
                height: 'calc(100% - 60px)',
                minHeight: '250px'
              }}
            >
              <DataTable
                columns={columns}
                data={filteredData}
                progressPending={loading}
                progressComponent={<CustomLoader />}
                striped
                dense
                fixedHeader
                fixedHeaderScrollHeight="100%"
                highlightOnHover
                persistTableHead
                conditionalRowStyles={conditionalRowStyles}
                customStyles={customStyles}
                noDataComponent={<NoDataComponent />}
                onRowClicked={(row) => {
                  handleCheckboxChange(row.id);
                }}
              />
            </div>
          </Col>
        </Row>
      </ModalBody>
      <ModalFooter className="wizard-footer">
        <Button className="cancels" onClick={toggle}>
          Cancel
        </Button>
        <Button className="savebuttons" onClick={handleDoneClick}>
          Done
        </Button>
      </ModalFooter>
    </Modal>
  );
});

export default SelectDomain;