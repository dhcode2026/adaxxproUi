import React, { useState, useEffect } from "react";
import {
  Badge, Button, ButtonGroup, ButtonToolbar, Card,
  CardHeader, CardBody, CardFooter, CardText, CardTitle,
  Form, FormGroup, Input, Table, Label, Row, Col, Spinner
} from "reactstrap";

import LeafMap from "../LeafMap.jsx";
import GeoEditor from "./GeoEditor";
import { useViewContext } from "../../ViewContext";
import { undef, blackStyle, whiteStyle, stringify } from "../../Utils";
import { useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ops = [
  "DOMAIN", "EQUALS", "EXISTS", "GREATER THAN", "GREATER THAN EQUALS", "IDL",
  "INRANGE", "INTERSECTS", "LESS THAN", "LESS THAN EQUALS", "MEMBER", "NOT DOMAIN",
  "NOT EXISTS", "NOT IDL", "NOT INRANGE", "NOT INTERSECTS", "NOT EQUALS",
  "NOT MEMBER", "NOT REGEX", "NOT STRING", "REGEX", "STRINGIN"
];

const types = ["integer", "string", "double"];
const ords = ["scalar", "list"];

const RuleEditor = (props) => {
  const navigate = useNavigate();
  const vx = useViewContext();

  const [showMap, setShowMap] = useState(false);
  const [geo, setGeo] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState([44.414165, 8.942184]);
  const [isLoading, setIsLoading] = useState(false);
  const [visible, setVisible] = useState(true);

  const [rule, setRule] = useState({
    id: props.rule?.id || 0,
    name: props.rule?.name || '',
    operand: props.rule?.operand || '',
    operand_type: props.rule?.operand_type || 'string',
    operand_ordinal: props.rule?.operand_ordinal || 'scalar',
    rtbspecification: props.rule?.rtbspecification || '',
    op: props.rule?.op || '',
    notPresentOk: props.rule?.notPresentOk ?? true,
    readOnly: props.rule?.readOnly ?? false
  });

  useEffect(() => {
    if (!props.rule) return;

    if (props.rule.op === 'IDL' || props.rule.op === 'NOT IDL') {
      setVisible(false);
    }

    if (props.rule.op === 'INRANGE') {
      const parts = props.rule.operand?.split(",") || [];
      if (parts.length > 0) {
        const x = parts.map(Number);
        setZoom(8);
        setGeo(x);
        setCenter([x[0], x[1]]);
      }
      setShowMap(true);
    }
  }, [props.rule]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setRule(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;

    if (id === 'required') {
      setRule(prev => ({ ...prev, notPresentOk: value !== 'true' }));
    } else {
      setRule(prev => ({ ...prev, [id]: value }));
    }

    if (id === 'operator') opchange(e);
  };

  const opchange = (e) => {
    const op = e.target.value;

    if (op === 'INRANGE') {
      setRule(prev => ({ ...prev, rtbspecification: 'device.geo' }));
      setShowMap(true);
    } else if (op === 'IDL' || op === 'NOT IDL') {
      setRule(prev => ({ ...prev, rtbspecification: 'user.ext.eids' }));
      setVisible(false);
    } else {
      setVisible(true);
      setShowMap(false);
    }
  };

  const completeMap = (pos) => {
    if (pos === undef) {
      pos = getOldGeoValues();
      setGeo(pos);
    } else {
      const str = pos.join(",");
      setRule(prev => ({ ...prev, operand: str }));
    }
  };

  const getOldGeoValues = () => {
    const parts = props.rule.operand.split(",");
    const x = parts.map(Number);
    setGeo(x);
    setCenter([x[0], x[1]]);
    return x;
  };

  const addNewRule = () => {
    setIsLoading(true);
    const updatedRule = { ...rule, value: undefined };

    setTimeout(() => {
      if (props.callback) {
        props.callback(updatedRule);
      } else {
        navigate("/admin/rules");
      }
      setIsLoading(false);
    }, 2000);
  };

  return (
    <>
      <div className="content" style={{ position: "relative" }}>
        {isLoading && (
          <div className="loader-overlay">
            <Spinner color="primary" style={{ width: "4rem", height: "4rem" }} />
          </div>
        )}
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <h5 className="title">Edit Rule Details</h5>
              </CardHeader>
              <CardBody>
                <Form>
                  <Row>
                    <Col md="2">
                      <FormGroup>
                        <label>SQL ID (disabled)</label>
                        <Input
                          style={document.body.classList.contains("white-content") ? blackStyle : whiteStyle}
                          value={rule.id}
                          disabled
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup>
                        <label>Name</label>
                        <Input
                          id="name"
                          value={rule.name}
                          onChange={handleInputChange}
                          placeholder="Target Name (Required)"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup>
                        <label>Required</label>
                        <Input
                          type="select"
                          id="required"
                          value={rule.notPresentOk ? "false" : "true"}
                          onChange={handleSelectChange}
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="4">
                      <FormGroup>
                        <label>RTB Specification</label>
                        <Input
                          type="text"
                          id="rtbspecification"
                          value={rule.rtbspecification}
                          onChange={handleInputChange}
                        />
                      </FormGroup>
                    </Col>
                    <Col md="4">
                      <FormGroup>
                        <label>Operator</label>
                        <Input
                          type="select"
                          id="operator"
                          value={rule.op}
                          onChange={handleSelectChange}
                        >
                          {ops.map((x) => (
                            <option key={x} value={x}>{x}</option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>

                  {showMap ? (
                    <GeoEditor
                      rule={true}
                      callback={completeMap}
                      setGeo={setGeo}
                      geo={geo}
                      setZoom={setZoom}
                      zoom={zoom}
                      center={center}
                      setCenter={setCenter}
                    />
                  ) : (
                    <Row>
                      <Col md="3">
                        <FormGroup>
                          <label>Operand Value</label>
                          <Input
                            type="text"
                            id="operand"
                            value={rule.operand}
                            onChange={handleInputChange}
                          />
                        </FormGroup>
                      </Col>
                      {visible && (
                        <>
                          <Col md="3">
                            <FormGroup>
                              <label>Operand Type</label>
                              <Input
                                type="select"
                                id="operand_type"
                                value={rule.operand_type}
                                onChange={handleSelectChange}
                              >
                                {types.map((x) => (
                                  <option key={x} value={x}>{x}</option>
                                ))}
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col md="3">
                            <FormGroup>
                              <label>Operand Ordinal</label>
                              <Input
                                type="select"
                                id="operand_ordinal"
                                value={rule.operand_ordinal}
                                onChange={handleSelectChange}
                              >
                                {ords.map((x) => (
                                  <option key={x} value={x}>{x}</option>
                                ))}
                              </Input>
                            </FormGroup>
                          </Col>
                        </>
                      )}
                    </Row>
                  )}
                </Form>
              </CardBody>
              <CardFooter>
                <Button
                  className="btn-fill"
                  color="primary"
                  type="button"
                  onClick={addNewRule}
                  disabled={rule.readOnly}
                >
                  Save
                </Button>
                <Button
                  className="btn-fill"
                  color="danger"
                  type="button"
                  onClick={() => {
                    if (props.callback) {
                      props.callback(null);
                    } else {
                      navigate("/admin/rules");
                    }
                  }}
                >
                  Discard
                </Button>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default RuleEditor;
