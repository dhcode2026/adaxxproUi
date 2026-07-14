import React, { useState } from "react";
import {
  Button,
  ButtonGroup,
  FormGroup,
  Input,
  Label,
  Row,
  Col
} from "reactstrap";

const CreativeSizeEditor = (props) => {
  const [rSelected, setRSelected] = useState(props.creative.sizeType);

  const setSelection = (r) => {
    if (r === 1) {
      props.callback(null, "width");
      props.callback(null, "height");
    }
    setRSelected(r);
    props.selector(r);
  };

  const colorize = (isSelected) => (isSelected ? "primary" : "secondary");

  return (
    <>
      {/* Size Type Selector */}
      <FormGroup className="mb-4">
        <Row className="align-items-center">
          <Col md="1">
            <Label className="mb-0">Match Size:</Label>
          </Col>
          <Col md="10">
            <ButtonGroup>
              <Button color={colorize(rSelected === 1)} onClick={() => setSelection(1)} active={rSelected === 1}>
                Any
              </Button>
              <Button color={colorize(rSelected === 2)} onClick={() => setSelection(2)} active={rSelected === 2}>
                Specified
              </Button>
              <Button color={colorize(rSelected === 3)} onClick={() => setSelection(3)} active={rSelected === 3}>
                W/H Ranges
              </Button>
              <Button color={colorize(rSelected === 4)} onClick={() => setSelection(4)} active={rSelected === 4}>
                W/H List
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
      </FormGroup>

      {/* Specified Width and Height */}
      {rSelected === 2 && (
        <Row className="mb-4">
          <Col md="6">
            <FormGroup>
              <Label for="fixed-width">Width</Label>
              <Input
                id="fixed-width"
                defaultValue={props.creative.width}
                onChange={(e) => props.callback(e, "width")}
                type="number"
              />
            </FormGroup>
          </Col>
          <Col md="6">
            <FormGroup>
              <Label for="fixed-height">Height</Label>
              <Input
                id="fixed-height"
                defaultValue={props.creative.height}
                onChange={(e) => props.callback(e, "height")}
                type="number"
              />
            </FormGroup>
          </Col>
        </Row>
      )}

      {/* Width/Height Ranges */}
      {rSelected === 3 && (
        <Row className="mb-4">
          <Col md="6">
            <FormGroup>
              <Label for="width-range">Width Range (e.g. 100-500)</Label>
              <Input
                id="width-range"
                defaultValue={props.creative.width_range}
                placeholder="e.g. 100-500"
                onChange={(e) => props.callback(e, "width_range")}
                type="text"
              />
            </FormGroup>
          </Col>
          <Col md="6">
            <FormGroup>
              <Label for="height-range">Height Range (e.g. 100-500)</Label>
              <Input
                id="height-range"
                defaultValue={props.creative.height_range}
                placeholder="e.g. 100-500"
                onChange={(e) => props.callback(e, "height_range")}
                type="text"
              />
            </FormGroup>
          </Col>
        </Row>
      )}

      {/* Width x Height List */}
      {rSelected === 4 && (
        <FormGroup className="mb-4">
          <Label for="wh-list">List of Width x Height (one per line)</Label>
          <Input
            id="wh-list"
            type="textarea"
            rows="4"
            placeholder="300x250&#10;728x90&#10;160x600"
            onChange={(e) => props.callback(e, "width_height_list")}
            defaultValue={props.creative.width_height_list}
          />
        </FormGroup>
      )}
    </>
  );
};

export default CreativeSizeEditor;
