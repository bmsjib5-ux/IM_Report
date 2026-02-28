import type { Issue, AppSettings, SheetLink, Hospital } from '../types';
import { parseCSV, extractSheetInfo } from '../utils/csvParser';
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
    },
  ],
};

const DEFAULT_SETTINGS: AppSettings = {
  hospitals: [DEFAULT_HOSPITAL],
  activeHospitalId: 'default',
  activeSheetId: 'default-sheet',
};

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
    return { ...DEFAULT_SETTINGS, ...parsed };
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
      localStorage.setItem('im-dashboard-settings', JSON.stringify(remote));
      return remote;
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

  const csvUrl = `https://docs.google.com/spreadsheets/d/${target.sheetId}/gviz/tq?tqx=out:csv&gid=${target.gid}`;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`ไม่สามารถดึงข้อมูลได้: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  return parseCSV(csvText);
}

export async function updateIssue(issue: Issue): Promise<boolean> {
  const sheet = getActiveSheet(getSettings());
  if (!sheet?.appsScriptUrl) {
    throw new Error('กรุณาตั้งค่า Google Apps Script URL ก่อน');
  }

  const response = await fetch(sheet.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
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
      },
    }),
  });

  const result = await response.json();
  return result.success;
}

export async function addIssue(issue: Omit<Issue, 'rowIndex'>): Promise<boolean> {
  const sheet = getActiveSheet(getSettings());
  if (!sheet?.appsScriptUrl) {
    throw new Error('กรุณาตั้งค่า Google Apps Script URL ก่อน');
  }

  const response = await fetch(sheet.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
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
      },
    }),
  });

  const result = await response.json();
  return result.success;
}
