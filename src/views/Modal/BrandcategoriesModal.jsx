import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Input,
} from "reactstrap";
import { FaCaretDown, FaCaretRight } from "react-icons/fa";
import { getAllCategory } from "../api/Api";
const BrandcategoriesModal = ({
  modalOpen,
  toggleModal,
  selectedCountries,
  setSelectedCountries,
  onCategoriesLoaded,
}) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState(
    selectedCountries?.length ? selectedCountries : []
  );
  const [valueToNameMap, setValueToNameMap] = useState({});

  useEffect(() => {
  setSelectedItems(selectedCountries || []);
}, [selectedCountries]);

  const [expandedCountries, setExpandedCountries] = useState([]);
  const [categoriesData, setCategoriesData] = useState({});
  useEffect(() => {
    if (modalOpen) {
      setLoading(true);
      getAllCategory()
        .then((response) => {
          const { informationCategories } = response.data.data;
          const transformed = {};
          const vToN = {};
          informationCategories.forEach((category) => {
            const parentCode = category.categoryCode;
            vToN[parentCode] = category.name;
            transformed[parentCode] = category.categoryValues.map((sub) => {
              vToN[sub.value] = sub.name;
              return sub.value;
            });
          });
          setCategoriesData(transformed);
          setValueToNameMap(vToN);
          onCategoriesLoaded?.(vToN);
        })
        .catch((error) => {
          console.error("Failed to fetch categories:", error);
          setCategoriesData({});
        })
        .finally(() => setLoading(false));
    }
  }, [modalOpen]);

  const handleToggle = (country) => {
    if (categoriesData[country]?.length > 0) {
      setExpandedCountries((prev) =>
        prev.includes(country)
          ? prev.filter((c) => c !== country)
          : [...prev, country]
      );
    }
  };
  const handleDone = () => {
    setSelectedCountries(selectedItems);
    toggleModal();
  };
  const handleCheckboxChange = (item, parent = null) => {
    setSelectedItems((prev) => {
      let updated = [...prev];

      if (!parent && Object.keys(categoriesData).includes(item)) {
        if (updated.includes(item)) {
          updated = updated.filter(
            (i) => i !== item && !categoriesData[item]?.includes(i)
          );
        } else {
          const subs = categoriesData[item] || [];
          updated = updated.filter((i) => !subs.includes(i));
          updated.push(item);
        }
      } else {
        if (updated.includes(item)) {
          updated = updated.filter((i) => i !== item);
        } else {
          updated.push(item);
        }
      }

      return updated;
    });
  };
  const getDisplayName = (val) => valueToNameMap[val] || val;

  const filteredCountries = Object.keys(categoriesData).filter((country) =>
    getDisplayName(country).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={modalOpen}
      toggle={toggleModal}
      id="brandmodal"
      size="lg"
      backdrop="static"
      keyboard={false}
    >
      <ModalHeader toggle={toggleModal}>Choose Categories</ModalHeader>
      <ModalBody
        className="p-0 custom-modal-body"
        style={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "200px" }}
          >
            <Spinner color="primary" />
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="mb-2 px-3 mt-2">
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  padding: "8px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div className="bordertime"></div>
            <div className="">
              {filteredCountries.length === 0 ? (
                <div
                  className="text-center py-4 text-muted"
                  style={{
                    fontWeight: 500,
                    fontSize: "14px",
                  }}
                >
                  No categories found
                </div>
              ) : (
                filteredCountries.map((country, index) => {
                  const isExpanded = expandedCountries.includes(country);
                  const isSelected = selectedItems.includes(country);
                  const hasSubs = categoriesData[country]?.length > 0;

                  return (
                    <div key={index} className="mb-1">
                      <div
                        className={`d-flex align-items-center ${
                          isSelected ? "selected-row" : "category-row"
                        }`}
                      >
                        <div className="d-flex align-items-center w-100" id="mainsource">
                          {hasSubs ? (
                            <span
                              onClick={() => handleToggle(country)}
                              style={{
                                fontSize: "14px",
                                marginRight: "6px",
                                cursor: "pointer",
                              }}
                            >
                              {isExpanded ? <FaCaretDown /> : <FaCaretRight />}
                            </span>
                          ) : (
                            <span style={{ width: "16px", marginRight: "6px" }} />
                          )}
                          <input
                            type="checkbox"
                            className="form-check-input me-2"
                            checked={selectedItems.includes(country)}
                            onChange={() => handleCheckboxChange(country)}
                            style={{ cursor: "pointer" }}
                          />
                          <label
                            className="countrys mb-0"
                            style={{
                              cursor: "pointer",
                              color: isSelected ? "#fff" : "#000",
                              fontWeight: 500,
                            }}
                          >
                            {getDisplayName(country)}
                          </label>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {isExpanded && hasSubs && (
                        <div className="ms-5 mt-1">
                          {categoriesData[country].map((region, rIndex) => (
                            <div
                              className="form-check d-flex align-items-center flex-wrap mb-1 subcategory-row"
                              key={rIndex}
                            >
                              <input
                                className="form-check-input me-2"
                                type="checkbox"
                                id={`region-${index}-${rIndex}`}
                                checked={selectedItems.includes(region)}
                                onChange={() => handleCheckboxChange(region, country)}
                                disabled={selectedItems.includes(country)}
                                style={{ cursor: "pointer" }}
                              />
                              <label
                                htmlFor={`region-${index}-${rIndex}`}
                                className="submenuing"
                                style={{
                                  cursor: selectedItems.includes(country)
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: selectedItems.includes(country) ? 0.6 : 1,
                                }}
                              >
                                {getDisplayName(region)}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </ModalBody>

      <ModalFooter className="d-flex justify-content-end">
        <Button size="sm" className="dones" onClick={handleDone}>
          Done
        </Button>
      </ModalFooter>
      <style jsx>{`
        .custom-modal-body {
          background-color: #fff;
          font-size: 14px;
        }

        .category-row {
          background-color: transparent;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .category-row:hover {
          background-color: #f1f1f1;
        }

        .selected-row {
          background-color: #5b8c46;
          color: #fff !important;
          height: 23px;
        }

        .submenuing {
          color: #333;
        }

        input[type="checkbox"] {
          accent-color: #5b8c46;
        }

        .custom-modal-body::-webkit-scrollbar {
          width: 6px;
        }

        .custom-modal-body::-webkit-scrollbar-thumb {
          background-color: #ccc;
          border-radius: 3px;
        }
      `}</style>
    </Modal>
  );
};

export default BrandcategoriesModal;