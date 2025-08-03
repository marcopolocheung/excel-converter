import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function parseCsvAndExport(file, onComplete, onError) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const grouped = groupByEmployeeExternalId(results.data);
      const sorted = sortGroupedByDate(grouped);
      const flattened = flattenGroupedData(sorted);
      exportSingleSheetXlsx(flattened);
      onComplete();
    },
    error: (err) => {
      onError(err);
    },
  });
}

function groupByEmployeeExternalId(data) {
  const grouped = {};
  data.forEach((row) => {
    const id = row["Employee External Id"];
    if (!id) return;
    if (!grouped[id]) grouped[id] = [];
    grouped[id].push(row);
  });
  return grouped;
}

// Sorts each group by "In Date" ascending
function sortGroupedByDate(grouped) {
  const sorted = {};

  Object.entries(grouped).forEach(([id, rows]) => {
    sorted[id] = rows.sort((a, b) => {
      const dateA = new Date(a["In Date"]);
      const dateB = new Date(b["In Date"]);
      return dateA - dateB;
    });
  });

  return sorted;
}

// Flattens all sorted rows into one array
function flattenGroupedData(grouped) {
  const result = [];

  const headerRow = {
    "Employee External Id": "Employee External Id",
    Employee: "Employee",
    "Job Title": "Job Title",
    "In Date": "In Date",
    "Out Date": "Out Date",
    "Total Hours": "Total Hours",
    "Regular Hours": "Regular Hours",
    "Overtime Hours": "Overtime Hours",
  };

  let isFirstGroup = true;

  Object.entries(grouped).forEach(([id, rows]) => {
    if (!isFirstGroup) {
      result.push(headerRow);
    } else {
      isFirstGroup = false;
    }

    result.push(...rows);

    const firstRow = rows[0];  // Assume name/job title is consistent

    const totalRow = {
      "Employee External Id": id,
      Employee: firstRow?.Employee || "",
      "Job Title": firstRow?.["Job Title"] || "",
      "In Date": "TOTAL",
      "Out Date": "",
      "Total Hours": 0,
      "Regular Hours": 0,
      "Overtime Hours": 0,
    };

    rows.forEach((row) => {
      totalRow["Total Hours"] += parseFloat(row["Total Hours"] || "0");
      totalRow["Regular Hours"] += parseFloat(row["Regular Hours"] || "0");
      totalRow["Overtime Hours"] += parseFloat(row["Overtime Hours"] || "0");
    });

    totalRow["Total Hours"] = totalRow["Total Hours"].toFixed(2);
    totalRow["Regular Hours"] = totalRow["Regular Hours"].toFixed(2);
    totalRow["Overtime Hours"] = totalRow["Overtime Hours"].toFixed(2);

    result.push(totalRow);
    result.push({}, {}, {});
  });

  return result;
}

function exportSingleSheetXlsx(allRows) {
  const wb = XLSX.utils.book_new();
  
  // Convert data and identify header rows for post-processing
  const ws = XLSX.utils.json_to_sheet(allRows);

  // Find all header row indices
  const headerRowIndices = [];
  allRows.forEach((row, rowIndex) => {
    const isHeaderRow =
      row["Employee External Id"] === "Employee External Id" &&
      row["Employee"] === "Employee";
    if (isHeaderRow) {
      headerRowIndices.push(rowIndex);
    }
  });

  // Apply formatting to header rows - this approach works with free XLSX
  headerRowIndices.forEach(rowIndex => {
    const columnKeys = Object.keys(allRows[rowIndex]);
    columnKeys.forEach((_, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      if (ws[cellAddress]) {
        // Set cell style for bold headers
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "EEEEEE" } }, // Light gray background
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        };
      }
    });
  });

  XLSX.utils.book_append_sheet(wb, ws, "All Employees");

  const wbout = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true
  });

  const blob = new Blob([wbout], { type: "application/octet-stream" });
  saveAs(blob, "grouped_employees.xlsx");
}