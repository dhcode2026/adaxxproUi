import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Card, CardBody } from "reactstrap";
import CampaignCustomizeColumns from "./Modal/CampaignCustomizeColumns";
import { listLinkCampaign, listUnLinkCampaign } from "../views/api/Api";
import Swal from 'sweetalert2';
import "../assets/css/creatives.css";

const DEFAULT_SELECTED_COLUMNS = [
    "Unlink",
    "Campaign ID",
    "Linked Campaign Name",
    "Flight Dates",

];
const LinkedCampaigns = ({ selectedCreative }) => {
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(false);
    const [linkedCampaigns, setLinkedCampaigns] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isShown, setIsShown] = useState(true);
    const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
    const toggleCustomizationModal = () => setCustomizationModalOpen(!customizationModalOpen);
    const [selectedColumns, setSelectedColumns] = useState(DEFAULT_SELECTED_COLUMNS);
    const [unlinkingId, setUnlinkingId] = useState(null);

    useEffect(() => {
        if (selectedCreative?.creativesId) {
            fetchLinkedCampaigns(selectedCreative.creativesId);
        } else {
            setLinkedCampaigns([]);
        }
    }, [selectedCreative]);

    const fetchLinkedCampaigns = async (creativesId) => {
        setLoading(true);
        try {
            const response = await listLinkCampaign(creativesId);
            if (response.status === 200 && response.data?.data?.linkedCampaignDetails) {
                const formatted = response.data.data.linkedCampaignDetails.map((item) => ({
                    id: item.campaignId,
                    name: item.linkedCampaignName,
                    campaignGroup: item.campaignGroup,
                    flightDates: `${(item.flightStartdate || '').split('T')[0]} to ${(item.flightEnddate || '').split('T')[0]}`,
                    bidMultiplier: "-",
                    original: item,
                }));
                setLinkedCampaigns(formatted);
            } else {
                setLinkedCampaigns([]);
            }
        } catch (error) {
            console.error("Error fetching linked campaigns:", error);
            setLinkedCampaigns([]);
        } finally {
            setLoading(false);
        }
    };
    const handleUnlink = async (campaignId) => {
        if (!selectedCreative?.creativesId) {
            console.error("No creative selected");
            return;
        }
        const confirmResult = await Swal.fire({
            title: 'Are you sure?',
            text: "You are about to unlink this campaign.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, unlink it!',
            cancelButtonText: 'Cancel',
        });

        if (!confirmResult.isConfirmed) {
            return;
        }
        Swal.fire({
            title: 'Unlinking...',
            text: 'Please wait while we process your request.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        setUnlinkingId(campaignId);
        const startTime = Date.now();
        const MIN_DISPLAY_TIME = 500;

        try {
            const response = await listUnLinkCampaign(selectedCreative.creativesId, campaignId);
            const elapsed = Date.now() - startTime;
            if (elapsed < MIN_DISPLAY_TIME) {
                await new Promise(resolve => setTimeout(resolve, MIN_DISPLAY_TIME - elapsed));
            }
            await Swal.close();

            if (response.status === 200) {
                await fetchLinkedCampaigns(selectedCreative.creativesId);
                setSelectedIds(prev => prev.filter(id => id !== campaignId));
                Swal.fire({
                    icon: 'success',
                    title: 'Unlinked!',
                    text: 'The campaign has been unlinked successfully.',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Failed to unlink campaign. Please try again.',
                });
            }
        } catch (error) {
            console.error("Error unlinking campaign:", error);
            const elapsed = Date.now() - startTime;
            if (elapsed < MIN_DISPLAY_TIME) {
                await new Promise(resolve => setTimeout(resolve, MIN_DISPLAY_TIME - elapsed));
            }
            await Swal.close();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while unlinking.',
            });
        } finally {
            setUnlinkingId(null);
        }
    };

    const getMediaUrl = (creative) => {
        return (
            creative.image ||
            creative.imageurl ||
            creative.fileUrl ||
            creative.url ||
            creative.videoUrl ||
            creative.audioUrl ||
            creative.contentUrl ||
            creative.mediaUrl ||
            creative.src
        );
    };

    const renderPreview = (creative) => {
        if (!creative) {
            return <div className="text-muted p-3">Select a creative to preview</div>;
        }
        const type = creative.type?.toLowerCase();
        if (type === 'banner' || type === 'image') {
            const imgUrl = getMediaUrl(creative);
            if (!imgUrl) {
                return (
                    <div className="text-danger">
                        No image URL. Fields: {Object.keys(creative).join(', ')}
                    </div>
                );
            }
            return (
                <img
                    src={imgUrl}
                    alt={creative.name || 'Banner'}
                    className="creatives-preview-image"
                />
            );
        }
        if (type === 'video') {
            const videoUrl = creative.video || creative.fileUrl || creative.url || creative.contentUrl;
            if (!videoUrl) {
                return (
                    <div className="text-danger">
                        No video URL. Fields: {Object.keys(creative).join(', ')}
                    </div>
                );
            }
            return (
                <video className="creatives-preview-video" controls>
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            );
        }
        if (type === 'audio') {
            const audioUrl = creative.audio || creative.fileUrl || creative.url || creative.contentUrl;
            if (!audioUrl) {
                return (
                    <div className="text-danger">
                        No audio URL. Fields: {Object.keys(creative).join(', ')}
                    </div>
                );
            }
            return (
                <audio controls className="creatives-preview-audio">
                    <source src={audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                </audio>
            );
        }
        if (type === 'native') {
            return (
                <div className="native-preview p-3 border text-center">
                    {creative.icon && (
                        <img src={creative.icon} alt="icon" className="creatives-native-icon" />
                    )}
                    {creative.title && <h5>{creative.title}</h5>}
                    {creative.description && <p>{creative.description}</p>}
                    {creative.cta && (
                        <button className="btn btn-sm btn-primary">{creative.cta}</button>
                    )}
                    {!creative.title && !creative.description && (
                        <small>{creative.name || 'Native Ad'}</small>
                    )}
                </div>
            );
        }
        return (
            <div>
                <p>Unknown creative type: {type}</p>
                <pre>No data</pre>
            </div>
        );
    };

    const UnlinkCell = ({ row }) => (
        <i
            className={`fa fa-times unlink-icon ${unlinkingId === row.id ? 'disabled' : ''}`}
            id="unlinkcampaign"
            title="Unlink campaign"
            onClick={() => handleUnlink(row.id)}
            aria-disabled={unlinkingId === row.id}
        />
    );

    const IDCell = ({ row }) => <div className="gOorhn">{row.id}</div>;
    const NameCell = ({ row }) => <div className="gOorhn">{row.name}</div>;
    const TextCell = ({ value }) => <div className="gOorhn">{value}</div>;

    const allColumns = [
        {
            name: "Unlink",
            cell: (row) => <UnlinkCell row={row} />,
            grow: 1,
            width: "75px",
        },
        {
            name: "Campaign ID",
            selector: (row) => row.id,
            cell: (row) => <IDCell row={row} />,
            sortable: true,
            width: "110px",
        },
        {
            name: "Linked Campaign Name",
            selector: (row) => row.name,
            cell: (row) => <NameCell row={row} />,
            sortable: true,
            width: "250px",
        },

        {
            name: "Flight Dates",
            selector: (row) => row.flightDates,
            cell: (row) => <TextCell value={row.flightDates} />,
            sortable: true,
            width: "162px",
        },

    ];

    const columns = allColumns.filter((column) => selectedColumns.includes(column.name));

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
        <div className="nogroupdataavilable">
            <div className="py-4 fw-bold text-secondary">No campaigns linked.</div>
        </div>
    );

    const CustomLoader = () => (
        <div className="customloader">
            <div className="loader" role="status"></div>
            <span className="ms-2 fw-bold">Loading...</span>
        </div>
    );

    const conditionalRowStyles = [
        {
            when: (row) => selectedIds.includes(row.id),
            style: {
                backgroundColor: "#FBEDEF !important",
                "& .gOorhn": { color: "black !important" },
            },
        },
    ];

    const handleRowClicked = (row) => {
        setSelectedIds([row.id]);
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
                            <Button
                                type="button"
                                className="cdi-export-btn creatives-secondary-btn"
                                onClick={toggleCustomizationModal}
                            >
                                Customize Columns
                            </Button>
                            <CampaignCustomizeColumns
                                isOpen={customizationModalOpen}
                                toggle={toggleCustomizationModal}
                                selectedColumns={selectedColumns}
                                setSelectedColumns={setSelectedColumns}
                            />
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
                        data={linkedCampaigns}
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
                        progressComponent={<CustomLoader />}
                        noDataComponent={
                            <div className="py-5 text-center text-secondary">
                                No data available
                            </div>
                        }
                    />
                </div>
                {isShown && (
                    <div className="ad-preview-panel">
                        <div className="ad-preview-inner">{renderPreview(selectedCreative)}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LinkedCampaigns;
