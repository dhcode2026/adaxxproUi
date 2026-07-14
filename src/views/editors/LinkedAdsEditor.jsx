import React, { useState, useMemo, useCallback, useEffect, useRef, forwardRef } from "react";
import { Button, Row, Col, Input, UncontrolledTooltip, Modal, ModalHeader, ModalBody } from "reactstrap";
import DataTable from "react-data-table-component";
import LinkAdsModal from "../Modal/LinkAdsModal.jsx";
import CampaignLinkAds from "../Modal/CampaignLinkAds.jsx";
import { listUnLinkCampaign } from "../api/Api";
import Swal from 'sweetalert2';

const LinkedAdsEditor = (props) => {
    const [adsData, setAdsData] = useState(props.linkedAds || []);
    console.log("LinkedAdsEditor: props.brandId:", props.brandId);

    useEffect(() => {
        setAdsData(props.linkedAds || []);
    }, [props.linkedAds]);

    const [isLinkAdsOpen, setIsLinkAdsOpen] = useState(false);
    const [linkToCampaignsModalOpen, setLinkToCampaignsModalOpen] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [isWeightingEnabled, setIsWeightingEnabled] = useState(false);
    const [weights, setWeights] = useState({});
    const [editingWeightId, setEditingWeightId] = useState(null);

    const toggleLinkAds = useCallback(() => setIsLinkAdsOpen(prev => !prev), []);
    const toggleLinkToCampaignsModal = useCallback(() => setLinkToCampaignsModalOpen(prev => !prev), []);
    const toggleWeighting = useCallback(() => setIsWeightingEnabled(prev => !prev), []);

    useEffect(() => {
        setWeights(prev => {
            const newWeights = { ...prev };
            let changed = false;

            adsData.forEach(ad => {
                if (newWeights[ad.creativesId] === undefined) {
                    newWeights[ad.creativesId] = 1;
                    changed = true;
                }
            });

            return changed ? newWeights : prev;
        });
    }, [adsData]);

    const totalWeight = useMemo(() => {
        return Object.values(weights).reduce((sum, w) => sum + (parseFloat(w) || 0), 0);
    }, [weights]);

    const stateRef = useRef();
    stateRef.current = { weights, totalWeight, editingWeightId, selectedRows };

    const updateAdsData = useCallback((newAds) => {
        setAdsData(newAds);
        if (props.onLinkedAdsChange) props.onLinkedAdsChange(newAds);
    }, [props.onLinkedAdsChange]);

    const handleUnlinkAds = useCallback(async () => {
        if (selectedRows.length === 0) return;

        const confirmResult = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to unlink ${selectedRows.length} ad${selectedRows.length > 1 ? 's' : ''}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, unlink them!',
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

        try {
            if (props.campaignId) {
                await Promise.all(
                    selectedRows.map(creativesId => listUnLinkCampaign(creativesId, props.campaignId))
                );
            }
            const filtered = adsData.filter(ad => !selectedRows.includes(ad.creativesId));
            updateAdsData(filtered);
            setSelectedRows([]);

            Swal.fire({
                icon: 'success',
                title: 'Unlinked!',
                text: 'The ads have been unlinked successfully.',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Error unlinking ads:", error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to unlink ads. Please try again.',
            });
        }
    }, [selectedRows, adsData, updateAdsData, props.campaignId]);

    const handleUnlinkSingleAd = useCallback(async (creativesId) => {
        const confirmResult = await Swal.fire({
            title: 'Are you sure?',
            text: "You are about to unlink this ad.",
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

        try {
            if (props.campaignId) {
                await listUnLinkCampaign(creativesId, props.campaignId);
            }
            const filtered = adsData.filter(ad => ad.creativesId !== creativesId);
            updateAdsData(filtered);
            setSelectedRows(prev => prev.filter(id => id !== creativesId));

            Swal.fire({
                icon: 'success',
                title: 'Unlinked!',
                text: 'The ad has been unlinked successfully.',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Error unlinking ad:", error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to unlink ad. Please try again.',
            });
        }
    }, [adsData, updateAdsData, props.campaignId]);

    const handleSelectedRowsChange = useCallback((state) => {
        const selectedIds = state.selectedRows.map(row => row.creativesId);
        setSelectedRows(selectedIds);
    }, []);

    const isRowSelected = useCallback((row) => {
        return selectedRows.includes(row.creativesId);
    }, [selectedRows]);

    const selectableRowsComponentProps = useMemo(() => ({
        type: "checkbox",
        className: "sq-checkbox"
    }), []);

    const IndeterminateCheckbox = forwardRef(
        ({ indeterminate, ...rest }, ref) => {
            const defaultRef = useRef();
            const resolvedRef = ref || defaultRef;

            useEffect(() => {
                resolvedRef.current.indeterminate = indeterminate;
            }, [resolvedRef, indeterminate]);

            return <input type="checkbox" ref={resolvedRef} {...rest} />;
        }
    );

    const customStyles = useMemo(() => ({
        table: {
            style: {
                backgroundColor: 'transparent',
            },
        },
        headRow: {
            style: {
                backgroundColor: '#ffffff',
                minHeight: '35px',
                borderBottom: '1px solid #eee',
                fontSize: '11px',
                fontWeight: '400',
                color: '#777',
            },
        },
        headCells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
            },
        },
        rows: {
            style: {
                minHeight: '45px',
                fontSize: '11px',
                backgroundColor: '#fff',
                color: '#333',
                '&:not(:last-of-type)': {
                    borderBottom: '1px solid #eee',
                },
                '&:hover': {
                    backgroundColor: '#f8f9fa',
                },
            },
        },
        cells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
            },
        },
    }), []);

    const columns = useMemo(() => {
        const baseColumns = [
            {
                name: 'Unlink',
                width: '75px',
                cell: ad => (
                    <i
                        className="fa fa-times"
                        title="Unlink ad"
                        onClick={() => handleUnlinkSingleAd(ad.creativesId)}
                        style={{ cursor: 'pointer', fontSize: '13px' }}
                    />
                )
            },
            // {
            //     name: 'External Review',
            //     width: '120px',
            //     cell: () => <span>Waiting on inte...</span>
            // },
            {
                name: 'Status',
                width: '100px',
                cell: ad => {
                    const statusMap = {
                        1: "ON",
                        2: "OFF",
                        3: "ARCHIVED"
                    };
                    const statusText = statusMap[ad.status] || (typeof ad.status === 'string' ? ad.status.toUpperCase() : "ON");
                    return <span className="fw-bold">{statusText}</span>;
                }
            },
            {
                name: 'Ad Type',
                width: '100px',
                selector: row => row.type,
                cell: ad => {
                    const t = ad.type;
                    if (!t) return "-";
                    return t.charAt(0).toUpperCase() + t.slice(1);
                }
            },
            {
                name: 'Ad Name',
                selector: row => row.name,
                width: '200px',
                cell: ad => (
                    <span className="text-truncate w-100" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ad.name || "-"}
                    </span>
                ),
                sortable: true,
            },
            {
                name: 'Tracking Summary',
                width: '280px',
                cell: ad => {
                    const targetId = `url-tooltip-${ad.creativesId}`;
                    return (
                        <div className="w-100 py-1" style={{ overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                            <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold text-nowrap" style={{ fontSize: '11px', flexShrink: 0 }}>Destination URL</span>
                                <span
                                    id={targetId}
                                    className="text-truncate text-primary"
                                    style={{
                                        fontSize: '11px',
                                        opacity: 0.8,
                                        minWidth: 0,
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        textDecoration: 'underline',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {ad.destinationUrl || "-"}
                                </span>
                                {ad.destinationUrl && (
                                    <UncontrolledTooltip
                                        target={targetId}
                                        placement="top"
                                        autohide={false}
                                        delay={{ show: 100, hide: 100 }}
                                    >
                                        {ad.destinationUrl}
                                    </UncontrolledTooltip>
                                )}
                            </div>
                        </div>
                    );
                }
            },
            // {
            //     name: 'Flight Dates',
            //     width: '100px',
            //     cell: () => <span className="text-info cursor-pointer" style={{ fontSize: '11px' }} onClick={(e) => e.stopPropagation()}>Add</span>
            // }
        ];

        if (isWeightingEnabled) {
            baseColumns.push({
                name: 'Weight',
                width: '140px',
                cell: (ad) => {
                    const { weights, totalWeight, editingWeightId, selectedRows } = stateRef.current;
                    const weight = weights[ad.creativesId] || 1;
                    const percentage = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(2) : "0.00";
                    const isEditing = editingWeightId === ad.creativesId;
                    const isSelected = selectedRows.includes(ad.creativesId);

                    return (
                        <div className="w-100" onClick={(e) => e.stopPropagation()}>
                            {isEditing ? (
                                <Input
                                    autoFocus
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeights(prev => ({ ...prev, [ad.creativesId]: e.target.value }))}
                                    onBlur={() => setEditingWeightId(null)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            setEditingWeightId(null);
                                        }
                                    }}
                                    style={{ height: '26px', fontSize: '11px', width: '100%', padding: '2px 5px' }}
                                />
                            ) : (
                                <div
                                    className={`weight-display-container d-flex align-items-center justify-content-between px-2 rounded ${isSelected ? 'is-selected' : ''}`}
                                    id={`weight-row-${ad.creativesId}`}
                                    onClick={() => setEditingWeightId(ad.creativesId)}
                                    style={{
                                        cursor: 'pointer',
                                        minHeight: '24px',
                                        border: '1px solid transparent',
                                        transition: 'all 0.1s ease'
                                    }}
                                >
                                    <div className="d-flex align-items-center gap-1 fw-bold" style={{ fontSize: '11px' }}>
                                        <span>{weight}</span>
                                        <span className="text-secondary fw-normal">({percentage}%)</span>
                                    </div>
                                    <i className="fa fa-pencil text-secondary edit-icon" style={{ fontSize: '10px', opacity: 0 }}></i>
                                    <UncontrolledTooltip target={`weight-row-${ad.creativesId}`} placement="bottom" fade={false}>
                                        Creative will not be served until status is eligible. Weight shown is a projection.
                                    </UncontrolledTooltip>
                                </div>
                            )}
                        </div>
                    );
                }
            });
        }

        return baseColumns;
    }, [isWeightingEnabled, handleUnlinkSingleAd]);

    return (
        <div className="linked-ads-container">
            <div className="step-scroll">
                <Row className="m-0">
                    <Col md="12" className="p-0">
                        <div className="deals-header px-3 py-2 border-bottom">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <label className="fw-semibold mb-0" style={{ fontSize: '13px' }}>
                                        Linked Ads ({adsData.length})
                                    </label>
                                    <Button
                                        type="button"
                                        id="newaudience"
                                        onClick={toggleLinkToCampaignsModal}
                                    >
                                        Link Ads
                                    </Button>
                                    <Button
                                        type="button"
                                        className="py-1 px-2 rounded-0 custom-select-input selecteddeals"
                                        id="export">
                                        <span className="lasttime">
                                            Bulk Edit
                                        </span>
                                    </Button>
                                    <LinkAdsModal isOpen={isLinkAdsOpen} toggle={toggleLinkAds} />
                                </div>

                                <div className="d-flex align-items-center gap-3">
                                    {/* <div className="d-flex align-items-center gap-2">
                                        <Input
                                            type="checkbox"
                                            className="m-0"
                                            style={{ width: '14px', height: '14px' }}
                                            checked={isWeightingEnabled}
                                            onChange={toggleWeighting}
                                        />
                                        <label className="mb-0 text-secondary" style={{ fontSize: '12px' }}>Creative Weighting</label>
                                    </div> */}
                                    <Button
                                        color="link"
                                        size="sm"
                                        className="text-secondary p-0 text-decoration-none"
                                        style={{ fontSize: '12px', opacity: selectedRows.length > 0 ? 1 : 0.5 }}
                                        onClick={handleUnlinkAds}
                                        disabled={selectedRows.length === 0}
                                    >
                                        Unlink Ads
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <CampaignLinkAds
                            isOpen={linkToCampaignsModalOpen}
                            toggle={toggleLinkToCampaignsModal}
                            brandId={props.brandId}
                            preSelectedIds={adsData.map(ad => ad.creativesId)}
                            onSave={(creatives) => updateAdsData(creatives)}
                        />



                        <div className="p-3">
                            {adsData.length > 0 ? (
                                <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                                    <DataTable
                                        keyField="creativesId"
                                        columns={columns}
                                        data={adsData}
                                        customStyles={customStyles}
                                        // conditionalRowStyles={conditionalRowStyles}
                                        //  selectableRowsComponent={IndeterminateCheckbox}
                                        onSelectedRowsChange={handleSelectedRowsChange}
                                        selectableRows

                                        selectableRowsComponentProps={selectableRowsComponentProps}
                                        persistTableHead
                                        noHeader
                                        dense
                                        pointerOnHover
                                        highlightOnHover
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-5 text-secondary">
                                    <div className="mb-2 fw-bold" style={{ fontSize: '1.1rem' }}>No ads linked</div>
                                    <div style={{ fontSize: '0.9rem' }}>Click "Link Ads" to add creatives to this campaign.</div>
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>
            </div>

            <style>
                {`
                    .weight-display-container:hover {
                        background-color: #ffffff !important;
                        border: 1px solid #eee !important;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.03);
                    }
                    .weight-display-container:hover .edit-icon {
                        opacity: 1 !important;
                    }


                    /* Tooltip styling */
                    .tooltip-inner {
                        background-color: #faebed !important;
                        color: black !important;
                        font-size: 11px !important;
                        padding: 8px 12px !important;
                        max-width: 500px !important;
                        word-break: break-all !important;
                        text-align: left !important;
                        border: 1px solid #e5c3c7 !important;
                    }
                    .tooltip-arrow::before {
                        border-top-color: #faebed !important;
                        border-bottom-color: #faebed !important;
                        border-left-color: #faebed !important;
                        border-right-color: #faebed !important;
                    }
                `}
            </style>
        </div>
    );
};

export default LinkedAdsEditor;
