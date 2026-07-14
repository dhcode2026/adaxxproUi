import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import {
  FormGroup,
  Input,
  Label,
  Row,
  Col,
  Spinner,
  UncontrolledTooltip,
} from "reactstrap";
import { useViewContext } from "../../ViewContext";
import { FaCaretDown, FaRegWindowClose } from "react-icons/fa";
import { IoMdClose, IoMdInformationCircle } from "react-icons/io";
import DataTable from "react-data-table-component";
import { getAllBrowser, getAllLanguage, getAllDevices, getAllMobilecarrier } from "../../views/api/Api.jsx";

const normalizeCarrierList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === "all") return [];
    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const buildDeviceTypeList = (selectedDevices = {}) => {
  const deviceTypeList = [];

  if (selectedDevices.desktop) deviceTypeList.push(2);
  if (selectedDevices.connected_tv) deviceTypeList.push(3);
  if (selectedDevices.phone) deviceTypeList.push(4);
  if (selectedDevices.tablet) deviceTypeList.push(5);

  return deviceTypeList;
};

const normalizeDeviceData = (data = {}) => {
  const normalized = {
    ...data,
    carrier: normalizeCarrierList(data.carrier ?? data.mobileCarriers),
  };

  const rawSelectedDevices = normalized.selectedDevices || {};
  const selectedDevices = {
    desktop: Boolean(rawSelectedDevices.desktop),
    phone: Boolean(rawSelectedDevices.phone),
    tablet: Boolean(rawSelectedDevices.tablet),
    connected_tv: Boolean(rawSelectedDevices.connected_tv),
  };

  const deviceTypeList = Array.isArray(normalized.device_type_list)
    ? normalized.device_type_list
        .map((item) => Number(item))
        .filter((item) => !Number.isNaN(item) && item > 0)
    : [];

  const hasSelectedDevices = Object.keys(rawSelectedDevices).length > 0;

  if (deviceTypeList.length > 0 && !hasSelectedDevices) {
    if (deviceTypeList.includes(2)) selectedDevices.desktop = true;
    if (deviceTypeList.includes(3)) selectedDevices.connected_tv = true;
    if (deviceTypeList.includes(4)) selectedDevices.phone = true;
    if (deviceTypeList.includes(5)) selectedDevices.tablet = true;
  }

  normalized.selectedDevices = selectedDevices;
  if (normalized.device_type === "all") {
    normalized.device_type_list = [];
  } else if (hasSelectedDevices) {
    normalized.device_type_list = buildDeviceTypeList(selectedDevices);
  } else {
    normalized.device_type_list = deviceTypeList.length > 0
      ? deviceTypeList
      : buildDeviceTypeList(selectedDevices);
  }

  return normalized;
};

const Devices = forwardRef((props, ref) => {
  const [formData, setFormData] = useState(normalizeDeviceData(props.deviceData));

  useEffect(() => {
    console.log("Devices component mounted with ref:", ref);
    return () => console.log("Devices component unmounted");
  }, [ref]);
  
  useEffect(() => {
    if (props.deviceData) {
      console.log("Updating formData from props:", props.deviceData);
      setFormData(normalizeDeviceData(props.deviceData));
    }
  }, [props.deviceData]);

  useImperativeHandle(ref, () => ({
    handledevicedata() {
      console.log("Device formData returned:", formData);
      return normalizeDeviceData(formData || {});
    },
  }), [formData]);

  const updateDeviceTypeSelection = (key, checked) => {
    const nextSelectedDevices = {
      ...(formData.selectedDevices || {}),
      [key]: checked,
    };

    const nextFormData = normalizeDeviceData({
      ...formData,
      selectedDevices: nextSelectedDevices,
    });

    setFormData(nextFormData);
    props.handledevice?.(nextFormData);
  };

  let pattendata = [];

  const initialGoal = 1;
  const goalValues = {
    0: "$1.00 USD",
    1: "$5.00 USD",
    2: "$10.00 USD",
    3: "$15.00 USD",
    4: "$20.00 USD",
    5: "$25.00 USD",
  };

  const [initialFormData, setinitialFormData] = useState();

  const [campaign, setCampaign] = useState(props.campaign);
  const [browserList, setBrowserList] = useState([]);
  const [mobileCarrierList, setMobileCarrierList] = useState([]);
  const [languageList, setLanguageList] = useState([]);
  const [loadingBrowsers, setLoadingBrowsers] = useState(false);
  const [loadingMobileCarriers, setLoadingMobileCarriers] = useState(false);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [openoptions, setopenoptions] = useState(false);
  const [selectedoption, setselectedoption] = useState();
  const [rownumber, setrownumber] = useState();
  const [staticoptions, setstaticoptions] = useState([
    { name: "Windows Phone" },
    { name: "Bada OS" },
    { name: "Firefox OS" },
    { name: "Symbian OS" },
    { name: "Windows" },
    { name: "Phone" },
    { name: "iOS" },
    { name: "Android" },
    { name: "Linux" },
    { name: "Nokia OS" },
    { name: "Blackberry OS" },
    { name: "Mac OS" },
    { name: "Other" },
    { name: "Roku OS" },
  ]);

  const getSelectedmodelOptions = () => {
    const item = [];
    if (!vx || !vx.model || !Array.isArray(vx.model)) {
      return item;
    }
    for (let i = 0; i < vx.model.length; i++) {
      const x = vx.model[i];
      item.push({
        label: x.name,
        value: x.name,
      });
    }
    return item;
  };

  const parsedCampaign = typeof campaign === "string" ? JSON.parse(campaign) : campaign;

  console.log("formData", formData);

  const [selectedDevices, setSelectedDevices] = useState({ desktop: false });
  const vx = useViewContext();
  const [openModels, setOpenModels] = useState(false);
  const [openBrowsers, setOpenBrowsers] = useState(false);
  const [openMobileCarriers, setOpenMobileCarriers] = useState(false);
  const [openLanguages, setOpenLanguages] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState("specific");
  const [selectedAllDeviceOption, setSelectedAllDeviceOption] = useState("option1");
  const isAllModelsSelected = formData.model.length === getSelectedmodelOptions().length;
  const [openMakes, setOpenMakes] = useState(false);
  const [selectedModelosOption, setSelectedModelosOption] = useState(props.deviceData.osversion_option);

  const apiLanguages = (parsedCampaign?.browser_languages || []).map(Number);
  const [openIab, setOpenIab] = useState(false);
  const [isAllIabSelected, setIsAllIabSelected] = useState(false);
  const [targetmobiledata, settargetmobiledata] = useState(props.deviceData.make);
  const [targetedlanguagedata, settargetedlanguagedata] = useState(props.deviceData.browser_languages);
  const [activeRowId, setActiveRowId] = useState(null);
  const [showpattern, setshowpattern] = useState(false);
  const [pattern, setpattern] = useState(props.deviceData.pattern);
  const [patterndata, setpatterndata] = useState(props.deviceData.pattern);
  const [showPopup, setShowPopup] = useState(false);
  const [targetedmodelitems, settargetedmodelitems] = useState(props.deviceData.model);
  const [deviceTableData, setDeviceTableData] = useState([]);

  // Search queries for various filters
  const [makeSearchQuery, setMakeSearchQuery] = useState("");
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [carrierSearchQuery, setCarrierSearchQuery] = useState("");
  const [browserSearchQuery, setBrowserSearchQuery] = useState("");
  const [languageSearchQuery, setLanguageSearchQuery] = useState("");

  const browserWrapperRef = React.useRef(null);
  const carrierWrapperRef = React.useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Browser dropdown
      if (browserWrapperRef.current && !browserWrapperRef.current.contains(event.target)) {
        setOpenBrowsers(false);
      }
      // Carrier dropdown
      if (carrierWrapperRef.current && !carrierWrapperRef.current.contains(event.target)) {
        setOpenMobileCarriers(false);
      }
      // OS dropdown
      if (!event.target.closest(".os-select-wrapper")) {
        setopenoptions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const filteredDeviceTableData = useMemo(() => {
    if (!makeSearchQuery.trim()) return deviceTableData;
    const query = makeSearchQuery.toLowerCase();
    return deviceTableData.filter((device) =>
      device.company && device.company.toLowerCase().includes(query)
    );
  }, [deviceTableData, makeSearchQuery]);

  const filteredTargetMobileData = useMemo(() => {
    if (!modelSearchQuery.trim()) return targetmobiledata;
    const query = modelSearchQuery.toLowerCase();
    return targetmobiledata.filter((device) => {
      const companyMatch = device.company && device.company.toLowerCase().includes(query);
      const modelMatch = device.laptopmodel && device.laptopmodel.some((m) =>
        m.name && m.name.toLowerCase().includes(query)
      );
      return companyMatch || modelMatch;
    });
  }, [targetmobiledata, modelSearchQuery]);

  const filteredLanguageData = useMemo(() => {
    if (!languageSearchQuery.trim()) return languageList;
    const query = languageSearchQuery.toLowerCase();
    return languageList.filter((lang) =>
      lang.language && lang.language.toLowerCase().includes(query)
    );
  }, [languageList, languageSearchQuery]);

  useEffect(() => {
    const fetchBrowsers = async () => {
      setLoadingBrowsers(true);
      try {
        const response = await getAllBrowser();
        if (response.data && response.data.data && response.data.data.informationBrowsers) {
          setBrowserList(response.data.data.informationBrowsers);
        }
      } catch (error) {
        console.error("Error fetching browsers:", error);
      } finally {
        setLoadingBrowsers(false);
      }
    };
    fetchBrowsers();
  }, []);

  useEffect(() => {
    const fetchLanguages = async () => {
      setLoadingLanguages(true);
      try {
        const response = await getAllLanguage();
        if (response.data && response.data.data && response.data.data.informationBrowserLanguageList) {
          const transformedData = response.data.data.informationBrowserLanguageList.map((item) => ({
            id: item.browserLanguageId,
            language: item.name,
            laptopmodel: [],
          }));
          setLanguageList(transformedData);
        }
      } catch (error) {
        console.error("Error fetching languages:", error);
      } finally {
        setLoadingLanguages(false);
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (languageList.length > 0) {
      let lang = formData.browser_languages || [];

      if (lang.length > 0 && typeof lang[0] === "string") {
        const matchedRows = languageList.filter(device =>
          lang.includes(device.language)
        );
        settargetedlanguagedata(matchedRows);
      }
    }
  }, [languageList, formData.browser_languages]);

  useEffect(() => {
    const fetchDevices = async () => {
      setLoadingDevices(true);
      try {
        const response = await getAllDevices();
        if (response.data?.data?.informationDevice) {
          const transformed = response.data.data.informationDevice.map((device) => ({
            id: device.deviceId,
            company: device.name,
            laptopmodel: (device.versions || []).map((v) => ({
              id: v.versionId,
              name: v.name,
            })),
          }));
          setDeviceTableData(transformed);
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
      } finally {
        setLoadingDevices(false);
      }
    };
    fetchDevices();
  }, []);

  // Mobile Carriers fetch effect
  useEffect(() => {
    const fetchMobileCarriers = async () => {
      setLoadingMobileCarriers(true);
      try {
        const response = await getAllMobilecarrier();
        if (response.data && response.data.data && response.data.data.informationMobileCarriers) {
          setMobileCarrierList(response.data.data.informationMobileCarriers);
        }
      } catch (error) {
        console.error("Error fetching mobile carriers:", error);
      } finally {
        setLoadingMobileCarriers(false);
      }
    };
    fetchMobileCarriers();
  }, []);

  useEffect(() => {
    if (deviceTableData.length > 0) {
      let makes = formData.make || [];
      let model = formData.model || [];

      let makeNames = [];
      let modelNames = [];

      if (makes.length && typeof makes[0] === "object") {
        return;
      } else {
        makeNames = makes;
      }

      if (model.length && typeof model[0] === "object") {
        modelNames = model.map(item => item.name);
      } else {
        modelNames = model;
      }
      if (makes.length > 0 && typeof makes[0] === "object" && model.length > 0 && typeof model[0] === "object") {
      }

      const matchedRows = deviceTableData.filter(device =>
        makes.length && typeof makes[0] === "object" ? makes.some(m => m.company === device.company) : makeNames.includes(device.company)
      );

      const matchedmodels = deviceTableData.flatMap(device =>
        device.laptopmodel.filter(modelItem =>
          model.length && typeof model[0] === "object" ? model.some(m => m.name === modelItem.name) : modelNames.includes(modelItem.name)
        )
      );
      if (makes.length > 0 && typeof makes[0] === "string") {
        settargetmobiledata(matchedRows);
      }
      if (model.length > 0 && typeof model[0] === "string") {
        settargetedmodelitems(matchedmodels);
      }
    }
  }, [deviceTableData, formData.make, formData.model]);

  useEffect(() => {
    setFormData((prev) => {
      console.log("targetred mobile data", targetmobiledata);
      console.log("targetred model data", targetedmodelitems);
      console.log("targetred lang data", targetedlanguagedata);

      console.log("targetred mobile data mapped", targetmobiledata);

      const updatedformdata = {
        ...prev,
        make: targetmobiledata,
        model: targetedmodelitems,
        browser_languages: targetedlanguagedata,
      };
      console.log(updatedformdata);
      props.handledevice(updatedformdata);

      return {
        ...updatedformdata,
      };
    });
  }, [targetmobiledata, targetedmodelitems, targetedlanguagedata]);

  const ExpandedComponent = ({ data }) => {
    console.log(data);
    return (
      <div style={{ padding: "6px 0" }}>
        {data.laptopmodel.length === 0 ? (
          <div style={{ fontSize: "11px", padding: "0px 20px" }}>No models available</div>
        ) : (
          data.laptopmodel.map((model, index) => {
            const isStriped = index % 2 === 0;
            const isTargeted = targetedmodelitems.some((item) => item.id === model.id);

            return (
              <div
                key={model.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 20px",
                  backgroundColor: isStriped ? "#F2F2F2" : "#FFFFFF",
                  minHeight: "40px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "rgb(48,48,48)",
                  }}
                >
                  {model.name}
                </span>

                {isTargeted ? (
                  <span
                    onClick={() => handleTargetmodelitems(model)}
                    className="device-targettextitems text-nowrap"
                    style={{
                      color: "#b6b3b1",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      paddingRight: "15px",
                    }}
                  >
                    Targeted
                  </span>
                ) : (
                  <button
                    type="button"
                    className="device-targetall conversion-track-btn"
                    onClick={() => handleTargetmodelitems(model)}
                    style={{ fontSize: "10px" }}
                  >
                    Target
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const languagedata = languageList;

  const conditionalRowStyles = [
    {
      when: (row) => row.id === activeRowId,
      style: {
        backgroundColor: "#FBEDEF",
        color: "rgb(48, 48, 48)",
        cursor: "pointer",
        "& td, & span, ": {
          color: "rgb(48, 48, 48)",
        },
        "&:hover": {
          backgroundColor: "#FBEDEF",
        },
      },
    },
  ];

  const mobilecolumns = useMemo(() => [
    {
      name: (
        <div
          style={{
            fontWeight: "600",
            padding: "6px 10px",
            height: "23px",
            color: " rgb(116, 116, 116)",
            fontSize: "10px",
          }}
        >
          Device
        </div>
      ),
      selector: (row) => {
        if (row.company) {
          return row.company
        }
        else {
          return row
        }
      },
      sortable: true,
      width: "80%",
    },
    {
      name: (
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "6px 10px",
            backgroundColor: "#ffffff",
          }}
        ></div>
      ),
      width: "20%",
      cell: (row) => {
        const isTargeted = targetmobiledata.some((item) => item.id === row.id);
        return isTargeted ? (
          <span className="device-targettext  text-nowrap">Targeted</span>
        ) : (
          <button
            className="device-targetall ms-auto conversion-track-btn text-nowrap"
            type="button"
            onClick={() => handleTarget(row)}
          >
            Target
          </button>
        );
      },
    },
  ], [targetmobiledata]);

  const companyitemscoloumns = useMemo(() => [
    {
      name: (
        <div
          style={{
            fontWeight: "600",
            padding: "6px 10px",
            height: "23px",
            color: " rgb(116, 116, 116)",
            fontSize: "10px",
          }}
        >
          Device
        </div>
      ),
      selector: (row) => {
        if (row.company) {
          return row.company;
        }
        else {
          return row;
        }
      },
      sortable: true,
      width: "70%",
    },
  ], []);

  const languagecoumns = useMemo(() => [
    {
      name: (
        <div
          style={{
            fontWeight: "600",
            padding: "6px 10px",
            height: "23px",
            color: " rgb(116, 116, 116)",
            fontSize: "10px",
          }}
        >
          Language
        </div>
      ),
      selector: (row) => <span>{row.language}</span>,
      sortable: true,
      width: "80%",
    },
    {
      name: (
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "6px 10px",
            backgroundColor: "#ffffff",
          }}
        ></div>
      ),
      width: "20%",
      cell: (row) => {
        const isTargeted = targetedlanguagedata.some((item) => item.id === row.id);
        return isTargeted ? (
          <span className="device-targettext  text-nowrap">Targeted</span>
        ) : (
          <button
            className="device-targetall ms-auto conversion-track-btn text-nowrap"
            type="button"
            onClick={() => handleTargetlang(row)}
          >
            Target
          </button>
        );
      },
    },
  ], [targetedlanguagedata]);

  const targetmobilecolumns = useMemo(() => [
    {
      name: (
        <div
          style={{
            fontWeight: "600",
            padding: "6px 10px",
            height: "23px",
            color: " rgb(116, 116, 116)",
            fontSize: "10px",
          }}
        >
          Device
        </div>
      ),
      selector: (row) => row.company,
      sortable: true,
      width: "60%",
    },
    {
      name: (
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "6px 10px",
            backgroundColor: "#ffffff",
          }}
        ></div>
      ),
      width: "40%",
      cell: (row) => (
        <button
          className=" ms-auto conversion-track-btn border-0 bg-transparent text-nowrap"
          type="button"
          onClick={() => handleTargetdelete(row)}
        >
          <FaRegWindowClose />
        </button>
      ),
    },
  ], []);

  const targetmobilecolumnsitems = useMemo(() => [
    {
      name: (
        <div
          style={{
            fontWeight: "600",
            padding: "6px 10px",
            height: "23px",
            color: " rgb(116, 116, 116)",
            fontSize: "10px",
          }}
        >
          Device
        </div>
      ),
      selector: (row) => row.name,
      sortable: true,
      width: "60%",
    },
    {
      name: (
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "6px 10px",
            backgroundColor: "#ffffff",
          }}
        ></div>
      ),
      width: "40%",
      cell: (row) => (
        <button
          className=" ms-auto conversion-track-btn border-0 bg-transparent text-nowrap"
          type="button"
          onClick={() => handleTargetdeleteitems(row)}
        >
          <FaRegWindowClose />
        </button>
      ),
    },
  ], []);

  const targetlanguagecolumns = useMemo(() => [
    {
      name: (
        <div
          style={{
            fontWeight: "600",
            padding: "6px 10px",
            height: "23px",
            color: " rgb(116, 116, 116)",
            fontSize: "10px",
          }}
        >
          language
        </div>
      ),
      selector: (row) => row.language,
      sortable: true,
      width: "60%",
    },
    {
      name: (
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "6px 10px",
            backgroundColor: "#ffffff",
          }}
        ></div>
      ),
      width: "40%",
      cell: (row) => (
        <button
          className="device-targetall ms-auto conversion-track-btn text-nowrap bg-transparent border-0 "
          type="button"
          onClick={() => handleTargetdeletelang(row)}
        >
          <FaRegWindowClose />
        </button>
      ),
    },
  ], []);

  const patterncolumns = useMemo(() => [
    {
      name: (
        <div
          style={{
            fontWeight: "600",
            padding: "6px 10px",
            height: "23px",
            color: " rgb(116, 116, 116)",
            fontSize: "10px",
          }}
        >
          Name
        </div>
      ),
      selector: (row) => row,
      sortable: true,
      width: "80%",
    },
    {
      name: (
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "6px 10px",
            backgroundColor: "#ffffff",
          }}
        ></div>
      ),
      width: "20%",
      cell: (row) => (
        <button
          className=" ms-auto conversion-track-btn border-0 bg-transparent text-nowrap"
          type="button"
          onClick={() => handledeletepattern(row)}
        >
          <FaRegWindowClose />
        </button>
      ),
    },
  ], []);

  const customStyles = {
    table: {
      style: {
        border: "1px solid #e5e7eb",
      },
    },
    tableWrapper: {
      style: {
        height: "auto",
      },
    },
    headRow: {
      style: {
        fontSize: "10px",
        minHeight: "40px",
        backgroundColor: "#F2F2F2",
        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
      },
    },
    headCells: {
      style: {
        paddingLeft: "0px",
        paddingRight: "0px",
        backgroundColor: "#F2F2F2",
        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
      },
    },
    rows: {
      style: {
        minHeight: "40px",
      },
      stripedStyle: {
        backgroundColor: "#F2F2F2",
      },
      highlightOnHoverStyle: {
        backgroundColor: "#F2F2F2",
        cursor: "pointer",
      },
    },
    cells: {
      style: {
        paddingRight: "7px",
        paddingTop: "2px",
        paddingBottom: "2px",
        fontSize: "11px",
        fontWeight: 600,
        color: "rgb(48, 48, 48)",
      },
    },
  };

  const companyitemsstyle = {
    table: {
      style: {
        border: "1px solid #e5e7eb",
      },
    },
    tableWrapper: {
      style: {
        height: "auto",
      },
    },
    headRow: {
      style: {
        fontSize: "10px",
        minHeight: "40px",
        backgroundColor: "#F2F2F2",
        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
      },
    },
    headCells: {
      style: {
        paddingLeft: "0px",
        paddingRight: "0px",
        backgroundColor: "#F2F2F2",
        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
      },
    },
    rows: {
      style: {
        minHeight: "40px",
        padding: "0px",
      },
      stripedStyle: {
        backgroundColor: "#F2F2F2",
      },
      highlightOnHoverStyle: {
        backgroundColor: "#F2F2F2",
        cursor: "pointer",
      },
    },
    cells: {
      style: {
        paddingRight: "7px",
        paddingTop: "2px",
        paddingBottom: "2px",
        fontSize: "11px",
        fontWeight: 600,
        color: "rgb(48, 48, 48)",
      },
    },
  };

  const targetedstyles = {
    table: {
      style: {
        border: "1px solid #e5e7eb",
        height: "auto",
      },
    },
    headRow: {
      style: {
        fontSize: "10px",
        minHeight: "40px",
        backgroundColor: "#F2F2F2",
        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
      },
    },
    headCells: {
      style: {
        paddingLeft: "0px",
        paddingRight: "0px",
        backgroundColor: "#F2F2F2",
        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
      },
    },
    rows: {
      style: {
        minHeight: "40px",
      },
      stripedStyle: {
        backgroundColor: "#F2F2F2",
      },
      highlightOnHoverStyle: {
        backgroundColor: "#F2F2F2",
        cursor: "pointer",
      },
    },
    cells: {
      style: {
        paddingRight: "7px",
        paddingTop: "2px",
        paddingBottom: "2px",
        fontSize: "11px",
        fontWeight: 600,
      },
    },
  };

  const patternstyles = {
    table: {
      style: {
        border: "1px solid #e5e7eb",
        height: "auto",
        width: "100%",
      },
    },
    headRow: {
      style: {
        fontSize: "10px",
        minHeight: "40px",
        backgroundColor: "#F2F2F2",
        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
      },
    },
    headCells: {
      style: {
        paddingLeft: "0px",
        paddingRight: "0px",
        backgroundColor: "#F2F2F2",
        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
      },
    },
    rows: {
      style: {
        minHeight: "40px",
      },
      stripedStyle: {
        backgroundColor: "#F2F2F2",
      },
      highlightOnHoverStyle: {
        backgroundColor: "#F2F2F2",
        cursor: "pointer",
      },
    },
    cells: {
      style: {
        paddingRight: "7px",
        paddingTop: "2px",
        paddingBottom: "2px",
        fontSize: "11px",
        fontWeight: 600,
        color: "rgb(48, 48, 48)",
      },
    },
  };

  const handletargetall = (item, model = false) => {
    if (model) {
      settargetedmodelitems((prev) => {
        const uniqueItems = item.flatMap((company) =>
          company.laptopmodel.filter((model) => !prev.some((p) => p.id === model.id))
        );
        return [...prev, ...uniqueItems];
      });
      return;
    }

    settargetmobiledata((prev) => {
      let uniqueitem = item.filter((items) => !prev.some((pre) => pre.id == items.id));
      return [...prev, ...uniqueitem];
    });
  };

  const handleTarget = (item) => {
    settargetmobiledata((prev) =>
      prev.some((row) => row.id === item.id) ? prev : [...prev, item]
    );
  };

  const handleTargetlang = (item) => {
    settargetedlanguagedata((prev) =>
      prev.some((row) => row.id === item.id) ? prev : [...prev, item]
    );
  };

  const handleTargetmodelitems = (item) => {
    settargetedmodelitems((prev) =>
      prev.some((row) => row.id === item.id) ? prev : [...prev, item]
    );
  };

  const handleTargetdelete = (item) => {
    console.log(item);
    settargetmobiledata((prev) => prev.filter((row) => row.id !== item.id));
    settargetedmodelitems((prev) => {
      const removeIds = item.laptopmodel.map((sub) => sub.id);
      return prev.filter((model) => !removeIds.includes(model.id));
    });
  };

  const handleTargetdeleteitems = (item) => {
    settargetedmodelitems((prev) => prev.filter((row) => row.id !== item.id));
  };

  const handleTargetdeletelang = (item) => {
    settargetedlanguagedata((prev) => prev.filter((row) => row.id !== item.id));
  };

  const handledeletepattern = (item) => {
    setpatterndata((prev) => prev.filter((row) => row !== item));
  };

  const getSelectedBrowserOptions = () => {
    return (browserList || []).map((browser) => ({
      label: browser.name,
      value: browser.name.toLowerCase(),
    }));
  };

  // FIX: Added getSelectedMobileCarrierOptions function
  const getSelectedMobileCarrierOptions = () => {
    return (mobileCarrierList || []).map((carrier) => ({
      label: carrier.name,
      value: carrier.name.toLowerCase(),
    }));
  };

  const getFilteredBrowserOptions = () => {
    const list = getSelectedBrowserOptions();
    if (!browserSearchQuery.trim()) return list;
    const query = browserSearchQuery.toLowerCase();
    return list.filter((option) => option.label.toLowerCase().includes(query));
  };

  const getFilteredMobileCarrierOptions = () => {
    const list = getSelectedMobileCarrierOptions();
    if (!carrierSearchQuery.trim()) return list;
    const query = carrierSearchQuery.toLowerCase();
    return list.filter((option) => option.label.toLowerCase().includes(query));
  };

  const preSelected = getSelectedBrowserOptions().filter((option) =>
    (parsedCampaign?.browsers || []).includes(option.value)
  );

  const handleAddEntry = () => {
    const updated = [
      ...entries,
      {
        ostype:
          formData.os?.updated?.[0]?.ostype || "Windows Phone",
        minVersion: "",
        maxVersion: "",
      },
    ];

    setEntries(updated);
    const newFormData = {
      ...formData,
      os: {
        updated,
      },
    };
    setFormData(newFormData);
    props.handledevice(newFormData);
  };

  const handleChanges = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
    const newFormData = {
      ...formData,
      os: {
        updated,
      },
    };
    setFormData(newFormData);
    props.handledevice(newFormData);
  };

  const handleRemoveEntry = (index) => {
    const updated = [...entries];
    updated.splice(index, 1);
    console.log("entries", updated);
    setEntries(updated);
    const newFormData = {
      ...formData,
      os: {
        updated: updated
      }
    };

    setFormData(newFormData);
    props.handledevice(newFormData);
  };

  const [entries, setEntries] = useState(props.deviceData.os.updated);
  console.log("os_updated", props.deviceData.os.updated);

  useEffect(() => {
    if (props.deviceData) {
      if (props.deviceData.osversion_option) {
        setSelectedModelosOption(props.deviceData.osversion_option);
      }
      if (props.deviceData.os && props.deviceData.os.updated) {
        setEntries(props.deviceData.os.updated);
      }
    }
  }, [props.deviceData.osversion_option, props.deviceData.os?.updated]);

  const isAllBrowsersSelected = formData.browsers.length === getSelectedBrowserOptions().length;

  const getSelectedTargets = () => {
    const items = [<option key="target-none" value="">Select Target</option>];
    for (let i = 0; i < vx.targets.length; i++) {
      const x = vx.targets[i];
      items.push(
        <option key={`target-${i}`} value={x.id}>
          {x.name}
        </option>
      );
    }
    return items;
  };

  const toggleSelectAllModels = () => {
    if (isAllModelsSelected) {
      setFormData({ ...formData, model: [] });
    } else {
      setFormData({
        ...formData,
        model: getSelectedmodelOptions().map((item) => item.label),
      });
    }
  };

  const getSelectedmakeOptions = () => {
    const item = [];
    if (!vx || !vx.make || !Array.isArray(vx.make)) {
      return item;
    }
    for (let i = 0; i < vx.make.length; i++) {
      const x = vx.make[i];
      item.push({
        label: x.name,
        value: x.name,
      });
    }
    return item;
  };

  const toggleSelectAllMakes = () => {
    if (isAllMakesSelected) {
      setFormData({ ...formData, make: [] });
    } else {
      setFormData({
        ...formData,
        make: getSelectedmakeOptions().map((item) => item.label),
      });
    }
  };

  const isAllMakesSelected = formData.make.length === getSelectedmakeOptions().length;

  const toggleSelectAllBrowsers = () => {
    if (isAllBrowsersSelected) {
      setFormData((prev) => ({ ...prev, browsers: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        browsers: getSelectedBrowserOptions().map((b) => b.label),
      }));
    }
  };

  const getSelectedCategoryvalueOptions = () => {
    const item = [];
    if (!vx || !vx.categoryvalue || !Array.isArray(vx.categoryvalue)) {
      return item;
    }
    if (!campaign || !campaign.categoryvalue) {
      return item;
    }
    for (let i = 0; i < vx.categoryvalue.length; i++) {
      const x = vx.categoryvalue[i];
      const isSelected = campaign.categoryvalue.includes(x.id);
      item.push({
        id: x.id,
        name: x.name,
        label: `${x.name} (${x.value})`,
        value: x.name,
        selected: !!isSelected,
      });
    }
    return item;
  };

  const toggleSelectAllIab = () => {
    if (isAllIabSelected) {
      setFormData({ ...formData, iab_category: [] });
    } else {
      const allValues = getSelectedCategoryvalueOptions().map((o) => Number(o.value));
      setFormData({ ...formData, iab_category: allValues });
    }
    setIsAllIabSelected(!isAllIabSelected);
  };

  const handleInputChange = (e, nameOverride = null) => {
    if (Array.isArray(e)) {
      const name = nameOverride;
      setFormData((prev) => ({
        ...prev,
        [name]: e,
      }));
    } else {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleRemoveBrowser = (browser) => {
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        browsers: prev.browsers.filter((b) => b !== browser),
      };

      props.handledevice(newFormData);
      return newFormData;
    });
  };

  // FIX: Add handler for removing carrier
  const handleRemoveCarrier = (carrier) => {
    setFormData((prev) => {
      const updated = (prev.carrier || []).filter((c) => c !== carrier);
      const newFormData = {
        ...prev,
        carrier: updated,
      };
      props.handledevice(newFormData);
      return newFormData;
    });
  };

  const hasSelectedDevice =
    Object.values(formData.selectedDevices || {}).some((value) => value && value !== "") ||
    formData.device_type !== "";

  return (
    <div className="step-scroll row">
      <Col md="12">
        <Row id="devices-section-type" className=" mt-4 mb-2 gap-4 align-items-center">
          <Col className="text-end" xs="2">
            <Label className="font device-label mb-0 text-end text-nowrap">Device Type:</Label>
          </Col>

          <Col className="pr-md-1" xs="2">
            <div className="d-flex gap-2 align-items-center">
              <Input
                type="radio"
                name="all"
                id="all"
                value="all"
                checked={formData.device_type === "all"}
                onChange={() => {
                  let updatedformdata = {
                    ...formData,
                    device_type: "all",
                  };
                  setFormData((prev) => (updatedformdata))
                  props.handledevice(updatedformdata);
                }
                }
              />
              <span className="text-gray-700 font devices-fontsize text-nowrap">All types</span>
            </div>
          </Col>

          <Col className="pr-md-1" xs="3">
            <div className="d-flex gap-2 align-items-center">
              <Input
                type="radio"
                name="device_type"
                id="specificTypes"
                value="specific"
                checked={formData.device_type === "specific"}
                onChange={() => {
                  let updatedformdata = {
                    ...formData,
                    device_type: "specific",
                  };
                  setFormData((prev) => (updatedformdata))
                  props.handledevice(updatedformdata);
                }}
              />
              <span className="text-gray-700 devices-fontsize">Target specific types</span>
            </div>
          </Col>
        </Row>

        {formData.device_type === "specific" && (
          <Row className="mt-2 mb-2 gap-4 align-items-center">
            <Col xs="4"></Col>
            <Col xs="auto">
              <div className="d-flex align-items-center gap-2">
                <Input
                  type="checkbox"
                  className="rounded-0"
                  name="desktop"
                  id="desktop"
                  checked={formData.selectedDevices.desktop}
                  onChange={(e) => updateDeviceTypeSelection("desktop", e.target.checked)}
                />
                <span className="text-gray-700 devices-fontsize text-nowrap">Desktop</span>
              </div>
            </Col>

            <Col xs="auto">
              <div className="d-flex align-items-center gap-2">
                <Input
                  type="checkbox"
                  className="rounded-0"
                  name="phone"
                  id="phone"
                  checked={formData.selectedDevices.phone}
                  onChange={(e) => updateDeviceTypeSelection("phone", e.target.checked)}
                />
                <span className="text-gray-700 devices-fontsize text-nowrap">Phone</span>
              </div>
            </Col>

            <Col xs="auto">
              <div className="d-flex align-items-center gap-2">
                <Input
                  type="checkbox"
                  className="rounded-0"
                  name="tablet"
                  id="tablet"
                  checked={formData.selectedDevices.tablet}
                  onChange={(e) => updateDeviceTypeSelection("tablet", e.target.checked)}
                />
                <span className="text-gray-700 devices-fontsize text-nowrap">Tablet</span>
              </div>
            </Col>

            <Col xs="auto">
              <div className="d-flex align-items-center gap-2">
                <Input
                  type="checkbox"
                  className="rounded-0"
                  name="connected_tv"
                  id="connected_tv"
                  checked={formData.selectedDevices.connected_tv}
                  onChange={(e) => updateDeviceTypeSelection("connected_tv", e.target.checked)}
                />
                <span className="text-gray-700 devices-fontsize text-nowrap">Connected TV</span>
              </div>
            </Col>
          </Row>
        )}

        {selectedDeviceType === "all" && (
          <>
            <Row className="">
              <Col className="pr-md-1" md="2">
                <FormGroup>
                  <Label>Make</Label>
                </FormGroup>
              </Col>
              <Col className="pr-md-1" md="1">
                <div className="d-flex gap-2">
                  <Input
                    type="radio"
                    name="allDeviceOptions"
                    id="allDevicesOption1"
                    value="option1"
                    checked={selectedAllDeviceOption === "option1"}
                    onChange={() => {
                      setSelectedAllDeviceOption("option1")
                      let updatedformdata = {
                        ...formData,
                        all_makes: "all",
                      };
                      setFormData((prev) => (updatedformdata))
                      props.handledevice(updatedformdata);
                    }}
                  />
                  <span className="text-gray-700 mt-1 devices">All makes</span>
                </div>
              </Col>
              <Col className="pr-md-1" md="1">
                <div className="d-flex gap-2">
                  <Input
                    type="radio"
                    name="allDeviceOptions"
                    id="allDevicesOption2"
                    value="option2"
                    checked={selectedAllDeviceOption === "option2"}
                    onChange={() => {
                      setSelectedAllDeviceOption("option2")
                      let updatedformdata = {
                        ...formData,
                        all_makes: "specific",
                      };
                      setFormData((prev) => (updatedformdata))
                      props.handledevice(updatedformdata);
                    }}
                  />
                  <span className="text-gray-700 mt-1 devices">Target specific makes</span>
                </div>
              </Col>
            </Row>

            {selectedAllDeviceOption === "option2" && (
              <Row className="">
                <Col md="2"></Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Targets</Label>
                    <Input type="select" id="target">
                      {getSelectedTargets()}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
            )}
          </>
        )}

        <Row id="devices-section-id" className="mt-5  align-items-center gap-4 font">
          <Col xs="2" className="text-end">
            <Label className=" device-label text-nowrap">Device ID:</Label>
          </Col>
          <Col className="">
            <Input
              type="checkbox"
              className="rounded-0"
              checked={formData.targetwithimpression}
              onChange={(e) => {
                const updatedformdata = {
                  ...formData,
                  targetwithimpression: e.target.checked,
                };
                setFormData(updatedformdata);
                props.handledevice(updatedformdata);
              }}
            ></Input>
            <span className="ms-2 devices-fontsize">Target only impressions with an ID</span>
            <span className=" ">
              <IoMdInformationCircle
                id="locationInfoIcon"
                size={20}
                className="info-icon ms-1"
              />
              <UncontrolledTooltip
                placement="top"
                target="locationInfoIcon"
                className="black-tooltip"
              >
                Target only impressions where the mobile advertising ID or DSP cookie ID is
                available in the bid request.
              </UncontrolledTooltip>
            </span>
          </Col>
        </Row>

        {hasSelectedDevice && (
          <Row id="devices-section-make" className=" mt-2 mb-2 gap-4 align-items-center">
            <Col className="text-end" xs="2">
              <Label className="font device-label mb-0 text-nowrap">Make:</Label>
            </Col>

            <Col xs="2">
              <div className="d-flex align-items-center justify-content-start gap-1">
                <Input
                  type="radio"
                  name="all_makes"
                  id="allmakes"
                  value="allmakes"
                  checked={formData.all_makes === "all"}
                  onChange={(e) => {
                    let updatedformdata = {
                      ...formData,
                      all_makes: "all",
                    }
                    settargetmobiledata([]);
                    setFormData(updatedformdata);
                    props.handledevice(updatedformdata);
                  }
                  }
                />
                <span className="text-gray-700 mt-1 devices text-nowrap">All makes</span>
              </div>
            </Col>

            <Col md="6">
              <div className="d-flex align-items-center gap-2">
                <Input
                  type="radio"
                  name="all_makes"
                  id="specificmakes"
                  value="specificmakes"
                  checked={formData.all_makes === "specificmakes"}
                  onChange={(e) => {
                    let updatedformdata = {
                      ...formData,
                      all_makes: "specificmakes",
                      make: []
                    }
                    setFormData(updatedformdata);
                    props.handledevice(updatedformdata);
                  }}
                />
                <span className="text-gray-700 mt-1 devices">Target specific makes</span>
              </div>
            </Col>
          </Row>
        )}

        {formData.all_makes === "specificmakes" && hasSelectedDevice && (
          <Row className=" align-items-center gap-4">
            <Col xs="2" className=""></Col>
            <Col className="" md="6">
              <div className="ms-2">
                <span className="device-sub-heading  ">Search for Makes</span>
                <div className="d-flex mt-3 mb-2">
                  <input
                    type="text"
                    placeholder="search"
                    value={makeSearchQuery}
                    onChange={(e) => setMakeSearchQuery(e.target.value)}
                    className="device-searchall border"
                  />
                  <button
                    className="device-targetall ms-2 border conversion-track-btn"
                    type="button"
                    onClick={() => handletargetall(filteredDeviceTableData)}
                  >
                    Target All
                  </button>
                  <span className="ms-auto device-match me-3">
                    {loadingDevices ? (
                      <Spinner size="sm" color="primary" />
                    ) : (
                      `${filteredDeviceTableData.length} Matches`
                    )}
                  </span>
                </div>
                {loadingDevices ? (
                  <div className="text-center py-4">
                    <Spinner size="sm" color="primary" />
                    <span className="ms-2">Loading devices...</span>
                  </div>
                ) : (
                  <DataTable
                    columns={mobilecolumns}
                    data={filteredDeviceTableData}
                    onRowClicked={(row) => setActiveRowId(row.id)}
                    fixedHeaderScrollHeight="200px"
                    fixedHeader
                    striped
                    highlightOnHover
                    conditionalRowStyles={conditionalRowStyles}
                    customStyles={customStyles}
                  />
                )}
              </div>
            </Col>

            <Col className="" md="3">
              <span className="device-sub-heading ms-2 ">Targeted Makes</span>
              <div className="d-flex justify-content-between mt-3 mb-2">
                <button
                  className="device-targetall border conversion-track-btn"
                  type="button"
                  onClick={() => {
                    settargetmobiledata([]);
                    settargetedmodelitems([]);
                  }}
                >
                  Remove All
                </button>
                <span className="device-match">{targetmobiledata.length} Makes Targeted</span>
              </div>
              <div>
                <DataTable
                  columns={targetmobilecolumns}
                  data={targetmobiledata}
                  fixedHeader
                  fixedHeaderScrollHeight="200px"
                  customStyles={targetedstyles}
                  persistTableHead
                  striped
                  highlightOnHover
                  noDataComponent={null}
                />
              </div>
            </Col>
          </Row>
        )}

        {hasSelectedDevice && (
          <Row id="devices-section-model" className="mt-5 gap-4 align-items-center">
            <Col xs="2" className="text-end">
              <Label className="device-label text-end  device-make-label text-nowrap">Model:</Label>
            </Col>

            <Col md="2">
              <div className="d-flex align-items-center gap-2">
                <Input
                  type="radio"
                  name="modelOptions"
                  id="allModels"
                  value="allmodels"
                  checked={formData.model_option === "all"}
                  onChange={(e) => {
                    let updatedformdata = {
                      ...formData,
                      model_option: "all",
                    }
                    settargetedmodelitems([])
                    setFormData(updatedformdata);
                    props.handledevice(updatedformdata);
                  }}
                />
                <span className="text-gray-700 devices text-nowrap">All Models</span>
              </div>
            </Col>

            <Col md="6">
              <div className="d-flex align-items-center gap-2">
                <Input
                  type="radio"
                  name="modelOptions"
                  id="specificModels"
                  value="specific"
                  checked={formData.model_option === "specific"}
                  onChange={(e) => {
                    let updatedformdata = {
                      ...formData,
                      model_option: "specific",
                    }
                    setFormData(updatedformdata);
                    props.handledevice(updatedformdata);
                  }}
                />
                <span className="text-gray-700 devices">Target Specific Models</span>
              </div>
            </Col>
          </Row>
        )}

        {formData.model_option === "specific" && hasSelectedDevice && (
          <Row className=" align-items-center gap-4">
            <Col xs="2" className=""></Col>
            <Col className="" md="6">
              <div className="ms-2">
                <span className="device-sub-heading  ">Search for Models</span>
                <div className="d-flex mt-3 mb-2">
                  <input
                    type="text"
                    placeholder="search"
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    className="device-searchall border"
                  />
                  <button
                    className="device-targetall ms-2 border conversion-track-btn"
                    type="button"
                    onClick={() => handletargetall(filteredTargetMobileData, "submodel")}
                  >
                    Target All
                  </button>
                  <span className="ms-auto device-match me-3">
                    {filteredTargetMobileData.length} Matches
                  </span>
                </div>
                <DataTable
                  columns={companyitemscoloumns}
                  data={filteredTargetMobileData}
                  onRowClicked={(row) => setActiveRowId(row.id)}
                  fixedHeaderScrollHeight="200px"
                  fixedHeader
                  striped
                  highlightOnHover
                  customStyles={companyitemsstyle}
                  noDataComponent={null}
                  expandableRows
                  expandableRowsComponent={ExpandedComponent}
                />
              </div>
            </Col>

            <Col className="" md="3">
              <span className="device-sub-heading ms-2 ">Targeted Models</span>
              <div className="d-flex justify-content-between mt-3 mb-2">
                <button
                  className="device-targetall border conversion-track-btn"
                  type="button"
                  onClick={() => settargetedmodelitems([])}
                >
                  Remove All
                </button>
                <span className="device-match">{targetedmodelitems.length} Model Targeted</span>
              </div>
              <div>
                <DataTable
                  columns={targetmobilecolumnsitems}
                  data={targetedmodelitems}
                  fixedHeader
                  fixedHeaderScrollHeight="200px"
                  customStyles={targetedstyles}
                  persistTableHead
                  striped
                  highlightOnHover
                  noDataComponent={null}
                />
              </div>
            </Col>
          </Row>
        )}

        {/* FIX: Corrected Carriers Section */}
        <Row id="devices-section-carrier" className="mt-3 gap-4 align-items-center">
          <Col xs="2" className="text-end">
            <Label className="device-label text-end">Carriers:</Label>
          </Col>

          <Col md="6">
            <div
              ref={carrierWrapperRef}
              className="position-relative"
              style={{
                width: "300px",
              }}
            >
              <div
                className="campaign-currency position-relative mt-3"
                style={{ maxWidth: "360px", width: "100%" }}
              >
                <input
                  type="text"
                  className="form-control campaign-btn w-100 placeholder-xs"
                  placeholder="Search"
                  value={carrierSearchQuery}
                  onChange={(e) => {
                    setCarrierSearchQuery(e.target.value);
                    if (!openMobileCarriers) setOpenMobileCarriers(true);
                  }}
                  onClick={() => {
                    setOpenMobileCarriers(!openMobileCarriers);
                  }}
                  style={{ paddingRight: "85px" }}
                />
                <span
                  className="usd"
                  role="button"
                  onClick={() => {
                    setOpenMobileCarriers(!openMobileCarriers);
                  }}
                  style={{
                    pointerEvents: "auto",
                    cursor: "pointer",
                  }}
                >
                  Carriers
                </span>
                {openMobileCarriers && (
                  <div
                    className="custom-dropdown-menu"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "#fff",
                      border: "1px solid #dadada",
                      maxHeight: "200px",
                      overflowY: "auto",
                      borderRadius: "0",
                    }}
                  >
                    {loadingMobileCarriers ? (
                      <div className="text-center py-2">
                        <Spinner size="sm" color="primary" />
                        <span className="ms-2">Loading carriers...</span>
                      </div>
                    ) : (
                      getFilteredMobileCarrierOptions().map((option, idx) => {
                        const isSelected = (formData.carrier || []).includes(option.value);

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              let updated = [...(formData.carrier || [])];

                              if (isSelected) {
                                updated = updated.filter((x) => x !== option.value);
                              } else {
                                updated.push(option.value);
                              }

                              const newFormData = {
                                ...formData,
                                carrier: updated,
                              };
                              setFormData(newFormData);
                              props.handledevice(newFormData);
                              setOpenMobileCarriers(false);
                            }}
                            className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "5px 10px",
                              cursor: "pointer",
                              gap: "5px",
                            }}
                          >
                            {isSelected && (
                              <span
                                style={{
                                  color: "#fff",
                                  backgroundColor: "#4c9eec",
                                  borderRadius: "50%",
                                  padding: "0 6px",
                                  fontWeight: "bold",
                                }}
                              >
                                ✔
                              </span>
                            )}
                            <span>{option.label}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginTop: "8px",
                  flexDirection: "column",
                }}
              >
                <p className="devies-targetedBroswere">Targeted Carriers</p>
                {(formData.carrier || []).length > 0 && (
                  <div className="d-flex flex-wrap gap-2">
                    {(formData.carrier || []).map((carrier) => (
                      <span
                        key={carrier}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "rgb(247, 247, 247)",
                          color: "rgb(51, 63, 73)",
                          padding: "4px 9px",
                          fontSize: "12px",
                          fontWeight: 600,
                          border: "1px solid rgb(212, 212, 212)",
                          borderRadius: "4px",
                        }}
                      >
                        {carrier}
                        <span
                          onClick={() => {
                            const updated = (formData.carrier || []).filter((c) => c !== carrier);
                            const newFormData = {
                              ...formData,
                              carrier: updated,
                            };
                            setFormData(newFormData);
                            props.handledevice(newFormData);
                          }}
                          style={{
                            cursor: "pointer",
                            fontWeight: "bold",
                            color: "rgb(51, 63, 73)",
                          }}
                        >
                          ✕
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>

        <Row id="devices-section-os" className=" align-items-center gap-4">
          <Col className="text-end" xs="2">
            <Label className="device-label text-end text-nowrap">OS & Version:</Label>
          </Col>

          <Col className="" md="2">
            <div className="d-flex align-items-center text-nowrap gap-2">
              <Input
                type="radio"
                name="osmodelOptions"
                id="osallModels"
                value="osallmodels"
                checked={selectedModelosOption === "all"}
                onChange={() => {
                  const resetEntries = [
                    {
                      ostype:
                        formData.os?.updated?.[0]?.ostype || "Windows Phone",
                      minVersion: "",
                      maxVersion: "",
                    },
                  ];
                  setSelectedModelosOption("all");
                  setEntries(resetEntries);
                  const updatedformdata = {
                    ...formData,
                    osversion_option: "all",
                    os: {
                      updated: resetEntries,
                    },
                  };
                  setFormData(updatedformdata);
                  props.handledevice(updatedformdata);
                }}
              />
              <span className="text-gray-700 mt-1 devices">All OS's</span>
            </div>
          </Col>

          <Col className="pr-md-1" sm="5">
            <div className="d-flex align-items-center gap-2">
              <Input
                type="radio"
                name="osmodelOptions"
                id="osspecificModels"
                value="osspecific"
                checked={selectedModelosOption === "osspecificModels"}
                onChange={() => {
                  setSelectedModelosOption("osspecificModels");
                  const updatedformdata = {
                    ...formData,
                    osversion_option: "osspecificModels",
                    os: {
                      updated:
                        formData.os?.updated?.length > 0
                          ? formData.os.updated
                          : [
                            {
                              ostype:
                                formData.os?.updated?.[0]?.ostype || "Windows Phone",
                              minVersion: "",
                              maxVersion: "",
                            },
                          ],
                    },
                  };
                  setFormData(updatedformdata);
                  props.handledevice(updatedformdata);
                }}
              />
              <span className="text-gray-700 mt-1 devices text-nowrap">
                Target specific OS's (Desktop and Mobile)
              </span>
            </div>
          </Col>
        </Row>

        {selectedModelosOption === "osspecificModels" && (
          <>
            <div>
              {entries.map((entry, index) => (
                <Row className="mt-1 gap-4 align-items-start" key={index}>
                  <Col xs="2"></Col>

                  <Col md="2" className="">
                    <FormGroup>
                      {index === 0 && <Label className="device-os-label">OS</Label>}

                      <div id="country-wrapper" className="position-relative os-select-wrapper">
                        <div
                          className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center biddeript-a "
                          onClick={() => {
                            setopenoptions(!openoptions);
                            setrownumber(index);
                          }}
                          tabIndex={0}
                        >
                          {entry.ostype || "Select an Os"}
                          <FaCaretDown
                            className={`custom-select-icon ${openoptions ? "open" : ""}`}
                          />
                        </div>

                        {(openoptions && rownumber == index) && (
                          <div className="custom-dropdown-menu biddeript-b">
                            {staticoptions.map((country, idx) => {
                              const isSelected = entries[index].ostype === country.name;

                              return (
                                <div
                                  key={idx}
                                  className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                                  onClick={() => {
                                    setselectedoption(country.name);
                                    handleChanges(index, "ostype", country.name);
                                    setopenoptions(false);
                                  }}
                                >
                                  <span className="tick-icon">{isSelected && "✓"}</span>

                                  <span>{country.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </FormGroup>
                  </Col>

                  <Col md="2">
                    <FormGroup>
                      {index === 0 && (
                        <Label className="device-os-label text-nowrap">
                          Minimum Version (Optional)
                        </Label>
                      )}
                      <div
                        className="form-control rounded-0 normalized-input d-flex align-items-center"
                        style={{
                          padding: "0",
                          height: "32px",
                          fontSize: "0.7rem",
                        }}
                      >
                        <input
                          type="text"
                          value={entry.minVersion}
                          placeholder="Minimum version"
                          onChange={(e) => handleChanges(index, "minVersion", e.target.value)}
                          className="border-0 w-100 h-100 px-2"
                          style={{
                            outline: "none",
                            boxShadow: "none",
                            fontSize: "0.7rem",
                          }}
                        />
                      </div>
                    </FormGroup>
                  </Col>

                  <Col md="2">
                    <FormGroup>
                      {index === 0 && (
                        <Label className="device-os-label text-nowrap">
                          Maximum Version (Optional)
                        </Label>
                      )}
                      <div
                        className="form-control rounded-0 normalized-input d-flex align-items-center"
                        style={{
                          padding: "0",
                          height: "32px",
                          fontSize: "0.7rem",
                        }}
                      >
                        <input
                          type="text"
                          value={entry.maxVersion}
                          placeholder="Maximum version"
                          onChange={(e) => handleChanges(index, "maxVersion", e.target.value)}
                          className="border-0 w-100 h-100 px-2"
                          style={{
                            outline: "none",
                            boxShadow: "none",
                            fontSize: "0.7rem",
                          }}
                        />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md="2" className="">
                    {selectedModelosOption === "osspecificModels" && index == 0 && (
                      <div className="mt-1">
                        <button
                          type="button"
                          size="xs"
                          onClick={handleAddEntry}
                          className=" Osbtn mt-4 border"
                        >
                          + Add Another OS
                        </button>
                      </div>
                    )}
                    {selectedModelosOption === "osspecificModels" && index != 0 && (
                      <span className="fw-bold w-25">
                        <IoMdClose
                          style={{
                            fontSize: "15px",
                            backgroundColor: "white",
                            fontWeight: "bold",
                          }}
                          className="fw-bold"
                          onClick={() => handleRemoveEntry(index)}
                        />
                      </span>
                    )}
                  </Col>
                </Row>
              ))}
            </div>
          </>
        )}

        <Row id="devices-section-browser" className="mt-3 gap-4  align-items-center">
          <Col xs="2" className="text-end">
            <Label className="device-label text-end">Browser:</Label>
          </Col>

          <Col md="2">
            <div className="d-flex align-items-center gap-2">
              <Input
                type="radio"
                name="browsermodelOptions"
                id="browserallModels"
                value="browser_option"
                checked={formData.browser_option == "all"}
                onChange={() => {
                  const newFormData = {
                    ...formData,
                    browser_option: "all",
                    browsers: [],
                  };

                  setFormData(newFormData);
                  props.handledevice(newFormData);
                }}
              />
              <span className="text-gray-700 mt-1 devices text-nowrap">All Browsers</span>
            </div>
          </Col>

          <Col md="6">
            <div className="d-flex align-items-center gap-2">
              <Input
                type="radio"
                name="browsermodelOptions"
                id="browserspecificModels"
                value="browserspecificModels"
                checked={formData.browser_option === "browserspecificModels"}
                onChange={() => {
                  const newFormData = {
                    ...formData,
                    browser_option: "browserspecificModels",
                  };

                  setFormData(newFormData);
                  props.handledevice(newFormData);
                }}
              />
              <span className="text-gray-700 mt-1 devices  ">Target Specific Browsers</span>
            </div>
          </Col>
        </Row>

        <Row className=" gap-4  align-items-center">
          <Col xs="4"></Col>
          {formData.browser_option === "browserspecificModels" && (
            <>
              <Col xs="auto">
                <div id="browser-wrapper" ref={browserWrapperRef} className="position-relative" style={{ width: "300px" }}>
                  <div
                    className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center biddeript-a mt-3"
                    onClick={() => setOpenBrowsers(!openBrowsers)}
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="text-truncate">
                      {formData.browsers.length === 0
                        ? "Select Browsers"
                        : (formData.browsers.length <= 2
                            ? formData.browsers.join(", ")
                            : `${formData.browsers.length} Browsers Selected`)}
                    </span>
                    <FaCaretDown
                      className={`custom-select-icon ${openBrowsers ? "open" : ""}`}
                    />
                  </div>

                  {openBrowsers && (
                    <div className="custom-dropdown-menu biddeript-b" style={{ width: "100%" }}>
                      <input
                        type="text"
                        className="form-control border-0 border-bottom rounded-0 px-3 py-2"
                        placeholder="Search Browsers..."
                        value={browserSearchQuery}
                        onChange={(e) => setBrowserSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: "11px", outline: "none", boxShadow: "none" }}
                      />
                      {loadingBrowsers ? (
                        <div className="text-center py-2">
                          <Spinner size="sm" color="primary" />
                          <span className="ms-2">Loading browsers...</span>
                        </div>
                      ) : (
                        getFilteredBrowserOptions().map((option, idx) => {
                          const isSelected = formData.browsers.includes(option.label);

                          return (
                            <div
                              key={idx}
                              className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                              onClick={() => {
                                let updated = [...formData.browsers];

                                if (isSelected) {
                                  updated = updated.filter((x) => x !== option.label);
                                } else {
                                  updated.push(option.label);
                                }

                                setFormData((prev) => ({
                                  ...prev,
                                  browsers: updated,
                                }));
                                const newFormData = {
                                  ...formData,
                                  browsers: updated,
                                };
                                props.handledevice(newFormData);
                              }}
                            >
                              <span className="tick-icon">{isSelected && "✓"}</span>
                              <span>{option.label}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </Col>

              <Col className="d-flex align-items-center flex-wrap gap-2 mt-3">
                {formData.browsers.length > 0 && (
                  <>
                    <span className="devies-targetedBroswere mb-0 text-nowrap me-2">Targeted Browsers:</span>
                    {formData.browsers.map((browser) => (
                      <span
                        key={browser}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          width: "fit-content",
                          gap: "6px",
                          backgroundColor: "rgb(247, 247, 247)",
                          color: "rgb(51, 63, 73)",
                          padding: "4px 9px",
                          fontSize: "12px",
                          fontWeight: 600,
                          border: "1px solid rgb(212, 212, 212)",
                          borderRadius: "4px",
                        }}
                      >
                        {browser || " "}
                        <span
                          onClick={() => handleRemoveBrowser(browser)}
                          style={{
                            cursor: "pointer",
                            fontWeight: "bold",
                            color: "rgb(51, 63, 73)",
                            marginLeft: "4px",
                          }}
                        >
                          ✕
                        </span>
                      </span>
                    ))}
                  </>
                )}
              </Col>
            </>
          )}
        </Row>

        <Row id="devices-section-language" className="mt-3 gap-4 align-items-center">
          <Col xs="2" className="text-end">
            <Label className="device-label text-end">Browser Language:</Label>
          </Col>

          <Col md="2">
            <div className="d-flex align-items-center gap-2">
              <Input
                type="radio"
                name="browserlanguageOptions"
                id="languageallModels"
                value="languageallmodels"
                checked={formData.browser_language_option == "all"}
                onChange={() =>
                  setFormData((prev) => ({
                    ...prev,
                    browser_language_option: "all",
                  }))
                }
              />
              <span className="text-gray-700 mt-1 devices text-nowrap">All languages</span>
            </div>
          </Col>

          <Col md="6">
            <div className="d-flex align-items-center gap-2">
              <Input
                type="radio"
                name="browserlanguageOptions"
                id="languagespecificModels"
                value="languagespecificModels"
                checked={formData.browser_language_option === "languagespecificModels"}
                onChange={() =>
                  setFormData((prev) => ({
                    ...prev,
                    browser_language_option: "languagespecificModels",
                  }))
                }
              />
              <span className="text-gray-700 mt-1 devices">Target specific languages</span>
            </div>
          </Col>
        </Row>

        {formData.browser_language_option === "languagespecificModels" && (
          <Row className="gap-4 align-items-center">
            <Col xs="2" className=""></Col>
            <Col className="" md="6">
              <div className="ms-2">
                <span className="device-sub-heading  ">Available Languages</span>
                <div className="d-flex mt-3 mb-2">
                  <input
                    type="text"
                    placeholder="filter"
                    value={languageSearchQuery}
                    onChange={(e) => setLanguageSearchQuery(e.target.value)}
                    className="device-searchall border"
                  />
                  <Input type="checkbox" className="p-1 ms-3 mt-1 me-2  alignItems-center rounded-0 " />
                  <span className="device-target-message">
                    Also target browsers with unknown language
                  </span>
                </div>
                {loadingLanguages ? (
                  <div className="text-center py-4">
                    <Spinner size="sm" color="primary" />
                    <span className="ms-2">Loading languages...</span>
                  </div>
                ) : (
                  <DataTable
                    columns={languagecoumns}
                    data={filteredLanguageData}
                    onRowClicked={(row) => setActiveRowId(row.id)}
                    fixedHeaderScrollHeight="200px"
                    fixedHeader
                    striped
                    highlightOnHover
                    conditionalRowStyles={conditionalRowStyles}
                    customStyles={customStyles}
                  />
                )}
              </div>
            </Col>

            <Col className="" md="3">
              <span className="device-sub-heading ms-2 ">Targeted Languages</span>
              <div className="d-flex justify-content-between mt-3 mb-2">
                <button
                  className="device-targetall border conversion-track-btn"
                  type="button"
                  onClick={() => {
                    settargetedlanguagedata([]);
                  }}
                >
                  Remove All
                </button>
                <span className="device-match">{targetedlanguagedata.length} Languages Targeted</span>
              </div>
              <div>
                <DataTable
                  columns={targetlanguagecolumns}
                  data={targetedlanguagedata}
                  fixedHeader
                  fixedHeaderScrollHeight="200px"
                  customStyles={targetedstyles}
                  persistTableHead
                  striped
                  highlightOnHover
                  noDataComponent={null}
                />
              </div>
            </Col>
          </Row>
        )}

        {/* <Row id="devices-section-ua" className="mt-3 mb-2 gap-4 ">
          <Col xs="2" className=" text-end">
            <Label className="device-label text-end">User Agent:</Label>
          </Col>

          <Col className="" md="6">
            <div className="align-items-center ">
              <Input
                type="checkbox"
                id="useragent"
                className="rounded-0 mt-1 me-2"
                checked={formData.targetuser}
                onChange={(e) => {
                  setshowpattern(e.target.checked);
                  setFormData((prev) => (
                    {
                      ...prev,
                      targetuser: e.target.checked
                    }
                  ))
                  if (!e.target.checked) {
                    pattendata = [];
                    setpattern(pattendata);
                    setFormData((prev) => (
                      {
                        ...prev,
                        pattern: []
                      }
                    ))
                    setpatterndata([])
                  }
                  const updateformdata = {
                    ...formData,
                    targetuser: e.target.checked,
                    pattern: pattendata,
                  }
                  props.handledevice(updateformdata);
                }}
              />
              <Label for="useragent" className="m-0 device-useragent ">
                Target Custom User Agent{" "}
              </Label>{" "}
              <br></br>
              {formData.targetuser && (
                <span className="device-useragent">
                  Select which devices and browsers to target. A pattern can use plain text and
                  wildcards "%". For negative targeting, begin a pattern with "!"
                </span>
              )}
            </div>
          </Col>
        </Row> */}

        {formData.targetuser && (
          <>
            <Row className=" mb-3  gap-4">
              <Col xs="2"></Col>
              <Col>
                <Row className="g-2 align-items-center">
                  <Col>
                    <Input
                      placeholder="Enter pattern"
                      className="devices-pattern"
                      id="pattern"
                      onChange={(e) => setpattern(e.target.value)}
                    />
                  </Col>
                  <Col>
                    <div>
                      <button
                        type="button"
                        className="devices-addpattern text-nowrap border-0"
                        onClick={() => {
                          const value = pattern?.trim();

                          if (value) {
                            setpatterndata((prev) => [...prev, value]);

                            setFormData((prev) => {
                              const newFormData = {
                                ...prev,
                                pattern: [...(prev.pattern || []), value],
                              };

                              props.handledevice(newFormData);
                              return newFormData;
                            });

                            setpattern("");
                          } else {
                            setShowPopup(true);
                          }
                        }}
                      >
                        + Add Pattern
                      </button>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
            {showPopup && (
              <div
                style={{
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "#ffffff",
                  width: "260px",
                  padding: "16px",
                  borderRadius: "8px",
                  zIndex: 9999,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                  textAlign: "start",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    color: "",
                    marginBottom: "8px",
                  }}
                >
                  ⚠️{" "}
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "rgb(93, 93, 93)",
                    }}
                  >
                    Warning
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#4b5563",
                    marginBottom: "14px",
                    fontWeight: "400",
                    color: "black",
                  }}
                >
                  Enter valid pattern
                </div>
                <div className="align-items-end d-flex">
                  <button
                    type="button"
                    onClick={() => setShowPopup(false)}
                    style={{
                      backgroundColor: "#63903d",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "6px 18px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
            <Row className="mt-1 mb-5 gap-4 ">
              <Col xs="2"></Col>
              <Col md="6">
                <DataTable
                  columns={patterncolumns}
                  data={patterndata}
                  fixedHeaderScrollHeight="200px"
                  customStyles={patternstyles}
                  persistTableHead
                  striped
                  highlightOnHover
                  noDataComponent={null}
                />
              </Col>
            </Row>
          </>
        )}
      </Col>
    </div>
  );
});

Devices.displayName = 'Devices';

export default Devices;
