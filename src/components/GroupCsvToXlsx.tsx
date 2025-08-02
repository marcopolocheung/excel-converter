import React, { useState } from "react";
import { parseCsvAndExport } from "../lib/parseCSV";

const GroupCsvToXlsx: React.FC = () => {
  const [status, setStatus] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("Parsing CSV...");

    parseCsvAndExport(
      file,
      () => setStatus("Done! XLSX downloaded."),
      (err) => {
        console.error("Parse error:", err);
        setStatus("Error parsing file.");
      }
    );
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">CSV Grouping Tool</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} className="border p-2" />
      <p className="text-sm text-gray-600">{status}</p>
    </div>
  );
};

export default GroupCsvToXlsx;