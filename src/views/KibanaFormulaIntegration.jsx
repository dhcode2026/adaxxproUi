import React, { useState, useEffect } from 'react';
import { getkibanaFormula } from '../api/Api';
import KibanaDataDisplay from '../components/KibanaDataDisplay';

/**
 * Complete example showing:
 * 1. How to call getkibanaFormula API
 * 2. How to pass the payload
 * 3. How to map and display the data
 */
export default function KibanaFormulaIntegration() {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data on component mount
    fetchKibanaData();
  }, []);

  const fetchKibanaData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Prepare the payload
      const payload = {
        userId: 1,
        allBrandAccess: true,
        // Optional filters - uncomment to use:
        // brandId: [28],
        // groupId: 29,
        // campaignId: 306,
      };

      console.log('📤 Sending payload to API:', payload);

      // 2. Call the getkibanaFormula function
      const response = await getkibanaFormula(payload);

      console.log('✅ API Response:', response);

      // 3. Store the response
      setApiResponse(response);
    } catch (err) {
      console.error('❌ Error fetching kibana formula:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ marginBottom: '30px' }}>
        <h1>Kibana Formula Data Mapping</h1>
        <p>Maps: Brands → Groups → Campaigns + Audiences, Conversions, CRM Audiences, Universal Pixels</p>
      </header>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #1976d2',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          ⏳ Loading data...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#ffebee',
            border: '1px solid #d32f2f',
            borderRadius: '4px',
            marginBottom: '20px',
            color: '#d32f2f',
          }}
        >
          ❌ Error: {error}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchKibanaData}
        disabled={loading}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          backgroundColor: '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Loading...' : '🔄 Refresh Data'}
      </button>

      {/* Data Display */}
      {apiResponse && !loading && !error && (
        <div>
          <div
            style={{
              padding: '15px',
              backgroundColor: '#c8e6c9',
              border: '1px solid #2e7d32',
              borderRadius: '4px',
              marginBottom: '20px',
            }}
          >
            ✅ Data successfully fetched and mapped!
          </div>
          <KibanaDataDisplay apiResponse={apiResponse} />
        </div>
      )}

      {/* Code Example */}
      <section
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
        }}
      >
        <h2>How to Use This</h2>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
          }}
        >
          {`// 1. Import the function
import { getkibanaFormula } from '../api/Api';

// 2. Prepare payload
const payload = {
  userId: 1,
  allBrandAccess: true,
  brandId: [28],        // optional
  groupId: 29,          // optional
  campaignId: 306       // optional
};

// 3. Call the API
const response = await getkibanaFormula(payload);

// 4. Map the data
import { mapKibanaData } from '../utils/kibanaDataMapper';
const mappedData = mapKibanaData(response);

// 5. Access specific data
const brand = mappedData.brandMap[22];
const campaigns = mappedData.campaignMap;
const audiences = mappedData.audienceMap;
const conversions = mappedData.conversionMap;`}
        </pre>
      </section>

      {/* Response Structure */}
      {apiResponse && (
        <section
          style={{
            marginTop: '40px',
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <h2>API Response Structure</h2>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px',
            }}
          >
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
