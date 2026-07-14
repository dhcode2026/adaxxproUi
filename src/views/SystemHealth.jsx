import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Alert,
} from "reactstrap";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getSystemStatus } from "./api/Api";
import { canView } from "../utils/permissionHelper";

const SystemHealth = () => {
  const [cpuData, setCpuData] = useState([]);
  const [memData, setMemData] = useState([]);
  const [canViewUser, setCanViewUser] = useState(false);

  const [statusMessage, setStatusMessage] = useState({ text: "Checking system status...", color: "info" });
  const [currentMetrics, setCurrentMetrics] = useState({ cpu: 0, mem: 0, qps: 0, abt: 0 });

  const fetchData = async () => {
    try {
      // const username = localStorage.getItem("login_username") || "root";
      // const password = localStorage.getItem("login_password") || "startrekisbetterthanstarwars";
      const username = "root";
      const password = "startrekisbetterthanstarwars";

      const payload = {
        command: "loginAdmin",
        username: username,
        password: password,
        subcommand: "O"
      };


      const response = await getSystemStatus(payload);
      const data = response.data;

      if (data && data.sparklines) {
        const sp = JSON.parse(data.sparklines);
        const cpu = Number(sp.cpu);

        let mem = sp.memUsed;
        if (typeof mem === 'string') {
          mem = Number(mem.split(" ")[0].replace("M", ""));
        }

        const qps = Number(sp.qps);
        const abt = Number(sp.avgbidtime);

        const timestamp = new Date().toLocaleTimeString();


        setCpuData(prev => [...prev.slice(-119), { time: timestamp, value: cpu }]);
        setMemData(prev => [...prev.slice(-119), { time: timestamp, value: mem }]);


        setCurrentMetrics({ cpu, mem, qps, abt });

        if (cpu >= 90) {
          setStatusMessage({ text: "Your bidding is stopped", color: "secondary" }); // Using secondary for Grey
        } else if (cpu >= 80) {
          setStatusMessage({ text: "Critical position message", color: "danger" });
        } else if (cpu >= 60) {
          setStatusMessage({ text: "Warning message", color: "warning" });
        } else if (cpu >= 40) {
          setStatusMessage({ text: "Your system is good", color: "primary" });
        } else {
          setStatusMessage({ text: "System performance is optimal", color: "success" });
        }
      }
    } catch (error) {
      console.error("Error fetching system status:", error);
      setStatusMessage({ text: "Error connecting to monitoring service", color: "danger" });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Fetch every 30 seconds
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const hasViewPermission = canView("System Health");
    setCanViewUser(hasViewPermission);
  }, []);


  const currentCpuMax = cpuData.length > 0 ? Math.max(...cpuData.map(d => d.value)) : 100;

  return (
    <>
      {canViewUser && (
        <div className="content">
          <Row>
            <Col md="12">
              <Card className="card-chart">
                <CardHeader>
                  <Row>
                    <Col className="text-left" sm="6">

                      <CardTitle tag="h2">System Health Monitor</CardTitle>
                    </Col>
                    <Col sm="6">
                      <Alert color={statusMessage.color} className="mt-2 text-center text-uppercase font-weight-bold">
                        {statusMessage.text}
                      </Alert>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <Row className="mb-4">
                    <Col lg="3" md="6">
                      <div className="text-center p-3 border rounded shadow-sm">
                        <h4 className="text-primary mb-1">{currentMetrics.cpu}%</h4>
                        <p className="text-muted mb-0">CPU USAGE</p>
                      </div>
                    </Col>
                    <Col lg="3" md="6">
                      <div className="text-center p-3 border rounded shadow-sm">
                        <h4 className="text-success mb-1">{currentMetrics.mem} MB</h4>
                        <p className="text-muted mb-0">MEMORY USED</p>
                      </div>
                    </Col>
                    {/* <Col lg="3" md="6">
                  <div className="text-center p-3 border rounded shadow-sm">
                    <h4 className="text-warning mb-1">{currentMetrics.qps}</h4>
                    <p className="text-muted mb-0">QPS</p>
                  </div>
                </Col>
                <Col lg="3" md="6">
                  <div className="text-center p-3 border rounded shadow-sm">
                    <h4 className="text-info mb-1">{currentMetrics.abt} ms</h4>
                    <p className="text-muted mb-0">AVG BID TIME</p>
                  </div>
                </Col> */}
                  </Row>

                  <Row>
                    <Col md="6">
                      <div className="chart-area" style={{ height: "300px", marginTop: "40px" }}>
                        <h4 className="text-center mb-3">CPU Usage Profile</h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={cpuData}>
                            <defs>
                              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#41b0ffff" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#afddfeff" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="strokeGradient" x1="0" y1="0" x2="0" y2="1">
                                {/* Dynamic color thresholds based on the actual data range 
                                Formula: Offset = 1 - (Threshold / currentCpuMax)
                                We use Math.max(0, ...) to ensure offsets stay within 0-1 range.
                            */}

                                {/* 91 to 100 - grey line */}
                                <stop offset="0%" stopColor={currentCpuMax >= 91 ? "#888888" : "#2CA8FF"} />
                                <stop offset={`${Math.max(0, 1 - (91 / currentCpuMax)) * 100}%`} stopColor="#888888" />

                                {/* 81 to 90 - red line */}
                                <stop offset={`${Math.max(0, 1 - (90 / currentCpuMax)) * 100}%`} stopColor="#ff3636" />
                                <stop offset={`${Math.max(0, 1 - (81 / currentCpuMax)) * 100}%`} stopColor="#ff3636" />

                                {/* 61 to 80 - light orange line */}
                                <stop offset={`${Math.max(0, 1 - (80 / currentCpuMax)) * 100}%`} stopColor="#ffb236" />
                                <stop offset={`${Math.max(0, 1 - (61 / currentCpuMax)) * 100}%`} stopColor="#ffb236" />

                                {/* 41 to 60 - blue line */}
                                <stop offset={`${Math.max(0, 1 - (60 / currentCpuMax)) * 100}%`} stopColor="#2CA8FF" />
                                <stop offset={`${Math.max(0, 1 - (41 / currentCpuMax)) * 100}%`} stopColor="#2CA8FF" />

                                {/* 0 to 40 - green line (Optimal) */}
                                <stop offset={`${Math.max(0, 1 - (40 / currentCpuMax)) * 100}%`} stopColor="#2CA8FF" />
                                <stop offset="100%" stopColor="#2CA8FF" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis
                              dataKey="time"
                              fontSize={10}
                              stroke="#888"
                              tickLine={false}
                              axisLine={false}
                              interval={19}
                              minTickGap={30}
                            />
                            <YAxis
                              domain={[0, 100]}
                              ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                            />

                            <Tooltip
                              contentStyle={{ backgroundColor: "#1e1e2f", border: "none", borderRadius: "8px", color: "#fff" }}
                              itemStyle={{ color: "#fff" }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              name="CPU Usage"
                              stroke="url(#strokeGradient)"
                              fillOpacity={1}
                              fill="url(#colorCpu)"
                              strokeWidth={3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Col>
                    <Col md="6">
                      <div className="chart-area" style={{ height: "300px", marginTop: "40px" }}>
                        <h4 className="text-center mb-3">Memory Consumption</h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={memData}>
                            <defs>
                              <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#18ce0f" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#18ce0f" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis
                              dataKey="time"
                              fontSize={10}
                              stroke="#888"
                              tickLine={false}
                              axisLine={false}
                              interval={19}
                              minTickGap={30}
                            />
                            <YAxis />

                            <Tooltip
                              contentStyle={{ backgroundColor: "#1e1e2f", border: "none", borderRadius: "8px", color: "#fff" }}
                              itemStyle={{ color: "#fff" }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              name="Memory (MB)"
                              stroke="#18ce0f"
                              fillOpacity={1}
                              fill="url(#colorMem)"
                              strokeWidth={3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Col>
                  </Row>
                </CardBody>

              </Card>
            </Col>
          </Row>
        </div>
      )}
      {!canViewUser && (
        <div className="alert alert-warning mt-3" style={{ margin: '20px' }}>
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the System Health.
        </div>
      )}
    </>
  );
};

export default SystemHealth;
