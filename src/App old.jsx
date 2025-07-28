import { useState } from 'react';
import { useDropzone } from 'react-dropzone';import * as XLSX from 'xlsx';
import { extractMetrics } from './lib/parseToast';
import { downloadFilledWorkbook } from './lib/fillTemplate';

export default function App() {
  const [files, setFiles] = useState([]);          // File[] we got from drop

  const onDrop = (accepted) => setFiles(accepted);
  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({ onDrop, accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } });

  async function handleConvert() {
    if (files.length !== 3) return alert('Drop exactly THREE Toast .xlsx files');
    // Map by filename keywords so order doesn’t matter
    const map = Object.fromEntries(
      files.map((f) => [f.name.toLowerCase(), f])
    );
    const [general, lunch, dinner] = ['general', 'lunch', 'dinner']
      .map((k) => Object.values(map).find((f) => f.name.toLowerCase().includes(k)));

    const [generalWb, lunchWb, dinnerWb] = await Promise.all(
      [general, lunch, dinner].map((file) =>
        file.arrayBuffer().then((buf) => XLSX.read(buf, { type: 'array' }))
      )
    );

    const cellMap = extractMetrics({ generalWb, lunchWb, dinnerWb });
    await downloadFilledWorkbook(cellMap);
  }

  return (
    <main className="grid place-items-center h-screen gap-6 font-sans text-gray-800">
      <h1 className="text-2xl font-bold">Toast → Bookkeeping Converter</h1>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 w-80 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {files.length
          ? files.map((f) => <p key={f.name}>{f.name}</p>)
          : 'Drag the 3 Toast .xlsx files here'}
      </div>

      <button
        onClick={handleConvert}
        disabled={files.length !== 3}
        className={`px-6 py-2 rounded-lg text-white
          ${files.length === 3 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
      >
        Convert & Download
      </button>
    </main>
  );
}
