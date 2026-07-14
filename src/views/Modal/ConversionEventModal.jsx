import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Label,
  Row,
  Col,
  Spinner,
  Form,
  InputGroup,
  InputGroupText,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';
import Swal from 'sweetalert2';
import { ConversionEvent, getAllconversioncategory, getConversionEvent } from "../../views/api/Api.jsx";
import DataTable from "react-data-table-component";
import { FaCog, FaCaretDown } from 'react-icons/fa';

const ConversionEventModal = (props) => {
  const { isOpen, toggle, conversion: initialconversion } = props;
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    notes: '',
    labelValue: '',
    eventName: '',
    mapName: '',
    eventValue: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversionEventsList, setConversionEventsList] = useState([]);
  const fetchConversionEventsList = async (conversionId) => {
    if (!conversionId && conversionId !== 0) {
      setConversionEventsList([]);
      setFilteredData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await getConversionEvent(conversionId);
      console.log('API Response:', response);

      if (response?.data?.status === 200) {
        const events = response.data.data.conversionEvents || [];
        const normalizedEvents = events.map(ev => ({
          conversionEventId: ev.conversionEventId,
          eventName: ev.eventName,
          mapName: ev.mapName,
          eventValue: ev.eventValue
        }));
        setConversionEventsList(normalizedEvents);
        setFilteredData(normalizedEvents);
      }
    } catch (error) {
      console.error('Failed to fetch conversion events:', error);
      await Swal.fire('Error!', 'Failed to fetch conversion events list', 'error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllconversioncategory();
        if (response?.data?.status === 200) {
          setCategories(response.data.data.informationConversionCategoryList || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialconversion && categories.length > 0) {
      let defaultVal = initialconversion.eventValue || '';
      if (defaultVal && defaultVal.startsWith('$')) {
        defaultVal = defaultVal.substring(1);
      }
      if (defaultVal && !isNaN(parseFloat(defaultVal))) {
        defaultVal = parseFloat(defaultVal).toFixed(2);
      }

      setFormData({
        id: initialconversion.id || 0,
        eventName: initialconversion.eventName || '',
        pid: initialconversion.pid || '',
        mapName: initialconversion.mapName || '',
        eventValue: defaultVal
      });
    }
  }, [initialconversion, categories]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        id: 0,
        name: '',
        eventName: '',
        pid: '',
        mapName: '',
        eventValue: ''
      });
      setErrors({});
    }
  }, [isOpen]);
  useEffect(() => {
    if (isOpen) {
      const currentId = getCurrentConversionId();
      fetchConversionEventsList(currentId);
    }
  }, [isOpen, formData.id, initialconversion?.id, initialconversion?.conversionId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleDefaultValueChange = (e) => {
    let raw = e.target.value;
    let cleaned = raw.replace(/[$]/g, '');
    cleaned = cleaned.replace(/[^0-9.]/g, '');
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      const firstDotIndex = cleaned.indexOf('.');
      cleaned = cleaned.substring(0, firstDotIndex + 1) + cleaned.substring(firstDotIndex + 1).replace(/\./g, '');
    }
    if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      if (parts[1].length > 2) {
        parts[1] = parts[1].slice(0, 2);
        cleaned = parts.join('.');
      }
    }

    setFormData((prev) => ({ ...prev, eventValue: cleaned }));
    setErrors((prev) => ({ ...prev, eventValue: '' }));
  };

  // Format default value on blur
  const handleDefaultValueBlur = () => {
    let val = formData.eventValue;
    if (val && !isNaN(parseFloat(val))) {
      const formatted = parseFloat(val).toFixed(2);
      setFormData((prev) => ({ ...prev, eventValue: formatted }));
    } else if (val === '') {
      return;
    } else {
      setFormData((prev) => ({ ...prev, eventValue: '' }));
    }
  };
  const showValidationError = async (errorMessages) => {
    const errorList = Object.values(errorMessages).map(error =>
      `<div style="text-align: left; padding: 2px 0;">• ${error}</div>`
    ).join('');

    await Swal.fire({
      html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px;">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
               style="width: 18px; height: 18px;" />
          <span style="font-size:16px; font-weight:bold;">Validation Error</span>
        </div>
        <div style="margin-top: 10px; font-size:13px; text-align:center;">
          Please fix the following errors:
        </div>
        <div style="margin-top: 10px; font-size:13px; text-align:left; padding: 0 20px;">
          ${errorList}
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      width: 320,
      padding: 0
    });
  };
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.eventName) {
      newErrors.eventName = 'Event Name is required';
      isValid = false;
    }
    setErrors(newErrors);
    return { isValid, errors: newErrors };
  };
  const formatDefaultValueForPayload = () => {
    const value = formData.eventValue;
    if (!value || value === '') return null;

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return null;

    return numericValue;
  };
  const getCurrentConversionId = () => (
    formData.id ||
    initialconversion?.id ||
    initialconversion?.conversionId ||
    null
  );
  const conversionsubmit = async () => {
    const formattedValue = formatDefaultValueForPayload();
    const conversionId = getCurrentConversionId();

    if (!conversionId) {
      throw new Error('Conversion ID is required');
    }

    const payload = {
      eventName: formData.eventName || null,
      mapName: formData.mapName || null,
      eventValue: formattedValue,
      conversionId
    };

    console.log('Submitting payload:', payload);

    try {
      const response = await ConversionEvent(payload);

      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };
  const addNewconversion = async (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateForm();

    if (!isValid) {
      await showValidationError(validationErrors);
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to create this Event?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, create it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);

    try {
      const response = await conversionsubmit();
      await new Promise(resolve => setTimeout(resolve, 800));

      if (response?.error) {
        await Swal.fire('Error!', response.message || 'Something went wrong.', 'error');
      } else {
        await Swal.fire(
          'Success!',
          'Event has been created.',
          'success'
        );
        const newConversionId = response?.data?.conversionId || getCurrentConversionId();
        if (newConversionId) {
          await fetchConversionEventsList(newConversionId);
        }
        setFormData((prev) => ({
          ...prev,
          eventName: '',
          mapName: '',
          eventValue: ''
        }));
      }
    } catch (error) {
      console.error(error);
      await Swal.fire('Error!', 'Something went wrong.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // DataTable components
  const NoDataComponent = () => (
    <div className="nodataavilable">
      <div className="py-4 text-secondary">
        {"No data available"}
      </div>
    </div>
  );

  const CustomLoader = () => (
    <div className="customloader">
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );
const customStyles = {
  table: {
      style: {
      backgroundColor: "#fff",
      minWidth: "1000px",
    },
  },
  headRow: {
    style: {
      minHeight: "56px",
      backgroundColor: "#eef4fa",
      borderBottom: "1px solid #dfe7f1",
      height: "56px",
    },
  },
  headCells: {
    style: {
      color: "#64748b",
      fontSize: "12px",
      fontWeight: 800,
      textTransform: "uppercase",
      paddingLeft: "12px",
      paddingRight: "12px",
      borderRight: "1px solid #e6ebf2",
    },
  },
  rows: {
    style: {
      minHeight: "35px",
      borderBottom: "1px solid #eef2f7",
      height: "35px",
    },
  },
  cells: {
    style: {
      paddingLeft: "14px",
      paddingRight: "14px",
      paddingTop: "10px",
      paddingBottom: "10px",
      borderRight: "1px solid #f1f5f9",
      whiteSpace: "nowrap",
    },
  },
};
  const conditionalRowStyles = [
    {
      when: row => row.status === 'Inactive',
      style: {
        backgroundColor: '#f8f9fa',
        opacity: 0.7,
      },
    },
  ];

  const IDCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.conversionEventId}
      </div>
    );
  };

  const NameCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.eventName || row.mmType}
      </div>
    );
  };

  const ConversionActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
    const handleEdit = () => {
      let defaultVal = row.eventValue ?? '';
      if (defaultVal && !isNaN(parseFloat(defaultVal))) {
        defaultVal = parseFloat(defaultVal).toFixed(2);
      }

      setFormData({
        id: row.conversionEventId || 0,
        eventName: row.eventName || '',
        mapName: row.mapName || '',
        eventValue: defaultVal
      });
      toggleDropdown();
    };

    const handleGetCode = () => {
      console.log('Get code for:', row);
      toggleDropdown();
    };

    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
        <DropdownToggle tag="span" className="settings">
          <FaCog style={{ marginRight: "5px" }} />
          <FaCaretDown />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={handleEdit}>
            Edit List
          </DropdownItem>
          <DropdownItem onClick={handleGetCode}>
            Get Code
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  const DefaultValueCell = ({ row }) => {
    const formatCurrency = (value) => {
      const numValue = typeof value === 'number'
        ? value
        : parseFloat(String(value).replace(/[$,]/g, '')) || 0;

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numValue);
    };

    return (
      <div className="gOorhn">
        {formatCurrency(row.eventValue)}
      </div>
    );
  };

  const NumberCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.pid || row.mapName}
      </div>
    );
  };

  const handleRowClicked = (row) => {
    console.log('Row clicked:', row);
    let defaultVal = row.eventValue ?? '';
    if (defaultVal && !isNaN(parseFloat(defaultVal))) {
      defaultVal = parseFloat(defaultVal).toFixed(2);
    }

    setFormData({
      id: row.conversionEventId || 0,
      eventName: row.eventName || '',
      mapName: row.mapName || '',
      eventValue: defaultVal
    });
  };
  const columns = [

    {
      name: "Event Name",
      selector: (row) => row.eventName,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 2,
      width: "200px"
    },
    {
      name: "ID",
      selector: (row) => row.conversionEventId,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      width: "62px",
      grow: 3,
    },
    {
      name: "Mapped Name",
      selector: (row) => row.mapName,
      cell: (row) => <NumberCell row={row} />,
      sortable: true,
      grow: 6,
      width: "130px",
    },
    {
      name: "Default Value",
      selector: (row) => row.eventValue,
      cell: (row) => <DefaultValueCell row={row} />,
      sortable: true,
      grow: 6,
      width: "130px",
    },
  ];

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered backdrop="static" keyboard={false} className="conversioneventmodal modal-sm modal-lg modal-xl">
      <Form onSubmit={addNewconversion} autoComplete="off">
        {isLoading && (
          <div className="loader-overlay">
            <Spinner color="primary" style={{ width: "4rem", height: "4rem" }} />
          </div>
        )}
        <div className="modal-header border-bottom editable">
          <h5 className="modal-title mb-0 headingtittle">
            {formData.id ? 'Create Event' : 'Create Event'}
          </h5>
          <Button close onClick={toggle} />
        </div>

        <ModalBody className="pt-3 modal-body-scroll">
          <Row>
            <Col md="4">
              <Label for="eventName">Event Name <span className="text-danger">*</span></Label>
              <Input
                type="text"
                id="eventName"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                invalid={!!errors.eventName}
                className="formscontrol"
              />
              {errors.eventName && <div className="text-danger small">{errors.eventName}</div>}
            </Col>
            <Col md="4">
              <Label for="mapName">Mapped Name (optional)</Label>
              <Input
                type="text"
                id="mapName"
                name="mapName"
                value={formData.mapName}
                onChange={handleChange}
                className="formscontrol"
              />
            </Col>
            <Col md="4">
              <Label for="eventValue">Default Value</Label>
              <InputGroup>
                <InputGroupText>$</InputGroupText>
                <Input
                  type="text"
                  id="eventValue"
                  name="eventValue"
                  value={formData.eventValue}
                  onChange={handleDefaultValueChange}
                  onBlur={handleDefaultValueBlur}
                  invalid={!!errors.eventValue}
                  className="formscontrol"
                />
              </InputGroup>
            </Col>
          </Row>
          <Row className="mt-2">

          </Row>
          <Row className="mt-2">

          </Row>
          <Row className="mt-3">
            <Col md="12">
            <div className="campaign-daily-table-wrapper">
                    <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "auto", maxHeight: "360px"  }}>
                      <div style={{ minWidth: "1000px" }}>
                        <DataTable
                          className="groupsdatatable"
                          columns={columns}
                          data={filteredData}
                          customStyles={{
                            ...customStyles,
                            tableWrapper: {
                              style: {
                                overflowY: 'auto',
                              },
                            },
                          }}
                          highlightOnHover
                          striped
                          dense
                          pointerOnHover
                          persistTableHead
                          fixedHeader
                          fixedHeaderScrollHeight="100%"
                          responsive={false}
                          conditionalRowStyles={conditionalRowStyles}
                        
                          onRowClicked={handleRowClicked}
                          progressPending={loading}
                          progressComponent={<CustomLoader />}
                          noDataComponent={
                            <div className="py-5 text-center text-secondary">
                              No data available
                            </div>
                          }
                        />
                      </div>
                    </div>
                  </div>
              {/* <div className="flex-grow-1 table-container2">
                <DataTable

                  columns={columns}
                  data={filteredData}
                  progressPending={loading}
                  progressComponent={<CustomLoader />}
                  striped
                  dense
                  fixedHeader
                  fixedHeaderScrollHeight="400px"
                  highlightOnHover
                  persistTableHead
                  conditionalRowStyles={conditionalRowStyles}
                  customStyles={{
                    ...customStyles,
                    tableWrapper: {
                      style: {
                        overflowY: 'auto',
                      },
                    },
                  }}
                  noDataComponent={<NoDataComponent />}
                  onRowClicked={handleRowClicked}
                />
              </div> */}
            </Col>
          </Row>
        </ModalBody>

        <ModalFooter>
          <Button className="cancels" onClick={toggle} disabled={isLoading}>
            Cancel
          </Button>
          <Button className="savebuttons" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              'Create Event'
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default ConversionEventModal;
