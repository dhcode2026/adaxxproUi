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
  Tooltip
} from 'reactstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useViewContext } from '../../ViewContext';
import { saveAudience, updateAudience } from "../../views/api/Api.jsx";
const AudienceModal = (props) => {
  const { isOpen, toggle, audience: initialaudience, callback, brandId } = props;
  const [isLoading, setIsLoading] = useState(false);
  const nameInputRef = useRef(null);
  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
  });
  
  const [formData, setFormData] = useState({
    id: initialaudience?.id || '',
    name: initialaudience?.name || '',
    notes: initialaudience?.notes || '',
  });
  
  const [errors, setErrors] = useState({});
  const context = useViewContext();

  useEffect(() => {
    setFormData({
      id: initialaudience?.id || '',
      name: initialaudience?.name || '',
      notes: initialaudience?.notes || '',
    });
    setErrors({});
  }, [initialaudience]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

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
    if (!formData.id && !brandId) {
      newErrors.brandId = 'Brand ID is required for new audience';
      isValid = false;
    }
    setErrors(newErrors);
    if (!isValid) {
      nameInputRef.current?.focus();
      await showValidationError();
    }
    return isValid;
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      notes: '',
    });
    setErrors({});
  };

  const submitAudience = async () => {
    try {
      const payload = {
        name: formData.name.trim(),
        notes: formData.notes.trim() || null
      };
      if (!formData.id) {
        if (!brandId) {
          throw new Error('Brand ID is required for new audience');
        }
        const response = await saveAudience(brandId, payload);
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

  const addNewaudience = async (e) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: initialaudience?.id
        ? 'Do you want to update this Audience?'
        : 'Do you want to save this Audience?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: initialaudience?.id ? 'Yes, update it!' : 'Yes, save it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#62903e',
      width: 380,
    });
    
    if (!result.isConfirmed) return;
    
    setIsLoading(true);
    try {
      await submitAudience();
      await delay(500);

      await Swal.fire(
        'Success!',
        initialaudience?.id
          ? 'Audience has been updated.'
          : 'Audience has been created.',
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
      <Form onSubmit={addNewaudience} autoComplete="off">
        {isLoading && (
          <div className="loader-overlay">
            <Spinner color="primary" style={{ width: '4rem', height: '4rem' }} />
          </div>
        )}

        <div className="modal-header border-bottom editable">
          <h5 className="modal-title mb-0 headingtittle">
            {initialaudience?.id ? 'Edit Audience' : 'New Audience'}
            {/* {brandId && !initialaudience?.id && (
              <span className="ms-2 badge bg-secondary" style={{ fontSize: '0.65rem' }}>
                Brand ID: {brandId}
              </span>
            )} */}
          </h5>
          <Button close onClick={toggle} />
        </div>

        <ModalBody>
         
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

          <FormGroup>
            <Label for="notes">Notes</Label>
            <Input
              type="textarea"
              id="notes"
              name="notes"
              rows="5"
              value={formData.notes}
              onChange={handleChange}
            />
          </FormGroup>
        </ModalBody>

        <ModalFooter>
          <Button className="cancels" onClick={toggle}>
            Cancel
          </Button>
          <Button
            className="savebuttons"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                {formData.id ? 'Updating...' : 'Creating...'}
              </>
            ) : formData.id ? (
              'Update Audience'
            ) : (
              'Create Audience'
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default AudienceModal;