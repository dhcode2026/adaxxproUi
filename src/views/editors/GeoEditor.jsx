import React, { useState, useEffect } from "react";

// reactstrap components
import {
  Button,
  ButtonGroup,
  FormGroup,
  Input,
  Row,
  Col,
  Label,
} from "reactstrap";
import LeafMap from "../LeafMap.jsx";

var undef;

const GeoEditor = (props) => {
  console.log("geoeditor props=", props);
  const [geo, setGeo] = useState(props.geo || []);
  const [showControl, setShowControl] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [count, setCount] = useState(0);
  const zoom = props.zoom ?? 1;
  const center = props.center ?? [44.414165, 8.942184];

  useEffect(() => {
    setGeo(props.geo || []);
  }, [props.geo]);

  const mapper = () => {
    setShowMap(!showMap);
    setGeo(props.geo || []);
  };

  const removeGeo = (i) => {
    const index = i * 3;

    let x = [...geo];

    x.splice(index, 3);

    setGeo(x);
    setShowControl(true);
    setCount((c) => c + 1);
  };

  const makeNewGeo = () => {
    setGeo((prevGeo) => [...prevGeo, 0, 0, 1000]); // default 1 km
    setShowControl(true);
  };

  const change = (e, what, index) => {
    const newGeo = [...geo];
    index *= 3;
    const v = e.target.value;

    if (what === "lat") {
      newGeo[index] = Number(v);
    } else if (what === "lon") {
      newGeo[index + 1] = Number(v);
    } else {
      newGeo[index + 2] = Number(v);
    }
    setGeo(newGeo);

    setShowControl(true);
    if (props.callback) {
      props.callback(newGeo);
    } // 🔁 passes updated geo array to parent
  };

  const RED = {
    color: "red",
  };
  const GREEN = {
    color: "green",
  };

  // LeafMap will call this with its current geo array when the
  // user presses "Save", or with no argument/`null` when the action
  // is cancelled.  We sanitize and propagate the data upward.

  // const save = (childGeo) => {
  //   console.log("Map click", childGeo);
  //   //return false;

  //   // if the child passed us an array, use that; otherwise treat it as
  //   // a cancel/discard request.
  //   if (Array.isArray(childGeo)) {
  //     // remove any trailing placeholder 0 entries (same logic as
  //     // before)
  //     const newGeo = [...childGeo];
  //     for (let i = newGeo.length - 3; i >= 0; i -= 3) {
  //       if (newGeo[i] === 0) {
  //         newGeo.splice(i, 3);
  //       }
  //     }
  //     //  setGeo(newGeo);
  //     if (props.handlegeoPoints) {
  //       console.log("check");

  //       let point = {};

  //       for (let i = 0; i < newGeo.length; i += 3) {
  //         point = {
  //           lat: newGeo[i],
  //           lon: newGeo[i + 1],
  //           range: newGeo[i + 2],
  //         };
  //       }

  //       setnewmapdata((prev) => [...prev, point]);

  //       console.log("newmapdaata", newmapdata);
  //       props.handlegeoPoints(newmapdata);
  //     }
  //     //if (props.callback) props.callback(newGeo);
  //   } else {
  //     // canceled/discarded – parent can decide what to do when callback
  //     // is called without data (the previous behaviour).
  //     // if (props.callback) props.callback();
  //   }

  //   //setShowMap(true);
  //   //setShowControl(false);
  // };

  const save = (childGeo) => {
    if (!Array.isArray(childGeo)) return;

    const newGeo = [...childGeo];

    // remove 0 placeholders
    for (let i = newGeo.length - 3; i >= 0; i -= 3) {
      if (newGeo[i] === 0) {
        newGeo.splice(i, 3);
      }
    }

    setGeo([...newGeo]);

    const geoPoints = [];

    for (let i = 0; i < newGeo.length; i += 3) {
      geoPoints.push({
        lat: newGeo[i],
        lon: newGeo[i + 1],
        range: newGeo[i + 2],
      });
    }

    console.log("🔥 SENDING TO PARENT:", geoPoints);

    if (props.handlegeoPoints) {
      props.handlegeoPoints(geoPoints);
    }
  };

  const GetGeoView = () => {
    if (!geo) return null;

    const geoPoints = [];
    for (let i = 0; i < geo.length; i += 3) {
      geoPoints.push({
        lat: geo[i],
        lon: geo[i + 1],
        range: geo[i + 2],
      });

      //props.handlegeoPoints(geoPoints);
    }

    if (showMap) {
      return (
        <>
          <LeafMap
            callback={save}
            
            onChange={(liveGeo) => {
              setGeo(liveGeo);

              // ✅ ADD THIS BLOCK (IMPORTANT)
              if (props.handlegeoPoints) {
                const geoPoints = [];

                for (let i = 0; i < liveGeo.length; i += 3) {
                  geoPoints.push({
                    lat: liveGeo[i],
                    lon: liveGeo[i + 1],
                    range: liveGeo[i + 2],
                  });
                }

                props.handlegeoPoints(geoPoints);
              }
            }}
            geo={geo}
            points={props.points}
            zoom={zoom}
            center={center}
            focusPoint={props.focusPoint}
          />
        </>
      );
    }
  };

  return (
    <>
      <Row>
        {/* <Button size="sm" className="btn-fill" color="success" onClick={mapper}>
          {showMap ? "Hide Map" : "Show Map"}
        </Button> */}
      </Row>
      <GetGeoView />
      {showControl && (
        <>
          <div className="new-rows mt-2">
            {/* <Button onClick={() => save(true)} color="success">Save</Button>
          <Button onClick={() => save(false)} color="danger">Discard</Button> */}
          </div>
        </>
      )}
    </>
  );
};

export default React.memo(GeoEditor);
