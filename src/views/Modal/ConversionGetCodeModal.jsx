import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Label,
  Spinner,
  Form,
  InputGroup,
} from 'reactstrap';

const ConversionGetCodeModal = ({
  isOpen,
  toggle,
  conversion,
  pid,
  loading,
}) => {
  const [selectedTagType, setSelectedTagType] = useState('Postback');
  const [codeValue, setCodeValue] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [postbackvalue, setPostbackValue] = useState('');
  const [securityToken, setSecurityToken] = useState('');

  const tagTypeOptions = [
    'Advanced Script (Recommended)',
    'Image Pixel',
    'Postback',
    'Script',
    'JavaScript on Click',
    'Redirect Link',
  ];

  const buildUrl = (token, pidValue) => {
    if (!token || !pidValue) {
      return '';
    }

    return `https://rtb.adaxxpro.com/postback?api_key={token}&sub6={Site ID}&source={Sub site ID}&campaign_id={Campaign ID}&country={Country code}&ad_placement={Ad ID}&external_campaign_id={Campaign}&install_time={Install timestamp}&click_time={Click timestamp}&click_id={Adset}&app_id={App ID}&app_name={App name}&attribution_type={Attributed touch type}&conversion_time={Download timestamp}&external_postback_id={Postback ID}&timestamp={Timestamp}`;
  };

  const buildPostUrl = (token) => {
    if (!token) {
      return '';
    }

    return `https://rtb.adaxxpro.com/postback?api_key={token}&sub6={Site ID}&source={Sub site ID}&campaign_id={Campaign ID}&country={Country code}&ad_placement={Ad ID}&external_campaign_id={Campaign}&install_time={Install timestamp}&click_time={Click timestamp}&click_id={Adset}&app_id={App ID}&app_name={App name}&attribution_type={Attributed touch type}&conversion_time={Download timestamp}&external_postback_id={Postback ID}&timestamp={Timestamp}&event_name={Event name}&event_mapped_name={Partner event ID}`;
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedTagType('Postback');

      setSecurityToken(
        conversion?.securityToken || ''
      );

      setCodeValue(pid || '');
    } else {
      setSelectedTagType('Postback');
      setCodeValue('');
      setUrlValue('');
      setPostbackValue('');
      setSecurityToken('');
    }
  }, [isOpen, conversion, pid]);

  useEffect(() => {
    if (securityToken && pid) {
      const newUrl = buildUrl(securityToken, pid);
      setUrlValue(newUrl);
    } else {
      setUrlValue('');
    }

    if (securityToken) {
      const postUrl = buildPostUrl(securityToken);
      setPostbackValue(postUrl);
    } else {
      setPostbackValue('');
    }
  }, [securityToken, pid]);

  const handleTagTypeChange = (e) => {
    setSelectedTagType(e.target.value);
  };

  return (
    <>
      <style>
        {`
          .audience-modal .modal-body {
            max-height: 70vh;
            overflow-y: auto;
          }
        `}
      </style>

      <Modal
        isOpen={isOpen}
        toggle={toggle}
        backdrop="static"
        keyboard={false}
        centered
        scrollable
        className="audience-modal"
        size="md"
      >
        {loading && (
          <div className="loader-overlay">
            <Spinner
              color="primary"
              style={{ width: '4rem', height: '4rem' }}
            />
          </div>
        )}

        <div className="modal-header border-bottom editable">
          <h5 className="modal-title mb-0 headingtittle">
            Get Tags - {conversion?.name || 'Conversion'}
          </h5>

          <Button close onClick={toggle} />
        </div>

        <ModalBody>
          <Form autoComplete="off">

            <Label for="tagType">Tag Type:</Label>

            <Input
              type="select"
              id="tagType"
              name="tagType"
              value={selectedTagType}
              onChange={handleTagTypeChange}
              className="formscontrol"
            >
              <option value="">-- Select Get Tags --</option>

              {tagTypeOptions.map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </Input>

            {/* <Label for="securityToken" className="mt-3">
              Security Token:
            </Label>

            <InputGroup>
              <Input
                type="text"
                id="securityToken"
                name="securityToken"
                value={securityToken}
                readOnly
                className="bg-light"
                style={{
                  height: '30px',
                  fontSize: '14px',
                  padding: '4px 8px',
                }}
                onClick={(e) => e.target.select()}
              />
            </InputGroup> */}

            <Label for="code" className="mt-3">
              Code (PID):
            </Label>

            <Input
              type="text"
              id="code"
              name="code"
              value={codeValue}
              readOnly
              className="formscontrol bg-light"
              style={{
                height: '30px',
                fontSize: '14px',
                padding: '4px 8px',
              }}
              onClick={(e) => e.target.select()}
            />

            <span className="mb-4 conversionspan d-block">
              Use this value to paste directly into templates provided by your tracking platform.
            </span>

            <Label for="installUrl" className="mt-3">
              Install Postback Url:
            </Label>

            <Input
              type="textarea"
              id="installUrl"
              name="installUrl"
              rows="5"
              value={urlValue}
              readOnly
              className="bg-light"
              onClick={(e) => e.target.select()}
            />

            <span className="mb-4 d-block">
              Use this value if you are setting up Postback tracking manually.
              Replace {'{event_revenu}'} with actual revenue value.
            </span>

            <Label for="eventUrl" className="mt-3">
              In-app Postback Url:
            </Label>

            <Input
              type="textarea"
              id="eventUrl"
              name="eventUrl"
              rows="5"
              value={postbackvalue}
              readOnly
              className="bg-light"
              onClick={(e) => e.target.select()}
            />

          </Form>
        </ModalBody>

        <ModalFooter>
          <Button className="cancels" onClick={toggle}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default ConversionGetCodeModal;