import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Row,
  Col,
  Spinner
} from 'reactstrap';
import { getMacro } from '../api/Api';
import { creativemacros } from "../api/Api";
import Swal from 'sweetalert2';
const ConversionMacrosModal = ({ isOpen, toggle, onSelect, conversionId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [macros, setMacros] = useState([]);
  const [selectedMacroNames, setSelectedMacroNames] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchMacros = async () => {
    setIsLoading(true);
    try {
      const response = await getMacro();
      if (response?.data?.data?.informationMacros) {
        setMacros(response.data.data.informationMacros);
      } else {
        setMacros([]);
      }
    } catch (error) {
      console.error("Error fetching macros:", error);
      setMacros([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMacros();
      setSelectedMacroNames([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredMacros = useMemo(() => {
    if (!searchTerm) return macros;

    return macros.filter(macro => {
      const name = macro.macroName || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [macros, searchTerm]);

  const handleCheckboxChange = (macroName) => {
    setSelectedMacroNames(prev =>
      prev.includes(macroName)
        ? prev.filter(name => name !== macroName)
        : [...prev, macroName]
    );
  };

  const isAllSelected = useMemo(() => {
    if (filteredMacros.length === 0) return false;
    return filteredMacros.every(macro => selectedMacroNames.includes(macro.macroName));
  }, [filteredMacros, selectedMacroNames]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      const filteredNames = filteredMacros.map(m => m.macroName);
      setSelectedMacroNames(prev => prev.filter(name => !filteredNames.includes(name)));
    } else {
      const newSelected = [...selectedMacroNames];
      filteredMacros.forEach(macro => {
        if (!newSelected.includes(macro.macroName)) {
          newSelected.push(macro.macroName);
        }
      });
      setSelectedMacroNames(newSelected);
    }
  };

  const handleSave = async () => {
    const result = await Swal.fire({
      title: 'Confirm Selection',
      html: `<div style="text-align: left;">
        <p>Are you sure you want to save  macro(s)?</p>
      </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#62903e',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, save it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        selectedMacros: selectedMacroNames,
        conversionId: conversionId
      };

      console.log("Saving macros with payload:", payload);

      const response = await creativemacros(payload);
      console.log("API Response:", response);
      await Swal.fire({
        title: 'Success!',
        text: `Successfully saved ${selectedMacroNames.length} macro(s)`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#62903e',
        timer: 2000,
        showConfirmButton: true
      });

      const selectedItems = macros.filter(m => selectedMacroNames.includes(m.macroName));

      if (onSelect && typeof onSelect === 'function') {
        onSelect(selectedItems);
      }

      toggle();
    } catch (error) {
      console.error("Error saving macros:", error);
      await Swal.fire({
        title: 'Error!',
        text: `Failed to save macros: ${error.message || "Unknown error"}`,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#62903e'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="md" className="conversioneventmodal modal-sm modal-lg modal-xl">
      <div className="modal-header border-bottom d-flex align-items-center justify-content-between">
        <h5 className="modal-title mb-0 fw-bold">Select Macros</h5>
        <div className="macro-list-header d-flex align-items-center gap-2">
          <div className="select-all-container d-flex align-items-center gap-2 px-3 py-2 rounded">
            <Input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="custom-checkbox"
              disabled={filteredMacros.length === 0 || saving}
            />
            <div className="small fw-bold">All</div>
          </div>
          <Button close onClick={toggle} disabled={saving} />
        </div>
      </div>

      <ModalBody className="modal-body-scroll" id="conversion-macros-modal-body">
        <Row className="mb-2 g-2 align-items-center">
          <Col md="12">
            <div className="position-relative">
              <Input
                type="text"
                placeholder="Search macros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="formscontrol"
                id="macro-search-input"
                disabled={saving}
              />
            </div>
          </Col>
        </Row>

        <div className="macro-list-container">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <div className="mt-2">Loading macros...</div>
            </div>
          ) : (
            <div className="macro-grid-container">
              {filteredMacros.length > 0 ? (
                <Row className="p-2">
                  {filteredMacros.map((macro) => (
                    <Col key={macro.macroId} lg="3" md="4" sm="6" xs="12">
                      <div className="macro-grid-item d-flex align-items-start rounded p-2">
                        <Input
                          type="checkbox"
                          checked={selectedMacroNames.includes(macro.macroName)}
                          onChange={() => handleCheckboxChange(macro.macroName)}
                          className="me-2 custom-checkbox mt-1"
                          disabled={saving}
                        />
                        <div className="macro-name flex-grow-1">{macro.macroName}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-4 text-muted">No macros found</div>
              )}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter className="border-top justify-content-end gap-2">
        <Button
          onClick={toggle}
          className="cancels"
          disabled={saving}
        >
          Close
        </Button>
        <Button
          className="savebuttons"
          onClick={handleSave}
          disabled={saving || selectedMacroNames.length === 0}
        >
          {saving ? <Spinner size="sm" className="me-2" /> : null}
          {saving ? "Saving..." : "Save"}
        </Button>
      </ModalFooter>

      <style>{`
        .conversioneventmodal .modal-content {
          border-radius: 4px;
          border: none;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .conversioneventmodal .modal-header {
          padding: 15px 20px;
          background: #fff;
        }
        .conversioneventmodal .modal-title {
          font-weight: 700;
          color: #333;
          font-size: 1.1rem;
        }
        .conversioneventmodal .search-input {
          border-radius: 2px;
          font-size: 13px;
          padding: 8px 12px;
        }
        .conversioneventmodal .macro-list-container {
          height: 350px;
          background: #fff;
        }
        .conversioneventmodal .macro-grid-container {
          padding: 0;
        }
        .conversioneventmodal .macro-grid-item {
          background-color: #fff;
          transition: background-color 0.2s ease;
          cursor: pointer;
        }
        .conversioneventmodal .macro-grid-item:hover {
          background-color: #f9f9f9;
        }
        .conversioneventmodal .macro-name {
          color: #333;
          font-size: 11px;
        }
        .conversioneventmodal .custom-checkbox:checked {
          background-color: #62903e;
          border-color: #62903e;
        }
        .conversioneventmodal .macro-list-header {
          position: sticky;
          top: 0;
          z-index: 10;
          gap: 10px;
        }
        .conversioneventmodal .select-all-container {
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .conversioneventmodal .select-all-container:hover {
          background-color: #f0f0f0;
          border-color: #62903e;
        }
        .conversioneventmodal .select-all-container .custom-checkbox:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </Modal>
  );
};

export default ConversionMacrosModal;