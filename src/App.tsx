import React, { useState } from 'react';
import ChinaRoseConverter from './components/excelConverter';
import GroupCsvToXlsx   from './components/GroupCsvToXlsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<'Excel' | 'CSV'>('Excel');

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center">
      <button
        onClick={() => setActiveTab(activeTab === 'CSV' ? 'Excel' : 'CSV')}
        className="fixed left-[24px] top-[24px] px-10 py-10 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
      >
        Switch to {activeTab === 'CSV' ? 'Excel' : 'CSV'} Converter
      </button>

      {activeTab === 'CSV' ? <GroupCsvToXlsx /> : < ChinaRoseConverter/>}
    </div>
  );
}
