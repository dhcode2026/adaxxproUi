import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  Button,
  FormGroup,
  Input,
  Label,
  Spinner,
  Form,
  Row,
  Col,
  Tooltip
} from 'reactstrap';
import Swal from 'sweetalert2';
import { saveGroup, updateGroup } from '../../api/Api';

const GroupModalEditor = (props) => {
  const { isOpen, toggle, group: initialGroup, callback } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Details');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    initialStatus: 'On',
    budgetType: 'All Time',
    budget: '$5.00',
    startDate: '',
    endDate: '',
    impressionCap: 'None',
    pacing: 'off',
    groupBudgetOptimization: 'Off',
    impressionCaps: '',
    advertiser_spend: 'None',
    rate: '',
    footfall: 'off',
    cuebiq_campaign: '',
    max_amout: '',
    frequencycap: 'off',
    reach: 'off',
    kpi_metric: 'No KPI',
    kpi_value: '',
  });
  const [errors, setErrors] = useState({});
  const [tooltipOpen, setTooltipOpen] = useState({ 
    name: false, 
    startDate: false, 
    endDate: false,
    rate: false,
    kpi_value: false 
  });
  const [pacingWarningShown, setPacingWarningShown] = useState(false);

  const nameInputRef = useRef(null);
  const kpiValueRef = useRef(null);
  
  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  useEffect(() => {
    if (initialGroup && Object.keys(initialGroup).length > 0) {
      setFormData({
        id: initialGroup.id || initialGroup.groupId || '',
        name: initialGroup.name || '',
        initialStatus: initialGroup.initial_status === 'ACTIVE' ? 'On' : 'Off',
        budgetType: initialGroup.budget_type === 'DAILY' ? 'Daily' : 'All Time',
        budget: initialGroup.budget ? `$${initialGroup.budget}` : '$5.00',
        startDate: initialGroup.start_date ? new Date(initialGroup.start_date).toISOString().split('T')[0] : '',
        endDate: initialGroup.end_date ? new Date(initialGroup.end_date).toISOString().split('T')[0] : '',
        impressionCap: mapImpressionCap(initialGroup.impression_cap),
        pacing: initialGroup.pacing === 'EVEN' ? 'on' : 'off',
        groupBudgetOptimization: initialGroup.group_budget_optimization === 'ON' ? 'On' : 'Off',
        impressionCaps: initialGroup.impression_caps?.toString() || '',
        advertiser_spend: initialGroup.advertiser_spend === '0' ? 'None' : initialGroup.advertiser_spend || 'None',
        rate: initialGroup.rate?.toString() || '',
        footfall: initialGroup.footfall === 'STANDARD' ? 'on' : 'off',
        cuebiq_campaign: initialGroup.cuebiq_campaign || '',
        max_amout: initialGroup.max_amount?.toString() || '',
        frequencycap: mapFrequencyCap(initialGroup.frequencycap),
        reach: initialGroup.reach === 'ENABLED' ? 'on' : 'off',
        kpi_metric: initialGroup.kpi_metric || 'No KPI',
        kpi_value: initialGroup.kpi_value || '',
      });
    } else {
      resetForm();
    }
    setErrors({});
    setPacingWarningShown(false);
  }, [initialGroup]);
  
  const mapImpressionCap = (value) => {
    switch(value) {
      case 'NO_CAP': return 'None';
      case 'DAILY': return 'Daily';
      case 'ALL_TIME': return 'All Time';
      default: return 'None';
    }
  };
  
  const mapFrequencyCap = (value) => {
    switch(value) {
      case 'ON': return 'on';
      case 'NONE': return 'off';
      default: return 'off';
    }
  };

  useEffect(() => {
    if (errors.name) {
      setTooltipOpen((t) => ({ ...t, name: true }));
    } else {
      setTooltipOpen((t) => ({ ...t, name: false }));
    }
    
    if (errors.kpi_value) {
      setTooltipOpen((t) => ({ ...t, kpi_value: true }));
    } else {
      setTooltipOpen((t) => ({ ...t, kpi_value: false }));
    }
  }, [errors.name, errors.kpi_value]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'radio' ? (checked ? value : formData[name]) : value;
    
    setFormData((prev) => {
      let updatedData = { ...prev, [name]: newValue };
      if (name === 'impressionCap') {
        if (value === 'Daily' || value === 'All Time') {
          updatedData.impressionCaps = '10,000';
        } else {
          updatedData.impressionCaps = '';
        }
      }
    
      if (name === 'kpi_metric' && value === 'No KPI') {
        updatedData.kpi_value = '';
      }
      
      return updatedData;
    });

    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleKPIValueChange = (e) => {
    const { value } = e.target;
    const rawValue = value.replace(/[$\s%]/g, '');
    
    setFormData(prev => ({ 
      ...prev, 
      kpi_value: rawValue 
    }));
    
    setErrors((prev) => ({ ...prev, kpi_value: '' }));
  };

  // Prepare data for API
  const prepareAPIData = () => {
    const payload = {
      name: formData.name.trim(),
      initial_status: formData.initialStatus === 'On' ? 'ACTIVE' : 'INACTIVE',
      budget_type: formData.budgetType === 'Daily' ? 'DAILY' : 'ALL_TIME',
      budget: parseFloat(formData.budget.replace('$', '').replace(/,/g, '')),
      impression_cap: formData.impressionCap === 'None' ? 'NO_CAP' : 
                     formData.impressionCap === 'Daily' ? 'DAILY' : 'ALL_TIME',
      impression_caps: parseInt(formData.impressionCaps.replace(/,/g, '')) || 0,
      pacing: formData.pacing === 'on' ? 'EVEN' : 'OFF',
      group_budget_optimization: formData.groupBudgetOptimization === 'On' ? 'ON' : 'OFF',
      frequencycap: formData.frequencycap === 'on' ? 'ON' : 'NONE',
      advertiser_spend: formData.advertiser_spend === 'None' ? '0' : formData.advertiser_spend,
      rate: parseFloat(formData.rate) || 0.0,
      max_amount: parseFloat(formData.max_amout) || 0.0,
      footfall: formData.footfall === 'on' ? 'STANDARD' : 'DISABLED',
      cuebiq_campaign: formData.cuebiq_campaign || 'INTERNAL',
      reach: formData.reach === 'on' ? 'ENABLED' : 'DISABLED',
      start_date: formData.startDate ? `${formData.startDate}T00:00:00.000Z` : null,
      end_date: formData.endDate ? `${formData.endDate}T23:59:59.999Z` : null,
    };
    
    if (formData.kpi_metric && formData.kpi_metric !== 'No KPI' && formData.kpi_value) {
      payload.kpi_metric = formData.kpi_metric;
      payload.kpi_value = parseFloat(formData.kpi_value);
    }
    
    // Include ID if we're updating an existing group
    if (formData.id) {
      payload.id = formData.id;
    }
    
    return payload;
  };

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
      customClass: {
        popup: "swal2-custom-size",
        confirmButton: "swal2-small-btn",
      },
    });
  };

  const validateForm = async () => {
    const newErrors = {};
    let isValid = true;

    if (activeTab === 'Details') {
      if (!formData.name.trim()) {
        newErrors.name = 'This field is required';
        isValid = false;
      }
      if (!formData.budget.trim() || !formData.budget.match(/^\$?\d+(\.\d{2})?$/)) {
        newErrors.budget = 'Budget is required and must be a valid amount';
        isValid = false;
      }
      if (!formData.startDate) {
        newErrors.startDate = 'Start Date is required';
        isValid = false;
      }
      if (!formData.endDate) {
        newErrors.endDate = 'End Date is required';
        isValid = false;
      }
      if (formData.advertiser_spend !== 'None' && !formData.rate) {
        newErrors.rate = 'Rate is required.';
        isValid = false;
      }
    } 

    setErrors(newErrors);

    if (!isValid) {
      if (newErrors.name) nameInputRef.current?.focus();
      if (newErrors.kpi_value) kpiValueRef.current?.focus();
      await showValidationError();
    }

    return isValid;
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const groupSubmit = async () => {
    const payload = prepareAPIData();
    
    try {
      if (formData.id) {
        // Update existing group
        const response = await updateGroup(formData.id, payload);
        return { success: true, data: response.data };
      } else {
        // Create new group
        const response = await saveGroup(payload);
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('Error saving group:', error);
      let errorMessage = 'Failed to save group.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      initialStatus: 'On',
      budgetType: 'All Time',
      budget: '$5.00',
      startDate: '',
      endDate: '',
      impressionCap: 'None',
      pacing: 'off',
      groupBudgetOptimization: 'Off',
      impressionCaps: '',
      advertiser_spend: 'None',
      rate: '',
      footfall: 'off',
      cuebiq_campaign: '',
      max_amout: '',
      frequencycap: 'off',
      reach: 'off',
      kpi_metric: 'No KPI',
      kpi_value: '',
    });
    setErrors({});
    setActiveTab('Details');
    setPacingWarningShown(false);
  };

  const addNewGroup = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) return;
    
    if (activeTab === 'Details' && formData.pacing === "off" && !pacingWarningShown) {
      const pacingAlert = await Swal.fire({
        html: `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                 style="width: 18px; height: 18px;" />
            <span class="grouppacing">Group Pacing is Off</span>
          </div>
          <div class="spend">
            Having pacing set to off may cause this group to spend its budget as fast as possible.<br/>
            We recommend using group or campaign pacing to control the rate of spend.
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Keep Pacing Off',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#62903e',
        width: 380,
        padding: '10px 0 5px 0',
        reverseButtons: true,
        customClass: {
          popup: 'swal2-custom-size',
          confirmButton: 'swal2-small-btn',
          cancelButton: 'cancels',
        },
      });

      setPacingWarningShown(true);

      if (!pacingAlert.isConfirmed) return; 
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: formData.id
        ? 'Do you want to update this Group?'
        : 'Do you want to save this Group?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: formData.id ? 'Yes, update it!' : 'Yes, save it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#62903e',
      width: 380,
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);

    try {
      const response = await groupSubmit();
      await delay(500);

      if (!response.success) {
        await Swal.fire('Error', response.message || 'Something went wrong.', 'error');
      } else {
        await Swal.fire(
          'Success!',
          formData.id ? 'Group has been updated.' : 'Group has been created.',
          'success'
        );
        if (typeof callback === 'function') {
          callback(response.data);
        }
        toggle();
        resetForm();
      }
    } catch (error) {
      console.error(error);
      await Swal.fire('Error', 'Something went wrong.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getLabelStyle = () => ({
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#4d4d4d',
    marginBottom: '3px',
  });

  const formatKPIValueForDisplay = () => {
    const value = formData.kpi_value || '';
    if (!value) return '';
    
    switch(formData.kpi_metric) {
      case 'CTR':
        return `${value}%`;
      case 'eCPA':
      case 'eCPC':
      case 'Completion Rate':
        return `$${value}`;
      default:
        return value;
    }
  };

  const getKPIValuePlaceholder = () => {
    switch(formData.kpi_metric) {
      case 'CTR':
        return '1.00%';
      case 'eCPA':
      case 'eCPC':
      case 'Completion Rate':
        return '$1.00';
      default:
        return '';
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'Details') {
      return (
        <>
          <div className='maintesting'>
            <Label for="name">
              Name <span className="text-danger">*</span>
            </Label>
            <Input
              innerRef={nameInputRef}
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              invalid={!!errors.name}
              className="formscontrol"
              onMouseEnter={() => errors.name && setTooltipOpen((t) => ({ ...t, name: true }))}
              onMouseLeave={() => setTooltipOpen((t) => ({ ...t, name: false }))}
            />
            {errors.name && (
              <Tooltip
                placement="bottom"
                isOpen={tooltipOpen.name}
                target="name"
                autohide={false}
                container=".modal-content"
                popperClassName="custom-tooltip"
              >
                 <div className="one"></div>
                {errors.name}
              </Tooltip>
            )}
          </div>

          <div className='maintesting'>
            <Label for="initial_status">Initial Status</Label>
            <Input
              type="select"
              id="initialStatus"
              name="initialStatus"
              value={formData.initialStatus}
              onChange={handleChange}
              className="formscontrol"
            >
              <option value="On">On</option>
              <option value="Off">Off</option>
            </Input>
         </div>

          <Row className="mb-1">
            <Col md={6}>
              <div  className='maintesting'>
                <Label for="budget_type">Budget Type</Label>
                <Input
                  type="select"
                  id="budgetType"
                  name="budgetType"
                  value={formData.budgetType}
                  onChange={handleChange}
                  className="formscontrol"
                >
                  <option value="All Time">All Time</option>
                  <option value="Daily">Daily</option>
                </Input>
              </div>
            </Col>
            <Col md={6}>
              <div  className='maintesting'>
                <Label for="budget">Budget</Label>
                <Input
                  type="text"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="formscontrol"
                />
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <div  className='maintesting'>
                <Label for="startDate">
                  Start Date <span className="text-danger">*</span>
                </Label>
                <Input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate || ''}
                    onChange={handleChange}
                    invalid={!!errors.startDate}
                   className="formscontrol"
                   onMouseEnter={() => errors.startDate && setTooltipOpen((t) => ({ ...t, startDate: true }))}
                   onMouseLeave={() => setTooltipOpen((t) => ({ ...t, startDate: false }))}
                />
                  {errors.startDate && (
              <Tooltip
                placement="bottom"
                isOpen={tooltipOpen.startDate}
                target="startDate"
                autohide={false}
                container=".modal-content"
                popperClassName="custom-tooltip"
              >
                 <div className="one"></div>
                {errors.startDate}
              </Tooltip>
            )}
              </div>
            </Col>
            <Col md={6}>
              <div  className='maintesting'>
                <Label for="endDate">
                  End Date <span className="text-danger">*</span>
                </Label>
                <Input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate || ''}
                  onChange={handleChange}
                  className="formscontrol"
                  invalid={!!errors.endDate}
                  onMouseEnter={() => errors.endDate && setTooltipOpen((t) => ({ ...t, endDate: true }))}
                  onMouseLeave={() => setTooltipOpen((t) => ({ ...t, endDate: false }))}
                />
               {errors.endDate && (
              <Tooltip
                placement="bottom"
                isOpen={tooltipOpen.endDate}
                target="endDate"
                autohide={false}
                container=".modal-content"
                popperClassName="custom-tooltip"
              >
                 <div className="one"></div>
                {errors.endDate}
              </Tooltip>
            )}
              </div>
            </Col>
          </Row>
          <Row>
            <Col md="6">
         <div className='maintesting'>
            <Label for="impressioncap">Impression Cap</Label>
            <Input
              type="select"
              id="impressionCap"
              name="impressionCap"
              value={formData.impressionCap}
              onChange={handleChange}
              className="formscontrol"
            >
              <option value="None">None</option>
              <option value="Daily">Daily</option>
               <option value="All Time">All Time</option>
            </Input>
          </div>
          </Col>
           <Col md="6">
            <Label for="impressioncap"></Label>
            <Input
              type="text"
              id="impressionCaps"
              name="impressionCaps"
              value={formData.impressionCaps}
              onChange={handleChange}
              className="formscontrol mt-2"
            />
          </Col>
            </Row>
          <Row>
            <Col md="12">
             <div className='maintesting'>
                <Label className="fw-bold mt-2 pacinglabel" for="pacing">
                  Pacing
                </Label>
                <div className="d-flex align-items-center gap-3">
                  <div className="form-check form-check-inline">
                    <Input
                      type="radio"
                      id="pacingOff"
                      name="pacing"
                      value="off"
                      checked={formData.pacing === 'off'}
                      onChange={handleChange}
                      className="form-check-input"
                    />
                    <Label className="form-check-label pacinglabel" htmlFor="pacingOff">
                      Off
                    </Label>
                  </div>

                  <div className="form-check form-check-inline">
                    <Input
                      type="radio"
                      id="pacingOn"
                      name="pacing"
                      value="on"
                      checked={formData.pacing === 'on'}
                      onChange={handleChange}
                      className="form-check-input"
                    />
                    <Label className="form-check-label pacinglabel" htmlFor="pacingOn">
                      On
                    </Label>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <div role="alert" className="how">
            <i className="fa fa-info-circle me-2"></i>
            We recommend using group or campaign pacing to control how quickly the budget is spent.
          </div>

          <Row>
            <Col md="12">
              <div className='maintesting'>
                <Label className="fw-bold mt-2 pacinglabel" for="pacing">
                  Group Budget Optimization
                </Label>
                <div className="d-flex align-items-center gap-3">
                  <div className="form-check form-check-inline">
                    <Input
                      type="radio"
                      id="gboOff"
                      name="groupBudgetOptimization"
                      value="off"
                      checked={formData.groupBudgetOptimization === 'off'}
                      onChange={handleChange}
                      className="form-check-input"
                    />
                    <Label className="form-check-label pacinglabel" htmlFor="gboOff">
                      Off
                    </Label>
                  </div>

                  <div className="form-check form-check-inline">
                    <Input
                      type="radio"
                      id="gboOn"
                      name="groupBudgetOptimization"
                      value="on"
                      checked={formData.groupBudgetOptimization === 'on'}
                      onChange={handleChange}
                      className="form-check-input"
                    />
                    <Label className="form-check-label pacinglabel" htmlFor="gboOn">
                      On
                    </Label>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
            <div role="alert" className="how">
            <i className="fa fa-info-circle me-2"></i>
           To enable group budget optimization, select budget type.
          </div>

          <Row>
            <Col md="12">
             <div className='maintesting'>
                <Label className="fw-bold mt-2 pacinglabel" for="pacing">
                  Frequency Cap
                </Label>
                <div className="d-flex align-items-center gap-3">
                  <div className="form-check form-check-inline">
                    <Input
                      type="radio"
                      id="fcoOff"
                      name="frequencycap"
                      value="off"
                      checked={formData.frequencycap === 'off'}
                      onChange={handleChange}
                      className="form-check-input"
                    />
                    <Label className="form-check-label pacinglabel" htmlFor="fcoff">
                      Off
                    </Label>
                  </div>

                  <div className="form-check form-check-inline">
                    <Input
                      type="radio"
                      id="fcoOn"
                      name="frequencycap"
                      value="on"
                      checked={formData.frequencycap === 'on'}
                      onChange={handleChange}
                      className="form-check-input"
                    />
                    <Label className="form-check-label pacinglabel" htmlFor="fcOn">
                      On
                    </Label>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

            <Row>
            <Col md="6">
        <div className='maintesting'>
            <Label for="advertiser_spend">Advertiser Spend Type</Label>
            <Input
              type="select"
              id="advertiser_spend"
              name="advertiser_spend"
              value={formData.advertiser_spend}
              onChange={handleChange}
              className="formscontrol"
            >
              <option value="None">None</option>
              <option value="Falt CPC">Falt CPC</option>
               <option value="Falt CPM">Falt CPM</option>
                 <option value="Margin">Margin</option>
                 <option value="Mark Up">Mark Up</option>
            </Input>
          </div>
          </Col>
           <Col md="6">
            <Label for="rate"> Rate <span className='text-danger'>*</span></Label>
            <Input
              type="text"
              id="rate"
              name="rate"
              value={formData.rate}
              onChange={handleChange}
              className="formscontrol"
             disabled={formData.advertiser_spend === "None"}
             invalid={formData.advertiser_spend !== "None" && !!errors.rate}
            onMouseEnter={() => errors.rate && setTooltipOpen((t) => ({ ...t, rate: true }))}
            onMouseLeave={() => setTooltipOpen((t) => ({ ...t, rate: false }))}
            />
             {errors.rate && (
            <Tooltip
              placement="bottom"
              isOpen={tooltipOpen.rate}
              target="rate"
              autohide={false}
              container=".modal-content"
              popperClassName="custom-tooltip"
            >
              <div className='one'></div>
              {errors.rate}
            </Tooltip>
          )}
          </Col>
            </Row>

            <Row>
              <Col md="6">
            <Label for="rate"> Max Billable Amount</Label>
            <Input
              type="text"
              id="max_amout"
              name="max_amout"
              value={formData.max_amout}
              onChange={handleChange}
              className="formscontrol"
             disabled={formData.advertiser_spend === "None"}
            />
          </Col>
            </Row>
             <Label for="rate"> Estimated Spend</Label>
             <div className="totalspend">
          <Row className="text-center" style={{ fontSize: '12px', color: '#4d4d4d' }}>
            <Col xs="6">
              <div><strong>Estimated Spend</strong></div>
              <div>N/A</div>
            </Col>
            <Col xs="6">
              <div><strong>Daily Advertiser Spend</strong></div>
              <div>N/A</div>
            </Col>
            <Col xs="6" className="mt-2">
              <div><strong>Total Spend</strong></div>
              <div>N/A</div>
            </Col>
            <Col xs="6" className="mt-2">
              <div><strong>Total Advertiser Spend</strong></div>
              <div>N/A</div>
            </Col>
          </Row>
          <p
            className="mt-2"
            style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}
          >
            Estimates may be unavailable (N/A) with current Budget or Advertiser Spend Type.
          </p>
        </div>

        <div className="mt-3 measurment">
  <Row>
    <Col sm="9">
      <Label>Footfall Measurement</Label>
    </Col>
    <Col sm="3">
      {/* <img
        src="https://moca.sitescout.com/resources/ssimages/cuebiq-logo.svg"
        alt="Cuebiq"
        style={{ height: '20px', marginLeft: 'auto' }}
      /> */}
    </Col>
  </Row>

  <div className="d-flex align-items-center gap-3">
    <Input
      type="radio"
      id="footfallOff"
      name="footfall"
      value="off"
      checked={formData.footfall === 'off'}
      onChange={handleChange}
    />
    <Label htmlFor="footfallOff">Off</Label>

    <Input
      type="radio"
      id="footfallOn"
      name="footfall"
      value="on"
      checked={formData.footfall === 'on'}
      onChange={handleChange}
    />
    <Label htmlFor="footfallOn">On</Label>
  </div>

  {formData.footfall === 'on' && (
    <div className="mt-3">
          <div className='maintesting'>
            <Label for="name">
              Cuebiq Campaign ID 
            </Label>
            <Input
              innerRef={nameInputRef}
              type="text"
              id="cuebiq_campaign"
              name="cuebiq_campaign"
              value={formData.cuebiq_campaign}
              onChange={handleChange}
              className="formscontrol"
            />
          </div>

      <small className="text-muted d-block mt-2">
        Make sure campaigns track footfall conversions as primary conversions.
        It can take up to 3 days for Cuebiq to start measuring footfall.
        If you experience any issues, please contact Cuebiq.
      </small>
    </div>
  )}

  <small className="text-muted d-block mt-2">
    Reach out to Cuebiq at{' '}
    <a href="mailto:customer-success@cuebiq.com">
      customer-success@cuebiq.com
    </a>{' '}
    to set up footfall measurement. A CPM fee of $0.40 applies to every campaign.{' '}
    <a href="#">Download the footfall measurement setup guide</a> to learn more.
  </small>
</div>

<div className="mt-3 measurment">
  <Row>
    <Col sm="9"><Label>
    Advanced Reach Measurement
  </Label></Col> 
  <Col sm="3">
   {/* <img src="https://moca.sitescout.com/resources/ssimages/comscore-logo.svg" 
         alt="Comscore" style={{ height: '16px', marginLeft: 'auto' }} /> */}
  </Col>
  </Row>
  
  <div className="d-flex align-items-center gap-3">
    <Input type="radio" id="reachOff" name="reach" value="off"
           checked={formData.reach === 'off'} onChange={handleChange} />
    <Label htmlFor="reachOff">Off</Label>
    <Input type="radio" id="reachOn" name="reach" value="on"
           checked={formData.reach === 'on'} onChange={handleChange} />
    <Label htmlFor="reachOn">On</Label>
  </div>
</div>

        </>
      );
    } else if (activeTab === 'Goals') {
      return (
        <>
          <p className="text-muted" style={{ fontSize: '13px' }}>Goal</p>
          <p>Measure the health of this group by setting a key performance indicator goal.</p>
          
          <Row className="mb-1">
            <Col md={6}>
              <div className='maintesting'>
                <Label for="kpi_metric">KPI Metric</Label>
                <Input
                  type="select"
                  id="kpi_metric"
                  name="kpi_metric"
                  value={formData.kpi_metric}
                  onChange={handleChange}
                  className="formscontrol"
                >
                  <option value="No KPI">No KPI</option>
                  <option value="CTR">CTR</option>
                  <option value="eCPA">eCPA</option>
                  <option value="eCPC">eCPC</option>
                  <option value="Completion Rate">Completion Rate</option>
                </Input>
              </div>
            </Col>
            <Col md={6}>
              <div className='maintesting'>
                <Label for="kpi_value">
                  KPI Value {formData.kpi_metric !== 'No KPI' && <span className="text-danger">*</span>}
                </Label>
                <Input
                  innerRef={kpiValueRef}
                  type="text"
                  id="kpi_value"
                  name="kpi_value"
                  value={formatKPIValueForDisplay()}
                  onChange={handleKPIValueChange}
                  placeholder={getKPIValuePlaceholder()}
                  disabled={formData.kpi_metric === 'No KPI'}
                  className="formscontrol"
                />
                {formData.kpi_metric === 'CTR' && (
                  <small className="text-muted">Enter value as percentage (e.g., 1.50 for 1.50%)</small>
                )}
                {(formData.kpi_metric === 'eCPA' || formData.kpi_metric === 'eCPC' || formData.kpi_metric === 'Completion Rate') && (
                  <small className="text-muted">Enter value in dollars (e.g., 1.50 for $1.50)</small>
                )}
              </div>
            </Col>
          </Row>
          
          <div role="alert" className="how mt-3">
            <i className="fa fa-info-circle me-2"></i>
            {formData.kpi_metric === 'CTR' ? (
              'CTR (Click-Through Rate) measures the percentage of users who click on your ad.'
            ) : formData.kpi_metric === 'eCPA' ? (
              'eCPA (Effective Cost Per Acquisition) measures the cost per conversion.'
            ) : formData.kpi_metric === 'eCPC' ? (
              'eCPC (Effective Cost Per Click) measures the cost per click.'
            ) : formData.kpi_metric === 'Completion Rate' ? (
              'Completion Rate measures the percentage of users who complete a desired action.'
            ) : (
              'Set a KPI goal to track and optimize campaign performance.'
            )}
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      backdrop="static"
      keyboard={false}
      centered
      className="group-modal"
      size="lg"
      onOpened={() => nameInputRef.current?.focus()}
      id="groupmodal"
      style={{ maxWidth: '650px', margin: '1.75rem auto' }}
    >
      <Form onSubmit={addNewGroup} autoComplete="off">
        {isLoading && (
          <div
            className="loader-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Spinner color="primary" style={{ width: '4rem', height: '4rem' }} />
          </div>
        )}

        <div className="modal-header border-bottom-0 p-3 pb-1">
          <h5
            className="modal-title mb-0 headingtittle"
            style={{ fontSize: '16px', fontWeight: 'bold', color: '#4d4d4d' }}
          >
            {formData.id ? 'Edit Group' : 'New Group'}
          </h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={toggle}></button>
        </div>

        <div className="d-flex border-bottom ps-3 pt-0">
          <div
            onClick={() => setActiveTab('Details')}
            style={{
              cursor: 'pointer',
              padding: '9px 10px 10px 0px',
              color: activeTab === 'Details' ? '#62903e' : '#808080',
              borderBottom: activeTab === 'Details' ? '2px solid #62903e' : 'none',
              fontSize: '13px',
            }}
          >
            Details
          </div>
          <div
            onClick={() => setActiveTab('Goals')}
            style={{
              cursor: 'pointer',
              padding: '9px 10px 10px 0px',
              color: activeTab === 'Goals' ? '#62903e' : '#808080',
              borderBottom: activeTab === 'Goals' ? '2px solid #62903e' : 'none',
              fontSize: '13px',
            }}
          >
            Goals
          </div>
        </div>

        <ModalBody className=" pb-2 pt-3 modal-body-scroll" >{renderTabContent()}</ModalBody>

        <ModalFooter className="pt-1 pb-2 px-3 d-flex justify-content-end gap-2">
          <Button color="secondary" className='cancels' onClick={toggle} style={{ fontSize: '13px', height: '32px' }}>
            Cancel
          </Button>
          <Button
            color="success"
            style={{ fontSize: '13px', height: '32px' }}
            type="submit"
             className="savebuttons"
          >
            {formData.id ? 'Update Group' : 'Save Group'}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default GroupModalEditor;