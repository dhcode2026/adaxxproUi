import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Col,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  InputGroup,
  Alert,
  Spinner,
  Tooltip
} from "reactstrap";
import { FaCheck } from "react-icons/fa";
import { useViewContext } from "../../ViewContext";
import { Multiselect } from "multiselect-react-dropdown";

import { MultiSelect } from "react-multi-select-component";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DayPartEditor from "./DayPartEditor";
import { FaCaretDown, FaCaretRight, FaCaretUp } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";


import {
  ssp, OsOptions, ssb, goalstrOptions, goalOptions, smartgoalOptions, impressionCapOptions, pacingOptions, captureaudienceOptions, evalutiongroupOptions, evalutionperiodOptions, samplevalueOptions
} from "../../Utils.js";
import "react-form-wizard-component/dist/style.css";
import FormWizard from "react-form-wizard-component";
import LocationModal from "../Modal/LocationModal.jsx";
import SelectDomain from "../Modal/SelectDomain.jsx";
import LinkAdsModal from "../Modal/LinkAdsModal.jsx";
import AudienceModal from "../Modal/AudienceModal.jsx";
import GeoEditor from "./GeoEditor.jsx";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Swal from "sweetalert2";
import ConversionEditor from "../editors/ConversionEditor.jsx";
import DealsEditor from "../editors/DealsEditor.jsx";
import LinkedAdsEditor from "../editors/LinkedAdsEditor.jsx";
import InventoryEditor from "../editors/InventoryEditor.jsx";
import Location from "../editors/Location.jsx";
import Devices from "./Devices.jsx";
import AudienceEditor from "./AudienceEditor.jsx";
import { getAudiencelist, getConversionlist } from "../api/Api.jsx";
var regions = ["US", "APAC", "EUROPE", "Russia"];

var undef;

const CampaignEditorupdate = (props) => {
  const { id } = useParams();

  const [groupid, setgroupid] = useState(id);


  // console.log("props", props);
  const modalRef = useRef();
  const inventoryref = useRef();

  const [tooltipOpen, setTooltipOpen] = useState({
    name: "",
    capspec: "",
    cpm_bid: "",
    capcount: "",
    capexpire: "",
    minimum_bid: "",
    bid_step: "",
    learn_budget: "",
    sample_size_value: "",
    control_group_size: "",
    control_group_sov: "",
    dollar_goal: "",
    dollar_goal1: "",

  });
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [campaign, setCampaign] = useState(props.campaign);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const navigate = useNavigate();
  const [daypartSchedule, setDaypartSchedule] = useState(
    props.campaign?.daypartSchedule
  );
  const vx = useViewContext();
  // "vx<>", vx);
  const [selectedValue, setSelectedValue] = useState([]);
  const [selected, setSelected] = useState([]);
  const [rulesselected, rulessetSelected] = useState([]);
  const [languageselected, languagesetSelected] = useState([]);
  const [creativeselected, creativesetSelected] = useState([]);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [targetModalOpen, setTargetModalOpen] = useState(false);

  const toggleLocationModal = () => setLocationModalOpen(!locationModalOpen);

  const toggletargetModal = () => setTargetModalOpen(!targetModalOpen);

  const [locationval, setlocationval] = useState();

  const [selectedDeviceType, setSelectedDeviceType] = useState("specific");
  const [selectedAllDeviceOption, setSelectedAllDeviceOption] =
    useState("option1");
  const [selectedDevices, setSelectedDevices] = useState({
    desktop: false,
  });
  const [errors, setErrors] = useState({});

  const [activePopup, setActivePopup] = useState({ type: null, index: null });
  const [expanded, setExpanded] = useState({
    region: null,
    subregion: null,
    country: null,
  });
  const [selection, setSelection] = useState({
    regionId: null,
    subregionId: null,
    countryId: null,
    stateId: null,
    cityId: null,
  });

  const [formErrors, setFormErrors] = useState({
    name: "",
    cpm_bid: "",
    minimum_bid: "",
    bid_step: "",
    learn_budget: "",
    sample_size_value: "",
    control_group_size: "",
    control_group_sov: "",
    capcount: "",
    capexpire: "",
    dollar_goal: "",
    dollar_goal1: "",
  });

  const handleconversion = (data) => {
    console.log(data);
    setFormData((prev) => ({
      ...prev,
      consversion: data
    }))
    console.log(formData.consversion)
  }

  const handleChangess = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const CustomReactstrapInput = React.forwardRef(({ value, onClick }, ref) => (
    <Input onClick={onClick} value={value} innerRef={ref} />
  ));

  const handleNext = () => {
    if (step == 3) {
      handledevicedata();
    }
    if (step == 5) {
      handleinventorydata();
    }
    console.log(formData)
    const errors = {
      name: (formData.name || "").trim() ? "" : "this field is required",

      cpm_bid: (formData.cpm_bid || "").trim() ?
        (formData.cpm_bid || "").trim() > 100 ? "Maximum value of the field is $100" : ""
        :
        "this field is required",

      capexpire: Number(formData.capexpire) <= 0
        ? "this field is required"
        : "",
      capcount:
        Number(formData.capcount) <= 0
          ? "This field is required"
          : "",
      startDate: !startDate
        ? "Start date is required"
        : endDate && startDate > endDate
          ? "Start date must be before end date"
          : "",
      endDate: !endDate
        ? "End date is required"
        : startDate && endDate < startDate
          ? "End date must be after start date"
          : "",

      minimum_bid: (formData.minimum_bid || "").trim() ? "" : "This field is required",
      bid_step: (formData.bid_step || "").trim() ? "" : "This field is required",
      learn_budget: (formData.learn_budget || "").trim() ? "" : "This field is required",
      sample_size_value: (formData.sample_size_value || "").trim() ?
        Number(formData.sample_size_value) > 50000 ? "the maximum value of this field is 50000" : ""
        :
        "This field is required",

      control_group_size: (formData.control_group_size || "").trim() ?
        Number(formData.control_group_size) > 99 ? "Maximum value is 99" : ""
        :
        "This field is required",
      control_group_sov: (formData.control_group_sov || "").trim() ? "" : "This field is required",

      dollar_goal: (formData.dollar_goal || "").trim() ? "" : "This field is required",


    };



    console.log("errors:", errors)
    setFormErrors(errors);

    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (!hasErrors) {
      nextStep();
    }
    else {
      showValidationError()
    }
  };

  //const [target, setTarget] = useState(props.target);
  const [geo, setGeo] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [oldValues, setOldValues] = useState(() => {
    const geo = props.campaign?.geo ?? {};
    return JSON.parse(JSON.stringify(geo));
  });

  const [center, setCenter] = useState([44.414165, 8.942184]);
  const [regionss, setRegions] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [subregions, setSubRegions] = useState([]);
  const [country, setCountry] = useState([]);
  const [state, setState] = useState([]);
  const [city, setCity] = useState([]);
  const [showSubRegions, setShowSubRegions] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [showState, setShowState] = useState(false);
  const [showCity, setShowCity] = useState(false);

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [range, setRange] = useState("");
  const [conversionlist, setconversionlist] = useState([]);
  const [audiencecapturedropdown, setaudiencecapturedropdown] = useState([]);
  const campaignid = useParams();

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      latitude,
      longitude,
      range,
    }));
    fetchapi();
  }, [latitude, longitude, range]);

  useEffect(() => {
    console.log("api calling")
  }, [id])

  const fetchapi = async () => {
    const response = await getConversionlist();
    const response2 = await getAudiencelist();


    console.log(response2)
    const conversions = response?.data?.data?.informationConversion;
    setconversionlist(Array.isArray(conversions) ? conversions : []);

    const audiences = response2?.data?.data?.informationAudiences;
    setaudiencecapturedropdown(Array.isArray(audiences) ? audiences : []);

  }

  const [searchTerms, setSearchTerms] = useState({
    region: "",
    subregion: "",
    country: "",
    state: "",
    city: "",
  });

  const [showNoSubregionPopup, setShowNoSubregionPopup] = useState(false);
  const [showNoCountryPopup, setShowNoCountryPopup] = useState(false);
  const [showNoStatePopup, setShowNoStatePopup] = useState(false);
  const [showNoCityPopup, setShowNoCityPopup] = useState(false);
  const [selectedCities, setSelectedCities] = useState([]);
  const [showDaypart, setShowDaypart] = useState(false);
  const [impressionCapType, setImpressionCapType] = useState("None");
  const [impressionCapValue, setImpressionCapValue] = useState("");
  const [goalType, setGoalType] = useState("Cost Per Click (eCPC)");
  const [goalValue, setGoalValue] = useState("");
  const [pacingType, setPacingType] = useState("Budget");
  const [pacingValue, setPacingValue] = useState("");
  const [smartgoalType, smartsetGoalType] = useState("Cost Per Click (eCPC)");
  const [smartgoalValue, smartsetGoalValue] = useState("");
  const [audienceType, setAudienceType] = useState("Testing");
  const [audienceType_25, setAudienceType_25] = useState("Testing");
  const [audienceType_50, setAudienceType_50] = useState("Testing");
  const [audienceType_75, setAudienceType_75] = useState("Testing");
  const [audienceType_100, setAudienceType_100] = useState("Testing");
  const [audienceType1, setAudienceType1] = useState("Testing");
  const [goalstr, setGoalStr] = useState("CTR");
  const [evalutiongroup, setEvalutionGroup] = useState("Control Group");
  const [evalutionperiod, setEvalutionPeriod] = useState("18 hours");
  const [samplevalue, setSamplevalue] = useState("Conversion");

  const evalutiongroupOptions = [
    { label: "Control Group", value: "Control Group" },
    { label: "Challange Group", value: "Challange Group" }
  ];

  const filteredRegions = regionss.filter((region) =>
    region.name.toLowerCase().includes(searchTerms.region.toLowerCase())
  );

  const filteredSubregions = subregions.filter((sub) =>
    sub.name.toLowerCase().includes(searchTerms.subregion.toLowerCase())
  );

  const filteredCountry = country.filter((country) =>
    country.name.toLowerCase().includes(searchTerms.country.toLowerCase())
  );

  const filteredStates = state.filter((state) =>
    state?.name.toLowerCase().includes(searchTerms.state.toLowerCase())
  );

  const filteredCities = city.filter((city) =>
    city.name.toLowerCase().includes(searchTerms.city.toLowerCase())
  );

  useEffect(() => {
    const hasValidIds = filteredSubregions.some((s) => s.id);
    if (!hasValidIds && selection.regionId) {
      const timer = setTimeout(() => {
        setShowNoSubregionPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoSubregionPopup(false);
    }
  }, [filteredSubregions, selection.regionId]);

  useEffect(() => {
    const hasValidIds = filteredCountry.some((c) => c.id);
    if (!hasValidIds && selection.subregionId) {
      const timer = setTimeout(() => {
        setShowNoCountryPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoCountryPopup(false);
    }
  }, [filteredCountry, selection.subregionId]);

  useEffect(() => {
    const hasValidIds = filteredStates.some((s) => s.id);
    if (!hasValidIds && selection.countryId) {
      const timer = setTimeout(() => {
        setShowNoStatePopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoStatePopup(false);
    }
  }, [filteredStates, selection.countryId]);

  useEffect(() => {
    const hasValidIds = filteredCities.some((c) => c.id);
    if (!hasValidIds && selection.stateId) {
      const timer = setTimeout(() => {
        setShowNoCityPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoCityPopup(false);
    }
  }, [filteredCities, selection.stateId]);

  const substeps = [
    { key: "video", label: "Video" },
    { key: "audio", label: "Audio" },
    { key: "capture", label: "Audience Capture" },
  ];

  const [activeStep, setActiveStep] = useState("video");
  const initialGoal = 1;

  const goalValues = {
    0: "$1.00",
    1: "$5.00",
    2: "$10.00",
    3: "$15.00",
    4: "$20.00",
    5: "$25.00",
  };

  const initialFormData = {
    advanced_audio: "",
    advanced_video: "",
    page_position: "",


    devices_data: {},
    groupid: groupid,
    consversion: [],
    dollar_goal1: "",
    sample_value: "Conversion",
    evalution_period: "18",
    evalution_group: "Challange_group",
    goal_str: "CTR",
    initialStatus: "On",
    name: "",
    ad_domain: "",
    status: "Offline",
    forensiq: "true",
    regions: "US",
    cpm_bid: "",
    target_id: "",
    total_budget: "$ 100.00",
    budget_limit_daily: "",
    budget_limit_hourly: "",
    capspec: "0",
    capcount: "1",
    capexpire: "3",
    capunit: "seconds",

    rules: [],
    optimize: "0",
    goal: initialGoal.toString(),
    dollar_goal: goalValues[initialGoal],
    creatives: [],
    region_id: "",
    subregion_id: "",
    exclude_ads_txt: "",
    target_direct: "",
    opt_made: "",
    opt_supply: "",
    start_date: "",
    end_date: "",
    country_id: "",
    state_id: "",
    city_id: "",
    device_type: "all",
    all_time: "1",
    pacing: "1",
    service_provider: "0",
    even_spend: "1",
    provider: "1",
    optimize_domain: "0",
    minimum_bid: "$ 100.00",
    bid_step: "$0.01",
    learn_budget: "$400.00",
    track_conversions: "0",
    learning_scope: "1",
    measure_viewability: "0",
    standard: "1",
    orientation_matching: "1",

    usebid: false,
    bid_shading: "0",
    smart_disable: "1",
    impression_threshold: "1000",




    make: [],
    model: [],
    category: [],
    carrier: "all",


    flight_date: "0",
    impressionCapValue: "$100.00",
    sample_size_value: "10,000",
    control_group_size: "20%",
    control_group_sov: "78%",

    placement_type: {
      instream: "",
      Accompanying: "",
      Standalone: "",
      Unknown: "",
      Interstitial: "",
    },
    roll_position: {
      preroll: "",
      midroll: "",
      postroll: "",
      unknown: "",
    },
    capture_conversion: {
      Conversions: "",
    },
    player_size: {
      small_player: "",
      unknown_player: "",
    },
    skippable_ads: {
      Skippable: "",
      Non_skippable: "",
      Skippability: "",
    },
    playback_method: {
      soundOn: "",
      soundOff: "",
      click_to_play: "",
      Mouseover: "",
      Playback: "",
    },
    reward_status: {
      Rewarded: "",
      Unrewarded: "",
      UnknownReward: "",
    },
    orientation_matching: "0",

    audience_capture: {
      Clicks: "",
      Conversions: "",
      Audio: "",
    },
    audio: {
      music: "true",
      fm_am: "true",
      Podcast: "true",
      catch_up: "true",
      web: "true",
      video: "true",
      text: "true",
      feed: "true",
    },

    page_fold: {
      above_fold: true,
      below_fold: true,
      page_unknown: true,
    },

    price: 0,
    iab_category: [],
    location_targets: [],
    latitude: [],
    longitude: [],
    range: [],
    language: [],
    click_through_conversion: true,
    look_back_window: "30",
    look_back_window1: "30",
    view_through_conversion: true,
    conversion_at: "100",
    chrome_privacy: true,
    count_conversion: "1",
    conversion_user: "2 Days",
    cross_device: false,
    impression_cap: "None",
    Flight_startdate: startDate,
    Flight_enddate: endDate,
    goal_status: "",
    sampling_rate: "",

    Capture_Clicks: "",
    Capture_Conversions: "",
    complete_25: "",
    complete_50: "",
    complete_75: "",
    complete_100: "",


  };

  const [openExchanges, setOpenExchanges] = useState(false);
  const [isAllExchangesSelected, setIsAllExchangesSelected] = useState(false);
  const toggleSelectAllExchanges = () => {
    if (isAllExchangesSelected) {
      setFormData({ ...formData, exchanges: [] });
      setIsAllExchangesSelected(false);
    } else {
      const allValues = getSelectedExchangeOptions().map((o) => o.value);
      setFormData({ ...formData, exchanges: allValues });
      setIsAllExchangesSelected(true);
    }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [openRules, setOpenRules] = useState(false);


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

  const handleCheckboxChange = (e, cityId) => {
    const isChecked = e.target.checked;
    const cityIdStr = String(cityId);
    setSelectedCities((prevSelected) => {
      let updatedCities;
      if (isChecked) {
        updatedCities = [...prevSelected, cityIdStr];
      } else {
        updatedCities = prevSelected.filter((id) => id !== cityIdStr);
      }
      setFormData((prev) => {
        const existing = prev.location_targets || [];

        const updated = existing.map((entry) => {
          if (entry.region_id === selection.regionId) {
            return {
              ...entry,
              city_id: updatedCities,
            };
          }
          return entry;
        });

        return {
          ...prev,
          location_targets: updated,
        };
      });

      return updatedCities;
    });
  };

  const toArray = (val) => {
    if (Array.isArray(val)) return val.map((s) => String(s).trim());
    if (typeof val === "string") return val.split(",").map((s) => s.trim());
    return [];
  };

  const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";

  useEffect(() => {
    const camp = props?.campaign; // safer
    if (
      camp &&
      camp.geo !== undefined &&
      camp.geo.length !== 0 &&
      camp.geo[0] !== 0
    ) {
      setGeo(camp.geo);
      setZoom(8);
      setCenter([camp.geo[0], camp.geo[1]]);
    } else {
      setGeo([]);
      setZoom(1);
      setCenter([44.414165, 8.942184]);
    }
  }, [props.campaign]);


  const updateGeo = (pos) => {
    if (pos === undef) {
      if (oldValues === undef) pos = [];
      else pos = oldValues;
    }

    for (var i = pos.length - 3; i >= 0; i -= 3) {
      if (pos[i] === 0) {
        pos.splice(i, 3);
      }
    }
    campaign.geo = pos;
    setCampaign(campaign);
    redraw();
  };

  useEffect(() => {
    const fetchRegions = async () => {
      const data = await vx.listRegions();
      console.log("Regions fetched:", data);
      setRegions(data || []);
    };

    if (vx.loggedIn) {
      fetchRegions();
    }
  }, [vx.loggedIn]);

  useEffect(() => {
    const fetchRegions = async () => {
      const data = await vx.listRegions();
      console.log("Regions fetched:", data);
      setRegions(data || []);
    };

    if (vx.loggedIn) {
      fetchRegions();
    }
  }, [vx.loggedIn]);

  useEffect(() => {
    const fetchLanguages = async () => {
      const data = await vx.listLanguages();
      console.log("Languages fetched:", data);
      setLanguages(data || []);
    };
    if (vx.loggedIn) {
      fetchLanguages();
    }
  }, [vx.loggedIn]);

  const fetchSubRegions = async (regionId) => {
    const data = await vx.listSubRegions(regionId);
    console.log("subRegions fetched:", data);
    setSubRegions(data || []);
    setShowSubRegions(true);
  };

  const fetchCountry = async (subregionsId) => {
    const data = await vx.listCountry(subregionsId);
    console.log("country fetched:", data);
    setCountry(data || []);
    setShowCountry(true);
  };

  const fetchState = async (countryId) => {
    const data = await vx.listState(countryId);
    console.log("state fetched:", data);
    setState(data || []);
    setShowState(true);
  };

  const fetchCity = async (regionsId) => {
    const data = await vx.listCity(regionsId);
    console.log("state fetched:", data);
    setCity(data || []);
    setShowCity(true);
  };

  const handledevicedata = () => {

    const data = modalRef.current.handledevicedata();
    console.log("Received from child:", data);

    setFormData((prev) => (
      {
        ...prev,
        "devices_data": {
          ...data,
        }

      }
    ))
    console.log(formData);
  }

  const handleinventorydata = () => {
    const inventorydata = inventoryref.current.inventorydata();
    console.log("received:", inventorydata);
    setFormData((prev) => (
      {
        ...prev,
        "inventory_data": {
          ...inventorydata
        }
      }
    ))
    console.log(formData)
  }

  const [selectedIndex, setSelectedIndex] = useState(0);

  const rows = ["Deals (0)", "Deals Groups (0)"];

  const [selectedSupply, setSelectedSupply] = useState({
    desktops: false,
  });

  const [selectedModelOption, setSelectedModelOption] = useState("allmodels");

  const [selectedModelosOption, setSelectedModelosOption] =
    useState("osspecificModels");
  const [selectedModelbrowserOption, setSelectedModelbrowserOption] =
    useState("browserallmodels");
  const [selectedModellanguageOption, setSelectedModellanguageOption] =
    useState("languagespecificModels");



  const [entries, setEntries] = useState([
    {
      ostype: campaign?.ostype || "Windows Phone",
      minVersion: "",
      maxVersion: "",
    },
  ]);

  const handleAddEntry = () => {
    setEntries([
      ...entries,
      { ostype: campaign?.ostype, minVersion: "", maxVersion: "" },
    ]);
  };

  const handleChanges = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
  };

  const handleRemoveEntry = (index) => {
    const newEntries = [...entries];
    newEntries.splice(index, 1);
    setEntries(newEntries);
  };

  const [options, setOptions] = useState([
    { name: "Option 1" },
    { name: "Option 2" },
    { name: "Option 3" },
  ]);
  const onSelect = (selectedList, selectedItem) => {
    setSelectedValue(selectedList);
  };

  const onRemove = (selectedList, removedItem) => {
    setSelectedValue(selectedList);
  };

  const [step, setStep] = useState(0);

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "radio" ? (checked ? value : prev[name]) : value,
    }));
    console.log("formdata", formData)
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 7));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const steps = [
    "General",
    "Deals",
    "Locations",
    "Devices",
    "Audience",
    "Inventory",
    "Linked Ads",
    "Summary",
  ];


  const getAttachedCreatives = () => {
    const items = [];

    if (!vx || !vx.creatives || !Array.isArray(vx.creatives)) return items;
    if (!campaign) return items;

    for (let x of vx.creatives) {
      if (!x || !x.type || !x.name) continue;
      items.push({
        label: `${x.type} - ${x.name}`,
        value: x.name,
      });
    }
    return items;
  };

  useEffect(() => {
    if (!vx || !vx.creatives || !Array.isArray(vx.creatives)) return;
    if (!campaign) return;

    const selected = getAttachedCreatives().filter((opt) =>
      vx.creatives.find(
        (cr) =>
          cr.name === opt.value && campaign[cr.type + "s"]?.includes(cr.id)
      )
    );
    creativesetSelected(selected);
  }, [vx.creatives, campaign]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      city_id: selectedCities,
    }));
  }, [selectedCities]);

  useEffect(() => {
    const initSelected = campaign?.exchanges.map((e) => ({
      label: e.toUpperCase(),
      value: e,
    }));
    setSelected(initSelected);
  }, [campaign]);

  const [locationInfo, setLocationInfo] = useState({
    latitude: "",
    longitude: "",
    range: "",
  });

  const [geoPoints, setGeoPoints] = useState([]);

  const change = (e, key, index) => {
    let value = e.target.value;

    if (["lat", "lon", "range"].includes(key)) {
      value = parseFloat(value);
      if (isNaN(value)) value = "";
    }

    setGeoPoints((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [key]: value,
      };
      return updated;
    });
  };

  useEffect(() => {
    if (!campaign) return;

    const parsedCampaign =
      typeof campaign === "string" ? JSON.parse(campaign) : campaign;
    console.log("Parsed Campaign:", parsedCampaign);

    const locationTargets = parsedCampaign.location_targets || [];
    console.log("Parsed location:", locationTargets);

    const mappedLocationTargets = locationTargets.map((loc) => ({
      ...loc,
      latitudes: loc.latitudes || [],
      longitudes: loc.longitudes || [],
      ranges: loc.ranges || [],
    }));
    console.log("Mapped location:", mappedLocationTargets);

    // ✅ Build geoPoints outside if-block
    const geoPoints = mappedLocationTargets.flatMap((loc) => {
      const points = [];
      const latitudes = loc.latitudes || [];
      const longitudes = loc.longitudes || [];
      const ranges = loc.ranges || [];

      for (let i = 0; i < latitudes.length; i++) {
        const lat = latitudes[i];
        const lon = longitudes[i] ?? "";
        const range = ranges[i] ?? "";
        points.push({ lat, lon, range });
      }
      return points;
    });

    setGeoPoints(geoPoints);

    if (mappedLocationTargets.length > 0) {
      const firstTarget = mappedLocationTargets[0];

      setLocationInfo({
        latitude: firstTarget.latitudes?.[0] ?? "",
        longitude: firstTarget.longitudes?.[0] ?? "",
        range: firstTarget.ranges?.[0] ?? "",
      });

      setSelection({
        regionId: firstTarget.region_id,
        subregionId: firstTarget.subregion_id ?? null,
        countryId: firstTarget.country_id ?? null,
        stateId: firstTarget.state_id ?? null,
        cityId: firstTarget.city_id?.[0] ?? null,
        latitude: firstTarget.latitudes?.[0] ?? null,
        longitude: firstTarget.longitudes?.[0] ?? null,
        range: firstTarget.ranges?.[0] ?? null,
      });

      if (firstTarget.region_id) fetchSubRegions(firstTarget.region_id);
      if (firstTarget.subregion_id) fetchCountry(firstTarget.subregion_id);
      if (firstTarget.country_id) fetchState(firstTarget.country_id);
      if (firstTarget.state_id) fetchCity(firstTarget.state_id);
    }

    // Collect IDs
    const regionIds = mappedLocationTargets.map((loc) => loc.region_id);
    const subregionIds = mappedLocationTargets.map((loc) => loc.subregion_id);
    const countryIds = mappedLocationTargets.map((loc) => loc.country_id);
    const stateIds = mappedLocationTargets.map((loc) => loc.state_id);
    const cityIds = mappedLocationTargets.flatMap((loc) => loc.city_id);

    const budget = parsedCampaign.budget ?? {};

    const preSelected = getSelectedBrowserOptions().filter((option) =>
      (parsedCampaign.browsers || []).includes(option.value)
    );

    const apiLanguages = (parsedCampaign.browser_languages || []).map(Number);
    const preSelectedLanguages = getSelectedLanguageOptions().filter((option) =>
      apiLanguages.includes(Number(option.value))
    );

    const cleanIabCategories = (parsedCampaign.iab_category || []).map(
      (cat) => cat.replace(/[{}]/g, "") // remove { and }
    );

    const preSelectedCategories = getSelectedCategoryvalueOptions().filter(
      (option) => cleanIabCategories.includes(option.value)
    );

    // Other arrays
    const placementArr = toArray(parsedCampaign.placement_type);
    const rollArr = toArray(parsedCampaign.roll_position).map((v) =>
      v.trim().toLowerCase()
    );
    const playerSizeArr = toArray(parsedCampaign.player_size);
    const playbackArr = toArray(parsedCampaign.playback_method);
    const rewardArr = toArray(parsedCampaign.reward_status);

    const audioArr = parsedCampaign.audio
      ? parsedCampaign.audio.split(",").map((v) => v.trim())
      : [];

    const audienceArr = Array.isArray(parsedCampaign.audience_capture)
      ? parsedCampaign.audience_capture
      : typeof parsedCampaign.audience_capture === "string"
        ? parsedCampaign.audience_capture.split(",").map((v) => v.trim())
        : [];

    const skippableArr =
      typeof parsedCampaign.skippable_ads === "string"
        ? parsedCampaign.skippable_ads.split(",").map((item) => item.trim())
        : [];

    const targetId = Array.isArray(parsedCampaign.target_id)
      ? parsedCampaign.target_id
      : [parsedCampaign.target_id ?? ""];
    setSelectedCities(
      mappedLocationTargets.flatMap((loc) =>
        Array.isArray(loc.city_id) ? loc.city_id.map((id) => String(id)) : []
      )
    );
    const geoArray = geoPoints.flatMap((p) => [p.lat, p.lon, p.range]);
    setGeo(geoArray);
  }, [campaign]);

  const handleGeoChange = (updatedGeo) => {
    console.log("Updated geo from editor:", updatedGeo);
    setGeo(updatedGeo);
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      latitude: geoPoints.map((p) => p.lat),
      longitude: geoPoints.map((p) => p.lon),
      range: geoPoints.map((p) => p.range),
    }));
  }, [geoPoints]);

  useEffect(() => {
    if (campaign?.os_versions?.length > 0) {
      setEntries(
        campaign.os_versions.map((os) => ({
          ostype: os.ostype || "Windows Phone",
          minVersion: os.minVersion || "",
          maxVersion: os.maxVersion || "",
        }))
      );
    }
  }, [campaign]);

  const getSelectedExchangeOptions = () => {
    return ssp.map((x) => ({
      label: x,
      value: x.toLowerCase(),
    }));
  };

  const defaultCampaign = { browser: [] };
  useEffect(() => {
    if (campaign?.browser?.length) {
      const initSelected = campaign.browser.map((e) => ({
        label: e.toUpperCase(),
        value: e,
      }));
      setSelected(initSelected);
    }
  }, [campaign]);

  const getSelectedBrowserOptions = () => {
    return (ssb || []).map((x) => ({
      label: x,
      value: x.toLowerCase(),
    }));
  };

  const getIdOf = (name) => {
    for (var i = 0; i < vx.targets.length; i++) {
      var x = vx.targets[i];
      if (x.name === name) return x.id;
    }
    return 0;
  };

  const [selectedRowId, setSelectedRowId] = useState(null);

  const [rowData, setRowData] = useState([]);

  const [selectedHeader, setSelectedHeader] = useState(null);

  const handleHeaderClick = (index) => {
    setSelectedHeader(index);
  };

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(false);

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
        valA =
          valA !== null && valA !== undefined
            ? valA.toString().toLowerCase()
            : "";
        valB =
          valB !== null && valB !== undefined
            ? valB.toString().toLowerCase()
            : "";
        if (valA < valB) return direction === "asc" ? -1 : 1;
        if (valA > valB) return direction === "asc" ? 1 : -1;
        return 0;
      });
      setRowData(sorted);
      setSortConfig({ key, direction });
      setLoading(false);
    }, 900);
  };

  const [columnWidths, setColumnWidths] = useState({
    actions: 120,
    name: 150,
    list_type: 150,
    domain_count: 100,
  });

  const guideLineRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const resizingCol = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

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

    // Optional: prevent text selection while dragging
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
    const newWidth = Math.max(startWidth.current + dx, 50); // min 50px

    setColumnWidths((prev) => ({
      ...prev,
      [resizingCol.current]: newWidth,
    }));

    guideLineRef.current.style.display = "none";
    resizingCol.current = null;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = ""; // restore text selection
  };

  useEffect(() => {
    if (!loading && rowData.length > 0) {
      setSelectedRowId(rowData[0].id);
    }
  }, [loading, rowData]);

  const addNewCampaign = async () => {
    console.log("formdata", formData);
    console.log(formData.total_budget)

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save this Campaign?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, save it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsLoading(true);

    try {

      console.log("old vlaue = ", formData);
      console.log(formData.total_budget, formData.budget_limit_daily, formData.budget_limit_hourly);


      const x = { ...campaign };
      x.group_id = formData.groupid;


      // x.id = 0; // Remove for new campaigns
      x.name = formData.name;
      x.ad_domain = formData.ad_domain;
      x.bid_shading = formData.bid_shading;
      x.cross_device = formData.cross_device;

      x.all_time = formData.all_time;
      x.impression_cap = formData.impression_cap;
      x.flight_startdate = formData.Flight_startdate;
      x.flight_enddate = formData.Flight_enddate;
      x.service_provider = formData.service_provider;
      x.track_conversions = formData.track_conversions;
      x.conversion = formData.consversion;
      x.click_through_conversion = formData.click_through_conversion;
      x.view_through_conversion = formData.view_through_conversion;
      x.look_back_window = formData.look_back_window;
      x.look_back_window1 = formData.look_back_window1;
      x.conversion_at = formData.conversion_at;
      x.count_conversion = formData.count_conversion;
      x.measure_viewability = formData.measure_viewability;
      x.standard = formData.standard;
      x.optimize_domain = formData.optimize_domain;
      x.optimization_settings = formData.optimization_settings;
      x.measure_viewability = formData.measure_viewability;
      x.brand_Protection = formData.brand_Protection;
      x.advanced_audio = formData.advanced_audio;


      x.page_position = formData.page_position;
      x.advanced_audio = formData.advanced_audio;
      x.advanced_video = formData.advanced_video;
      x.add_optimization = formData.ad_optimization;
      x.minimum_bid = formData.minimum_bid;
      x.bid_step = formData.bid_step;
      x.impression_threshold = formData.impression_threshold;
      x.smart_disable = formData.smart_disable;
      x.learn_budget = formData.learn_budget;
      x.usebid = formData.usebid;
      x.above_fold = formData.page_fold.above_fold;
      x.below_fold = formData.page_fold.below_fold;
      x.page_unknown = formData.page_fold.page_unknown;



      x.above_fold = formData.page_fold.above_fold;
      x.below_fold = formData.page_fold.below_fold;
      x.page_unknown = formData.page_fold.page_unknown;



      x.goal_str = formData.goal_str;
      x.evalution_group = formData.evalution_group;
      x.evalution_period = formData.evalution_period;
      x.sample_size_value = formData.sample_size_value;
      x.sample_value = formData.sample_value;
      x.control_group_size = formData.control_group_size;
      x.control_group_sov = formData.control_group_sov;
      x.sandbox_attribution = formData.sandbox_attribution;
      x.conversion_user = formData.conversion_user;
      x.sampling_rate = formData.sampling_rate;
      x.page_fold = formData.page_fold;




      x.placement_type = {
        instream: formData.placement_type.instream,
        Accompanying: formData.placement_type.Accompanying,
        Standalone: formData.placement_type.Standalone,
        Unknown: formData.placement_type.Unknown,
        Interstitial: formData.placement_type.Interstitial,
      };

      x.notes = formData.notes;








      const budgetString = formData.total_budget;
      const cleaned = budgetString.replace("$", "").trim();
      const budgetNumber = Number(cleaned);
      if (isNaN(budgetNumber)) {
        throw new Error("Invalid total budget value");
      }
      x.total_budget = budgetNumber;

      x.budget_limit_daily = Number(formData.budget_limit_daily);
      x.budget_limit_hourly = Number(formData.budget_limit_hourly);
      x.regions = formData.regions === "US";

      x.capspec = formData.capspec;
      x.capexpire =
        formData.capexpire === "" ? undefined : Number(formData.capexpire);
      x.capcount =
        formData.capcount === "" ? undefined : Number(formData.capcount);
      x.capunit = formData.capunit;
      x.cpm_bid = formData.cpm_bid;

      x.status = formData.status;
      x.forensiq = formData.forensiq;
      x.exclude_ads_txt = Boolean(formData.exclude_ads_txt);
      x.target_direct = Boolean(formData.target_direct);
      x.opt_supply = formData.opt_supply;
      x.opt_made = formData.opt_made;
      x.device_type = formData.devices_data.device_type;
      x.iab_category = formData.iab_category.map((c) => c.value);
      //x.city_id = formData.city_id;

      x.roll_position = {
        preroll: formData.roll_position.preroll,
        midroll: formData.roll_position.midroll,
        postroll: formData.roll_position.postroll,
        unknown: formData.roll_position.unknown,
      }; //player_size
      x.player_size = {
        small_player: formData.player_size.small_player,
        unknown_player: formData.player_size.unknown_player,
      };
      x.skippable_ads = {
        Skippable: formData.skippable_ads.Skippable,
        Non_skippable: formData.skippable_ads.Non_skippable,
        Skippability: formData.skippable_ads.Skippability,
      };
      x.playback_method = {
        soundOn: formData.playback_method.soundOn,
        soundOff: formData.playback_method.soundOff,
        click_to_play: formData.playback_method.click_to_play,
        Mouseover: formData.playback_method.Mouseover,
        Playback: formData.playback_method.Playback,
      };
      x.reward_status = {
        Rewarded: formData.reward_status.Rewarded,
        Unrewarded: formData.reward_status.Unrewarded,
        UnknownReward: formData.reward_status.UnknownReward,
      };
      x.orientation_matching = formData.orientation_matching;
      x.audience_capture = {
        Clicks: formData.audience_capture.Clicks,
        Conversions: formData.audience_capture.Conversions,
        Audio: formData.audience_capture.Audio,
      };
      x.audio = {
        music: formData.audio.music,
        fm_am: formData.audio.fm_am,
        Podcast: formData.audio.Podcast,
        catch_up: formData.audio.catch_up,
        web: formData.audio.web,
        video: formData.audio.video,
        text: formData.audio.text,
        feed: formData.audio.feed,
      };

      x.complete_25 = formData.complete_25;
      x.complete_50 = formData.complete_50;
      x.complete_75 = formData.complete_75;
      x.complete_100 = formData.complete_100;

      //My Try
      x.price = formData.price;
      x.desktop = formData.devices_data.selectedDevices.desktop;
      x.phone = formData.devices_data.selectedDevices.phone;
      x.tablet = formData.devices_data.selectedDevices.tablet;
      x.connected_tv = formData.devices_data.selectedDevices.connected_tv;
      x.model_option = formData.model_option;
      x.all_makes = formData.devices_data.all_makes;
      x.flight_date = formData.flight_date;
      x.optimize = formData.optimize;
      x.goal_status = formData.goal_status;
      x.dollar_goal = formData.dollar_goal || formData.dollar_goal1;
      x.provider = formData.provider;
      x.primary_conversion = formData.primary_conversion;
      x.chrome_privacy = formData.chrome_privacy;


      //x.location_targets = formData.region_id;
      x.location_targets = formData.location_targets || [];
      const latitude = [];
      const longitude = [];
      const range = [];

      for (let i = 0; i < geo.length; i += 3) {
        latitude.push(geo[i]);
        longitude.push(geo[i + 1]);
        range.push(geo[i + 2]);
      }
      x.latitude = latitude;
      x.longitude = longitude;
      x.range = range;

      x.carrier = formData.carrier;

      x.browser_language_option = formData.devices_data.browser_language_option;
      x.browser_languages =
        formData.devices_data.browser_language_option === "languagespecificModels"
          ? formData.devices_data.browser_languages.flat()
          : [];
      x.selected_devices = x.device_type != "all"
        ? Object.keys(formData.devices_data.selectedDevices).filter(
          (device) => formData.devices_data.selectedDevices[device]
        )
        : [];
      x.browser_option = formData.devices_data.browser_option;
      x.browsers =
        formData.devices_data.browser_option === "browserspecificModels"
          ? formData.devices_data.browsers.flat()
          : [];

      const getIdOf = (target_id) => (target_id ? 123 : 0);
      let tid = getIdOf(formData.target_id);
      //x.target_id = tid === '' ? 0 : tid;make
      x.target_id = formData.target_id;

      // x.exchanges = formData.exchanges.map(opt => opt.value);
      x.exchanges = formData.inventory_data;
      x.targetting = {
        ...formData.devices_data,

      };

      // {
      //   inventory : formData.inventory_data||" ",
      // }







      // x.rules = formData.rules.map(opt => opt.value);
      x.rules = formData.rules;
      const cnames = formData.creatives.map((opt) => opt.value);

      x.banners = [];
      x.videos = [];
      x.audios = [];
      x.natives = [];
      x.creatives = [];

      for (let i = 0; i < cnames.length; i++) {
        const name = cnames[i];
        const cr = vx.findCreativeByName(name);
        if (!cr) {
          alert("DB problem, creative: " + name + " is missing");
          setIsLoading(false);
          return;
        }
        switch (cr.type) {
          case "banner":
            x.banners.push(cr.id);
            break;
          case "video":
            x.videos.push(cr.id);
            break;
          case "audio":
            x.audios.push(cr.id);
            break;
          case "native":
            x.natives.push(cr.id);
            break;
          default:
            alert("Type " + cr.type + " unknown for creative " + cr.name);
            setIsLoading(false);
            return;
        }
      }

      const copy = campaign ? JSON.parse(JSON.stringify(campaign)) : {};
      x.banners_delete = (copy.banners || []).filter(
        (b) => !x.banners.includes(b)
      );
      x.videos_delete = (copy.videos || []).filter(
        (v) => !x.videos.includes(v)
      );
      x.audios_delete = (copy.audios || []).filter(
        (a) => !x.audios.includes(a)
      );
      x.natives_delete = (copy.natives || []).filter(
        (n) => !x.natives.includes(n)
      );


      x.os_versions = formData.devices_data.os;
      // setEntries([{ ostype: campaign.ostype, minVersion: "", maxVersion: "" }]);
      setEntries([
        {
          ostype: campaign?.ostype || "Windows Phone",
          minVersion: "",
          maxVersion: "",
        },
      ]);

      if (startDate != null) {
        x.date = [startDate.getTime(), endDate.getTime()];
      }

      x.activate_time = startDate.getTime();
      x.expire_time = endDate.getTime();

      if (
        daypartSchedule === undefined ||
        daypartSchedule === null ||
        daypartSchedule.length === 0
      ) {
        x.day_parting_utc = null; // or undefined
      } else {
        x.day_parting_utc = JSON.stringify(daypartSchedule);
        if (x.day_parting_utc.indexOf("1") < 0) {
          x.day_parting_utc = null; // or undefined
        }
      }

      console.log("Final campaign object:", x);

      await vx.addNewCampaign(JSON.stringify(x));    // api calling

      setCampaign(null);
      setFormData(initialFormData);
      setDaypartSchedule(null);
      setIsLoading(false);

      Swal.fire({
        icon: "success",
        title: "Campaign Saved!",
        text: "Your campaign was saved successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
      });
    }
  };

  const [openBidderStatus, setOpenBidderStatus] = useState(false);
  const [openFraud, setOpenFraud] = useState(false);
  const [openInitialStatusDropdown, setOpenInitialStatusDropdown] =
    useState(false);

  const [openTimebase, setOpenTimebase] = useState(false);
  const [openPacingStatus, setOpenPacingStatus] = useState(false);
  const [openGoalStatus, setOpenGoalStatus] = useState(false);
  const [smartopenGoalStatus, smartsetOpenGoalStatus] = useState(false);
  const [openaudienceStatus, setOpenAudienceStatus] = useState(false);
  const [openaudienceStatus1, setOpenAudienceStatus1] = useState(false);
  const [open25audienceStatus, setOpen25AudienceStatus] = useState(false);
  const [open50audienceStatus, setOpen50AudienceStatus] = useState(false);
  const [open75audienceStatus, setOpen75AudienceStatus] = useState(false);
  const [open100audienceStatus, setOpen100AudienceStatus] = useState(false);
  const [opengoalstar, setOpenGoalstr] = useState(false);
  const [openevalutiongroup, setOpenEvalutiongroup] = useState(false);
  const [openevalutionperiod, setOpenEvalutionperiod] = useState(false);
  const [opensamplevalue, setOpenSampleValue] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      const wrappers = [
        "bidder-status-wrapper",
        "fraud-dropdown-wrapper",
        "rules-wrapper",
        "audiencepercentage",
        "audience50percentage",
        "audience75percentage",
        "audience100percentage",
        "goal_ctr",
        "evalution_group",
        "evalution_period",
        "sample_value",
        "optimizestatus",
        "optimizestatussmartbid",
        "exchanges-wrapper",
        "timebase-wrapper",
        "model-wrapper",
        "make-wrapper",
        "browser-wrapper",
        "language-wrapper",
        "iab-wrapper",
        "pacedelivery",
        "impressioncap",
      ];

      const clickedInsideAny = wrappers.some((id) => {
        const el = document.getElementById(id);
        if (!el) return false;
        return (
          el.contains(event.target) ||
          event.target.closest(".custom-dropdown-option")
        );
      });
      if (!clickedInsideAny) {
        setOpenBidderStatus(false);
        setOpenPacingStatus(false);
        setOpenGoalStatus(false);
        smartsetOpenGoalStatus(false);
        setOpenAudienceStatus(false);
        setOpen25AudienceStatus(false);
        setOpen50AudienceStatus(false);
        setOpen75AudienceStatus(false);
        setOpen100AudienceStatus(false);
        setOpenGoalstr(false);
        setOpenEvalutiongroup(false);
        setOpenEvalutionperiod(false);
        setOpenSampleValue(false);
        setOpenFraud(false);
        setOpenRules(false);
        setOpenExchanges(false);
        setOpenTimebase(false);
        setOpenModels(false);
        setOpenMakes(false);
        setOpenBrowsers(false);
        setOpenLanguages(false);
        setOpenIab(false);
      }
    }

    function handleEsc(event) {
      if (event.key === "Escape") {
        setOpenBidderStatus(false);
        setOpenPacingStatus(false);
        setOpenGoalStatus(false);
        smartsetOpenGoalStatus(false);
        setOpenAudienceStatus(false);
        setOpen25AudienceStatus(false);
        setOpen50AudienceStatus(false);
        setOpen75AudienceStatus(false);
        setOpen100AudienceStatus(false);
        setOpenGoalstr(false);
        setOpenEvalutiongroup(false);
        setOpenEvalutionperiod(false);
        setOpenSampleValue(false);
        setOpenRules(false);
        setOpenExchanges(false);
        setOpenTimebase(false);
        setOpenModels(false);
        setOpenMakes(false);
        setOpenBrowsers(false);
        setOpenLanguages(false);
        setOpenIab(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const getStatusOptions = (status) => {
    if (status === "ON") {
      return [
        { label: "OFF", value: "Runnable" },
        { label: "OFF", value: "Offline" },
      ];
    }

    return [
      { label: "OFF", value: "OFF" },
      { label: "ON", value: "ON" },
    ];
  };

  const getSelectedRules = () => {
    var items = [];
    for (var i = 0; i < vx.rules.length; i++) {
      var x = vx.rules[i];
      var isSelected = campaign?.rules.indexOf(x.id) !== -1;
      items.push({
        label: x.name,
        value: x.id,
      });
    }
    return items;
  };


  const getSelectedLanguageOptions = () => {
    const item = [];

    // If vx or vx.language is missing → return empty list safely
    const languageList = vx?.language;
    if (!Array.isArray(languageList)) return item;

    for (let i = 0; i < languageList.length; i++) {
      const x = languageList[i];
      if (!x) continue;

      const formattedName = x.name
        ?.split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      item.push({
        label: formattedName || "",
        value: x.id, // ⬅️ use ID (correct for MultiSelect)
      });
    }

    return item;
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

  useEffect(() => {
    // Set default dates on first page load
    const now = new Date();
    setStartDate(now); // Start = current time
    setEndDate(new Date(now.getTime() + 60 * 60 * 1000)); // End = 1 hour from now
  }, []);

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

  const [openModels, setOpenModels] = useState(false);

  const isAllModelsSelected =
    formData.model.length === getSelectedmodelOptions().length;

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

  const [openMakes, setOpenMakes] = useState(false);

  const isAllMakesSelected =
    formData.make.length === getSelectedmakeOptions().length;

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

  const [openBrowsers, setOpenBrowsers] = useState(false);





  const [openLanguages, setOpenLanguages] = useState(false);



  const [openIab, setOpenIab] = useState(false);
  const [isAllIabSelected, setIsAllIabSelected] = useState(false);

  const toggleSelectAllIab = () => {
    if (isAllIabSelected) {
      setFormData({ ...formData, iab_category: [] });
    } else {
      const allValues = getSelectedCategoryvalueOptions().map((o) =>
        Number(o.value)
      );
      setFormData({ ...formData, iab_category: allValues });
    }
    setIsAllIabSelected(!isAllIabSelected);
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



  const getSelectedTargets = () => {
    const items = [
      <option key="target-none" value="">
        Select Target
      </option>,
    ];

    for (let i = 0; i < vx.targets.length; i++) {
      const x = vx.targets[i];

      console.log("Target ID:", x.id);

      items.push(
        <option key={`target-${i}`} value={x.id}>
          {x.name}
        </option>
      );
    }

    return items;
  };

  const getSelectedRegions = () => {
    var items = [];
    for (var i = 0; i < regions.length; i++) {
      var x = regions[i];
      if (campaign.regions === x)
        items.push(
          <option key={"regions-" + x} selected>
            {x}
          </option>
        );
      else items.push(<option key={"regions-" + x}>{x}</option>);
    }
    return items;
  };

  const redraw = () => {
    setCount(count + 1);
  };

  const discard = () => {
    setCampaign(null);
    setDaypartSchedule(null);
    props.callback(false);
  };

  const getLabel = () => {
    if (campaign.sqlid === -1) return <div>Save</div>;
    return <div>Update</div>;
  };

  const isAllSelected = getSelectedRules().every((option) =>
    formData.rules.includes(Number(option.value))
  );

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setFormData({ ...formData, rules: [] });
    } else {
      setFormData({
        ...formData,
        rules: getSelectedRules().map((option) => Number(option.value)),
      });
    }
  };

  const handleUseBidChange = (e) => {
    const checked = e.target.checked;

    setFormData((prev) => ({
      ...prev,
      usebid: checked,
    }));
  };

  const handlecros_device = (e) => {
    setFormData((prev) => {
      const checked = e.target.checked
      return {
        ...prev,
        cross_device: checked,
      }


    })
  }

  const showValidationError = async () => {
    await Swal.fire({
      html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
               style="width: 18px; height: 18px;" />
          <span style="font-size:16px; font-weight:bold;">Error</span>
        </div>
        <div style="margin-top: 10px; font-size:13px; text-align:center;">
          Please ensure all fields are valid.
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      width: 268,
      padding: 0,
    });
  };

  return (
    <>
      <div className="App" id="campaigneditors">
        <div className="contenteditor" style={{ position: "relative" }}>
          {isLoading && (
            <div className="loader-overlay">
              <Spinner
                color="primary"
                style={{ width: "4rem", height: "4rem" }}
              />
            </div>
          )}

          <Row className="inventory-row m-0 p-0 mb-3">
            <Col xs="6" className="m-0 p-0">
              <div className="d-flex justify-content-center m-0 p-0">
                <strong className="w-100 text-center border border-1 py-1 mb-1" id="bordercampaign">
                  <i className="fa fa-bars brandicon" id="brandicon" style={{ marginRight: "8px" }}></i>
                  <span className="mycanpaign">  Groups -Kamaz</span>
                </strong>
              </div>
            </Col>
            <Col xs="6" className="m-0 p-0">
              <div className="d-flex justify-content-center m-0 p-0">
                <strong className=" w-100 text-center border border-1 py-1 mb-1">
                  <i className="tim-icons icon-simple-add me-2 iconfo"></i>
                  <span className="createcampaign">Create Campaign</span>
                </strong>
              </div>
            </Col>
          </Row>

          <Row className="inventory-row m-0 p-0 mt-5 mb-3 align-items-center flex-wrap">
            {/* Left Title */}
            <Col xs="12" md="2" className="m-0 p-0 mb-md-0 mb-2">
              <div className="ms-3">
                <strong className="menu_header camhead advancedcampaign">
                  Advanced Campaign
                </strong>
              </div>
            </Col>

            {/* Empty Spacer */}
            <Col md="3" lg="4"></Col>

            {/* Info Items */}
            <Col lg="auto" className="m-0 p-0">
              <div className="ms-3">
                <strong className="menu_header camsmall me-3 maxtotalcpm">
                  MAX TOTAL CPM
                </strong>
                <div className="camvalue">-</div>
              </div>
            </Col>

            <Col lg="auto" className="m-0 p-0">
              <div className="ms-3">
                <strong className="menu_header camsmall me-3 maxtotalcpm">DAYS LEFT</strong>
                <div className="camvalue">0</div>
              </div>
            </Col>

            <Col lg="auto" className="m-0 p-0">
              <div className="ms-3">
                <strong className="menu_header camsmall me-3 maxtotalcpm">
                  CURRENT SPEND
                </strong>
                <div className="camvalue">$0.00</div>
              </div>
            </Col>

            <Col lg="auto" className="m-0 p-0">
              <div className="ms-3">
                <strong className="menu_header camsmall me-3 maxtotalcpm">
                  PROJ. SPEND
                </strong>
                <div className="camvalue">N/A</div>
              </div>
            </Col>

            <Col lg="auto" className="m-0 p-0">
              <div className="ms-3">
                <strong className="menu_header camsmall me-3 maxtotalcpm">IMPS. WON</strong>
                <div className="camvalue">0</div>
              </div>
            </Col>

            <Col lg="auto" className="m-0 p-0">
              <div className="ms-3">
                <strong className="menu_header camsmall me-3 maxtotalcpm">
                  AVAIL. IMPS.
                </strong>
                <div className="camvalue">N/A</div>
              </div>
            </Col>

            {/* Buttons */}
            <Col lg="auto" className="m-0 p-0">
              <button
                type="button"
                className="form-control py-1 px-2 rounded-0 d-flex align-items-center justify-content-center mt-3 me-2"
                style={{ height: "26px", fontSize: "11px" }}
              >
                <i className="fa fa-repeat me-1"></i>
              </button>
            </Col>

            <Col lg="auto" className="m-0 p-0">
              <button
                type="button"
                className="form-control py-1 px-2 rounded-0 d-flex align-items-center justify-content-center mt-3"

                id="refreshbtn"
              >
                <i className="fa fa-info me-1"></i>
              </button>
            </Col>
          </Row>

          <div>
            <Row className="h-100">
              <Col className="h-100">
                <div className="h-100 d-flex flex-column">
                  <div className="stepper flex-shrink-0">
                    {steps.map((label, i) => {
                      let className = "step";
                      if (i === step) className += " current";
                      else if (i < step) className += " complete";
                      else if (i === step + 1) className += " next";

                      return (
                        <div
                          key={i}
                          className={className}
                          onClick={() => setStep(i)}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>



                  <CardBody className="p-0 ">
                    <Form>
                      {step === 0 && (
                        <div className="step-scroll">
                          <Row>
                            <label className="fw-semibold Headlines mb-4 mt-4">
                              Basics
                            </label>
                          </Row>
                          <Row className="pl-md-1 align-items-center mb-2">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-end mb-2 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">

                                Initial Status11111
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you
                                      want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle  ms-2 offcircle" />
                                </OverlayTrigger>
                              </Label>
                            </Col>

                            <Col md="1" sm="12">
                              <div
                                id="bidder-status-wrapper"
                                className="position-relative"
                              >
                                <div
                                  className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center biddeript-a"
                                  onClick={() => {
                                    setOpenBidderStatus(!openBidderStatus);
                                    setOpenRules(false);
                                  }}
                                  tabIndex={0}
                                >
                                  {formData.status
                                    ? formData.status
                                    : ""}
                                  <FaCaretDown
                                    className={`custom-select-icon ${openBidderStatus ? "open" : ""
                                      }`}
                                  />
                                </div>

                                {openBidderStatus && (
                                  <div className="custom-dropdown-menu biddeript-b">
                                    {(
                                      getStatusOptions(campaign?.status) || []
                                    ).map((opt, idx) => {
                                      const isSelected =
                                        formData.status === opt.value;
                                      return (
                                        <div
                                          key={idx}
                                          onClick={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              status: opt.value,
                                            }));
                                            setOpenBidderStatus(false);
                                          }}
                                          className={`custom-dropdown-option ${isSelected ? "selected" : ""
                                            }`}
                                        >
                                          <span className="tick-icon">
                                            {isSelected && "✓"}
                                          </span>

                                          <span>{opt.label}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </Col>
                          </Row>

                          <Row className="pl-md-1 align-items-center mb-2">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="mb-0 forms-labels">
                                Campaign Name
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you
                                      want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle  ms-2 offcircle" />
                                </OverlayTrigger>
                              </Label>
                            </Col>

                            <Col md="6" sm="12">
                              <Input

                                id="name"
                                onMouseEnter={() => {
                                  setTooltipOpen((t) => ({ ...t, name: true }))
                                }}
                                onMouseLeave={() => {
                                  setTooltipOpen((t) => ({ ...t, name: false }))
                                }}
                                value={formData.name}
                                onChange={(e) => {
                                  setFormErrors({
                                    ...formErrors,
                                    name: ""


                                  })


                                  const { value } = e.target;
                                  let newValue = value;
                                  setFormData({
                                    ...formData,
                                    name: value,
                                  });


                                  const regex = /^[A-Za-z _\-&#]*$/;

                                  if (regex.test(newValue)) {
                                    newValue = value
                                      .toLowerCase()
                                      .replace(/\b\w/g, (char) =>
                                        char.toUpperCase()
                                      );

                                    setFormData({
                                      ...formData,
                                      name: newValue,
                                    });

                                    if (formErrors.name) {
                                      setFormErrors({
                                        ...formErrors,
                                        name: "",
                                      });
                                    }
                                  } else {
                                    setFormErrors({
                                      ...formErrors,
                                      name: "Only letters, space, _, -, &, # are allowed",
                                    });

                                  }

                                }}
                                className={`form-control normalized-input campagineditor ${formErrors.name ? "custom-error  border-danger" : ""
                                  }`}
                                placeholder="Unnamed Campaign"
                                type="text"
                                autoComplete="off"
                              />
                              {formErrors.name && (
                                <Tooltip
                                  placement="bottom"
                                  isOpen={tooltipOpen.name}
                                  target="name"
                                  autohide={false}

                                  popperClassName="custom-tooltip"
                                >
                                  <div className="one"></div>
                                  {formErrors.name}
                                </Tooltip>
                              )}



                            </Col>
                          </Row>

                          <Row className="pl-md-1 align-items-center mb-2">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Default CPM Bid
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you
                                      want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>
                            <Col md="4" sm="12" id="maxbid">
                              <Input
                                type="text"
                                id="cpm_bid"
                                value={formData.cpm_bid || ""}
                                onMouseEnter={() => {
                                  setTooltipOpen((t) => ({ ...t, cpm_bid: true }))
                                }}
                                onMouseLeave={() => {
                                  setTooltipOpen((t) => ({ ...t, cpm_bid: false }))
                                }}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  setFormErrors((prev) => (
                                    {
                                      ...prev,
                                      cpm_bid: "",
                                    }))


                                  if (/^\d*$/.test(value)) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      cpm_bid: value,
                                    }));
                                  }
                                }}
                                onBlur={() => {
                                  if (formData.cpm_bid) {
                                    const n = parseFloat(formData.cpm_bid);
                                    if (!isNaN(n))
                                      setFormData((prev) => ({
                                        ...prev,
                                        cpm_bid: n.toFixed(2),
                                      }));
                                  }
                                }}
                                className={`form-control normalized-input campagineditor bidipt ${formErrors.cpm_bid ? "custom-error border-danger" : ""
                                  }`}
                                placeholder=""
                              />
                              {formErrors.cpm_bid && (


                                <Tooltip
                                  placement="bottom"
                                  isOpen={tooltipOpen.cpm_bid}
                                  target="cpm_bid"
                                  autohide={false}
                                  popperClassName="custom-tooltip"
                                >
                                  <div className="one"></div>
                                  {formErrors.cpm_bid}
                                </Tooltip>

                              )}
                              <span className="usd">USD</span>
                            </Col>
                          </Row>
                          <Row className="pl-md-1 align-items-center mb-2">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Max Bid
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you
                                      want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>
                            <Col md="4" sm="12" id="maxbid">
                              <Input
                                type="text"
                                id="price"
                                value={formData.price || ""}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  if (/^\d*\.?\d*$/.test(value)) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      price: value,
                                    }));
                                  }
                                }}
                                className={`form-control normalized-input campagineditor bidipt ${formErrors.price ? "custom-error" : ""
                                  }`}
                                placeholder=""
                              />

                              {formErrors.price && (
                                <div className="custom-feedback">
                                  {formErrors.price}
                                </div>
                              )}

                              <span className="usd">USD</span>
                            </Col>
                          </Row>

                          <Row>
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            ></Col>
                            <Col md="5" sm="12">
                              <div role="alert" className="how">
                                <i className="fa fa-info-circle me-2" id="mesaasgeicon"></i>
                                Max Bid is the highest price that the campaign can bid on impressions,
                                taking into account any adjustments such as multipliers, optimization,
                                or adaptive deal bidding.
                              </div>
                            </Col>
                          </Row>
                          <Row>
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            ></Col>

                            <Col md="5" sm="12">
                              <div className="d-flex align-items-center mt-2">
                                <Input
                                  type="checkbox"
                                  id="rewarded"
                                  checked={formData.usebid}
                                  onChange={handleUseBidChange}
                                />

                                <Label for="rewarded" className="ms-2 mb-0">
                                  <span className="usebid">Use bid multipliers</span>
                                </Label>

                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Video ad plays as the primary focus without video content.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-3 editor-tooltip" />
                                </OverlayTrigger>
                              </div>
                            </Col>
                          </Row>
                          {formData.usebid && (
                            <Row>
                              <Col
                                md="3"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                              ></Col>

                              <Col md="5" sm="12">
                                <div role="alert" className="how">
                                  <i className="fa fa-info-circle me-2" id="mesaasgeicon"></i>
                                  Make sure to set a Max Bid that's high enough to bid on all selected
                                  deals when bid multipliers take effect. See Campaign Max Bid
                                </div>
                              </Col>
                            </Row>
                          )}

                          <Row className="pl-md-1 align-items-center mb-2">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Bid Shading
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>

                            <Col md="4" sm="12">
                              <div className="d-flex align-items-center gap-4">
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="bid_shading"
                                    value="1"
                                    checked={formData.bid_shading === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        bid_shading: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">On</span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="bid_shading"
                                    value="0"
                                    checked={formData.bid_shading === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        bid_shading: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">Off</span>
                                </div>
                              </div>
                            </Col>
                          </Row>

                          <Row>
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Cross-Device

                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you
                                      want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>

                            <Col md="5" sm="12">
                              <div className="d-flex align-items-center">
                                <Input
                                  type="checkbox"
                                  id="rewarded"
                                  checked={formData.cross_device}
                                  onChange={handlecros_device}
                                />
                                <Label for="rewarded" className="ms-2 mb-0">
                                  <span className="usebid">Enable cross-device</span>
                                </Label>
                              </div>
                            </Col>
                          </Row>
                          <Row>
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            ></Col>
                            <Col md="5" sm="12">
                              <span className="ssnote">A CPM fee of $0.40 applies to all impressions.</span>
                            </Col>
                          </Row>



                          <Row className="pl-md-1 align-items-center mb-2">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Frequency Cap{" "}

                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you
                                      want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>
                            <Col md="2" sm="12" className="mt-2">
                              <div role="alert" className="how">
                                <i className="fa fa-info-circle me-2" id="mesaasgeicon"></i>
                                Group Frequency Cap   Off
                              </div>


                            </Col>
                            <Row>
                              <Col
                                md="3"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                              ></Col>
                              <Col md="5" sm="12">
                                <div className="d-flex align-items-center gap-4">
                                  <div className="d-flex align-items-center gap-2">
                                    <Input
                                      type="radio"
                                      name="capspec"
                                      value="1"
                                      checked={formData.capspec === "1"}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          capspec: e.target.value,
                                          make: [],
                                        })
                                      }
                                    />
                                    <span className="text-gray-700 devices">
                                      On
                                    </span>
                                  </div>

                                  <div className="d-flex align-items-center gap-2">
                                    <Input
                                      type="radio"

                                      name="capspec"
                                      value="0"
                                      checked={formData.capspec === "0"}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          capspec: e.target.value,
                                        })
                                      }
                                    />
                                    <span className="text-gray-700 devices">
                                      Off
                                    </span>
                                  </div>
                                </div>
                              </Col>
                            </Row>


                            {formData.capspec === "1" && (
                              <>
                                <Row className="pl-md-1 align-items-center mb-3 mt-2">
                                  <Col md="2" className="d-none d-md-block" />

                                  <Col md="6" sm="12">
                                    <div className="d-flex flex-wrap flex-md-nowrap align-items-center gap-3">
                                      <div
                                        className="d-flex align-items-center gap-2 frequency-item"
                                        style={{ flexShrink: 0 }}
                                      >
                                        <Label
                                          for="capcount"
                                          className="mb-0 text-nowrap forms-labels"
                                        >
                                          Count
                                        </Label>

                                        <Input
                                          placeholder="0"
                                          onMouseEnter={() => {
                                            setTooltipOpen((t) => ({ ...t, capcount: true }))
                                          }}
                                          onMouseLeave={() => {
                                            setTooltipOpen((t) => ({ ...t, capcount: false }))

                                          }}
                                          type="text"
                                          id="capcount"
                                          name="capcount"
                                          autoComplete="off"
                                          value={formData.capcount}
                                          onChange={(e) => {
                                            const { value } = e.target;
                                            setFormErrors((prev) => (
                                              {
                                                ...prev,
                                                capcount: ""
                                              }
                                            ))
                                            if (/^\d*$/.test(value)) {
                                              setFormData((prev) => ({
                                                ...prev,
                                                capcount: value
                                                  ? parseInt(value, 10)
                                                  : "",
                                              }));
                                            }
                                          }}
                                          className={`normalized-input countipt campagineditor ${formErrors.capcount ? "border-danger" : ""}`}
                                        />
                                        {formErrors.capcount && (<>

                                          <Tooltip
                                            placement="bottom"
                                            isOpen={tooltipOpen.capcount}
                                            target="capcount"
                                            autohide={false}

                                            popperClassName="custom-tooltip"
                                          >
                                            <div className="one"></div>
                                            {formErrors.capcount}
                                          </Tooltip>
                                        </>)}
                                      </div>

                                      <div className="d-flex align-items-center gap-2 frequency-item">
                                        <Label
                                          for="capexpire"
                                          className="mb-0 text-nowrap forms-labels"
                                        >
                                          Expiration
                                        </Label>

                                        <Input
                                          placeholder="0"
                                          type="text"
                                          id="capexpire"
                                          name="capexpire"
                                          autoComplete="off"
                                          value={formData.capexpire}
                                          onMouseEnter={() => {
                                            setTooltipOpen((t) => ({ ...t, capexpire: true }))
                                          }}
                                          onMouseLeave={() => {
                                            setTooltipOpen((t) => ({ ...t, capexpire: false }))

                                          }}
                                          onChange={(e) => {
                                            setFormErrors((prev) => ({
                                              ...prev,
                                              capexpire: ""
                                            }))
                                            const { value } = e.target;
                                            if (/^\d*$/.test(value)) {
                                              setFormData((prev) => ({
                                                ...prev,
                                                capexpire: value,
                                              }));
                                            }
                                          }}
                                          className={`normalized-input countipt campagineditor${formErrors.capexpire ? " border-danger" : ""}`}
                                        />
                                        {formErrors.capexpire && (<>

                                          <Tooltip
                                            placement="bottom"
                                            isOpen={tooltipOpen.capexpire}
                                            target="capexpire"
                                            autohide={false}

                                            popperClassName="custom-tooltip"
                                          >
                                            <div className="one"></div>
                                            {formErrors.capexpire}
                                          </Tooltip>
                                        </>)}
                                      </div>

                                      <div className="d-flex align-items-center gap-2 frequency-item">
                                        <Label className="mb-0 text-nowrap forms-labels">
                                          Timebase
                                        </Label>
                                        <div
                                          id="timebase-wrapper"
                                          className="position-relative"
                                        >
                                          <div
                                            className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center timebipt-a"
                                            onClick={() =>
                                              setOpenTimebase(!openTimebase)
                                            }
                                            tabIndex={0}
                                          >
                                            {formData.capunit ||
                                              "Select Timebase"}
                                            <FaCaretDown
                                              className={`custom-select-icon ${openTimebase ? "open" : ""
                                                }`}
                                            />
                                          </div>

                                          {openTimebase && (
                                            <div className="custom-dropdown-menu timebipt-b">
                                              {[
                                                "seconds",
                                                "minutes",
                                                "hours",
                                                "days",
                                              ].map((unit, index) => {
                                                const isSelected =
                                                  formData.capunit === unit;
                                                return (
                                                  <div
                                                    key={index}
                                                    onClick={() => {
                                                      setFormData((prev) => ({
                                                        ...prev,
                                                        capunit: unit,
                                                      }));
                                                      setOpenTimebase(false);
                                                    }}
                                                    className={`custom-dropdown-option timebipt-c ${isSelected
                                                      ? "selected"
                                                      : ""
                                                      } `}
                                                  >
                                                    <span className="tick-icon">
                                                      {isSelected && "✓"}
                                                    </span>
                                                    <span>{unit}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </Col>
                                </Row>
                              </>
                            )}
                          </Row>
                          <Row id="budget-section">
                            <label className="fw-semibold Headlines mb-4">
                              Budget
                            </label>
                          </Row>

                          <Row className="pl-md-1 align-items-center mb-2">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Budget
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you
                                      want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>
                            <Col md="2" sm="12" id="maxbid">
                              <Input
                                placeholder=" "
                                type="text"
                                name="total_budget"
                                autocomplete="off"
                                value={formData.total_budget || ""}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  if (/^\d*$/.test(value)) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      total_budget: value,
                                    }));
                                    console.log(formData.total_budget);
                                    setFormErrors((prev) => ({
                                      ...prev,
                                      total_budget: "",
                                    }));
                                  }
                                  if (value && formData.budget_limit_daily) {
                                    if (
                                      Number(value) <
                                      Number(formData.budget_limit_daily)
                                    ) {
                                      setFormErrors((prev) => ({
                                        ...prev,
                                        total_budget:
                                          "Total Budget Greater Than Daily Budget & Hourly Budget",
                                      }));
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  if (formData.total_budget) {
                                    const n = parseFloat(formData.total_budget);
                                    if (!isNaN(n))
                                      setFormData((prev) => ({
                                        ...prev,
                                        total_budget: n.toFixed(2),
                                      }));
                                  }
                                }}
                                className={`form-control normalized-input campagineditor tbipt ${formErrors.total_budget ? "custom-error" : ""
                                  }`}
                              />
                              {formErrors.total_budget && (
                                <div className="custom-feedback">
                                  {formErrors.total_budget}
                                </div>
                              )}
                              <span className="usd">USD</span>
                            </Col>
                            <Col md="4" sm="12">
                              <div className="d-flex align-items-center gap-4">
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="all_time"
                                    value="1"
                                    checked={formData.all_time === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        all_time: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">Daily</span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="all_time"
                                    value="0"
                                    checked={formData.all_time === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        all_time: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">All Time</span>
                                </div>
                              </div>

                            </Col>
                          </Row>

                          <Row>
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            ></Col>
                            <Col md="7" sm="12">
                              <span className="ssnote">A budget change may take up to 60 seconds to take effect. High volume sites sometimes cause overspend.</span>
                            </Col>
                          </Row>

                          <Row className="pl-md-1 align-items-center mb-2 mt-4">

                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-end mb-2 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Impression Cap
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-impression">
                                      Select impression cap type
                                    </Tooltip>
                                  }
                                >
                                  <i className="fa fa-info-circle ms-2 offcircle" />
                                </OverlayTrigger>
                              </Label>
                            </Col>
                            <Col md="1" sm="12">
                              <div className="position-relative" id="impressioncap">
                                <div
                                  className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                  onClick={() => setOpenBidderStatus(!openBidderStatus)}
                                  tabIndex={0}
                                >
                                  {impressionCapType}
                                  <FaCaretDown
                                    className={`custom-select-icon ${openBidderStatus ? "open" : ""
                                      }`}
                                  />
                                </div>

                                {openBidderStatus && (
                                  <div className="custom-dropdown-menu">
                                    {impressionCapOptions.map((opt, idx) => (
                                      <div
                                        key={idx}
                                        className={`custom-dropdown-option  ${impressionCapType === opt.value ? "selected" : ""
                                          }`}
                                        onClick={() => {
                                          setImpressionCapType(opt.value);
                                          if (opt.value === "None") {
                                            setImpressionCapValue("");
                                          }
                                          setOpenBidderStatus(false);
                                        }}
                                      >
                                        <span className="tick-icon">
                                          {impressionCapType === opt.value && "✓"}
                                        </span>
                                        <span>{opt.label}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Col>
                            {impressionCapType !== "None" && (
                              <Col md="2" sm="12">
                                <Input
                                  type="number"
                                  className="form-control rounded-0 normalized-input campagineditor"
                                  value={impressionCapValue}
                                  onChange={(e) => { setImpressionCapValue(e.target.value); setFormData((prev) => ({ ...prev, impression_cap: e.target.value })) }}
                                />
                              </Col>
                            )}
                          </Row>

                          <Row className="pl-md-1 align-items-center mb-2 mt-3">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Pacing
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>

                            <Col md="4" sm="12">
                              <div className="d-flex align-items-center gap-4">
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="pacing"
                                    value="1"
                                    checked={formData.pacing === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        pacing: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">On</span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="pacing"
                                    value="0"
                                    checked={formData.pacing === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        pacing: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">Off</span>
                                </div>
                              </div>
                            </Col>
                          </Row>

                          {formData.pacing === "1" && (
                            <><Row className="align-items-center mb-2 mt-2">
                              <Col md="2" className="d-none d-md-block" />
                              <Col md="2" sm="12">
                                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2">
                                  <Label
                                    for="capcount"
                                    className="mb-1 mb-md-0 forms-labels text-nowrap"
                                    id="pacingdelivery"
                                  >
                                    Pace delivery based on the campaign's
                                  </Label>
                                </div>
                              </Col>
                              <Col md="2" sm="12">
                                <div className="position-relative dropdown-width pacingmode" id="pacedelivery">
                                  <div
                                    className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor cursor-pointer"
                                    onClick={() => setOpenPacingStatus(!openPacingStatus)}
                                    tabIndex={0}
                                  >
                                    <span>{pacingType}</span>
                                    <FaCaretDown
                                      className={`custom-select-icon ${openPacingStatus ? "open" : ""}`} />
                                  </div>

                                  {openPacingStatus && (
                                    <div className="custom-dropdown-menu w-100">
                                      {pacingOptions.map((opt, idx) => (
                                        <div
                                          key={idx}
                                          className={`custom-dropdown-option ${pacingType === opt.value ? "selected" : ""}`}
                                          onClick={() => {
                                            setPacingType(opt.value);
                                            if (opt.value === "None") {
                                              setPacingValue("");
                                            }
                                            setOpenPacingStatus(false);
                                          }}
                                        >
                                          <span className="tick-icon">
                                            {pacingType === opt.value && "✓"}
                                          </span>
                                          <span>{opt.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </Col>
                            </Row>
                              <Row className="align-items-center  enabled">
                                <Col md="1" className="d-none d-md-block">
                                </Col>
                                <Col
                                  md="2"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels pacingmodeing">
                                    Pacing Mode
                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-outstream">
                                          Choose the type of placements where you want to play your video ad.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle offcircle ms-2" />
                                    </OverlayTrigger>
                                  </Label>
                                </Col>
                              </Row>
                              <Row className="enabled">
                                <Col md="2" className="d-none d-md-block">
                                </Col>
                                <Col md="4" sm="12">
                                  <div className="d-flex align-items-center gap-4">
                                    <div className="d-flex align-items-start gap-2">
                                      <Input
                                        type="radio"
                                        name="even_spend"
                                        value="1"
                                        checked={formData.even_spend === "1"}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            even_spend: e.target.value,
                                          })
                                        }
                                        className="mt-2"
                                      />
                                      <div>
                                        <span className="text-gray-700 devices fw-semibold">
                                          Even
                                        </span>
                                        <br />
                                        <span className="text-gray-700 devices">
                                          Spend evenly across all days in the flight.
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                              </Row>
                              <Row className="enabled">
                                <Col md="2" className="d-none d-md-block">
                                </Col>
                                <Col md="4" sm="12">
                                  <div className="d-flex align-items-center gap-4">
                                    <div className="d-flex align-items-start gap-2">
                                      <Input
                                        type="radio"
                                        name="even_spend"
                                        value="2"
                                        checked={formData.even_spend === "2"}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            even_spend: e.target.value,
                                          })
                                        }
                                        className="mt-2"
                                      />
                                      <div>
                                        <span className="text-gray-700 devices fw-semibold">
                                          Ahead
                                        </span>
                                        <br />
                                        <span className="text-gray-700 devices">
                                          Spend at a higher rate at the beginning of the flight.
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                              </Row>
                              <Row>
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-md-0 col-max-sm">
                                </Col>
                                <Col md="4" sm="12">
                                  <div role="alert" className="hows">
                                    <i className="fa fa-info-circle me-2" id="mesaasgeicon"></i>
                                    An All Time budget must be set in order to select Pace Ahead.
                                  </div>
                                </Col>
                              </Row>
                            </>
                          )}


                          <Row className="pl-md-1 align-items-center mb-2 mt-2">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Flight Dates
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you
                                      want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>

                            <Col md="4" sm="12">
                              <div className="d-flex align-items-center gap-4">
                                <div className="d-flex align-items-center gap-2 ">
                                  <Input
                                    type="radio"
                                    name="flight_date"
                                    id="flight_date"
                                    value="0"
                                    checked={formData.flight_date === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        flight_date: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700  devices">
                                    All Days
                                  </span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="flight_date"
                                    id="flightdate"
                                    value="1"
                                    checked={formData.flight_date === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        flight_date: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700  devices">
                                    Date Range
                                  </span>
                                </div>
                              </div>
                            </Col>
                          </Row>

                          <Row className="pl-md-1 align-items-center mb-2">
                            {formData.flight_date === "1" && (
                              <>
                                <Row
                                  className="pl-md-1 align-items-center mb-2 mt-2"

                                >
                                  <Col
                                    md="2"
                                    sm="12"
                                    className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0"
                                  >
                                  </Col>
                                  <Col
                                    md="3"
                                    sm="12"
                                    className="custom-col-width date-col"
                                  >
                                    <div className="date-picker-wrapper">
                                      <DatePicker
                                        id="start"
                                        selected={startDate || new Date()}
                                        onChange={(e) => { setStartDate(e); setFormData((prev) => { return { ...prev, Flight_startdate: e } }) }}
                                        dateFormat="MM/d/yyyy"
                                        className="normalized-input date-input"
                                        autoComplete="off"
                                        wrapperClassName=""
                                        popperPlacement="bottom-start"
                                      />
                                    </div>
                                  </Col>
                                  <Col
                                    md="2"
                                    sm="12"
                                    className="custom-col-width date-col">
                                    <div className="date-picker-wrapper">
                                      <DatePicker
                                        id="end"
                                        selected={endDate}
                                        onChange={(e) => { setEndDate(e); setFormData((prev) => { return { ...prev, Flight_enddate: e } }) }}
                                        value
                                        dateFormat="MM/d/yyyy"
                                        className="normalized-input date-input"
                                        autoComplete="off"
                                        wrapperClassName=""
                                        popperPlacement="bottom-start"
                                      />
                                    </div>
                                  </Col>
                                </Row>
                                <Row className="pl-md-1 align-items-center mb-2 mt-2">
                                  <Col sm="12" md="2"
                                    className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0">
                                  </Col>
                                  <Col md="3" sm="12">
                                    <div role="alert" className="waringsicon">
                                      <i className="fa fa-warning me-2" id="warningicon"></i>
                                      Campaign flight dates are set in the past
                                    </div>
                                  </Col>
                                </Row>
                              </>
                            )}
                          </Row>

                          <Row className="pl-md-1 align-items-center mb-2">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Daypartying
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you
                                      want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>

                            <Col md="4" sm="12">
                              <div className="form-check form-switch d-flex align-items-center gap-2">
                                <Input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="daypartSwitch"
                                  checked={showDaypart}
                                  onChange={() => setShowDaypart(!showDaypart)}
                                />
                                <Label htmlFor="daypartSwitch" className="">
                                  {showDaypart ? "DayPart ON" : "DayPart OFF"}
                                </Label>
                              </div>
                            </Col>
                          </Row>

                          {showDaypart && (
                            <DayPartEditor
                              key={"day-part-" + count}
                              daypart={daypartSchedule}
                              redraw={redraw}
                              callback={setDaypartSchedule}
                            />
                          )}
                          <Row className="pl-md-1 align-items-center mb-2">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Service Provider Add-Ons
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>

                            <Col md="4" sm="12">
                              <div className="d-flex align-items-center gap-4">
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="service_provider"
                                    value="1"
                                    checked={formData.service_provider === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        service_provider: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">On</span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="service_provider"
                                    value="0"
                                    checked={formData.service_provider === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        service_provider: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">Off</span>
                                </div>
                              </div>
                            </Col>
                          </Row>


                          <Row id="budget-section">
                            <label className="fw-semibold Headlines mb-4">
                              Optimization
                            </label>
                          </Row>

                          <Row className="pl-md-1 align-items-center mb-2">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            ></Col>

                            <Col md="4" sm="12">
                              <div
                                className="d-flex flex-wrap align-items-center"
                                style={{
                                  gap: "16px",
                                  rowGap: "8px",
                                }}
                              >
                                {/* None */}
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="optimize"
                                    id="optimize_none"
                                    value="0"
                                    checked={formData.optimize === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        optimize: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    None
                                  </span>
                                </div>

                                {/* Simple Bid */}
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="optimize"
                                    id="optimize_simple"
                                    value="1"
                                    checked={formData.optimize === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        optimize: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    Simple Bid
                                  </span>
                                </div>

                                {/* Smart Bid */}
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="optimize"
                                    id="optimize_smart"
                                    value="2"
                                    checked={formData.optimize === "2"}
                                    onChange={(e) => {

                                      setFormData({
                                        ...formData,
                                        optimize: e.target.value,
                                      })
                                    }}
                                  />
                                  <span className="text-gray-700 devices">
                                    Smart Bid
                                  </span>
                                </div>
                              </div>
                            </Col>


                            {formData.optimize === "1" && (
                              <>
                                <Col md="12">
                                  <Row className="pl-md-1 align-items-center mb-2 mt-3">
                                    <Col md="2" className="d-flex justify-content-end">
                                      <Label className="forms-labels">Goal</Label>
                                    </Col>
                                    <Col md="3" sm="12">
                                      <div className="position-relative" id="optimizestatus">
                                        <div
                                          className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                          onClick={() => { setOpenGoalStatus(!openGoalStatus); }}
                                          tabIndex={0}
                                        >
                                          {goalType}
                                          <FaCaretDown
                                            className={`custom-select-icon ${openGoalStatus ? "open" : ""}`} />
                                        </div>

                                        {openGoalStatus && (
                                          <div className="custom-dropdown-menu">
                                            {goalOptions.map((opt, idx) => (
                                              <div
                                                key={idx}
                                                className={`custom-dropdown-option ${goalType === opt.value ? "selected" : ""}`}
                                                onClick={() => {
                                                  setGoalType(opt.value);
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    dollar_goal: opt.defaultValue,
                                                    goal_status: opt.value,
                                                  }));
                                                  setOpenGoalStatus(false);
                                                }}
                                              >
                                                <span className="tick-icon">
                                                  {goalType === opt.value && "✓"}
                                                </span>
                                                <span>{opt.label}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </Col>
                                    <Col md="2">
                                      <Input
                                        placeholder="0"
                                        type="text"
                                        id="dollar_goal"
                                        name="dollar_goal"
                                        onMouseEnter={() => formErrors.dollar_goal && setTooltipOpen((t) => ({ ...t, dollar_goal: true }))}
                                        onMouseLeave={() => setTooltipOpen((t) => ({ ...t, dollar_goal: false }))}
                                        value={formData.dollar_goal || ""}
                                        onChange={(e) => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            dollar_goal: e.target.value,
                                          }));
                                          setFormErrors((prev) => ({
                                            ...prev,
                                            dollar_goal: "",
                                          }))


                                        }}
                                        className={`normalized-input campagineditor ${formErrors.dollar_goal ? " border-danger" : ""}`} />
                                      {formErrors.dollar_goal && (<>
                                        <Tooltip
                                          placement="bottom"
                                          isOpen={tooltipOpen.dollar_goal}
                                          target="dollar_goal"
                                          autohide={false}

                                          popperClassName="custom-tooltip"
                                        >
                                          <div className="one"></div>
                                          {formErrors.dollar_goal}
                                        </Tooltip>
                                      </>
                                      )}
                                    </Col>
                                  </Row>
                                </Col>

                                {goalType === "Cost Per Acquisition (eCPA)" && (
                                  <Row>
                                    <Col md="4" sm="12"
                                      className="d-flex justify-content-md-end justify-content-start mb-md-0">
                                    </Col>
                                    <Col sm="12" md="0">
                                      <Row>
                                        <Col
                                          md="3"
                                          sm="12"
                                          className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm">
                                        </Col>
                                        <Col md="9" sm="12">
                                          <div className="d-flex align-items-center">
                                            <Input
                                              type="checkbox"
                                              id="primary_conversion"
                                              checked={!!formData.primary_conversion}
                                              onChange={(e) =>
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  primary_conversion: e.target.checked,
                                                }))
                                              }
                                            />
                                            <Label for="primary_conversion" className="ms-2 mb-0">
                                              <span className="usebid">Optimize for primary conversion</span>
                                              <OverlayTrigger
                                                placement="right"
                                                overlay={
                                                  <Tooltip id="tooltip-outstream">
                                                    Choose the type of placements where you want to play your video ad.
                                                  </Tooltip>
                                                }
                                                delay={{ show: 250, hide: 0 }}
                                              >
                                                <i className="fa fa-info-circle offcircle ms-2" />
                                              </OverlayTrigger>
                                            </Label>
                                          </div>
                                        </Col>
                                      </Row>
                                    </Col>
                                  </Row>
                                )}


                                {goalType === "Viewable Rate (VR)" && (
                                  <Row className="pl-md-1 mt-2">
                                    <Col md="2" className="d-none d-md-block" />
                                    <Col md="8" sm="12">
                                      <Col md="8" sm="12">
                                        <div role="alert" className="hows">
                                          <i className="fa fa-info-circle me-2" id="mesaasgeicon"></i>
                                          Measure Viewability has been turned on as it is required for the selected goal type.
                                          You will need to select a Viewability provider and standard <span className="maxbiding">Go to Viewability.</span>
                                        </div>
                                      </Col>
                                    </Col>
                                  </Row>
                                )}
                                <Row>
                                  <Col md="3" sm="12"
                                    className="d-flex justify-content-md-end justify-content-start mb-md-0 col-max-sm">
                                  </Col>
                                  <Col md="8" sm="12">
                                    <div role="alert" className="hows">
                                      <i className="fa fa-info-circle me-2" id="mesaasgeicon"></i>
                                      Make sure to set a Max Bid that's high enough to bid on all selected deals when the campaign is optimized. See Campaign <span className="maxbiding">Max bid</span>
                                    </div>
                                  </Col>
                                </Row>
                                <Row>
                                  <Col md="3" sm="12"
                                    className="d-flex justify-content-md-end justify-content-start mb-md-0 col-max-sm">
                                  </Col>
                                  <Col sm="12" md="3">
                                    <Row className="pl-md-1 align-items-center mb-2 mt-3">
                                      <Col
                                        md="4"
                                        sm="12"
                                        className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                      >
                                        <Label className="forms-labels">
                                          Optimize
                                          <OverlayTrigger
                                            placement="right"
                                            overlay={
                                              <Tooltip id="tooltip-outstream">
                                                Choose the type of placements where you want to play your video ad.
                                              </Tooltip>
                                            }
                                            delay={{ show: 250, hide: 0 }}
                                          >
                                            <i className="fa fa-info-circle offcircle ms-2" />
                                          </OverlayTrigger>
                                        </Label>
                                      </Col>

                                      <Col md="4" sm="12">
                                        <div className="d-flex align-items-center gap-4">
                                          <div className="d-flex align-items-center gap-2">
                                            <Input
                                              type="radio"
                                              name="optimize_domain"
                                              value="1"
                                              checked={formData.optimize_domain === "1"}
                                              onChange={(e) =>
                                                setFormData({
                                                  ...formData,
                                                  optimize_domain: e.target.value,

                                                })
                                              }
                                            />
                                            <span className="text-gray-700 devices">Domains</span>
                                          </div>

                                          <div className="d-flex align-items-center gap-2">
                                            <Input
                                              type="radio"
                                              name="optimize_domain"
                                              value="0"
                                              checked={formData.optimize_domain === "0"}
                                              onChange={(e) =>
                                                setFormData({
                                                  ...formData,
                                                  optimize_domain: e.target.value,
                                                })
                                              }
                                            />
                                            <span className="text-gray-700 devices">Placements</span>
                                          </div>
                                        </div>
                                      </Col>
                                    </Row>
                                  </Col>
                                </Row>
                                <Row>
                                  <Col md="4" sm="12"
                                    className="d-flex justify-content-md-end justify-content-start mb-md-0 col-max-sm">
                                  </Col>
                                  <Col sm="12" md="3">
                                    <Row>
                                      <Col
                                        md="3"
                                        sm="12"
                                        className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm">
                                      </Col>
                                      <Col md="9" sm="12">
                                        <div className="d-flex align-items-center">
                                          <Input
                                            type="checkbox"
                                            id="optimization_settings"
                                            checked={!!formData.optimization_settings}
                                            onChange={(e) =>
                                              setFormData((prev) => ({
                                                ...prev,
                                                optimization_settings: e.target.checked,
                                              }))
                                            }
                                          />
                                          <Label for="optimization_settings" className="ms-2 mb-0">
                                            <span className="usebid">Advanced optimization settings</span>
                                          </Label>
                                        </div>
                                      </Col>
                                    </Row>
                                  </Col>
                                </Row>
                                {formData.optimization_settings && (
                                  <>
                                    {(goalType === "Cost Per Click (eCPC)" || goalType === "Cost Per Acquisition (eCPA)" || goalType === "Cost Per Completed Video (eCPCV)") && (
                                      <Col md="12" id="">
                                        <Row className="pl-md-1 align-items-center mb-2 mt-3" >
                                          <Col md="2" className="d-flex justify-content-end">
                                            <Label className="forms-labels">Minimum Bid</Label>
                                            <OverlayTrigger
                                              placement="right"
                                              overlay={
                                                <Tooltip id="tooltip-outstream">
                                                  Choose the type of placements where you want to play your video ad.
                                                </Tooltip>
                                              }
                                              delay={{ show: 250, hide: 0 }}
                                            >
                                              <i className="fa fa-info-circle offcircle ms-2 mt-1" />
                                            </OverlayTrigger>
                                          </Col>
                                          <Col md="2" sm="12" id="maxbid">
                                            <Input
                                              type="text"
                                              id="minimum_bid"
                                              name="minimum_bid"
                                              value={formData.minimum_bid}
                                              onChange={(e) => {
                                                setFormErrors(prev => ({
                                                  ...prev,
                                                  minimum_bid: ""
                                                }));
                                                handleChange(e);
                                              }}
                                              className={`formscontrol ${formErrors.minimum_bid ? " border-danger" : ""}`}
                                              onMouseEnter={() => {
                                                setTooltipOpen((t) => ({ ...t, minimum_bid: true }))
                                              }}
                                              onMouseLeave={() => setTooltipOpen((t) => ({ ...t, minimum_bid: false }))}
                                            />
                                            <span class="usd">USD</span>
                                            {formErrors.minimum_bid && (
                                              <Tooltip
                                                placement="bottom"
                                                isOpen={tooltipOpen.minimum_bid}
                                                target="minimum_bid"
                                                autohide={false}

                                                popperClassName="custom-tooltip"
                                              >
                                                <div className="one"></div>
                                                {formErrors.minimum_bid}
                                              </Tooltip>
                                            )}
                                          </Col>
                                          <Col md="4">
                                            <div className="d-flex align-items-center">
                                              <Input
                                                type="checkbox"
                                                id="optimization_settings"
                                                checked={!!formData.optimization_settings}
                                                onChange={(e) =>
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    optimization_settings: e.target.checked,
                                                  }))
                                                }
                                              />
                                              <Label for="optimization_settings" className="ms-2 mb-0">
                                                <span className="usebid">Turn off domains or placements at minimum bid</span>
                                              </Label>
                                            </div>
                                          </Col>
                                        </Row>
                                      </Col>
                                    )}
                                    <Col md="12" id="">
                                      <Row className="pl-md-1 align-items-center mb-2 mt-1">

                                        <Col md="2" className="d-flex justify-content-end">
                                          <Label className="forms-labels">Bid Step</Label>
                                          <OverlayTrigger
                                            placement="right"
                                            overlay={
                                              <Tooltip id="tooltip-outstream">
                                                Choose the type of placements where you want to play your video ad.
                                              </Tooltip>
                                            }
                                            delay={{ show: 250, hide: 0 }}
                                          >
                                            <i className="fa fa-info-circle offcircle ms-2 mt-1" />
                                          </OverlayTrigger>
                                        </Col>
                                        <Col md="2" sm="12" id="maxbid">
                                          <Input
                                            type="text"
                                            id="bid_step"
                                            name="bid_step"
                                            value={formData.bid_step}
                                            onChange={(e) => {
                                              setFormErrors(p => ({ ...p, bid_step: "" }));
                                              handleChange(e);
                                            }}
                                            className={`formscontrol${formErrors.bid_step ? " border-danger" : ""}`}
                                            onMouseEnter={() => {
                                              setTooltipOpen((t) => ({ ...t, bid_step: true }))
                                            }}
                                            onMouseLeave={() => setTooltipOpen((t) => ({ ...t, bid_step: false }))}
                                          />
                                          <span class="usd">USD</span>
                                          {formErrors.bid_step && (<>
                                            <Tooltip
                                              placement="bottom"
                                              isOpen={tooltipOpen.bid_step}
                                              target="bid_step"
                                              autohide={false}

                                              popperClassName="custom-tooltip"
                                            >
                                              <div className="one"></div>
                                              {formErrors.bid_step}
                                            </Tooltip></>

                                          )}
                                        </Col>
                                      </Row>
                                    </Col>
                                    {(goalType === "Viewable Rate (VR)" || goalType === "Click-Thru Rate (CTR)" || goalType === "Video Completion Rate (VCR)") && (
                                      <><Col md="12" id="">
                                        <Row className="pl-md-1 mt-2">
                                          <Col md="2" className="d-flex justify-content-end">
                                            <Label className="forms-labels">Impression Threshold</Label>
                                            <OverlayTrigger
                                              placement="right"
                                              overlay={<Tooltip id="tooltip-outstream">
                                                Choose the type of placements where you want to play your video ad.
                                              </Tooltip>}
                                              delay={{ show: 250, hide: 0 }}
                                            >
                                              <i className="fa fa-info-circle offcircle ms-2 mt-1" />
                                            </OverlayTrigger>
                                          </Col>
                                          <Col md="2" sm="12" id="maxbid">
                                            <Input
                                              type="text"
                                              id="impression_threshold"
                                              name="impression_threshold"
                                              value={formData.impression_threshold}
                                              onChange={handleChange}
                                              className="formscontrol" />
                                            <span class="usd">USD</span>
                                          </Col>
                                        </Row>
                                      </Col>
                                        <Col md="12" id="">
                                          <Row className="pl-md-1 mt-2">
                                            <Col md="2" className="d-flex justify-content-end">
                                              <Label className="forms-labels">Smart Disable</Label>
                                              <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-outstream">
                                                  Choose the type of placements where you want to play your video ad.
                                                </Tooltip>}
                                                delay={{ show: 250, hide: 0 }}
                                              >
                                                <i className="fa fa-info-circle offcircle ms-2 mt-1" />
                                              </OverlayTrigger>
                                            </Col>
                                            <Col md="4" sm="12">
                                              <div className="d-flex align-items-center gap-4">
                                                <div className="d-flex align-items-center gap-2">
                                                  <Input
                                                    type="radio"
                                                    name="smart_disable"
                                                    value="1"
                                                    checked={formData.smart_disable === "1"}
                                                    onChange={(e) =>
                                                      setFormData({
                                                        ...formData,
                                                        smart_disable: e.target.value,
                                                        make: [],
                                                      })
                                                    }
                                                  />
                                                  <span className="text-gray-700 devices">On</span>
                                                </div>

                                                <div className="d-flex align-items-center gap-2">
                                                  <Input
                                                    type="radio"
                                                    name="smart_disable"
                                                    value="0"
                                                    checked={formData.smart_disable === "0"}
                                                    onChange={(e) =>
                                                      setFormData({
                                                        ...formData,
                                                        smart_disable: e.target.value,
                                                      })
                                                    }
                                                  />
                                                  <span className="text-gray-700 devices">Off</span>
                                                </div>
                                              </div>
                                            </Col>
                                          </Row>
                                        </Col>
                                      </>
                                    )}
                                    {(goalType === "Cost Per Click (eCPC)" || goalType === "Cost Per Acquisition (eCPA)" || goalType === "Cost Per Completed Video (eCPCV)") && (
                                      <Col md="12" id="">
                                        <Row className="pl-md-1 align-items-center mb-2 mt-1">

                                          <Col md="2" className="d-flex justify-content-end">
                                            <Label className="forms-labels">Learn Budget</Label>
                                            <OverlayTrigger
                                              placement="right"
                                              overlay={
                                                <Tooltip id="tooltip-outstream">
                                                  Choose the type of placements where you want to play your video ad.
                                                </Tooltip>
                                              }
                                              delay={{ show: 250, hide: 0 }}
                                            >
                                              <i className="fa fa-info-circle offcircle ms-2 mt-1" />
                                            </OverlayTrigger>
                                          </Col>
                                          <Col md="2" sm="12" id="maxbid">
                                            <Input
                                              type="text"
                                              id="learn_budget"
                                              name="learn_budget"
                                              value={formData.learn_budget}
                                              onChange={(e) => {
                                                setFormErrors(p => ({ ...p, learn_budget: "" }));
                                                handleChange(e);
                                              }}
                                              className={`formscontrol${formErrors.learn_budget ? " border-danger" : ""}`}
                                              onMouseEnter={() => {
                                                setTooltipOpen((t) => ({ ...t, learn_budget: true }))
                                              }}
                                              onMouseLeave={() => setTooltipOpen((t) => ({ ...t, bid_step: false }))}
                                            />

                                            <span class="usd">USD</span>
                                            {formErrors.learn_budget && (<>
                                              <Tooltip
                                                placement="bottom"
                                                isOpen={tooltipOpen.learn_budget}
                                                target="learn_budget"
                                                autohide={false}

                                                popperClassName="custom-tooltip"
                                              >
                                                <div className="one"></div>
                                                {formErrors.learn_budget}
                                              </Tooltip></>

                                            )}
                                          </Col>
                                        </Row>
                                      </Col>
                                    )}
                                  </>
                                )}
                              </>

                            )}

                            {formData.optimize === "2" && (
                              <>
                                <Col md="12">
                                  <Row className="pl-md-1 align-items-center mb-2 mt-3">
                                    <Col md="2" className="d-flex justify-content-end">
                                      <Label className="forms-labels">Goal</Label>
                                    </Col>
                                    <Col md="3" sm="12">
                                      <div className="position-relative" id="optimizestatussmartbid">
                                        <div
                                          className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                          onClick={() => smartsetOpenGoalStatus(!smartopenGoalStatus)}
                                          tabIndex={0}
                                        >
                                          {smartgoalType}
                                          <FaCaretDown
                                            className={`custom-select-icon ${smartopenGoalStatus ? "open" : ""}`} />
                                        </div>
                                        {smartopenGoalStatus && (
                                          <div className="custom-dropdown-menu">
                                            {smartgoalOptions.map((opt, idx) => (
                                              <div
                                                key={idx}
                                                className={`custom-dropdown-option ${smartgoalType === opt.value ? "selected" : ""}`}
                                                onClick={() => {
                                                  smartsetGoalType(opt.value);
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    dollar_goal1: opt.defaultValue,
                                                    goal_status: opt.value,
                                                  }));
                                                  smartsetOpenGoalStatus(false);
                                                }}
                                              >
                                                <span className="tick-icon">
                                                  {smartgoalType === opt.value && "✓"}
                                                </span>
                                                <span>{opt.label}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </Col>
                                    <Col md="2">
                                      <Input
                                        placeholder="0"
                                        type="text"
                                        id="dollar_goal"
                                        name="dollar_goal"
                                        onMouseEnter={() => formErrors.dollar_goal1 && setTooltipOpen((t) => ({ ...t, dollar_goal1: true }))}
                                        onMouseLeave={() => setTooltipOpen((t) => ({ ...t, dollar_goal1: false }))}
                                        value={formData.dollar_goal1 || ""}
                                        onChange={(e) => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            dollar_goal1: e.target.value,
                                          }));
                                          setFormErrors((prev) => (
                                            {
                                              ...prev,
                                              dollar_goal1: "",
                                            }
                                          ))
                                        }}
                                        className={`normalized-input campagineditor ${formErrors.dollar_goal1 ? " border-danger" : ""}`} />
                                      {formErrors.dollar_goal1 && (<>
                                        <Tooltip
                                          placement="bottom"
                                          isOpen={tooltipOpen.dollar_goal1}
                                          target="dollar_goal"
                                          autohide={false}

                                          popperClassName="custom-tooltip"
                                        >
                                          <div className="one"></div>
                                          {formErrors.dollar_goal1}
                                        </Tooltip>
                                      </>
                                      )}
                                    </Col>
                                  </Row>
                                </Col>
                                <Row>
                                  <Col md="3" sm="12"
                                    className="d-flex justify-content-md-end justify-content-start mb-md-0 col-max-sm">
                                  </Col>
                                  <Col md="8" sm="12">
                                    <div role="alert" className="hows">
                                      <i className="fa fa-info-circle me-2" id="mesaasgeicon"></i>
                                      Make sure to set a Max Bid that's high enough to bid on all selected deals when the campaign is optimized. See Campaign <span className="maxbiding">Max bid</span>
                                    </div>
                                  </Col>
                                </Row>
                                {smartgoalType === "Cost Per Acquisition (eCPA)" && (
                                  <><Row className="mt-2">
                                    <Col md="4" sm="12"
                                      className="d-flex justify-content-md-end justify-content-start mb-md-0">
                                    </Col>
                                    <Col sm="12" md="0">
                                      <Row>
                                        <Col
                                          md="3"
                                          sm="12"
                                          className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm">
                                        </Col>
                                        <Col md="9" sm="12">
                                          <div className="d-flex align-items-center">
                                            <Input
                                              type="checkbox"
                                              id="primary_conversion"
                                              checked={!!formData.primary_conversion}
                                              onChange={(e) => setFormData((prev) => ({
                                                ...prev,
                                                primary_conversion: e.target.checked,
                                              }))} />
                                            <Label for="primary_conversion" className="ms-2 mb-0">
                                              <span className="usebid">Optimize for primary conversion</span>
                                              <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-outstream">
                                                  Choose the type of placements where you want to play your video ad.
                                                </Tooltip>}
                                                delay={{ show: 250, hide: 0 }}
                                              >
                                                <i className="fa fa-info-circle offcircle ms-2" />
                                              </OverlayTrigger>
                                            </Label>
                                          </div>
                                        </Col>
                                      </Row>
                                    </Col>
                                  </Row><Row className="pl-md-1 align-items-center mb-2">
                                      <Col
                                        md="3"
                                        sm="12"
                                        className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                      >
                                        <Label className="forms-labels">
                                          Learning Scope
                                          <OverlayTrigger
                                            placement="right"
                                            overlay={<Tooltip id="tooltip-outstream">
                                              Choose the type of placements where you want to play your video ad.
                                            </Tooltip>}
                                            delay={{ show: 250, hide: 0 }}
                                          >
                                            <i className="fa fa-info-circle offcircle ms-2" />
                                          </OverlayTrigger>
                                        </Label>
                                      </Col>

                                      <Col md="4" sm="12">
                                        <div className="d-flex align-items-center gap-4">
                                          <div className="d-flex align-items-center gap-2">
                                            <Input
                                              type="radio"
                                              name="learning_scope"
                                              value="1"
                                              checked={formData.learning_scope === "1"}
                                              onChange={(e) => setFormData({
                                                ...formData,
                                                learning_scope: e.target.value,
                                                make: [],
                                              })} />
                                            <span className="text-gray-700 devices">Pixel </span>
                                          </div>

                                          <div className="d-flex align-items-center gap-2">
                                            <Input
                                              type="radio"
                                              name="learning_scope"
                                              value="0"
                                              checked={formData.learning_scope === "0"}
                                              onChange={(e) => setFormData({
                                                ...formData,
                                                learning_scope: e.target.value,
                                              })} />
                                            <span className="text-gray-700 devices">Campaign</span>
                                          </div>
                                        </div>
                                      </Col>
                                    </Row>
                                  </>
                                )}
                                {(smartgoalType === "Viewable Rate (VR)" || smartgoalType === "Viewable CPM (VCPM)") && (
                                  <Row className="pl-md-1 mt-2">
                                    <Col md="2" className="d-none d-md-block" />
                                    <Col md="8" sm="12">
                                      <Col md="8" sm="12">
                                        <div role="alert" className="hows">
                                          <i className="fa fa-info-circle me-2" id="mesaasgeicon"></i>
                                          Measure Viewability has been turned on as it is required for the selected goal type.
                                          You will need to select a Viewability provider and standard <span className="maxbiding">Go to Viewability.</span>
                                        </div>
                                      </Col>
                                    </Col>
                                  </Row>
                                )}
                              </>
                            )}

                          </Row>

                          <Row id="budget-section">
                            <label className="fw-semibold Headlines mb-4">
                              Conversions
                            </label>
                          </Row>
                          <Row className="pl-md-1 align-items-center mb-2 mt-3">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Track Conversions
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>

                            <Col md="4" sm="12">
                              <div className="d-flex align-items-center gap-4">
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="track_conversions"
                                    value="1"
                                    checked={formData.track_conversions === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        track_conversions: e.target.value,

                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">On</span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="track_conversions"
                                    value="0"
                                    checked={formData.track_conversions === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        track_conversions: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">Off</span>
                                </div>
                              </div>
                            </Col>
                          </Row>
                          {formData.track_conversions === "1" && (
                            <>
                              <Row className="">
                                <Col md="1" className="d-none d-md-block">
                                </Col>
                                <Col md="2" className="d-none d-md-block">
                                  <Label className="forms-labels">
                                    Tracking List
                                  </Label>
                                </Col>
                                <Col md="8" sm="12">
                                </Col>
                              </Row>

                              <Row className="">

                                <Col sm="12">
                                  <ConversionEditor conversionlist={conversionlist} handletraceddata={handleconversion} />
                                </Col>
                              </Row>

                              <Row className="mt-2">
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels advancedvideo">
                                    Type
                                  </Label>
                                </Col>

                                <Col md="2" sm="12">
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="clickthrough"
                                      checked={formData.click_through_conversion}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          click_through_conversion: e.target.checked,
                                        }))
                                      }
                                    />
                                    <Label for="clickthrough" className="ms-2 mb-0">
                                      <span className="usebid">Clickthrough Conversions</span>
                                    </Label>
                                  </div>
                                </Col>
                                <Col
                                  md="3"
                                  sm="12"
                                  id="maxbid"
                                  className={
                                    !formData.click_through_conversion ? "disabled-section" : ""
                                  }
                                >
                                  <Label className="forms-labels advancedvideo">
                                    Lookback Window:
                                  </Label>

                                  <Input
                                    type="text"
                                    id="look_back_window"
                                    value={formData.look_back_window || ""}
                                    className="form-control normalized-input campagineditor bidipt look_back_window"
                                  />

                                  <span className="usd">Days</span>
                                </Col>
                              </Row>
                              <Row className="mt-2">
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels advancedvideo">
                                    Type
                                  </Label>
                                </Col>

                                <Col md="2" sm="12">
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="clickthrough"
                                      checked={formData.view_through_conversion}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          view_through_conversion: e.target.checked,
                                        }))
                                      }
                                    />
                                    <Label for="clickthrough" className="ms-2 mb-0">
                                      <span className="usebid">Viewthrough Conversions</span>
                                    </Label>
                                  </div>
                                </Col>
                                <Col
                                  md="3"
                                  sm="12"
                                  id="maxbid"
                                  className={
                                    !formData.view_through_conversion ? "disabled-section" : ""}>
                                  <Label className="forms-labels advancedvideo">
                                    Lookback Window:
                                  </Label>
                                  <Input
                                    type="text"
                                    id="look_back_window"
                                    value={formData.look_back_window1 || ""}
                                    className="form-control normalized-input campagineditor bidipt look_back_window" />
                                  <span className="usd">Days</span>
                                </Col>
                              </Row>
                              <Row className="mt-2">
                                <Col sm="2 "></Col>
                                <Col md="4" sm="12" id="maxbid">
                                  <Label className="forms-labels advancedvideo">
                                    Value viewthrough conversions at:
                                  </Label>
                                  <Input
                                    type="text"
                                    id="conversion_at"
                                    value={formData.conversion_at || ""}
                                    className="form-control normalized-input campagineditor bidipt look_back_window" />
                                </Col>
                              </Row>
                              <Row className="mt-2">
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >

                                </Col>

                                <Col md="2" sm="12">
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="chrome_privacy"
                                      checked={formData.chrome_privacy}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          chrome_privacy: e.target.checked,
                                        }))
                                      }
                                    />
                                    <Label for="chrome_privacy" className="ms-2 mb-0">
                                      <span className="usebid">Chrome Privacy Sandbox Attribution</span>
                                    </Label>
                                  </div>
                                </Col>
                                <Col
                                  md="3"
                                  sm="12" className={!formData.chrome_privacy ? "disabled-section" : ""}>
                                  <Input
                                    type="text"
                                    id="sandbox_attribution"
                                    value={formData.sandbox_attribution || ""}
                                    placeholder="Select a tracked conversion"
                                    className="form-control normalized-input campagineditor " />

                                </Col>
                              </Row>
                              <Row className="mt-2">
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels advancedvideo">
                                    Deduplication
                                  </Label>
                                </Col>

                                <Col md="4" sm="12" className="maxbid">
                                  <div className="d-flex align-items-center gap-4">
                                    <div className="d-flex align-items-center gap-2">
                                      <Input
                                        type="radio"
                                        name="count_conversion"
                                        value="1"
                                        checked={formData.count_conversion === "1"}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            count_conversion: e.target.value,
                                          })
                                        }
                                      />
                                      <span className="text-gray-700 devices">Count one conversion per user every</span>
                                    </div>
                                  </div>
                                  <Input
                                    type="text"
                                    id="look_back_window"
                                    value={formData.conversion_user || ""}
                                    className={`form-control normalized-input campagineditor bidipt look_back_window ${formData.count_conversion === "2" || formData.count_conversion === "3"
                                      ? "input-disabled"
                                      : ""
                                      }`}
                                  />
                                </Col>
                              </Row>
                              <Row className="mt-2">
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm">
                                </Col>
                                <Col md="4" sm="12" className="maxbid">
                                  <div className="d-flex align-items-center gap-4">
                                    <div className="d-flex align-items-center gap-2">
                                      <Input
                                        type="radio"
                                        name="count_conversion"
                                        value="2"
                                        checked={formData.count_conversion === "2"}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            count_conversion: e.target.value,
                                          })
                                        }
                                      />
                                      <span className="text-gray-700 devices">Count first conversion only</span>
                                    </div>
                                  </div>
                                </Col>
                              </Row>
                              <Row className="mt-2">
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm">
                                </Col>
                                <Col md="4" sm="12" className="maxbid">
                                  <div className="d-flex align-items-center gap-4">
                                    <div className="d-flex align-items-center gap-2">
                                      <Input
                                        type="radio"
                                        name="count_conversion"
                                        value="3"
                                        checked={formData.count_conversion === "3"}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            count_conversion: e.target.value,
                                          })
                                        }
                                      />
                                      <span className="text-gray-700 devices">Count every conversion</span>
                                    </div>
                                  </div>
                                </Col>
                              </Row>

                            </>
                          )}
                          <Row id="budget-section">
                            <label className="fw-semibold Headlines mb-4">
                              Viewability
                            </label>
                          </Row>

                          <Row className="pl-md-1 align-items-center mb-2 mt-3">
                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Measure Viewability
                                <OverlayTrigger
                                  placement="right"
                                  overlay={
                                    <Tooltip id="tooltip-outstream">
                                      Choose the type of placements where you want to play your video ad.
                                    </Tooltip>
                                  }
                                  delay={{ show: 250, hide: 0 }}
                                >
                                  <i className="fa fa-info-circle offcircle ms-2" />
                                </OverlayTrigger>
                              </Label>
                            </Col>

                            <Col md="4" sm="12">
                              <div className="d-flex align-items-center gap-4">
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="measure_viewability"
                                    value="1"
                                    checked={formData.measure_viewability === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        measure_viewability: e.target.value,

                                      })
                                    }


                                  />
                                  <span className="text-gray-700 devices">On</span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="measure_viewability"
                                    value="0"
                                    checked={formData.measure_viewability === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        measure_viewability: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">Off</span>
                                </div>
                              </div>
                            </Col>
                          </Row>
                          {formData.measure_viewability === "1" && (
                            <>
                              <Row className="">
                                <Col md="1" className="d-none d-md-block">
                                </Col>
                                <Col md="1" className="d-none d-md-block">
                                  <Label className="forms-labels">
                                    Provider
                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-outstream">
                                          Choose the type of placements where you want to play your video ad.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle offcircle ms-2" />
                                    </OverlayTrigger>
                                  </Label>
                                </Col>
                                <Col md="7" sm="12">
                                  <div className="d-flex align-items-center gap-4">
                                    <div className="d-flex align-items-start gap-2">
                                      <Input
                                        type="radio"
                                        name="provider"
                                        value="1"
                                        checked={formData.provider === "1"}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            provider: e.target.value,
                                          })
                                        }
                                        className="mt-2"
                                      />
                                      <div>
                                        <span className="text-gray-700 devices fw-semibold">
                                          DoubleVerify
                                        </span>
                                        <br />
                                        <span className="text-gray-700 doubleabilty">
                                          Measure viewability on display ($0.12 CPM) and video ($0.20 CPM) creatives.
                                        </span>
                                        <br />
                                        <span className="text-gray-700 doubleabilty"> DoubleVerify's viewability fees will be waived if you also use DoubleVerify Brand Protection viewability segments.</span>
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                              </Row>
                              <Row className="mt-3">
                                <Col md="1" className="d-none d-md-block">
                                </Col>
                                <Col md="1" className="d-none d-md-block">

                                </Col>
                                <Col md="7" sm="12">
                                  <div className="d-flex align-items-center gap-4">
                                    <div className="d-flex align-items-start gap-2">
                                      <Input
                                        type="radio"
                                        name="provider"
                                        value="2"
                                        checked={formData.provider === "2"}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            provider: e.target.value,
                                          })
                                        }
                                        className="mt-2"
                                      />
                                      <div>
                                        <span className="text-gray-700 devices fw-semibold">
                                          Pixalate
                                        </span>
                                        <br />
                                        <span className="text-gray-700 doubleabilty">
                                          Measure viewability on display ($0.03 CPM) creatives
                                        </span>
                                        <br />
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                              </Row>

                              {formData.provider === "1" && (
                                <>
                                  <Row className="">
                                    <Col md="1" className="d-none d-md-block">
                                    </Col>
                                    <Col md="1" className="d-none d-md-block">
                                      <Label className="forms-labels">
                                        Standard
                                        <OverlayTrigger
                                          placement="right"
                                          overlay={
                                            <Tooltip id="tooltip-outstream">
                                              Choose the type of placements where you want to play your video ad.
                                            </Tooltip>
                                          }
                                          delay={{ show: 250, hide: 0 }}
                                        >
                                          <i className="fa fa-info-circle offcircle ms-2" />
                                        </OverlayTrigger>
                                      </Label>
                                    </Col>
                                    <Col md="7" sm="12">
                                      <div className="d-flex align-items-center gap-4">
                                        <div className="d-flex align-items-start gap-2">
                                          <Input
                                            type="radio"
                                            name="standard"
                                            value="1"
                                            checked={formData.standard === "1"}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                standard: e.target.value,
                                              })
                                            }
                                            className="mt-2"
                                          />
                                          <div>
                                            <span className="text-gray-700 devices fw-semibold">
                                              GroupM
                                              <OverlayTrigger
                                                placement="right"
                                                overlay={
                                                  <Tooltip id="tooltip-outstream">
                                                    Choose the type of placements where you want to play your video ad.
                                                  </Tooltip>
                                                }
                                                delay={{ show: 250, hide: 0 }}
                                              >
                                                <i className="fa fa-info-circle offcircle ms-2" />
                                              </OverlayTrigger>
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </Col>
                                  </Row>
                                  <Row className="">
                                    <Col md="1" className="d-none d-md-block">
                                    </Col>
                                    <Col md="1" className="d-none d-md-block">
                                    </Col>
                                    <Col md="7" sm="12">
                                      <div className="d-flex align-items-center gap-4">
                                        <div className="d-flex align-items-start gap-2">
                                          <Input
                                            type="radio"
                                            name="standard"
                                            value="2"
                                            checked={formData.standard === "2"}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                standard: e.target.value,
                                              })
                                            }
                                            className="mt-2"
                                          />
                                          <div>
                                            <span className="text-gray-700 devices fw-semibold">
                                              PMX
                                              <OverlayTrigger
                                                placement="right"
                                                overlay={
                                                  <Tooltip id="tooltip-outstream">
                                                    Choose the type of placements where you want to play your video ad.
                                                  </Tooltip>
                                                }
                                                delay={{ show: 250, hide: 0 }}
                                              >
                                                <i className="fa fa-info-circle offcircle ms-2" />
                                              </OverlayTrigger>
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </Col>
                                  </Row>
                                  <Row className="mt-2">
                                    <Col md="1" className="d-none d-md-block">
                                    </Col>
                                    <Col md="1" className="d-none d-md-block">
                                    </Col>
                                    <Col md="7" sm="12">
                                      <div className="d-flex align-items-center gap-4">
                                        <div className="d-flex align-items-start gap-2">
                                          <Input
                                            type="radio"
                                            name="standard"
                                            value="3"
                                            checked={formData.standard === "3"}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                standard: e.target.value,
                                              })
                                            }
                                            className="mt-2"
                                          />
                                          <div>
                                            <span className="text-gray-700 devices fw-semibold">
                                              IAB/MRC
                                              <OverlayTrigger
                                                placement="right"
                                                overlay={
                                                  <Tooltip id="tooltip-outstream">
                                                    Choose the type of placements where you want to play your video ad.
                                                  </Tooltip>
                                                }
                                                delay={{ show: 250, hide: 0 }}
                                              >
                                                <i className="fa fa-info-circle offcircle ms-2" />
                                              </OverlayTrigger>
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </Col>
                                  </Row>
                                </>
                              )}

                              <Row className="pl-md-1 align-items-center mb-2 mt-3">
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="mb-0 forms-labels">
                                    Sampling Rate

                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-outstream">
                                          Choose the type of placements where you
                                          want to play your video ad.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle  ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </Label>
                                </Col>

                                <Col md="3" sm="12">
                                  <Input
                                    id="sampling_rate"
                                    value={formData.sampling_rate}
                                    onChange={(e) => { setFormData((prev) => { return { ...prev, sampling_rate: e.target.value } }) }}
                                    className="form-control normalized-input campagineditor"
                                    placeholder="100%"
                                    type="text"
                                    autoComplete="off"
                                  />
                                </Col>
                              </Row>
                              {formData.provider === "0" && (
                                <>
                                  <Row className="pl-md-1 align-items-center mb-2 mt-3">
                                    <Col
                                      md="3"
                                      sm="12"
                                      className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                    >
                                      <Label className="mb-0 forms-labels">
                                        Standard
                                        <OverlayTrigger
                                          placement="right"
                                          overlay={
                                            <Tooltip id="tooltip-outstream">
                                              Choose the type of placements where you
                                              want to play your video ad.
                                            </Tooltip>
                                          }
                                          delay={{ show: 250, hide: 0 }}
                                        >
                                          <i className="fa fa-info-circle  ms-2 offcircle" />
                                        </OverlayTrigger>
                                      </Label>
                                    </Col>

                                    <Col md="3" sm="12">
                                      <span className="text-gray-700 devices fw-semibold">
                                        IAB/MRC</span>
                                    </Col>
                                  </Row>
                                </>
                              )}
                            </>
                          )}
                          <Row id="budget-section">
                            <label className="fw-semibold Headlines mb-4">
                              Advanced
                            </label>
                          </Row>
                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm">
                              </Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="advanced_video"
                                    checked={!!formData.advanced_video}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        advanced_video: e.target.checked,
                                      }))
                                    }
                                  />
                                  <Label for="advanced_video" className="ms-2 mb-0">
                                    <span className="usebid">Video</span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>

                          </Col>



                          {formData.advanced_video && (
                            <>

                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col md="2" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Placement Type
                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-placement">
                                          Choose the type of placements where you want to play your video ad.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">

                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="instream"
                                      checked={
                                        formData.placement_type.instream ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          placement_type: {
                                            ...prev.placement_type,
                                            instream: e.target.checked

                                          },
                                        }))
                                      }
                                    />
                                    <Label for="instream" className="ms-2 mb-0 advancedvideo">
                                      Instream
                                      <OverlayTrigger
                                        placement="right"
                                        overlay={
                                          <Tooltip id="tooltip-instream">
                                            Video ad plays within non-primary video content.
                                          </Tooltip>
                                        }
                                        delay={{ show: 250, hide: 0 }}
                                      >
                                        <i className="fa fa-info-circle ms-2 offcircle" />
                                      </OverlayTrigger>
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={formData.placement_type.Accompanying === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          placement_type: {
                                            ...prev.placement_type,
                                            Accompanying: e.target.checked
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="accompanying" className="ms-2 mb-0 advancedvideo">
                                      Accompanying Content
                                      <OverlayTrigger
                                        placement="right"
                                        overlay={
                                          <Tooltip id="tooltip-accompanying">
                                            Video ad appears alongside related content.
                                          </Tooltip>
                                        }
                                        delay={{ show: 250, hide: 0 }}
                                      >
                                        <i className="fa fa-info-circle ms-2 offcircle" />
                                      </OverlayTrigger>
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="interstitial"
                                      checked={formData?.placement_type?.Interstitial === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          placement_type: {
                                            ...prev.placement_type,
                                            Interstitial: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="interstitial" className="ms-2 mb-0 advancedvideo">
                                      Interstitial
                                    </Label>

                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-interstitial">
                                          Video ad appears between content transitions.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </div>


                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="standalone"
                                      checked={formData?.placement_type?.Standalone === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          placement_type: {
                                            ...prev.placement_type,
                                            Standalone: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="standalone" className="ms-2 mb-0 advancedvideo">
                                      Standalone
                                    </Label>

                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-standalone">
                                          Video ad plays independently without related content.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </div>

                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="Unknown"
                                      checked={formData?.placement_type?.Unknown === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          placement_type: {
                                            ...prev.placement_type,
                                            Unknown: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="Unknown" className="ms-2 mb-0 advancedvideo">
                                      Unknown
                                    </Label>

                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-Unknown">
                                          Video ad plays independently without related content.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </div>

                                </Col>

                              </Row>

                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col md="2" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Roll Position
                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-placement">
                                          Choose the type of placements where you want to play your video ad.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <Row>
                                    <Col md="2" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.roll_position.preroll ===
                                            true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              roll_position: {
                                                ...prev.roll_position,
                                                preroll: e.target.checked

                                              },
                                            }))
                                          }
                                        />
                                        <Label for="instream" className="ms-2 mb-0 advancedvideo">
                                          Pre-Roll
                                        </Label>
                                      </div>
                                    </Col>
                                    <Col md="2" sm="12">
                                      <div className="d-flex align-items-center">
                                        <Input
                                          type="checkbox"
                                          id="accompanying"
                                          checked={formData.roll_position.midroll === true}
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              roll_position: {
                                                ...prev.roll_position,
                                                midroll: e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <Label for="accompanying" className="ms-2 mb-0 advancedvideo">
                                          Mid-Roll
                                        </Label>
                                      </div>
                                    </Col>
                                    <Col md="2" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.roll_position.postroll ===
                                            true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              roll_position: {
                                                ...prev.roll_position,
                                                postroll: e.target.checked

                                              },
                                            }))
                                          }
                                        />
                                        <Label for="instream" className="ms-2 mb-0 advancedvideo">
                                          Post-Roll
                                        </Label>
                                      </div>
                                    </Col>
                                    <Col md="2" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="unknown"
                                          checked={formData.roll_position.unknown === true}
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              roll_position: {
                                                ...prev.roll_position,
                                                unknown: e.target.checked
                                              },
                                            }))
                                          }
                                        />
                                        <Label for="unknown" className="ms-2 mb-0 advancedvideo">
                                          Unknown
                                        </Label>
                                      </div>
                                    </Col>

                                  </Row>
                                </Col>

                              </Row>

                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col md="2" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Player Size
                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-placement">
                                          Choose the type of placements where you want to play your video ad.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <Row>
                                    <Col md="4" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.player_size.small_player ===
                                            true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              player_size: {
                                                ...prev.player_size,
                                                small_player: e.target.checked

                                              },
                                            }))
                                          }
                                        />
                                        <Label for="instream" className="ms-2 mb-0 advancedvideo">
                                          Exclude small player size
                                          <OverlayTrigger
                                            placement="right"
                                            overlay={
                                              <Tooltip id="tooltip-instream">
                                                Video ad plays within non-primary video content.
                                              </Tooltip>
                                            }
                                            delay={{ show: 250, hide: 0 }}
                                          >
                                            <i className="fa fa-info-circle ms-2 offcircle" />
                                          </OverlayTrigger>
                                        </Label>
                                      </div>
                                    </Col>

                                    <Col md="4" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.player_size.unknown_player ===
                                            true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              player_size: {
                                                ...prev.player_size,
                                                unknown_player: e.target.checked

                                              },
                                            }))
                                          }
                                        />
                                        <Label for="instream" className="ms-2 mb-0 advancedvideo">
                                          Exclude unknown player size
                                        </Label>
                                      </div>
                                    </Col>
                                  </Row>
                                </Col>
                              </Row>
                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col md="2" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Skippable Ads
                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-placement">
                                          Choose the type of placements where you want to play your video ad.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">

                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="instream"
                                      checked={
                                        formData.skippable_ads.Skippable ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          skippable_ads: {
                                            ...prev.skippable_ads,
                                            Skippable: e.target.checked

                                          },
                                        }))
                                      }
                                    />
                                    <Label for="instream" className="ms-2 mb-0 advancedvideo">
                                      Skippable video impressions
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={formData.skippable_ads.Non_skippable === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          skippable_ads: {
                                            ...prev.skippable_ads,
                                            Non_skippable: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="accompanying" className="ms-2 mb-0 advancedvideo">
                                      Non-skippable video impressions
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={formData.skippable_ads.Skippability === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          skippable_ads: {
                                            ...prev.skippable_ads,
                                            Skippability: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="accompanying" className="ms-2 mb-0 advancedvideo">
                                      Skippability unknown
                                    </Label>
                                  </div>

                                </Col>

                              </Row>
                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col md="2" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Playback Method
                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-placement">
                                          Choose the type of placements where you want to play your video ad.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">

                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="instream"
                                      checked={
                                        formData.playback_method.soundOn === true

                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          playback_method: {
                                            ...prev.playback_method,
                                            soundOn: e.target.checked


                                          },
                                        }))
                                      }
                                    />
                                    <Label for="instream" className="ms-2 mb-0 advancedvideo">
                                      Auto-play with sound on

                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={formData.playback_method.soundOff === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          playback_method: {
                                            ...prev.playback_method,
                                            soundOff: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="accompanying" className="ms-2 mb-0 advancedvideo">
                                      Auto-play with sound off
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={formData.playback_method.click_to_play === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          playback_method: {
                                            ...prev.playback_method,
                                            click_to_play: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="accompanying" className="ms-2 mb-0 advancedvideo">
                                      Click to play
                                    </Label>
                                  </div>

                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={formData.playback_method.Mouseover === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          playback_method: {
                                            ...prev.playback_method,
                                            Mouseover: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="accompanying" className="ms-2 mb-0 advancedvideo">
                                      Mouseover to play
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={formData.playback_method.Playback === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          playback_method: {
                                            ...prev.playback_method,
                                            Playback: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="accompanying" className="ms-2 mb-0 advancedvideo">
                                      Playback method unknown
                                    </Label>
                                  </div>
                                </Col>

                              </Row>
                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col md="2" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Reward Status
                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-placement">
                                          Choose the type of placements where you want to play your video ad.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <Row>
                                    <Col md="3" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.reward_status.Rewarded ===
                                            true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              reward_status: {
                                                ...prev.reward_status,
                                                Rewarded: e.target.checked

                                              },
                                            }))
                                          }
                                        />
                                        <Label for="instream" className="ms-2 mb-0 advancedvideo">
                                          Rewarded
                                        </Label>
                                      </div>
                                    </Col>
                                    <Col md="3" sm="12">
                                      <div className="d-flex align-items-center">
                                        <Input
                                          type="checkbox"
                                          id="accompanying"
                                          checked={formData.reward_status.Unrewarded === true}
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              reward_status: {
                                                ...prev.reward_status,
                                                Unrewarded: e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <Label for="accompanying" className="ms-2 mb-0 advancedvideo">
                                          Unrewarded
                                        </Label>
                                      </div>
                                    </Col>
                                    <Col md="3" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.reward_status.UnknownReward === true

                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              reward_status: {
                                                ...prev.reward_status,
                                                UnknownReward: e.target.checked

                                              },
                                            }))
                                          }
                                        />
                                        <Label for="instream" className="ms-2 mb-0 advancedvideo">
                                          Unknown

                                        </Label>
                                      </div>
                                    </Col>
                                  </Row>
                                </Col>

                              </Row>

                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col md="2" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Orientation Matching
                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-placement">
                                          Choose the type of placements where you want to play your video ad.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <Row>
                                    <Col md="4" sm="12">
                                      <div className="d-flex align-items-center gap-4">
                                        <div className="d-flex align-items-center gap-2">
                                          <Input
                                            type="radio"
                                            name="orientation_matching"
                                            value="1"
                                            checked={formData.orientation_matching === "1"}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                orientation_matching: e.target.value,
                                                make: [],
                                              })
                                            }
                                          />
                                          <span className="text-gray-700 devices">On</span>
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                          <Input
                                            type="radio"
                                            name="orientation_matching"
                                            value="0"
                                            checked={formData.orientation_matching === "0"}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                orientation_matching: e.target.value,
                                              })
                                            }
                                          />
                                          <span className="text-gray-700 devices">Off</span>
                                        </div>
                                      </div>
                                    </Col>
                                  </Row>
                                </Col>

                              </Row>





                            </>
                          )}

                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm">
                              </Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="advanced_audio"
                                    checked={!!formData.advanced_audio}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        advanced_audio: e.target.checked,
                                      }))
                                    }
                                  />
                                  <Label for="advanced_audio" className="ms-2 mb-0">
                                    <span className="usebid">Audio</span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>

                          </Col>
                          {formData.advanced_audio && (
                            <>
                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col md="2" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Feed Types
                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-placement">
                                          Choose the type of placements where you want to play your video ad.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">

                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="instream"
                                      checked={
                                        formData.audio.music === true

                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            music: e.target.checked

                                          },
                                        }))
                                      }
                                    />
                                    <Label for="instream" className="ms-2 mb-0 advancedvideo">
                                      Music streaming service
                                      <OverlayTrigger
                                        placement="right"
                                        overlay={
                                          <Tooltip id="tooltip-instream">
                                            Video ad plays within non-primary video content.
                                          </Tooltip>
                                        }
                                        delay={{ show: 250, hide: 0 }}
                                      >
                                        <i className="fa fa-info-circle ms-2 offcircle" />
                                      </OverlayTrigger>
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="fm_am"
                                      checked={formData.audio.fm_am === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            fm_am: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="fm_am" className="ms-2 mb-0 advancedvideo">
                                      FM/AM broadcast
                                      <OverlayTrigger
                                        placement="right"
                                        overlay={
                                          <Tooltip id="tooltip-accompanying">
                                            Video ad appears alongside related content.
                                          </Tooltip>
                                        }
                                        delay={{ show: 250, hide: 0 }}
                                      >
                                        <i className="fa fa-info-circle ms-2 offcircle" />
                                      </OverlayTrigger>
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="Podcast"
                                      checked={formData?.audio?.Podcast === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            Podcast: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="Podcast" className="ms-2 mb-0 advancedvideo">
                                      Podcast
                                    </Label>

                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-interstitial">
                                          Video ad appears between content transitions.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </div>


                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="catch_up"
                                      checked={formData?.audio?.catch_up === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            catch_up: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="catch_up" className="ms-2 mb-0 advancedvideo">
                                      Catch-up radio
                                    </Label>

                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-catch_up">
                                          Video ad plays independently without related content.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </div>

                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="Webradio"
                                      checked={formData?.audio?.Webradio === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            Webradio: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="Webradio" className="ms-2 mb-0 advancedvideo">
                                      Web radio
                                    </Label>

                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-Webradio">
                                          Video ad plays independently without related content.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </div>

                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="Videogame"
                                      checked={formData?.audio?.Videogame === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            Videogame: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="Videogame" className="ms-2 mb-0 advancedvideo">
                                      Video game
                                    </Label>

                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-Videogame">
                                          Video ad plays independently without related content.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="Videogame"
                                      checked={formData?.audio?.Textto_speech === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            Textto_speech: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="Textto_speech" className="ms-2 mb-0 advancedvideo">
                                      Text To Speech
                                    </Label>

                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-Textto_speech">
                                          Video ad plays independently without related content.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="Videogame"
                                      checked={formData?.audio?.Feedtype_unknown === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            Feedtype_unknown: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for="Feedtype_unknown" className="ms-2 mb-0 advancedvideo">
                                      Feed type unknown
                                    </Label>

                                    <OverlayTrigger
                                      placement="right"
                                      overlay={
                                        <Tooltip id="tooltip-Feedtype_unknown">
                                          Video ad plays independently without related content.
                                        </Tooltip>
                                      }
                                      delay={{ show: 250, hide: 0 }}
                                    >
                                      <i className="fa fa-info-circle ms-2 offcircle" />
                                    </OverlayTrigger>
                                  </div>
                                </Col>
                              </Row>
                            </>
                          )}

                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm">
                              </Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="page_position"
                                    checked={!!formData.page_position}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        page_position: e.target.checked,
                                      }))
                                    }
                                  />
                                  <Label for="page_position" className="ms-2 mb-0">
                                    <span className="usebid">Page Position</span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>
                          </Col>
                          {formData.page_position && (
                            <Row className="align-items-start mb-2">
                              <Col md="1" className="d-none d-md-block" />
                              <Col md="1" sm="12" />

                              <Col md="6" sm="12">
                                <Row>
                                  <Col md="3" sm="12">
                                    <div className="d-flex align-items-center mb-1">
                                      <Input
                                        type="checkbox"
                                        id="above_fold"
                                        checked={formData?.page_fold?.above_fold === true}
                                        onChange={(e) =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            page_fold: {
                                              ...prev.page_fold,
                                              above_fold: e.target.checked,
                                            },
                                          }))
                                        }
                                      />
                                      <Label for="above_fold" className="ms-2 mb-0 advancedvideo">
                                        Above the Fold (ATF)
                                      </Label>
                                    </div>
                                  </Col>
                                  <Col md="3" sm="12">
                                    <div className="d-flex align-items-center">
                                      <Input
                                        type="checkbox"
                                        id="below_fold"
                                        checked={formData?.page_fold?.below_fold === true}
                                        onChange={(e) =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            page_fold: {
                                              ...prev.page_fold,
                                              below_fold: e.target.checked,
                                            },
                                          }))
                                        }
                                      />
                                      <Label for="below_fold" className="ms-2 mb-0 advancedvideo">
                                        Below the Fold (BTF)
                                      </Label>
                                    </div>
                                  </Col>
                                  <Col md="3" sm="12">
                                    <div className="d-flex align-items-center mb-1">
                                      <Input
                                        type="checkbox"
                                        id="page_unknown"
                                        checked={formData?.page_fold?.page_unknown === true}
                                        onChange={(e) =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            page_fold: {
                                              ...prev.page_fold,
                                              page_unknown: e.target.checked,
                                            },
                                          }))
                                        }
                                      />
                                      <Label for="page_unknown" className="ms-2 mb-0 advancedvideo">
                                        Unknown
                                      </Label>
                                    </div>
                                  </Col>
                                </Row>
                              </Col>
                            </Row>
                          )}

                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm">
                              </Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="brand_Protection"
                                    checked={!!formData.brand_Protection}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        brand_Protection: e.target.checked,
                                      }))
                                    }
                                  />
                                  <Label for="page_position" className="ms-2 mb-0">
                                    <span className="usebid">Brand Protection</span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>
                          </Col>
                          {formData.brand_Protection && (
                            <>
                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col md="1" sm="12" />

                                <Col md="8" sm="12">
                                  <span className="ssnote">Target segments by adding them as an <span className="font-bold">AND</span> or  <span className="font-bold">OR</span> from the list on the left. You can switch the rules on the right by clicking on any of the <span className="font-bold">AND</span> or<span className="font-bold">OR</span>  buttons.
                                    You can also rearrange the order of your target conditions using the up and down arrows on each targeted segment.</span>
                                </Col>
                              </Row>
                            </>
                          )}
                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm">
                              </Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="audience_capture"
                                    checked={!!formData.audience_capture}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        audience_capture: e.target.checked,
                                      }))
                                    }
                                  />
                                  <Label for="audience_capture" className="ms-2 mb-0">
                                    <span className="usebid">Audience Capture</span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>
                          </Col>
                          {formData.audience_capture && (
                            <>
                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col md="2" sm="12">
                                </Col>

                                <Col md="6" sm="12">
                                  <Row>
                                    <Col md="5" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="capture_clicks"
                                          checked={formData.audience_capture.Clicks === "Capture Clicks"}
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              audience_capture: {
                                                ...prev.audience_capture,
                                                Clicks: e.target.checked ? "Capture Clicks" : "",
                                              },
                                            }))
                                          }
                                        />
                                        <Label for="capture_clicks" className="ms-2 mb-0 advancedvideo">
                                          Capture Clicks
                                          <OverlayTrigger
                                            placement="right"
                                            overlay={
                                              <Tooltip id="tooltip-placement">
                                                Users that click your ad will automatically be added to a
                                                retargeting list of your choice.
                                              </Tooltip>
                                            }
                                            delay={{ show: 250, hide: 0 }}
                                          >
                                            <i className="fa fa-info-circle ms-2 offcircle" />
                                          </OverlayTrigger>
                                        </Label>
                                      </div>
                                    </Col>
                                    <Col md="6" sm="12">
                                      {formData.audience_capture.Clicks === "Capture Clicks" && (
                                        <>

                                          <div className="position-relative">
                                            <div
                                              className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                              onClick={() => setOpenAudienceStatus(!openaudienceStatus)}
                                              tabIndex={0}
                                            >
                                              {audienceType}
                                              <FaCaretDown
                                                className={`custom-select-icon ${openaudienceStatus ? "open" : ""}`} />
                                            </div>
                                            {openaudienceStatus && (
                                              <div className="custom-dropdown-menu">
                                                {audiencecapturedropdown.map((opt, idx) => (
                                                  <div
                                                    key={idx}
                                                    className={`custom-dropdown-option ${audienceType === opt.name ? "selected" : ""}`}
                                                    onClick={() => {
                                                      setAudienceType(opt.name);
                                                      setFormData((prev) => ({
                                                        ...prev,
                                                        Capture_Clicks: opt.name
                                                      }));

                                                      setOpenAudienceStatus(false);
                                                    }}
                                                  >
                                                    <span className="tick-icon">
                                                      {audienceType == opt.name && "✓"}
                                                    </span>
                                                    <span>{opt.name}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </Col>
                                  </Row>
                                  <Row>
                                    <Col md="5" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="capture_conversions"
                                          checked={formData.audience_capture.Conversions === "Capture conversion"}
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              audience_capture: {
                                                ...prev.audience_capture,
                                                Conversions: e.target.checked ? "Capture conversion" : "",
                                              },
                                            }))
                                          }
                                        />
                                        <Label for="audience_capture" className="ms-2 mb-0 advancedvideo">
                                          Capture Conversions
                                          <OverlayTrigger
                                            placement="right"
                                            overlay={
                                              <Tooltip id="tooltip-placement">
                                                Any users that trigger a conversion for your campaign can
                                                also be automatically added to your own retargeting list.
                                                Naturally, you must have conversion tracking configured
                                                properly for this feature to take effect.
                                              </Tooltip>
                                            }
                                            delay={{ show: 250, hide: 0 }}
                                          >
                                            <i className="fa fa-info-circle ms-2 offcircle" />
                                          </OverlayTrigger>
                                        </Label>
                                      </div>
                                    </Col>

                                    <Col md="6" sm="12">
                                      {formData.audience_capture.Conversions === "Capture conversion" && (
                                        <>

                                          <div className="position-relative">
                                            <div
                                              className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                              onClick={() => setOpenAudienceStatus1(!openaudienceStatus1)}
                                              tabIndex={0}
                                            >
                                              {audienceType1}
                                              <FaCaretDown
                                                className={`custom-select-icon ${openaudienceStatus1 ? "open" : ""}`} />
                                            </div>
                                            {openaudienceStatus1 && (
                                              <div className="custom-dropdown-menu">
                                                {audiencecapturedropdown.map((opt, idx) => (
                                                  <div
                                                    key={idx}
                                                    className={`custom-dropdown-option ${audienceType1 === opt.name ? "selected" : ""}`}
                                                    onClick={() => {
                                                      setAudienceType1(opt.name);
                                                      setFormData((prev) => ({
                                                        ...prev,
                                                        Capture_Conversions: opt.name,
                                                      }));
                                                      setOpenAudienceStatus1(false);
                                                    }}
                                                  >
                                                    <span className="tick-icon">
                                                      {1 === opt.name && "✓"}
                                                    </span>
                                                    <span>{opt.name}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </Col>
                                  </Row>
                                  <Row>
                                    <Col md="5" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="capture_conversions"
                                          checked={formData.audience_capture.Audio === "Capture conversion"}
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              audience_capture: {
                                                ...prev.audience_capture,
                                                Audio: e.target.checked ? "Capture conversion" : "",
                                              },
                                            }))
                                          }
                                        />
                                        <Label for="audience_capture" className="ms-2 mb-0 advancedvideo">
                                          Capture Audio/Video Events
                                          <OverlayTrigger
                                            placement="right"
                                            overlay={
                                              <Tooltip id="tooltip-placement">
                                                Any users that trigger a conversion for your campaign can
                                                also be automatically added to your own retargeting list.
                                                Naturally, you must have conversion tracking configured
                                                properly for this feature to take effect.
                                              </Tooltip>
                                            }
                                            delay={{ show: 250, hide: 0 }}
                                          >
                                            <i className="fa fa-info-circle ms-2 offcircle" />
                                          </OverlayTrigger>
                                        </Label>
                                      </div>
                                    </Col>


                                  </Row>

                                  {formData.audience_capture.Audio === "Capture conversion" && (
                                    <><Row>
                                      <Col md="5" sm="12">
                                        <div className="d-flex align-items-center mb-1"></div>
                                      </Col>
                                      <Col md="6" sm="12"></Col>
                                      <div role="alert" className="how">
                                        <i className="fa fa-info-circle me-2" id="mesaasgeicon"></i>
                                        There are no audio or video ads linked to this campaign.<span className="gotolinked"> Go to Linked Ads</span> to add creatives.
                                      </div>
                                    </Row>
                                      <Row>
                                        <Col md="5" sm="12">
                                          <div className="d-flex align-items-center mb-1">
                                            <Input
                                              type="checkbox"
                                              id="capture_conversions"
                                              checked={
                                                formData.audience_capture.complete_25 === "Capture conversion"
                                              }
                                              onChange={(e) =>
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  audience_capture: {
                                                    ...prev.audience_capture,
                                                    complete_25: e.target.checked ? "Capture conversion" : "",
                                                  },
                                                }))
                                              }
                                            />
                                            <Label className="ms-2 mb-0 advancedvideo">
                                              25% Complete
                                            </Label>
                                          </div>
                                        </Col>

                                        <Col md="6" sm="12">
                                          {formData.audience_capture.complete_25 === "Capture conversion" && (
                                            <>
                                              <div id="audiencepercentage" className="position-relative">
                                                <div
                                                  className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                                  onClick={() =>
                                                    setOpen25AudienceStatus(!open25audienceStatus)
                                                  }
                                                  tabIndex={0}
                                                >
                                                  {audienceType_25}
                                                  <FaCaretDown
                                                    className={`custom-select-icon ${open25audienceStatus ? "open" : ""
                                                      }`}
                                                  />
                                                </div>

                                                {open25audienceStatus && (
                                                  <div className="custom-dropdown-menu">
                                                    {captureaudienceOptions.map((opt, idx) => (
                                                      <div
                                                        key={idx}
                                                        className={`custom-dropdown-option ${audienceType_25 === opt.value ? "selected" : ""
                                                          }`}
                                                        onClick={() => {
                                                          setAudienceType_25(opt.value);
                                                          setFormData((prev) => ({
                                                            ...prev,
                                                            complete_25: opt.value,
                                                          }));
                                                          setOpen25AudienceStatus(false);
                                                        }}
                                                      >
                                                        <span className="tick-icon">
                                                          {audienceType_25 === opt.value && "✓"}
                                                        </span>
                                                        <span>{opt.label}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </Col>
                                      </Row>

                                      <Row>
                                        <Col md="5" sm="12">
                                          <div className="d-flex align-items-center mb-1">
                                            <Input
                                              type="checkbox"
                                              id="capture_conversions"
                                              checked={
                                                formData.audience_capture.complete_50 === "Capture conversion"
                                              }
                                              onChange={(e) =>
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  audience_capture: {
                                                    ...prev.audience_capture,
                                                    complete_50: e.target.checked ? "Capture conversion" : "",
                                                  },
                                                }))
                                              }
                                            />
                                            <Label className="ms-2 mb-0 advancedvideo">
                                              50% Complete
                                            </Label>
                                          </div>
                                        </Col>

                                        <Col md="6" sm="12">
                                          {formData.audience_capture.complete_50 === "Capture conversion" && (
                                            <>
                                              <div id="audience50percentage" className="position-relative">
                                                <div
                                                  className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                                  onClick={() =>
                                                    setOpen50AudienceStatus(!open50audienceStatus)
                                                  }
                                                  tabIndex={0}
                                                >
                                                  {audienceType_50}
                                                  <FaCaretDown
                                                    className={`custom-select-icon ${open50audienceStatus ? "open" : ""
                                                      }`}
                                                  />
                                                </div>

                                                {open50audienceStatus && (
                                                  <div className="custom-dropdown-menu">
                                                    {captureaudienceOptions.map((opt, idx) => (
                                                      <div
                                                        key={idx}
                                                        className={`custom-dropdown-option ${audienceType_50 === opt.value ? "selected" : ""
                                                          }`}
                                                        onClick={() => {
                                                          setAudienceType_50(opt.value);
                                                          setFormData((prev) => ({
                                                            ...prev,
                                                            complete_50: opt.value,
                                                          }));
                                                          setOpen50AudienceStatus(false);
                                                        }}
                                                      >
                                                        <span className="tick-icon">
                                                          {audienceType_50 === opt.value && "✓"}
                                                        </span>
                                                        <span>{opt.label}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </Col>
                                      </Row>

                                      <Row>
                                        <Col md="5" sm="12">
                                          <div className="d-flex align-items-center mb-1">
                                            <Input
                                              type="checkbox"
                                              id="capture_conversions"
                                              checked={
                                                formData.audience_capture.complete_75 === "Capture conversion"
                                              }
                                              onChange={(e) =>
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  audience_capture: {
                                                    ...prev.audience_capture,
                                                    complete_75: e.target.checked ? "Capture conversion" : "",
                                                  },
                                                }))
                                              }
                                            />
                                            <Label className="ms-2 mb-0 advancedvideo">
                                              75% Complete
                                            </Label>
                                          </div>
                                        </Col>

                                        <Col md="6" sm="12">
                                          {formData.audience_capture.complete_75 === "Capture conversion" && (
                                            <>
                                              <div id="audience75percentage" className="position-relative">
                                                <div
                                                  className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                                  onClick={() =>
                                                    setOpen75AudienceStatus(!open75audienceStatus)
                                                  }
                                                  tabIndex={0}
                                                >
                                                  {audienceType_75}
                                                  <FaCaretDown
                                                    className={`custom-select-icon ${open75audienceStatus ? "open" : ""
                                                      }`}
                                                  />
                                                </div>

                                                {open75audienceStatus && (
                                                  <div className="custom-dropdown-menu">
                                                    {captureaudienceOptions.map((opt, idx) => (
                                                      <div
                                                        key={idx}
                                                        className={`custom-dropdown-option ${audienceType_75 === opt.value ? "selected" : ""
                                                          }`}
                                                        onClick={() => {
                                                          setAudienceType_75(opt.value);
                                                          setFormData((prev) => ({
                                                            ...prev,
                                                            complete_75: opt.value,
                                                          }));
                                                          setOpen75AudienceStatus(false);
                                                        }}
                                                      >
                                                        <span className="tick-icon">
                                                          {audienceType_75 === opt.value && "✓"}
                                                        </span>
                                                        <span>{opt.label}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </Col>
                                      </Row>
                                      <Row>
                                        <Col md="5" sm="12">
                                          <div className="d-flex align-items-center mb-1">
                                            <Input
                                              type="checkbox"
                                              id="capture_conversions"
                                              checked={
                                                formData.audience_capture.complete_100 === "Capture conversion"
                                              }
                                              onChange={(e) =>
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  audience_capture: {
                                                    ...prev.audience_capture,
                                                    complete_100: e.target.checked ? "Capture conversion" : "",
                                                  },
                                                }))
                                              }
                                            />
                                            <Label className="ms-2 mb-0 advancedvideo">
                                              100% Complete
                                            </Label>
                                          </div>
                                        </Col>

                                        <Col md="6" sm="12">
                                          {formData.audience_capture.complete_100 === "Capture conversion" && (
                                            <>
                                              <div id="audience100percentage" className="position-relative">
                                                <div
                                                  className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                                  onClick={() =>
                                                    setOpen100AudienceStatus(!open100audienceStatus)
                                                  }
                                                  tabIndex={0}
                                                >
                                                  {audienceType_100}
                                                  <FaCaretDown
                                                    className={`custom-select-icon ${open100audienceStatus ? "open" : ""
                                                      }`}
                                                  />
                                                </div>

                                                {open100audienceStatus && (
                                                  <div className="custom-dropdown-menu">
                                                    {captureaudienceOptions.map((opt, idx) => (
                                                      <div
                                                        key={idx}
                                                        className={`custom-dropdown-option ${audienceType_100 === opt.value ? "selected" : ""
                                                          }`}
                                                        onClick={() => {
                                                          setAudienceType_100(opt.value);
                                                          setFormData((prev) => ({
                                                            ...prev,
                                                            complete_100: opt.value,
                                                          }));
                                                          setOpen100AudienceStatus(false);
                                                        }}
                                                      >
                                                        <span className="tick-icon">
                                                          {audienceType_100 === opt.value && "✓"}
                                                        </span>
                                                        <span>{opt.label}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </Col>
                                      </Row>
                                      <Row>
                                        <Col md="3" sm="12">
                                          <div className="d-flex align-items-center mb-1">
                                            <Button
                                              id="newaudience" className="form-control py-1 px-2  rounded-0 "
                                              onClick={toggletargetModal}
                                            >
                                              <span class="linkto">Create new Audience</span>
                                            </Button>
                                            <AudienceModal
                                              isOpen={targetModalOpen}
                                              toggle={toggletargetModal}
                                            />
                                          </div>
                                        </Col>
                                      </Row>

                                    </>

                                  )}
                                </Col>


                              </Row>

                            </>
                          )}

                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm">
                              </Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="ad_optimization"
                                    checked={!!formData.ad_optimization}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        ad_optimization: e.target.checked,
                                      }))
                                    }
                                  />
                                  <Label for="page_position" className="ms-2 mb-0">
                                    <span className="usebid">Ad Optimization </span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>
                          </Col>
                          {formData.ad_optimization && (
                            <>
                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Goal:
                                  </Label>
                                </Col>

                                <Col md="2" sm="12">
                                  <div id="goal_ctr" className="position-relative">
                                    <div
                                      className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                      onClick={() =>
                                        setOpenGoalstr(!opengoalstar)
                                      }
                                      tabIndex={0}>
                                      {goalstr}
                                      <FaCaretDown
                                        className={`custom-select-icon ${opengoalstar ? "open" : ""
                                          }`}
                                      />
                                    </div>

                                    {opengoalstar && (
                                      <div className="custom-dropdown-menu">
                                        {goalstrOptions.map((opt, idx) => (
                                          <div
                                            key={idx}
                                            className={`custom-dropdown-option ${goalstr === opt.value ? "selected" : ""
                                              }`}
                                            onClick={() => {
                                              setGoalStr(opt.value);
                                              setFormData((prev) => ({
                                                ...prev,
                                                goal_str: opt.defaultValue,
                                              }));
                                              setOpenGoalstr(false);
                                            }}
                                          >
                                            <span className="tick-icon">
                                              {goalstr === opt.value && "✓"}
                                            </span>
                                            <span>{opt.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Evaluation Group:
                                  </Label>
                                </Col>

                                <Col md="2" sm="12">
                                  <div id="evalution_group" className="position-relative">
                                    <div
                                      className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                      onClick={() =>
                                        setOpenEvalutiongroup(!openevalutiongroup)
                                      }
                                      tabIndex={0}>
                                      {evalutiongroup}
                                      <FaCaretDown
                                        className={`custom-select-icon ${openevalutiongroup ? "open" : ""
                                          }`}
                                      />
                                    </div>

                                    {openevalutiongroup && (
                                      <div className="custom-dropdown-menu">
                                        {evalutiongroupOptions.map((opt, idx) => (
                                          <div
                                            key={idx}
                                            className={`custom-dropdown-option ${evalutiongroup === opt.value ? "selected" : ""
                                              }`}
                                            onClick={() => {
                                              setEvalutionGroup(opt.value);
                                              setFormData((prev) => ({
                                                ...prev,
                                                evalution_group: opt.value,
                                              }));
                                              setOpenEvalutiongroup(false);
                                            }}
                                          >
                                            <span className="tick-icon">
                                              {evalutiongroup === opt.value && "✓"}
                                            </span>
                                            <span>{opt.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                              <Row className="align-items-start mb-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Evaluation Period:
                                  </Label>
                                </Col>

                                <Col md="2" sm="12">
                                  <div id="evalution_period" className="position-relative">
                                    <div
                                      className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                      onClick={() =>
                                        setOpenEvalutionperiod(!openevalutionperiod)
                                      }
                                      tabIndex={0}>
                                      {evalutionperiod}
                                      <FaCaretDown
                                        className={`custom-select-icon ${openevalutionperiod ? "open" : ""
                                          }`}
                                      />
                                    </div>

                                    {openevalutionperiod && (
                                      <div className="custom-dropdown-menu">
                                        {evalutionperiodOptions.map((opt, idx) => (
                                          <div
                                            key={idx}
                                            className={`custom-dropdown-option ${evalutionperiod === opt.value ? "selected" : ""
                                              }`}
                                            onClick={() => {
                                              setEvalutionPeriod(opt.value);
                                              setFormData((prev) => ({
                                                ...prev,
                                                evalution_period: opt.value,
                                              }));
                                              setOpenEvalutionperiod(false);
                                            }}
                                          >
                                            <span className="tick-icon">
                                              {evalutionperiod === opt.value && "✓"}
                                            </span>
                                            <span>{opt.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                              <Row className="align-items-start mb-1">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Sample Size:
                                  </Label>
                                </Col>
                                <Col md="2" sm="12">
                                  <Input
                                    type="text"
                                    id="sample_size_value"
                                    name="sample_size_value"
                                    value={formData.sample_size_value}
                                    onChange={(e) => {
                                      setFormErrors(p => ({ ...p, sample_size_value: "" }));
                                      handleChange(e);
                                    }}
                                    className={`formscontrol ${formErrors.sample_size_value ? "border-danger" : ""}`}
                                    onMouseEnter={() => formErrors.sample_size_value && setTooltipOpen((t) => ({ ...t, sample_size_value: true }))}
                                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, sample_size_value: false }))}
                                  />
                                  {formErrors.sample_size_value && (
                                    <Tooltip
                                      placement="bottom"
                                      isOpen={tooltipOpen.sample_size_value}

                                      target="sample_size_value"
                                      autohide={false}

                                      popperClassName="custom-tooltip"
                                    >
                                      <div className="one"></div>
                                      {formErrors.sample_size_value}
                                    </Tooltip>
                                  )}
                                </Col>

                                <Col md="2" sm="12">
                                  <div id="sample_value" className="position-relative">
                                    <div
                                      className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                      onClick={() =>
                                        setOpenSampleValue(!opensamplevalue)
                                      }
                                      tabIndex={0}>
                                      {samplevalue}
                                      <FaCaretDown
                                        className={`custom-select-icon ${opensamplevalue ? "open" : ""
                                          }`}
                                      />
                                    </div>

                                    {opensamplevalue && (
                                      <div className="custom-dropdown-menu">
                                        {samplevalueOptions.map((opt, idx) => (
                                          <div
                                            key={idx}
                                            className={`custom-dropdown-option ${samplevalue === opt.value ? "selected" : ""
                                              }`}
                                            onClick={() => {
                                              setSamplevalue(opt.value);
                                              setFormData((prev) => ({
                                                ...prev,
                                                sample_value: opt.value,
                                              }));
                                              setOpenSampleValue(false);
                                            }}
                                          >
                                            <span className="tick-icon">
                                              {samplevalue === opt.value && "✓"}
                                            </span>
                                            <span>{opt.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </Col>
                              </Row>

                              <Row className="align-items-start ">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Control Group Size:
                                  </Label>
                                </Col>
                                <Col md="1" sm="12">

                                  <Input
                                    type="text"
                                    id="control_group_size"
                                    name="control_group_size"
                                    value={formData.control_group_size}
                                    onChange={(e) => {
                                      setFormErrors(p => ({ ...p, control_group_size: "" }));
                                      handleChange(e);
                                    }}
                                    className={`formscontrol ${formErrors.control_group_size ? "border-danger" : ""}`}
                                    onMouseEnter={() => formErrors.control_group_size && setTooltipOpen((t) => ({ ...t, control_group_size: true }))}
                                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, control_group_size: false }))}
                                  />
                                  {formErrors.control_group_size && (
                                    <>

                                      <Tooltip
                                        placement="bottom"
                                        isOpen={tooltipOpen.control_group_size}
                                        target="control_group_size"
                                        autohide={false}
                                        popperClassName="custom-tooltip"
                                      >
                                        <div className="one"></div>
                                        {formErrors.control_group_size}
                                      </Tooltip>
                                    </>

                                  )}
                                </Col>
                              </Row>
                              <Row className="align-items-start mt-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Control Group SOV:
                                  </Label>
                                </Col>
                                <Col md="1" sm="12">

                                  <Input
                                    type="text"
                                    id="control_group_sov"
                                    name="control_group_sov"
                                    value={formData.control_group_sov}
                                    onChange={(e) => {
                                      setFormErrors(p => ({ ...p, control_group_sov: "" }));
                                      handleChange(e);
                                    }}
                                    className={`formscontrol${formErrors.control_group_sov ? " border-danger" : ""}`}
                                    onMouseEnter={() => formErrors.control_group_sov && setTooltipOpen((t) => ({ ...t, control_group_sov: true }))}
                                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, control_group_sov: false }))}
                                  />
                                </Col>
                                {formErrors.control_group_sov && (
                                  <>
                                    <Tooltip
                                      placement="bottom"
                                      isOpen={tooltipOpen.control_group_sov}
                                      target="control_group_sov"
                                      autohide={false}
                                      popperClassName="custom-tooltip"
                                    >
                                      <div className="one"></div>
                                      {formErrors.control_group_sov}
                                    </Tooltip>
                                  </>
                                )}
                              </Row>

                            </>
                          )}

                          <Row id="budget-section">
                            <label className="fw-semibold Headlines mb-4">
                              Campaign Notes
                            </label>
                          </Row>
                          <Row className="align-items-start mt-2">
                            <Col md="1" className="d-none d-md-block" />

                            <Col
                              md="3"
                              sm="12"
                              className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                            >
                              <Label className="forms-labels">
                                Notes
                              </Label>
                            </Col>

                            <Col md="4" sm="12" className="mb-3">
                              <Input
                                type="textarea"
                                id="notes"
                                name="notes"
                                rows="5"
                                maxLength={1000}
                                value={formData.notes || ""}
                                onChange={handleChange}
                              />


                              <div className="noteslength mt-2">
                                {formData.notes?.length || 0} / 1000
                              </div>
                            </Col>
                          </Row>

                        </div>
                      )}
                      {step === 1 && (
                        <DealsEditor />
                      )}
                      {step === 2 && (
                        <Location props={props} />
                      )}

                      {step === 3 && (
                        <Devices props={props} ref={modalRef} />
                      )}

                      {step === 4 && (
                        <AudienceEditor />
                      )}

                      {step === 5 && (
                        <InventoryEditor props={props} ref={inventoryref} />
                      )}

                      {step === 6 && (
                        <LinkedAdsEditor />
                      )}

                      {step === 7 && (
                        <div className="step-scroll">
                          <Row>
                            <Col xs="5" className="ms-4">
                              <table className="table mb-4  mt-3 no-border-table ">
                                <tr>
                                  <th colSpan="4" className=" mb-4" style={{ backgroundColor: "#F3F3F3", color: "#818080" }}>
                                    Basic Options
                                  </th>
                                </tr>

                                <tbody>
                                  <tr>
                                    <th colSpan="2" className="">
                                      <span>Basics</span>
                                    </th>
                                    <th className="text-end">
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => setStep(0)}
                                      >
                                        <i className="bi bi-gear-fill me-1"></i>{" "}
                                        Edit
                                      </button>
                                    </th>
                                  </tr>

                                  <tr>
                                    <td className="col-md-4">Campaign Name</td>
                                    <td>{formData.name || "None"}</td>
                                  </tr>
                                  <tr>
                                    <td>Ad Domain</td>
                                    <td>{formData.ad_domain || "None"}</td>
                                  </tr>
                                  <tr>
                                    <td>Bidder Status</td>
                                    <td>{formData.status || "None"}</td>
                                  </tr>
                                  <tr>
                                    <td>Fraud Suppression</td>
                                    <td>{formData.forensiq || "true"}</td>
                                  </tr>
                                  <tr>
                                    <td>Default CPM Bid</td>
                                    <td>{formData.cpm_bid || "true"}</td>
                                  </tr>
                                  <tr>
                                    <td>Max Bid</td>
                                    <td>{formData.price || "None"}</td>
                                  </tr>
                                  <tr>
                                    <td>Frequency Cap</td>
                                    <td>{formData.capspec || "None"}</td>
                                  </tr>
                                  <tr>
                                    <td>Count</td>
                                    <td>{formData.capcount || "None"}</td>
                                  </tr>
                                  <tr>
                                    <td>Expiration</td>
                                    <td>{formData.capexpire || "None"}</td>
                                  </tr>
                                  <tr>
                                    <td>Timebase</td>
                                    <td>{formData.capunit || "Seconds"}</td>
                                  </tr>

                                  <tr>
                                    <th colSpan="2" className=" mb-4">
                                      BUDGET
                                    </th>
                                    <th className="text-end">
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => setStep(0)}
                                      >
                                        <i className="bi bi-gear-fill me-1"></i>{" "}
                                        Edit
                                      </button>
                                    </th>
                                  </tr>

                                  <tr>
                                    <td>Total Budget</td>
                                    <td>{formData.total_budget || "None"}</td>
                                  </tr>
                                  <tr>
                                    <td>Daily Budget</td>
                                    <td>
                                      {formData.budget_limit_daily || "None"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Hourly Budget</td>
                                    <td>
                                      {formData.budget_limit_hourly || "None"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Rules</td>
                                    <td>
                                      {formData.rules?.length > 0
                                        ? getSelectedRules()
                                          .filter((option) =>
                                            formData.rules.includes(
                                              Number(option.value)
                                            )
                                          )
                                          .map((option) => option.label)
                                          .join(", ")
                                        : "None"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Flight Dates</td>
                                    <td>{formData.flight_date || "None"}</td>
                                  </tr>

                                  <tr>
                                    <td>Start Date</td>
                                    <td>
                                      {startDate
                                        ? startDate.toLocaleString()
                                        : "Not set"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>End Date</td>
                                    <td>
                                      {endDate
                                        ? endDate.toLocaleString()
                                        : "Not set"}
                                    </td>
                                  </tr>

                                  <tr>
                                    <th colSpan="2" className=" mb-4">
                                      LOCATIONS
                                    </th>
                                    <th className="text-end">
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => setStep(2)}
                                      >
                                        <i className="bi bi-gear-fill me-1"></i>{" "}
                                        Edit
                                      </button>
                                    </th>
                                  </tr>

                                  <tr>
                                    <td className="col-md-4 mb-4">Region</td>
                                    <td> {formData.region_id || "None"}</td>
                                  </tr>

                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Sub Region
                                    </td>
                                    <td> {formData.subregion_id || "None"}</td>
                                  </tr>

                                  <tr>
                                    <td className="col-md-4 mb-4">Country</td>
                                    <td> {formData.country_id || "None"}</td>
                                  </tr>

                                  <tr>
                                    <td className="col-md-4 mb-4">State</td>
                                    <td> {formData.state_id || "None"}</td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">City</td>
                                    <td> {formData.city_id || "None"}</td>
                                  </tr>
                                  {geoPoints.map((point, index) => (
                                    <tr key={`geo-${index}`}>
                                      <td>latitude : {point.lat || "—"}</td>
                                      <td>longitude : {point.lon || "—"}</td>
                                      <td>range : {point.range || "—"}</td>
                                    </tr>
                                  ))}

                                  <tr>
                                    <th colSpan="2" className=" mb-4">
                                      DEVICES
                                    </th>
                                    <th className="text-end">
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => setStep(3)}
                                      >
                                        <i className="bi bi-gear-fill me-1"></i>{" "}
                                        Edit
                                      </button>
                                    </th>
                                  </tr>

                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Device Type
                                    </td>
                                    <td>
                                      {formData.device_type === "all"
                                        ? "All Types"
                                        : formData.device_type === "specific"
                                          ? Object.entries(
                                            formData.selectedDevices
                                          )
                                            .filter(
                                              ([_, isChecked]) => isChecked
                                            )
                                            .map(([device]) =>
                                              device === "connected_tv"
                                                ? "Connected TV"
                                                : device
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                device.slice(1)
                                            )
                                            .join(", ") || "None Selected"
                                          : "Not Selected"}
                                    </td>
                                  </tr>

                                  <tr>
                                    <td className="col-md-4 mb-4">Model</td>
                                    <td>
                                      {selectedModelOption === "allmodels"
                                        ? "All Models"
                                        : selectedModelOption === "specific"
                                          ? "Target Specific Models"
                                          : "Not Selected"}
                                    </td>
                                  </tr>

                                  <tr>
                                    <td className="col-md-4 mb-4">Make</td>
                                    <td>
                                      {formData.all_makes === "allmakes"
                                        ? "All Makes"
                                        : formData.all_makes === "specificmakes"
                                          ? "Target Specific Makes"
                                          : "Not Selected"}
                                    </td>
                                  </tr>

                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      OS & Version
                                    </td>
                                    <td>
                                      {selectedModelosOption === "osallmodels"
                                        ? "All OS's"
                                        : selectedModelosOption ===
                                          "osspecificModels"
                                          ? entries.length > 0
                                            ? entries
                                              .map(
                                                (entry) =>
                                                  `${entry.ostype} (${entry.minVersion || "Any"
                                                  } - ${entry.maxVersion || "Any"
                                                  })`
                                              )
                                              .join(", ")
                                            : "No OS Versions Added"
                                          : "Not Selected"}
                                    </td>
                                  </tr>

                                  <tr>
                                    <td>Browsers</td>
                                    <td>
                                      {formData.browser_option ===
                                        "browserallmodels"
                                        ? "All Browsers"
                                        : formData.browsers?.length > 0
                                          ? formData.browsers
                                            .map((b) => b.label)
                                            .join(", ")
                                          : "None selected"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Browser Languages</td>
                                    <td>
                                      {formData.browser_language_option ===
                                        "languageallmodels"
                                        ? "All languages"
                                        : formData.browser_languages?.length > 0
                                          ? formData.browser_languages
                                            .map((lang) => lang.label)
                                            .join(", ")
                                          : "None selected"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>IAB Catagories</td>
                                    <td>
                                      {formData.iab_category?.length > 0
                                        ? formData.iab_category
                                          .map((option) => option.label)
                                          .join(", ")
                                        : "None"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Carrier</td>
                                    <td>{formData.carrier || "None"}</td>
                                  </tr>

                                  <tr>
                                    <th colSpan="2" className=" mb-4">
                                      INVENTORY
                                    </th>
                                    <th className="text-end">
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => setStep(5)}
                                      >
                                        <i className="bi bi-gear-fill me-1"></i>{" "}
                                        Edit
                                      </button>
                                    </th>
                                  </tr>

                                  <tr>
                                    <td>Selected Inventory</td>
                                    <td>
                                      {formData.selectedInventory?.length > 0
                                        ? formData.selectedInventory.join(", ")
                                        : "No inventory selected"}
                                    </td>
                                  </tr>

                                  <tr>
                                    <td>Supply Path Optimization</td>
                                    <td>
                                      <ul className="mb-0">
                                        <li>
                                          Exclude sites without Ads.txt:{" "}
                                          {formData.exclude_ads_txt
                                            ? "Yes"
                                            : "No"}
                                        </li>
                                        <li>
                                          Target direct publisher only:{" "}
                                          {formData.target_direct
                                            ? "Yes"
                                            : "No"}
                                        </li>
                                      </ul>
                                    </td>
                                  </tr>

                                  <tr>
                                    <td>Supply Quality Filtering</td>
                                    <td>
                                      <ul className="mb-0">
                                        <li>
                                          Opt out of SQ filtering:{" "}
                                          {formData.opt_supply ? "Yes" : "No"}
                                        </li>
                                        <li>
                                          Opt out of MFA filtering:{" "}
                                          {formData.opt_made ? "Yes" : "No"}
                                        </li>
                                      </ul>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </Col>

                            <Col xs="5" className="ms-4">
                              <table className="table no-border-table mb-4 mt-3 ">
                                <tr>
                                  <th colSpan="4" className=" mb-4" style={{ backgroundColor: "#F3F3F3", color: "#818080" }}>
                                    Advanced Options
                                  </th>
                                </tr>

                                <tbody>
                                  <tr>
                                    <th colSpan="2" className=" mb-4">
                                      PLACEMENT TYPE
                                    </th>
                                    <th className="text-end">
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => setStep(0)}
                                      >
                                        <i className="bi bi-gear-fill me-1"></i>{" "}
                                        Edit
                                      </button>
                                    </th>
                                  </tr>

                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Accompanying Content
                                    </td>
                                    <td>
                                      {formData.placement_type.Accompanying ===
                                        "Accompanying Content"
                                        ? formData.placement_type.Accompanying
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Standalone
                                    </td>
                                    <td>
                                      {formData.placement_type.Standalone ===
                                        "Standalone"
                                        ? formData.placement_type.Standalone
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">Unknown</td>
                                    <td>
                                      {formData.placement_type.Unknown ===
                                        "Unknown"
                                        ? formData.placement_type.Unknown
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Interstitial
                                    </td>
                                    <td>
                                      {formData.placement_type.Interstitial ===
                                        "Interstitial"
                                        ? formData.placement_type.Interstitial
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan="2" className=" mb-4">
                                      Roll Position
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">Pre-Roll</td>
                                    <td>
                                      {formData.roll_position.preroll ===
                                        "Pre-Roll"
                                        ? formData.roll_position.preroll
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">Mid-Roll</td>
                                    <td>
                                      {formData.roll_position.midroll ===
                                        "Mid-Roll"
                                        ? formData.roll_position.midroll
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">Post-Roll</td>
                                    <td>
                                      {formData.roll_position.postroll ===
                                        "Post-Roll"
                                        ? formData.roll_position.postroll
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">Unknown</td>
                                    <td>
                                      {formData.roll_position.unknown ===
                                        "Unknown"
                                        ? formData.roll_position.unknown
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan="2" className=" mb-4">
                                      PLAYER SIZE{" "}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Exclude small player size
                                    </td>
                                    <td>
                                      {formData.player_size.small_player ===
                                        "Exclude small player size"
                                        ? formData.player_size.small_player
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Exclude unknown player size
                                    </td>
                                    <td>
                                      {formData.player_size.unknown_player ===
                                        "Exclude unknown player size"
                                        ? formData.player_size.unknown_player
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan="2" className=" mb-4">
                                      Skippable Ads{" "}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Skippable video impressions
                                    </td>
                                    <td>
                                      {formData.skippable_ads.Skippable ===
                                        "Skippable video impressions"
                                        ? formData.skippable_ads.Skippable
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Non-skippable video impressions
                                    </td>
                                    <td>
                                      {formData.skippable_ads.Non_skippable ===
                                        "Non-skippable video impressions"
                                        ? formData.skippable_ads.Non_skippable
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Skippability unknown
                                    </td>
                                    <td>
                                      {formData.skippable_ads.Skippability ===
                                        "Skippability unknown"
                                        ? formData.skippable_ads.Skippability
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan="2" className=" mb-4">
                                      PLAYBACK METHOD{" "}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Auto-play with sound on
                                    </td>
                                    <td>
                                      {formData.playback_method.soundOn ===
                                        "Auto-play with sound on"
                                        ? formData.playback_method.soundOn
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Auto-play with sound off
                                    </td>
                                    <td>
                                      {formData.playback_method.soundOff ===
                                        "Auto-play with sound off"
                                        ? formData.playback_method.soundOff
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Click to play
                                    </td>
                                    <td>
                                      {formData.playback_method
                                        .click_to_play === "Click to play"
                                        ? formData.playback_method.click_to_play
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Mouseover to play
                                    </td>
                                    <td>
                                      {formData.playback_method.Mouseover ===
                                        "Mouseover to play"
                                        ? formData.playback_method.Mouseover
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Playback method
                                    </td>
                                    <td>
                                      {formData.playback_method.Playback ===
                                        "Playback method"
                                        ? formData.playback_method.Playback
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan="2" className=" mb-4">
                                      REWARD STATUS{" "}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">Rewarded</td>
                                    <td>
                                      {formData.reward_status.Rewarded ===
                                        "Rewarded"
                                        ? formData.reward_status.Rewarded
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Unrewarded
                                    </td>
                                    <td>
                                      {formData.reward_status.Unrewarded ===
                                        "Unrewarded"
                                        ? formData.reward_status.Unrewarded
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">Unknown</td>
                                    <td>
                                      {formData.reward_status.UnknownReward ===
                                        "Unknown"
                                        ? formData.reward_status.UnknownReward
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Orientation Matching</td>
                                    <td>
                                      {formData.orientation_matching || "None"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th colSpan="2" className=" mb-4">
                                      FEED TYPES{" "}
                                    </th>
                                    <th className="text-end">
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => setStep(0)}
                                      >
                                        <i className="bi bi-gear-fill me-1"></i>{" "}
                                        Edit
                                      </button>
                                    </th>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Music streaming service
                                    </td>
                                    <td>
                                      {formData.audio.music ===
                                        "Music streaming service"
                                        ? formData.audio.music
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      FM/AM broadcast
                                    </td>
                                    <td>
                                      {formData.audio.fm_am ===
                                        "FM/AM broadcast"
                                        ? formData.audio.fm_am
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">Podcast</td>
                                    <td>
                                      {formData.audio.Podcast === "Podcast"
                                        ? formData.audio.Podcast
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Catch-up radio
                                    </td>
                                    <td>
                                      {formData.audio.catch_up ===
                                        "Catch-up radio"
                                        ? formData.audio.catch_up
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">Web radio</td>
                                    <td>
                                      {formData.audio.web === "Web radio"
                                        ? formData.audio.web
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Video game
                                    </td>
                                    <td>
                                      {formData.audio.video === "Video game"
                                        ? formData.audio.video
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Text to speech
                                    </td>
                                    <td>
                                      {formData.audio.text === "Text to speech"
                                        ? formData.audio.text
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Feed type unknown
                                    </td>
                                    <td>
                                      {formData.audio.feed ===
                                        "Feed type unknown"
                                        ? formData.audio.feed
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th colSpan="2" className=" mb-4">
                                      AUDIENCE CAPTURE{" "}
                                    </th>
                                    <th className="text-end">
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => setStep(0)}
                                      >
                                        <i className="bi bi-gear-fill me-1"></i>{" "}
                                        Edit
                                      </button>
                                    </th>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Capture Clicks
                                    </td>
                                    <td>
                                      {formData.audience_capture.Clicks ===
                                        "Capture Clicks"
                                        ? formData.audience_capture.Clicks
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Capture Conversions
                                    </td>
                                    <td>
                                      {formData.audience_capture.Conversions ===
                                        "Capture Conversions"
                                        ? formData.audience_capture.Conversions
                                        : "NA"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="col-md-4 mb-4">
                                      Capture Audio/Video Events
                                    </td>
                                    <td>
                                      {formData.audience_capture.Audio ===
                                        "Capture Audio/Video Events"
                                        ? formData.audience_capture.Audio
                                        : "NA"}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </Col>

                            <Col xs="2"></Col>
                          </Row>
                        </div>
                      )}
                    </Form>
                  </CardBody>

                  <div className="fixed-footer-actions">
                    {step < 7 ? (
                      <>
                        <Button
                          type="button"
                          id="bak"
                          onClick={() => navigate("/admin/campaigns")}
                        >
                          Cancel
                        </Button>

                        {step > 0 && (
                          <Button type="button" onClick={prevStep} id="bak">
                            Back
                          </Button>
                        )}

                        <Button type="button" onClick={handleNext} id="nxt">
                          Next
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          id="bak"
                          onClick={() => navigate("/admin/campaigns")}
                        >
                          Cancel
                        </Button>

                        <Button type="button" onClick={prevStep} id="bak">
                          Back
                        </Button>

                        <Button
                          id="nxt"
                          onClick={addNewCampaign}
                          disabled={campaign?.readOnly}
                        >
                          Create Campaign
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </>
  );
};
export default CampaignEditorupdate;
