import { useState } from "react";
import { fetchAiDataQuality, uploadDataset } from "../api/client.js";
import DataQualityPanel from "./DataQualityPanel.jsx";

function DatasetUpload() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [qualityReport, setQualityReport] = useState(null);

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const csvContent = await file.text();
      const quality = await fetchAiDataQuality({
        fileName: file.name,
        csvContent,
      });
      setQualityReport(quality);

      const result = await uploadDataset({
        file_name: file.name,
        csv_content: csvContent,
      });

      setStatus(
        `Loaded ${result.rows_loaded} rows from ${result.data_source}. Refresh the page to reload the new dataset.`
      );
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <section className="card upload-card-stack">
      <div className="upload-card">
        <div>
          <p className="section-label">Data Source</p>
          <h3>Upload Sales CSV</h3>
          <p className="section-copy">
            Replace the active dataset with your own `date, store, item, sales` history.
          </p>
        </div>
        <label className="upload-button button button-primary">
          <input type="file" accept=".csv,text/csv" onChange={handleChange} disabled={loading} />
          {loading ? "Uploading..." : "Choose CSV"}
        </label>
      </div>
      {status && <p className="status">{status}</p>}
      {error && <p className="status error">{error}</p>}
      <DataQualityPanel report={qualityReport} />
    </section>
  );
}

export default DatasetUpload;
