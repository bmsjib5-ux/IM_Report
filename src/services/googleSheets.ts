import type { Issue, AppSettings, SheetLink, Hospital, GenericSheetData, GenericRow } from '../types';
import { parseCSV, parseCSVGeneric, extractSheetInfo } from '../utils/csvParser';
import { generateId } from '../types';
import { getSupabaseConfig, loadSettingsFromSupabase, saveSettingsToSupabase } from './supabase';

const DEFAULT_HOSPITAL: Hospital = {
  id: 'default',
  code: '00000',
  name: 'โรงพยาบาลตัวอย่าง',
  sheets: [
    {
      id: 'default-sheet',
      name: 'แจ้งปัญหาทีม IM',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/195Nh3RV1uPriNAfpgmBsHHcSrqcwQ5fX3V-5FoVlkCc/edit?gid=1358042378#gid=1358042378',
      sheetId: '195Nh3RV1uPriNAfpgmBsHHcSrqcwQ5fX3V-5FoVlkCc',
      gid: '1358042378',
      appsScriptUrl: '',
      sheetType: 'issue',
    },
    {
      id: 'default-form-sheet',
      name: 'แบบฟอร์ม',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/195Nh3RV1uPriNAfpgmBsHHcSrqcwQ5fX3V-5FoVlkCc/edit?gid=1527828255#gid=1527828255',
      sheetId: '195Nh3RV1uPriNAfpgmBsHHcSrqcwQ5fX3V-5FoVlkCc',
      gid: '1527828255',
      appsScriptUrl: '',
      headerRow: 3,
      sheetType: 'form',
    },
    {
      id: 'default-assessment-sheet',
      name: 'Assessment',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/195Nh3RV1uPriNAfpgmBsHHcSrqcwQ5fX3V-5FoVlkCc/edit?gid=1520366934#gid=1520366934',
      sheetId: '195Nh3RV1uPriNAfpgmBsHHcSrqcwQ5fX3V-5FoVlkCc',
      gid: '1520366934',
      appsScriptUrl: '',
      sheetType: 'assessment',
    },
    {
      id: 'default-report-sheet',
      name: 'รายงาน',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/195Nh3RV1uPriNAfpgmBsHHcSrqcwQ5fX3V-5FoVlkCc/edit?gid=1231154918#gid=1231154918',
      sheetId: '195Nh3RV1uPriNAfpgmBsHHcSrqcwQ5fX3V-5FoVlkCc',
      gid: '1231154918',
      appsScriptUrl: '',
      sheetType: 'report',
    },
  ],
};

const DEFAULT_SETTINGS: AppSettings = {
  hospitals: [DEFAULT_HOSPITAL],
  activeHospitalId: 'default',
  activeSheetId: 'default-sheet',
};

// Merge default sheets ที่ยังไม่มีเข้าไปใน default hospital
function mergeDefaultSheets(settings: AppSettings): AppSettings {
  const defaultHospital = settings.hospitals.find(h => h.id === 'default');
  if (defaultHospital) {
    const existingIds = new Set(defaultHospital.sheets.map(s => s.id));
    for (const sheet of DEFAULT_HOSPITAL.sheets) {
      if (!existingIds.has(sheet.id)) {
        defaultHospital.sheets.push(sheet);
      }
    }
  }
  return settings;
}

export function getSettings(): AppSettings {
  const saved = localStorage.getItem('im-dashboard-settings');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Migrate old single-sheet format
    if (parsed.sheetUrl && !parsed.hospitals) {
      const migrated: AppSettings = {
        hospitals: [
          {
            id: 'migrated',
            code: '00000',
            name: 'โรงพยาบาล (ย้ายจากค่าเดิม)',
            sheets: [
              {
                id: 'migrated-sheet',
                name: 'Sheet หลัก',
                sheetUrl: parsed.sheetUrl,
                sheetId: parsed.sheetId,
                gid: parsed.gid,
                appsScriptUrl: parsed.appsScriptUrl || '',
              },
            ],
          },
        ],
        activeHospitalId: 'migrated',
        activeSheetId: 'migrated-sheet',
      };
      saveSettings(migrated);
      return migrated;
    }
    return mergeDefaultSheets({ ...DEFAULT_SETTINGS, ...parsed });
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem('im-dashboard-settings', JSON.stringify(settings));

  // Fire-and-forget Supabase save
  const config = getSupabaseConfig();
  if (config) {
    saveSettingsToSupabase(config, settings).catch(() => {
      // Silently fail — localStorage is the source of truth when offline
    });
  }
}

export async function syncSettingsFromSupabase(): Promise<AppSettings> {
  const config = getSupabaseConfig();
  if (!config) return getSettings();

  try {
    const remote = await loadSettingsFromSupabase(config);
    if (remote) {
      const merged = mergeDefaultSheets(remote);
      localStorage.setItem('im-dashboard-settings', JSON.stringify(merged));
      return merged;
    }
  } catch {
    // Supabase offline or error — fall through to localStorage
  }
  return getSettings();
}

export function getActiveHospital(settings: AppSettings): Hospital | undefined {
  return settings.hospitals.find(h => h.id === settings.activeHospitalId);
}

export function getActiveSheet(settings: AppSettings): SheetLink | undefined {
  const hospital = getActiveHospital(settings);
  if (!hospital) return undefined;
  return hospital.sheets.find(s => s.id === settings.activeSheetId);
}

export function createHospital(code: string, name: string): Hospital {
  return {
    id: generateId(),
    code,
    name,
    sheets: [],
  };
}

export function createSheetLink(name: string, url: string, appsScriptUrl: string = ''): SheetLink | null {
  const info = extractSheetInfo(url);
  if (!info) return null;
  return {
    id: generateId(),
    name,
    sheetUrl: url,
    sheetId: info.sheetId,
    gid: info.gid,
    appsScriptUrl,
  };
}

export async function fetchIssues(sheet?: SheetLink): Promise<Issue[]> {
  const target = sheet || getActiveSheet(getSettings());
  if (!target) {
    throw new Error('ไม่พบ Sheet ที่เลือก กรุณาตั้งค่าก่อน');
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${target.sheetId}/gviz/tq?tqx=out:csv&gid=${target.gid}&_cb=${Date.now()}`;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`ไม่สามารถดึงข้อมูลได้: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  return parseCSV(csvText);
}

export async function fetchGenericSheet(sheet?: SheetLink, columnOverrides?: Record<number, string>, gvizHeaders?: number): Promise<GenericSheetData> {
  const target = sheet || getActiveSheet(getSettings());
  if (!target) {
    throw new Error('ไม่พบ Sheet ที่เลือก กรุณาตั้งค่าก่อน');
  }

  const headersParam = gvizHeaders ? `&headers=${gvizHeaders}` : '';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${target.sheetId}/gviz/tq?tqx=out:csv&gid=${target.gid}${headersParam}&_cb=${Date.now()}`;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`ไม่สามารถดึงข้อมูลได้: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const headerRow = target.headerRow || 1;
  return parseCSVGeneric(csvText, headerRow, columnOverrides);
}

/**
 * ดึงรายชื่อแท็บจาก Google Spreadsheet โดย parse จาก HTML
 * ลองหลาย pattern เพื่อรองรับ format ต่างๆ ของ Google Sheets
 */
export async function fetchSheetTabNames(sheetId: string): Promise<{ name: string; gid: string }[]> {
  const tabs: { name: string; gid: string }[] = [];

  // ลอง htmlview ก่อน
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`);
    const html = await res.text();

    // Pattern 1: items.push({name: "...", pageUrl: "...", gid: "..."})
    const regex1 = /items\.push\(\{name:\s*"([^"]*)",\s*pageUrl:\s*"[^"]*",\s*gid:\s*"(\d+)"/g;
    let m: RegExpExecArray | null;
    while ((m = regex1.exec(html)) !== null) {
      tabs.push({ name: m[1], gid: m[2] });
    }

    // Pattern 2: id="sheet-button-NNNN" with sheet name nearby
    if (tabs.length === 0) {
      const regex2 = /id="sheet-button-(\d+)"[^>]*>([^<]+)</g;
      while ((m = regex2.exec(html)) !== null) {
        tabs.push({ name: m[2].trim(), gid: m[1] });
      }
    }

    // Pattern 3: gid=NNNN in anchor with sheet name
    if (tabs.length === 0) {
      const regex3 = /gid=(\d+)[^"]*"[^>]*>([^<]+)</g;
      while ((m = regex3.exec(html)) !== null) {
        const name = m[2].trim();
        if (name && !name.startsWith('<')) {
          tabs.push({ name, gid: m[1] });
        }
      }
    }
  } catch { /* ignore */ }

  // Fallback: ลอง pubhtml
  if (tabs.length === 0) {
    try {
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/pubhtml`);
      const html = await res.text();
      const regex = /gid=(\d+)[^"]*"[^>]*>([^<]+)</g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(html)) !== null) {
        const name = m[2].trim();
        if (name && name.length > 0 && name.length < 200) {
          tabs.push({ name, gid: m[1] });
        }
      }
    } catch { /* ignore */ }
  }

  return tabs;
}

/**
 * ดึงข้อมูล CSV จากแท็บเฉพาะ (gid) ของ Google Spreadsheet
 */
export async function fetchSheetTabCSV(sheetId: string, gid: string, headerRow: number = 1): Promise<GenericSheetData> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}&_cb=${Date.now()}`;
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`ไม่สามารถดึงข้อมูลแท็บได้: ${response.status}`);
  }
  const csvText = await response.text();
  return parseCSVGeneric(csvText, headerRow);
}

async function postToAppsScript(url: string, payload: string): Promise<boolean> {
  try {
    // Try normal fetch first to get server response
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'ไม่สามารถบันทึกข้อมูลได้');
    }
    return true;
  } catch (error) {
    // CORS error from Google Apps Script redirect (302 → googleusercontent.com)
    if (error instanceof TypeError) {
      // Retry with no-cors mode as fallback
      try {
        await fetch(url, {
          method: 'POST',
          body: payload,
          mode: 'no-cors',
        });
      } catch {
        // Both cors and no-cors failed → likely 401 / deployment issue
        throw new Error(
          'ไม่สามารถเชื่อมต่อ Google Apps Script ได้ (CORS/401 Error)\n\n' +
          'วิธีแก้ไข:\n' +
          '1. เปิด Apps Script Editor (Extensions > Apps Script)\n' +
          '2. กด Run ฟังก์ชัน doGet เพื่อ Authorize สิทธิ์\n' +
          '3. ไปที่ Deploy > Manage deployments\n' +
          '4. กดไอคอนแก้ไข (ดินสอ) ที่ deployment\n' +
          '5. Version → เลือก "New version"\n' +
          '6. Who has access → เลือก "Anyone"\n' +
          '7. กด Deploy แล้วคัดลอก URL ใหม่ไปใส่ในตั้งค่า'
        );
      }
      // no-cors request sent — can't read response
      return true;
    }
    throw error;
  }
}

export async function updateIssue(issue: Issue): Promise<boolean> {
  const sheet = getActiveSheet(getSettings());
  if (!sheet?.appsScriptUrl) {
    throw new Error('กรุณาตั้งค่า Google Apps Script URL ก่อน');
  }

  const payload = JSON.stringify({
    action: 'update',
    gid: sheet.gid,
    rowIndex: issue.rowIndex,
    data: {
      no: issue.no,
      department: issue.department,
      date: issue.date,
      description: issue.description,
      category: issue.category,
      status: issue.status,
      notes: issue.notes,
      reporter: issue.reporter,
      responsible: issue.responsible,
      editDate: issue.editDate,
    },
  });

  return postToAppsScript(sheet.appsScriptUrl, payload);
}

export async function addIssue(issue: Omit<Issue, 'rowIndex'>): Promise<boolean> {
  const sheet = getActiveSheet(getSettings());
  if (!sheet?.appsScriptUrl) {
    throw new Error('กรุณาตั้งค่า Google Apps Script URL ก่อน');
  }

  const payload = JSON.stringify({
    action: 'add',
    gid: sheet.gid,
    data: {
      no: issue.no,
      department: issue.department,
      date: issue.date,
      description: issue.description,
      category: issue.category,
      status: issue.status,
      notes: issue.notes,
      reporter: issue.reporter,
      responsible: issue.responsible,
      editDate: issue.editDate,
    },
  });

  return postToAppsScript(sheet.appsScriptUrl, payload);
}

export async function addGenericRow(
  row: Record<string, string>,
  allHeaders: string[],
  headerRow: number
): Promise<boolean> {
  const sheet = getActiveSheet(getSettings());
  if (!sheet?.appsScriptUrl) {
    throw new Error('กรุณาตั้งค่า Google Apps Script URL ก่อน');
  }

  const values: string[] = allHeaders.map(h => String(row[h] ?? ''));

  const payload = JSON.stringify({
    action: 'addGeneric',
    gid: sheet.gid,
    headerRow: headerRow,
    values: values,
  });

  return postToAppsScript(sheet.appsScriptUrl, payload);
}

export async function updateGenericRow(
  row: GenericRow,
  allHeaders: string[],
  headerRow: number
): Promise<boolean> {
  const sheet = getActiveSheet(getSettings());
  if (!sheet?.appsScriptUrl) {
    throw new Error('กรุณาตั้งค่า Google Apps Script URL ก่อน');
  }

  // สร้าง values array ตามลำดับ headers ของ sheet
  const values: string[] = allHeaders.map(h => String(row[h] ?? ''));

  const payload = JSON.stringify({
    action: 'updateGeneric',
    gid: sheet.gid,
    rowIndex: row._rowIndex,
    headerRow: headerRow,
    values: values,
  });

  return postToAppsScript(sheet.appsScriptUrl, payload);
}
