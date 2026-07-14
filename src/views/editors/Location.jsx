import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FaArrowDown,
  FaBeer,
  FaCaretDown,
  FaCaretRight,
  FaCheck,
  FaCross,
  FaMapMarkerAlt,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Form,
  FormGroup,
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
  Dropdown,
  Input,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  InputGroupText,
  Tooltip,
  UncontrolledTooltip,
} from "reactstrap";
import { IoMdClose, IoMdInformationCircle } from "react-icons/io";
import GeoEditor from "./GeoEditor";
import DataTable from "react-data-table-component";
import {
  getcities,
  getcountry,
  getprimaryregions,
  searchPrimaryRegions,
  getCountryStateAndCity,
} from "../api/Api";

var undef;

const RadiusInput = ({ row, unit, onChange }) => {
  const getRawRadius = (value, u) => {
    if (!value && value !== 0) return "";
    switch (u) {
      case "Kilometers":
        return (value / 1000).toFixed(2);
      case "Miles":
        return (value * 0.000621371).toFixed(2);
      case "Meters":
        return value.toFixed(0);
      case "Feet":
        return (value * 3.28084).toFixed(2);
      default:
        return value.toFixed(0);
    }
  };

  const getUnitAbbreviation = (u) => {
    switch (u) {
      case "Kilometers":
        return "km";
      case "Miles":
        return "miles";
      case "Meters":
        return "m";
      case "Feet":
        return "ft";
      default:
        return "m";
    }
  };

  const [localVal, setLocalVal] = useState(() => getRawRadius(row.range, unit));

  useEffect(() => {
    setLocalVal(getRawRadius(row.range, unit));
  }, [row.range, unit]);

  const handleBlurOrSubmit = () => {
    const numericVal = parseFloat(localVal);
    if (!isNaN(numericVal) && numericVal >= 0) {
      onChange(row.id, numericVal);
    } else {
      setLocalVal(getRawRadius(row.range, unit));
    }
  };

  return (
    <div className="d-flex align-items-center gap-1">
      <Input
        type="number"
        step="any"
        min="0"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={handleBlurOrSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleBlurOrSubmit();
          }
        }}
        style={{
          width: "75px",
          height: "28px",
          fontSize: "11px",
          padding: "2px 5px",
        }}
      />
      <span style={{ fontSize: "11px", fontWeight: "normal" }}>
        {getUnitAbbreviation(unit)}
      </span>
    </div>
  );
};

const LocationStatusDropdown = ({ index, item, isActive, onChange }) => {
  const [selected, setSelected] = useState(item.status || "Targeted");
  const [open, setOpen] = useState(false);

  const options = ["Targeted", "Excluded"];

  useEffect(() => {
    setSelected(item?.status || "Targeted");
  }, [item?.status]);

  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "120px" }}>
      {/* Selected Box */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          cursor: "pointer",
          background: isActive ? "transparent" : "#f8f9fa",
          fontSize: "11px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          color: isActive ? "#fff" : "#333",
          lineHeight: "1.2",
          padding: "2px 0",
        }}
      >
        <span>{selected}</span>
        <FaCaretDown size={10} color={isActive ? "#fff" : "#333"} />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            border: "1px solid #ddd",
            borderRadius: "4px",
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            zIndex: 999,
          }}
        >
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                setSelected(option);
                setOpen(false);
                onChange(index, option);
              }}
              style={{
                padding: "4px 8px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: selected === option ? "#e53e3e" : "transparent",
                color: selected === option ? "#fff" : "#333",
                fontSize: "11px",
              }}
            >
              {option}
              {selected === option && <FaCheck size={10} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Location = (props) => {
  const normalizeSearchValue = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const readNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const extractLatLon = (value) => ({
    lat: readNumber(
      value?.lat ??
        value?.latitude ??
        value?.latitute ??
        value?.Latitude ??
        value?.LATITUDE,
    ),
    lon: readNumber(
      value?.lon ??
        value?.lng ??
        value?.long ??
        value?.longitude ??
        value?.Longitude ??
        value?.LONGITUDE,
    ),
  });

  const getCountryRawId = (country, index) =>
    String(
      country?.countryId ??
        country?.id ??
        country?.iso3 ??
        country?.name ??
        `country-${index}`,
    );

  const getStateRawId = (state, index) =>
    String(
      state?.primaryRegionId ??
        state?.id ??
        state?.stateId ??
        state?.state_id ??
        state?.name ??
        `state-${index}`,
    );

  const getCityRawId = (city, index) =>
    String(
      city?.cityId ??
        city?.city_id ??
        city?.id ??
        city?.name ??
        `city-${index}`,
    );

  const normalizeGeoPoints = useCallback(
    (points = []) =>
      (Array.isArray(points) ? points : [])
        .map((item) => ({
          id:
            item.id ??
            `${Number(item.lat ?? item.latitude ?? "")}-${Number(item.lon ?? item.longitude ?? "")}-${Number(item.range ?? item.radius ?? "")}`,
          lat: Number(item.lat ?? item.latitude ?? ""),
          lon: Number(item.lon ?? item.longitude ?? ""),
          range: Number(item.range ?? item.radius ?? ""),
          address: item.address || "-",
          target:
            item.target === false || item.target === "Exclude"
              ? "Exclude"
              : "Target",
        }))
        .filter(
          (item) =>
            Number.isFinite(item.lat) &&
            Number.isFinite(item.lon) &&
            Number.isFinite(item.range),
        ),
    [],
  );
  const areGeoPointsEqual = (left = [], right = []) =>
    JSON.stringify(normalizeGeoPoints(left)) ===
    JSON.stringify(normalizeGeoPoints(right));

  const [openCountry, setOpenCountry] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [activeRowId, setActiveRowId] = useState(null);
  const {
    selectedCountryItems,
    setSelectedCountryItems,
    isLocationHydrated,
    setIsLocationHydrated,
    isCampaignLoading,
  } = props;

  const parseCampaign = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  };

  const campaign = parseCampaign(props?.campaign);
  const campaignLocations = campaign
    ? Array.isArray(campaign.campaignLocations)
      ? campaign.campaignLocations
      : Array.isArray(campaign.locations)
        ? campaign.locations
        : []
    : [];

  const isLoading =
    isCampaignLoading ||
    isHydrating ||
    (!!props.campaign && campaignLocations.length > 0 && !isLocationHydrated);
  const [focusPoint, setFocusPoint] = useState(null);
  const suppressAutoCenterRef = useRef(false);
  const [localGeoPoints, setLocalGeoPoints] = useState([]);
  const [geoPoints, setGeoPoints] = useState([]);

  const [openradius, setopenradius] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedradius, setselectedradius] = useState(() => {
    return props.radiusUnits || "Kilometers";
  });
  const [Hyperlocal, sethyperlocal] = useState(() => {
    if (props.hyperlocalType !== undefined && props.hyperlocalType !== null) {
      return String(props.hyperlocalType) === "0" ? 0 : 1;
    }
    return 1;
  });
  const [localFileName, setLocalFileName] = useState("");
  const fileName = props.fileName !== undefined ? props.fileName : localFileName;
  const setFileName = (val) => {
    setLocalFileName(val);
    if (props.onFileNameChange) {
      props.onFileNameChange(val);
    }
  };
  const [countries, setCountries] = useState([]);
  const countriesRef = useRef([]);
  const isFetchingCountriesRef = useRef(false);
  const hasFetchedCountriesRef = useRef(false);
  const [openCountries, setOpenCountries] = useState(new Set());
  const [openStates, setOpenStates] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const countryCheckboxRefs = useRef(new Map());
  const stateCheckboxRefs = useRef(new Map());
  const [loadingStatesForCountries, setLoadingStatesForCountries] = useState(
    new Set(),
  );
  const [loadingCitiesForStates, setLoadingCitiesForStates] = useState(
    new Set(),
  );
  const [map, setmap] = useState(true);
  const [geo, setGeo] = useState([]);
  const [zoom, setZoom] = useState(2);
  const [center, setCenter] = useState([44.414165, 8.942184]);
  const [mapdata, setmapdata] = useState([]);
  let mapeddata = [];
  // Keep the `geo` array reference stable when only non-geo fields (like `target`)
  // change, so Leaflet doesn't "blink" by re-hydrating the same coordinates.
  const mapGeoKey = useMemo(() => {
    const points = Array.isArray(mapdata) ? mapdata : [];
    const round = (value, digits = 6) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return "";
      return num.toFixed(digits);
    };
    return points
      .map(
        (p) =>
          `${round(p?.lat)}|${round(p?.lon)}|${Math.round(
            Number(p?.range) || 0,
          )}`,
      )
      .join(";");
  }, [mapdata]);

  const mapGeo = useMemo(() => {
    const points = Array.isArray(mapdata) ? mapdata : [];
    return points.flatMap((p) => [p.lat, p.lon, p.range]);
  }, [mapGeoKey]);

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [mapSearchTerm, setMapSearchTerm] = useState("");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchRunId, setMapSearchRunId] = useState(0);
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [mapSearchOpen, setMapSearchOpen] = useState(false);
  const [mapSearchNotice, setMapSearchNotice] = useState("");
  const [mapSearchIsLoading, setMapSearchIsLoading] = useState(false);
  const mapSearchContainerRef = useRef(null);
  const mapSearchTaskIdRef = useRef(0);
  const mapSearchLiveTimeoutRef = useRef(null);
  const mapSearchLastRemoteKeyRef = useRef("");
  const mapSearchLastRemoteAtRef = useRef(0);
  const mapSearchContextRef = useRef({
    countryRawId: null,
    countryName: "",
    stateRawId: null,
    stateName: "",
  });
  const mapSearchCityCacheRef = useRef(new Map());

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = mapdata.map((row) => row.id);
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleRowSelect = (id, checked) => {
    setSelectedRows((prev) => {
      const updated = new Set(prev);

      if (checked) {
        updated.add(id);
      } else {
        updated.delete(id);
      }

      return updated;
    });
  };

  const handleRadiusChange = (id, newRangeValue) => {
    let rangeInMeters = Number(newRangeValue) || 0;
    if (rangeInMeters < 0) rangeInMeters = 0;

    switch (selectedradius) {
      case "Kilometers":
        rangeInMeters = rangeInMeters * 1000;
        break;
      case "Miles":
        rangeInMeters = rangeInMeters / 0.000621371;
        break;
      case "Feet":
        rangeInMeters = rangeInMeters / 3.28084;
        break;
      case "Meters":
      default:
        // rangeInMeters remains standard
        break;
    }

    setmapdata((prev) => {
      const next = (Array.isArray(prev) ? prev : []).map((item) => {
        if (item.id === id) {
          return { ...item, range: rangeInMeters };
        }
        return item;
      });
      setGeoPoints(next);
      return next;
    });
  };

  const suppressAutoCenterOnce = useCallback(() => {
    suppressAutoCenterRef.current = true;
    window.setTimeout(() => {
      suppressAutoCenterRef.current = false;
    }, 400);
  }, []);

  useEffect(() => {
    if (props.onHyperlocalChange) {
      props.onHyperlocalChange(Hyperlocal);
    }
  }, [Hyperlocal]);

  useEffect(() => {
    if (props.hyperlocalType === undefined || props.hyperlocalType === null) {
      return;
    }

    const normalizedHyperlocalType =
      String(props.hyperlocalType).toLowerCase() === "upload" ||
      String(props.hyperlocalType) === "0"
        ? 0
        : 1;

    sethyperlocal(normalizedHyperlocalType);
  }, [props.hyperlocalType]);

  useEffect(() => {
    if (props.onRadiusUnitsChange) {
      props.onRadiusUnitsChange(selectedradius);
    }
  }, [selectedradius]);

  useEffect(() => {
    if (props.radiusUnits) {
      setselectedradius(props.radiusUnits);
    }
  }, [props.radiusUnits]);

  const TargetDropdown = ({ row }) => {
    const [selected, setSelected] = useState(row.target || "Target");
    const [open, setOpen] = useState(false);

    const options = ["Target", "Exclude"];

    useEffect(() => {
      setSelected(row?.target || "Target");
    }, [row?.target]);

    return (
      <div style={{ position: "relative", width: "120px" }}>
        {/* Selected Box */}
        <div
          onClick={() => setOpen(!open)}
          style={{
            cursor: "pointer",
            background: "#f8f9fa",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            color: "#333",
          }}
        >
          <span>{selected}</span>
          <FaCaretDown size={12} />
        </div>

        {/* Dropdown */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "15px",
              left: 0,
              width: "100%",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              zIndex: 999,
            }}
          >
            {options.map((option) => (
              <div
                key={option}
                onClick={() => {
                  setSelected(option);
                  setOpen(false);

                  // Persist the choice into map data so the map can render
                  // different radius colors for Target vs Exclude.
                  const update = (prev) =>
                    (Array.isArray(prev) ? prev : []).map((p) =>
                      p?.id === row?.id ? { ...p, target: option } : p,
                    );

                  setmapdata((prev) => {
                    const next = update(prev);
                    setGeoPoints(next);
                    return next;
                  });
                }}
                style={{
                  padding: "3px 14px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: selected === option ? "#e53e3e" : "transparent",
                  color: selected === option ? "#fff" : "#333",
                }}
              >
                {option}
                {selected === option && <FaCheck size={12} />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handlecheck = useCallback(() => {}, []);

  const formatRadius = (value, unit) => {
    if (!value) return "";

    switch (unit) {
      case "Kilometers":
        return (value / 1000).toFixed(2) + " km";

      case "Miles":
        return (value * 0.000621371).toFixed(2) + " miles";

      case "Meters":
        return value + " m";

      case "Feet":
        return (value * 3.28084).toFixed(2) + " ft";

      default:
        return value + " m"; // default
    }
  };

  const columns = (unit) => [
    {
      name: (
        <Input
          type="checkbox"
          checked={selectedRows.size === mapdata.length && mapdata.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      cell: (row) => (
        <Input
          type="checkbox"
          checked={selectedRows.has(row.id)}
          onChange={(e) => handleRowSelect(row.id, e.target.checked)}
        />
      ),
      width: "70px",
    },
    {
      name: "Address",
      selector: (row) => row?.address || "-",
      sortable: true,
    },
    {
      name: "Latitude",
      selector: (row) => row?.lat,
      cell: (row) => {
        const value = Number(row?.lat);
        if (!Number.isFinite(value)) return "-";
        return value.toFixed(6).replace(/\.?0+$/, "");
      },
      sortable: true,
    },
    {
      name: "Longitude",
      selector: (row) => row?.lon,
      cell: (row) => {
        const value = Number(row?.lon);
        if (!Number.isFinite(value)) return "-";
        return value.toFixed(6).replace(/\.?0+$/, "");
      },
      sortable: true,
    },
    {
      name: "Radius",
      selector: (row) => row.range,
      cell: (row) => (
        <RadiusInput
          row={row}
          unit={unit}
          onChange={handleRadiusChange}
        />
      ),
      sortable: true,
    },
    {
      name: "Target",
      cell: (row) => <TargetDropdown row={row} />,
      sortable: false,
    },
    {
      name: "",
      selector: (row) => (
        <span>
          <FaMapMarkerAlt
            onClick={() => {
              const lat = Number(row?.lat);
              const lon = Number(row?.lon);
              const radius = Number(row?.range);
              if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
              suppressAutoCenterOnce();
              setCenter([lat, lon]);
              setZoom(13);
              setFocusPoint({ lat, lon, radius });
            }}
          />{" "}
          <IoMdClose
            onClick={(e) => {
              console.log(row.id);
              const removePoint = (item) => item.id != row.id;

              setmapdata((prev) => {
                console.log(prev.id);
                return prev.filter(removePoint);
              });
              setGeoPoints((prev) => prev.filter(removePoint));
            }}
          />
        </span>
      ),
    },
  ];

  const customStyles = {
    table: {
      style: {},
    },
    tableWrapper: {
      style: {
        maxHeight: "3200px",
        overflowY: "auto",
        height: "200px",
      },
    },
    headRow: {
      style: {
        fontSize: "10px",
        minHeight: "23px",
        backgroundColor: "white",

        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
      },
    },
    headCells: {
      style: {
        paddingLeft: "0px",
        paddingRight: "0px",
        backgroundColor: "white",
        marginLeft: "2px",
        borderRight: "1px solid #d4d4d4",
        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
      },
    },
    rows: {
      style: {
        minHeight: "23px",
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

  const tableColumns = useMemo(() => columns(selectedradius), [selectedRows, mapdata, selectedradius]);

  useEffect(() => {
    countriesRef.current = countries;
  }, [countries]);

  useEffect(() => {
    if (
      props.campaign?.geo !== undef &&
      props?.campaign?.geo?.length !== 0 &&
      props.campaign?.geo[0] !== 0
    ) {
      setGeo(props?.campaign?.geo);
      setZoom(8);
      setCenter([props?.campaign?.geo[0], props?.campaign?.geo[1]]);
    } else {
      setGeo([]);
      setZoom(2);
      setCenter([44.414165, 8.942184]);
    }
    handlelocationdatapi();
  }, []);

  useEffect(() => {
    console.log("Location.jsx - geoPoints changed:", geoPoints); // Debug log
    if (
      props.onGeoPointsChange &&
      !areGeoPointsEqual(geoPoints, props.geoPoints)
    ) {
      props.onGeoPointsChange(geoPoints);
    }
  }, [geoPoints, props.geoPoints]);

  const handlelocationdatapi = async () => {
    if (isFetchingCountriesRef.current) return;

    try {
      isFetchingCountriesRef.current = true;
      setLoading(true);
      let res = await getcountry();
      const apiData = res.data?.data?.informationCountries || [];

      const mappedCountries = apiData.map((country, countryIndex) => {
        const countryRawId = getCountryRawId(country, countryIndex);
        const countryLatLon = extractLatLon(country);
        const apiStates = Array.isArray(country.primaryRegion)
          ? country.primaryRegion
          : [];
        const hasEmbeddedStates = apiStates.length > 0;

        return {
          id: `country-${countryRawId}`,
          rawId: countryRawId,
          name: country.name,
          iso2: country?.iso2 ?? country?.ISO2 ?? null,
          iso3: country?.iso3 ?? country?.ISO3 ?? null,
          lat: countryLatLon.lat,
          lon: countryLatLon.lon,
          type: country.type || "country",
          flag: country.flag || false,
          selectAllState: country.selectAllState,
          sselectAllCity: country.selectAllCity,
          _statesLoaded: hasEmbeddedStates,
          states: apiStates.map((state, stateIndex) => {
            const stateRawId = getStateRawId(state, stateIndex);
            const stateLatLon = extractLatLon(state);
            const apiCities = Array.isArray(state.cityList)
              ? state.cityList
              : Array.isArray(state.cities)
                ? state.cities
                : [];
            const hasEmbeddedCities = apiCities.length > 0;

            return {
              id: `state-${countryRawId}-${stateRawId}`,
              rawId: stateRawId,
              name: state.name,
              lat: stateLatLon.lat,
              lon: stateLatLon.lon,
              type: state.type || "primary Region",
              flag: state.flag || false,
              excluded: state.excluded,
              _citiesLoaded: hasEmbeddedCities,
              cities: apiCities.map((city, cityIndex) => {
                const cityRawId = getCityRawId(city, cityIndex);
                const cityLatLon = extractLatLon(city);

                return {
                  id: `city-${countryRawId}-${stateRawId}-${cityRawId}`,
                  rawId: cityRawId,
                  name: city.name,
                  lat: cityLatLon.lat,
                  lon: cityLatLon.lon,
                  type: city.type || "City",
                  flag: city.flag || false,
                  excluded: city.excluded,
                };
              }),
            };
          }),
        };
      });
      countriesRef.current = mappedCountries;
      setCountries(mappedCountries);
      hasFetchedCountriesRef.current = true;
    } catch (err) {
      console.error("Error formatting location payload:", err);
    } finally {
      isFetchingCountriesRef.current = false;
      setLoading(false);
    }
  };

  const ensureCountryStatesLoaded = async (countryId) => {
    const currentCountries = countriesRef.current || [];
    const country = currentCountries.find((c) => c.id === countryId);
    if (!country || country._statesLoaded) return;

    setLoadingStatesForCountries((prev) => {
      const next = new Set(prev);
      next.add(countryId);
      return next;
    });

    try {
      const res = await getprimaryregions(country.rawId);
      const apiStates = res?.data?.data?.informationPrimaryRegionList || [];

      const mappedStates = apiStates.map((state, stateIndex) => {
        const stateRawId = getStateRawId(state, stateIndex);
        const stateLatLon = extractLatLon(state);
        return {
          id: `state-${country.rawId}-${stateRawId}`,
          rawId: stateRawId,
          name: state.name,
          lat: stateLatLon.lat,
          lon: stateLatLon.lon,
          type: state.type || "primary Region",
          flag: false,
          excluded: state.excluded,
          _citiesLoaded: false,
          cities: [],
        };
      });

      setCountries((prev) => {
        const next = prev.map((c) =>
          c.id === countryId
            ? { ...c, states: mappedStates, _statesLoaded: true }
            : c,
        );
        countriesRef.current = next;
        return next;
      });

      // If the country is marked as FULL, keep state checkboxes visually checked.
      const selectedNow = selectedRef.current || new Set();
      if (selectedNow.has(countryId) && selectedNow.has(`FULL-${countryId}`)) {
        setSelected((prev) => {
          const next = new Set(prev);
          mappedStates.forEach((s) => {
            next.add(s.id);
            next.add(`FULL-${s.id}`);
          });
          return next;
        });
      }
    } catch (err) {
      console.error("Error fetching primary regions:", err);
    } finally {
      setLoadingStatesForCountries((prev) => {
        const next = new Set(prev);
        next.delete(countryId);
        return next;
      });
    }
  };

  const ensureStateCitiesLoaded = async (countryId, stateId) => {
    const currentCountries = countriesRef.current || [];
    const country = currentCountries.find((c) => c.id === countryId);
    const state = country?.states?.find((s) => s.id === stateId);
    if (!country || !state || state._citiesLoaded) return;

    setLoadingCitiesForStates((prev) => {
      const next = new Set(prev);
      next.add(stateId);
      return next;
    });

    try {
      const res = await getcities(state.rawId);
      const apiCities = res?.data?.data?.informationCityList || [];

      const mappedCities = apiCities.map((city, cityIndex) => {
        const cityRawId = getCityRawId(city, cityIndex);
        const cityLatLon = extractLatLon(city);
        return {
          id: `city-${country.rawId}-${state.rawId}-${cityRawId}`,
          rawId: cityRawId,
          name: city.name,
          lat: cityLatLon.lat,
          lon: cityLatLon.lon,
          type: city.type || "City",
          flag: false,
          excluded: city.excluded,
        };
      });

      setCountries((prev) => {
        const next = prev.map((c) => {
          if (c.id !== countryId) return c;
          return {
            ...c,
            states: (c.states || []).map((s) =>
              s.id === stateId
                ? { ...s, cities: mappedCities, _citiesLoaded: true }
                : s,
            ),
          };
        });
        countriesRef.current = next;
        return next;
      });

      // If the state is marked as FULL, keep city checkboxes visually checked.
      const selectedNow = selectedRef.current || new Set();
      if (selectedNow.has(stateId) && selectedNow.has(`FULL-${stateId}`)) {
        setSelected((prev) => {
          const next = new Set(prev);
          mappedCities.forEach((city) => next.add(city.id));
          return next;
        });
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
    } finally {
      setLoadingCitiesForStates((prev) => {
        const next = new Set(prev);
        next.delete(stateId);
        return next;
      });
    }
  };

  const handlegeoPoints = useCallback(
    (data) => {
      const incoming = Array.isArray(data) ? data : [];

      const previous = Array.isArray(mapdata) ? mapdata : [];
      const previousNormalized = normalizeGeoPoints(previous);

      const roundKeyPart = (value, digits = 5) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return "";
        return num.toFixed(digits);
      };

      const toKey = (point) => {
        const lat = point?.lat ?? point?.latitude;
        const lon = point?.lon ?? point?.lng ?? point?.longitude;
        const range = point?.range ?? point?.radius;
        return [
          roundKeyPart(lat, 5),
          roundKeyPart(lon, 5),
          String(Math.round(Number(range) || 0)),
        ].join("|");
      };

      const previousByKey = new Map();
      previousNormalized.forEach((point) => {
        const key = toKey(point);
        if (key) previousByKey.set(key, point);
      });

      const enrichedIncoming = incoming.map((point, index) => {
        const key = toKey(point);
        const matched =
          (key && previousByKey.get(key)) || previousNormalized[index] || null;

        const incomingAddress = (point?.address || "").trim();
        const matchedAddress = (matched?.address || "").trim();

        const address =
          incomingAddress && incomingAddress !== "-"
            ? incomingAddress
            : matchedAddress;

        const target = point?.target ?? matched?.target ?? "Target";
        const id = point?.id ?? matched?.id;

        return {
          ...point,
          ...(id ? { id } : null),
          ...(address ? { address } : null),
          ...(target ? { target } : null),
        };
      });

      const newPoints = normalizeGeoPoints(enrichedIncoming);
      setmapdata(newPoints);
      setGeoPoints(newPoints);
    },
    [mapdata, normalizeGeoPoints],
  );

  const buildGeoPayload = () => {
    const payload = mapdata.map((item) => ({
      address: item.address || "-",
      lat: Number(item.lat),
      lon: Number(item.lon),
      radius: Number(item.range),
      target: item.target || "Target",
    }));

    console.log("GEO PAYLOAD:", payload);

    return payload;
  };

  const [seletedstate, setselectedstate] = useState([]);

  const selectedRef = useRef(selected);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const hydratedCampaignRef = useRef(null);
  const hydratingCampaignRef = useRef(null);
  const [countrystatic, setcountrystatic] = useState([
    "Brazil",
    "India",
    "USA",
  ]);
  const [radiusstatic, setradiustatic] = useState([
    "Kilometers",
    "Meters", // ✅ corrected
    "Miles",
    "Feet",
  ]);

  useEffect(() => {
    selectedRef.current = selected;

    // Update country flags based on current selection
    setCountries((prevCountries) =>
      prevCountries.map((country) => ({
        ...country,
        flag: selected.has(country.id),
        states: country.states?.map((state) => ({
          ...state,
          flag: selected.has(state.id),
          cities: state.cities?.map((city) => ({
            ...city,
            flag: selected.has(city.id),
          })),
        })),
      })),
    );
    console.log("countries", countries);
  }, [selected]);

  useEffect(() => {
    if (!open) return;

    countries.forEach((country) => {
      const checkbox = countryCheckboxRefs.current.get(country.id);
      if (!checkbox) return;

      const stateIds = (country.states ?? []).map((state) => state.id);
      const cityIds = (country.states ?? []).flatMap((state) =>
        (state.cities ?? []).map((city) => city.id),
      );
      const hasFullCountrySelection =
        selected.has(country.id) && selected.has(`FULL-${country.id}`);
      const hasAnyChildSelection =
        stateIds.some((id) => selected.has(id)) ||
        cityIds.some((id) => selected.has(id));

      checkbox.indeterminate = !hasFullCountrySelection && hasAnyChildSelection;
    });
  }, [countries, selected, open]);

  useEffect(() => {
    if (!open) return;

    countries.forEach((country) => {
      (country.states ?? []).forEach((state) => {
        const el = stateCheckboxRefs.current.get(state.id);
        if (!el) return;

        const cityIds = (state.cities ?? []).map((city) => city.id);
        const hasFullStateSelection =
          selected.has(state.id) && selected.has(`FULL-${state.id}`);
        const hasAnyCitySelection = cityIds.some((id) => selected.has(id));

        el.indeterminate = !hasFullStateSelection && hasAnyCitySelection;
      });
    });
  }, [countries, selected, open]);

  const handledeletelocation = (item) => {
    console.log("Deleting location:", item);

    // ✅ Remove from table (FIXED: remove full hierarchy)
    setSelectedCountryItems((prev) =>
      prev.filter((p) => {
        if (item.type === "country") {
          return p.country !== item.country; // remove all under country
        }

        if (item.type === "state") {
          return !(p.country === item.country && p.state === item.state);
        }

        if (item.type === "city") {
          return !(
            p.country === item.country &&
            p.state === item.state &&
            p.city === item.city
          );
        }

        return true;
      }),
    );

    // ✅ Update selection + flags together (FIXED stale state issue)
    setSelected((prev) => {
      const next = new Set(prev);
      const countryData = countries.find((c) => c.id === item.country_id);

      if (!countryData) return next;

      if (item.type === "country") {
        next.delete(item.country_id);

        countryData.states?.forEach((state) => {
          next.delete(state.id);
          state.cities?.forEach((city) => {
            next.delete(city.id);
          });
        });
      } else if (item.type === "state") {
        const stateData = countryData.states?.find(
          (s) => s.id === item.state_id,
        );

        if (stateData) {
          next.delete(item.state_id);

          stateData.cities?.forEach((city) => {
            next.delete(city.id);
          });

          const anyStateSelected = countryData.states?.some((st) =>
            next.has(st.id),
          );

          if (!anyStateSelected) {
            next.delete(item.country_id);
          }
        }
      } else if (item.type === "city") {
        const stateData = countryData.states?.find(
          (s) => s.id === item.state_id,
        );

        if (stateData) {
          next.delete(item.city_id);

          const anyCitySelected = stateData.cities?.some((city) =>
            next.has(city.id),
          );

          if (!anyCitySelected) {
            next.delete(item.state_id);

            const anyStateSelected = countryData.states?.some((st) =>
              st.cities?.some((city) => next.has(city.id)),
            );

            if (!anyStateSelected) {
              next.delete(item.country_id);
            }
          }
        }
      }

      // ✅ IMPORTANT: update flags using latest "next"
      setCountries((prevCountries) =>
        prevCountries.map((country) => {
          if (country.id !== item.country_id) return country;

          return {
            ...country,
            flag: next.has(country.id),
            states: country.states?.map((state) => ({
              ...state,
              flag: next.has(state.id),
              cities: state.cities?.map((city) => ({
                ...city,
                flag: next.has(city.id),
              })),
            })),
          };
        }),
      );

      return next;
    });
  };

  const handleStatusChange = (index, newStatus) => {
    setSelectedCountryItems((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((item, idx) => {
        if (idx === index) {
          return { ...item, status: newStatus };
        }
        return item;
      });
    });
  };

  const handlelocationpopup = () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (
      nextOpen &&
      countries.length === 0 &&
      !isFetchingCountriesRef.current &&
      !hasFetchedCountriesRef.current
    ) {
      handlelocationdatapi();
    }
  };

  function handleremovecountries() {
    setSelectedCountryItems([]);
    setSelected(new Set());
    setCountries((prevCountries) =>
      prevCountries.map((country) => ({
        ...country,
        flag: false,
        states: country.states?.map((state) => ({
          ...state,
          flag: false,
          cities: state.cities?.map((city) => ({
            ...city,
            flag: false,
          })),
        })),
      })),
    );
  }

  useEffect(() => {
    const sourcePoints = Array.isArray(props.geoPoints) ? props.geoPoints : [];
    const prevLen = Array.isArray(mapdata) ? mapdata.length : 0;

    if (sourcePoints.length === 0) {
      return;
    }

    // Parent sometimes sends geoPoints without `target` (or without a meaningful address).
    // In that case, preserve the user's current Target/Exclude selection to prevent
    // the dropdown from "flipping" back and forth.
    const normalizedIncoming = [];
    for (const item of sourcePoints) {
      const lat = Number(item?.lat ?? item?.latitude ?? "");
      const lon = Number(item?.lon ?? item?.longitude ?? "");
      const range = Number(item?.range ?? item?.radius ?? "");
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        !Number.isFinite(range)
      ) {
        continue;
      }

      const id =
        item?.id ??
        `${Number(item?.lat ?? item?.latitude ?? "")}-${Number(
          item?.lon ?? item?.longitude ?? "",
        )}-${Number(item?.range ?? item?.radius ?? "")}`;

      const hasTarget =
        Object.prototype.hasOwnProperty.call(item, "target") &&
        item?.target !== undefined &&
        item?.target !== null;

      const hasAddress =
        Object.prototype.hasOwnProperty.call(item, "address") &&
        typeof item?.address === "string" &&
        item.address.trim() !== "" &&
        item.address !== "-";

      normalizedIncoming.push({
        id,
        lat,
        lon,
        range,
        address: item?.address || "-",
        target:
          item?.target === false || item?.target === "Exclude"
            ? "Exclude"
            : "Target",
        _hasTarget: hasTarget,
        _hasAddress: hasAddress,
      });
    }

    const prevNormalized = normalizeGeoPoints(mapdata);
    const prevById = new Map(prevNormalized.map((p) => [String(p.id), p]));

    const mergedGeoPoints = normalizedIncoming.map((point) => {
      const prev = prevById.get(String(point.id));
      if (!prev) {
        const { _hasTarget, _hasAddress, ...rest } = point;
        return rest;
      }

      const merged = {
        ...point,
        address: point._hasAddress
          ? point.address
          : (prev.address ?? point.address),
        target: point._hasTarget ? point.target : (prev.target ?? point.target),
      };

      const { _hasTarget, _hasAddress, ...rest } = merged;
      return rest;
    });

    if (mergedGeoPoints.length === 0) return;

    if (!areGeoPointsEqual(mapdata, mergedGeoPoints)) {
      setmapdata(mergedGeoPoints);
    }
    if (!areGeoPointsEqual(geoPoints, mergedGeoPoints)) {
      setGeoPoints(mergedGeoPoints);
    }

    // Only auto-center on first hydration; do not override user-driven zoom/pan.
    if (suppressAutoCenterRef.current) return;
    if (prevLen === 0) {
      setCenter([mergedGeoPoints[0].lat, mergedGeoPoints[0].lon]);
      setZoom(8);
    }
  }, [props.geoPoints]);

  useEffect(() => {
    const parseCampaign = (value) => {
      if (!value) return null;
      if (typeof value === "object") return value;
      try {
        return JSON.parse(value);
      } catch (e) {
        return null;
      }
    };

    const campaign = parseCampaign(props?.campaign);
    const campaignLocations = Array.isArray(campaign?.campaignLocations)
      ? campaign.campaignLocations
      : Array.isArray(campaign?.locations)
        ? campaign.locations
        : [];
    const campaignGeoLocations = Array.isArray(campaign?.campaignGeoLocations)
      ? campaign.campaignGeoLocations
      : Array.isArray(campaign?.geoLocations)
        ? campaign.geoLocations
        : [];
    if (!campaign || countries.length === 0) return;
    if (isLocationHydrated) return;

    const hydrationKey = JSON.stringify({
      id: campaign.id ?? null,
      locations: campaignLocations.map(
        (item) => item.id ?? item.countryId ?? item.country_id,
      ),
      geo: campaignGeoLocations.map((item) => item.id ?? item.latitude),
    });

    if (hydratedCampaignRef.current === hydrationKey) return;
    if (hydratingCampaignRef.current === hydrationKey) return;
    hydratingCampaignRef.current = hydrationKey;

    let cancelled = false;
    setIsHydrating(true);

    const hydrate = async () => {
      try {
        // Load missing states/cities required to hydrate saved selections.
        for (const locationItem of campaignLocations) {
          const currentCountries = countriesRef.current || [];
          const locationCountryId =
            locationItem.countryId ?? locationItem.country_id;
          const country = currentCountries.find(
            (entry) => String(entry.rawId) === String(locationCountryId),
          );

          if (!country) continue;

          const hasStateOrCitySelections =
            !locationItem.selectAll &&
            ((locationItem.states || []).length > 0 ||
              (locationItem.cities || []).length > 0);

          if (hasStateOrCitySelections && !country._statesLoaded) {
            await ensureCountryStatesLoaded(country.id);
            if (cancelled) return;
          }

          const needsCityHydration =
            !locationItem.selectAll && (locationItem.cities || []).length > 0;

          if (needsCityHydration) {
            const afterStatesCountries = countriesRef.current || [];
            const afterStatesCountry = afterStatesCountries.find(
              (entry) => entry.id === country.id,
            );
            const stateIdsToCheck = new Set(
              (locationItem.states || []).map((id) => String(id)),
            );

            for (const st of afterStatesCountry?.states || []) {
              if (!stateIdsToCheck.has(String(st.rawId))) continue;
              if (!st._citiesLoaded) {
                await ensureStateCitiesLoaded(afterStatesCountry.id, st.id);
                if (cancelled) return;
              }
            }
          }
        }

        const currentCountries = countriesRef.current || [];
        if (cancelled) return;

        const nextSelected = new Set();
        const nextItems = [];

        campaignLocations.forEach((locationItem) => {
          const locationCountryId =
            locationItem.countryId ?? locationItem.country_id;
          const country = currentCountries.find(
            (entry) => String(entry.rawId) === String(locationCountryId),
          );

          if (!country) return;

          if (locationItem.selectAll) {
            nextSelected.add(country.id);
            nextSelected.add(`FULL-${country.id}`);
            (country.states || []).forEach((state) => {
              nextSelected.add(state.id);
            });

            nextItems.push({
              id: locationItem.id,
              country: country.name,
              country_id: country.rawId,
              state: "",
              city: "",
              type: "country",
              status: "Targeted",
            });
            return;
          }

          const selectedStateIds = new Set(
            (locationItem.states || []).map((id) => String(id)),
          );
          const selectedCityIds = new Set(
            (locationItem.cities || []).map((id) => String(id)),
          );
          const handledCityIds = new Set();

          (country.states || []).forEach((state) => {
            const stateCities = state.cities || [];
            const stateSelected = selectedStateIds.has(String(state.rawId));
            const selectedCitiesInState = stateCities.filter((city) =>
              selectedCityIds.has(String(city.rawId)),
            );

            if (!stateSelected && selectedCitiesInState.length === 0) return;

            if (stateSelected) {
              nextSelected.add(state.id);
            }

            if (
              stateSelected &&
              (selectedCitiesInState.length === 0 ||
                selectedCitiesInState.length === stateCities.length)
            ) {
              nextItems.push({
                id: locationItem.id,
                country: country.name,
                state: state.name,
                state_id: state.rawId,
                country_id: country.rawId,
                city: "",
                type: "state",
                status: "Targeted",
              });
              return;
            }

            selectedCitiesInState.forEach((city) => {
              handledCityIds.add(String(city.rawId));
              nextSelected.add(city.id);
              nextItems.push({
                id: locationItem.id,
                country: country.name,
                state: state.name,
                city: city.name,
                city_id: city.rawId,
                state_id: state.rawId,
                country_id: country.rawId,
                type: "city",
                status: "Targeted",
              });
            });
          });

          (country.states || []).forEach((state) => {
            (state.cities || []).forEach((city) => {
              if (
                !selectedCityIds.has(String(city.rawId)) ||
                handledCityIds.has(String(city.rawId))
              ) {
                return;
              }

              nextSelected.add(city.id);
              nextItems.push({
                id: locationItem.id,
                country: country.name,
                state: state.name,
                city: city.name,
                city_id: city.rawId,
                state_id: state.rawId,
                country_id: country.rawId,
                type: "city",
                status: "Targeted",
              });
            });
          });
        });

        const nextGeoPoints = normalizeGeoPoints(campaignGeoLocations);

        if (
          campaign?.hyperlocalType !== undefined &&
          campaign?.hyperlocalType !== null
        ) {
          const savedHyperlocalType = String(
            campaign.hyperlocalType,
          ).toLowerCase();
          sethyperlocal(savedHyperlocalType === "upload" ? 0 : 1);
        }

        setSelected(nextSelected);
        setSelectedCountryItems(nextItems);
        setmapdata(nextGeoPoints);
        setGeoPoints(nextGeoPoints);

        if (nextGeoPoints.length > 0) {
          setCenter([nextGeoPoints[0].lat, nextGeoPoints[0].lon]);
          setZoom(8);
        }

        hydratedCampaignRef.current = hydrationKey;
        hydratingCampaignRef.current = null;
        if (setIsLocationHydrated) {
          setIsLocationHydrated(true);
        }
      } catch (err) {
        console.error("Hydration error:", err);
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
      if (hydratingCampaignRef.current === hydrationKey) {
        hydratingCampaignRef.current = null;
      }
      setIsHydrating(false);
    };
  }, [countries, props.campaign, setSelectedCountryItems]);

  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [exactMatch, setExactMatch] = useState(false);

  const locationIndex = useMemo(() => {
    const items = [];

    (countries || []).forEach((country) => {
      if (!country) return;
      const countryLabel = country?.name || "";
      const countrySubtitle =
        country?.iso2 || country?.iso3
          ? `${country?.iso2 || ""} ${country?.iso3 || ""}`.trim()
          : "";
      items.push({
        kind: "country",
        rawId: country.rawId,
        label: countryLabel,
        subtitle: countrySubtitle,
        lat: country.lat,
        lon: country.lon,
        searchKey: normalizeSearchValue(
          `${countryLabel} ${countrySubtitle}`.trim(),
        ),
      });

      (country.states || []).forEach((state) => {
        const stateLabel = state?.name || "";
        const stateFullLabel = [stateLabel, countryLabel]
          .filter(Boolean)
          .join(", ");
        items.push({
          kind: "state",
          rawId: state.rawId,
          label: stateFullLabel,
          subtitle: "State",
          lat: state.lat,
          lon: state.lon,
          searchKey: normalizeSearchValue(stateFullLabel),
        });

        (state.cities || []).forEach((city) => {
          const cityLabel = city?.name || "";
          const cityFullLabel = [cityLabel, stateLabel, countryLabel]
            .filter(Boolean)
            .join(", ");
          items.push({
            kind: "city",
            rawId: city.rawId,
            label: cityFullLabel,
            subtitle: "City",
            lat: city.lat,
            lon: city.lon,
            searchKey: normalizeSearchValue(cityFullLabel),
          });
        });
      });
    });

    return items.filter((item) => (item.label || "").trim().length > 0);
  }, [countries]);

  const getMapSearchMatchesFromCountries = (termKey, limit = 10) => {
    const results = [];

    const scoreLabel = (labelKey) => {
      if (labelKey === termKey) return 0;
      if (labelKey.startsWith(termKey)) return 1;
      return 2;
    };

    const pushIfMatch = ({ kind, rawId, label, subtitle, lat, lon }) => {
      if (!label) return;
      const labelKey = normalizeSearchValue(label);
      if (!labelKey || !labelKey.includes(termKey)) return;
      results.push({
        kind,
        rawId,
        label,
        subtitle,
        lat,
        lon,
        _score: scoreLabel(labelKey),
      });
    };

    const countriesNow = countriesRef.current || [];

    for (const country of countriesNow) {
      if (!country) continue;

      const countryLabel = country?.name || "";
      const countrySubtitle =
        country?.iso2 || country?.iso3
          ? `${country?.iso2 || ""} ${country?.iso3 || ""}`.trim()
          : "";

      pushIfMatch({
        kind: "country",
        rawId: country.rawId,
        label: countryLabel,
        subtitle: countrySubtitle,
        lat: country.lat,
        lon: country.lon,
      });

      for (const state of country.states || []) {
        const stateLabel = state?.name || "";
        const stateFullLabel = [stateLabel, countryLabel]
          .filter(Boolean)
          .join(", ");

        pushIfMatch({
          kind: "state",
          rawId: state.rawId,
          label: stateFullLabel,
          subtitle: "State",
          lat: state.lat,
          lon: state.lon,
        });

        for (const city of state.cities || []) {
          const cityLabel = city?.name || "";
          const cityFullLabel = [cityLabel, stateLabel, countryLabel]
            .filter(Boolean)
            .join(", ");

          pushIfMatch({
            kind: "city",
            rawId: city.rawId,
            label: cityFullLabel,
            subtitle: "City",
            lat: city.lat,
            lon: city.lon,
          });
        }
      }

      if (results.length >= limit) break;
    }

    return results
      .sort((a, b) => a._score - b._score || a.label.localeCompare(b.label))
      .slice(0, limit);
  };

  const findBestCountryForMapSearch = (countryTerm) => {
    const termKey = normalizeSearchValue(countryTerm);
    if (!termKey) return null;

    const countriesNow = countriesRef.current || [];

    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const country of countriesNow) {
      if (!country) continue;
      const label = String(country?.name || "");
      const labelKey = normalizeSearchValue(label);
      if (!labelKey) continue;

      let score = null;
      if (labelKey === termKey) score = 0;
      else if (labelKey.startsWith(termKey)) score = 1;
      else if (labelKey.includes(termKey)) score = 2;

      if (score === null) continue;
      if (score < bestScore) {
        best = country;
        bestScore = score;
      }
    }

    return best;
  };

  const findCountryByRawId = (countryRawId) => {
    const id = String(countryRawId ?? "");
    if (!id) return null;
    const countriesNow = countriesRef.current || [];
    return countriesNow.find((c) => String(c?.rawId ?? "") === id) || null;
  };

  const inferSingleCountryFromMapPoints = () => {
    const points = Array.isArray(mapdata) ? mapdata : [];
    const countriesNow = countriesRef.current || [];

    const matchedCountries = new Set();
    for (const point of points) {
      const addrKey = normalizeSearchValue(point?.address || "");
      if (!addrKey) continue;
      for (const country of countriesNow) {
        if (!country) continue;
        const key = normalizeSearchValue(country?.name || "");
        if (key && key === addrKey) {
          matchedCountries.add(country.id);
        }
      }
    }

    if (matchedCountries.size !== 1) return null;
    const onlyCountryId = Array.from(matchedCountries)[0];
    return (countriesNow || []).find((c) => c?.id === onlyCountryId) || null;
  };

  const fetchCitiesForState = async (stateRawId) => {
    const cacheKey = String(stateRawId ?? "");
    if (!cacheKey) return [];

    const cached = mapSearchCityCacheRef.current.get(cacheKey);
    if (cached && Array.isArray(cached?.cities)) return cached.cities;

    const res = await getcities(stateRawId);
    const apiCities = res?.data?.data?.informationCityList || [];

    const mapped = (apiCities || [])
      .map((city, cityIndex) => {
        const cityRawId = getCityRawId(city, cityIndex);
        const cityLatLon = extractLatLon(city);
        return {
          rawId: cityRawId,
          name: String(city?.name || ""),
          lat: cityLatLon.lat,
          lon: cityLatLon.lon,
        };
      })
      .filter((c) => c?.name);

    mapSearchCityCacheRef.current.set(cacheKey, {
      fetchedAt: Date.now(),
      cities: mapped,
    });

    return mapped;
  };

  const pickBestStateFromApi = (apiStates, stateTermKey) => {
    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;

    (apiStates || []).forEach((state, stateIndex) => {
      const stateRawId = getStateRawId(state, stateIndex);
      const name = String(state?.name || "");
      const key = normalizeSearchValue(name);
      if (!key) return;

      let score = null;
      if (key === stateTermKey) score = 0;
      else if (key.startsWith(stateTermKey)) score = 1;
      else if (key.includes(stateTermKey)) score = 2;

      if (score === null) return;
      if (score < bestScore) {
        bestScore = score;
        best = { rawId: stateRawId, name };
      }
    });

    return best;
  };

  const remoteMapSearch = async (taskId, rawTerm) => {
    if (mapSearchTaskIdRef.current !== taskId) return;

    const parts = String(rawTerm || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const context = mapSearchContextRef.current || {};

    const resolveCountry = (explicitCountryPart) => {
      if (explicitCountryPart) {
        return findBestCountryForMapSearch(explicitCountryPart);
      }
      if (context?.countryRawId) {
        const byId = findCountryByRawId(context.countryRawId);
        if (byId) return byId;
      }
      return inferSingleCountryFromMapPoints();
    };

    const looksLikeCountry = (term) =>
      Boolean(findBestCountryForMapSearch(term));

    const runStateSearch = async (country, statePart) => {
      const stateTermKey = normalizeSearchValue(statePart);
      if (stateTermKey.length < 2) {
        setMapSearchNotice("Type more characters for the state name.");
        setMapSearchResults([]);
        return;
      }

      setMapSearchNotice("Searching...");

      try {
        const res = await searchPrimaryRegions(country.rawId, statePart);
        if (mapSearchTaskIdRef.current !== taskId) return;

        const apiStates = res?.data?.data?.informationPrimaryRegionList || [];

        const scored = (apiStates || [])
          .map((state, stateIndex) => {
            const stateRawId = getStateRawId(state, stateIndex);
            const stateLatLon = extractLatLon(state);
            const stateName = String(state?.name || "");
            const fullLabel = [stateName, country?.name]
              .filter(Boolean)
              .join(", ");
            const key = normalizeSearchValue(stateName);

            if (!key || !key.includes(stateTermKey)) return null;

            const score =
              key === stateTermKey ? 0 : key.startsWith(stateTermKey) ? 1 : 2;

            return {
              kind: "state",
              rawId: stateRawId,
              countryRawId: country.rawId,
              countryName: country?.name || "",
              stateName,
              label: fullLabel,
              subtitle: "State",
              lat: stateLatLon.lat,
              lon: stateLatLon.lon,
              _score: score,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a._score - b._score || a.label.localeCompare(b.label))
          .slice(0, 10);

        setMapSearchResults(scored);
        setMapSearchNotice(scored.length > 0 ? "" : "No results");
      } catch (err) {
        console.error("Map search state lookup failed:", err);
        if (mapSearchTaskIdRef.current !== taskId) return;
        setMapSearchResults([]);
        setMapSearchNotice("Search failed. Please try again.");
      }
    };

    const runCitySearch = async ({
      cityPart,
      statePart,
      explicitCountryPart,
      fallbackStateRawId,
      fallbackStateName,
      fallbackCountryRawId,
      fallbackCountryName,
    }) => {
      const cityTermKey = normalizeSearchValue(cityPart);
      if (cityTermKey.length < 2) {
        setMapSearchNotice("Type more characters for the city name.");
        setMapSearchResults([]);
        return;
      }

      const country = resolveCountry(explicitCountryPart);
      if (!country && !fallbackCountryRawId) {
        setMapSearchNotice(
          "Tip: use 'City, State, Country' (or select a state first).",
        );
        setMapSearchResults([]);
        return;
      }

      const countryName = country?.name || fallbackCountryName || "";
      const countryRawId = country?.rawId || fallbackCountryRawId || null;

      let stateRawId = fallbackStateRawId || null;
      let stateName = fallbackStateName || statePart || "";

      if (!stateRawId) {
        const stateTermKey = normalizeSearchValue(statePart);
        if (!stateTermKey || stateTermKey.length < 2) {
          setMapSearchNotice(
            "Tip: use 'City, State, Country' (or select a state first).",
          );
          setMapSearchResults([]);
          return;
        }

        setMapSearchNotice("Searching...");

        try {
          const res = await searchPrimaryRegions(countryRawId, statePart);
          if (mapSearchTaskIdRef.current !== taskId) return;
          const apiStates = res?.data?.data?.informationPrimaryRegionList || [];
          const bestState = pickBestStateFromApi(apiStates, stateTermKey);
          if (!bestState?.rawId) {
            setMapSearchResults([]);
            setMapSearchNotice("State not found. Try 'City, State, Country'.");
            return;
          }
          stateRawId = bestState.rawId;
          stateName = bestState.name || stateName;
        } catch (err) {
          console.error("Map search state lookup for city search failed:", err);
          if (mapSearchTaskIdRef.current !== taskId) return;
          setMapSearchResults([]);
          setMapSearchNotice("Search failed. Please try again.");
          return;
        }
      } else {
        setMapSearchNotice("Searching...");
      }

      try {
        const cities = await fetchCitiesForState(stateRawId);
        if (mapSearchTaskIdRef.current !== taskId) return;

        const scored = (cities || [])
          .map((city) => {
            const cityName = String(city?.name || "");
            const key = normalizeSearchValue(cityName);
            if (!key || !key.includes(cityTermKey)) return null;
            const score =
              key === cityTermKey ? 0 : key.startsWith(cityTermKey) ? 1 : 2;
            const fullLabel = [cityName, stateName, countryName]
              .filter(Boolean)
              .join(", ");
            return {
              kind: "city",
              rawId: city.rawId,
              stateRawId,
              stateName,
              countryRawId,
              countryName,
              label: fullLabel,
              subtitle: "City",
              lat: city.lat,
              lon: city.lon,
              _score: score,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a._score - b._score || a.label.localeCompare(b.label))
          .slice(0, 10);

        setMapSearchResults(scored);
        setMapSearchNotice(scored.length > 0 ? "" : "No results");
      } catch (err) {
        console.error("Map search city lookup failed:", err);
        if (mapSearchTaskIdRef.current !== taskId) return;
        setMapSearchResults([]);
        setMapSearchNotice("Search failed. Please try again.");
      }
    };

    // Cases supported:
    // - "State, Country" => state search (remote)
    // - "City, State, Country" => city search (remote, via getcities within matched state)
    // - "City" => city search within last selected state (context)
    // - "City, State" => city search within context country (if available)

    if (parts.length === 0) {
      setMapSearchResults([]);
      setMapSearchNotice("");
      return;
    }

    if (parts.length === 1) {
      if (context?.stateRawId) {
        await runCitySearch({
          cityPart: parts[0],
          statePart: context.stateName || "",
          explicitCountryPart: null,
          fallbackStateRawId: context.stateRawId,
          fallbackStateName: context.stateName || "",
          fallbackCountryRawId: context.countryRawId,
          fallbackCountryName: context.countryName || "",
        });
        return;
      }

      // Fall back to requiring explicit context to avoid "load everything" calls.
      setMapSearchNotice(
        "Tip: use 'State, Country' or 'City, State, Country' (or select a state first).",
      );
      setMapSearchResults([]);
      return;
    }

    if (parts.length === 2) {
      const second = parts[1];
      if (looksLikeCountry(second)) {
        const country = resolveCountry(second);
        if (!country) {
          setMapSearchNotice("Country not found. Try 'State, Country'.");
          setMapSearchResults([]);
          return;
        }
        await runStateSearch(country, parts[0]);
        return;
      }

      if (context?.countryRawId) {
        await runCitySearch({
          cityPart: parts[0],
          statePart: parts[1],
          explicitCountryPart: null,
          fallbackStateRawId: null,
          fallbackStateName: parts[1],
          fallbackCountryRawId: context.countryRawId,
          fallbackCountryName: context.countryName || "",
        });
        return;
      }

      // Default back to state search with inferred country (from map points).
      const inferredCountry = resolveCountry(null);
      if (!inferredCountry) {
        setMapSearchNotice("Tip: use 'State, Country'.");
        setMapSearchResults([]);
        return;
      }
      await runStateSearch(inferredCountry, parts[0]);
      return;
    }

    // parts.length >= 3 => City, State, Country (city may itself contain commas)
    const countryPart = parts[parts.length - 1];
    const statePart = parts[parts.length - 2];
    const cityPart = parts.slice(0, parts.length - 2).join(", ");

    if (!looksLikeCountry(countryPart)) {
      setMapSearchNotice("Country not found. Try 'City, State, Country'.");
      setMapSearchResults([]);
      return;
    }

    await runCitySearch({
      cityPart,
      statePart,
      explicitCountryPart: countryPart,
      fallbackStateRawId: null,
      fallbackStateName: statePart,
      fallbackCountryRawId: null,
      fallbackCountryName: "",
    });
  };

  const [fileError, setFileError] = useState("");

  const maybeRemoteMapSearch = async (taskId, term) => {
    const remoteKey = normalizeSearchValue(term);
    const now = Date.now();

    // Prevent duplicate requests for the same query (common in dev + StrictMode
    // and when both live-search + manual search overlap).
    if (
      remoteKey &&
      remoteKey === mapSearchLastRemoteKeyRef.current &&
      now - mapSearchLastRemoteAtRef.current < 800
    ) {
      return;
    }

    mapSearchLastRemoteKeyRef.current = remoteKey;
    mapSearchLastRemoteAtRef.current = now;
    await remoteMapSearch(taskId, term);
  };

  useEffect(() => {
    if (!mapSearchOpen) return;

    const handleDocumentClick = (event) => {
      const container = mapSearchContainerRef.current;
      if (container && !container.contains(event.target)) {
        setMapSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [mapSearchOpen]);

  // Note: do not eagerly load states for map search; map search should be query-driven
  // (avoids fetching all states for all countries).

  useEffect(() => {
    if (!mapSearchOpen) return;

    const term = (mapSearchQuery || "").trim();
    if (term.length < 3) {
      setMapSearchIsLoading(false);
      setMapSearchResults([]);
      return;
    }

    setMapSearchIsLoading(true);
    setMapSearchNotice("Searching...");

    const taskId = (mapSearchTaskIdRef.current += 1);

    const timeoutId = window.setTimeout(async () => {
      if (mapSearchTaskIdRef.current !== taskId) return;
      try {
        const res = await getCountryStateAndCity(term);
        if (mapSearchTaskIdRef.current !== taskId) return;

        const data = res?.data || [];
        const results = data.map((item) => {
          if (item.cityName) {
            return {
              kind: "city",
              rawId: item.cityId,
              label: [item.cityName, item.stateName, item.countryName]
                .filter(Boolean)
                .join(", "),
              subtitle: "City",
              lat: item.cityLatitude,
              lon: item.cityLongitude,
            };
          } else if (item.stateName) {
            return {
              kind: "state",
              rawId: item.stateId,
              label: [item.stateName, item.countryName]
                .filter(Boolean)
                .join(", "),
              subtitle: "State",
              lat: item.stateLatitude,
              lon: item.stateLongitude,
            };
          } else {
            return {
              kind: "country",
              rawId: item.countryId,
              label: item.countryName || "",
              subtitle: "Country",
              lat: item.countryLatitude,
              lon: item.countryLongitude,
            };
          }
        });

        setMapSearchResults(results);
        setMapSearchNotice(results.length > 0 ? "" : "No results");
      } catch (err) {
        console.error("Error calling getCountryStateAndCity:", err);
        if (mapSearchTaskIdRef.current !== taskId) return;
        setMapSearchResults([]);
        setMapSearchNotice("Search failed. Please try again.");
      } finally {
        if (mapSearchTaskIdRef.current === taskId) {
          setMapSearchIsLoading(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [mapSearchQuery, mapSearchRunId, mapSearchOpen]);

  // Note: map search should only run on explicit user action (Enter / search icon),
  // not on every keystroke.

  const addGeoPointFromSearch = (item) => {
    const lat = readNumber(item?.lat);
    const lon = readNumber(item?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setMapSearchNotice(
        "No coordinates found for this location in your geo dataset.",
      );
      return;
    }

    const nextPoint = normalizeGeoPoints([
      {
        id: `loc-${item.kind}-${item.rawId ?? item.label}`,
        address: item.label || "-",
        lat,
        lon,
        range: 1000,
        target: "Target",
      },
    ])[0];

    if (!nextPoint) return;

    setmapdata((prev) => {
      const existing = Array.isArray(prev) ? prev : [];
      const alreadyAdded = existing.some(
        (p) =>
          Number(p.lat) === nextPoint.lat &&
          Number(p.lon) === nextPoint.lon &&
          String(p.address || "") === String(nextPoint.address || ""),
      );

      const updated = alreadyAdded ? existing : [...existing, nextPoint];
      setGeoPoints(updated);
      return updated;
    });

    // Keep search behavior consistent with the table-location click zoom.
    const nextZoom = 13;
    suppressAutoCenterOnce();
    setCenter([nextPoint.lat, nextPoint.lon]);
    setZoom(nextZoom);
    setFocusPoint({
      lat: nextPoint.lat,
      lon: nextPoint.lon,
      radius: nextPoint.range,
    });
  };

  const handleMapSearchSelect = (item) => {
    setMapSearchTerm(item.label || "");
    setMapSearchQuery(item.label || "");
    setMapSearchOpen(false);
    setmap(true); // ensure map view is visible after selecting a result

    // Keep a lightweight context so the next search can resolve cities within
    // the same state (e.g. search a State first, then type only a City name).
    try {
      const kind = item?.kind;
      const parsedParts = String(item?.label || "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const explicitCountryRawId = item?.countryRawId ?? null;
      const explicitCountryName = item?.countryName ?? null;
      const parsedCountryName =
        parsedParts.length >= 2 ? parsedParts[parsedParts.length - 1] : "";
      const parsedCountry = parsedCountryName
        ? findBestCountryForMapSearch(parsedCountryName)
        : null;

      const countryRawId = explicitCountryRawId ?? parsedCountry?.rawId ?? null;
      const countryName =
        explicitCountryName ?? parsedCountry?.name ?? parsedCountryName ?? "";
      const stateRawId =
        item?.stateRawId ?? (kind === "state" ? item?.rawId : null);
      const stateName = item?.stateName ?? "";

      if (kind === "country") {
        mapSearchContextRef.current = {
          countryRawId: item?.rawId ?? null,
          countryName: item?.label ?? "",
          stateRawId: null,
          stateName: "",
        };
      } else if (kind === "state") {
        const nextCountryRawId =
          countryRawId ?? mapSearchContextRef.current?.countryRawId ?? null;
        const nextCountryName =
          countryName ?? mapSearchContextRef.current?.countryName ?? "";
        mapSearchContextRef.current = {
          countryRawId: nextCountryRawId,
          countryName: nextCountryName,
          stateRawId: stateRawId ?? null,
          stateName:
            stateName ||
            String(item?.label || "")
              .split(",")[0]
              ?.trim() ||
            "",
        };
        setMapSearchNotice("Tip: now you can search just the city name.");
      } else if (kind === "city") {
        mapSearchContextRef.current = {
          countryRawId:
            countryRawId ?? mapSearchContextRef.current?.countryRawId ?? null,
          countryName:
            countryName ?? mapSearchContextRef.current?.countryName ?? "",
          stateRawId:
            stateRawId ?? mapSearchContextRef.current?.stateRawId ?? null,
          stateName: stateName ?? mapSearchContextRef.current?.stateName ?? "",
        };
      }
    } catch (e) {
      // ignore context errors; map search should still work
    }

    addGeoPointFromSearch(item);
  };

  const commitMapSearch = () => {
    const query = (mapSearchTerm || "").trim();
    setMapSearchQuery(query);
    setMapSearchOpen(true);
    if (mapSearchLiveTimeoutRef.current) {
      window.clearTimeout(mapSearchLiveTimeoutRef.current);
      mapSearchLiveTimeoutRef.current = null;
    }
    setMapSearchRunId((prev) => prev + 1);

    if (normalizeSearchValue(query).length < 3) {
      setMapSearchIsLoading(false);
      setMapSearchNotice("Type at least 3 characters.");
      setMapSearchResults([]);
    }
  };

  const filteredCountries = countries
    ?.map((country) => {
      const term = (locationSearchTerm || "").trim().toLowerCase();
      if (term.length < 3) return country; // show all if search term < 3
      const normalizedTerm = normalizeSearchValue(term);

      const countryName = (country?.name || "").toLowerCase();
      const normalizedCountryName = normalizeSearchValue(countryName);
      const countryMatches = exactMatch
        ? normalizedCountryName === normalizedTerm
        : normalizedCountryName.includes(normalizedTerm);

      // If the country matches, keep the full country tree (do not filter states/cities).
      // This avoids cases like searching "indi" matching "Dindigul" and hiding other cities.
      if (countryMatches) {
        return country;
      }

      // filter states: match by state name OR city name
      const filteredStates = (country.states || [])
        .map((state) => {
          const stateName = (state?.name || "").toLowerCase();
          const normalizedStateName = normalizeSearchValue(stateName);
          const stateMatches = exactMatch
            ? normalizedStateName === normalizedTerm
            : normalizedStateName.includes(normalizedTerm);

          if (stateMatches) {
            return state; // keep all cities when state matches
          }

          const filteredCities = (state.cities || []).filter((city) => {
            const cityName = (city?.name || "").toLowerCase();
            const normalizedCityName = normalizeSearchValue(cityName);
            return exactMatch
              ? normalizedCityName === normalizedTerm
              : normalizedCityName.includes(normalizedTerm);
          });

          if (filteredCities.length > 0) {
            return { ...state, cities: filteredCities };
          }

          return null;
        })
        .filter(Boolean);

      // include country if it has matching states/cities
      if (filteredStates.length > 0) {
        return { ...country, states: filteredStates };
      }

      return null;
    })
    .filter(Boolean);

  // Place this near the top of your component, before any useEffect
  const buildLocationPayload = (items) => {
    const map = {};

    items.forEach((item) => {
      const countryId = item.country_id;

      if (!map[countryId]) {
        map[countryId] = {
          country_id: countryId,
          selectAll: false,
          states: [],
          cities: [],
        };
      }

      if (item.type === "country") {
        map[countryId].selectAll = true;
        map[countryId].states = [];
        map[countryId].cities = [];
        return;
      }

      if (item.type === "state") {
        if (!map[countryId].states.includes(item.state_id)) {
          map[countryId].states.push(item.state_id);
        }
      }

      if (item.type === "city") {
        if (!map[countryId].cities.includes(item.city_id)) {
          map[countryId].cities.push(item.city_id);
        }

        if (item.state_id && !map[countryId].states.includes(item.state_id)) {
          map[countryId].states.push(item.state_id);
        }
      }
    });

    return Object.values(map);
  };

  useEffect(() => {
    const payload = buildLocationPayload(selectedCountryItems);
    console.log("🚀 FINAL LOCATION PAYLOAD:", payload);
  }, [selectedCountryItems]);

  const renderLocationTable = () => {
    const updateSelection = (selectedplace, checked) => {
      console.log("parms", selectedplace, checked);
      if (checked == false) {
        setCountries((prevcountries) => {
          console.log("insideloop", prevcountries);
          return prevcountries.map((country) => {
            if (country.id != selectedplace.id) {
              return country;
            }
            return {
              ...country,
              flag: true,
              states: country.states?.map((state) => ({
                ...state,
                flag: true,
                cities: state.cities?.map((city) => ({
                  ...city,
                  flag: true,
                })),
              })),
            };
          });
        });
      } else {
        setCountries((prevcountries) => {
          console.log("insideloop", prevcountries);
          return prevcountries.map((country) => {
            if (country.id != selectedplace.id) {
              return country;
            }
            return {
              ...country,
              flag: true,
              states: country.states?.map((state) => ({
                ...state,
                flag: true,
                cities: state.cities?.map((city) => ({
                  ...city,
                  flag: true,
                })),
              })),
            };
          });
        });
      }
      console.log(countries);
    };

    const onCountryChange = (country, checked) => {
      console.log("=======================================");
      console.log("🌍 COUNTRY CLICKED:", country.name);
      console.log("👉 Checked:", checked);

      setSelected((prev) => {
        const next = new Set(prev);

        console.log("🟡 BEFORE UPDATE:", [...next]);

        if (checked) {
          console.log("✅ ADDING COUNTRY:", country.id);

          next.add(country.id);

          // 🔥 FULL MARKER
          const fullKey = `FULL-${country.id}`;
          console.log("🔥 ADD FULL MARKER:", fullKey);
          next.add(fullKey);

          country.states?.forEach((s) => {
            console.log("   ➕ ADD STATE:", s.id);

            next.add(s.id);
            next.add(`FULL-${s.id}`);

            s.cities?.forEach((c) => {
              console.log("      ➕ ADD CITY:", c.id);
              next.add(c.id);
            });
          });
        } else {
          console.log("❌ REMOVING COUNTRY:", country.id);

          next.delete(country.id);

          const fullKey = `FULL-${country.id}`;
          console.log("🔥 REMOVE FULL MARKER:", fullKey);
          next.delete(fullKey);

          country.states?.forEach((s) => {
            console.log("   ➖ REMOVE STATE:", s.id);

            next.delete(s.id);
            next.delete(`FULL-${s.id}`);

            s.cities?.forEach((c) => {
              console.log("      ➖ REMOVE CITY:", c.id);
              next.delete(c.id);
            });
          });
        }

        console.log("🟢 AFTER UPDATE:", [...next]);

        // 🔥 CALL NORMALIZER
        const normalized = normalizeSelectedItems(next);

        console.log("🎯 NORMALIZED OUTPUT:", normalized);

        setSelectedCountryItems(normalized);

        console.log("=======================================");

        return next;
      });
    };

    const onStateChange = async (country, state, checked) => {
      console.log("State Changed:", country.name, state.name, checked);

      if (checked) {
        await ensureStateCitiesLoaded(country.id, state.id);
      }

      const currentCountries = countriesRef.current || [];
      const freshCountry = currentCountries.find((c) => c.id === country.id);
      const freshState = freshCountry?.states?.find((s) => s.id === state.id);
      const cityIds = (freshState?.cities ?? []).map((c) => c.id);

      setSelected((prev) => {
        const next = new Set(prev);
        const fullCountryKey = `FULL-${country.id}`;
        const fullStateKey = `FULL-${state.id}`;

        // State selection always implies not full-country selection.
        next.delete(country.id);
        next.delete(fullCountryKey);

        if (checked) {
          next.add(state.id);
          next.add(fullStateKey);
          cityIds.forEach((id) => next.add(id));
        } else {
          next.delete(state.id);
          next.delete(fullStateKey);
          cityIds.forEach((id) => next.delete(id));
        }

        setSelectedCountryItems(() => normalizeSelectedItems(next));
        return next;
      });
    };

    const onCityChange = (country, state, cityId, city_name, checked) => {
      console.log(
        "City Changed:",
        country.name,
        state.name,
        city_name,
        checked,
      );
      setSelected((prev) => {
        const next = new Set(prev);

        const fullCountryKey = `FULL-${country.id}`;
        const fullStateKey = `FULL-${state.id}`;

        // Any city-level change breaks full-country and full-state selection.
        next.delete(country.id);
        next.delete(fullCountryKey);
        next.delete(state.id);
        next.delete(fullStateKey);

        if (checked) next.add(cityId);
        else next.delete(cityId);

        console.log("city", next);

        setSelectedCountryItems(() => normalizeSelectedItems(next));

        return next;
      });
    };



    const normalizeSelectedItems = (nextSelected) => {
      console.log("=======================================");
      console.log("🔥 SELECTED SET:", [...nextSelected]);

      const items = [];

      (countries || []).forEach((country) => {
        console.log("\n🌍 COUNTRY:", country.name);

        const countryStates = country.states ?? [];

        // 🔥 DEBUG: check country id
        console.log("👉 country.id present:", nextSelected.has(country.id));

        // 🔥 DEBUG: check states
        countryStates.forEach((st) => {
          console.log(
            "   👉 state:",
            st.name,
            "selected:",
            nextSelected.has(st.id),
          );

          (st.cities || []).forEach((city) => {
            console.log(
              "      👉 city:",
              city.name,
              "selected:",
              nextSelected.has(city.id),
            );
          });
        });

        // ✅ USE FULL MARKER ONLY (FIXED)
        const countryFullySelected = nextSelected.has(`FULL-${country.id}`);

        console.log("👉 countryFullySelected (FIXED):", countryFullySelected);

        const isOnlyCountrySelected =
          nextSelected.has(country.id) &&
          !countryStates.some(
            (st) =>
              nextSelected.has(st.id) ||
              (st.cities ?? []).some((city) => nextSelected.has(city.id)),
          );

        console.log("👉 isOnlyCountrySelected:", isOnlyCountrySelected);

        // ============================
        // ✅ CASE 1: ONLY COUNTRY CLICK
        // ============================
        if (isOnlyCountrySelected) {
          console.log("✅ PUSH → ONLY COUNTRY");

          items.push({
            country: country.name,
            country_id: country.rawId,
            state: "",
            city: "",
            type: "country",
            status: "Targeted",
          });

          return;
        }

        // ============================
        // ✅ CASE 2: FULL COUNTRY (via checkbox)
        // ============================
        if (countryFullySelected) {
          console.log("✅ PUSH → FULL COUNTRY");

          items.push({
            country: country.name,
            country_id: country.rawId,
            state: "",
            city: "",
            type: "country",
            status: "Targeted",
          });

          return;
        }

        let hasStateOrCity = false;

        // ============================
        // ✅ STATES / CITIES
        // ============================
        countryStates.forEach((state) => {
          const stateCities = state.cities ?? [];
          const stateSelected = nextSelected.has(state.id);

          const stateAllCitiesSelected =
            stateCities.length > 0 &&
            stateCities.every((city) => nextSelected.has(city.id));

          console.log(
            "👉 Checking State:",
            state.name,
            "| selected:",
            stateSelected,
            "| allCities:",
            stateAllCitiesSelected,
          );

          // ✅ FULL STATE
          if (stateSelected) {
            console.log("✅ PUSH → STATE:", state.name);

            hasStateOrCity = true;

            items.push({
              country: country.name,
              state: state.name,
              state_id: state.rawId,
              country_id: country.rawId,
              city: "",
              type: "state",
              status: "Targeted",
            });

            return;
          }

          // ✅ CITIES
          stateCities.forEach((city) => {
            if (nextSelected.has(city.id)) {
              console.log("✅ PUSH → CITY:", city.name);

              hasStateOrCity = true;

              items.push({
                country: country.name,
                state: state.name,
                city: city.name,
                city_id: city.rawId,
                state_id: state.rawId,
                country_id: country.rawId,
                type: "city",
                status: "Targeted",
              });
            }
          });
        });

        // ============================
        // ✅ FALLBACK COUNTRY
        // ============================
        if (nextSelected.has(country.id) && !hasStateOrCity) {
          console.log("⚠️ FALLBACK → COUNTRY");

          items.push({
            country: country.name,
            country_id: country.rawId,
            state: "",
            city: "",
            type: "country",
            status: "Targeted",
          });
        }
      });

      console.log("=======================================");
      console.log("🎯 FINAL ITEMS:", items);
      console.log("=======================================");

      return items;
    };

    return (
      <>
        {filteredCountries?.map((country) => (
          <React.Fragment key={country.id}>
            {/* COUNTRY */}
            <tr
              className={`location-table-row cursor-pointer ${
                activeRowId === country.id ? "bg-green-100  text-light" : ""
              }`}
              onClick={() => setActiveRowId(country.id)}
            >
              <td className="location-arrow-cell ">
                <span
                  className="location-arrow ms-2"
                  onClick={async () => {
                    const willOpen = !openCountries.has(country.id);
                    setOpenCountries((p) => {
                      const next = new Set(p);
                      if (next.has(country.id)) next.delete(country.id);
                      else next.add(country.id);
                      return next;
                    });
                    if (willOpen) {
                      await ensureCountryStatesLoaded(country.id);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {openCountries.has(country.id) ? (
                    <FaCaretDown size={16} color="#a0a0a0" />
                  ) : (
                    <FaCaretRight size={16} color="#a0a0a0" />
                  )}
                </span>

                <Input
                  type="checkbox"
                  className="location-checkbox ms-3"
                  innerRef={(el) => {
                    if (el) {
                      countryCheckboxRefs.current.set(country.id, el);
                    } else {
                      countryCheckboxRefs.current.delete(country.id);
                    }
                  }}
                  checked={selected.has(country.id)}
                  onChange={(e) => onCountryChange(country, e.target.checked)}
                />

                <span
                  className={`location-name ms-3 ${activeRowId === country.id ? " text-light" : ""}`}
                >
                  {country.name}
                </span>
              </td>

              <td className="location-type-cell">
                <span
                  className={`location-type ${activeRowId === country.id ? " text-light" : ""}`}
                >
                  Country
                </span>
              </td>
            </tr>

            {/* STATES */}
            {openCountries.has(country.id) &&
              (loadingStatesForCountries.has(country.id) ? (
                <tr>
                  <td className="ps-5 py-2" colSpan={2}>
                    <Spinner size="sm" /> Loading regions...
                  </td>
                </tr>
              ) : null)}
            {openCountries.has(country.id) &&
              country.states.map((state) => (
                <React.Fragment key={state.id}>
                  <tr
                    className={`location-table-row cursor-pointer ${
                      activeRowId === `state-${state.id}`
                        ? " bg-green-100 text-light"
                        : ""
                    }`}
                    onClick={() => setActiveRowId(`state-${state.id}`)}
                  >
                    <td className="location-arrow-cell ps-3 ">
                      <span
                        className="location-arrow ms-2"
                        onClick={async () => {
                          const willOpen = !openStates.has(state.id);
                          setOpenStates((p) => {
                            const next = new Set(p);
                            if (next.has(state.id)) next.delete(state.id);
                            else next.add(state.id);
                            return next;
                          });
                          if (willOpen) {
                            await ensureStateCitiesLoaded(country.id, state.id);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {openStates.has(state.id) ? (
                          <FaCaretDown size={16} color="#a0a0a0" />
                        ) : (
                          <FaCaretRight size={16} color="#a0a0a0" />
                        )}
                      </span>

                      <Input
                        type="checkbox"
                        className="location-checkbox ms-3"
                        innerRef={(el) => {
                          if (el) stateCheckboxRefs.current.set(state.id, el);
                          else stateCheckboxRefs.current.delete(state.id);
                        }}
                        checked={selected.has(state.id)}
                        onChange={(e) =>
                          onStateChange(country, state, e.target.checked)
                        }
                      />

                      <span
                        className={`location-name ms-3 ${activeRowId === `state-${state.id}` ? "  text-light" : ""}`}
                      >
                        {state.name}
                      </span>
                    </td>

                    <td className="location-type-cell">
                      <span
                        className={`location-type ${activeRowId === `state-${state.id}` ? " text-light" : ""}`}
                      >
                        Primary Region
                      </span>
                    </td>
                  </tr>

                  {/* CITIES */}
                  {openStates.has(state.id) &&
                    (loadingCitiesForStates.has(state.id) ? (
                      <tr>
                        <td className="ps-5 py-2" colSpan={2}>
                          <Spinner size="sm" /> Loading cities...
                        </td>
                      </tr>
                    ) : null)}
                  {openStates.has(state.id) &&
                    state.cities.map((city) => (
                      <tr
                        key={city.id}
                        className={`location-table-row cursor-pointer ${
                          activeRowId === `city-${city.id}`
                            ? "bg-green-100  text-light"
                            : ""
                        }`}
                        onClick={() => setActiveRowId(`city-${city.id}`)}
                      >
                        <td className="location-arrow-cell ps-5 ">
                          <Input
                            type="checkbox"
                            className="location-checkbox ms-3"
                            checked={selected.has(city.id)}
                            onChange={(e) =>
                              onCityChange(
                                country,
                                state,
                                city.id,
                                city.name,
                                e.target.checked,
                              )
                            }
                          />
                          <span
                            className={`location-name ms-3 ${activeRowId === `city-${city.id}` ? " text-light" : ""}`}
                          >
                            {city.name}
                          </span>
                        </td>

                        <td className="location-type-cell">
                          <span
                            className={`location-type ${activeRowId === `city-${city.id}` ? " text-light" : ""}`}
                          >
                            City
                          </span>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div>
      <div className="step-scroll">
        <Row
          id="location-section-geographic"
          className="pl-md-1 align-items-start mb-3 mt-3 ms-3"
        >
          <Col md="4" sm="12" className="mb-3">
            <Label className="mb-2 font location-side-heading d-block">
              Geographic
            </Label>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Button
                type="button"
                className="me-2"
                id="select-location"
                onClick={() => handlelocationpopup()}
              >
                Select Locations
              </Button>

              <Button type="button" id="select-location">
                Select Geopolitical Targets
              </Button>
            </div>
          </Col>

          <Col md="4" sm="12" className="mb-3">
            <Label className="mb-2 location-side-heading d-block">
              DMA Code
            </Label>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Input + attached button */}
              <div
                className="campaign-currency position-relative"
                style={{ maxWidth: "360px", width: "100%" }}
              >
                <input
                  type="text"
                  className="form-control campaign-btn w-100 placeholder-xs"
                  placeholder="Enter code separated by commas"
                  style={{ paddingRight: "85px" }}
                />
                <span
                  className="usd"
                  role="button"
                  style={{
                    pointerEvents: "auto",
                    cursor: "pointer",
                  }}
                >
                  Lookup...
                </span>
              </div>

              {/* Action buttons */}
              <button className="dmacode_button" type="button">
                + Add Code(s)
              </button>

              <button className="dmacode_button" type="button">
                - Exclude code(s)
              </button>
            </div>
          </Col>

          <Col md="4" sm="12" className="mb-3">
            <Label className="mb-2 location-side-heading d-block">
              Zip/Postal Code
            </Label>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Dropdown + Input */}
                <div
                  className="d-flex align-items-center gap-2"
                  style={{ maxWidth: "360px", width: "100%" }}
                >
                  <div
                    id="country-wrapper"
                    className="position-relative"
                    style={{ minWidth: "140px", flexShrink: 0 }}
                  >
                    {/* Input box */}
                    <div
                      className="form-control normalized-input campaign-btn campagineditor w-100 d-flex align-items-center justify-content-between"
                      // onClick={() => {
                      //   setOpenCountry(!openCountry);
                      // }}
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="text-truncate">
                        {selectedCountry || ""}
                      </span>
                      {/* <FaCaretDown
                        className={`custom-select-icon ms-2 ${
                          openCountry ? "open" : ""
                        }`}
                      /> */}
                    </div>

                    {/* Dropdown menu */}
                    {openCountry && (
                      <div
                        className="custom-dropdown-menu biddeript-b"
                        style={{ width: "100%" }}
                      >
                        {countrystatic.map((country, idx) => {
                          const isSelected = selectedCountry === country;

                          return (
                            <div
                              key={idx}
                              className={`custom-dropdown-option ${
                                isSelected ? "selected" : ""
                              }`}
                              onClick={() => {
                                setSelectedCountry(country);
                                setOpenCountry(false);
                              }}
                            >
                              <span className="tick-icon">
                                {isSelected && "✓"}
                              </span>

                              <span>{country}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    className="form-control dmacode_input flex-grow-1"
                    placeholder="Enter code separated by commas"
                    style={{ height: "42px", minWidth: "120px" }}
                  />
                </div>

                {/* Action buttons */}
                <button className="dmacode_button" type="button">
                  + Add Code(s)
                </button>

                <button className="dmacode_button" type="button">
                  - Exclude code(s)
                </button>
              </div>
            </div>
          </Col>
        </Row>

        <Row
          id="location-section-geographic"
          className="pl-md-1 align-items-start mb-3 mt-3 ms-3"
        >
          <Col
            md="3"
            sm="12"
            className="d-flex justify-content-md-start justify-content-start mb-1 mb-md-0 col-max-ls "
          >
            <Label className="mb-0 location-side-heading">
              Selected Locations
            </Label>
          </Col>

          <Col md="5" sm="12" className="d-flex flex-column">
            <div className="d-flex selected_locationrow">
              <Button type="button" className="location-button mb-3">
                Add Set
              </Button>

              <Button type="button" id="lxt_other" className="ms-2">
                Save as New Set
              </Button>

              <button
                type="button"
                className="dmacode_button conversion-track-btn ms-auto"
                onClick={() => handleremovecountries()}
              >
                Remove All
              </button>
            </div>
            <div className="selectedlocation_table_wrapper">
              <table className="selectedlocation_table">
                <thead>
                  <tr className="selectedlocation_box_heading">
                    <th className="col-location ">Location</th>
                    <th className="col-type">Type</th>
                    <th className="col-status">Status</th>
                    <th className="col-action"></th>
                  </tr>
                </thead>

                <tbody className="selectedlocation_table_body ">
                  {isLoading ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5">
                        <div className="pmp-table-loader-container">
                          <i className="fa fa-spinner fa-spin pmp-table-loader-icon"></i>
                          <div
                            className="pmp-table-loader-text"
                            style={{ fontSize: "12px", fontWeight: "600" }}
                          >
                            Retrieving saved locations...
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : selectedCountryItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-5 text-muted"
                        style={{ fontSize: "12px", fontWeight: "600" }}
                      >
                        No locations targeted.
                      </td>
                    </tr>
                  ) : (
                    // selectedcountryitems.map((item, index) => (

                    selectedCountryItems.map((item, index) => (
                      <tr
                        key={index}
                        className={`location_data_row ${activeRowId == index ? "bg-green-100" : ""} ${index % 2 == 0 ? "row_index_even" : "row_index_odd"}`}
                        onClick={() => setActiveRowId(index)}
                      >
                        {item.type == "country" && (
                          <>
                            <td
                              className={`location_data_row_country${activeRowId == index ? " text-light" : ""}`}
                            >
                              {item.country}
                            </td>
                            <td
                              className={`location_data_row_targeted${activeRowId == index ? " text-light" : ""}`}
                            >
                              Country
                            </td>
                            <td
                              className={`location_data_row_country${activeRowId == index ? " text-light" : ""}`}
                            >
                              <LocationStatusDropdown
                                index={index}
                                item={item}
                                isActive={activeRowId == index}
                                onChange={handleStatusChange}
                              />
                            </td>
                            <td
                              className={`selectedlocation_table_body_remove_icon border-0 text-center${activeRowId == index ? " text-light" : ""}`}
                            >
                              <FaTimes
                                className="border fs-6 cursor-pointer"
                                onClick={() => handledeletelocation(item)}
                              />
                            </td>
                          </>
                        )}
                        {item.type == "state" && (
                          <>
                            <td
                              className={`location_data_row_country${activeRowId == index ? " text-light" : ""}`}
                            >
                              {item.state}, {item.country}
                            </td>
                            <td
                              className={`location_data_row_targeted${activeRowId == index ? " text-light" : ""}`}
                            >
                              Primary Region
                            </td>
                            <td
                              className={`location_data_row_country${activeRowId == index ? " text-light" : ""}`}
                            >
                              <LocationStatusDropdown
                                index={index}
                                item={item}
                                isActive={activeRowId == index}
                                onChange={handleStatusChange}
                              />
                            </td>
                            <td
                              className={`selectedlocation_table_body_remove_icon border-0 text-center${activeRowId == index ? " text-light" : ""}`}
                            >
                              <FaTimes
                                className="border fs-6 cursor-pointer"
                                onClick={() => handledeletelocation(item)}
                              />
                            </td>
                          </>
                        )}
                        {item.type == "city" && (
                          <>
                            <td
                              className={`location_data_row_country${activeRowId == index ? " text-light" : ""}`}
                            >
                              {item.city}, {item.state}, {item.country}
                            </td>
                            <td
                              className={`location_data_row_targeted${activeRowId == index ? " text-light" : ""}`}
                            >
                              City
                            </td>
                            <td
                              className={`location_data_row_country${activeRowId == index ? " text-light" : ""}`}
                            >
                              <LocationStatusDropdown
                                index={index}
                                item={item}
                                isActive={activeRowId == index}
                                onChange={handleStatusChange}
                              />
                            </td>
                            <td
                              className={`selectedlocation_table_body_remove_icon border-0 text-center${activeRowId == index ? " text-light" : ""}`}
                            >
                              <FaTimes
                                className="border fs-6 cursor-pointer"
                                onClick={() => handledeletelocation(item)}
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <span className="info_message ">
              Location rules in campaign{" "}
              <span id="count">{selectedCountryItems.length}/15000</span>
              <IoMdInformationCircle
                id="locationInfoIcon"
                size={20}
                className="info-icon"
              />
              <UncontrolledTooltip
                placement="top"
                target="locationInfoIcon"
                className="black-tooltip"
              >
                All location categories (except Hyperlocal) share a common limit
                of 15000 entries. For example, adding 50 DMA codes and 150 Zip
                codes will add 200 entries to the Location Rules total. To
                ensure your campaign runs correctly, the total of your locations
                rules (targeted + excluded) must be within the limit indicated
                under the 'Selected Locations' field.
              </UncontrolledTooltip>
            </span>
          </Col>
        </Row>
        <Row
          id="location-section-geographic"
          className="pl-md-1 align-items-start mb-3 mt-3 ms-3"
        >
          <Col
            md="3"
            sm="12"
            className="d-flex justify-content-md-start justify-content-start mb-1 mb-md-0 col-max-ls "
          >
            <Label className="mb-0 fw-semibold">Hyperlocal</Label>
          </Col>
          <Col md="4" sm="12">
            <div className="d-flex align-items-center gap-4">
              <div className="d-flex align-items-center gap-2">
                <Input
                  type="radio"
                  name="capspec"
                  value="1"
                  checked={Hyperlocal == 1} // ✅ ADD THIS
                  onChange={(e) => sethyperlocal(Number(e.target.value))}
                />
                <span className="text-gray-700 devices">
                  Enter coordinates and addresses
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <Input
                  type="radio"
                  name="capspec"
                  value="0"
                  checked={Hyperlocal == 0} // ✅ ADD THIS
                  onChange={(e) => sethyperlocal(Number(e.target.value))}
                />
                <span className="text-gray-700 devices">Upload from file</span>
              </div>
            </div>
          </Col>
        </Row>

        <Row className="pl-md-1 align-items-start mb-3 mt-2 ms-3">
          <Col
            md="3"
            sm="12"
            className="d-flex justify-content-md-start justify-content-start mb-1 mb-md-0 col-max-ls "
          ></Col>
          <Col
            md="8"
            sm="12"
            className={Hyperlocal == 1 ? "mb-3 mb-md-0" : ""}
            style={{ minWidth: 0 }}
          >
            <div>
              {Hyperlocal == 1 && (
                <div
                  className="d-flex align-items-center mb-2"
                  style={{ minWidth: 0 }}
                >
                  <button
                    className={` font me-2 ${map ? "map_enter_button" : "map_enter_button1"}`}
                    type="button"
                    onClick={() => {
                      setmap(false);
                    }}
                  >
                    Enter
                  </button>
                  <button
                    className={` font ${map ? "map_enter_button1" : "map_enter_button"}`}
                    type="button"
                    onClick={() => {
                      setmap(true);
                    }}
                  >
                    Map
                  </button>

                  <div
                    ref={mapSearchContainerRef}
                    style={{ position: "relative", width: "100%", minWidth: 0 }}
                    className="ms-2 flex-grow-1"
                  >
                    <div
                      className="campaign-currency position-relative"
                      style={{ width: "100%", minWidth: 0 }}
                    >
                      <input
                        type="text"
                        placeholder="Search..."
                        className="form-control campaign-btn w-100 placeholder-xs"
                        style={{ paddingRight: "45px" }}
                        value={mapSearchTerm}
                        onChange={(e) => {
                          setMapSearchTerm(e.target.value);
                          setMapSearchOpen(false);
                          setMapSearchNotice("Click search to run.");
                          setMapSearchResults([]);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitMapSearch();
                          }
                          if (e.key === "Escape") {
                            setMapSearchOpen(false);
                          }
                        }}
                      />
                      <span
                        className="usd"
                        role="button"
                        tabIndex={0}
                        onClick={commitMapSearch}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            commitMapSearch();
                          }
                        }}
                        style={{
                          pointerEvents: "auto",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Search"
                      >
                        <FaSearch size={13} />
                      </span>
                    </div>

                    {mapSearchOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          background: "#fff",
                          border: "1px solid #d4d4d4", 
                          zIndex: 2000,
                          maxHeight: "240px",
                          overflowY: "auto",
                        }}
                      >
                        {normalizeSearchValue(mapSearchQuery).length < 3 ? (
                          <div
                            style={{ padding: "3px 14px", fontSize: "12px" }}
                          >
                            {mapSearchNotice || "Type at least 3 characters."}
                          </div>
                        ) : mapSearchResults.length === 0 ? (
                          <div
                            style={{ padding: "3px 14px", fontSize: "12px" }}
                          >
                            {mapSearchIsLoading
                              ? mapSearchNotice || "Loading..."
                              : "No results"}
                          </div>
                        ) : (
                          mapSearchResults.map((item) => (
                            <div
                              key={`${item.kind}-${item.rawId ?? item.label}`}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleMapSearchSelect(item)}
                              style={{
                                padding: "3px 14px",
                                cursor: "pointer",
                                borderBottom: "1px solid #f0f0f0",
                              }}
                            >
                              <div style={{ fontSize: "12px" }}>
                                {item.label}
                              </div>
                              {(item.subtitle || item.kind) && (
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#666",
                                    marginTop: "2px",
                                  }}
                                >
                                  {item.subtitle || item.kind}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* //map */}
              {/* {enter} */}
              {!map && Hyperlocal == 1 && (
                <ul className="compact-list mt-2">
                  <li>Separate each coordinate value with a space</li>
                  <li>Enter each coordinate or address on a new row</li>
                  <li>For coordinates, add an optional radius for each row</li>
                </ul>
              )}

              {Hyperlocal == 0 && (
                <ul className="compact-list mt-2">
                  <li>Separate each coordinate value with a space</li>
                  <li>Enter each coordinate or address on a new row</li>
                  <li>For coordinates, add an optional radius for each row</li>
                </ul>
              )}

              {!map && (
                <div className="address-text">
                  41.8781 -87.6298
                  <br />
                  43.6519 -79.4095 1.00
                  <br />
                  {Hyperlocal == 1 && (
                    <>11 E Madison Street Chicago, IL 60602</>
                  )}
                </div>
              )}
              {!map ||
                (Hyperlocal == 0 && (
                  <div className="address-text">
                    41.8781 -87.6298
                    <br />
                    43.6519 -79.4095 1.00
                    <br />
                    {Hyperlocal == 1 && (
                      <>11 E Madison Street Chicago, IL 60602</>
                    )}
                  </div>
                ))}

              {Hyperlocal == 1 && !map && (
                <>
                  <textarea
                    className="location_addressbox"
                    placeholder="Enter..."
                  ></textarea>
                  <div className="mt-5 ">
                    <button className="me-2 map_enter_button">Target</button>
                    <button className="map_enter_button_target text-center">
                      Exclude
                    </button>
                  </div>
                </>
              )}
              {Hyperlocal == 1 && map && (
                <>
                  <GeoEditor
                    geo={mapGeo} // ✅ IMPORTANT
                    points={mapdata}
                    focusPoint={focusPoint}
                    callback={handlecheck}
                    setZoom={setZoom}
                    zoom={zoom}
                    center={center}
                    setCenter={setCenter}
                    handlegeoPoints={handlegeoPoints}
                  />
                </>
              )}

              {Hyperlocal == 0 && (
                <div className="d-flex radius_div">
                  <Label className="radius_label ">Radius Units</Label>
                  <div id="country-wrapper" className="position-relative">
                    {/* Input box */}
                    <div
                      className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center biddeript-a Postal_Code_selection"
                      onClick={() => {
                        setopenradius(!openradius);
                      }}
                      tabIndex={0}
                    >
                      {selectedradius || "Select Radius"}
                      <FaCaretDown
                        className={`custom-select-icon ${
                          openradius ? "open" : ""
                        }`}
                      />
                    </div>

                    {/* Dropdown menu */}
                    {openradius && (
                      <div className="custom-dropdown-menu biddeript-b">
                        {radiusstatic.map((country, idx) => {
                          const isSelected = selectedradius === country;

                          return (
                            <div
                              key={idx}
                              className={`custom-dropdown-option ${
                                isSelected ? "selected" : ""
                              }`}
                              onClick={() => {
                                setselectedradius(country);
                                setopenradius(false);
                              }}
                            >
                              <span className="tick-icon">
                                {isSelected && "✓"}
                              </span>

                              <span>{country}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {Hyperlocal == 0 && (
                <>
                  <div
                    className="campaign-currency position-relative mt-3"
                    style={{ maxWidth: "360px", width: "100%" }}
                  >
                    <input
                      type="file"
                      id="fileUpload"
                      accept=".csv"
                      className="d-none"
                      onChange={(e) => {
                        const file = e.target.files[0];

                        if (!file) return;

                        setFileError("");

                        if (!file.name.toLowerCase().endsWith(".csv")) {
                          setFileError("Please upload only CSV files.");
                          setFileName("");
                          e.target.value = "";
                          return;
                        }

                        const reader = new FileReader();

                        reader.onload = (event) => {
                          const csvText = event.target.result || "";

                          const rows = csvText
                            .split(/\r?\n/)
                            .filter((row) => row.trim() !== "");

                          if (rows.length === 0) {
                            setFileError("CSV file is empty.");
                            setFileName("");
                            e.target.value = "";
                            return;
                          }

                          // Check if first row is a header row
                          let startIndex = 0;
                          if (rows.length > 0) {
                            const firstCols = rows[0].split(",");
                            if (firstCols.length >= 2) {
                              const col0 = firstCols[0].trim().toLowerCase();
                              const col1 = firstCols[1].trim().toLowerCase();
                              if (
                                col0.includes("lat") ||
                                col1.includes("lon") ||
                                col1.includes("lng") ||
                                isNaN(Number(col0)) ||
                                isNaN(Number(col1))
                              ) {
                                startIndex = 1;
                              }
                            }
                          }

                          const dataRowsCount = rows.length - startIndex;
                          if (dataRowsCount <= 0) {
                            setFileError("CSV file contains no data rows.");
                            setFileName("");
                            e.target.value = "";
                            return;
                          }

                          if (dataRowsCount > 100) {
                            setFileError(
                              "CSV file can contain a maximum of 100 rows.",
                            );
                            setFileName("");
                            e.target.value = "";
                            return;
                          }

                          const parsedPoints = [];

                          // Validate latitude and longitude
                          for (let i = startIndex; i < rows.length; i++) {
                            const cols = rows[i].split(",");

                            if (cols.length < 2 || cols.length > 3) {
                              setFileError(
                                `Invalid format at row ${i + 1}. Each row must contain Latitude, Longitude, and optionally Radius.`,
                              );
                              setFileName("");
                              e.target.value = "";
                              return;
                            }

                            const lat = Number(cols[0].trim());
                            const lng = Number(cols[1].trim());
                            const radius = cols.length === 3 ? Number(cols[2].trim()) : 0;

                            if (Number.isNaN(lat)) {
                              setFileError(`Invalid latitude at row ${i + 1}.`);
                              setFileName("");
                              e.target.value = "";
                              return;
                            }

                            if (Number.isNaN(lng)) {
                              setFileError(
                                `Invalid longitude at row ${i + 1}.`,
                              );
                              setFileName("");
                              e.target.value = "";
                              return;
                            }

                            if (lat < -90 || lat > 90) {
                              setFileError(
                                `Latitude must be between -90 and 90 at row ${i + 1}.`,
                              );
                              setFileName("");
                              e.target.value = "";
                              return;
                            }

                            if (lng < -180 || lng > 180) {
                              setFileError(
                                `Longitude must be between -180 and 180 at row ${i + 1}.`,
                              );
                              setFileName("");
                              e.target.value = "";
                              return;
                            }

                            if (cols.length === 3 && (Number.isNaN(radius) || radius < 0)) {
                              setFileError(
                                `Invalid radius at row ${i + 1}.`,
                              );
                              setFileName("");
                              e.target.value = "";
                              return;
                            }

                            parsedPoints.push({
                              id: `point-${Date.now()}-${i}-${Math.random()}`,
                              lat: lat,
                              lon: lng,
                              range: radius,
                              address: "-",
                              target: "Target"
                            });
                          }

                          // Success
                          setFileError("");
                          setFileName(file.name);
                          const normalized = normalizeGeoPoints(parsedPoints);
                          setmapdata(normalized);
                          setGeoPoints(normalized);
                        };

                        reader.readAsText(file);
                      }}
                    />

                    <input
                      type="text"
                      className="form-control campaign-btn w-100 placeholder-xs"
                      placeholder="Upload a CSV or TXT file"
                      value={fileName}
                      readOnly
                      style={{ paddingRight: "100px", cursor: "pointer" }}
                      onClick={() =>
                        document.getElementById("fileUpload").click()
                      }
                    />
                    <span
                      className="usd"
                      role="button"
                      style={{
                        pointerEvents: "auto",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        document.getElementById("fileUpload").click()
                      }
                    >
                      Select File
                    </span>
                  </div>
                  {/* <span className="location_bottom_notes">
                    Your file will be uploaded when you save the campaign.
                  </span> */}

                  {fileError && (
                    <div
                      style={{
                        color: "#dc3545",
                        fontSize: "12px",
                        marginTop: "4px",
                      }}
                    >
                      {fileError}
                    </div>
                  )}
                </>
              )}
              {Hyperlocal == 0 && (
                <>
                  <div className="selectedlocation_table_wrapper mt-5">
                    <table className="selectedlocation_table">
                      <thead>
                        <tr className="selectedlocation_box_heading">
                          <th>Latitude</th>
                          <th>Longitude</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody className="selectedlocation_table_body ">
                        {mapdata.length === 0 ? (
                          <tr>
                            <td
                              colSpan="3"
                              className="text-center py-5 text-muted"
                              style={{ fontSize: "12px", fontWeight: "600" }}
                            >
                              No coordinates uploaded.
                            </td>
                          </tr>
                        ) : (
                          mapdata.map((item, index) => (
                            <tr
                              key={item.id || index}
                              className={`location_data_row ${index % 2 == 0 ? "row_index_even" : "row_index_odd"}`}
                            >
                              <td className="location_data_row_country">{item.lat}</td>
                              <td className="location_data_row_country">{item.lon}</td>
                              <td className="selectedlocation_table_body_remove_icon border-0 text-center">
                                <FaTimes
                                  className="border fs-6 cursor-pointer"
                                  onClick={() => {
                                    setmapdata((prev) => {
                                      const next = prev.filter((_, idx) => idx !== index);
                                      setGeoPoints(next);
                                      return next;
                                    });
                                  }}
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <span className="location_bottom_notes">
                    Add latitude and longitude locations here.
                  </span>
                </>
              )}
            </div>
          </Col>
        </Row>
        {Hyperlocal == 1 && (
          <Row className="pl-md-1 align-items-start mb-3 mt-2 ms-3">
            <Col
              md="3"
              sm="12"
              className="d-flex justify-content-md-start justify-content-start mb-1 mb-md-0 col-max-ls "
            ></Col>
            <Col md="8" sm="12" style={{ minWidth: 0 }}>
              <div>
                <p className="selected_codinates">Selected Coordinates</p>
                {/* <div className="d-flex align-items-center gap-2 me-5 radius_units_div mb-3">
                  <p id="radius_units " className="mt-3 radius_units">
                    Radius Units
                  </p>

                  <div className="position-relative mt-2">
                    <select
                      value={selectedradius}
                      onChange={(e) => setselectedradius(e.target.value)}
                      className="form-control py-1 px-1 "
                      style={{
                        height: "42px",
                        fontSize: "11px",
                        width: "140px",
                      }}
                    >
                      <option value="Kilometers">Kilometers</option>
                      <option value="Meters">Meters</option>
                      <option value="Miles">Miles</option>
                      <option value="Feet">Feet</option>
                    </select>
                    <FaCaretDown className="custom-select-icon" />
                  </div>
                  <button
                    className=" map_enter_button2 mt-2 ms-auto
                "
                    style={{
                      height: "42px",
                    }}
                  >
                    Bulk Edit
                  </button>
                </div> */}
                <div
                  style={{
                    width: "100%",
                    borderBottom: "",
                    overflowX: "auto",
                  }}
                  className="border"
                >
                  <DataTable
                    key={selectedradius} // 🔥 forces refresh
                    columns={tableColumns}
                    data={Array.isArray(mapdata) ? mapdata : []}
                    highlightOnHover
                    striped
                    responsive
                    customStyles={customStyles}
                    fixedHeaderScrollHeight="200px"
                    fixedHeader
                    persistTableHead
                    noDataComponent={
                      <div
                        className="py-5 text-center text-muted"
                        style={{ fontSize: "12px", fontWeight: "600" }}
                      >
                        No data available
                      </div>
                    }
                  />
                </div>
              </div>
            </Col>
          </Row>
        )}
      </div>

      {open && (
        <div className="location-modal-overlay">
          <div className="location-modal-box">
            {/* Header */}
            <div className="location-modal-header">
              <span className="location-modal-header-heading1">
                Select Locations
              </span>
              <span className="location-count">
                Location rules in campaign:{" "}
                <span className="location_header_count">
                  {selectedCountryItems.length}/15000
                </span>
              </span>
            </div>

            {/* Search */}
            <div className="location-search-row">
              <Input
                type="text"
                className="location-search-input"
                placeholder="Search by typing at least 3 characters..."
                value={locationSearchTerm}
                onChange={(e) => setLocationSearchTerm(e.target.value)}
              />
              <label className="location-exact-match">
                <Input
                  type="checkbox"
                  className="location-exact-match-input"
                  checked={exactMatch}
                  onChange={(e) => setExactMatch(e.target.checked)}
                />{" "}
                Exact matches only
              </label>
            </div>

            {/* Body */}
            <div className="location-modal-body  border ">
              {loading ? (
                <div className="location-loader-container">
                  <div className="location-loader"></div>
                  <p className="location-loader-text">Loading locations...</p>
                </div>
              ) : filteredCountries.length === 0 ? (
                <div className="location-loader-container">
                  <p className="location-loader-text">
                    {countries.length === 0
                      ? "No locations available right now."
                      : "No locations match your search."}
                  </p>
                </div>
              ) : (
                <table className="location-table w-100">
                  <tbody className="border border-0">
                    {renderLocationTable()}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="location-modal-footer">
              <button
                className="location-ok-btn"
                onClick={() => setOpen(!open)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Location;
