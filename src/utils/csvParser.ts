import type { Issue } from '../types';

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
