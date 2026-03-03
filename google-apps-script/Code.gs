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

// คอลัมน์ที่ใช้งาน (A-J)
var VALID_COLUMNS = ['no', 'department', 'date', 'description', 'category', 'status', 'notes', 'reporter', 'responsible', 'editDate'];
var REQUIRED_FIELDS_ADD = ['department', 'description'];
var REQUIRED_FIELDS_UPDATE = ['no'];
var MAX_TEXT_LENGTH = 5000;

/**
 * ★★★ ขั้นตอนแรก: กดปุ่ม Run ที่ฟังก์ชันนี้เพื่อ Authorize สิทธิ์ ★★★
 *
 * เลือกฟังก์ชันนี้จาก dropdown แล้วกด ▶ Run
 * จะมีหน้าต่างขออนุญาต → กด "Review Permissions" → เลือก Google Account
 * → กด "Advanced" → กด "Go to [project name] (unsafe)" → กด "Allow"
 *
 * หลัง Authorize สำเร็จ ให้ดูผลลัพธ์ที่ Execution log ด้านล่าง
 * ถ้าเห็น "✅ Setup OK!" แสดงว่าพร้อมใช้งาน → ไป Deploy ได้เลย
 */
function authorizeAndTest() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('✅ Setup OK! เชื่อมต่อกับ Spreadsheet: ' + ss.getName());
  Logger.log('URL: ' + ss.getUrl());

  var sheets = ss.getSheets();
  Logger.log('พบ ' + sheets.length + ' แท็บ:');
  for (var i = 0; i < sheets.length; i++) {
    Logger.log('  - ' + sheets[i].getName() + ' (gid=' + sheets[i].getSheetId() + ', rows=' + sheets[i].getLastRow() + ')');
  }

  Logger.log('');
  Logger.log('★ ขั้นตอนถัดไป:');
  Logger.log('  1. ไปที่ Deploy > New deployment');
  Logger.log('  2. Type: Web app');
  Logger.log('  3. Execute as: Me');
  Logger.log('  4. Who has access: Anyone');
  Logger.log('  5. กด Deploy → คัดลอก URL ไปใส่ในตั้งค่า Dashboard');
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
      case 'updateGeneric':
        output = updateGenericRow(params.rowIndex, params.values, gid, params.headerRow);
        break;
      case 'addGeneric':
        output = addGenericRow(params.values, gid, params.headerRow);
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
  // 1. ตรวจสอบ parameter พื้นฐาน (ก่อน lock)
  if (rowIndex === null || rowIndex === undefined) {
    return { success: false, error: 'กรุณาระบุ rowIndex' };
  }
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'กรุณาระบุ data เป็น object' };
  }

  var missingFields = validateRequiredFields(data, REQUIRED_FIELDS_UPDATE);
  if (missingFields.length > 0) {
    return { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็น: ' + missingFields.join(', ') };
  }

  if (data.date && !validateDate(data.date)) {
    return { success: false, error: 'รูปแบบวันที่ไม่ถูกต้อง (ใช้ dd/mm/yyyy)' };
  }

  // 2. ใช้ LockService ป้องกัน concurrent writes
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, error: 'มีผู้ใช้อื่นกำลังบันทึกข้อมูลอยู่ กรุณาลองใหม่อีกครั้ง' };
  }

  try {
    // 3. หา sheet tab จาก gid
    var result = getSheetByGid(gid);
    if (!result.success) return result;
    var sheet = result.sheet;

    // 4. ตรวจสอบ rowIndex อยู่ในช่วงที่ถูกต้อง
    var rowCheck = validateRowIndex(rowIndex, sheet);
    if (!rowCheck.valid) {
      return { success: false, error: rowCheck.error };
    }

    // 5. ตรวจสอบว่า row นั้นมีข้อมูลอยู่จริง
    var existingRow = sheet.getRange(rowCheck.index, 1, 1, 10).getValues()[0];
    var isEmpty = existingRow.every(function(cell) {
      return cell === '' || cell === null || cell === undefined;
    });
    if (isEmpty) {
      return { success: false, error: 'Row ' + rowCheck.index + ' ไม่มีข้อมูล ไม่สามารถแก้ไขได้' };
    }

    // 6. ตรวจสอบลำดับซ้ำ (ถ้าเปลี่ยน no)
    if (data.no && String(data.no).trim() !== String(existingRow[0]).trim()) {
      if (isDuplicateNo(sheet, data.no, rowCheck.index)) {
        return { success: false, error: 'ลำดับ "' + data.no + '" ซ้ำกับรายการที่มีอยู่แล้ว' };
      }
    }

    // 7. Sanitize และบันทึก
    var values = buildRowValues(data);
    sheet.getRange(rowCheck.index, 1, 1, values.length).setValues([values]);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'อัปเดต row ' + rowCheck.index + ' สำเร็จ (sheet: ' + sheet.getName() + ')',
      rowIndex: rowCheck.index,
      sheetName: sheet.getName()
    };
  } finally {
    lock.releaseLock();
  }
}

function addRow(data, gid) {
  // 1. ตรวจสอบ parameter พื้นฐาน (ก่อน lock เพื่อไม่ให้ hold lock นาน)
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'กรุณาระบุ data เป็น object' };
  }

  var missingFields = validateRequiredFields(data, REQUIRED_FIELDS_ADD);
  if (missingFields.length > 0) {
    return { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็น: ' + missingFields.join(', ') };
  }

  if (data.date && !validateDate(data.date)) {
    return { success: false, error: 'รูปแบบวันที่ไม่ถูกต้อง (ใช้ dd/mm/yyyy)' };
  }

  // 2. ใช้ LockService ป้องกันการเขียนซ้อนกัน (concurrent writes)
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // รอ lock สูงสุด 15 วินาที
  } catch (e) {
    return { success: false, error: 'มีผู้ใช้อื่นกำลังบันทึกข้อมูลอยู่ กรุณาลองใหม่อีกครั้ง' };
  }

  try {
    // 3. หา sheet tab จาก gid (ภายใน lock)
    var result = getSheetByGid(gid);
    if (!result.success) return result;
    var sheet = result.sheet;

    // 4. ตรวจสอบลำดับซ้ำ (ภายใน lock เพื่อข้อมูลล่าสุด)
    if (data.no && isDuplicateNo(sheet, data.no, null)) {
      return { success: false, error: 'ลำดับ "' + data.no + '" ซ้ำกับรายการที่มีอยู่แล้ว' };
    }

    // 5. หาแถวที่จะเพิ่มข้อมูล (batch read ครั้งเดียว เร็วกว่า row-by-row)
    var lastRow = sheet.getLastRow();
    var newRow = lastRow + 1;

    if (lastRow >= 2) {
      // อ่านทุกคอลัมน์ (A-J) ทีเดียว → ไม่ต้อง getRange ทีละแถว
      var allData = sheet.getRange(2, 1, lastRow - 1, 10).getValues();

      // หาแถวสุดท้ายที่มีรายละเอียดปัญหา (column D) อยู่จริง
      var lastFilledRow = 1; // row 1 = header
      for (var i = 0; i < allData.length; i++) {
        var hasDescription = allData[i][3] !== '' && allData[i][3] !== null && allData[i][3] !== undefined;
        if (hasDescription) {
          lastFilledRow = i + 2; // i=0 → row 2
        }
      }

      // เริ่มจากแถวหลังข้อมูลล่าสุด
      newRow = lastFilledRow + 1;

      // ตรวจสอบว่าแถวนั้นว่างจริง (ใช้ข้อมูลที่อ่านมาแล้ว ไม่ต้องเรียก API เพิ่ม)
      while (newRow <= lastRow) {
        var rowData = allData[newRow - 2]; // allData[0] = row 2
        var isRowEmpty = rowData.every(function(cell) {
          return cell === '' || cell === null || cell === undefined;
        });
        if (isRowEmpty) {
          break; // แถวนี้ว่าง ใช้ได้
        }
        newRow++; // แถวนี้มีคนจองแล้ว ไปแถวถัดไป
      }
    }

    // 6. Sanitize และบันทึก
    var values = buildRowValues(data);
    sheet.getRange(newRow, 1, 1, values.length).setValues([values]);

    // 7. Force flush เพื่อให้แน่ใจว่าเขียนสำเร็จก่อนปล่อย lock
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'เพิ่มรายการที่ row ' + newRow + ' สำเร็จ (sheet: ' + sheet.getName() + ')',
      rowIndex: newRow,
      sheetName: sheet.getName()
    };
  } finally {
    lock.releaseLock();
  }
}

// ========== Generic Sheet Update ==========

/**
 * อัปเดตแถวใน sheet ทั่วไป (form, report, assessment)
 * รับ values เป็น array ตามลำดับคอลัมน์ แทนที่จะใช้ field name เหมือน updateRow
 *
 * @param {number} rowIndex - แถวที่จะอัปเดต (1-based)
 * @param {Array} values - ค่าที่จะเขียน ตามลำดับคอลัมน์
 * @param {string} gid - Sheet tab ID
 * @param {number} headerRow - แถวที่เป็น header (default=1)
 */
function updateGenericRow(rowIndex, values, gid, headerRow) {
  // 1. ตรวจสอบ parameter
  if (rowIndex === null || rowIndex === undefined) {
    return { success: false, error: 'กรุณาระบุ rowIndex' };
  }
  if (!values || !Array.isArray(values)) {
    return { success: false, error: 'กรุณาระบุ values เป็น array' };
  }
  if (!headerRow || headerRow < 1) {
    headerRow = 1;
  }

  // 2. LockService
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, error: 'มีผู้ใช้อื่นกำลังบันทึกอยู่ กรุณาลองใหม่อีกครั้ง' };
  }

  try {
    // 3. หา sheet
    var result = getSheetByGid(gid);
    if (!result.success) return result;
    var sheet = result.sheet;

    // 4. ตรวจสอบ rowIndex
    var idx = Number(rowIndex);
    if (isNaN(idx) || idx <= headerRow || idx > sheet.getLastRow()) {
      return { success: false, error: 'rowIndex ไม่ถูกต้อง: ' + rowIndex + ' (header อยู่แถว ' + headerRow + ', มีข้อมูล ' + sheet.getLastRow() + ' แถว)' };
    }

    // 5. อ่าน header row เพื่อนับจำนวนคอลัมน์จริง
    var lastCol = sheet.getLastColumn();
    var headerValues = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
    var numCols = 0;
    for (var i = 0; i < headerValues.length; i++) {
      if (String(headerValues[i]).trim() !== '') numCols = i + 1;
    }
    if (numCols === 0) {
      return { success: false, error: 'ไม่พบ header ในแถวที่ ' + headerRow };
    }

    // 6. ตรวจสอบว่า row มีข้อมูลอยู่จริง
    var existingRow = sheet.getRange(idx, 1, 1, numCols).getValues()[0];
    var isEmpty = existingRow.every(function(cell) {
      return cell === '' || cell === null || cell === undefined;
    });
    if (isEmpty) {
      return { success: false, error: 'Row ' + idx + ' ไม่มีข้อมูล ไม่สามารถแก้ไขได้' };
    }

    // 7. Sanitize + pad/trim ให้ตรงจำนวนคอลัมน์
    //    ถ้าคอลัมน์เดิมเป็น boolean (checkbox) → แปลง "TRUE"/"FALSE" กลับเป็น boolean
    var sanitized = [];
    for (var j = 0; j < numCols; j++) {
      var rawVal = j < values.length ? values[j] : '';
      if (typeof existingRow[j] === 'boolean') {
        sanitized.push(String(rawVal).toUpperCase() === 'TRUE');
      } else {
        sanitized.push(sanitizeString(rawVal));
      }
    }

    // 8. เขียนข้อมูล
    sheet.getRange(idx, 1, 1, numCols).setValues([sanitized]);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'อัปเดต row ' + idx + ' สำเร็จ (sheet: ' + sheet.getName() + ')',
      rowIndex: idx,
      sheetName: sheet.getName()
    };
  } finally {
    lock.releaseLock();
  }
}

// ========== Generic Sheet Add ==========

/**
 * เพิ่มแถวใหม่ใน sheet ทั่วไป (form, report, assessment)
 * รับ values เป็น array ตามลำดับคอลัมน์
 *
 * @param {Array} values - ค่าที่จะเขียน ตามลำดับคอลัมน์
 * @param {string} gid - Sheet tab ID
 * @param {number} headerRow - แถวที่เป็น header (default=1)
 */
function addGenericRow(values, gid, headerRow) {
  // 1. ตรวจสอบ parameter
  if (!values || !Array.isArray(values)) {
    return { success: false, error: 'กรุณาระบุ values เป็น array' };
  }
  if (!headerRow || headerRow < 1) {
    headerRow = 1;
  }

  // 2. LockService
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, error: 'มีผู้ใช้อื่นกำลังบันทึกอยู่ กรุณาลองใหม่อีกครั้ง' };
  }

  try {
    // 3. หา sheet
    var result = getSheetByGid(gid);
    if (!result.success) return result;
    var sheet = result.sheet;

    // 4. อ่าน header row เพื่อนับจำนวนคอลัมน์จริง
    var lastCol = sheet.getLastColumn();
    var headerValues = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
    var numCols = 0;
    for (var i = 0; i < headerValues.length; i++) {
      if (String(headerValues[i]).trim() !== '') numCols = i + 1;
    }
    if (numCols === 0) {
      return { success: false, error: 'ไม่พบ header ในแถวที่ ' + headerRow };
    }

    // 5. หาแถวว่างถัดไป (batch read เหมือน addRow)
    var lastRow = sheet.getLastRow();
    var newRow = lastRow + 1;

    if (lastRow > headerRow) {
      var dataRows = lastRow - headerRow;
      var allData = sheet.getRange(headerRow + 1, 1, dataRows, numCols).getValues();

      // หาแถวสุดท้ายที่มีข้อมูลอยู่จริง
      var lastFilledRow = headerRow;
      for (var r = 0; r < allData.length; r++) {
        var hasData = allData[r].some(function(cell) {
          return cell !== '' && cell !== null && cell !== undefined;
        });
        if (hasData) {
          lastFilledRow = headerRow + 1 + r;
        }
      }

      newRow = lastFilledRow + 1;

      // ตรวจสอบว่าแถวนั้นว่างจริง
      while (newRow <= lastRow) {
        var rowData = allData[newRow - headerRow - 1];
        if (rowData) {
          var isRowEmpty = rowData.every(function(cell) {
            return cell === '' || cell === null || cell === undefined;
          });
          if (isRowEmpty) break;
        } else {
          break;
        }
        newRow++;
      }
    }

    // 6. Sanitize + pad/trim ให้ตรงจำนวนคอลัมน์
    //    ตรวจสอบ type จากแถวข้อมูลที่มีอยู่ (เช่น checkbox → boolean)
    var existingTypes = [];
    if (lastRow > headerRow) {
      var sampleRow = sheet.getRange(headerRow + 1, 1, 1, numCols).getValues()[0];
      existingTypes = sampleRow;
    }

    var sanitized = [];
    for (var j = 0; j < numCols; j++) {
      var rawVal = j < values.length ? values[j] : '';
      if (existingTypes.length > 0 && typeof existingTypes[j] === 'boolean') {
        sanitized.push(String(rawVal).toUpperCase() === 'TRUE');
      } else {
        sanitized.push(sanitizeString(rawVal));
      }
    }

    // 7. เขียนข้อมูล
    sheet.getRange(newRow, 1, 1, numCols).setValues([sanitized]);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'เพิ่มรายการที่ row ' + newRow + ' สำเร็จ (sheet: ' + sheet.getName() + ')',
      rowIndex: newRow,
      sheetName: sheet.getName()
    };
  } finally {
    lock.releaseLock();
  }
}
