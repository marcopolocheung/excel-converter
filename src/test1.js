// import deps
const ExcelJS = require("exceljs");
const XLSX = require("xlsx");
const path = require("path");

// wbs
const generalWb = XLSX.readFile("./testdata/general.xlsx");
const lunchWb = XLSX.readFile("./testdata/lunch.xlsx");
const dinnerWb = XLSX.readFile("./testdata/dinner.xlsx");

// define funcs
function getSheetDataFrom(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        console.warn(`Sheet "${sheetName}" not found.`);
        return [];
    }
    return XLSX.utils.sheet_to_json(sheet);
}

function findCellValue(sheetData, rowMatchFn, columnName) {
    const row = sheetData.find(rowMatchFn);
    return row ? row[columnName] : null;
}

// extract
const revenueSummary = getSheetDataFrom(generalWb, "Revenue summary");
const paymentsSummary = getSheetDataFrom(generalWb, "Payments summary");
const checkDiscounts = getSheetDataFrom(generalWb, "Check Discounts");
const voidSummary = getSheetDataFrom(generalWb, "Void summary");

const revenueTotal = revenueSummary[0]?.Total;

const cashTotal = findCellValue(paymentsSummary, row => row["Payment type"] === "Cash", "Total");

const getCardTotal = (subType) =>
    findCellValue(
        paymentsSummary,
        (row) => row["Payment sub type"] === subType && row["Payment type"] === "Credit/debit",
        "Total"
    );

const amexTotal = getCardTotal("AMEX");
const discoverTotal = getCardTotal("DISCOVER");
const mastercardTotal = getCardTotal("MASTERCARD");
const visaTotal = getCardTotal("VISA");

const checkDiscountTotal = findCellValue(checkDiscounts, row => row["Discount"] === "Total", "Amount");
const voidAmount = voidSummary[0]?.["Void amount"];

// lunch extract
const lunchSummary = getSheetDataFrom(lunchWb, "Sales category summary");

const lunchDrinkSales = findCellValue(lunchSummary, row => row["Sales category"] === "DRINK", "Net sales");
const lunchFoodSales = findCellValue(lunchSummary, row => row["Sales category"] === "FOOD", "Net sales");
const lunchTax = findCellValue(lunchSummary, row => row["Sales category"] === "Total", "Tax amount");

// dinner extract
const dinnerSummary = getSheetDataFrom(dinnerWb, "Sales category summary");

const dinnerDrinkSales = findCellValue(dinnerSummary, row => row["Sales category"] === "DRINK", "Net sales");
const dinnerFoodSales = findCellValue(dinnerSummary, row => row["Sales category"] === "FOOD", "Net sales");
const dinnerTax = findCellValue(dinnerSummary, row => row["Sales category"] === "Total", "Tax amount");

// move to template
async function updateTemplate() {
    const templatePath = path.resolve("template.xlsx");
    const outputPath = path.resolve("output_with_data.xlsx");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const sheet = workbook.getWorksheet("DATAINPUT");
    if (!sheet) throw new Error("DATAINPUT sheet not found in template.");

    const values = {
        C8: revenueTotal,
        C9: cashTotal,
        C10: discoverTotal,
        C11: amexTotal,
        C12: mastercardTotal,
        C13: visaTotal,
        C16: checkDiscountTotal,
        C17: voidAmount,
        C18: lunchDrinkSales,
        C19: lunchFoodSales,
        C20: lunchTax,
        C21: dinnerDrinkSales,
        C22: dinnerFoodSales,
        C23: dinnerTax
    };

    for (const [cellRef, value] of Object.entries(values)) {
        sheet.getCell(cellRef).value = value ?? null;
    }

    await workbook.xlsx.writeFile(outputPath);
    console.log("DOINZO TO", outputPath, "!!!!");
}

updateTemplate();