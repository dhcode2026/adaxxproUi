import React, { useState, useEffect } from "react";

// reactstrap components
import {
  Badge,
  Button,
  ButtonGroup,
  ButtonToolbar,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
   Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Row,
  Col,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import { FaEdit, FaTrash, FaCog, FaCaretUp, FaCaretDown } from "react-icons/fa";

var undef;

const RulesView = (props) => {
  const vx = useViewContext();

   const RuleActionsCell = ({ data }) => {
    const row = data.row;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);

    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle
          tag="span"
          style={{
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 3px",
            backgroundColor: "#fff",
            color: "#8a8a8a",
          }}
        >
          <FaCog style={{ marginRight: "5px" }} />
          <FaCaretDown />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={() => props.editRule(row.id)}>
            Edit Brand
          </DropdownItem>
          <DropdownItem onClick={(e) => props.deleteRule(row.id)}>
            Delete Brand
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  const getRulesView = () => {
    if (vx.rules === undef) return null;

    var rules = vx.rules;
    rules.sort(function (a, b) {
      a = a.customer_id + a.name;
      b = b.customer_id + b.name;
      return (a > b) - (a < b);
    });
    return rules.map((row, index) => (
      <tr key={"rulesview-" + row}>
        <td>{index}</td>
        <td key={"rules-name-" + index} className="text-left">
          {row.name}
        </td>
        {vx.user.sub_id === "superuser" && (
          <td key={"rules-cust-" + index} className="text-left">
            {row.customer_id}
          </td>
        )}
        <td key={"rules-id-" + index} className="text-right">
          {row.id}
        </td>
        <td key={"rules-hierarchy" + index} className="text-right">
          {row.hierarchy}
        </td>
        <td key={"rules-edit-" + index} className="text-center">
          <Button
            color="success"
            size="sm"
            onClick={() => props.viewRule(row.id)}
          >
            View
          </Button>
          &nbsp;
          <Button
            color="warning"
            size="sm"
            onClick={() => props.editRule(row.id)}
          >
            Edit
          </Button>
          &nbsp;
          <Button
            color="danger"
            size="sm"
            onClick={() => props.deleteRule(row.id)}
          >
            Delete
          </Button>
        </td>
      </tr>
    ));
  };

  return (
    <Row>
      <Col xs="12">
        <div className="row mb-3">
          <div className="col-xl-12 col-lg-12">
            <Row className="inventory-row m-0 p-0">
              <Col xs="12" className="m-0 p-0">
                <div className="d-flex justify-content-center m-0 p-0">
                  <strong className="h5 w-100 text-center border border-1 py-1 mb-1">
                    <i className="tim-icons icon-bank me-2"></i>
                    Rules
                  </strong>
                </div>
              </Col>
            </Row>
            <Button
              size="sm"
              style={{ float: "right" }}
              className="btn-fill"
              color="error"
              onClick={props.refresh}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              style={{ float: "right" }}
              className="btn-fill"
              color="success"
              onClick={props.makeNew}
            >
              New
            </Button>
          </div>
        </div>
       
            <table className="table table-bordered table-hover w-100 h-100">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th className="text-center">Name</th>
                  {vx.user.sub_id === "superuser" && (
                    <th className="text-center">Customer</th>
                  )}
                  <th className="text-right">SQL-ID</th>
                  <th className="text-right">Hierarchy</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>{getRulesView()}</tbody>
            </table>
          
      </Col>
    </Row>
  );
};

export default RulesView;
