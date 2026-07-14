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
import { getBrandWithGroupById } from '../api/Api.jsx';

const LinkToCampaignsModal = ({ isOpen, toggle, brandId }) => {
    const [loading, setLoading] = useState(true);
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [linkedCampaignIds, setLinkedCampaignIds] = useState([]);
    const [expandedNodes, setExpandedNodes] = useState([]);
    const [campaignsTree, setCampaignsTree] = useState([]);

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

    const fetchTreeData = async () => {
        if (!brandId) {
            console.log("LinkToCampaignsModal: No brandId provided, skipping fetch.");
            return;
        }
        setLoading(true);
        try {
            console.log(`LinkToCampaignsModal: Fetching tree data for brandId: ${brandId}`);
            const response = await getBrandWithGroupById(brandId);
            console.log("LinkToCampaignsModal: API Response:", response.data);

            const brands = response.data?.data?.informationBrands || response.data?.informationBrands || [];

            const transformed = brands.map(brand => {
                console.log("LinkToCampaignsModal: Transforming brand:", brand.brandId || brand.id);
                return {
                    id: `brand-${brand.brandId || brand.id}`,
                    name: brand.brandName || brand.name || "Unnamed Brand",
                    type: 'brand',
                    details: (brand.groups || []).map(group => {
                        console.log("LinkToCampaignsModal: Transforming group:", group.groupId || group.id, group);
                        return {
                            id: `group-${group.groupId || group.id}`,
                            name: group.groupName || group.name || `Group ${group.groupId || group.id || 'Unnamed'}`,
                            type: 'group',
                            details: (group.campaigns || []).map(camp => {
                                console.log("LinkToCampaignsModal: Transforming campaign:", camp.campaignId || camp.id, camp);
                                return {
                                    id: camp.campaignId || camp.id,
                                    name: camp.campaignName || camp.name || `Campaign ${camp.campaignId || camp.id || 'Unnamed'}`,
                                    type: 'campaign',
                                    details: []
                                };
                            })
                        };
                    })
                };
            });

            console.log("LinkToCampaignsModal: Transformed Data:", JSON.stringify(transformed, null, 2));
            setCampaignsTree(transformed);
            // Auto-expand the first brand
            if (transformed.length > 0) {
                setExpandedNodes([transformed[0].id]);
            }
        } catch (error) {
            console.error("LinkToCampaignsModal: Error fetching tree data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && brandId) {
            fetchTreeData();
        }
    }, [isOpen, brandId]);

    const toggleNode = (id, e) => {
        e.stopPropagation();
        setExpandedNodes(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelection = (id) => {
        setSelectedCampaignId(id);
    };

    const toggleLink = (id, e) => {
        if (e) e.stopPropagation();
        setLinkedCampaignIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const flattenData = (data, level = 0, ancestorsNextSibling = [], selectedId = null) => {
        let result = [];
        data.forEach((node, idx) => {
            const isLast = idx === data.length - 1;
            const itemId = node.id || node.subId || `unknown-${idx}`;
            const itemName = node.name || node.subName || node.itemName || "Unnamed Node";
            const hasChildren = node.details && node.details.length > 0;
            const isSelected = selectedId === itemId;

            result.push({
                ...node,
                itemId,
                itemName,
                level,
                isLast,
                ancestorsNextSibling,
                hasChildren,
                isSelected,
            });

            if (expandedNodes.includes(itemId) && node.details) {
                result = [...result, ...flattenData(node.details, level + 1, [...ancestorsNextSibling, !isLast], selectedId)];
            }
        });
        return result;
    };

    const flatCampaigns = useMemo(() => flattenData(campaignsTree, 0, [], selectedCampaignId), [expandedNodes, campaignsTree, selectedCampaignId]);

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
            selector: row => row.itemName,
            cell: row => {
                const isSelected = row.isSelected;
                return (
                    <div
                        className="w-100 h-100 position-relative d-flex align-items-center"
                        style={{ paddingLeft: `${row.level * 24 + 10}px`, cursor: 'pointer' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(row.itemId);
                        }}
                    >

                        {row.ancestorsNextSibling.map((hasNext, idx) => (
                            hasNext && (
                                <div
                                    key={idx}
                                    className="tree-node-line-vertical"
                                    style={{
                                        left: `${idx * 24 + 28}px`,
                                        top: 0,
                                        bottom: 0,
                                        borderLeftColor: isSelected ? 'rgba(255,255,255,0.3)' : '#999'
                                    }}
                                />
                            )
                        ))}

                        {row.level > 0 && (
                            <div
                                className="tree-node-line-vertical"
                                style={{
                                    left: `${(row.level - 1) * 24 + 28}px`,
                                    top: 0,
                                    bottom: row.isLast ? '50%' : 0,
                                    borderLeftColor: isSelected ? 'rgba(255,255,255,0.3)' : '#999'
                                }}
                            />
                        )}

                        {row.level > 0 && (
                            <div
                                className="tree-node-line-horizontal"
                                style={{
                                    left: `${(row.level - 1) * 24 + 30}px`,
                                    width: '12px',
                                    borderTopColor: isSelected ? 'rgba(255,255,255,0.3)' : '#999'
                                }}
                            />
                        )}

                        {row.hasChildren && expandedNodes.includes(row.itemId) && (
                            <div
                                className="tree-node-line-vertical"
                                style={{
                                    left: `${row.level * 24 + 28}px`,
                                    top: '50%',
                                    bottom: 0,
                                    borderLeftColor: isSelected ? 'rgba(255,255,255,0.3)' : '#999'
                                }}
                            />
                        )}
                        <div className="tree-node d-flex align-items-center gap-2">
                            {row.hasChildren ? (
                                <div
                                    className={`tree-node-toggle-box ${isSelected ? 'selected' : ''}`}
                                    onClick={(e) => toggleNode(row.itemId, e)}
                                >
                                    {expandedNodes.includes(row.itemId) ? '−' : '+'}
                                </div>
                            ) : (
                                <div className="tree-node-spacer" />
                            )}
                            <span className="tree-node-label">{row.itemName}</span>
                        </div>

                    </div>
                );
            },
            grow: 1,
        },
        {
            name: 'ID',
            selector: row => row.itemId,
            cell: row => (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                    {row.type === 'campaign' ? row.itemId : ''}
                </div>
            ),
            width: '70px',
        },
        {
            name: '',
            cell: row => {
                const isLinked = linkedCampaignIds.includes(row.itemId);
                if (row.hasChildren) return null;
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
                                visibility: row.isSelected || isLinked ? 'visible' : 'hidden'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLink(row.itemId, e);
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
        const findByIds = (nodes, ids) => {
            let foundParts = [];
            for (const n of nodes) {
                const id = n.id || n.subId;
                if (ids.includes(id)) {
                    foundParts.push({ id, name: n.name || n.subName });
                }
                if (n.details) {
                    foundParts = foundParts.concat(findByIds(n.details, ids));
                }
            }
            return foundParts;
        };
        return linkedCampaignIds.length ? findByIds(campaignsTree, linkedCampaignIds) : [];
    }, [linkedCampaignIds, campaignsTree]);

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
                            Link 1 Ad to Campaigns
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
                                <Input placeholder="Search..." className="campaign-tree-search" />
                            </div>
                            <div className="campaign-tree-box" style={{ height: '350px', overflow: 'hidden', borderBottom: '1px solid #ddd' }}>
                                <DataTable
                                    key={`campaigns-${selectedCampaignId || 'none'}`}
                                    keyField="itemId"
                                    columns={campaignsColumns}
                                    data={flatCampaigns}
                                    noDataComponent={<div className="empty-state">No data found</div>}
                                    progressPending={loading}
                                    progressComponent={<CustomLoader />}
                                    customStyles={customStyles}
                                    conditionalRowStyles={conditionalRowStyles}
                                    onRowClicked={(row) => toggleSelection(row.itemId)}
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
                                <Button color="light" size="sm" className="unlink-all-btn" onClick={() => setLinkedCampaignIds([])}>
                                    Unlink All
                                </Button>
                                <span className="linked-count">{linkedItems.length} Campaigns</span>
                            </div>
                            <div className="campaign-tree-box1" style={{ height: '350px', overflow: 'hidden', borderBottom: '1px solid #ddd' }}>
                                <DataTable
                                    key={`linked-${linkedCampaignIds.length}`}
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
                <Button color="success" onClick={toggle} className="save-btn-green">Save</Button>
            </ModalFooter>
        </Modal>
    );
};

export default LinkToCampaignsModal;