import React, { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import {
  FormGroup,
  Input,
  Row,
  Col,
  Label
} from "reactstrap";

import DemoTag from "../simulator/DemoTag.jsx";
import { mimeTypes } from "../../Utils";
import { useViewContext } from "../../ViewContext";
const undef = undefined;
const BannerEditor = (props) => {
  const vx = useViewContext();
  const [rSelected, setRSelected] = useState(props.creative.dealType);

  const setDealSelection = (r) => {
    setRSelected(r);
    props.selector(r);
  };
  const extensions = props.creative.extensions || {};
  const substituteRedirect = (text) => {
    const cthru = extensions["clickthrough_url"];
    if (cthru !== undef && cthru !== "") {
      const re = new RegExp("_REDIRECT_URL_", "g");
      text = text.replace(re, cthru);
    }
    return text;
  };

  const mangle = () => {
    return (props.creative.htmltemplate || "").replace("{image_url}", props.creative.imageurl || "");
  };

  return (
    <>
      <Row className="bannereditor">
        <Col className="px-md-1" md="2">
          <FormGroup>
            <Label>Content Type</Label>
            <Input
              id="fixed-width"
              defaultValue={props.creative.contenttype}
              onChange={(e) => props.callback(e, "contenttype")}
              type="select"
            >
              {mimeTypes(props.creative.contenttype)}
            </Input>
          </FormGroup>
        </Col>

        <Col className="px-md-1" md="4">
          <FormGroup>
            <Label>Image Url</Label>
            <Input
              id="image_url"
              defaultValue={props.creative.imageurl}
              onChange={(e) => props.callback(e.target.value, "imageurl")}
              type="text"
            />
          </FormGroup>
        </Col>

        <Col className="px-md-1" md="4">
          <FormGroup>
            <Label>Click Through Url</Label>
            <Input
              id="clickthrough_url"
              defaultValue={extensions["clickthrough_url"] || ""}
              onChange={(e) => props.callback(e.target.value, "extensions.clickthrough_url")}
              type="text"
            />
          </FormGroup>
        </Col>
      </Row>

      <Row className="bannereditor">
        <Col className="px-md-1" md="6">
          <FormGroup>
            <Label>HTML Template</Label>
            <MDEditor
              value={props.creative.htmltemplate}
              commands={[]}
              height={300}
              preview="edit"
              onChange={(e) => props.callback(e, "htmltemplate")}
            />
          </FormGroup>
        </Col>

        <Col className="px-md-1" md="6">
          <FormGroup>
            <Label>Visualization</Label>
            <DemoTag
              isVideo={false}
              adm={substituteRedirect(vx.macroSub(mangle()))}
            />
          </FormGroup>
        </Col>
      </Row>
    </>
  );
};

export default BannerEditor;
