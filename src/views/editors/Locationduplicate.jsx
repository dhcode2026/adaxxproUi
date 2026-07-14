import React, { useEffect, useRef, useState } from "react";
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
import { getcountry } from "../api/Api";

var undef;


const Location = (props) => {
  const [openCountry, setOpenCountry] = useState(false);
  const [activeRowId, setActiveRowId] = useState(null);

  const [openradius, setopenradius] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedradius, setselectedradius] = useState("");
  const [Hyperlocal, sethyperlocal] = useState(1);
  const [fileName, setFileName] = useState("");
  const [openCountries, setOpenCountries] = useState(new Set());
  const [openStates, setOpenStates] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [map, setmap] = useState();
  const [geo, setGeo] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState([44.414165, 8.942184]);
  const [mapdata, setmapdata] = useState([])
  let mapeddata = []

  const TargetDropdown = ({ row }) => {
    const [selected, setSelected] = useState(row.target || "Target");
    const [open, setOpen] = useState(false);

    const options = ["Target", "Exclude"];



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
            alignItems: "center"
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
              top: "38px",
              left: 0,
              width: "100%",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              zIndex: 999
            }}
          >
            {options.map((option) => (
              <div
                key={option}
                onClick={() => {
                  setSelected(option);
                  setOpen(false);
                }}
                style={{
                  padding: "8px 10px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background:
                    selected === option ? "#007bff" : "transparent",
                  color: selected === option ? "#fff" : "#333"
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



  const handlecheck = () => {
    console.log("setstate");

  }

  const columns = [
    {
      name: (
        <Input type="checkbox" />
      ),
      cell: () => <Input type="checkbox" />,
      width: "70px",
    },
    {
      name: "Address",
      selector: row => row?.address || "-",
      sortable: true,
    },
    {
      name: "Latitude",
      selector: row => row?.lat,
      sortable: true,
    },
    {
      name: "Longitude",
      selector: row => row?.lon,
      sortable: true,
    },
    {
      name: "Radius",
      selector: row => "1km",
      sortable: true,
    },
    {
      name: "Target",
      cell: (row) => <TargetDropdown row={row} />,
      sortable: false,
    },
    {
      name: "",
      selector: (row) => <span>

        <FaMapMarkerAlt /> <IoMdClose onClick={(e) => {
          console.log(row.id)

          setmapdata((prev) => {
            console.log(prev.id)
            return (prev.filter((item) => item.id != row.id)
            )
          })
        }} />
      </span>


    },
  ];

  const customStyles = {
    table: {
      style: {


      },
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

        '&:hover': {
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
        '&:hover': {
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


  useEffect(() => {
    if (props.campaign?.geo !== undef && props?.campaign?.geo?.length !== 0 && props.campaign?.geo[0] !== 0) {
      setGeo(props?.campaign?.geo);
      setZoom(8);
      setCenter([props?.campaign?.geo[0], props?.campaign?.geo[1]]);
    } else {
      setGeo([]);
      setZoom(1);
      setCenter([44.414165, 8.942184]);
    }
    handlelocationdatapi()

  }, []);

  const handlelocationdatapi = async () => {
    try {
      let res = await getcountry();
      const apiData = res.data?.data?.informationCountries || [];
      console.log(apiData);

      const mappedCountries = apiData.map(country => ({
        id: "country-" + country.countryId,
        rawId: country.countryId,
        name: country.name,
        type: country.type || "country",
        flag: country.flag || false,
        selectAllState:country.selectAllState,
        sselectAllCity:country.selectAllCity,
        states: (country.primaryRegion || []).map(state => ({
          id: "state-" + state.primaryRegionId,
          rawId: state.primaryRegionId,
          name: state.name,
          type: state.type || "primary Region",
          flag: state.flag || false,
          excluded:state.excluded,
          cities: (state.cityList || []).map(city => ({
            id: "city-" + city.cityId,
            rawId: city.cityId,
            name: city.name,
            type: city.type || "City",
            flag: city.flag || false,
            excluded:city.excluded,
          }))
        }))
      }));
      setCountries(mappedCountries);
      console.log("mappedCountries", mappedCountries);
    } catch (err) {
      console.error("Error formatting location payload:", err);
    }
  }

  const handlegeoPoints = (data) => {
    console.log("location data =", data);

    const newPoints = data.map((item) => {
      return {
        id: Date.now() + Math.random(), // avoid duplicate ids
        lat: Number((item.lat)).toFixed(4) || 0,
        lon: Number(item.lon).toFixed(4) || 0,
        range: Number(item.range) || 0,
        address: item.address || "-",
        target: item.target || `Target`
      };
    });


    setmapdata(newPoints);
    mapeddata = newPoints;
    console.log(mapeddata)

    return newPoints;
  };


  const [selectedcountryitem, setSelectedCountryitem] = useState([]);
  const [seletedstate, setselectedstate] = useState([]);

  const selectedRef = useRef(selected);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countrystatic, setcountrystatic] = useState([
    "Brazil",
    "India",
    "USA",
  ]);
  const [radiusstatic, setradiustatic] = useState([
    "Kilometers",
    "Meter",
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
      }))
    );
    console.log("countries",countries)
  }, [selected]);

  const handledeletelocation = (item) => {
    console.log("Deleting location:", item);

    // Remove from table
    setSelectedCountryitem((prev) =>
      prev.filter(
        (p) =>
          !(
            p.country === item.country &&
            p.state === (item.state || "") &&
            p.city === (item.city || "") &&
            p.type === item.type
          )
      )
    );

    // Update selection based on item type
    setSelected((prev) => {
      const next = new Set(prev);
      const countryData = countries.find((c) => c.id === item.country_id);

      if (!countryData) return next;

      if (item.type === "country") {
        // Remove country and all its states and cities
        next.delete(item.country_id);
        countryData.states?.forEach((state) => {
          next.delete(state.id);
          state.cities?.forEach((city) => {
            next.delete(city.id);
          });
        });
      } else if (item.type === "state") {
        // Remove state and its cities
        const stateData = countryData.states?.find((s) => s.id === item.state_id);
        if (stateData) {
          next.delete(item.state_id);
          stateData.cities?.forEach((city) => {
            next.delete(city.id);
          });

          // Check if country still has any selected states
          const anyStateSelected = countryData.states?.some((st) =>
            next.has(st.id)
          );
          if (!anyStateSelected) {
            next.delete(item.country_id);
          }
        }
      } else if (item.type === "city") {
        // Remove just this city
        next.delete(item.city_id);

        // Check if state still has cities
        const stateData = countryData.states?.find((s) => s.id === item.state_id);
        if (stateData) {
          const anyCitySelected = stateData.cities?.some((city) =>
            next.has(city.id)
          );
          if (!anyCitySelected) {
            next.delete(item.state_id);

            // Check if country still has any selected states with cities
            const anyStateSelected = countryData.states?.some((st) =>
              st.cities?.some((city) => next.has(city.id))
            );
            if (!anyStateSelected) {
              next.delete(item.country_id);
            }
          }
        }
      }

      return next;
    });

    // Update country flags
    setCountries((prevCountries) =>
      prevCountries.map((country) => {
        if (country.id !== item.country_id) return country;

        return {
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
        };
      })
    );
  };

  const handlelocationpopup = () => {
    setOpen((prev) => !prev);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };



  function handleremovecountries() {
    setSelectedCountryitem([]);
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
      }))
    );
  }

  const [countries, setCountries] = useState([

  ]);

  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [exactMatch, setExactMatch] = useState(false);

  const filteredCountries = countries?.map((country) => {
    // filter states
    const filteredStates = country.states
      ?.map((state) => {
        const term = (locationSearchTerm || "").toLowerCase();

        const filteredCities = (state.cities || []).filter((city) => {
          if (term.length < 3) return true;

          const cityName = (city?.name || "").toLowerCase();

          return exactMatch
            ? cityName === term
            : cityName.includes(term);
        });

        if (filteredCities.length > 0) {
          return { ...state, cities: filteredCities };
        }
        return null;
      })
      ?.filter(Boolean);

    // include country if it has matching states/cities
    if (filteredStates?.length > 0) {
      return { ...country, states: filteredStates };
    }

    // or country matches search
    const countryTerm = locationSearchTerm.toLowerCase();
    if (locationSearchTerm.length >= 3) {
      if (
        exactMatch
          ? country.name.toLowerCase() === countryTerm
          : country.name.toLowerCase().includes(countryTerm)
      ) {
        return { ...country, states: [] };
      }
    } else {
      return country; // show all if search term < 3
    }

    return null;
  }).filter(Boolean);

  const LocationTable = () => {
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

    /* ---------- handlers ---------- */
    const onCountryChange = (country, checked) => {
      console.log("Country Changed:", country, checked);
      // compute next selection deterministically, then normalize items
      setSelected((prev) => {
        const next = new Set(prev);
        const stateIds = country?.states.map((s) => s.id) || [];
        const cityIds = country?.states.flatMap((s) => s.cities.map((c) => c.id)) || [];

        if (checked) {
          next.add(country.id);
          stateIds.forEach((id) => next.add(id));
          cityIds.forEach((id) => next.add(id));
        } else {
          next.delete(country.id);
          stateIds.forEach((id) => next.delete(id));
          cityIds.forEach((id) => next.delete(id));
        }

        // normalize selected country items based on the new set
        console.log("country", next);
        setSelectedCountryitem(() => normalizeSelectedItems(next));

        return next;
      });
    };

    const onStateChange = (country, state, checked) => {
      console.log("State Changed:", country.name, state.name, checked);
      setSelected((prev) => {
        const next = new Set(prev);
        const cityIds = (state.cities ?? []).map((c) => c.id);

        if (checked) {
          next.add(state.id);
          cityIds.forEach((id) => next.add(id));
          next.add(country.id);
        } else {
          next.delete(state.id);
          cityIds.forEach((id) => next.delete(id));

          const anyStateSelected = (country.states ?? []).some((st) =>
            next.has(st.id)
          );
          if (!anyStateSelected) next.delete(country.id);
        }
        console.log("state", next);

        setSelectedCountryitem(() => normalizeSelectedItems(next));

        return next;
      });
    };

    const onCityChange = (country, state, cityId, city_name, checked) => {
      console.log("City Changed:", country.name, state.name, city_name, checked);
      setSelected((prev) => {
        const next = new Set(prev);

        if (checked) {
          next.add(cityId);
          next.add(state.id);
          next.add(country.id);
        } else {
          next.delete(cityId);

          const anyCitySelected = (state.cities ?? []).some((city) =>
            next.has(city.id)
          );

          if (!anyCitySelected) next.delete(state.id);

          const anyStateSelected = (country.states ?? []).some((st) =>
            (st.cities ?? []).some((city) => next.has(city.id))
          );

          if (!anyStateSelected) next.delete(country.id);
        }

        console.log("city", next);


        setSelectedCountryitem(() => normalizeSelectedItems(next));

        return next;
      });
    };

    // helper: build normalized selected items array from a Set of selected ids
    const normalizeSelectedItems = (nextSelected) => {
      const items = [];

      (countries || []).forEach((country) => {
        const countryStates = country.states ?? [];

        // helper flags
        const allStatesSelected = countryStates.length > 0 && countryStates.every((st) => nextSelected.has(st.id));
        const allCitiesIds = countryStates.flatMap((st) => st.cities.map((c) => c.id));
        const allCitiesSelected = allCitiesIds.length > 0 ? allCitiesIds.every((id) => nextSelected.has(id)) : true;

        const countryFullySelected = nextSelected.has(country.id) && allStatesSelected && allCitiesSelected;

        if (countryFullySelected) {
          items.push({ country: country.name, country_id: country.rawId, state: "", city: "", type: "country", status: "Targeted" });
          return; // skip states/cities
        }

        // If country is selected but not fully, show country as Targeted and list excluded children
        if (nextSelected.has(country.id)) {
          items.push({ country: country.name, country_id: country.rawId, state: "", city: "", type: "country", status: "Targeted" });

          countryStates.forEach((state) => {
            const stateCities = state.cities ?? [];
            const stateSelected = nextSelected.has(state.id);



            if (!stateSelected) {
              // state is excluded under a selected country
              items.push({ country: country.name, state: state.name, state_id: state.rawId, country_id: country.rawId, city: "", type: "state", status: "Excluded" });

            } else {
              items.push({ country: country.name, state: state.name, state_id: state.rawId, country_id: country.rawId, city: "", type: "state", status: "Targeted" });
              // state is selected but some cities may be excluded
              stateCities.forEach((city) => {
                if (!nextSelected.has(city.id)) {
                  items.push({ country: country.name, state: state.name, city: city.name, city_id: city.rawId, state_id: state.rawId, country_id: country.rawId, type: "city", status: "Excluded" });
                }
              });
            }
          });


          return;
        }

        // Country not selected: list targeted states/cities
        countryStates.forEach((state) => {
          const stateCities = state.cities ?? [];
          const stateSelected = nextSelected.has(state.id);
          const stateAllCitiesSelected = stateCities.length > 0 && stateCities.every((c) => nextSelected.has(c.id));

          if (stateSelected && stateAllCitiesSelected) {
            items.push({ country: country.name, state: state.name, state_id: state.rawId, country_id: country.rawId, city: "", type: "state", status: "Targeted" });
          } else if (stateSelected) {
            // state selected but some cities targeted/excluded
            const anyCitySelected = stateCities.some((c) => nextSelected.has(c.id));

            // If state is marked selected but none of its cities are selected, consider state unselected
            if (stateCities.length > 0 && !anyCitySelected) {
              // skip emitting state (it should be considered unselected)
            } else {
              items.push({ country: country.name, state: state.name, state_id: state.rawId, country_id: country.rawId, city: "", type: "state", status: "Targeted" });

              stateCities.forEach((city) => {
                if (nextSelected.has(city.id)) {
                  items.push({ country: country.name, state: state.name, city: city.name, city_id: city.rawId, state_id: state.rawId, country_id: country.rawId, type: "city", status: "Targeted" });
                } else {
                  items.push({ country: country.name, state: state.name, city: city.name, city_id: city.rawId, state_id: state.rawId, country_id: country.rawId, type: "city", status: "Excluded" });
                }
              });
            }
          } else {
            // state not selected: list any targeted cities
            stateCities.forEach((city) => {
              if (nextSelected.has(city.id)) {
                items.push({ country: country.name, state: state.name, city: city.name, city_id: city.rawId, state_id: state.rawId, country_id: country.rawId, type: "city", status: "Targeted" });
              }
            });
          }
        });
      });
      console.log(countries)
      return items;
    };

    return (
      <>


        {filteredCountries?.map((country) => (
          <React.Fragment key={country.id}>
            {/* COUNTRY */}
            <tr
              className={`location-table-row cursor-pointer ${activeRowId === country.id ? "bg-green-100  text-light" : ""
                }`}
              onClick={() => setActiveRowId(country.id)}
            >
              <td className="location-arrow-cell ">
                <span
                  className="location-arrow ms-2"
                  onClick={() =>
                    setOpenCountries((p) =>
                      p.has(country.id)
                        ? new Set([...p].filter((x) => x !== country.id))
                        : new Set(p).add(country.id),
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  {openCountries.has(country.id) ? <FaCaretDown size={16} color="#a0a0a0" /> : <FaCaretRight size={16} color="#a0a0a0" />}
                </span>

                <Input
                  type="checkbox"
                  className="location-checkbox ms-3"
                  checked={selected.has(country.id)}

                  onChange={(e) =>
                    onCountryChange(country, e.target.checked)
                  }
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
              country.states.map((state) => (
                <React.Fragment key={state.id}>
                  <tr
                    className={`location-table-row cursor-pointer ${activeRowId === `state-${state.id}`
                      ? " bg-green-100 text-light"
                      : ""
                      }`}
                    onClick={() => setActiveRowId(`state-${state.id}`)}
                  >
                    <td className="location-arrow-cell ps-3 ">
                      <span
                        className="location-arrow ms-2"
                        onClick={() =>
                          setOpenStates((p) =>
                            p.has(state.id)
                              ? new Set(
                                [...p].filter((x) => x !== state.id),
                              )
                              : new Set(p).add(state.id),
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {openStates.has(state.id) ? <FaCaretDown size={16} color="#a0a0a0" /> : <FaCaretRight size={16} color="#a0a0a0" />}
                      </span>

                      <Input
                        type="checkbox"
                        className="location-checkbox ms-3"
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
                    state.cities.map((city) => (
                      <tr
                        key={city.id}
                        className={`location-table-row cursor-pointer ${activeRowId === `city-${city.id}`
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
        <Row className="pl-md-1 align-items-start mb-3 mt-3 ms-3">
          <Col
            md="3"
            sm="12"
            className="d-flex justify-content-md-start justify-content-start mb-1 mb-md-0 col-max-ls "
          >
            <Label className="mb-0  font location-side-heading">Geographic</Label>
          </Col>

          <Col md="8" sm="12">
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
          </Col>
        </Row>

        <Row className="pl-md-1 align-items-start mb-3 mt-3 ms-3">
          <Col
            md="3"
            sm="12"
            className="d-flex justify-content-md-start justify-content-start mb-1 mb-md-0 col-max-ls "
          >
            <Label className="mb-0  location-side-heading">DMA Code</Label>
          </Col>

          <Col md="8" sm="12">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Input + attached button */}
              <div
                className="input-group input-group-sm"
                style={{ maxWidth: "360px" }}
              >
                <input
                  type="text"
                  className="form-control dmacode_input placeholder-xs"
                  placeholder="Enter code separated by commas"
                />
                <button className=" dmacode_button  " type="button">
                  <span className="px-1">Lookup...</span>
                </button>
              </div>

              {/* Action buttons */}
              <button className="dmacode_button" type="button">+ Add Code(s)</button>

              <button className="dmacode_button" type="button">- Exclude code(s)</button>
            </div>
          </Col>
        </Row>

        <Row className="pl-md-1 align-items-start mb-3 mt-3 ms-3">
          <Col
            md="3"
            sm="12"
            className="d-flex justify-content-md-start justify-content-start mb-1 mb-md-0 col-max-ls "
          >
            <Label className="mb-0 location-side-heading">Zip/Postal Code</Label>
          </Col>

          <Col md="8" sm="12">
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Dropdown + Input */}
                <div
                  className="input-group input-group-sm "
                  style={{ maxWidth: "360px" }}
                >
                  <div id="country-wrapper" className="position-relative">
                    {/* Input box */}
                    <div
                      className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center biddeript-a Postal_Code_selection"
                      onClick={() => {
                        setOpenCountry(!openCountry);
                      }}
                      tabIndex={0}
                    >
                      {selectedCountry || "Select Country"}
                      <FaCaretDown
                        className={`custom-select-icon ${openCountry ? "open" : ""
                          }`}
                      />
                    </div>

                    {/* Dropdown menu */}
                    {openCountry && (
                      <div className="custom-dropdown-menu biddeript-b">
                        {countrystatic.map((country, idx) => {
                          const isSelected = selectedCountry === country;

                          return (
                            <div
                              key={idx}
                              className={`custom-dropdown-option ${isSelected ? "selected" : ""
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
                    className="form-control  dmacode_input"
                    placeholder="Enter code separated by commas"
                    style={{ height: "30px" }}
                  />
                </div>

                {/* Action buttons */}
                <button className="dmacode_button" type="button">+ Add Code(s)</button>

                <button className="dmacode_button" type="button">- Exclude code(s)</button>
              </div>
            </div>
          </Col>
        </Row>

        <Row className="pl-md-1 align-items-start mb-3 mt-3 ms-3">
          <Col
            md="3"
            sm="12"
            className="d-flex justify-content-md-start justify-content-start mb-1 mb-md-0 col-max-ls "
          >
            <Label className="mb-0 location-side-heading">Selected Locations</Label>
          </Col>

          <Col md="5" sm="12" className="d-flex flex-column">
            <div className="d-flex selected_locationrow">
              <Button type="button" className="location-button">
                Add Set
              </Button>

              <Button type="button" id="lxt_other" className="ms-2">
                Save as New Set
              </Button>

              <button
                type="button"
                className="dmacode_button ms-auto"
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
                  {selectedcountryitem.length === 0 ? (
                    <tr className="empty-row"></tr>
                  ) : (
                    selectedcountryitem.map((item, index) => (
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
                              <span className="location-type-status">{item.status || "Targeted"}</span>
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
                              {item.country} → {item.state}
                            </td>
                            <td
                              className={`location_data_row_targeted${activeRowId == index ? " text-light" : ""}`}
                            >
                              State
                            </td>
                            <td
                              className={`location_data_row_country${activeRowId == index ? " text-light" : ""}`}
                            >
                              <span className={`location-type-status `}>
                                {item.status}
                              </span>
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
                              {item.country} → {item.state} → {item.city}
                            </td>
                            <td
                              className={`location_data_row_targeted${activeRowId == index ? " text-light" : ""}`}
                            >
                              City
                            </td>
                            <td
                              className={`location_data_row_country${activeRowId == index ? " text-light" : ""}`}
                            >
                              <span className={`location-type-status `}>
                                {item.status}
                              </span>
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
              Location rules in campaign <span id="count">0/15000</span>
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
                All location categories (except Hyperlocal) share a common limit of 15000 entries. For example, adding 50 DMA codes and 150 Zip codes will add 200 entries to the Location Rules total. To ensure your campaign runs correctly, the total of your locations rules (targeted + excluded) must be within the limit indicated under the 'Selected Locations' field.
              </UncontrolledTooltip>
            </span>
          </Col>
        </Row>
        <Row className="pl-md-1 align-items-start mb-3 mt-3 ms-3">
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
                  onChange={(e) => sethyperlocal(e.target.value)}
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
                  onChange={(e) => sethyperlocal(e.target.value)}
                />
                <span className="text-gray-700 devices">Upload from file</span>
              </div>
            </div>
          </Col>
        </Row>

        <Row className="pl-md-1 align-items-start mb-3 mt-3 ms-3 ">
          <Col
            md="3"
            sm="12"
            className="d-flex justify-content-md-start justify-content-start mb-1 mb-md-0 col-max-ls "
          ></Col>
          <Col md="4" sm="12">
            {Hyperlocal == 1 && (
              <div className="d-flex align-items-center ">
                <button className={` font me-2 ${map ? "map_enter_button" : "map_enter_button1"}`} type="button" onClick={() => { setmap(false) }}>
                  Enter
                </button>
                <button className={` font ${map ? "map_enter_button1" : "map_enter_button"}`} type="button" onClick={() => { setmap(true) }}>
                  Map
                </button>

                <Input
                  placeholder="Search address..."
                  className="Hyperlocal_input ms-2"
                ></Input>
              </div>
            )}

            <div>
              {/* //map */}
              {/* {enter} */}
              {!map && Hyperlocal == 1 && <ul className="compact-list mt-2">
                <li>Separate each coordinate value with a space</li>
                <li>Enter each coordinate or address on a new row</li>
                <li>For coordinates, add an optional radius for each row</li>
              </ul>}



              {Hyperlocal == 0 && <ul className="compact-list mt-2">
                <li>Separate each coordinate value with a space</li>
                <li>Enter each coordinate or address on a new row</li>
                <li>For coordinates, add an optional radius for each row</li>
              </ul>}

              {!map &&
                <div class="address-text">
                  41.8781 -87.6298
                  <br />
                  43.6519 -79.4095 1.00
                  <br />
                  {Hyperlocal == 1 && <>11 E Madison Street Chicago, IL 60602</>}
                </div>
              }
              {!map || Hyperlocal == 0 &&
                <div class="address-text">
                  41.8781 -87.6298
                  <br />
                  43.6519 -79.4095 1.00
                  <br />
                  {Hyperlocal == 1 && <>11 E Madison Street Chicago, IL 60602</>}
                </div>
              }


              {Hyperlocal == 1 && !map && (
                <>
                  <textarea
                    className="location_addressbox"
                    placeholder="Enter..."
                  ></textarea>
                  <div className="mt-5 ">
                    <button className="me-2 map_enter_button">Target</button>
                    <button className="map_enter_button_target text-center">Exclude</button>
                  </div>
                </>
              )}
              {Hyperlocal == 1 && map && (



                <>
                  <GeoEditor
                    geo={geo}
                    callback={handlecheck}
                    // other props like setZoom, center, etc.
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
                        className={`custom-select-icon ${openradius ? "open" : ""
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
                              className={`custom-dropdown-option ${isSelected ? "selected" : ""
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
                    className="input-group input-group-smv mt-3"
                    style={{ maxWidth: "360px" }}
                  >
                    <input
                      type="file"
                      id="fileUpload"
                      accept=".csv,.txt"
                      className="d-none"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setFileName(file.name); // ✅ correct
                        }
                      }}
                    />

                    <input
                      type="text"
                      className="form-control dmacode_input placeholder-xs"
                      placeholder="Upload a CSV or TXT file"
                      value={fileName}
                      readOnly
                    />
                    <button
                      className=" radius_button  "
                      type="button"
                      onClick={() =>
                        document.getElementById("fileUpload").click()
                      }
                    >
                      <span className="px-1">Select File</span>
                    </button>
                  </div>
                  <span className="location_bottom_notes">
                    Your file will be uploaded when you save the campaign.
                  </span>
                </>
              )}
            </div>
          </Col>

          <Col className="">
            {Hyperlocal == 1 && (
              <div className=" ">
                <p className="selected_codinates">Selected Coordinates</p>
                <div className="d-flex align-items-center gap-2 me-5 radius_units_div">
                  <p id="radius_units " className="mt-3 radius_units">
                    Radius Units
                  </p>

                  <div className="position-relative mt-2">
                    <select
                      className="form-control py-1 px-1 rounded-0"
                      style={{
                        height: "26px",
                        fontSize: "11px",
                        width: "140px",
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled hidden>
                        Miles
                      </option>
                      <option>Kilometers</option>
                      <option>Meters</option>
                      <option>Miles</option>
                      <option>Feet</option>
                    </select>
                    <FaCaretDown className="custom-select-icon" />
                  </div>
                  <button
                    className=" map_enter_button2 mt-2 ms-auto
                "
                    style={{
                      height: "26px",
                    }}
                  >
                    Bulk Edit
                  </button>
                </div>
                <div style={{ height: "500px ", width: "80%", borderBottom: "" }} className="border">
                  <DataTable
                    columns={columns}
                    data={Array.isArray(mapdata) ? mapdata : []}

                    highlightOnHover
                    striped
                    responsive
                    customStyles={customStyles}
                    fixedHeaderScrollHeight="500px"
                    fixedHeader
                    persistTableHead
                    noDataComponent={null}


                  />
                </div>


              </div>
            )}

            <div>{/* //map */}</div>
          </Col>
        </Row>
      </div>

      {open && (
        <div className="location-modal-overlay">
          <div className="location-modal-box">
            {/* Header */}
            <div className="location-modal-header">
              <span className="location-modal-header-heading1">Select Locations</span>
              <span className="location-count">
                Location rules in campaign:{" "}
                <span className="location_header_count">0/15000</span>
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
              ) : (
                <table className="location-table w-100">
                  <tbody className="border border-0">
                    <LocationTable countries={filteredCountries} />
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
