import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "reactstrap";
import { FaCaretDown, FaCaretRight } from "react-icons/fa";
import { getcountry, getprimaryregions } from "../api/Api";

const CountriesModal = ({
  modalOpen,
  toggleModal,
  selectedCountries,
  setSelectedCountries,
}) => {
  const [regionsByCountry, setRegionsByCountry] = useState({});

  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [expandedCountries, setExpandedCountries] = useState([]);
  const [selection, setSelection] = useState(() => ({
    countryIds: new Set(),
    regionIdsByCountry: new Map(),
  }));
  const countryCheckboxRefs = React.useRef(new Map());
  const hasUserInteractedRef = React.useRef(false);
  const lastIncomingSelectionKeyRef = React.useRef(null);

  const getCountryRegions = (countryId, country) =>
    Array.isArray(regionsByCountry[countryId])
      ? regionsByCountry[countryId]
      : Array.isArray(country?.primaryRegion)
        ? country.primaryRegion
        : [];

  const getAllRegionIds = (countryId, country) =>
    getCountryRegions(countryId, country)
      .map((r, idx) => getRegionApiId(r, idx))
      .filter(Boolean);

  const getCountryKey = (country, index) => {
    const rawKey =
      country?.countryId ??
      country?.id ??
      country?.country_id ??
      country?.iso3 ??
      country?.name ??
      index;
    return rawKey == null ? null : String(rawKey);
  };

  const getRegionKey = (region, index) => {
    const rawKey = region?.primaryRegionId ?? region?.name ?? index;
    return rawKey == null ? null : String(rawKey);
  };

  const getRegionApiId = (region, index) => {
    const rawKey =
      region?.primaryRegionId ??
      region?.id ??
      region?.stateId ??
      region?.state_id ??
      getRegionKey(region, index);
    return rawKey == null ? null : String(rawKey);
  };

  // Fetch Countries
  useEffect(() => {
    if (!modalOpen) return;
    if (countries.length > 0) return;

    const fetchCountries = async () => {
      try {
        setLoading(true);

        const response = await getcountry();
        const countriesData = response?.data?.data?.informationCountries || [];

        setCountries(countriesData);
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [modalOpen, countries.length]);

  useEffect(() => {
    if (!modalOpen) return;
    hasUserInteractedRef.current = false;
    lastIncomingSelectionKeyRef.current = null;
  }, [modalOpen]);

  // Sync selection from parent when modal opens (and after countries load)
  useEffect(() => {
    if (!modalOpen) return;
    if (!Array.isArray(countries) || countries.length === 0) return;

    const nextCountryIds = new Set();
    const nextRegionIdsByCountry = new Map();
    const incoming = Array.isArray(selectedCountries) ? selectedCountries : [];
    const incomingKey = JSON.stringify(incoming);

    if (
      hasUserInteractedRef.current &&
      lastIncomingSelectionKeyRef.current === incomingKey
    ) {
      return;
    }

    incoming.forEach((sel) => {
      const countryName = sel?.parent;
      if (!countryName) return;

      const countryIndex = countries.findIndex((c) => c?.name === countryName);
      const country = countries[countryIndex];
      if (!country) return;

      const countryId = getCountryKey(country, countryIndex);
      if (!countryId) return;
      const availableRegions = Array.isArray(regionsByCountry[countryId])
        ? regionsByCountry[countryId]
        : Array.isArray(country.primaryRegion)
          ? country.primaryRegion
          : [];

      const regionIds = new Set();
      const hasExplicitRegions =
        Array.isArray(sel?.regions) && sel.regions.length > 0;

      if (hasExplicitRegions) {
        availableRegions.forEach((r, regionIndex) => {
          if (sel.regions.includes(r.name)) {
            const regionId = getRegionApiId(r, regionIndex);
            if (regionId) regionIds.add(regionId);
          }
        });
      }

      const isFullCountrySelection =
        !hasExplicitRegions ||
        availableRegions.length === 0 ||
        regionIds.size === availableRegions.length;

      if (isFullCountrySelection) {
        nextCountryIds.add(countryId);
        const allRegionIds = getAllRegionIds(countryId, country);
        if (allRegionIds.length > 0) {
          nextRegionIdsByCountry.set(countryId, new Set(allRegionIds));
        }
      }

      if (regionIds.size > 0) {
        nextRegionIdsByCountry.set(countryId, regionIds);
        nextCountryIds.add(countryId);
      }
    });

    setSelection({
      countryIds: nextCountryIds,
      regionIdsByCountry: nextRegionIdsByCountry,
    });
    lastIncomingSelectionKeyRef.current = incomingKey;
  }, [modalOpen, countries, regionsByCountry, selectedCountries]);

  // Update indeterminate state for country checkboxes (some regions selected)
  useEffect(() => {
    if (!modalOpen) return;

    countries.forEach((country, countryIndex) => {
      const countryId = getCountryKey(country, countryIndex);
      if (!countryId) return;

      const el = countryCheckboxRefs.current.get(countryId);
      if (!el) return;

      const totalRegions = Array.isArray(regionsByCountry[countryId])
        ? regionsByCountry[countryId].length
        : Array.isArray(country.primaryRegion)
          ? country.primaryRegion.length
          : 0;
      const regionSet = selection.regionIdsByCountry.get(countryId);
      const selectedCount = regionSet?.size || 0;
      const hasAnySelection =
        selection.countryIds.has(countryId) || selectedCount > 0;

      el.indeterminate =
        totalRegions > 0 && hasAnySelection && selectedCount < totalRegions;
    });
  }, [modalOpen, countries, regionsByCountry, selection]);

  // Expand / Collapse
  // const toggleExpand = (countryId) => {
  //   setExpandedCountries((prev) =>
  //     prev.includes(countryId)
  //       ? prev.filter((id) => id !== countryId)
  //       : [...prev, countryId]
  //   );
  // };

  const toggleExpand = async (countryId) => {
    setExpandedCountries((prev) =>
      prev.includes(countryId)
        ? prev.filter((id) => id !== countryId)
        : [...prev, countryId],
    );

    // 🔥 Fetch regions
    if (!regionsByCountry[countryId]) {
      try {
        const res = await getprimaryregions(countryId);
        const regions = res?.data?.data?.informationPrimaryRegionList || [];

        setRegionsByCountry((prev) => ({
          ...prev,
          [countryId]: regions,
        }));

        // If the country is selected, default to selecting all its regions.
        setSelection((prev) => {
          if (!prev.countryIds.has(String(countryId))) return prev;
          const nextRegionMap = new Map(prev.regionIdsByCountry);
          const allRegionIds = regions
            .map((r, idx) => getRegionApiId(r, idx))
            .filter(Boolean);
          if (allRegionIds.length > 0) {
            nextRegionMap.set(String(countryId), new Set(allRegionIds));
          }
          return { ...prev, regionIdsByCountry: nextRegionMap };
        });
      } catch (err) {
        console.error("Error fetching regions:", err);
      }
    }
  };

  // City selection is intentionally not supported in this modal.

  // Checkbox Logic
  const handleCountryToggle = (country, countryIndex) => {
    const countryId = getCountryKey(country, countryIndex);
    if (!countryId) return;
    hasUserInteractedRef.current = true;

    const allRegionIds = getAllRegionIds(countryId, country);

    setSelection((prev) => {
      const nextCountryIds = new Set(prev.countryIds);
      const nextRegionMap = new Map(prev.regionIdsByCountry);
      const willSelect = !nextCountryIds.has(countryId);

      if (willSelect) {
        nextCountryIds.add(countryId);
        if (allRegionIds.length > 0) {
          nextRegionMap.set(countryId, new Set(allRegionIds));
        } else {
          nextRegionMap.delete(countryId);
        }
      } else {
        nextCountryIds.delete(countryId);
        nextRegionMap.delete(countryId);
      }

      return { countryIds: nextCountryIds, regionIdsByCountry: nextRegionMap };
    });

  };

  const handleRegionToggle = (country, countryIndex, region, regionIndex) => {
    const countryId = getCountryKey(country, countryIndex);
    const regionId = getRegionApiId(region, regionIndex);
    if (!countryId || !regionId) return;
    hasUserInteractedRef.current = true;
    // const allRegionIds = (Array.isArray(country.primaryRegion)
    //   ? country.primaryRegion
    //   : []
    // )
    //   .map((r, rIndex) => getRegionKey(r, rIndex))
    //   .filter(Boolean);

    setSelection((prev) => {
      const nextCountryIds = new Set(prev.countryIds);
      const nextRegionMap = new Map(prev.regionIdsByCountry);
      const setForCountry = new Set(nextRegionMap.get(countryId) || []);

      if (setForCountry.has(regionId)) {
        setForCountry.delete(regionId);
      } else {
        setForCountry.add(regionId);
      }

      if (setForCountry.size === 0) {
        nextRegionMap.delete(countryId);
      } else {
        nextRegionMap.set(countryId, setForCountry);
      }
      const hasAnyRegionSelection = setForCountry.size > 0;

      if (hasAnyRegionSelection) {
        nextCountryIds.add(countryId);
      } else {
        nextCountryIds.delete(countryId);
      }

      return { countryIds: nextCountryIds, regionIdsByCountry: nextRegionMap };
    });

  };

  // Done Button
  const handleDone = () => {
    const result = [];

    countries.forEach((country, countryIndex) => {
      const countryId = getCountryKey(country, countryIndex);
      if (!countryId) return;

      const regionIds = selection.regionIdsByCountry.get(countryId);
      const availableRegions = Array.isArray(regionsByCountry[countryId])
        ? regionsByCountry[countryId]
        : Array.isArray(country.primaryRegion)
          ? country.primaryRegion
          : [];
      const totalRegions = availableRegions.length;
      const selectedRegions = availableRegions
        .filter((r, regionIndex) => {
          const rid = getRegionApiId(r, regionIndex);
          if (!rid) return false;
          return regionIds?.has(rid);
        })
        .map((r) => r.name);

      const isFullCountrySelected =
        selection.countryIds.has(countryId) &&
        (totalRegions === 0 || selectedRegions.length === totalRegions);

      if (selection.countryIds.has(countryId) || selectedRegions.length > 0) {
        result.push({
          parent: country.name,
          iso3: country.iso3,
          childrenCount: isFullCountrySelected
            ? totalRegions
            : selectedRegions.length,
          regions: isFullCountrySelected ? [] : selectedRegions,
        });
      }
    });

    setSelectedCountries(result);
    toggleModal();
  };

  // Divider logic
  const lastCountryWithRegionsIndex = countries
    .map((c, i) => (c.primaryRegion?.length > 0 ? i : -1))
    .filter((i) => i !== -1)
    .pop();

  return (
    <Modal
      isOpen={modalOpen}
      toggle={toggleModal}
      className="custom-modal-width"
      centered
      size="lg"
    >
      <ModalHeader toggle={toggleModal}>Select Countries / Regions</ModalHeader>

      <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "200px" }}
          >
            <Spinner size="sm" />
          </div>
        ) : (
          countries.map((country, index) => {
            const countryId = getCountryKey(country, index);
            if (!countryId) return null;

            const isExpanded = expandedCountries.includes(countryId);
            // const hasRegions = country.primaryRegion?.length > 0;

            // const hasRegions = (regionsByCountry[countryId] || []).length > 0;

            const hasRegions = true; // always allow expand
            const countryChecked = selection.countryIds.has(countryId);

            return (
              <div key={countryId} className="mb-2">
                {/* COUNTRY ROW */}
                <div className="d-flex align-items-center">
                  <span
                    style={{
                      width: "16px",
                      display: "inline-flex",
                      justifyContent: "center",
                      color: "#999",
                      cursor: hasRegions ? "pointer" : "default",
                    }}
                    onClick={
                      hasRegions ? () => toggleExpand(countryId) : undefined
                    }
                  >
                    {hasRegions &&
                      (isExpanded ? <FaCaretDown /> : <FaCaretRight />)}
                  </span>

                  <input
                    type="checkbox"
                    className="form-check-input ms-2 rounded-0"
                    ref={(el) => {
                      if (el) {
                        countryCheckboxRefs.current.set(countryId, el);
                      } else {
                        countryCheckboxRefs.current.delete(countryId);
                      }
                    }}
                    checked={countryChecked}
                    onChange={() => handleCountryToggle(country, index)}
                  />

                  <label className="form-check-label ms-2">
                    {country.name}
                  </label>
                </div>

                {/* REGIONS */}
                {/* {isExpanded && hasRegions && (
                  <div className="ms-5 mt-1">
                    {
                    country.primaryRegion.map((region, regionIndex) => (
                      <div
                        key={getRegionKey(region, regionIndex) ?? regionIndex}
                        className="d-flex align-items-center mt-1"
                      >
                        <input
                          type="checkbox"
                          className="form-check-input rounded-0"
                          checked={
                            selection.regionIdsByCountry
                              .get(countryId)
                              ?.has(getRegionKey(region, regionIndex)) || false
                          }
                          onChange={() =>
                            handleRegionToggle(
                              country,
                              index,
                              region,
                              regionIndex,
                            )
                          }
                        />
                        <label className="ms-2">
                          {region.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )} */}

                {isExpanded && hasRegions && (
                  <div className="ms-5 mt-1">
                    {(regionsByCountry[countryId] || []).map(
                      (region, regionIndex) => {
                        const regionId = getRegionApiId(region, regionIndex);
                        const countryChecked =
                          selection.countryIds.has(countryId);
                        const regionChecked =
                          selection.regionIdsByCountry
                            .get(countryId)
                            ?.has(regionId) || false;

                        return (
                          <div key={regionId}>
                            {/* REGION ROW */}
                            <div className="d-flex align-items-center mt-1">
                              <span style={{ width: "16px" }} />

                              {/* checkbox */}
                              <input
                                type="checkbox"
                                className="form-check-input ms-2 rounded-0"
                                checked={regionChecked}
                                onChange={() =>
                                  handleRegionToggle(
                                    country,
                                    index,
                                    region,
                                    regionIndex,
                                  )
                                }
                              />

                              <label className="ms-2">{region.name}</label>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}

                {/* Divider */}
                {index === lastCountryWithRegionsIndex && (
                  <div
                    style={{
                      marginLeft: "24px",
                      marginTop: "12px",
                      marginBottom: "12px",
                      color: "#303030",
                      fontSize: "11px",
                      letterSpacing: "1px",
                      userSelect: "none",
                    }}
                  >
                    =============================
                  </div>
                )}
              </div>
            );
          })
        )}
      </ModalBody>

      <ModalFooter className="d-flex justify-content-end">
        <Button
          size="sm"
          className="inventorydone"
          color="primary"
          onClick={handleDone}
        >
          Done
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CountriesModal;
