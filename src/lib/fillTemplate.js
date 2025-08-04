import ExcelJS from 'exceljs';

let templateArrayBuffer = null;
async function getTemplate() {
  if (templateArrayBuffer) return templateArrayBuffer;
  
  const possiblePaths = [
    '/template.xlsx',
    './template.xlsx',
    `${window.location.origin}/template.xlsx`,
    `${window.location.pathname}template.xlsx`,
    `${window.location.origin}${window.location.pathname}template.xlsx`
  ];
  
  for (const path of possiblePaths) {
    try {
      console.log('Trying template path:', path);
      const res = await fetch(path);
      
      if (res.ok) {
        console.log('✅ Found template at:', path);
        console.log('Template fetch successful, content-type:', res.headers.get('content-type'));
        console.log('Template fetch successful, content-length:', res.headers.get('content-length'));
        
        templateArrayBuffer = await res.arrayBuffer();
        console.log('Template arrayBuffer size:', templateArrayBuffer.byteLength);
        
        return templateArrayBuffer;
      } else {
        console.log('Path failed:', path, `(${res.status})`);
      }
    } catch (error) {
      console.log('Path error:', path, error.message);
    }
  }
  
  throw new Error('Template file not found at any of the attempted paths');
}

export async function downloadFilledWorkbook(cellMap, formData) {
  try {
    const wb = new ExcelJS.Workbook();
    
    console.log('Loading template...');
    const templateBuffer = await getTemplate();
    
    console.log('Loading workbook from buffer...');
    await wb.xlsx.load(templateBuffer);
    
    console.log('Getting worksheet...');
    const sheet = wb.getWorksheet('DATAINPUT');
    
    if (!sheet) {
      throw new Error('DATAINPUT worksheet not found in template');
    }

    console.log('Filling cells...');
    Object.entries(cellMap).forEach(([cell, value]) => {
      sheet.getCell(cell).value = value ?? null;
    });

    // too lazy to put in pt.js
    if (formData) {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      sheet.getCell('B1').value = fullName || null;
      
      sheet.getCell('B2').value = formData.day || null;
      
      sheet.getCell('B3').value = formData.date || null;

      sheet.getCell('D1').value = formData.location || null;

      sheet.getCell('C4').value = formData.amDeposit ? parseFloat(formData.amDeposit) : null;
      sheet.getCell('C5').value = formData.pmDeposit ? parseFloat(formData.pmDeposit) : null;
      sheet.getCell('C6').value = formData.amOverShort ? parseFloat(formData.amOverShort) : null;
      sheet.getCell('C7').value = formData.pmOverShort ? parseFloat(formData.pmOverShort) : null;
    }

    console.log('Writing buffer...');
    const buffer = await wb.xlsx.writeBuffer();
    
    const blob = new Blob(
      [buffer],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    );
    
    let locationNumber = 'XX';
    if (formData?.location) {
      if (formData.location.includes('CHINA ROSE #3')) {
        locationNumber = '3';
      } else if (formData.location.includes('CHINA ROSE #2')) {
        locationNumber = '2';
      }
    }

    let datePart = '00-0000';
    if (formData?.date) {
      const dateObj = new Date(formData.date);
      const yy = String(dateObj.getFullYear()).slice(-2);
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      datePart = `${yy}-${mm}${dd}`;
    }

    const filename = `${datePart}_CR${locationNumber}_Daily_Sales_Report.xlsx`;


    console.log('Downloading file:', filename);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    
  } catch (error) {
    console.error('Error in downloadFilledWorkbook:', error);
    throw error;
  }
}