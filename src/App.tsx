import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { extractMetrics } from './lib/parseToast';
import { downloadFilledWorkbook } from './lib/fillTemplate';
import React, { useRef } from 'react';

type FileMap = {
  general: File | null;
  lunch: File | null;
  dinner: File | null;
};

export default function App() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    day: '',
    date: '',
    location: ''
  });


  const [files, setFiles] = useState<FileMap>({
    general: null,
    lunch: null,
    dinner: null,
  });

  const makeDrop = (key: keyof FileMap) =>
    useCallback((accepted: File[]) => {
      if (accepted.length > 0) {
        setFiles(f => ({ ...f, [key]: accepted[0] }));
      }
    }, [key]);


  const dropzones = {
    general: useDropzone({
      onDrop: makeDrop('general'),
      accept: { 'application/*': ['.xlsx', '.xls', '.csv'] },
      multiple: false
    }),
    lunch: useDropzone({
      onDrop: makeDrop('lunch'),
      accept: { 'application/*': ['.xlsx', '.xls', '.csv'] },
      multiple: false
    }),
    dinner: useDropzone({
      onDrop: makeDrop('dinner'),
      accept: { 'application/*': ['.xlsx', '.xls', '.csv'] },
      multiple: false
    })
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  async function handleConvert() {
    if (!files.general || !files.lunch || !files.dinner)
      return alert('Please upload all three files (general, lunch, dinner)');

    try {
      await fetch('/api/receipts/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const [generalWb, lunchWb, dinnerWb] = await Promise.all(
        [files.general, files.lunch, files.dinner].map((file) =>
          file
            .arrayBuffer()
            .then((buf) => XLSX.read(buf, { type: 'array' }))
        )
      );

      const cellMap = extractMetrics({ generalWb, lunchWb, dinnerWb });
      
      await downloadFilledWorkbook(cellMap, form);

      setFiles({ general: null, lunch: null, dinner: null });
      setForm({ firstName: '', lastName: '', day: '', date: '', location: '' });
    } catch (err) {
      console.error(err);
      alert('Something went wrong — see console');
    }
  }

  /*UI*/
  return (
  <main className="flex flex-col items-center justify-center h-screen gap-6 font-sans text-gray-800">
    <h1 className="text-2xl font-bold">Toast EXCEL → FINAL EXCEL</h1>


    <p className="text-center text-gray-600 max-w-md">
    Please download <strong>only Excel (.xlsx) files</strong> exported from toasttab.com. Drag and drop each file into its designated area below. Ensure that files for <strong>Lunch</strong> include data before 3PM, and files for <strong>Dinner</strong> include data after 3PM.
    </p>

    <p className="text-center text-gray-600 max-w-md">
    Please fill in ALL details below.
    </p>

    <div className="grid gap-2 w-full max-w-md mx-auto">
      <div className="flex flex-row gap-2 w-full">
        <input
          className="border rounded flex-1 p-2 text-center"
          name="firstName"
          placeholder="First Name"
          value={form.firstName}
          onChange={handleInput}
          autoComplete="given-name"
        />
        <input
          className="border rounded flex-1 p-2 text-center"
          name="lastName"
          placeholder="Last Name"
          value={form.lastName}
          onChange={handleInput}
          autoComplete="family-name"
        />
      </div>
      <select
        className="border p-2 rounded text-center"
        name="day"
        value={form.day}
        onChange={handleInput}
      >
        <option value="" disabled>Select Day of Week</option>
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <input
        className="border p-2 rounded text-center"
        name="date"
        type="date"
        value={form.date}
        onChange={handleInput}
      />
      <select
        className="border p-2 rounded text-center"
        name="location"
        value={form.location}
        onChange={handleInput}
      >
        <option value="" disabled>Select China Rose location</option>
        <option value="CHINA ROSE #1 - 7046 W MILITARY DR">
          CHINA ROSE #1 - 7046 W MILITARY DR
        </option>
        <option value="CHINA ROSE #2 - 2535 SW MILITARY DR">
          CHINA ROSE #2 - 2535 SW MILITARY DR
        </option>
      </select>
    </div>

    <div className="flex flex-col gap-4">
      <p className="text-center text-gray-600 max-w-md">
    
      </p>
      {(['general', 'lunch', 'dinner'] as (keyof FileMap)[]).map((key) => {
        const { getRootProps, getInputProps, isDragActive } = dropzones[key];
        return (
          <div
            key={key}
            {...getRootProps()}
            className={`flex flex-col items-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition ${
              isDragActive ? 'border-blue-600 bg-blue-200 shadow-lg scale-105' : 'border-gray-400 bg-gray-50'
            } hover:bg-blue-50 active:bg-blue-100`}
            tabIndex={0}
            style={{ outline: 'none' }}
          >
            <div className="font-bold mb-4">{key.toUpperCase()} REPORT</div>
            <input {...getInputProps()} style={{ display: 'none' }} />
            {files[key] ? (
              <div className="mt-2 text-blue-700 font-medium">{files[key]!.name}</div>
            ) : (
              <button
                type="button"
                className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition shadow"
                onClick={e => {
                  e.preventDefault();
                  const input = (e.currentTarget.parentElement as HTMLElement).querySelector('input[type="file"]') as HTMLInputElement | null;
                  input?.click();
                }}
              >
                Drag or click to select the {key} .xlsx
              </button>
            )}
          </div>
        );
      })}
    </div>

    <p className="text-center text-gray-600 max-w-md">
    
    </p>

    <p className="text-center text-gray-600 max-w-md">
    Once <strong>ALL REPORTs</strong> are uploaded, click the button below to download the day's sales summary.
    </p>

    <p className="text-center text-gray-600 max-w-md">
    <strong>REMEMBER TO ENABLE EDITING TO SEE FULL CHANGES</strong>
    </p>

    <button
      onClick={handleConvert}
      disabled={!files.general || !files.lunch || !files.dinner}
      className={`px-6 py-2 rounded-lg text-white transition shadow ${
        files.general && files.lunch && files.dinner
          ? 'bg-orange-500 hover:bg-orange-600'
          : 'bg-gray-400 cursor-not-allowed'
      }`}
    >
      Convert & Download
    </button>
  </main>
);
}