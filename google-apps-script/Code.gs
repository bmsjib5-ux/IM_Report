/**
 * Google Apps Script สำหรับ IM Report Dashboard
 *
 * วิธีติดตั้ง:
 * 1. เปิด Google Sheet ที่ต้องการ
 * 2. ไปที่ Extensions > Apps Script
 * 3. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดนี้
 * 4. คลิก Deploy > New deployment
 * 5. เลือก Type: Web app
 * 6. ตั้งค่า:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. คลิก Deploy
 * 8. คัดลอก URL ไปใส่ในหน้า Settings ของ Dashboard
 *
 * หมายเหตุ: เมื่อแก้ไขโค้ด ต้อง Deploy > Manage deployments > Edit > New version
 */

// ชื่อ Sheet (tab) ที่จะใช้งาน - เปลี่ยนให้ตรงกับชื่อ tab ใน Google Sheet
var SHEET_NAME = getFirstSheetName();

function getFirstSheetName() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].getName();
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var output;

  try {
    var params;

    if (e.postData) {
      params = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.action) {
      params = e.parameter;
    } else {
      // Default: return all data
      output = getAllData();
      return createJsonOutput(output);
    }

    var action = params.action;

    switch (action) {
      case 'get':
        output = getAllData();
        break;
      case 'update':
        output = updateRow(params.rowIndex, params.data);
        break;
      case 'add':
        output = addRow(params.data);
        break;
      default:
        output = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    output = { success: false, error: err.toString() };
  }

  return createJsonOutput(output);
}

function createJsonOutput(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getAllData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    row._rowIndex = i + 1;
    rows.push(row);
  }

  return { success: true, data: rows, headers: headers };
}

function updateRow(rowIndex, data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  }

  if (!rowIndex || !data) {
    return { success: false, error: 'Missing rowIndex or data' };
  }

  // Map data fields to columns (A-I)
  var values = [
    data.no || '',           // Column A
    data.department || '',   // Column B
    data.date || '',         // Column C
    data.description || '',  // Column D
    data.category || '',     // Column E
    data.status || '',       // Column F
    data.notes || '',        // Column G
    data.reporter || '',     // Column H
    data.responsible || ''   // Column I
  ];

  sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);

  return { success: true, message: 'Row ' + rowIndex + ' updated' };
}

function addRow(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  }

  if (!data) {
    return { success: false, error: 'Missing data' };
  }

  // Find the last row with data in column A
  var lastRow = sheet.getLastRow();
  var newRow = lastRow + 1;

  // Find next available row (skip empty rows)
  var colA = sheet.getRange(2, 1, lastRow, 1).getValues();
  for (var i = colA.length - 1; i >= 0; i--) {
    if (colA[i][0] !== '' && colA[i][0] !== null) {
      newRow = i + 3; // +2 for header, +1 for next row
      break;
    }
  }

  var values = [
    data.no || '',           // Column A
    data.department || '',   // Column B
    data.date || '',         // Column C
    data.description || '',  // Column D
    data.category || '',     // Column E
    data.status || '',       // Column F
    data.notes || '',        // Column G
    data.reporter || '',     // Column H
    data.responsible || ''   // Column I
  ];

  sheet.getRange(newRow, 1, 1, values.length).setValues([values]);

  return { success: true, message: 'Row added at ' + newRow, rowIndex: newRow };
}
