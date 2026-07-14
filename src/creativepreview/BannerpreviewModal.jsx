import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalBody,
  Button,
  Spinner,
  Form,
} from 'reactstrap';
import { editcreatives } from '../views/api/Api';

const BannerpreviewModal = (props) => {
  const { isOpen, toggle, banner } = props;
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    console.log('🟢 BannerpreviewModal - banner prop:', banner);
    if (isOpen && banner?.creativesId) {
      const fetchBannerDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          console.log('📡 Fetching banner details for ID:', banner.creativesId);
          const response = await editcreatives(banner.creativesId);
          const bannerData = response.data?.data?.informationCreatives?.[0]

          if (bannerData?.image) {
            setImageUrl(bannerData.image);
          } else {
            setError('No image found for this banner.');
          }
        } catch (err) {
          console.error('❌ Failed to fetch banner details:', err);
          setError('Failed to load preview. Check console for details.');
        } finally {
          setLoading(false);
        }
      };
      fetchBannerDetails();
    } else {
      setImageUrl(null);
      setError(null);
      if (isOpen && !banner?.creativesId) {
        console.warn('⚠️ Modal opened but banner has no ID');
      }
    }
  }, [isOpen, banner]);

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      backdrop="static"
      keyboard={false}
      centered
      className="audience-modal"

    >
      <Form autoComplete="off">
        <div className="modal-header border-bottom editable">
          <h5 className="modal-title mb-0 headingtittle">
            Banner Preview{banner?.name ? `: ${banner.name}` : ''}
          </h5>
          <Button close onClick={toggle} />
        </div>
        <ModalBody className="text-center">
          {loading && (
            <div className="py-5">
              <Spinner color="primary" />
              <p className="mt-2">Loading preview...</p>
            </div>
          )}
          {error && !loading && (
            <div className="py-5 text-danger">
              <i className="fa fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
          {!loading && !error && imageUrl && (
            <img
              src={imageUrl}
              alt="Banner preview"
              className="img-fluid"
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
          {!loading && !error && !imageUrl && (
            <div className="py-5 text-muted">
              No image available for this creative.
            </div>
          )}
        </ModalBody>
      </Form>
    </Modal>
  );
};

export default BannerpreviewModal;