import React, { useState } from "react";
import {
  Button,
  ButtonGroup,
  FormGroup,
  Input,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  Label
} from "reactstrap";

const DealEditor = (props) => {
  const [rSelected, setRSelected] = useState(props.creative.dealType);

  const setDealSelection = (r) => {
    setRSelected(r);
    if (r !== 1 && (!props.creative.deals || props.creative.deals.length === 0)) {
      makeNewDeal();
    }
    props.selector(r);
  };

  const removeDeal = (i) => {
    alert("REMOVE: " + i);
    var deals = props.creative.deals;
    deals.splice(i,1);
    props.setdeals(deals);
  }

  const makeNewDeal = () => {
    const updatedDeals = props.creative.deals ? [...props.creative.deals] : [];
    updatedDeals.push({ id: '', price: 0.1 });
    props.setdeals(updatedDeals);
  };

  const colorize = (x) => (x ? "primary" : "secondary");

  const getDealsView = () => {
    if (rSelected === 1) return null;
    if (!props.creative.deals || props.creative.deals.length === 0) makeNewDeal();

    return (
      <Row className="mt-3">
        {props.creative.deals.map((deal, index) => (
          <Col md="6" key={index} className="mb-3">
            <Card>
              <CardBody>
                <CardTitle tag="h5">Deal #{index + 1}</CardTitle>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label>Deal ID</Label>
                      <Input
                        id={`deal-id-${index}`}
                        onChange={(e) => props.changeDeal(index, 'id', e.target.value)}
                        placeholder="Enter Deal ID"
                        defaultValue={deal.id}
                        type="text"
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      
                      <Label>Price ECPM</Label>
                      <Input
                        id={`deal-price-${index}`}
                        onChange={(e) => props.changeDeal(index, 'price', e.target.value)}
                        placeholder="Enter Price"
                        defaultValue={deal.price}
                        type="number"
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Button color="danger" size="sm" onClick={() => removeDeal(index)}>
                  Remove
                </Button>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <>
      <Row className="mb-3">
        <Col md="1">
          <label className="form-label me-2">Deals:</label>
          </Col>
          <Col md="8">
          <ButtonGroup>
            <Button
              color={colorize(rSelected === 1)}
              onClick={() => setDealSelection(1)}
              active={rSelected === 1}
            >
              No Deal
            </Button>
            <Button
              color={colorize(rSelected === 2)}
              onClick={() => setDealSelection(2)}
              active={rSelected === 2}
            >
              Private Only
            </Button>
            <Button
              color={colorize(rSelected === 3)}
              onClick={() => setDealSelection(3)}
              active={rSelected === 3}
            >
              Private Preferred
            </Button>
            {rSelected > 1 && (
              <Button color="success" size="sm" onClick={makeNewDeal}>
                + Add Deal
              </Button>
            )}
          </ButtonGroup>
        </Col>
      </Row>

      {getDealsView()}
    </>
  );
};

export default DealEditor;
