import React, { useState } from "react";
import { parseCsvAndExport } from "../lib/parseCSV";

const GroupCsvToXlsx: React.FC = () => {

  const [plant, setPlant]         = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");

  const [status, setStatus] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setStatus("File ready. Click convert to download.");
  };

  const handleConvertAndDownload = () => {
    if (!csvFile) {
      setStatus("No file selected.");
      return;
    }
    
    if (!plant) { setStatus("Choose China Rose #3 or #2."); return; } 
    if (!startDate || !endDate) { setStatus("Pick start & end dates."); return; }

    setStatus("Parsing CSV...");

    parseCsvAndExport(
      csvFile,
      () => setStatus("Done! XLSX downloaded."),
      (err) => {
        console.error("Parse error:", err);
        setStatus("Error parsing file.");
      },
      { location: plant, startDate, endDate }
    );
  };

  return (
    <main className="min-h-screen w-screen w-full flex items-center justify-center">
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">CHINA ROSE CSV Hours Converter</h1>

      <select
        value={plant}
        onChange={e => setPlant(e.target.value)}
        className="border p-2 w-full"
      >
        <option value="">Select location</option>
        <option value="CHINA ROSE #3 - 7046 W MILITARY DR">CHINA ROSE #3 - 7046 W MILITARY DR</option>
        <option value="CHINA ROSE #2 - 2535 SW MILITARY DR">CHINA ROSE #2 - 2535 SW MILITARY DR</option>
      </select>

      <label className="block font-bold mt-2">Start date</label> 
      <input
        type="date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
        className="border p-2 w-full"
      />

      <label className="block font-bold mt-2">End date</label> 
      <input
        type="date"
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
        className="border p-2 w-full"
      />

      <input type="file" accept=".csv" onChange={handleFileUpload} className="border p-2 w-full" />

      <button
        onClick={handleConvertAndDownload}
        disabled={!csvFile || status === "Parsing CSV..."}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Convert & Download
      </button>

      <p className="text-sm text-gray-600">{status}</p>
    </div>
    </main>
  );
};

export default GroupCsvToXlsx;