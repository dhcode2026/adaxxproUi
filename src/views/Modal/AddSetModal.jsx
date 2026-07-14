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
  FormFeedback,
  Tooltip
} from 'reactstrap';
import Swal from 'sweetalert2';
import { useViewContext } from '../../ViewContext';
import { saveAddset, updateAudience } from "../../views/api/Api.jsx";

const AddSetModal = (props) => {
  const { isOpen, toggle, audience: initialaddset, callback } = props;
  const [isLoading, setIsLoading] = useState(false);
  const nameInputRef = useRef(null);
  const [focusedField, setFocusedField] = useState(null);
  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
  });

  const [formData, setFormData] = useState({
    id: initialaddset?.id || '',
    name: initialaddset?.name || '',
  });

  const [errors, setErrors] = useState({});
  const context = useViewContext();
  useEffect(() => {
    setFormData({
      id: initialaddset?.id || '',
      name: initialaddset?.name || '',
    });
    setErrors({});
  }, [initialaddset]);
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    setFormData({
      id: initialaddset?.id || '',
      name: initialaddset?.name || '',
      notes: initialaddset?.notes || '',
    });
    setErrors({});
  }, [initialaddset]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
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

    if (!formData.name.trim()) {
      newErrors.name = 'This field is required';
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      nameInputRef.current?.focus();
      await showValidationError();
    }

    return isValid;
  };


  const submitAddset = async () => {
    try {
      const payload = {
        name: formData.name.trim(),
      };
      if (!formData.id) {
        const response = await saveAddset(payload);
        callback?.(response.data);
        return response.data;
      }
      else {
        const response = await updateAudience(formData.id, payload);
        callback?.(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const addNewaddset = async (e) => {
      e.preventDefault();
  
      const isValid = await validateForm();
      if (!isValid) return;
  
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: initialaddset?.id
          ? 'Do you want to update this Audience?'
          : 'Do you want to save this Audience?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: initialaddset?.id ? 'Yes, update it!' : 'Yes, save it!',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#62903e',
        width: 380,
      });
      
      if (!result.isConfirmed) return;
      
      setIsLoading(true);
      try {
        await submitAddset();
        await delay(500);
  
        await Swal.fire(
          'Success!',
          initialaddset?.id
            ? 'Addset has been updated.'
            : 'Addset has been created.',
          'success'
        );
        toggle();
        resetForm();
      } catch (error) {
        console.error(error);
        await Swal.fire('Error', error.message || 'Something went wrong.', 'error');
      } finally {
        setIsLoading(false);
      }
    };




  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
    });
    setErrors({});
  };
  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      backdrop="static"
      keyboard={false}
      centered
      className="audience-modal"
      size="md"
      onOpened={() => nameInputRef.current?.focus()}
    >
      <Form onSubmit={addNewaddset} autocomplete="off">
        {isLoading && (
          <div className="loader-overlay">
            <Spinner color="primary" style={{ width: '4rem', height: '4rem' }} />
          </div>
        )}
        <div className="modal-header border-bottom editable">
          <h5 className="modal-title mb-0 headingtittle">
            Save As New Set
          </h5>
          <Button close onClick={toggle} />
        </div>
        <ModalBody className='addsetmodal'>
          <FormGroup>
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
          </FormGroup>
        </ModalBody>

        <ModalFooter>
          <Button className="cancels" onClick={toggle}>
            Cancel
          </Button>
          <Button className="savebuttons" type="submit" disabled={isLoading}>
            {isLoading ? (
              <Spinner size="sm" />
            ) : initialaddset?.id ? (
              'Update Add Set'
            ) : (
              'Save Set'
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default AddSetModal;
