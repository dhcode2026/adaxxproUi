import React, { useState, useEffect } from "react";
import {
  Button,
  ButtonGroup,
  FormGroup,
  Label,
  Row,
  Col
} from "reactstrap";

const SiteOrAppEditor = ({ value, change }) => {
  const [rSelected, setRSelected] = useState('');

  useEffect(() => {
    setRSelected(value ?? '');
  }, [value]);

  const setSelection = (selection) => {
    setRSelected(selection);
    change(selection);
  };

  const isNoneSelected = () => {
    return rSelected === '' || rSelected === undefined || rSelected === 'undefined';
  };

  const getColor = (isActive) => (isActive ? "primary" : "secondary");

  return (
    <Row className="align-items-center mb-3">
      <Col md="1">
        <Label className="mb-0">App/Site :</Label>
      </Col>
      <Col md="10">
        <ButtonGroup>
          <Button
            color={getColor(rSelected === "app")}
            onClick={() => setSelection("app")}
            active={rSelected === "app"}
          >
            App
          </Button>
          <Button
            color={getColor(rSelected === "site")}
            onClick={() => setSelection("site")}
            active={rSelected === "site"}
          >
            Site
          </Button>
          <Button
            color={getColor(isNoneSelected())}
            onClick={() => setSelection('')}
            active={isNoneSelected()}
          >
            Both
          </Button>
        </ButtonGroup>
      </Col>
    </Row>
  );
};

export default SiteOrAppEditor;
