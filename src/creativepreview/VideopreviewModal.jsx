  import React, { useState, useEffect } from 'react';
  import {
    Modal,
    ModalBody,
    Button,
    Spinner,
    Form,
  } from 'reactstrap';
  import { editcreatives } from '../views/api/Api';

  const VideopreviewModal = (props) => {
    const { isOpen, toggle, video } = props;
    const [loading, setLoading] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
      console.log('🟢 VideopreviewModal - video prop:', video);
      if (isOpen && video?.creativesId) {
        const fetchVideoDetails = async () => {
          setLoading(true);
          setError(null);
          try {
            console.log('📡 Fetching video details for ID:', video.creativesId);
            const response = await editcreatives(video.creativesId);
            const videoData = response.data?.data?.informationCreatives?.[0]

            if (videoData?.video) {
              setVideoUrl(videoData.video);
            } else {
              setError('No image found for this video.');
            }
          } catch (err) {
            console.error('❌ Failed to fetch video details:', err);
            setError('Failed to load preview. Check console for details.');
          } finally {
            setLoading(false);
          }
        };
        fetchVideoDetails();
      } else {
        setVideoUrl(null);
        setError(null);
        if (isOpen && !video?.creativesId) {
          console.warn('⚠️ Modal opened but video has no ID');
        }
      }
    }, [isOpen, video]);

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
              Video Preview{video?.name ? `: ${video.name}` : ''}
            </h5>
            <Button close onClick={toggle} />
          </div>
          <ModalBody className="text-center modal-body-scroll">
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
            {!loading && !error && videoUrl && (
              <video
              src={videoUrl}
              controls
              autoPlay={false}
              className="img-fluid"
              style={{ maxHeight: '80vh', width: '100%', objectFit: 'contain' }}
            >
              Your browser does not support the video tag.
            </video>
            )}
            {!loading && !error && !videoUrl && (
              <div className="py-5 text-muted">
                No image available for this creative.
              </div>
            )}
          </ModalBody>
        </Form>
      </Modal>
    );
  };

  export default VideopreviewModal;