import React, { useState, useEffect, useMemo } from 'react';
import { Modal, ModalBody, ModalFooter, Button, Row, Col, Input, Alert, Spinner } from 'reactstrap';
import { FaInfoCircle } from 'react-icons/fa';
import DataTable from "react-data-table-component";
import { getAllCampaign, createLinktocampaign } from '../api/Api.jsx';
import Swal from 'sweetalert2';

const LinkAdspop = ({ isOpen, toggle, brandId, creatives, onLinked }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [linkedCampaignIds, setLinkedCampaignIds] = useState([]);
    const [expandedNodes, setExpandedNodes] = useState([]);
    const [campaignsList, setCampaignsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            console.log(`Fetching all campaigns...`);
            const response = await getAllCampaign();
            console.log("API Response:", response.data);

            // Extract campaigns from response
            const campaigns = response.data?.data || [];
            
            // Transform campaigns into flat list structure
            const transformedCampaigns = campaigns.map(campaign => ({
                id: campaign.campaignId,
                name: campaign.name,
                type: 'campaign',
                status: campaign.status,
                campaignType: campaign.campaignType
            }));

            console.log("Transformed Campaigns:", transformedCampaigns);
            setCampaignsList(transformedCampaigns);
            
            // Auto expand all (since no hierarchy now)
            if (transformedCampaigns.length > 0) {
                setExpandedNodes(['campaigns-root']);
            }
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        
        console.log("Modal opened, fetching campaigns...");
        fetchCampaigns();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setLoading(true);
            setCampaignsList([]);
            setSelectedCampaignId(null);
            setLinkedCampaignIds([]);
            setSearchTerm('');
        }
    }, [isOpen]);

    const toggleSelection = (id) => {
        setSelectedCampaignId(id);
    };

    const toggleLink = (id, e) => {
        if (e) e.stopPropagation();
        setLinkedCampaignIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Filter campaigns based on search
    const filteredCampaigns = useMemo(() => {
        if (!searchTerm.trim()) return campaignsList;
        return campaignsList.filter(campaign => 
            campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.id.toString().includes(searchTerm)
        );
    }, [campaignsList, searchTerm]);

    const customStyles = {
        table: {
            style: {
                paddingBottom: '16px',
            },
        },
        responsiveWrapper: {
            style: {
                paddingBottom: '16px',
            },
        },
        header: { style: { minHeight: '0px' } },
        headRow: {
            style: {
                backgroundColor: '#f5f5f5',
                minHeight: '30px',
                borderBottom: 'none',
                borderTop: 'none',
            },
        },
        headCells: {
            style: {
                fontSize: '11px',
                fontWeight: '600',
                color: '#777',
                paddingLeft: '10px',
                borderRight: 'none',
                borderBottom: 'none',
                backgroundColor: 'transparent',
            },
        },
        rows: {
            style: {
                minHeight: '28px',
                cursor: 'pointer',
                borderBottom: 'none',
                borderTop: 'none',
                '&:hover': {
                    backgroundColor: '#f9f9f9',
                },
                '&:last-of-type': {
                    paddingBottom: '16px',
                },
            },
        },
        cells: {
            style: {
                fontSize: '13px',
                paddingLeft: '0px',
                paddingRight: '0px',
                borderRight: 'none',
                borderBottom: 'none',
                borderTop: 'none',
                backgroundColor: 'transparent !important',
            },
        },
    };

    const conditionalRowStyles = [
        {
            when: row => row.id === selectedCampaignId,
            style: {
                backgroundColor: '#63903f !important',
                color: '#ffffff !important',
                '&:hover': {
                    backgroundColor: '#63903f !important',
                    color: '#ffffff !important',
                },
            },
        },
    ];

    const campaignsColumns = [
        {
            name: 'Name',
            selector: row => row.name,
            cell: row => {
                const isSelected = row.id === selectedCampaignId;
                return (
                    <div
                        className="w-100 h-100 position-relative d-flex align-items-center"
                        style={{ paddingLeft: '10px', cursor: 'pointer', marginBottom: '-10px' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(row.id);
                        }}
                    >
                        <div className="tree-node d-flex align-items-center gap-2">
                            <div className="tree-node-spacer" style={{ width: '20px' }} />
                            <span className="tree-node-label">{row.name}</span>
                        </div>
                    </div>
                );
            },
            grow: 1,
        },
        {
            name: 'ID',
            selector: row => row.id,
            cell: row => (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                    {row.id}
                </div>
            ),
            width: '70px',
        },
        {
            name: '',
            cell: row => {
                const isLinked = linkedCampaignIds.includes(row.id);
                return (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-end" style={{ paddingRight: '10px' }}>
                        <Button
                            color="light"
                            size="sm"
                            style={{
                                padding: '2px 14px',
                                fontSize: '13px',
                                backgroundColor: '#fff',
                                color: '#111',
                                border: '1px solid #ccc',
                                fontWeight: '500',
                                borderRadius: '4px',
                                visibility: row.id === selectedCampaignId || isLinked ? 'visible' : 'hidden'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLink(row.id, e);
                            }}
                        >
                            {isLinked ? 'Linked' : 'Add'}
                        </Button>
                    </div>
                );
            },
            width: '90px',
        }
    ];

    const linkedItems = useMemo(() => {
        return campaignsList
            .filter(campaign => linkedCampaignIds.includes(campaign.id))
            .map(campaign => ({
                id: campaign.id,
                name: campaign.name
            }));
    }, [linkedCampaignIds, campaignsList]);

    const linkedColumns = [
        {
            name: 'Name',
            selector: row => row.name,
            grow: 1,
            cell: row => <div className="tree-node-name">{row.name}</div>
        },
        {
            name: 'ID',
            selector: row => row.id,
            width: '100px',
            cell: row => <div className="text-center w-100">{row.id}</div>
        },
        {
            name: '',
            width: '40px',
            cell: row => (
                <div
                    style={{ cursor: 'pointer', color: '#999', fontSize: '20px', paddingRight: '10px' }}
                    onClick={() => toggleLink(row.id)}
                >
                    ×
                </div>
            )
        }
    ];

    const CustomLoader = () => (
        <div className="customloader">
            <div className="loader" role="status"></div>
            <span className="ms-2 fw-bold">Loading...</span>
        </div>
    );

    const handleSave = async () => {
        if (!creatives || creatives.length === 0) {
            await Swal.fire({
                icon: 'warning',
                title: 'No Creatives Selected',
                text: 'Please select at least one creative to link.',
                confirmButtonColor: '#62903e',
            });
            return;
        }
        
        if (linkedCampaignIds.length === 0) {
            await Swal.fire({
                icon: 'warning',
                title: 'No Campaigns Linked',
                text: 'Please link at least one campaign.',
                confirmButtonColor: '#62903e',
                width: 400,
            });
            return;
        }
        
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to link ${creatives.length} creative(s) to ${linkedCampaignIds.length} campaign(s)?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, link them!',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#62903e',
        });

        if (!result.isConfirmed) {
            return;
        }

        setSaving(true);
        try {
            const payload = {
                campaignIds: linkedCampaignIds,
                creatives: creatives
            };
            await createLinktocampaign(payload);
            await Swal.fire({
                icon: 'success',
                title: 'Linked!',
                text: 'Creatives have been successfully linked to campaigns.',
                confirmButtonColor: '#62903e',
                timer: 2000,
                showConfirmButton: true,
            });
            if (onLinked) onLinked();
            toggle();
        } catch (error) {
            console.error('Error linking campaigns:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Linking Failed',
                text: error.response?.data?.message || 'An error occurred while linking. Please try again.',
                confirmButtonColor: '#62903e',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered className="link-campaigns-modal">
            <div className="modal-header">
                <Row className="w-100 align-items-center m-0">
                    <Col md="6">
                        <h5 className="modal-title mb-0" style={{ fontWeight: '500', fontSize: '18px' }}>
                            Link Ads
                        </h5>
                    </Col>
                </Row>
            </div>
            <ModalBody className="p-0">
                <Alert color="info" className="campaign-tree-alert">
                    <FaInfoCircle style={{ marginRight: '10px', fontSize: '16px', color: '#31708f' }} />
                    <span>Creatives that are linked here won't be served for campaigns using creative weighting. To serve the creatives, edit the campaigns and update creative weights.</span>
                </Alert>

                <div className="campaign-tree-container">
                    <Row>
                        <Col md="6" style={{ paddingRight: '10px', display: 'flex', flexDirection: 'column' }}>
                            <div className="campaign-tree-column-title">Campaigns</div>
                            <div style={{ height: '42px', display: 'flex', alignItems: 'center' }}>
                                <Input 
                                    placeholder="Search by campaign name or ID..." 
                                    className="campaign-tree-search input-search-box"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="campaign-tree-box" style={{ height: '350px', overflow: 'hidden', borderBottom: '1px solid #ddd' }}>
                                <DataTable
                                    key={`campaigns-${selectedCampaignId || 'none'}`}
                                    keyField="id"
                                    columns={campaignsColumns}
                                    data={filteredCampaigns}
                                    noDataComponent={<div className="empty-state">No campaigns found</div>}
                                    progressPending={loading}
                                    progressComponent={<CustomLoader />}
                                    customStyles={customStyles}
                                    conditionalRowStyles={conditionalRowStyles}
                                    onRowClicked={(row) => toggleSelection(row.id)}
                                    dense
                                    fixedHeader
                                    fixedHeaderScrollHeight="305px"
                                    noHeader
                                    persistTableHead
                                    pointerOnHover
                                    highlightOnHover
                                />
                            </div>
                        </Col>

                        <Col md="6" style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column' }}>
                            <div className="campaign-tree-column-title">Linked Campaigns</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', height: '32px' }}>
                                <Button color="light" size="sm" className="unlink-all-btn" onClick={() => setLinkedCampaignIds([])} disabled={saving}>
                                    Unlink All
                                </Button>
                                <span className="linked-count">{linkedItems.length} Campaigns</span>
                            </div>
                            <div className="campaign-tree-box1" style={{ height: '350px', overflow: 'hidden', borderBottom: '1px solid #ddd' }}>
                                <DataTable
                                    key={`linked-${linkedCampaignIds.length}`}
                                    columns={linkedColumns}
                                    data={linkedItems}
                                    noDataComponent={<div className="empty-state">No linked campaigns</div>}
                                    customStyles={customStyles}
                                    dense
                                    fixedHeader
                                    fixedHeaderScrollHeight="305px"
                                    noHeader
                                    persistTableHead
                                    pointerOnHover
                                    highlightOnHover
                                />
                            </div>
                        </Col>
                    </Row>
                </div>
            </ModalBody>
            <ModalFooter className="modal-footer-custom">
                <Button color="light" onClick={toggle} disabled={saving} className="pmp-btn-outline">Cancel</Button>
                <Button color="success" onClick={handleSave} disabled={saving} className="save-btn-green">
                    {saving ? <Spinner size="sm" /> : 'Save'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default LinkAdspop;