import { useRawProducts } from "./useRawProducts";

export function RawJsonView() {
  const { data, loading, error } = useRawProducts();

  if (loading) {
    return (
      <div className="view-container">
        <div className="loading">Loading raw JSON data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-container">
        <div className="error">
          Error: {error}
          <br />
          <small>Make sure the API is running</small>
        </div>
      </div>
    );
  }

  // Super simple JSON display
  let jsonString = "";
  try {
    jsonString = JSON.stringify(data, null, 2);
  } catch (err) {
    jsonString = `Error: Could not stringify JSON data. ${err instanceof Error ? err.message : String(err)}`;
  }

  return (
    <div className="view-container">
      <div className="raw-json-container">
        <div className="raw-json-header">
          <h1>Raw JSON Data</h1>
          <p className="content-subtitle">
            Data from /api/pia/products
          </p>
        </div>
        <div className="raw-json-content">
          <pre style={{ 
            margin: 0, 
            padding: '1rem', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '14px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {jsonString}
          </pre>
        </div>
      </div>
    </div>
  );
}
