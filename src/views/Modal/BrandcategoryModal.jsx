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
const BrandcategoryModal = ({
  modalOpen,
  toggleModal,
  selectedCategory,
  setSelectedCategory,
  onCategoriesLoaded,
}) => {   
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState(
    selectedCategory?.length ? selectedCategory : []
  );
  const [expandedCountries, setExpandedCountries] = useState([]);
  const [categoriesData, setCategoriesData] = useState({});
  const [valueToNameMap, setValueToNameMap] = useState({});

  useEffect(() => {
    setSelectedItems(Array.isArray(selectedCategory) ? selectedCategory : []);
  }, [selectedCategory]);

  useEffect(() => {
    if (modalOpen) {
      setLoading(true);
      getAllCategory()
        .then((response) => {
          const { informationCategories } = response.data.data;
          const transformed = {};
          const vToN = {};

          const normalizeCategoryKey = (value) => String(value ?? "").trim();
          const pickCategoryKey = (obj) =>
            obj?.categoryCode ??
            obj?.category_code ??
            obj?.code ??
            obj?.value ??
            obj?.id ??
            obj?.name;
          const pickCategoryName = (obj) =>
            obj?.name ??
            obj?.displayName ??
            obj?.label ??
            obj?.categoryName ??
            obj?.value ??
            obj?.categoryCode ??
            obj?.code;

          informationCategories.forEach((category) => {
            const parentKey = normalizeCategoryKey(pickCategoryKey(category));
            if (!parentKey) return;

            vToN[parentKey] = normalizeCategoryKey(pickCategoryName(category)) || parentKey;

            const rawChildren = category?.categoryValues ?? category?.values ?? [];
            transformed[parentKey] = (Array.isArray(rawChildren) ? rawChildren : [])
              .map((sub) => {
                const childKey = normalizeCategoryKey(pickCategoryKey(sub));
                if (!childKey) return null;
                vToN[childKey] = normalizeCategoryKey(pickCategoryName(sub)) || childKey;
                return childKey;
              })
              .filter(Boolean);
          });
          setCategoriesData(transformed);
          setValueToNameMap(vToN);
          onCategoriesLoaded?.(transformed, vToN);
        })
        .catch((error) => {
          console.error("Failed to fetch categories:", error);
          setCategoriesData({});
        })
        .finally(() => setLoading(false));
    }
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    const parents = Object.keys(categoriesData);
    if (parents.length === 0) return;

    setSelectedItems((prev) => {
      const updated = new Set(Array.isArray(prev) ? prev : []);

      // If parent is selected (common from API), ensure all its children are selected
      parents.forEach((parent) => {
        if (!updated.has(parent)) return;
        (categoriesData[parent] || []).forEach((child) => updated.add(child));
      });

      return Array.from(updated);
    });
  }, [modalOpen, categoriesData]);

  useEffect(() => {
    if (!modalOpen || !Object.keys(categoriesData).length) return;

    const parentsToExpand = Object.keys(categoriesData).filter((parent) => {
      const children = categoriesData[parent] || [];
      return (
        selectedItems.includes(parent) ||
        children.some((child) => selectedItems.includes(child))
      );
    });

    setExpandedCountries(parentsToExpand);
  }, [modalOpen, categoriesData, selectedItems]);

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
    setSelectedCategory(selectedItems);
    toggleModal();
  };
  const handleCheckboxChange = (item, parent = null) => {
    setSelectedItems((prev) => {
      let updated = [...prev];

      const isParent = !parent && Object.keys(categoriesData).includes(item);

      if (isParent) {
        if (updated.includes(item)) {
          // Uncheck parent: remove parent and all its children
          const subs = categoriesData[item] || [];
          updated = updated.filter(
            (i) => i !== item && !subs.includes(i)
          );
        } else {
          // Check parent: add parent and all its children
          const subs = categoriesData[item] || [];
          updated = Array.from(new Set([...updated, item, ...subs]));
        }
      } else {
        if (updated.includes(item)) {
          updated = updated.filter((i) => i !== item);
        } else {
          updated.push(item);
        }

        // Keep parent selection consistent: parent checked implies all children checked.
        if (parent && Object.prototype.hasOwnProperty.call(categoriesData, parent)) {
          const subs = categoriesData[parent] || [];
          const nextSet = new Set(updated);
          const allSubsSelected = subs.length > 0 && subs.every((s) => nextSet.has(s));

          if (allSubsSelected) {
            nextSet.add(parent);
          } else {
            nextSet.delete(parent);
          }

          updated = Array.from(nextSet);
        }
      }

      return updated;
    });
  };
  const getDisplayName = (val) => valueToNameMap[val] || val;

  const filteredCountries = Object.keys(categoriesData).filter((key) =>
    getDisplayName(key).toLowerCase().includes(searchTerm.toLowerCase())
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
                        className={`category-item-row ${
                          isSelected ? "selected-row" : "category-row"
                        }`}
                        onClick={(e) => {
                          // Toggle checkbox if clicking anywhere except on caret
                          if (e.target.closest('.caret-container')) return;
                          if (e.target.type === 'checkbox') return;
                          handleCheckboxChange(country);
                        }}
                      >
                        <div className="d-flex align-items-center w-100">
                          <span
                            className="caret-container"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasSubs) handleToggle(country);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "20px",
                              height: "20px",
                              marginRight: "8px",
                              cursor: hasSubs ? "pointer" : "default",
                            }}
                          >
                            {hasSubs ? (
                              isExpanded ? <FaCaretDown size={14} /> : <FaCaretRight size={14} />
                            ) : null}
                          </span>
                          <input
                            type="checkbox"
                            ref={(el) => {
                              if (el) {
                                const isAnySelected = hasSubs && categoriesData[country]?.some(child => selectedItems.includes(child));
                                const isAllSelected = selectedItems.includes(country);
                                el.indeterminate = !isAllSelected && isAnySelected;
                              }
                            }}
                            checked={selectedItems.includes(country)}
                            onChange={() => handleCheckboxChange(country)}
                            style={{
                              cursor: "pointer",
                              width: "16px",
                              height: "16px",
                              marginRight: "8px",
                            }}
                          />
                          <span
                            className="countrys mb-0"
                            style={{
                              cursor: "pointer",
                              color: isSelected ? "#fff" : "#000",
                              fontWeight: 500,
                              userSelect: "none",
                            }}
                          >
                            {getDisplayName(country)}
                          </span>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {isExpanded && hasSubs && (
                        <div className="mt-1" style={{ paddingLeft: "52px" }}>
                          {categoriesData[country].map((region, rIndex) => {
                            const isSubSelected = selectedItems.includes(region);
                            return (
                              <div
                                className="subcategory-row"
                                key={rIndex}
                                onClick={(e) => {
                                  if (e.target.type === 'checkbox') return;
                                  handleCheckboxChange(region, country);
                                }}
                              >
                                <input
                                  type="checkbox"
                                  id={`region-${index}-${rIndex}`}
                                  checked={isSubSelected}
                                  onChange={() => handleCheckboxChange(region, country)}
                                  style={{
                                    cursor: "pointer",
                                    width: "16px",
                                    height: "16px",
                                    marginRight: "8px",
                                  }}
                                />
                                <span
                                  className="submenuing mb-0"
                                  style={{
                                    cursor: "pointer",
                                    color: "#333",
                                    userSelect: "none",
                                  }}
                                >
                                  {getDisplayName(region)}
                                </span>
                              </div>
                            );
                          })}
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

        .category-item-row {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 4px;
          transition: background-color 0.2s;
          cursor: pointer;
        }

        .category-row {
          background-color: transparent;
        }

        .category-row:hover {
          background-color: #f1f1f1;
        }

        .selected-row {
          background-color: #e53e3e;
          color: #fff !important;
        }

        .subcategory-row {
          display: flex;
          align-items: center;
          padding: 5px 12px;
          border-radius: 4px;
          transition: background-color 0.2s;
          cursor: pointer;
        }

        .subcategory-row:hover {
          background-color: #f5f5f5;
        }

        .submenuing {
          color: #333;
        }

        input[type="checkbox"] {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid #ccc;
          border-radius: 3px;
          outline: none;
          transition: background-color 0.2s, border-color 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #fff;
          cursor: pointer;
          position: relative;
        }

        input[type="checkbox"]:hover {
          border-color: #e53e3e;
        }

        input[type="checkbox"]:checked {
          background-color: #e53e3e;
          border-color: #e53e3e;
        }

        input[type="checkbox"]:checked::after {
          content: "✓";
          color: #fff;
          font-size: 11px;
          font-weight: bold;
          line-height: 1;
        }

        input[type="checkbox"]:indeterminate {
          background-color: #e53e3e;
          border-color: #e53e3e;
        }

        input[type="checkbox"]:indeterminate::after {
          content: "";
          width: 8px;
          height: 2px;
          background-color: #fff;
          border-radius: 1px;
        }

        .selected-row input[type="checkbox"] {
          border-color: #fff;
          background-color: #fff;
        }

        .selected-row input[type="checkbox"]:checked::after {
          color: #e53e3e;
        }

        .selected-row input[type="checkbox"]:indeterminate {
          background-color: #fff;
          border-color: #fff;
        }

        .selected-row input[type="checkbox"]:indeterminate::after {
          background-color: #e53e3e;
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

export default BrandcategoryModal;
