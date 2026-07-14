import React, { useState, useEffect } from "react";
import WorldMap from "react-svg-worldmap";
// import { countrywise } from "../api/Api.jsx";

const iso3ToIso2 = {
  "AFG": "AF", "ALB": "AL", "DZA": "DZ", "ASM": "AS", "AND": "AD", "AGO": "AO",
  "AIA": "AI", "ATA": "AQ", "ATG": "AG", "ARG": "AR", "ARM": "AM", "ABW": "AW",
  "AUS": "AU", "AUT": "AT", "AZE": "AZ", "BHS": "BS", "BHR": "BH", "BGD": "BD",
  "BRB": "BB", "BLR": "BY", "BEL": "BE", "BLZ": "BZ", "BEN": "BJ", "BMU": "BM",
  "BTN": "BT", "BOL": "BO", "BIH": "BA", "BWA": "BW", "BVT": "BV", "BRA": "BR",
  "IOT": "IO", "BRN": "BN", "BGR": "BG", "BFA": "BF", "BDI": "BI", "CPV": "CV",
  "KHM": "KH", "CMR": "CM", "CAN": "CA", "CYM": "KY", "CAF": "CF", "TCD": "TD",
  "CHL": "CL", "CHN": "CN", "CXR": "CX", "CCK": "CC", "COL": "CO", "COM": "KM",
  "COD": "CD", "COG": "CG", "COK": "CK", "CRI": "CR", "CIV": "CI", "HRV": "HR",
  "CUB": "CU", "CYP": "CY", "CZE": "CZ", "DNK": "DK", "DJI": "DJ", "DMA": "DM",
  "DOM": "DO", "ECU": "EC", "EGY": "EG", "SLV": "SV", "GNQ": "GQ", "ERI": "ER",
  "EST": "EE", "SWZ": "SZ", "ETH": "ET", "FLK": "FK", "FRO": "FO", "FJI": "FJ",
  "FIN": "FI", "FRA": "FR", "GUF": "GF", "PYF": "PF", "ATF": "TF", "GAB": "GA",
  "GMB": "GM", "GEO": "GE", "DEU": "DE", "GHA": "GH", "GIB": "GI", "GRC": "GR",
  "GRL": "GL", "GRD": "GD", "GLP": "GP", "GUM": "GU", "GTM": "GT", "GGY": "GG",
  "GIN": "GN", "GNB": "GW", "GUY": "GY", "HTI": "HT", "HMD": "HM", "VAT": "VA",
  "HND": "HN", "HKG": "HK", "HUN": "HU", "ISL": "IS", "IND": "IN", "IDN": "ID",
  "IRN": "IR", "IRQ": "IQ", "IRL": "IE", "IMN": "IM", "ISR": "IL", "ITA": "IT",
  "JAM": "JM", "JPN": "JP", "JEY": "JE", "JOR": "JO", "KAZ": "KZ", "KEN": "KE",
  "KIR": "KI", "PRK": "KP", "KOR": "KR", "KWT": "KW", "KGZ": "KG", "LAO": "LA",
  "LVA": "LV", "LBN": "LB", "LSO": "LS", "LBR": "LR", "LBY": "LY", "LIE": "LI",
  "LTU": "LT", "LUX": "LU", "MAC": "MO", "MKD": "MK", "MDG": "MG", "MWI": "MW",
  "MYS": "MY", "MDV": "MV", "MLI": "ML", "MLT": "MT", "MHL": "MH", "MTQ": "MQ",
  "MRT": "MR", "MUS": "MU", "MYT": "YT", "MEX": "MX", "FSM": "FM", "MDA": "MD",
  "MCO": "MC", "MNG": "MN", "MNE": "ME", "MSR": "MS", "MAR": "MA", "MOZ": "MZ",
  "MMR": "MM", "NAM": "NA", "NRU": "NR", "NPL": "NP", "NLD": "NL", "NCL": "NC",
  "NZL": "NZ", "NIC": "NI", "NER": "NE", "NGA": "NG", "NIU": "NU", "NFK": "NF",
  "MNP": "MP", "NOR": "NO", "OMN": "OM", "PAK": "PK", "PLW": "PW", "PSE": "PS",
  "PAN": "PA", "PNG": "PG", "PRY": "PY", "PER": "PE", "PHL": "PH", "PCN": "PN",
  "POL": "PL", "PRT": "PT", "PRI": "PR", "QAT": "QA", "REU": "RE", "ROU": "RO",
  "RUS": "RU", "RWA": "RW", "BLM": "BL", "SHN": "SH", "KNA": "KN", "LCA": "LC",
  "MAF": "MF", "SPM": "PM", "VCT": "VC", "WSM": "WS", "SMR": "SM", "STP": "ST",
  "SAU": "SA", "SEN": "SN", "SRB": "RS", "SYC": "SC", "SLE": "SL", "SGP": "SG",
  "SXM": "SX", "SVK": "SK", "SVN": "SI", "SLB": "SB", "SOM": "SO", "ZAF": "ZA",
  "SGS": "GS", "SSD": "SS", "ESP": "ES", "LKA": "LK", "SDN": "SD", "SUR": "SR",
  "SJM": "SJ", "SWZ": "SZ", "SWE": "SE", "CHE": "CH", "SYR": "SY", "TWN": "TW",
  "TJK": "TJ", "TZA": "TZ", "THA": "TH", "TLS": "TL", "TGO": "TG", "TKL": "TK",
  "TON": "TO", "TTO": "TT", "TUN": "TN", "TUR": "TR", "TKM": "TM", "TCA": "TC",
  "TUV": "TV", "UGA": "UG", "UKR": "UA", "ARE": "AE", "GBR": "GB", "USA": "US",
  "UMI": "UM", "URY": "UY", "UZB": "UZ", "VUT": "VU", "VEN": "VE", "VNM": "VN",
  "VGB": "VG", "VIR": "VI", "WLF": "WF", "ESH": "EH", "YEM": "YE", "ZMB": "ZM",
  "ZWE": "ZW"
};

export default function WorldMapAnalytics({ dateFrom, dateTo }) {
  const [mapData, setMapData] = useState([]);
  const [countryDetails, setCountryDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        if (!dateFrom || !dateTo) return;
        setIsLoading(true);
        const payload = {
          startDate: dateFrom,
          endDate: dateTo
        };
        // const response = await countrywise(payload);
        // const data = response.data || [];
        // const firstItem = data[0] || {};
        // const countriesList = firstItem.impressionCtrCountries || [];

        const formattedMapData = [];
        const detailsMap = {};

        // countriesList.forEach(item => {
        //   let code = item.country;
        //   if (!code) return;
        //   if (code.length === 3) {
        //     code = iso3ToIso2[code.toUpperCase()] || code.substring(0, 2);
        //   }
        //   const lowerCode = code.toLowerCase();

        //   formattedMapData.push({
        //     country: lowerCode,
        //     value: item.totalImpressions || 0
        //   });

        //   detailsMap[lowerCode] = {
        //     totalImpressions: item.totalImpressions || 0,
        //     totalClicks: item.totalClicks || 0,
        //     totalCtr: item.totalCtr || 0
        //   };
        // });

        setMapData(formattedMapData.length > 0 ? formattedMapData : [{ country: "xx", value: 0 }]); // fallback empty data
        setCountryDetails(detailsMap);
      } catch (error) {
        console.error("Error fetching country reporting data:", error);
        setMapData([{ country: "xx", value: 0 }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountryData();
  }, [dateFrom, dateTo]);

  // Remove native <title> elements added by react-svg-worldmap to prevent double tooltips
  useEffect(() => {
    const timer = setInterval(() => {
      const wrapper = document.getElementById("world-map-wrapper");
      if (wrapper) {
        const titles = wrapper.querySelectorAll("path title");
        if (titles.length > 0) {
          titles.forEach(t => t.remove());
        }
      }
    }, 500);
    return () => clearInterval(timer);
  }, [mapData]);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "14px 16px 12px",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
        height: "100%",
        minHeight: 420,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <p
        style={{
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          margin: "0 0 12px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#222",
          textAlign: "center",
        }}
      >
        Country Reporting
      </p>
      <div id="world-map-wrapper" style={{ flex: 1, minHeight: 320, position: "relative" }}>
        {isLoading ? (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", animation: "spin 1s linear infinite" }}>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        ) : (
          <WorldMap
          color="red"
          tooltipBgColor="#faebed"
          tooltipTextColor="#000000"
          borderColor="grey"
          frameColor="none"
          size="xl"
          data={mapData}
          styleFunction={({ countryValue }) => {
            if (countryValue !== undefined) {
              return { fill: "rgb(255, 0, 0)", fillOpacity: 1, stroke: "black", strokeWidth: 1 };
            }
            return { fill: "white", fillOpacity: 1, stroke: "black", strokeWidth: 1 };
          }}
          tooltipTextFunction={({ countryName, countryCode, countryValue }) => {
            const details = countryDetails[countryCode.toLowerCase()];
            const formatLine = (text) => {
              const padLen = 34 - text.length;
              return text + (padLen > 0 ? " ".repeat(padLen) : " ");
            };
            if (details) {
              return formatLine(countryName) +
                     formatLine(`Impressions: ${(details.totalImpressions || 0).toLocaleString()}`) +
                     formatLine(`Clicks: ${(details.totalClicks || 0).toLocaleString()}`) +
                     `CTR: ${(details.totalCtr || 0).toFixed(2)}%`;
            }
            return formatLine(countryName) + `Impressions: ${(countryValue || 0).toLocaleString()}`;
          }}
          frame
        />
        )}
      </div>
    </div>
  );
}