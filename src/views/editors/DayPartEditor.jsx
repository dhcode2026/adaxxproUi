import React, { useState, useEffect } from 'react';
import {
    Button,
    Table,
    Row,
    Col,
    Label
  } from "reactstrap";
  import 'react-week-scheduler/react-week-scheduler.css';

const  xdays = {
  monday:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  tuesday:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  wednesday:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  thursday:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  friday:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  saturday:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  sunday:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
};

var undef;

const DayPartEditor = (props) => {

  useEffect(() => {
  
  }, []);

  const initSchedule = (s) => {
    if (s === undef || s === null) {
      Object.keys(xdays).map((key) => {
        for (var i=0;i<24;i++) {
          xdays[key][i] = 0;
        }
      });
      return xdays;
    }
    return s;
  }

  const [days,setDays] = useState(initSchedule(props.daypart));
  const [mouseDown,setMouseDown] = useState(false);
  const [eventTime, setEventTime] = useState(0);
  const [timeTrack, setTimeTrack] = useState({});

  // const clear = () => {
  //   setDays(initSchedule(undef))
  //   props.callback(days);
  //   props.redraw();
  // }


  const clear = () => {
  const newDays = initSchedule(undef); // create a new object
  setDays({ ...newDays });              // set new state
  props.callback(newDays);              // send updated object to parent
  props.redraw();                       // redraw table if needed
}


  const drawTable = () => {
    return(Object.keys(days).map((key,i) => (
      <tr key={"tr-"+key}>
        <th key={"th-"+key}
            scope="row" 
            style={{ textTransform: 'capitalize', fontSize: '11px', fontWeight: '600', textAlign: 'left' }}
            onMouseDown={()=>toggleRow(key)}>
              {key}
        </th>
            {drawRow(key,i)}
      </tr>
    )));
  }

  // setDays(days);

  const drawRow = (key,index) => {
    return (days[key].map((value,i) => (
        <td key={"td-"+key+":"+i} 
            scope="row" 
            style={getColor(value)} 
            id={"td-"+key+":"+i}
            onMouseMove={() => mouseMove(key,i)}></td>
    )));
  }

  const toggleRow = (key) => {
    console.log("Toggle row: " + key);
    var k = 0;
    for (var i=0;i<24;i++) {
      k += days[key][i];
    }
    k = k > 0 ? 0 : 1;
    for (var i=0;i<24;i++) {
      days[key][i] = k;
    }
    setDays(days);
    props.callback(days);
  }

  const toggle = (key,hour) => {
    if (key === undef || hour === undef)
      return;

    var z = days;
    //console.log("TOGGLE VALUE: " + key + ", " + hour + " = " + z[key][hour]);
    if (z[key][hour] === 1)
      z[key][hour] = 0;
    else
      z[key][hour] = 1;

    //console.log("AFTER TOGGLE VALUE: " + key + ", " + hour + " = " + z[key][hour]);
    setDays(z);
    props.callback(z);
  }

  const getColor = (value) => {
    // console.log("GC VALUE: " + value);
    if (value === 0)
      return (null)
    else
      return(YELLOW);
  }

  const mouseMove = (key,hour) => {
    if (mouseDown) {
      var e = document.getElementById("td-"+key+":"+hour);
      if (e === undef || e === null)
        return;

      //console.log("day: " + key + ", hour: " + hour);
      var index = key+":"+hour
      if (timeTrack[index] === undef || timeTrack[index] !== eventTime) {
        e.style["background-color"]="pink";
        toggle(key,hour);
        timeTrack[index] = eventTime;
        setTimeTrack(timeTrack);
      }
    }
  }

  const handleMouse = (e,t) => {
      setMouseDown(t);
      setEventTime(eventTime+1);
  }

  const YELLOW = {
    backgroundColor: 'goldenrod'
  }

  const hasSelection = Object.values(days).some(row => row.includes(1));



  return(
    <Row className="mt-3">
      <Col md="12" className="px-md-1">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <label className="fw-semibold mb-0" style={{ fontSize: "13px" }}>
            Dayparting (UTC)
          </label>
          {hasSelection && (
            <button
              type="button"
              className="btn btn-link p-0"
              style={{
                fontSize: "0.79rem",
                color: "#4c9eec",
                textDecoration: "none",
              }}
              onClick={() => {
                const newDays = initSchedule(undef); // reset schedule
                setDays({ ...newDays });
                props.callback(newDays);
                props.redraw();
              }}
            >
              Clear
            </button>
          )}
        </div>
        <div
          className="w-100 overflow-hidden"
          onMouseEnter={mouseMove}
          onMouseDown={(e) => handleMouse(e, true)}
          onMouseUp={(e) => handleMouse(e, false)}
        >
          <Table
            size="sm"
            className="daypart-table mb-0"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <thead>
              <tr>
                <th style={{ width: "12%", textAlign: "left", fontSize: "11px", fontWeight: "600" }}>Day</th>
                {Array.from({ length: 24 }).map((_, idx) => {
                  const hourStr = String(idx).padStart(2, "0");
                  return (
                    <th
                      key={hourStr}
                      style={{
                        width: "3.66%",
                        textAlign: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    >
                      {hourStr}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>{drawTable()}</tbody>
          </Table>
        </div>
      </Col>
    </Row>
  );
};

export default DayPartEditor;
