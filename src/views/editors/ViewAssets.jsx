// https://www.iab.com/wp-content/uploads/2016/03/OpenRTB-Native-Ads-Specification-1-1_2016.pd

import React, { useState, useEffect } from "react";

// reactstrap components
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  ButtonToolbar,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardText,

  CardTitle,
  Form,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Table,
  Label,
  Row,
  Col
} from "reactstrap";
import {mimeTypes, protocolOptions, assetDataType} from "../../Utils";
import VideoEditor from "./VideoEditor";

var undef;

const ViewAssets = (props) => {

const [video, setVideo] = useState({});

  const handler = (e, i, entity,key ) => {
    props.nativead.assets[i][entity][key] = e.target.value;
  }

  const deleteAsset = (i) => {
      console.log("Delete asset: " + i);
      props.nativead.assets.splice(i,1);
      props.setter(props.assets);
  }

  const clearTitle = (i) => {
    props.nativead.assets[i]["title"]["text"] = '';
    props.setter(props.assets);
  }

  const clearImage = (i) => {
    props.nativead.assets[i]["image"]["url"] = '';
    props.nativead.assets[i]["image"]["w"] = '0';
    props.nativead.assets[i]["image"]["h"] = '0';
    props.setter(props.assets);
}

const clearLink = (i) => {
    props.nativead.assets[i]["link"]["url"] = '';
    props.nativead.assets[i]["link"]["clicktracker"] = '';
    props.nativead.assets[i]["link"]["fallback"] = '';
    props.setter(props.assets);
}

const clearData = (i) => {
    props.nativead.assets[i]["data"]["datatype"] = '';
    props.nativead.assets[i]["data"]["label"] = '';
    props.nativead.assets[i]["data"]["value"] = '';
    props.setter(props.assets);
}

const clearVideo = (i) => {
    props.nativead.assets[i]["video"] = {};
    props.setter(props.assets);
}

// Linkage to the video editor. Note, the handler expects e, the MDEditor will return a value, not E.
const setVideoAsset = (value,type,index) => {
    var e = {};
    if (value.target === undef) {
        e.target = {};
        e.target.value = value;
    } else
        e = value;
    alert("Index="+index+",type="+type+", VALUE: " + e.target.value);
    //props.nativead.assets[index]["video"][type] = e.target.value;

    handler(e,index,"video",type);
  //  props.setter(props.assets);
}

  return(
    props.nativead.assets.map((row,i) => (
        <>
            <Alert color="primary">
                <Row>
                    <Col  className="px-md-1" md="11">
               <Label>TITLE ASSET</Label>
               </Col>
               <Col  className="px-md-1" md="1">
               <Button color="warning" size="sm" onClick={()=>clearTitle(i)}>Clear</Button>
               </Col>
               </Row>
               <Row>
                <Col className="px-md-1" md="6">
                    <FormGroup>
                        
                        <Label>Title Text</Label>
                        <Input
                            id="title"
                            onChange={ (e) => handler(e,i,"title","text")}
                            defaultValue={row.title.text}
                            type="text">
                        </Input>
                    </FormGroup>
                </Col>
              </Row>
              </Alert>
            <Alert color="success">
                <Row>
                <Col  className="px-md-1" md="11">
               <Label>IMAGE ASSET</Label>
               </Col>
               <Col  className="px-md-1" md="1">
               
               <Button color="warning" size="sm" onClick={()=>clearImage(i)}>Clear</Button>
               </Col>
               </Row>
              <Row>
              <Col className="px-md-1" md="4">
                  <FormGroup>
                      
                      <Label>URL</Label>
                      <Input
                          id="image-title"
                          onChange={ (e) => handler(e,i,"image","url")}
                          defaultValue={row.image.url}
                          type="text">
                      </Input>
                  </FormGroup>
              </Col>
              <Col className="px-md-1" md="1">
                  <FormGroup>
                      <Label>Width</Label>
                      <Input
                          id="image-w"
                          onChange={ (e) => handler(e,i,"image","w")}
                          defaultValue={row.image.w}
                          type="number">
                      </Input>
                  </FormGroup>
              </Col>
              <Col className="px-md-1" md="1">
                  <FormGroup>
                      <Label>Height</Label>
                      <Input
                          id="image-h"
                          onChange={ (e) => handler(e,i,"image","h")}
                          defaultValue={row.image.h}
                          type="number">
                      </Input>
                  </FormGroup>
              </Col>
            </Row>
            </Alert>
            <Alert color="warning">
                <Row>
                <Col  className="px-md-1" md="11">
               <Label>VIDEO ASSET</Label>
               </Col>
               <Col  className="px-md-1" md="1">
               <Button color="warning" size="sm" onClick={()=>clearVideo(i)}>Clear</Button>
               </Col>
               </Row>
               <Row>
               <Col className="px-md-1" md="1">
                  <FormGroup>
                      <Label>Width</Label>
                      <Input
                          id="video-w"
                          onChange={ (e) => handler(e,i,"video","w")}
                          defaultValue={row.video.w}
                          type="number">
                      </Input>
                  </FormGroup>
              </Col>
              <Col className="px-md-1" md="1">
                  <FormGroup>
                      
                      <Label>Height</Label>
                      <Input
                          id="video-h"
                          onChange={ (e) => handler(e,i,"video","h")}
                          defaultValue={row.video.h}
                          type="number">
                      </Input>
                  </FormGroup>
              </Col>
               </Row>
              <VideoEditor key={'video-asset'} 
                              creative={row.video} 
                              index={i}
                              callback={setVideoAsset}/>
              </Alert>
            <Alert color="info">
                <Row>
                <Col  className="px-md-1" md="11">
               <Label>DATA ASSET</Label>
               </Col>
               <Col  className="px-md-1" md="1">
               <Button color="dark" size="sm" onClick={()=>clearData(i)}>Clear</Button>
               </Col>
               </Row>
              <Row>
              <Col className="px-md-1" md="4">
                  <FormGroup>
                      <Label>Type</Label>
                      <Input
                          id="datatype"
                          onChange={ (e) => handler(e,i,"data","datatype")}
                          type="select">
                            {assetDataType(row.data.datatype)}
                      </Input>
                  </FormGroup>
              </Col>
              <Col className="px-md-1" md="4">
                  <FormGroup>
                      <Label>Label</Label>
                      <Input
                          id="label"
                          onChange={ (e) => handler(e,i,"data","label")}
                          defaultValue={row.data.label}
                          type="text">
                      </Input>
                  </FormGroup>
              </Col>
              <Col className="px-md-1" md="4">
                  <FormGroup>
                      <Label>Value</Label>
                      <Input
                          id="w"
                          onChange={ (e) => handler(e,i,"data","value")}
                          defaultValue={row.data.value}
                          type="text">
                      </Input>
                  </FormGroup>
              </Col>
            </Row>
            </Alert>
            <Alert color="warning">
               <Label>LINK ASSET</Label>
               <Button color="danger" size="sm" onClick={()=>clearLink(i)}>Clear</Button>
              <Row>
              <Col className="px-md-1" md="4">
                  <FormGroup>
                      <Label>URL</Label>
                      <Input
                          id="title"
                          onChange={ (e) => handler(e,i,"link","url")}
                          defaultValue={row.link.url}
                          type="text">
                      </Input>
                  </FormGroup>
              </Col>
              <Col className="px-md-1" md="4">
                  <FormGroup>
                      <Label>Clicktrackers</Label>
                      <Input
                          id="link-clicktracker"
                          onChange={ (e) => handler(e,i,"link","clicktracker")}
                          defaultValue={row.link.clicktracker}
                          type="text">
                      </Input>
                  </FormGroup>
              </Col>
              <Col className="px-md-1" md="4">
                  <FormGroup>
                      <Label>Fallback</Label>
                      <Input
                          id="w"
                          onChange={ (e) => handler(e,i,"link","fallback")}
                          defaultValue={row.link.fallback}
                          type="text">
                      </Input>
                  </FormGroup>
              </Col>
            </Row>
            </Alert>
        </>
    ))
  );
};

export default ViewAssets;