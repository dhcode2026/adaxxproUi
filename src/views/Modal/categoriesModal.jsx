import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "reactstrap";
import { getAllCategory } from "../api/Api";

/* =========================
   TREE NODE COMPONENT
========================= */
const TreeNode = ({
  node,
  selected,
  toggleSelect,
  level = 0,
  isLast = false,
  parent = null,
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const isChecked = selected.some(
    (c) => c.parent === node.name || c.grandparent === node.name
  );

  return (
    <div className={`tree-node level-${level}`}>
      <div className="tree-row d-flex align-items-center">
        {/* CONNECTOR LINES (only if not root) */}
        {level > 0 && (
          <>
            <span className={`tree-vertical-line ${isLast ? "last" : ""}`} />
            <span className="tree-horizontal-line" />
          </>
        )}

        {/* TOGGLE / PLACEHOLDER */}
        {hasChildren ? (
          <span
            className="tree-toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "−" : "+"}
          </span>
        ) : (
          <span className="tree-toggle-placeholder" />
        )}

        {/* CHECKBOX + LABEL */}
        <label className="tree-label d-flex align-items-center ms-1">
          <input
            type="checkbox"
            className="form-check-input rounded-0"
            checked={isChecked}
            onChange={() => toggleSelect(node.name, node, parent)}
          />
          <span className="ms-2">{node.name}</span>
        </label>
      </div>

      {/* CHILDREN */}
      {hasChildren && expanded && (
        <div className="tree-children">
          {node.children.map((child, idx) => (
            <TreeNode
              key={idx}
              node={child}
              selected={selected}
              toggleSelect={toggleSelect}
              level={level + 1}
              isLast={idx === node.children.length - 1}
              parent={node.name}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================
   MAIN MODAL COMPONENT
========================= */
const CategoriesModal = ({
  modalOpen,
  toggleModal,
  selectedCategories,
  setSelectedCategories,
}) => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  /* ---------- FETCH API ---------- */
  useEffect(() => {
    if (!modalOpen) return;

    const fetchCategories = async () => {
      try {
        setLoading(true);

        const response = await getAllCategory();

        const categoriesData =
          response?.data?.data?.informationCategories || [];

        // TRANSFORM API → TREE FORMAT
        const transformed = categoriesData.map((cat) => ({
          name: cat.name,
          children:
            cat.categoryValues?.map((val) => ({
              name: val.name,
              children: [],
            })) || [],
        }));

        setCategories(transformed);
      } catch (err) {
        console.error("Category API error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [modalOpen]);

  /* ---------- SELECTION LOGIC ---------- */
  const toggleSelect = (name, node = null, parent = null) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.some((c) => c.parent === name);

      const getAllDescendants = (n) => {
        if (!n?.children) return [];
        return n.children.flatMap((c) => [
          c.name,
          ...getAllDescendants(c),
        ]);
      };

      const descendants = node ? getAllDescendants(node) : [];

      // REMOVE
      if (isSelected) {
        return prev.filter(
          (c) => c.parent !== name && !descendants.includes(c.parent)
        );
      }

      // ADD
      return [
        ...prev,
        {
          parent: name,
          childrenCount: descendants.length,
          isParent: true,
          grandparent: parent,
        },
        ...descendants.map((d) => ({
          parent: d,
          childrenCount: 0,
          isParent: false,
        })),
      ];
    });
  };

  return (
    <Modal
      isOpen={modalOpen}
      toggle={toggleModal}
      size="lg"
      scrollable
      className="custom-modal-width"
    >
      <ModalHeader toggle={toggleModal}>
        Select Categories
      </ModalHeader>

      <ModalBody className="p-0">
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "200px" }}
          >
            <Spinner size="sm" />
          </div>
        ) : (
          categories.map((category, idx) => (
            <TreeNode
              key={idx}
              node={category}
              selected={selectedCategories}
              toggleSelect={toggleSelect}
              isLast={idx === categories.length - 1}
            />
          ))
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          size="sm"
          className="inventorydone"
          onClick={toggleModal}
        >
          Done
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CategoriesModal;