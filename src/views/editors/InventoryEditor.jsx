import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button, Row, Col, Input, Label } from "reactstrap";
import { FaCaretDown } from "react-icons/fa";
import InventoryModal from "../Modal/InventoryModal.jsx";
import SelectDomain from "../Modal/SelectDomain.jsx";
import DataTable from "react-data-table-component";
import { IoMdClose } from "react-icons/io";
import { publisherinventorylist } from "../../views/api/Api.jsx";

const InventoryEditor = forwardRef((props, ref) => {
  const { initialData, onInventoryChange } = props;

  useImperativeHandle(ref, () => ({
    inventorydata() {
      return formData;
    },
  }));
  const childRef = useRef();
  const updateChild = (data) => {
    childRef.current.updateValue(data);
  };

  const toggleLocationModal = () => setLocationModalOpen(!locationModalOpen);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rowData, setRowData] = useState(() => {
    if (initialData?.data && Array.isArray(initialData.data)) {
      return initialData.data.map((item, index) => ({
        ...item,
        id: item.id || (item.domainappid ? `${item.domainappid}_${index}` : index.toString()),
      }));
    }
    return [];
  });
  const [selectdomainOpen, setselectdomainOpen] = useState(false);
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        data: initialData.data || [],
        domain: initialData.domain || [],
        exclude_ads_txt: initialData.exclude_ads_txt || false,
        target_direct: initialData.target_direct || false,
        opt_supply: initialData.opt_supply || false,
        opt_made: initialData.opt_made || false,
      };
    }
    return {};
  });

  useEffect(() => {
    if (!initialData) return;

    console.log("SYNCING DATA:", initialData);

    setFormData((prev) => ({
      ...prev,
      data: initialData.data || [],
      domain: initialData.domain || [],
      exclude_ads_txt: initialData.exclude_ads_txt ?? false,
      target_direct: initialData.target_direct ?? false,
      opt_supply: initialData.opt_supply ?? false,
      opt_made: initialData.opt_made ?? false,
    }));

    if (initialData.data) {
      const mapped = initialData.data.map((item, index) => ({
        ...item,
        id: item.id || (item.domainappid ? `${item.domainappid}_${index}` : index.toString()),
      }));
      setRowData(mapped);
    }

    if (initialData.domain) {
      const mapped = initialData.domain.map((item, index) => ({
        ...item,
        id: item.domainListId || item.id || index.toString(),
      }));
      setdomainlistdata(mapped);
    }
  }, [JSON.stringify(initialData)]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [domainlistdata, setdomainlistdata] = useState(() => {
    if (initialData?.domain && Array.isArray(initialData.domain)) {
      return initialData.domain.map((item, index) => ({
        ...item,
        id: item.domainListId || item.id || index.toString(),
      }));
    }
    return [];
  });
  const [openoptions, setopenoptions] = useState(false);

  useEffect(() => {
    if (onInventoryChange) {
      onInventoryChange(formData);
    }
  }, [formData]);

  const [selectedoption, setselectedoption] = useState();
  const [staticoptions, setstaticoptions] = useState([
    { name: " All Excluding legacy targeting" },
    { name: " Only legacy targeting" },
    { name: " All" },
    { name: "Online" },
  ]);
  const toggleSelectDomain = () => {
    setselectdomainOpen(!selectdomainOpen);
  };
  const handledomainlist = (data) => {
    console.log(data);
    setdomainlistdata(data);
    setFormData((prev) => ({
      ...prev,
      domain: data,
    }));
  };
  const handleRemoveRow = (id) => {
    setRowData((prev) => {
      const updatedRowData = prev.filter((row) => row.id !== id);
      setFormData((prevForm) => {
        const updatedData = (prevForm.data || []).filter((item, index) => {
          const itemId = item.id || (item.domainappid ? `${item.domainappid}_${index}` : index.toString());
          return itemId !== id;
        });
        return {
          ...prevForm,
          data: updatedData,
        };
      });
      return updatedRowData;
    });
    setSelectedIds((prev) => prev.filter((selId) => selId !== id));
  };

  const handleCheckboxChange = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredData.map((row) => row.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleRemoveSelected = () => {
    setRowData((prev) => {
      const updatedRowData = prev.filter((row) => !selectedIds.includes(row.id));
      setFormData((prevForm) => {
        const updatedData = (prevForm.data || []).filter((item, index) => {
          const itemId = item.id || (item.domainappid ? `${item.domainappid}_${index}` : index.toString());
          return !selectedIds.includes(itemId);
        });
        return {
          ...prevForm,
          data: updatedData,
        };
      });
      return updatedRowData;
    });
    setSelectedIds([]);
  };

  const filteredData = useMemo(() => {
    return rowData.filter((item) => {
      const nameToSearch = item.domainappname || item.name || "";
      return nameToSearch.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [rowData, searchTerm]);

  const customStyles = {
    table: {
      style: {
        backgroundColor: "#f8f9fa",
        height: "100%",
      },
    },
    headRow: {
      style: {
        fontSize: "10px",
        color: "rgb(116, 116, 116)",
        fontWeight: "600",
        border: "1px solid #d4d4d4",
      },
    },
    headCells: {
      style: {
        borderRight: "1px solid #d4d4d4",

        "&:first-of-type": {
          paddingLeft: "16px",
        },
        "&:last-of-type": {
          borderRight: "none",
        },
      },
    },
    cells: {
      style: {
        paddingLeft: "8px",
        paddingRight: "8px",
        fontSize: "11px",
        fontWeight: "600",
        color: "gb(48, 48, 48)",
        "&:first-of-type": {
          paddingLeft: "16px",
        },
      },
    },
    rows: {
      style: {},
    },
  };

  const columns = [
    {
      name: (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            width: "15px",
            height: "15px",
            border:
              filteredData.length > 0 &&
              selectedIds.length === filteredData.length
                ? "1px solid #e53e3e"
                : "1px solid #d4d4d4",
            backgroundColor:
              filteredData.length > 0 &&
              selectedIds.length === filteredData.length
                ? "#e53e3e"
                : "white",
            borderRadius: "3px",
            cursor: "pointer",
          }}
          onClick={() =>
            handleSelectAll(
              !(
                filteredData.length > 0 &&
                selectedIds.length === filteredData.length
              ),
            )
          }
        >
          {filteredData.length > 0 &&
            selectedIds.length === filteredData.length && (
              <i
                className="fa fa-check text-white"
                style={{ fontSize: "9px" }}
              />
            )}
        </div>
      ),
      cell: (row) => {
        const isChecked = selectedIds.includes(row.id);
        return (
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "15px",
              height: "15px",
              border: isChecked ? "1px solid #e53e3e" : "1px solid #ccc",
              backgroundColor: isChecked ? "#e53e3e" : "white",
              borderRadius: "3px",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleCheckboxChange(row.id, !isChecked);
            }}
          >
            {isChecked && (
              <i
                className="fa fa-check text-white"
                style={{ fontSize: "9px" }}
              />
            )}
          </div>
        );
      },
      width: "45px",
    },
    {
      name: "Actions",
      sortable: false,
      grow: 1,
      cell: (row) => {
        const isSelected = selectedIds.includes(row.id);
        return (
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              padding: "2px 6px",
              border: isSelected
                ? "1px solid rgba(255,255,255,0.3)"
                : "1px solid #ccc",
              borderRadius: "3px",
              background: isSelected ? "rgba(255,255,255,0.2)" : "#e9ecef",
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            <i
              className={`fa fa-cog `}
              style={{ fontSize: "13px", color: isSelected ? "#6c7291" : "#6c757d" }}
            ></i>
            <FaCaretDown
              className={`ms-1 `}
              style={{ fontSize: "11px", color: isSelected ? "#6c7291" : "#6c757d" }}
            />
          </div>
        );
      },
    },
    {
      name: "Domain/App Name",
      sortable: true,
      grow: 3,
      minWidth: "150px",
      selector: (row) => row.domainappname,
      cell: (row) => <div className="fw-bold">{row.domainappname}</div>,
    },
    {
      name: "Domain/App ID",
      sortable: true,
      grow: 3,
      minWidth: "150px",
      selector: (row) => row.domainappid,
      cell: (row) => <div className="fw-bold">{row.domainappid}</div>,
    },
    {
      name: "App Store Name",
      sortable: true,
      grow: 2,
      selector: (row) => row.appstorename,
    },
    {
      name: "Exchanges",
      sortable: true,
      grow: 3,
      selector: (row) =>
        Array.isArray(row.exchanges) ? row.exchanges.join(", ") : row.exchanges,
      cell: (row) => (
        <div className="fw-bold">
          {Array.isArray(row.exchanges)
            ? row.exchanges.join(", ")
            : row.exchanges}
        </div>
      ),
    },
    {
      name: "Status",
      sortable: false,
      grow: 1,
      cell: (row) => {
        const isSelected = selectedIds.includes(row.id);
        return (
          <div
            className="d-flex align-items-center fw-bold"
            style={{ cursor: "pointer" }}
          >
            On <FaCaretDown className={`ms-1`} style={{ fontSize: "11px" }} />
          </div>
        );
      },
    },
    {
      name: "CPM Bid Range",
      sortable: true,
      grow: 2,
      selector: (row) => row.cpmbidrange,
      cell: (row) => <div>{row.cpmbidrange || "-"}</div>,
    },
    {
      name: "",
      width: "50px",
      cell: (row) => (
        <div
          className="d-flex align-items-center justify-content-center bg-white"
          style={{
            width: "20px",
            height: "20px",
            border: "1px solid #ccc",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
          onClick={() => handleRemoveRow(row.id)}
        >
          <span className="close-x">×</span>
        </div>
      ),
    },
  ];

  const domiancolumns = [
    {
      name: "Name",
      sortable: true,
      grow: 1,
      width: "150px",
      selector: (row) => row.name,
    },
    {
      name: "Type",
      sortable: true,
      grow: 10,
      selector: (row) => row.listType,
    },
    {
      name: "",
      grow: 1,
      selector: (row) => (
        <span>
          <IoMdClose
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              setdomainlistdata((exi_item) => {
                const updatedList = exi_item.filter((item) => item.id !== row.id);
                setFormData((prevForm) => ({
                  ...prevForm,
                  domain: updatedList,
                }));
                return updatedList;
              });
              updateChild(row);
            }}
          />
        </span>
      ),
    },
  ];

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: "#faebed !important",
        color: "black !important",
        "& .gOorhn, & div:not(.bg-white), & span": {
          color: "black !important",
        },
        "& .close-x": {
          color: "#333 !important",
        },
        "&:hover": {
          backgroundColor: "#faebed !important",
          color: "black !important",
        },
      },
    },
  ];
  const CustomLoader = () => <></>;

const NoDataComponent = () => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "80px",
    color: "#6c757d",
    fontSize: "13px"
  }}>
    No inventory selected. Click "Select Inventory" above.
  </div>
);

const NoDatadomainComponent = () => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "80px",
    color: "#6c757d",
    fontSize: "13px"
  }}>
    No Domain lists selected
  </div>
);
  // const handlelocation = (data) => {
  //     console.log("Selected inventory data:", data);

  //     setFormData((prev) => (
  //         {
  //             ...prev,
  //             "data": data
  //         }
  //     ))
  //     if (Array.isArray(data)) {
  //         const mappedData = data.map((item, index) => ({
  //             ...item,
  //             id: item.domainappid || index.toString()
  //         }));
  //         setRowData(mappedData);
  //     }
  // }

  const handlelocation = (data) => {
    console.log("Selected inventory data:", data);

    setFormData((prev) => {
      const updatedData = data.map((newItem) => {
        // try to find existing item to preserve ID
        const existing = prev.data?.find(
          (item) => item.domainappid === newItem.domainappid,
        );

        return {
          ...newItem,
          campaignInventoryId: existing?.campaignInventoryId || 0, // 🔥 PRESERVE ID
        };
      });

      return {
        ...prev,
        data: updatedData,
      };
    });

    if (Array.isArray(data)) {
      const mappedData = data.map((item, index) => ({
        ...item,
        id: item.id || (item.domainappid ? `${item.domainappid}_${index}` : index.toString()),
      }));
      setRowData(mappedData);
    }
  };

  return (
    <>
      <div>
        <div className="step-scroll">
          <Row className="mt-3 mx-0 px-3">
            <Col xs="12">
              <div className="d-flex align-items-center gap-3 flex-wrap ">
                <label className="Inventoryheadlines mb-0">
                  Selected Inventory
                </label>

                <Button id="newaudience" onClick={toggleLocationModal} >
                  Select Inventory
                </Button>
                {selectedIds.length > 0 && (
                  <Button
                    onClick={handleRemoveSelected}
                    className="ms-auto"
                    style={{
                      border: "1px solid #d9d9d9",
                      lineHeight: "19px",
                      backgroundColor: "#fff",
                      borderRadius: "2px",
                      fontSize: "11px",
                      color: "black",
                      padding: "3px 7px",
                    }}
                  >
                    Remove Selected ({selectedIds.length})
                  </Button>
                )}
                <InventoryModal
                  isOpen={locationModalOpen}
                  toggle={toggleLocationModal}
                  handlelocation={handlelocation}
                  selectedData={formData.data}
                />
              </div>
            </Col>
          </Row>
          <div style={{ marginLeft: "31px", marginRight: "31px" }}>
            <div 
 
  className="border domainselinv" 
  style={{
    overflowY: filteredData.length > 0 ? "auto" : "hidden",
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
                fixedHeaderScrollHeight="150px"
                highlightOnHover
                persistTableHead  
                conditionalRowStyles={conditionalRowStyles}
                customStyles={customStyles}
                noDataComponent={<NoDataComponent />}
                subHeader
                subHeaderComponent={
                  <Row className="w-100 mx-0 d-flex justify-content-between align-items-center p-2">
                    <Col>
                      <Input
                        className="form-control normalized-input campagineditor w-100 form-control"
                        type="text"
                        id="seaching"
                        style={{ fontSize: "0.685rem" }}
                        placeholder="search..."
                      />
                    </Col>

                    <Col>
                      {/* <div id="country-wrapper" className="position-relative">
                        
                        <div
                          className="form-control campaign-btn  w-100 form-control"
                          style={{
                            height: "42px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                          onClick={() => {
                            setopenoptions(!openoptions);
                          }}
                          tabIndex={0}
                        >
                          {selectedoption || "All excluding legacy targeting"}
                          <FaCaretDown
                            className={`custom-select-icon ${
                              openoptions ? "open" : ""
                            }`}
                          />
                        </div>

                        
                        {openoptions && (
                          <div className="custom-dropdown-menu biddeript-b">
                            {staticoptions.map((country, idx) => {
                              const isSelected =
                                selectedoption === country.name;

                              return (
                                <div
                                  key={idx}
                                  className={`custom-dropdown-option ${
                                    isSelected ? "selected" : ""
                                  }`}
                                  onClick={() => {
                                    setselectedoption(country.name);
                                    setopenoptions(false);
                                  }}
                                >
                                  <span className="tick-icon">
                                    {isSelected && "✓"}
                                  </span>

                                  <span>{country.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div> */}
                    </Col>
                  </Row>
                }
                subHeaderAlign="left"
              />
            </div>
          </div>

          <Row className="mt-3 mx-0 px-3">
            <Col xs="12">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <label className="Inventoryheadlines mb-0">Domain List</label>

                <Button id="newaudience" onClick={toggleSelectDomain}>
                  Select Domain List
                </Button>
                <SelectDomain
                  isOpen={selectdomainOpen}
                  toggle={toggleSelectDomain}
                  domainlist={handledomainlist}
                  ref={childRef}
                />
              </div>
            </Col>
          </Row>

          <div style={{ marginLeft: "31px", marginRight: "31px" }}>
            <div 
  className="border domainselinv"
  style={{
    overflowY: domainlistdata.length > 0 ? "auto" : "hidden",
  }}
>
  <DataTable
    columns={domiancolumns}
    data={domainlistdata}
                progressPending={loading}
                progressComponent={<CustomLoader />}
                striped
                dense
                fixedHeader
                fixedHeaderScrollHeight="150px"
                highlightOnHover
                persistTableHead
                conditionalRowStyles={conditionalRowStyles}
                customStyles={customStyles}
                noDataComponent={<NoDatadomainComponent />}
              />
            </div>
          </div>

          <Row className="mt-3 mx-0 px-3">
            <Col className="pr-md-1" md="2">
              <Label className="mt-2">Supply Path Optimization</Label>
            </Col>
          </Row>
          <Col className="pr-md-1 ms-5 mt-1" md="5">
            <div className="d-flex gap-2 mt-5">
              <Input
                type="checkbox"
                name="exclude_ads_txt"
                id="exclude_ads_txt"
                checked={formData.exclude_ads_txt}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    exclude_ads_txt: e.target.checked,
                  }))
                }
                className="custom-checkbox"
              />
              <span className="text-gray-700 mb-1 devices">
                Exclude sites and apps without Ads.txt
              </span>
            </div>
          </Col>
          <Col className="pr-md-1 mt-3 ms-5 " md="5">
            <div className="d-flex gap-2 mt-5">
              <Input
                type="checkbox"
                name="target_direct"
                id="target_direct"
                checked={formData.target_direct}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_direct: e.target.checked,
                  }))
                }
                className="custom-checkbox"
              />
              <span className="text-gray-700 mb-1 devices">
                Target direct publisher relationships only{" "}
              </span>
            </div>
          </Col>

          <Row className="mt-3 ms-3">
            <Col className="pr-md-1" md="2">
              <Label className="mt-2">Supply Quality Filtering</Label>
            </Col>
          </Row>

          <Col className="pr-md-1 ms-5 mt-5" md="5">
            <div className="d-flex gap-2">
              <Input
                type="checkbox"
                name="opt_supply"
                id="opt_supply"
                checked={formData.opt_supply}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    opt_supply: e.target.checked,
                  }))
                }
                className="custom-checkbox"
              />
              <span className="text-gray-700 mb-1 devices">
                Opt out of Supply Quality filtering{" "}
              </span>
            </div>
          </Col>
          <Col className="pr-md-1 mt-3 ms-5 mb-3" md="5">
            <div className="d-flex gap-2">
              <Input
                type="checkbox"
                name="opt_made"
                id="opt_made"
                checked={formData.opt_made}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    opt_made: e.target.checked,
                  }))
                }
                className="custom-checkbox"
              />
              <span className="text-gray-700 mb-1 devices">
                Opt out of Made for Advertising (MFA) filtering
              </span>
            </div>
          </Col>
        </div>
      </div>
    </>
  );
});

export default InventoryEditor;
