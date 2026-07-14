import React, { useState, useEffect, useMemo } from 'react';
import {
    Modal,
    ModalBody,
    ModalFooter,
    Button,
    Row,
    Col,
    Input,
    Alert
} from 'reactstrap';
import { FaInfoCircle } from 'react-icons/fa';
import DataTable from "react-data-table-component";
import { getAllMyadslist } from '../api/Api.jsx';

const CampaignLinkAds = ({ isOpen, toggle, brandId, onSave, preSelectedIds = [] }) => {
    const [loading, setLoading] = useState(true);
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [linkedItemIds, setLinkedItemIds] = useState([]);
    const [adsData, setAdsData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setLinkedItemIds(preSelectedIds.map(Number).filter(Boolean)); // Initialize with already linked ads
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, preSelectedIds]);

    const fetchAds = async () => {
        setLoading(true);
        try {
            console.log("CampaignLinkAds: Fetching all creatives data");
            const creativesResponse = await getAllMyadslist();
            
            const rawData = creativesResponse.data;
            let list = [];
            
            if (rawData?.data?.informationCreatives) {
                list = rawData.data.informationCreatives;
            } else if (rawData?.informationCreatives) {
                list = rawData.informationCreatives;
            } else if (Array.isArray(rawData)) {
                list = rawData;
            }
            
            console.log("CampaignLinkAds: Parsed List count:", list.length);
            setAdsData(list);
        } catch (error) {
            console.error("CampaignLinkAds: Error fetching data:", error);
            setAdsData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAds();
        }
    }, [isOpen]);

    const toggleSelection = (id) => {
        setSelectedCampaignId(id);
    };

    const toggleLink = (id, e) => {
        if (e) e.stopPropagation();
        const numId = Number(id);
        setLinkedItemIds(prev => prev.includes(numId) ? prev.filter(i => i !== numId) : [...prev, numId]);
    };

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
            when: row => row.isSelected,
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
            cell: row => (
                <div
                    className="w-100 h-100 d-flex align-items-center"
                    style={{ paddingLeft: '10px', cursor: 'pointer' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(row.creativesId);
                    }}
                >
                    <span className="tree-node-label">{row.name}</span>
                </div>
            ),
            grow: 1,
        },
        {
            name: 'ID',
            selector: row => row.creativesId,
            cell: row => (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                    {row.creativesId}
                </div>
            ),
            width: '70px',
        },
        {
            name: '',
            cell: row => {
                const isLinked = linkedItemIds.includes(Number(row.creativesId));
                const isSelected = selectedCampaignId === row.creativesId;
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
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLink(row.creativesId, e);
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
        return adsData.filter(ad => linkedItemIds.includes(Number(ad.creativesId))).map(ad => ({
            id: Number(ad.creativesId),
            name: ad.name
        }));
    }, [linkedItemIds, adsData]);

    const filteredAds = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return adsData;

        return adsData.filter(ad => {
            const name = String(ad?.name || '').toLowerCase();
            const id = String(ad?.creativesId || '').toLowerCase();
            return name.includes(term) || id.includes(term);
        });
    }, [adsData, searchTerm]);

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
        <div className="customloader" >
            <div className="loader" role="status"></div>
            <span className="ms-2 fw-bold">Loading...</span>
        </div>
    );

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
                {!brandId && (
                    <div className="mx-3 mt-2">
                        <Alert color="warning" style={{ fontSize: '12px' }}>
                            <FaInfoCircle className="me-2" />
                            No Brand ID identified. Please ensure you have selected a brand before linking ads.
                        </Alert>
                    </div>
                )}

                <div className="campaign-tree-container">
                    <Row>
                        <Col md="6" style={{ paddingRight: '10px', display: 'flex', flexDirection: 'column' }}>
                            <div className="campaign-tree-column-title">Ads</div>
                            <div style={{ height: '42px', display: 'flex', alignItems: 'center' }}>
                                <Input
                                    placeholder="Search..."
                                    className="campaign-tree-search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="campaign-tree-box" style={{ height: '350px', overflow: 'hidden', borderBottom: '1px solid #ddd' }}>
                                <DataTable
                                    key={`campaigns-${selectedCampaignId || 'none'}`}
                                    columns={campaignsColumns}
                                    data={filteredAds}
                                    noDataComponent={<div className="empty-state">No data found</div>}
                                    progressPending={loading}
                                    progressComponent={<CustomLoader />}
                                    customStyles={customStyles}
                                    conditionalRowStyles={[
                                        {
                                            when: row => row.creativesId === selectedCampaignId,
                                            style: {
                                                backgroundColor: '#63903f !important',
                                                color: '#ffffff !important',
                                                '&:hover': {
                                                    backgroundColor: '#63903f !important',
                                                    color: '#ffffff !important',
                                                },
                                            },
                                        },
                                    ]}
                                    onRowClicked={(row) => toggleSelection(row.creativesId)}
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
                            <div className="campaign-tree-column-title">Linked Ads</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', height: '32px' }}>
                                <Button color="light" size="sm" className="unlink-all-btn" onClick={() => setLinkedItemIds([])}>
                                    Unlink All
                                </Button>
                                <span className="linked-count">{linkedItems.length} Ads</span>
                            </div>
                            <div className="campaign-tree-box1" style={{ height: '350px', overflow: 'hidden', borderBottom: '1px solid #ddd' }}>
                                <DataTable
                                    key={`linked-${linkedItemIds.length}`}
                                    columns={linkedColumns}
                                    data={linkedItems}
                                    noDataComponent={<div className="empty-state">No data found</div>}
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
                <Button color="light" onClick={toggle} className="pmp-btn-outline">Cancel</Button>
                <Button color="success" onClick={() => {
                    if (onSave) {
                        const selectedObjects = adsData.filter(ad => linkedItemIds.includes(Number(ad.creativesId)));
                        onSave(selectedObjects);
                    }
                    toggle();
                }} className="save-btn-green" id="linkingadds">Done</Button>
            </ModalFooter>
        </Modal >
    );
};

export default CampaignLinkAds;