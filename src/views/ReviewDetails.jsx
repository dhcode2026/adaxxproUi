import React, { useState } from "react";
import DataTable from "react-data-table-component";
import { useParams } from "react-router-dom";
import {
    Button,
    Input,
    InputGroup,
    InputGroupText,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Card,
    CardBody
} from "reactstrap";
import { FaChartBar, FaSearch, FaExternalLinkAlt, FaCaretDown, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../assets/css/creatives.css";

const ReviewDetails = () => {
    const { brandId } = useParams();
    const [searchText, setSearchText] = useState("");
    const toggle = () => setDropdownOpen(!dropdownOpen);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const [selectedCreative, setSelectedCreative] = useState(null);
    const [bannerModalOpen, setBannerModalOpen] = useState(false);
    const toggleBannerModal = () => setBannerModalOpen(!bannerModalOpen);
    const [audioModalOpen, setAudioModalOpen] = useState(false);
    const toggleAudioModal = () => setAudioModalOpen(!audioModalOpen);
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const toggleVideoModal = () => setVideoModalOpen(!videoModalOpen);
    const [nativeModalOpen, setNativeModalOpen] = useState(false);
    const toggleNativeModal = () => setNativeModalOpen(!nativeModalOpen);
    const [currentBrandId, setCurrentBrandId] = useState(brandId || null);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedBrandName, setSelectedBrandName] = useState("");
    const [isShown, setIsShown] = useState(false);

    const AudienceActionsCell = ({ row }) => {
        const [dropdownOpen, setDropdownOpen] = useState(false);
        const toggle = () => setDropdownOpen(!dropdownOpen);

        return (
            <Dropdown isOpen={dropdownOpen} toggle={toggle}>
                <DropdownToggle tag="span" className="settings">
                    <FaCog className="creative-icon-margin-right" />
                    <FaCaretDown />
                </DropdownToggle>
                <DropdownMenu>
                    <DropdownItem onClick={() => navigate(`/admin/group/${encodeURIComponent(row.name)}`, {
                        state: {
                            name: row.name,
                            id: row.id,
                            groups: row.groups
                        }
                    })}>
                        View Campaigns
                    </DropdownItem>
                    <DropdownItem onClick={() => editCreative(row)}>
                        Edit Creative
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        );
    };

    const editCreative = (creativeRow) => {
        const { type, originalData } = creativeRow;
        setSelectedCreative(originalData);

        switch (type?.toLowerCase()) {
            case 'banner':
            case 'image':
                toggleBannerModal();
                break;
            case 'audio':
                toggleAudioModal();
                break;
            case 'video':
                toggleVideoModal();
                break;
            case 'native':
                toggleNativeModal();
                break;
            default:
                console.warn('Unknown creative type:', type);
                alert(`Editing not supported for type: ${type}`);
                setSelectedCreative(null);
        }
    };

    const IDCell = ({ row }) => {
        return (
            <div className="gOorhn">
                {row.id}
            </div>
        );
    };
    const AddTypeCell = ({ row }) => {
        return (
            <div className="gOorhn">
                {row.type}
            </div>
        );
    };
    const NameCell = ({ row }) => {
        return (
            <div className="gOorhn">
                {row.name}
                {currentBrandId && (
                    <span className="badge bg-secondary ms-2 creative-badge-small">
                    </span>
                )}
            </div>
        );
    };
    const columns = [
        {
            name: "Reviewer",
            cell: (row) => <AudienceActionsCell row={row} />,
            grow: 1,
            width: "100px",
        },
        {
            name: "Review",
            selector: (row) => row.id,
            cell: (row) => <IDCell row={row} />,
            sortable: true,
            width: "100px",
        },
        {
            name: "Reason",
            selector: (row) => row.name,
            cell: (row) => <NameCell row={row} />,
            sortable: true,
            width: "262px",
        },

    ];

    const customStyles = {
        table: {
            style: {
                backgroundColor: "#fff",
                minWidth: "1000px",
            },
        },
        headRow: {
            style: {
                minHeight: "56px",
                backgroundColor: "#eef4fa",
                borderBottom: "1px solid #dfe7f1",
                height: "56px",
            },
        },
        headCells: {
            style: {
                color: "#64748b",
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "uppercase",
                paddingLeft: "12px",
                paddingRight: "12px",
                borderRight: "1px solid #e6ebf2",
            },
        },
        rows: {
            style: {
                minHeight: "56px",
                borderBottom: "1px solid #eef2f7",
            },
        },
        cells: {
            style: {
                paddingLeft: "14px",
                paddingRight: "14px",
                paddingTop: "10px",
                paddingBottom: "10px",
                borderRight: "1px solid #f1f5f9",
                whiteSpace: "nowrap",
            },
        },
    };

    const NoDataComponent = () => (
        <div
            className="nogroupdataavilable"
        >
            <div className="py-4 fw-bold text-secondary">
                No review details available.
            </div>
        </div>
    );

    const CustomLoader = () => (
        <div className="customloader" >
            <div className="loader" role="status"></div>
            <span className="ms-2 fw-bold">Loading...</span>
        </div>
    );

    const conditionalRowStyles = [
        {
            when: (row) => selectedIds.includes(row.id),
            style: {
                backgroundColor: '#FBEDEF !important',
                '& .gOorhn': {
                    color: 'black !important',
                }
            },
        },
    ];

    const handleRowClicked = (row) => {
        setSelectedIds([row.id]);
        setSelectedBrandName(row.name);
    };


    return (
        <div className="linked-campaigns-container creatives-root">
            <Card className="mb-3 creatives-card">
                <CardBody className="py-3 creatives-card-body">
                    <div className="campaign-daily-controls creatives-controls">
                        <div className="cdi-controls-left creatives-controls-left">
                            <div className="cdi-search-box">
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="input-search-box creatives-search-input creatives-search-input-wide"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="cdi-controls-right creatives-controls-right">
                            <Button
                                type="button"
                                className="cdi-export-btn creatives-secondary-btn"
                                onClick={() => setIsShown((prev) => !prev)}
                            >
                                {isShown ? "Hide Ad Preview" : "Show Ad Preview"}
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
            <div className="d-flex flex-grow-1 position-relative creatives-table-scroll-area">
                <div
                    className="flex-grow-1 position-relative table-container creatives-table-container"
                >
                    <DataTable
                        keyField="id"
                        className="linked-campaigns-datatable"
                        columns={columns}
                        data={[]}
                        customStyles={{
                            ...customStyles,
                            tableWrapper: { style: { overflowY: "auto", overflowX: "auto" } },
                        }}
                        highlightOnHover
                        pointerOnHover
                        persistTableHead
                        fixedHeader
                        fixedHeaderScrollHeight="100%"
                        responsive={false}
                        // conditionalRowStyles={conditionalRowStyles}
                        onRowClicked={handleRowClicked}
                        progressPending={loading}
                        striped
                        dense
                        progressComponent={<CustomLoader />}
                        noDataComponent={
                            <div className="py-5 text-center text-secondary">
                                No data available
                            </div>
                        }
                    />
                </div>
                {isShown && (
                    <div className="ad-preview-panel creatives-ad-preview-panel">
                        <div className="ad-preview-inner creatives-ad-preview-inner">
                            <img
                                src="https://via.placeholder.com/728x90.png?text=Ad+Preview"
                                alt="Ad Preview"
                                className="ad-preview-image creatives-ad-preview-image"
                            />
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ReviewDetails;
