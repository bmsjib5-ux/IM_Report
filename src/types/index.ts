export interface Issue {
  rowIndex: number;
  no: string;
  department: string;
  date: string;
  description: string;
  category: string;
  status: string;
  notes: string;
  reporter: string;
  responsible: string;
}

export type IssueStatus = 'ดำเนินการแล้ว' | 'รอดำเนินการ' | 'กำลังดำเนินการ' | 'ไม่สามารถทำได้' | '';

export type IssueCategory = 'การใช้งาน' | 'ข้อมูลพื้นฐาน' | 'แบบฟอร์ม' | 'โปรแกรม' | 'ข้อมูล' | 'Assessment' | '';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: keyof Issue | null;
  direction: SortDirection;
}

export interface SheetLink {
  id: string;
  name: string;
  sheetUrl: string;
  sheetId: string;
  gid: string;
  appsScriptUrl: string;
}

export interface Hospital {
  id: string;
  code: string;
  name: string;
  sheets: SheetLink[];
}

export interface AppSettings {
  hospitals: Hospital[];
  activeHospitalId: string;
  activeSheetId: string;
}

export const STATUS_OPTIONS: IssueStatus[] = [
  'รอดำเนินการ',
  'กำลังดำเนินการ',
  'ดำเนินการแล้ว',
  'ไม่สามารถทำได้',
];

export const CATEGORY_OPTIONS: IssueCategory[] = [
  'การใช้งาน',
  'ข้อมูลพื้นฐาน',
  'แบบฟอร์ม',
  'โปรแกรม',
  'ข้อมูล',
  'Assessment',
];

export const STATUS_COLORS: Record<string, string> = {
  'ดำเนินการแล้ว': 'bg-emerald-50 text-emerald-700',
  'รอดำเนินการ': 'bg-amber-50 text-amber-700',
  'กำลังดำเนินการ': 'bg-blue-50 text-blue-700',
  'ไม่สามารถทำได้': 'bg-rose-50 text-rose-700',
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
