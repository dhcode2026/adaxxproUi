import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  Button,
  FormGroup,
  Input,
  Label,
  Row,
  Col,
  FormFeedback,
  Spinner,
  Form,
  Tooltip
} from 'reactstrap';
import Swal from 'sweetalert2';
import { MultiSelect } from "react-multi-select-component";
import {ssp } from "../../../Utils.js";
import { useViewContext } from "../../../../src/ViewContext.jsx";

const InventoryConversionModal = (props) => {
  const { isOpen, toggle, inventory: initialinventory, callback } = props;
  const [isLoading, setIsLoading] = useState(false);

  const defaultDomains = ``;
   const [focusedField, setFocusedField] = useState(null);
  const [tooltipOpen, setTooltipOpen] = useState({
               name: false,
               domain_name:false,
               uploadFile:false,
              });

  const [formData, setFormData] = useState({
    id: initialinventory?.id || '',
    name: initialinventory?.name || '',
    exchanges: initialinventory?.exchanges || [],
    list_type: initialinventory?.list_type ?? 'allowlist',
    domain_name: initialinventory?.domain_name || defaultDomains,
  });

  const context = useViewContext();
  const [selected, setSelected] = useState('btn1');
  const [inventory, setInventory] = useState(initialinventory || {});
  const [errors, setErrors] = useState({});
  const [remainingLines, setRemainingLines] = useState(2000);

  const model2open = (e) => {
    if (e.target.id === 'btn1') {
      setSelected('btn1');
    } else {
      setSelected('btn2');
    }
  };

  // Re-fill formData on edit
  useEffect(() => {
    setFormData({
      id: initialinventory?.id || '',
      name: initialinventory?.name || '',
      list_type: initialinventory?.list_type || '',
      domain_name: initialinventory?.domain_name || defaultDomains,
      exchanges: initialinventory?.exchanges || [],
    });
    setInventory(initialinventory || {});
  }, [initialinventory]);

  // Live count of domains
  useEffect(() => {
    if (!formData.domain_name) {
      setRemainingLines(2000);
      return;
    }
    const domainCount = formData.domain_name
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0).length;

    setRemainingLines(2000 - domainCount);
  }, [formData.domain_name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

const validateForm = async () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'This field is required';
      isValid = false;
    }
    if (!formData.domain_name.trim()) {
      newErrors.domain_name = 'This field is required';
      isValid = false;
    }
    if (selected === "btn2") {
      if (!formData.uploadFile) {
        newErrors.uploadFile = "This field is required";
        isValid = false;
      }
    }
    
    setErrors(newErrors);

    if (!isValid) {

      await showValidationError();
    }

    return isValid;
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
        width: 268, // sets popup width
        padding: 0,
        customClass: {
          popup: "swal2-custom-size",
          confirmButton: "swal2-small-btn",
        },
      });
    };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const audiencesubmit = async () => {
    const x = { ...initialinventory };

    // calculate domain count
    const domainCount = (formData.domain_name || "")
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0).length;

    Object.assign(x, {
      ...formData,
      domain_count: domainCount, // add to payload
    });

    if (!x.id || x.id === 0) {
      const newId = await context.addNewInventory(x);
      if (newId !== undefined && newId !== null) {
        if (typeof callback === 'function') {
          callback({ ...x, id: newId });
        }
        toggle();
      }
    } else {
      const success = await context.addNewInventory(x);
      if (success) {
        if (typeof callback === 'function') {
          callback(x);
        }
        toggle();
      }
    }
  };


  const confirmUploadSwitch = async () => {
      const result = await Swal.fire({
        html: `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_orange.png" 
                 style="width: 18px; height: 18px;" />
            <span style="font-size:16px; font-weight:bold;">Entered domains will be cleared</span>
          </div>
          <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
            Switching to Upload File will clear the entered domains.
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Continue",
        cancelButtonText: "Cancel",
    
        confirmButtonColor: "#62903e",
        cancelButtonColor: "#ddd",
        width: 380,
        reverseButtons: true, // 👈 makes Confirm button appear first (left)
        customClass: {
          popup: "swal2-custom-size",
          confirmButton: "swal2-small-btn",
          cancelButton: "swal2-cancel-custom",
        },
      });
    
      if (result.isConfirmed) {
        setSelected("btn2");
      }
    };

    useEffect(() => {
      if (!isOpen) {
        setFormData({
          id: "",
          name: "",
          exchanges: [],
          list_type: "allowlist",
          domain_name: defaultDomains,
          uploadFile: null,
        });
        setErrors({});
        setSelected("btn1");
        setRemainingLines(2000);
      }
    }, [isOpen]);
  
  
    const UploadSwitch = async () => {
      const result = await Swal.fire({
        html: `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_orange.png" 
                 style="width: 18px; height: 18px;" />
            <span style="font-size:16px; font-weight:bold;">Entered domains will be cleared</span>
          </div>
          <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
            Switching to Upload File will clear the entered domains.
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Continue",
        cancelButtonText: "Cancel",
    
        confirmButtonColor: "#62903e",
        cancelButtonColor: "#ddd",
        width: 380,
        reverseButtons: true, // 👈 makes Confirm button appear first (left)
        customClass: {
          popup: "swal2-custom-size",
          confirmButton: "swal2-small-btn",
          cancelButton: "swal2-cancel-custom",
        },
      });
    
      if (result.isConfirmed) {
        setSelected("btn1");
      }
    };
  const getSelectedExchangeOptions = () => {
    return ssp.map(x => ({
      label: x,
      value: x.toLowerCase()
    }));
  };

  const addNewinventory = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: initialinventory?.id
        ? 'Do you want to update this Inventory?'
        : 'Do you want to save this Inventory?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: initialinventory?.id ? 'Yes, update it!' : 'Yes, save it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      await audiencesubmit();
      await delay(800);
      const successResult = await Swal.fire(
        'Success!',
        initialinventory?.id ? 'Inventory has been updated.' : 'Inventory has been created.',
        'success'
      );
      if (successResult.isConfirmed) {
        toggle();
      }
    } catch (error) {
      Swal.fire('Error!', 'Something went wrong.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, uploadFile: e.target.files[0] }));
    setErrors(prev => ({ ...prev, uploadFile: '' }));
  };

 
  const handleDownload = () => {
    if (!formData.domain_name) {
      Swal.fire("No data!", "No domains to download.", "warning");
      return;
    }

    const rows = formData.domain_name
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(domain => [domain]); // wrap each in array for CSV format

    let csvContent = "data:text/csv;charset=utf-8,Domain\n" + 
      rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `${formData.name || "domain_list"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
        <Modal
             isOpen={isOpen}
             toggle={toggle}
             centered
             id="domainModal"
             size="lg"
             backdrop="static"
             keyboard={false}
           >
        <Form onSubmit={addNewinventory}>
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary domain-modal-spinner" />
            </div>
          )}
          <div className="modal-header border-bottom">
            <Row className="w-100 align-items-center m-0">
            <Col md="6">
                  <span className="mb-0 subtittle">Edit Domain List</span>
                <br /> 
                <h5 className="modal-title">
                  {initialinventory?.name
                    ? `${initialinventory?.name}`
                    : ""}
                </h5>
              </Col>

              <Col md="6" className="text-end">
                <Button close onClick={toggle}></Button>
              </Col>
            </Row>
          </div>

          <ModalBody className="pt-3">
            {/* Name */}
            <Row className="mb-2">
              <Col md="12">
                <FormGroup>
                  <Label for="name">Name<span className='text-danger'>*</span></Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ''}
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
                </FormGroup>
              </Col>
            </Row>

            {/* List type */}
           <Row>
                      <Col md="12">
                        <FormGroup>
                          <Label>List Type</Label>
                          <div>
                            <Input
                              type="radio"
                              id="allowlist"
                              name="list_type"
                              value="allowlist"
                              checked={formData.list_type === "allowlist"}
                              onChange={handleChange}
                              className="me-1"
                            />
                            <Label className="me-4" htmlFor="allowlist">
                              Allowlist
                            </Label>
                            <Input
                              type="radio"
                              id="blocklist"
                              name="list_type"
                              value="blocklist"
                              checked={formData.list_type === "blocklist"}
                              onChange={handleChange}
                              className="me-1"
                            />
                            <Label htmlFor="blocklist">Blocklist</Label>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>

            
             {selected === "btn2" && (
                          <Row>
                              <Label><span>Upload a file containing domains. File must be a TXT or CSV with a maximum of 100,000 domains separated by line breaks and a maximum file size of 10MB. Upload another file to replace the previously uploaded file..</span></Label>
                            <FormGroup>
                             
                            </FormGroup>
                          </Row>
                        )}
                           {selected === "btn1" && (
                          <Row>
                              <Label><span>Enter up to 2,000 domains separated by line breaks.</span></Label>
                            <FormGroup>
                             
                            </FormGroup>
                          </Row>
                        )}

            {/* Buttons for domain/file input */}
                      <Row className="mb-2">
                           <Col>
                             <Button
                               size="sm"
                               id="btn1"
                               color={selected === "btn1" ? "primary" : "secondary"}
                               outline={selected !== "btn1"}
                               className="enterdomains"
                               onClick={() => UploadSwitch("#007bff")} // 🔹 blue for Enter Domains
                             >
                               Enter Domains
                             </Button>
         
                             <Button
                               size="sm"
                               id="btn2"
                               className="uploadfile"
                               color={selected === "btn2" ? "primary" : "secondary"}
                               outline={selected !== "btn2"}
                               onClick={() => confirmUploadSwitch("#62903e")} // 🔹 green for Upload File
                             >
                               Upload File
                             </Button>
                           </Col>
                         </Row>


                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <Label for="domain_name" className="d-flex justify-content-between">
                      
                        </Label>
                        <Input
                          type="textarea"
                          id="domain_names"
                          name="domain_names"
                          rows="10" // Optional: sets height
                          placeholder={`domain.com\nwww.domain.com\nmobile.app\n826482037\nscreen:id`}
                          value={formData.demo}
                          onChange={handleChange}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                                    

            {/* Domain textarea */}
            {selected === "btn1" && (
            <Row>
                            <Col md="12">
                            
                              <FormGroup>
                                <Label for="domain_name" className="d-flex justify-content-between">
                                  <span>
                                    Domains <span className="text-danger">*</span>
                                  </span>
                                  <span>{remainingLines}</span>
                                </Label>
                                <Input
                                  type="textarea"
                                  id="domain_name"
                                  name="domain_name"
                                  rows="6"
                                  onMouseEnter={() => errors.domain_name && setTooltipOpen((t) => ({ ...t, domain_name: true }))}
                                  onMouseLeave={() => setTooltipOpen((t) => ({ ...t, domain_name: false }))}
                                  value={formData.domain_name}
                                  onChange={handleChange}
                                  invalid={!!errors.domain_name}
                                />
                               {errors.domain_name && (
                                                                                                     
                                      <Tooltip
                                       placement="bottom"
                                      isOpen={tooltipOpen.domain_name}
                                      target="domain_name"
                                      autohide={false}
                                      container=".modal-content"
                                      popperClassName="custom-tooltip"
                                       >
                                      <div className="one"></div>
                                      {errors.domain_name}
                                      </Tooltip>                            
                                      )}
                              </FormGroup>
                            </Col>
                          </Row>
            )}

            {/* File upload */}
                    {selected === "btn2" && (
                      <Row>
                        <FormGroup>
                          <Label>Upload File <span className="text-danger">*</span></Label>
                          <Input
                            type="file"
                            onChange={handleFileChange}
                            invalid={!!errors.uploadFile}
                            className="formscontrol"
                          />
                          {/* {errors.uploadFile && <FormFeedback>{errors.uploadFile}</FormFeedback>} */}
                        </FormGroup>
                      </Row>
                    )}

              <Row>
                <a
                  href="#"
                  onClick={handleDownload}
                className="download"
                >
                  Download CSV
                </a>
              </Row>

          </ModalBody>

          <ModalFooter>
            <Button className="cancels" onClick={toggle}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="savebuttons"
            >
              {isLoading ? (
                <Spinner size="sm" />
              ) : initialinventory?.id ? (
                'Update Inventory'
              ) : (
                'Create Inventory'
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryConversionModal;
