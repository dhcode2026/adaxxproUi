import React, { useState, useRef } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Row,
  Col,
  Input,
} from "reactstrap";
import { FaInfoCircle } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { IoMdClose } from "react-icons/io";

const LinkAdsModal = ({ isOpen, toggle }) => {
  const [domainlistdata, setdomainlistdata] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const childRef = useRef();

  const updateChild = (data) => {
    childRef.current?.updateValue(data);
  };

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: '#62903e !important',
        '& .gOorhn': {
          color: 'white !important',
        }
      },
    },
  ];
  const customStyles = {
    table: {
      style: {
        backgroundColor: '#f8f9fa',
        height: '100%',
        border: '1px solid #d4d4d4',          // 👈 adds outer border
      },
    },
    headRow: {
      style: {
        fontSize: "10px",
        color: "rgb(116, 116, 116)",
        fontWeight: "600",

      },
    },
    headCells: {
      style: {
        borderRight: '1px solid #d4d4d4',

      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        fontSize: "11px",
        fontWeight: "600",
        color: "rgb(48, 48, 48)",

      },
    },
    rows: {
      style: {},
    },
  };

  const NoDatadomainComponent = () => (
    <div className="nodatafound">
      <div className="py-4 text-secondary">
        <br />

        No data found
      </div>
    </div>
  );

  const CustomLoader = () => <></>;

  const domiancolumns = [
    {
      name: "Name",
      sortable: true,
      grow: 1,
      width: "350px",
      selector: (row) => row.name,
    },
    {
      name: "ID",
      sortable: true,
      grow: 10,
      selector: (row) => row.listType,
      width: "50px",
    },
    {
      name: "",
      grow: 1,

      selector: (row) => (
        <span>
          <IoMdClose
            onClick={() => {
              setdomainlistdata((exi_item) => exi_item.filter(item => item.id !== row.id));
              updateChild(row);
            }}
          />
        </span>
      ),
      width: "30px",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      size="lg"
      centered
      backdrop="static"
      keyboard={false}
      className="linkadsmodal"
    >
      <ModalHeader toggle={toggle}>Link Ads</ModalHeader>
      <ModalBody className=" p-0">
        <Row className="linkads mt-2">
          <Col className="linklftspace">
            <Row>
              <div className="py-1 selinv-header p-0">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <label className="fw-semibold ftlink">Ads</label>
                  </div>
                </div>
              </div>
            </Row>
            <Row>
              <div className="container-fluid py-1 selinv-header p-0">
                <Row>
                  <Col sm="12" md="8">
                    <Input
                      className="formscontrol py-1 px-1 rounded-0 adsheight custom-select-input"
                      type="text"
                      placeholder="Search..."
                      id="linksearch"
                    />
                  </Col>
                  <Col sm="12" md="2"></Col>
                  <Col sm="12" md="2">
                    <span className="zeroads"> 0 Ads</span>
                  </Col>
                </Row>
              </div>
            </Row>

            <Row>
              <div className="linkat p-0">
                <DataTable
                  columns={domiancolumns}
                  data={domainlistdata}
                  progressPending={loading}
                  progressComponent={<CustomLoader />}
                  striped
                  dense
                  fixedHeader
                  highlightOnHover
                  persistTableHead
                  conditionalRowStyles={conditionalRowStyles}
                  customStyles={customStyles}
                  noDataComponent={<NoDatadomainComponent />}
                />
              </div>
            </Row>
          </Col>

          <Col className="linkritspace">
            <Row>
              <div className="py-1 selinv-header p-0">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <label className="fw-semibold ftlink">Linked Ads</label>
                  </div>
                </div>
              </div>
            </Row>
            <Row>
              <div className="container-fluid py-1 selinv-header p-0">
                <Row>
                  <Col sm="12" md="3">
                    <Button
                      type="button"
                      className="py-1 px-2 rounded-0 custom-select-input"
                      id="export"
                    >
                      <span className="lasttime">Unlink All</span>
                    </Button>
                  </Col>
                  <Col sm="12" md="7"></Col>
                  <Col sm="12" md="2">
                    <span className="zeroads"> 0 Ads</span>
                  </Col>
                </Row>
                <div className="linkat p-0 mt-1">
                  <DataTable
                    columns={domiancolumns}
                    data={domainlistdata}
                    progressPending={loading}
                    progressComponent={<CustomLoader />}
                    striped
                    dense
                    fixedHeader
                    highlightOnHover
                    persistTableHead
                    conditionalRowStyles={conditionalRowStyles}
                    customStyles={customStyles}
                    noDataComponent={<NoDatadomainComponent />}
                  />
                </div>
              </div>
            </Row>
            <Row>
              <div className="p-0 linkat"></div>
            </Row>
          </Col>
        </Row>
        <div className="d-flex align-items-start px-4 mt-2">
          <FaInfoCircle className="me-2 text-info" />
          <p className="ftlink">
            Looking to upload an Ad? Check out the My Ads screen for all Ad
            related management!
          </p>
        </div>
      </ModalBody>
      <ModalFooter className="wizard-footer">
        <Button className="cancels" onClick={toggle}>
          Cancel
        </Button>
        <Button className="savebuttons">Done</Button>
      </ModalFooter>
    </Modal>
  );
};

export default LinkAdsModal;