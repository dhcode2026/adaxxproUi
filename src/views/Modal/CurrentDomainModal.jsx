import React, { useState, useRef, useEffect, useMemo } from "react";
import {
    Modal,
    ModalBody,
    ModalFooter,
    Button,
    Row,
    Col,
    Input,
} from "reactstrap";
import DataTable from "react-data-table-component";
import { getAllDomainlist } from "../../views/api/Api";
const CurrentDomainModal = ({ isOpen, toggle }) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("")
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const filteredData = useMemo(() => {
        return rowData.filter((item) =>
            item.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [rowData, searchTerm]);;
    const handleCheckboxChange = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(itemId => itemId !== id);
            } else {
                return [...prev, id];
            }
        });
    };
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    const customStyles = {
        table: {
            style: {
                backgroundColor: '#f8f9fa',
                height: '100%',
            },
        },
        headRow: {
            style: {},
        },
        headCells: {
            style: {
                borderRight: '1px solid #d4d4d4',
                borderTop: '1px solid #d4d4d4',
                '&:first-of-type': {
                    paddingLeft: '16px',
                },
                '&:last-of-type': {
                    borderRight: 'none',
                },
            },
        },
        cells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
                '&:first-of-type': {
                    paddingLeft: '16px',
                },
            },
        },
        rows: {
            style: {},
        },
    };

    const NameCell = ({ row }) => {
        const isSelected = selectedIds.includes(row.id);
        return (
            <div
                className="gOorhn"
                style={isSelected ? {
                    color: 'white !important',
                    backgroundColor: 'transparent'
                } : {}}
            >
                {row.name}
            </div>
        );
    };

    const DomainCell = ({ row }) => {
        const isSelected = selectedIds.includes(row.id);
        return (
            <div
                className="gOorhn"
                style={isSelected ? {
                    color: 'white !important',
                    backgroundColor: 'transparent'
                } : {}}
            >
                {row.domainListCount}
            </div>
        );
    };

    const TypeCell = ({ row }) => {
        const isSelected = selectedIds.includes(row.id);
        return (
            <div
                className="gOorhn"
                style={isSelected ? {
                    color: 'white !important',
                    backgroundColor: 'transparent'
                } : {}}
            >
                {row.listType}
            </div>
        );
    };
    const columns = [
        {
            name: (
                <></>
            ),
            cell: (row) => {
                return (
                    <Input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => {
                            e.stopPropagation();
                            handleCheckboxChange(row.id);
                        }}
                    />
                );
            },
            width: "30px",
        },

        {
            name: "Name",
            selector: (row) => row.name,
            cell: (row) => <NameCell row={row} />,
            sortable: true,
            grow: 2,

        },

        {
            name: "Type",
            selector: (row) => row.name,
            cell: (row) => <TypeCell row={row} />,
            sortable: true,
            grow: 2,

        },
        {
            name: "URL Count",
            selector: (row) => row.name,
            cell: (row) => <DomainCell row={row} />,
            sortable: true,
            grow: 2,

        },
        {
            name: "",
            width: "20px",
        },
    ];

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

    const fetchDomainSetList = async () => {
        setLoading(true);
        try {
            const res = await getAllDomainlist();
            const list = res?.data?.data?.informationDomainList || [];
            console.log("API Response:", list);
            const formatted = list.map((item) => ({
                id: item.domainListId || item.id || item.domainListId,
                name: item.name || item.name || "Unnamed Domain",
                domainListCount: item.domainListCount || item.domainListCount || "1",
                listType: item.listType || item.listType || "Unnamed Domain",
                originalData: item
            }));

            console.log("Formatted data:", formatted);
            setRowData(formatted);
        } catch (err) {
            console.error("Error fetching exchanges:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchDomainSetList();
        }
    }, [isOpen]);

    const CustomLoader = () => (
        <div className="customloader" >
            <div className="loader" role="status"></div>
            <span className="ms-2 fw-bold">Loading...</span>
        </div>
    );

    const NoDataComponent = () => (
        <div
            className="nodataavilable"
        >
            <div className="py-4 fw-bold text-secondary">
                {"No data available"}
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            toggle={toggle}
            size="lg"
            centered
            className="addset"
        >

            <div className="modal-header border-bottom editable">
                <h5 className="modal-title mb-0 headingtittle">
                    Add to Current Domain List
                </h5>
                <Button close onClick={toggle} />
            </div>
            <ModalBody
                className="p-0"
            >
                <Row className="linkads">
                    <Col xs="12" className="h-100 d-flex flex-column">
                        <Row className="align-items-center mt-2 mb-2 sltgt">
                            <div role="alert" className="waringsiconcurrent">&nbsp;&nbsp;&nbsp;
                                <i className="fa fa-warning me-2" id="warningicon"></i>
                               These changes will affect campaigns using the selected domain list
                            </div>
                            <Col md="10" sm="6" className="p-0 ms-2 " id="maximing">
                                <div className="position-relative ms-2 mt-2">
                                    <Input
                                        className="form-control py-1 px-1 rounded-0 adsheight custom-select-input current-domain-search-input"
                                        type="text"
                                        id="seaching"
                                        placeholder="search by Name..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                    />
                                </div>
                            </Col>
                        </Row>
                        <div className="flex-grow-1 position-relative current-domain-table-shell">

                            <DataTable
                                columns={columns}
                                data={filteredData}
                                progressPending={loading}
                                progressComponent={<CustomLoader />}
                                striped
                                dense
                                fixedHeader
                                fixedHeaderScrollHeight="100%"
                                highlightOnHover
                                persistTableHead
                                conditionalRowStyles={conditionalRowStyles}
                                customStyles={customStyles}
                                noDataComponent={<NoDataComponent />}
                                onRowClicked={(row) => {
                                    handleCheckboxChange(row.id);
                                }}
                            />
                        </div>
                    </Col>
                </Row>
            </ModalBody>
            <ModalFooter className="wizard-footer">
                <Button className="cancels" onClick={toggle}>
                    Cancel
                </Button>
                <Button className="savebuttons">Add to Domain List</Button>
            </ModalFooter>
        </Modal>
    );
};

export default CurrentDomainModal;