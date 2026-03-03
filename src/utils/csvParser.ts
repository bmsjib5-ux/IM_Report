import type { Issue, GenericSheetData, GenericRow } from '../types';

export function parseCSV(csvText: string): Issue[] {
  const lines = parseCsvLines(csvText);
  if (lines.length <= 1) return [];

  // Skip header row (index 0), parse data rows
  const issues: Issue[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i];
    const no = cols[0]?.trim() || '';
    const department = cols[1]?.trim() || '';
    const date = cols[2]?.trim() || '';
    const description = cols[3]?.trim() || '';
    const category = cols[4]?.trim() || '';
    const status = cols[5]?.trim() || '';

    // Skip empty rows (no number AND no department AND no description)
    if (!no && !department && !description) continue;
    // Skip rows that look like device inventory data (e.g. "MED-11")
    if (!no && department && !date && !description) continue;

    issues.push({
      rowIndex: i + 1, // 1-based row index in the sheet (header=row1, first data=row2)
      no,
      department,
      date,
      description,
      category,
      status,
      notes: cols[6]?.trim() || '',
      reporter: cols[7]?.trim() || '',
      responsible: cols[8]?.trim() || '',
      editDate: cols[9]?.trim() || '',
    });
  }

  return issues;
}

function parseCsvLines(csv: string): string[][] {
  const result: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current);
        current = '';
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        row.push(current);
        current = '';
        result.push(row);
        row = [];
        if (char === '\r') i++; // skip \n
      } else if (char === '\r') {
        row.push(current);
        current = '';
        result.push(row);
        row = [];
      } else {
        current += char;
      }
    }
  }

  // Last row
  if (current || row.length > 0) {
    row.push(current);
    result.push(row);
  }

  return result;
}

/**
 * Parse CSV ทั่วไป — อ่าน header จากแถวแรกของข้อมูล แล้ว map แต่ละแถวเป็น object
 * headerRow: แถวที่เป็น header ใน sheet จริง (ใช้คำนวณ _rowIndex)
 */
export function parseCSVGeneric(csvText: string, headerRow: number = 1, columnOverrides?: Record<number, string>): GenericSheetData {
  const lines = parseCsvLines(csvText);
  const headerIndex = headerRow - 1; // แปลง 1-based เป็น 0-based index
  if (lines.length <= headerIndex + 1) return { headers: [], rows: [] };

  // อ่าน header จากแถวที่กำหนด — เก็บ index จริงไว้เพื่อ map ข้อมูลให้ตรงคอลัมน์
  const allHeaders = lines[headerIndex].map(h => h.trim().replace(/[\r\n]+\s*/g, ' ').trim());
  // ถ้า header cell ว่าง → ค้นหาขึ้นไปทุก row ก่อนหน้า (รองรับ merged cell ที่ span หลายแถว)
  for (let c = 0; c < allHeaders.length; c++) {
    if (allHeaders[c] === '') {
      for (let r = headerIndex - 1; r >= 0; r--) {
        const val = lines[r][c]?.trim();
        if (val) {
          allHeaders[c] = val;
          break;
        }
      }
    }
  }
  // ใช้ columnOverrides สำหรับคอลัมน์ที่ CSV อ่าน header ไม่ได้ (เช่น merged cell, checkbox)
  if (columnOverrides) {
    for (const [idx, name] of Object.entries(columnOverrides)) {
      const colIdx = Number(idx);
      if (colIdx < allHeaders.length && allHeaders[colIdx] === '') {
        allHeaders[colIdx] = name;
      }
    }
  }
  // เก็บคู่ [originalIndex, headerName] เฉพาะ header ที่ไม่ว่าง
  const headerMap: { idx: number; name: string }[] = [];
  for (let c = 0; c < allHeaders.length; c++) {
    if (allHeaders[c] !== '') {
      headerMap.push({ idx: c, name: allHeaders[c] });
    }
  }
  const rawHeaders = headerMap.map(h => h.name);
  const rows: GenericRow[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = lines[i];
    // ข้ามแถวที่ทุกคอลัมน์ว่าง
    const hasData = headerMap.some(h => (cols[h.idx]?.trim() || '') !== '');
    if (!hasData) continue;

    const row: GenericRow = { _rowIndex: i + 1 }; // 1-based row ใน sheet จริง
    for (const h of headerMap) {
      row[h.name] = cols[h.idx]?.trim() || '';
    }
    rows.push(row);
  }

  return { headers: rawHeaders, rows };
}

/**
 * Parse Thai date "d/m/yyyy" (พ.ศ.) to a Date object (ค.ศ.)
 * e.g. "20/2/2569" → Date(2026, 1, 20)
 * Returns null if invalid.
 */
export function parseThaiDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const yearBE = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(yearBE)) return null;
  const yearCE = yearBE - 543;
  return new Date(yearCE, month - 1, day);
}

export function extractSheetInfo(url: string): { sheetId: string; gid: string } | null {
  const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  const gidMatch = url.match(/gid=(\d+)/);

  if (!sheetIdMatch) return null;

  return {
    sheetId: sheetIdMatch[1],
    gid: gidMatch ? gidMatch[1] : '0',
  };
}
