  import React, { useState, useEffect } from 'react';
  import {
    Modal,
    ModalBody,
    Button,
    Spinner,
    Form,
  } from 'reactstrap';
  import { editcreatives } from '../views/api/Api';

  const AudiopreviewModal = (props) => {
    const { isOpen, toggle, audio } = props;
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
      console.log('🟢 audiopreviewModal - audio prop:', audio);
      if (isOpen && audio?.creativesId) {
        const fetchAudioDetails = async () => {
          setLoading(true);
          setError(null);
          try {
            console.log('📡 Fetching audio details for ID:', audio.creativesId);
            const response = await editcreatives(audio.creativesId);
            const audioData = response.data?.data?.informationCreatives?.[0]

            if (audioData?.audio) {
              setAudioUrl(audioData.audio);
            } else {
              setError('No image found for this audio.');
            }
          } catch (err) {
            console.error('❌ Failed to fetch audio details:', err);
            setError('Failed to load preview. Check console for details.');
          } finally {
            setLoading(false);
          }
        };
        fetchAudioDetails();
      } else {
        setAudioUrl(null);
        setError(null);
        if (isOpen && !audio?.creativesId) {
          console.warn('⚠️ Modal opened but audio has no ID');
        }
      }
    }, [isOpen, audio]);

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
              Audio Preview{audio?.name ? `: ${audio.name}` : ''}
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
            {!loading && !error && audioUrl && (
              <audio
              src={audioUrl}
              controls
              className="w-100"
              style={{ maxHeight: '80vh' }}
            >
              Your browser does not support the audio element.
            </audio>
            )}
            {!loading && !error && !audioUrl && (
              <div className="py-5 text-muted">
                No image available for this creative.
              </div>
            )}
          </ModalBody>
        </Form>
      </Modal>
    );
  };

  export default AudiopreviewModal;