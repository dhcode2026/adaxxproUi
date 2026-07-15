import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Badge,
  Spinner
} from 'reactstrap';
import { FaArrowLeft } from 'react-icons/fa';

const BrandDetail = () => {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Decode URL parameter
  const decodedBrandName = decodeURIComponent(brandName);
  
  // State
  const [loading, setLoading] = useState(true);
  const [brandData, setBrandData] = useState(null);

  useEffect(() => {
    // Set document title to show brand name
    document.title = `${decodedBrandName} - Brand Details`;
    
    // Simulate API call
    const timer = setTimeout(() => {
      setBrandData({
        brandName: decodedBrandName,
        ...location.state,
      });
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [decodedBrandName, location.state]);

  if (loading) {
    return (
      <div className="content">
        <Row>
          <Col md="12">
            <div className="text-center p-5">
              <Spinner color="primary" />
              <p className="mt-2">Loading brand details...</p>
            </div>
          </Col>
        </Row>
      </div>
    );
  }
  return (
    <div className="content">
      <Row>
        <Col md="12">
          <Button 
            color="link" 
            onClick={() => navigate('/admin/brands')}
            className="mb-3 p-0">
            <FaArrowLeft /> Back to Brand List
          </Button>
          <Card>
            <CardHeader>
              <h3>
                <i className="fa fa-tag me-2" />
                {decodedBrandName}
              </h3>
            </CardHeader>
            <CardBody>
              <p>Brand details for: <strong>{decodedBrandName}</strong></p>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BrandDetail;