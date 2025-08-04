// components/ChinaRoseConverter.tsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { extractMetrics } from '../lib/parseToast';
import { downloadFilledWorkbook } from '../lib/fillTemplate';

type FileMap = {
  general: File | null;
  lunch: File | null;
  dinner: File | null;
};

export default function ChinaRoseConverter() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    day: '',
    date: '',
    location: '',
    amDeposit: '',
    pmDeposit: '',
    amOverShort: '',
    pmOverShort: ''
  });

  const [files, setFiles] = useState<FileMap>({
    general: null,
    lunch: null,
    dinner: null,
  });

  const [activeTab, setActiveTab] = useState<'main' | 'other'>('main');

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
      const formMetadata = { ...form, submittedAt: new Date().toISOString() };
      console.log("Form metadata (local only):", formMetadata);

      const [generalWb, lunchWb, dinnerWb] = await Promise.all(
        [files.general, files.lunch, files.dinner].map((file) =>
          file.arrayBuffer().then((buf) => XLSX.read(buf, { type: 'array' }))
        )
      );

      const cellMap = extractMetrics({ generalWb, lunchWb, dinnerWb });
      await downloadFilledWorkbook(cellMap, form);

      setFiles({ general: null, lunch: null, dinner: null });
      setForm({
        firstName: '', lastName: '', day: '', date: '', location: '',
        amDeposit: '', pmDeposit: '', amOverShort: '', pmOverShort: ''
      });
    } catch (err) {
      console.error(err);
      alert('Something went wrong — see console');
    }
  }

  return (
  <main className="min-h-screen w-screen w-full flex items-center justify-center">
  <div className="w-full max-w-4xl">
    
    <div className="flex flex-col items-center justify-center w-full max-w-4xl px-4 gap-6">
          <h1 className="text-2xl font-bold">CHINA ROSE Excel Sales Converter</h1>

          <p className="text-center text-white max-w-md">
          Please download <strong>only Excel (.xlsx) files</strong> exported from toasttab.com.
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
              <option value="CHINA ROSE #3 - 7046 W MILITARY DR">
                CHINA ROSE #3 - 7046 W MILITARY DR
              </option>
              <option value="CHINA ROSE #2 - 2535 SW MILITARY DR">
                CHINA ROSE #2 - 2535 SW MILITARY DR
              </option>
            </select>
          </div>

          <div className="flex flex-row gap-4 justify-center w-full max-w-4xl">

            {(['general', 'lunch', 'dinner'] as (keyof FileMap)[]).map((key) => {
              const { getRootProps, getInputProps, isDragActive } = dropzones[key];
              return (
                <div
                  key={key}
                  className="flex flex-col w-64"
                >
                  {/* Title Box */}
                  <div className="bg-gray-200 border border-gray-400 p-2 text-center font-bold text-black">
                    {key.toUpperCase()} REPORT
                  </div>
                  {/* Content Box */}
                  <div
                    {...getRootProps()}
                    className={`flex flex-col items-center justify-center border border-gray-400 bg-gray-200 p-6 cursor-pointer transition min-h-32 ${
                      isDragActive ? 'border-blue-600 bg-blue-200 shadow-lg scale-105' : 'hover:bg-gray-100'
                    }`}
                    tabIndex={0}
                    style={{ outline: 'none' }}
                  >
                    <input {...getInputProps()} style={{ display: 'none' }} />
                    {files[key] ? (
                      <div className="text-blue-700 font-medium text-center">{files[key]!.name}</div>
                    ) : (
                      <button
                        type="button"
                        className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 transition shadow text-sm"
                        onClick={e => {
                          e.preventDefault();
                          const input = (e.currentTarget.parentElement as HTMLElement).querySelector('input[type="file"]') as HTMLInputElement | null;
                          input?.click();
                        }}
                      >
                        Drag or click to select
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div> 

          <p className="text-center text-white max-w-md">
          <strong>REMEMBER TO ENABLE EDITING TO SEE FULL CHANGES</strong>
          </p>

          <div className="flex flex-row gap-2 w-full">
            <input
            className="border p-2 flex-1 rounded text-center"
            name="amDeposit"
            placeholder="AM Deposit"
            value={form.amDeposit}
            onChange={handleInput}
            />
            <input
              className="border p-2 flex-1 rounded text-center"
              name="amOverShort"
              placeholder="AM Over (short)"
              value={form.amOverShort}
              onChange={handleInput}
            />
          </div>
          <div className="flex flex-row gap-2 w-full">  
            <input
              className="border p-2 flex-1 rounded text-center"
              name="pmDeposit"
              placeholder="PM Deposit"
              value={form.pmDeposit}
              onChange={handleInput}
            />
            <input
              className="border p-2 flex-1 rounded text-center"
              name="pmOverShort"
              placeholder="PM Over (short)"
              value={form.pmOverShort}
              onChange={handleInput}
            />
          </div>  

          <button
            onClick={handleConvert}
            disabled={!files.general || !files.lunch || !files.dinner}
            className={`px-6 py-2 rounded-lg text-white transition shadow ${
              files.general && files.lunch && files.dinner
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-400 cursor-not-allowed'
            }`}
          >
            Convert & Download
          </button>
    </div>
    </div>
  </main>
);
}