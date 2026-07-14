
import React, { useState, useEffect } from "react";
import { Row, Col } from "reactstrap";
import { useViewContext } from "../ViewContext";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);

const Dashboard = () => {
  const vx = useViewContext();
  const [rowData, setRowData] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  // Table Columns — now campaign-only
  const [colDefs] = useState([
    { field: "SerialNo", headerName: "S.No", width: 70 },
    { field: "CampaignID", filter: true, floatingFilter: true, width: 120 },
    { field: "TotalImpressions", width: 120 },
    { field: "TotalClicks",width: 120 },
    { field: "Conversions",width: 120 },
    { field: "CTR",width: 120 },
    { field: "CVR",width: 120 },
    { field: "CPC",width: 120 },
    { field: "CPA",width: 120 },
    { field: "AdvertiserECPM", headerName: "Advertiser eCPM", width: 120 },
    { field: "Spend",width: 120 },
    { field: "TotalBudget", headerName: "Total Budget", width: 120 },
  ]);

  const safeNum = (v) => (isFinite(Number(v)) ? Number(v).toFixed(2) : "0.00");

  // Load Campaign Budget
  const loadCampaignBudget = async () => {
    try {
      const budgetData = await vx.GetCampaignBudgetCmd();
      const budgetMap = {};

      if (Array.isArray(budgetData)) {
        budgetData.forEach((c, index) => {
          const id = c.id ?? c.name ?? `Campaign_${index + 1}`;
          budgetMap[id] = c.total_budget ?? 0;
        });
      } else if (budgetData?.campaigns) {
        budgetData.campaigns.forEach((c) => {
          const id = c.id ?? c.name ?? "UnknownCampaign";
          budgetMap[id] = c.total_budget ?? 0;
        });
      }

      return budgetMap;
    } catch (err) {
      console.error("Error fetching CampaignBudget:", err);
      return {};
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!vx.loggedIn) return;

      const budgetMap = await loadCampaignBudget();

      const username = process.env.REACT_APP_ES_USERNAME;
      const password = "SdUAbZHaBXAiXzyu9uDw";
    //  const url = "https://data.adaxxpro.com:9200/kafka-*/_search";
   // const url = "https://data.adaxxpro.com/es/kafka-*/_search"
    const url = "https://data.adaxxpro.com/es/kafka-*/_search";

      const query = {
        size: 0,
        aggs: {
          by_campaign: {
            terms: { field: "adid.keyword", size: 1000 },
            aggs: {
              impressions_docs: {
                filter: { term: { "logtype.keyword": "wins" } },
                aggs: { impressions: { sum: { field: "win" } } }
              },
              click_docs: {
                filter: {
                  term: {
                    "serialClass.keyword": "com.jacamars.dsp.rtb.commands.PixelClickConvertLog"
                  }
                },
                aggs: { clicks: { value_count: { field: "adid.keyword" } } }
              },
              conversion_docs: {
                filter: {
                  bool: {
                    must: [
                      {
                        term: {
                          "serialClass.keyword":
                            "com.jacamars.dsp.rtb.commands.PostbackEventLog"
                        }
                      },
                      { term: { "postbackevent.keyword": "conversion" } }
                    ]
                  }
                },
                aggs: { conversions: { value_count: { field: "adid.keyword" } } }
              },
              ctr: {
                bucket_script: {
                  buckets_path: {
                    imp: "impressions_docs>impressions",
                    clk: "click_docs>clicks"
                  },
                  script: "params.imp == 0 ? 0 : (params.clk / params.imp) * 100"
                }
              },
              cvr: {
                bucket_script: {
                  buckets_path: {
                    imp: "impressions_docs>impressions",
                    conv: "conversion_docs>conversions"
                  },
                  script:  "params.imp == 0 ? 0 : (params.conv / params.imp) * 100"
                }
              }
            }
          }
        }
      };

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(username + ":" + password),
            "Content-Type": "application/json"
          },
          body: JSON.stringify(query),
         // credentials: "include"  // <-- must be added
        });

        const data = await response.json();
        const campaigns = [];

        if (data.aggregations?.by_campaign?.buckets) {
          let serialNo = 1;

          data.aggregations.by_campaign.buckets.forEach((camp) => {
            const campaignID = camp.key;

            // Values from ES
            const impressions = camp.impressions_docs?.impressions?.value || 0;
            const clicks = camp.click_docs?.clicks?.value || 0;
            const conversions =
              camp.conversion_docs?.conversions?.value || 0;

            const ctr = camp.ctr?.value || 0;
            const cvr = camp.cvr?.value || 0;

            // Budget
            const totalBudget = budgetMap[campaignID] ?? 0;

            // Spend = Budget
            const spend = totalBudget;

            // CPM = (Spend / impressions) * 1000
            const advertiserECPM = impressions
              ? ((spend / impressions) * 1000).toFixed(2)
              : "0.00";

            const cpc = clicks ? (spend / clicks).toFixed(2) : "0.00";
            const cpa = conversions
              ? (spend / conversions).toFixed(2)
              : "0.00";

            campaigns.push({
              SerialNo: serialNo++,
              CampaignID: campaignID,
              TotalImpressions: impressions,
              TotalClicks: clicks,
              Conversions: conversions,
              CTR: safeNum(ctr),
              CVR: safeNum(cvr),
              CPC: "$" + cpc,
              CPA: "$" + cpa,
              AdvertiserECPM: "$" + advertiserECPM,
              Spend: "$" + spend.toFixed(2),
              TotalBudget: spend
            });
          });
        }

        setRowData(campaigns);

      } catch (error) {
        console.error("Error fetching ES data:", error);
      }
    };

    fetchData();
  }, [vx.loggedIn]);

  return (
    <div className="content">
      <Row>
        <Col xs="12">
          <div className="ag-theme-alpine ag-theme-balham custom-ag-grid">
            <AgGridReact
              rowData={rowData}
              columnDefs={colDefs}
              sideBar={true}
              enableCharts={true}
              domLayout="autoHeight"
              cellSelection={true}
              pagination={true}
              paginationPageSize={20}
              rowHeight={26}
              headerHeight={26}
              onRowClicked={(params) => setSelectedRowIndex(params.rowIndex)}
              onCellFocused={(params) => {
                if (params.rowIndex != null)
                  setSelectedRowIndex(params.rowIndex);
              }}
              getRowStyle={(params) =>
                params.node.rowIndex === selectedRowIndex
                  ? {
                      backgroundColor: "#62903e",
                      fontWeight: "bold",
                      color: "#fff"
                    }
                  : null
              }
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;