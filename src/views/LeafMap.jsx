import React, { useState, useEffect } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   CircleMarker,
//   Circle,
//   useMapEvents,
//   ZoomControl,
// } from "react-leaflet";
// reactstrap components
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Input,
  Label,
  Row,
  Col,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import { stringify, undef } from "../Utils";
import LoginModal from "../LoginModal";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";

var lat = 44.414165;
var lon = 8.942184;

const LeafMap = (props) => {
  console.log(props);

  const vx = useViewContext();
  const [geo, setGeo] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setGeo(props.geo || []);
  }, [props.geo]); // ✅ IMPORTANT

  const leafStyle = {
    height: "500px",
    width: "100%",
  };

  const normalizeCenter = (value, fallback = [20, 0]) => {
    if (!Array.isArray(value) || value.length < 2) return fallback;
    const lat = Number(value[0]);
    const lon = Number(value[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return fallback;
    return [lat, lon];
  };

  const normalizeZoom = (value, fallback = 2) => {
    const z = Number(value);
    return Number.isFinite(z) ? z : fallback;
  };
  const RefreshMap = ({ center, zoom, suspendView }) => {
    const map = useMap();

    useEffect(() => {
      const nextLat = Array.isArray(center) ? Number(center[0]) : null;
      const nextLon = Array.isArray(center) ? Number(center[1]) : null;
      const nextZoom = Number.isFinite(Number(zoom))
        ? Number(zoom)
        : map.getZoom();

      let active = true;
      const timeouts = [];
      const rafIds = [];

      const canTouchMap = () => {
        if (!active) return false;
        const container = map?.getContainer?.();
        return Boolean(container && map?._loaded && map?._mapPane);
      };

      const invalidateAndView = () => {
        if (!canTouchMap()) return;
        map.invalidateSize({ animate: false });
        if (suspendView) return;
        if (Number.isFinite(nextLat) && Number.isFinite(nextLon)) {
          map.setView([nextLat, nextLon], nextZoom, { animate: false });
        }
      };

      // Only schedule invalidation once Leaflet reports it is ready; calling
      // invalidateSize too early (or after unmount) can throw _leaflet_pos errors.
      map.whenReady(() => {
        if (!active) return;

        [0, 250, 750].forEach((delay) => {
          timeouts.push(window.setTimeout(invalidateAndView, delay));
        });

        const raf1 = window.requestAnimationFrame(() => {
          const raf2 = window.requestAnimationFrame(invalidateAndView);
          rafIds.push(raf2);
        });
        rafIds.push(raf1);
      });

      return () => {
        active = false;
        timeouts.forEach((id) => window.clearTimeout(id));
        rafIds.forEach((id) => window.cancelAnimationFrame(id));
      };
    }, [map, center, zoom, suspendView]);

    return null;
  };

  const ResizeInvalidator = () => {
    const map = useMap();

    useEffect(() => {
      let active = true;
      let ro = null;

      const canTouchMap = () => {
        if (!active) return false;
        const container = map?.getContainer?.();
        return Boolean(container && map?._loaded && map?._mapPane);
      };

      const invalidate = () => {
        if (!canTouchMap()) return;
        map.invalidateSize({ animate: false });
      };

      const onResize = () => invalidate();

      map.whenReady(() => {
        if (!active) return;

        const container = map.getContainer?.();
        if (!container) return;

        invalidate();

        if (typeof window.ResizeObserver !== "function") {
          window.addEventListener("resize", onResize);
          return;
        }

        ro = new window.ResizeObserver(() => invalidate());
        ro.observe(container);
      });

      return () => {
        active = false;
        if (ro) ro.disconnect();
        window.removeEventListener("resize", onResize);
      };
    }, [map]);

    return null;
  };

  const FocusMap = ({ point, zoom }) => {
    const map = useMap();

    useEffect(() => {
      if (!point) return;

      const nextZoom = Number.isFinite(Number(zoom))
        ? Number(zoom)
        : map.getZoom();

      const lat = Number(point?.lat);
      const lon = Number(point?.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      // Use `setView` animation instead of `flyTo`/`flyToBounds` to avoid the
      // "zoom out then zoom in" behaviour when jumping between far-apart points.
      map.stop();
      map.setView([lat, lon], nextZoom, {
        animate: true,
        duration: 1.0,
      });
    }, [map, point, zoom]);

    return null;
  };

  const SetPositionsView = () => {
    useMapEvents({
      click(e) {
        let x = Array.isArray(geo) ? [...geo] : [];

        x.push(e.latlng.lat);
        x.push(e.latlng.lng);
        x.push(1000); // 1km

        setGeo(x);

        if (props.callback) {
          props.callback(x);
        }

        if (props.onChange) {
  props.onChange(x);
}
      },
    });

    return null;
  };

  const doit = (lat) => {
    let x = [...geo]; // ✅ copy

    for (let i = 0; i < x.length; i += 3) {
      if (x[i] === lat) {
        x.splice(i, 3);
        break;
      }
    }

    setGeo(x);
    setCount((prev) => prev + 1);

    if (props.callback) {
      props.callback(x); // ✅ update parent
    }
  };

  const ShowPoints = () => {
    const fromProps = Array.isArray(props.points) ? props.points : null;
    const points = [];

    if (fromProps && fromProps.length > 0) {
      for (const p of fromProps) {
        const pLat = Number(p?.lat);
        const pLon = Number(p?.lon);
        const pRange = Number(p?.range ?? p?.radius);
        if (!Number.isFinite(pLat) || !Number.isFinite(pLon) || !(pRange > 0)) {
          continue;
        }

        points.push({
          lat: pLat,
          lon: pLon,
          range: pRange,
          target: p?.target,
        });
      }
    } else if (Array.isArray(geo) && geo.length > 0) {
      for (let i = 0; i < geo.length; i += 3) {
        if (geo[i] !== 0) {
          points.push({
            lat: geo[i],
            lon: geo[i + 1],
            range: geo[i + 2],
            target: "Target",
          });
        }
      }
    }

    if (points.length === 0) return null;

    return points.map((pos, index) => {
      const isExclude =
        String(pos?.target || "Target").toLowerCase() === "exclude";
      const fillColor = isExclude ? "#d36b6b" : "#6fbf4a";

      return (
        <React.Fragment key={`${pos.lat}-${pos.lon}-${index}`}>
          <Marker position={[pos.lat, pos.lon]}>
            <Popup>
              <ItemGrid lat={pos.lat} range={pos.range} />
            </Popup>
          </Marker>
          <Circle
            center={[pos.lat, pos.lon]}
            radius={pos.range}
            pathOptions={{
              // Solid fill, no border; green for Target, red for Exclude.
              stroke: false,
              fillColor,
              fillOpacity: 0.7,
            }}
          />
        </React.Fragment>
      );
    });
  };

  const changeRange = (e, lat) => {
    if (!e) {
      setCount((prev) => prev + 1);
      return;
    }

    const v = Number(e.target.value);
    let x = [...geo]; // ✅ copy

    for (let i = 0; i < x.length; i += 3) {
      if (x[i] === lat) {
        x[i + 2] = v;
        break;
      }
    }

    setGeo(x);

    if (props.callback) {
      props.callback(x); // ✅ update parent
    }
  };

  const ItemGrid = (props) => {
    return (
      <>
        <Button onClick={() => doit(props.lat)}>Delete</Button>
        <br />
        {"Range: "}
        <Input
          id="rangefinder"
          color="error"
          type="text"
          defaultValue={props.range}
          onChange={(e) => changeRange(e, props.lat)}
        />
        <Button color="success" onClick={() => changeRange()}>
          Done
        </Button>
      </>
    );
  };

  const setInstances = (na, server) => {};

  const save = () => {
    // send the current geo array back; parent will sanitize/handle it
    if (props.callback && geo) {
      props.callback(geo);
    }
  };

  const discard = () => {
    setGeo([]);
    if (props.callback) {
      props.callback(null);
    }
  };

  console.log("REF" + JSON.stringify(geo, null, 2) + ", zoom=" + props.zoom);

  return (
    <>
      <div className="content mt-5">
        <Row>
          <Col md="12">
            <Card className="card-plain">
              <CardBody>
                <MapContainer
                  style={leafStyle}
                  center={normalizeCenter(props.center, [20, 0])}
                  zoom={normalizeZoom(props.zoom, 2)}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <ResizeInvalidator />
                  <SetPositionsView />
                  <RefreshMap
                    center={props.center}
                    zoom={props.zoom}
                    suspendView={Boolean(props.focusPoint)}
                  />
                  <FocusMap point={props.focusPoint} zoom={props.zoom} />
                  <ShowPoints key={"mapper-" + count} />
                </MapContainer>

                {/* action buttons to tell parent when editing is finished */}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default React.memo(LeafMap);
