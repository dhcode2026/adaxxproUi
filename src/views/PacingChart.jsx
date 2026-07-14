import React from 'react';
import { Container, Row, Col, Button, Progress } from 'reactstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PacingChart = () => {
  const data = [
    { name: 'Jan 22', spend: 0, projected: 0 },
    { name: 'Jan 24', spend: 0, projected: 0 },
    { name: 'Jan 26', spend: 0, projected: 0 },
    { name: 'Jan 28', spend: 0, projected: 0 },
    { name: 'Jan 30', spend: 0, projected: 0 },
    { name: 'Feb 01', spend: 0, projected: 0 },
  ];

  const sidebarItemStyle = { marginBottom: '40px' };
  const labelStyle = { color: '#888', fontSize: '11px', marginBottom: '8px' };
  const valueStyle = { fontSize: '11px', fontWeight: '500', color: '#444' };
  const subTextStyle = { color: '#aaa', fontSize: '11px', marginTop: '10px' };

  return (
    <Container fluid className="p-4" id="pacingchart">
      <Row>
        {/* Left Sidebar Metrics */}
        <Col md="4" className="pe-5">
          <div style={sidebarItemStyle}>
            <div className="d-flex justify-content-between">
              <span style={labelStyle}>Yesterday's Advertiser Spend</span>
              <span style={valueStyle}>N/A</span>
            </div>
            <Progress value={0} style={{ backgroundColor: '#f5f5f5' }} />
            <div style={subTextStyle}>N/A</div>
          </div>

          <div style={sidebarItemStyle}>
            <div className="d-flex justify-content-between">
              <span style={labelStyle}>Advertiser Spend to Date</span>
              <span style={valueStyle}>$0.00 USD</span>
            </div>
            <Progress value={0} style={{backgroundColor: '#f5f5f5' }} />
            <div style={subTextStyle}>Enable Advertiser Spend to view graph</div>
          </div>

          <div style={sidebarItemStyle}>
            <div className="d-flex justify-content-between">
              <span style={labelStyle}>KPI to Date</span>
            </div>
            <Progress value={0} style={{ backgroundColor: '#f5f5f5' }} />
            <div style={subTextStyle}>Add KPI Goal to view graph</div>
          </div>
        </Col>

        {/* Right Chart Area */}
        <Col md="8" style={{ borderLeft: '1px solid #eee', paddingLeft: '30px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span style={{ fontSize: '11px', color: '#666' }}>Daily Advertiser Spend</span>
            <Button outline color="secondary" size="sm" style={{ borderColor: '#ddd', color: '#666' }}>
              Export
            </Button>
          </div>

          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eee" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#999', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#999', fontSize: 12 }} 
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip />
                <Legend 
                    verticalAlign="bottom" 
                    align="right" 
                    iconType="plainline"
                    wrapperStyle={{ paddingTop: '20px' }}
                />
                <Line 
                  name="Daily advertiser spend"
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#5a9e3f" 
                  strokeWidth={2} 
                  dot={false} 
                />
                <Line 
                  name="Projected daily advertiser spend"
                  type="monotone" 
                  dataKey="projected" 
                  stroke="#ccc" 
                  strokeDasharray="5 5" 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default PacingChart;