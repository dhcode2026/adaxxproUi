import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormGroup,
  Input,
  Label,
  Row,
  Col
} from 'reactstrap';

const TargetModal = ({ isOpen, toggle }) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} className="locationmodal" centered>
      <ModalHeader toggle={toggle}>Select Geopolitical Targets</ModalHeader>
      <ModalBody>
        <Row>
          <Col md="8">
            <FormGroup>
              <Label>Location Name</Label>
              <Input type="text" />
            </FormGroup>
          </Col>
          <Col md="4">
            <FormGroup>
              <Label>Bidder Status</Label>
              <Input type="select" id="statusSelect">
                <option value="">Select</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Input>
            </FormGroup>
          </Col>
        </Row>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={toggle}>Save</Button>
        <Button color="secondary" onClick={toggle}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );
};

export default TargetModal;
