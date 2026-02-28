/**
 * Google Apps Script สำหรับ IM Report Dashboard
 *
 * รองรับหลาย Sheet tab ใน Spreadsheet เดียว
 * Frontend ส่ง gid มาเพื่อระบุว่าจะทำงานกับ tab ไหน
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

// คอลัมน์ที่ใช้งาน (A-I)
var VALID_COLUMNS = ['no', 'department', 'date', 'description', 'category', 'status', 'notes', 'reporter', 'responsible'];
var REQUIRED_FIELDS_ADD = ['department', 'description'];
var REQUIRED_FIELDS_UPDATE = ['no'];
var MAX_TEXT_LENGTH = 5000;

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
      // ตรวจสอบขนาด payload
      if (e.postData.contents && e.postData.contents.length > 50000) {
        return createJsonOutput({ success: false, error: 'Payload too large (max 50KB)' });
      }
      params = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.action) {
      params = e.parameter;
    } else {
      output = getAllData(null);
      return createJsonOutput(output);
    }

    var action = params.action;
    var gid = params.gid || null;

    // ตรวจสอบ action เป็น string
    if (typeof action !== 'string') {
      return createJsonOutput({ success: false, error: 'Invalid action type' });
    }

    switch (action) {
      case 'get':
        output = getAllData(gid);
        break;
      case 'update':
        output = updateRow(params.rowIndex, params.data, gid);
        break;
      case 'add':
        output = addRow(params.data, gid);
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

// ========== Utility Functions ==========

/**
 * หา Sheet tab จาก gid (Sheet ID)
 * - ถ้าส่ง gid มา → หา tab ที่ตรงกัน
 * - ถ้าไม่ส่ง gid → ใช้ tab แรก
 * - ถ้าหาไม่เจอ → return error
 */
function getSheetByGid(gid) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allSheets = ss.getSheets();

  if (!gid) {
    // ไม่ส่ง gid → ใช้ tab แรก (backward compatible)
    return { success: true, sheet: allSheets[0] };
  }

  // ค้นหา tab ที่มี gid ตรงกัน
  var targetGid = String(gid);
  for (var i = 0; i < allSheets.length; i++) {
    if (String(allSheets[i].getSheetId()) === targetGid) {
      return { success: true, sheet: allSheets[i] };
    }
  }

  // หาไม่เจอ → แสดง gid ที่มีทั้งหมดให้ debug
  var available = allSheets.map(function(s) {
    return s.getName() + ' (gid=' + s.getSheetId() + ')';
  });

  return {
    success: false,
    error: 'ไม่พบ Sheet tab ที่มี gid=' + gid + ' | มีอยู่: ' + available.join(', ')
  };
}

/**
 * แสดงรายการ Sheet tab ทั้งหมดใน Spreadsheet
 */
function listSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allSheets = ss.getSheets();
  var list = [];

  for (var i = 0; i < allSheets.length; i++) {
    list.push({
      name: allSheets[i].getName(),
      gid: String(allSheets[i].getSheetId()),
      index: i,
      rows: allSheets[i].getLastRow()
    });
  }

  return { success: true, sheets: list };
}

function sanitizeString(value) {
  if (value === null || value === undefined) return '';
  var str = String(value).trim();
  if (str.length > MAX_TEXT_LENGTH) {
    str = str.substring(0, MAX_TEXT_LENGTH);
  }
  return str;
}

function validateRequiredFields(data, requiredFields) {
  var missing = [];
  for (var i = 0; i < requiredFields.length; i++) {
    var field = requiredFields[i];
    if (!data[field] || String(data[field]).trim() === '') {
      missing.push(field);
    }
  }
  return missing;
}

function validateDate(dateStr) {
  if (!dateStr || dateStr === '') return true; // optional
  var pattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  return pattern.test(String(dateStr).trim());
}

function validateRowIndex(rowIndex, sheet) {
  var idx = Number(rowIndex);
  if (isNaN(idx) || idx !== Math.floor(idx)) {
    return { valid: false, error: 'rowIndex ต้องเป็นจำนวนเต็ม' };
  }
  if (idx <= 1) {
    return { valid: false, error: 'rowIndex ต้องมากกว่า 1 (row 1 คือ header)' };
  }
  var lastRow = sheet.getLastRow();
  if (idx > lastRow) {
    return { valid: false, error: 'rowIndex ' + idx + ' เกินจำนวนแถวข้อมูล (มี ' + lastRow + ' แถว)' };
  }
  return { valid: true, index: idx };
}

function buildRowValues(data) {
  return [
    sanitizeString(data.no),           // Column A
    sanitizeString(data.department),   // Column B
    sanitizeString(data.date),         // Column C
    sanitizeString(data.description),  // Column D
    sanitizeString(data.category),     // Column E
    sanitizeString(data.status),       // Column F
    sanitizeString(data.notes),        // Column G
    sanitizeString(data.reporter),     // Column H
    sanitizeString(data.responsible),  // Column I
    sanitizeString(data.editDate)      // Column J - วันที่แก้ไข
  ];
}

function isDuplicateNo(sheet, no, excludeRowIndex) {
  if (!no || no === '') return false;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var colA = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < colA.length; i++) {
    var currentRowIndex = i + 2;
    if (excludeRowIndex && currentRowIndex === excludeRowIndex) continue;
    if (String(colA[i][0]).trim() === String(no).trim()) {
      return true;
    }
  }
  return false;
}

// ========== Main Functions ==========

function getAllData(gid) {
  // 1. หา sheet tab จาก gid
  var result = getSheetByGid(gid);
  if (!result.success) return result;
  var sheet = result.sheet;

  var lastRow = sheet.getLastRow();

  if (lastRow === 0) {
    return { success: true, data: [], headers: [], sheetName: sheet.getName(), gid: String(sheet.getSheetId()) };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === '' || data[i][0] === null || data[i][0] === undefined) {
      continue;
    }
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    row._rowIndex = i + 1;
    rows.push(row);
  }

  return {
    success: true,
    data: rows,
    headers: headers,
    totalRows: lastRow - 1,
    sheetName: sheet.getName(),
    gid: String(sheet.getSheetId())
  };
}

function updateRow(rowIndex, data, gid) {
  // 1. หา sheet tab จาก gid
  var result = getSheetByGid(gid);
  if (!result.success) return result;
  var sheet = result.sheet;

  // 2. ตรวจสอบ parameter พื้นฐาน
  if (rowIndex === null || rowIndex === undefined) {
    return { success: false, error: 'กรุณาระบุ rowIndex' };
  }
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'กรุณาระบุ data เป็น object' };
  }

  // 3. ตรวจสอบ rowIndex อยู่ในช่วงที่ถูกต้อง
  var rowCheck = validateRowIndex(rowIndex, sheet);
  if (!rowCheck.valid) {
    return { success: false, error: rowCheck.error };
  }

  // 4. ตรวจสอบว่า row นั้นมีข้อมูลอยู่จริง
  var existingRow = sheet.getRange(rowCheck.index, 1, 1, 10).getValues()[0];
  var isEmpty = existingRow.every(function(cell) {
    return cell === '' || cell === null || cell === undefined;
  });
  if (isEmpty) {
    return { success: false, error: 'Row ' + rowCheck.index + ' ไม่มีข้อมูล ไม่สามารถแก้ไขได้' };
  }

  // 5. ตรวจสอบ required fields
  var missingFields = validateRequiredFields(data, REQUIRED_FIELDS_UPDATE);
  if (missingFields.length > 0) {
    return { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็น: ' + missingFields.join(', ') };
  }

  // 6. ตรวจสอบ date format (ถ้ามี)
  if (data.date && !validateDate(data.date)) {
    return { success: false, error: 'รูปแบบวันที่ไม่ถูกต้อง (ใช้ dd/mm/yyyy)' };
  }

  // 7. ตรวจสอบลำดับซ้ำ (ถ้าเปลี่ยน no)
  if (data.no && String(data.no).trim() !== String(existingRow[0]).trim()) {
    if (isDuplicateNo(sheet, data.no, rowCheck.index)) {
      return { success: false, error: 'ลำดับ "' + data.no + '" ซ้ำกับรายการที่มีอยู่แล้ว' };
    }
  }

  // 8. Sanitize และบันทึก
  var values = buildRowValues(data);
  sheet.getRange(rowCheck.index, 1, 1, values.length).setValues([values]);

  return {
    success: true,
    message: 'อัปเดต row ' + rowCheck.index + ' สำเร็จ (sheet: ' + sheet.getName() + ')',
    rowIndex: rowCheck.index,
    sheetName: sheet.getName()
  };
}

function addRow(data, gid) {
  // 1. หา sheet tab จาก gid
  var result = getSheetByGid(gid);
  if (!result.success) return result;
  var sheet = result.sheet;

  // 2. ตรวจสอบ parameter พื้นฐาน
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'กรุณาระบุ data เป็น object' };
  }

  // 3. ตรวจสอบ required fields
  var missingFields = validateRequiredFields(data, REQUIRED_FIELDS_ADD);
  if (missingFields.length > 0) {
    return { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็น: ' + missingFields.join(', ') };
  }

  // 4. ตรวจสอบ date format (ถ้ามี)
  if (data.date && !validateDate(data.date)) {
    return { success: false, error: 'รูปแบบวันที่ไม่ถูกต้อง (ใช้ dd/mm/yyyy)' };
  }

  // 5. ตรวจสอบลำดับซ้ำ
  if (data.no && isDuplicateNo(sheet, data.no, null)) {
    return { success: false, error: 'ลำดับ "' + data.no + '" ซ้ำกับรายการที่มีอยู่แล้ว' };
  }

  // 6. หาแถวถัดไปที่จะเพิ่มข้อมูล
  var lastRow = sheet.getLastRow();
  var newRow = lastRow + 1;

  if (lastRow >= 2) {
    var colA = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = colA.length - 1; i >= 0; i--) {
      if (colA[i][0] !== '' && colA[i][0] !== null) {
        newRow = i + 3;
        break;
      }
    }
  }

  // 7. Sanitize และบันทึก
  var values = buildRowValues(data);
  sheet.getRange(newRow, 1, 1, values.length).setValues([values]);

  return {
    success: true,
    message: 'เพิ่มรายการที่ row ' + newRow + ' สำเร็จ (sheet: ' + sheet.getName() + ')',
    rowIndex: newRow,
    sheetName: sheet.getName()
  };
}
