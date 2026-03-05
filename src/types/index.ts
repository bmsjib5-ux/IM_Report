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
  editDate: string;
}

export type IssueStatus = 'ดำเนินการแล้ว' | 'รอดำเนินการ' | 'กำลังดำเนินการ' | 'ไม่สามารถทำได้' | '';

export type IssueCategory = 'การใช้งาน' | 'ข้อมูลพื้นฐาน' | 'แบบฟอร์ม' | 'โปรแกรม' | 'ข้อมูล' | 'Assessment' | '';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: keyof Issue | null;
  direction: SortDirection;
}

export type SheetType = 'issue' | 'form' | 'report' | 'assessment' | 'training';

export const SHEET_TYPE_OPTIONS: { value: SheetType; label: string }[] = [
  { value: 'issue', label: 'ปัญหา' },
  { value: 'form', label: 'แบบฟอร์ม' },
  { value: 'report', label: 'รายงาน' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'training', label: 'อบรม' },
];

// Config สำหรับแต่ละประเภท sheet
export interface SheetTypeConfig {
  columns?: string[];       // คอลัมน์ที่จะแสดง (ถ้าไม่กำหนด = แสดงทั้งหมด)
  statusField?: string | string[];     // ชื่อคอลัมน์สถานะ — string = 1 คอลัมน์, array = หลายกลุ่ม
  statusOptions?: string[];            // ตัวเลือกสถานะที่กำหนดไว้ล่วงหน้า (ใช้ใน dropdown แก้ไข)
  requiredField?: string | string[];   // ชื่อคอลัมน์ที่ต้องไม่ว่าง (กรองแถวว่างออก) — ถ้าเป็น array = OR (มีอย่างใดอย่างหนึ่งก็แสดง)
  headerRow?: number;       // override headerRow (ถ้ากำหนด จะใช้ค่านี้แทน sheet setting)
  columnOverrides?: Record<number, string>; // กำหนดชื่อ header เอง (0-based col index → ชื่อ) — สำหรับ merged cell ที่ CSV อ่านไม่ได้
  checkboxFields?: string[];  // คอลัมน์ที่เป็น checkbox (แสดง TRUE/FALSE เป็น ✓/✗)
  dropdownOptions?: Record<string, string[]>;  // คอลัมน์ → ตัวเลือก dropdown (กำหนดเอง + รวมค่าจากข้อมูลจริง)
  sectionHeaderField?: string;  // คอลัมน์ที่ใช้ตรวจจับแถวหัวข้อ (merged row) — แถวที่มีเฉพาะคอลัมน์นี้มีค่า จะแสดง colSpan ทั้งแถว
  noPagination?: boolean;       // แสดงข้อมูลทั้งหมดโดยไม่แบ่งหน้า
  statusLabelTrim?: string[];   // คำนำหน้าที่ต้องตัดออกจาก label ใน summary cards
}

export const SHEET_TYPE_CONFIG: Partial<Record<SheetType, SheetTypeConfig>> = {
  form: {
    headerRow: 4,
    columns: [
      'ระบบงาน',
      'ชื่อแบบฟอร์ม',
      'รายชื่อในระบบ',
      'ขนาดกระดาษ',
      'จนท.รพ',
      'จนท.BMS',
      'สถานะ',
      'เช็คการปริ้น',
      'วันที่ดำเนินการ',
      'หมายเหตุ',
      'วันที่แก้ไข',
      'BMS',
      'วิธีพิมพ์',
      'รายละเอียด',
      'ผู้ตรวจสอบ BMS',
      'ผลการตรวจสอบ',
    ],
    statusField: 'สถานะ',
    statusOptions: [
      'รอดำเนินการ',
      'กำลังดำเนินการ',
      'รอตรวจสอบ',
      'ตรวจสอบแล้ว',
      'ต้องแก้ไข',
      'เจ้าหน้าที่ตรวจแล้ว',
      'ดำเนินการแล้ว',
      'แก้ไขแล้ว',
      'ใช้แบบเดิม',
    ],
    requiredField: ['ชื่อแบบฟอร์ม', 'รายชื่อในระบบ'],
    columnOverrides: { 7: 'เช็คการปริ้น', 8: 'วันที่ดำเนินการ', 10: 'วันที่แก้ไข' },
    checkboxFields: ['เช็คการปริ้น'],
    dropdownOptions: { 'ผู้ตรวจสอบ BMS': ['อลงกรณ์', 'ศุภรัตน์', 'สุกรินทร์', 'ศราวุฒิ', 'สรวิชญ์', 'ภูมรินทร์', 'ชนาธิป', 'ศิรลักษณ์', 'ประพล'] },
  },
  assessment: {
    headerRow: 1,
    columns: [
      'ระบบงาน',
      'รายชื่อในระบบ',
      'ชื่อแบบฟอร์ม',
      'จนท.บริษัทฯ',
      'สถานะ',
      'พิมพ์เอกสาร',
      'วันที่แล้วเสร็จ',
      'หมายเหตุ',
      'วันที่แก้ไข',
    ],
    statusField: 'สถานะ',
    statusOptions: [
      'รอดำเนินการ',
      'กำลังดำเนินการ',
      'ดำเนินการแล้ว',
      'รอตรวจสอบ',
      'ตรวจสอบแล้ว',
    ],
    requiredField: 'ชื่อแบบฟอร์ม',
    checkboxFields: ['พิมพ์เอกสาร'],
  },
  training: {
    headerRow: 1,
    columns: [
      'วัน/เวลา',
      'ระบบงาน และผู้เกี่ยวข้อง',
      'เนื้อหาเบื้องต้น',
      'รอบ',
      'ห้องอบรม',
      'วิทยากร (BMS)',
      'ผู้เข้าอบรม และผู้ที่เกี่ยวข้อง (จนท.รพ.)',
    ],
    statusField: 'ระบบงาน และผู้เกี่ยวข้อง',
    requiredField: ['วัน/เวลา', 'ระบบงาน และผู้เกี่ยวข้อง'],
    columnOverrides: { 0: 'วัน/เวลา' },
    sectionHeaderField: 'วัน/เวลา',
    noPagination: true,
    statusLabelTrim: ['อบรมผู้ใช้งาน – ระบบงาน', 'อบรมผู้ใช้งาน – '],
  },
  report: {
    headerRow: 1,
    columns: [
      'ชื่อรายงานที่หน่วยงานเเจ้ง',
      'ชื่อรายงานในระบบ',
      'เงื่อนไข',
      'ผู้เเจ้ง',
      'ผู้รับ',
      'วันที่ดำเนินการ',
      'ผู้ออกแบบ',
      'ออกแบบ',
      'เขียน Code',
      'วันที่เสร็จ',
      'วันที่หน่วยงานตรวจสอบ',
      'ผู้ใช้งานตรวจสอบ',
      'วันที่แก้ไข',
    ],
    statusField: ['ออกแบบ', 'เขียน Code', 'ผู้ใช้งานตรวจสอบ'],
    requiredField: ['ชื่อรายงานที่หน่วยงานเเจ้ง', 'ชื่อรายงานในระบบ'],
  },
};

export interface SheetLink {
  id: string;
  name: string;
  sheetUrl: string;
  sheetId: string;
  gid: string;
  appsScriptUrl: string;
  headerRow?: number; // แถวที่เป็น header (default=1)
  sheetType?: SheetType; // ประเภท sheet (default='issue')
}

// Generic row สำหรับ sheet ที่มีโครงสร้างต่างจาก Issue
export interface GenericRow {
  _rowIndex: number;
  [key: string]: string | number;
}

export interface GenericSheetData {
  headers: string[];
  rows: GenericRow[];
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
