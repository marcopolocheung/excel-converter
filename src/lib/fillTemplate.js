import ExcelJS from 'exceljs';

// fetch template once per session
let templateArrayBuffer = null;
async function getTemplate() {
  if (templateArrayBuffer) return templateArrayBuffer;
  const res = await fetch('/template.xlsx');
  templateArrayBuffer = await res.arrayBuffer();
  return templateArrayBuffer;
}

export async function downloadFilledWorkbook(cellMap, formData) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await getTemplate());
  const sheet = wb.getWorksheet('DATAINPUT');

  Object.entries(cellMap).forEach(([cell, value]) => {
    sheet.getCell(cell).value = value ?? null;
  });

  // too laxy to oyt in pt.js
  if (formData) {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    sheet.getCell('B1').value = fullName || null;
    
    sheet.getCell('B2').value = formData.day || null;
    
    sheet.getCell('B3').value = formData.date || null;
    
    sheet.getCell('D1').value = formData.location || null;
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  );
  // name
  const fullName = formData ? `${formData.firstName}_${formData.lastName}`.trim() : 'Unknown';
  const date = formData?.date || new Date().toISOString().slice(0, 10);
  
  // 1 or 2 loc
  let locationNumber = 'Unknown';
  if (formData?.location) {
    if (formData.location.includes('CHINA ROSE #1')) {
      locationNumber = '1';
    } else if (formData.location.includes('CHINA ROSE #2')) {
      locationNumber = '2';
    }
  }
  
  const filename = `${fullName}_${date}_${locationNumber}_sales_summary.xlsx`;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}