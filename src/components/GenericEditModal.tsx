import { useState } from 'react';
import type { GenericRow } from '../types';

interface GenericEditModalProps {
  row: GenericRow;
  headers: string[];                    // header ทั้งหมดจาก sheet
  columns?: string[];                   // คอลัมน์ที่แสดง (จาก SHEET_TYPE_CONFIG)
  statusField?: string | string[];      // คอลัมน์สถานะ → ใช้ dropdown
  statusOptions?: string[];             // ตัวเลือกสถานะจากข้อมูลจริง
  checkboxFields?: string[];            // คอลัมน์ที่เป็น checkbox (TRUE/FALSE)
  dropdownOptions?: Record<string, string[]>;  // คอลัมน์ → ตัวเลือก dropdown (ดึงจากข้อมูลจริง)
  onClose: () => void;
  onSave: (updatedRow: GenericRow) => Promise<void>;
  saving: boolean;
}

// กำหนดประเภท input ตามชื่อคอลัมน์
function getFieldType(fieldName: string, statusFields: string[], cbFields: Set<string>, ddFields: Set<string>): 'select-status' | 'select-dropdown' | 'textarea' | 'readonly' | 'checkbox' | 'text' {
  if (fieldName === 'วันที่แก้ไข') return 'readonly';
  if (cbFields.has(fieldName)) return 'checkbox';
  if (statusFields.includes(fieldName)) return 'select-status';
  if (ddFields.has(fieldName)) return 'select-dropdown';
  if (fieldName === 'หมายเหตุ' || fieldName === 'เงื่อนไข' || fieldName === 'รายละเอียด') return 'textarea';
  return 'text';
}

export default function GenericEditModal({ row, headers, columns, statusField, statusOptions = [], checkboxFields, dropdownOptions = {}, onClose, onSave, saving }: GenericEditModalProps) {
  // คอลัมน์ที่จะแสดงในฟอร์ม
  const editableFields = columns
    ? columns.filter(col => headers.includes(col))
    : headers;

  // Normalize statusField เป็น array
  const statusFields = statusField
    ? (Array.isArray(statusField) ? statusField : [statusField])
    : [];

  const cbFields = new Set(checkboxFields || []);
  const ddFields = new Set(Object.keys(dropdownOptions));

  // Form state
  const [form, setForm] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const h of editableFields) {
      initial[h] = String(row[h] || '');
    }
    return initial;
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedForm = { ...form };
    // Auto-set วันที่แก้ไข เป็นวันนี้ (พ.ศ.)
    if (editableFields.includes('วันที่แก้ไข')) {
      const today = new Date();
      const thaiYear = today.getFullYear() + 543;
      updatedForm['วันที่แก้ไข'] = `${today.getDate()}/${today.getMonth() + 1}/${thaiYear}`;
    }
    // สร้าง updated row: copy ค่าเดิมทั้งหมด + ค่าที่แก้ไข
    const updatedRow: GenericRow = { ...row };
    for (const key of editableFields) {
      updatedRow[key] = updatedForm[key];
    }
    await onSave(updatedRow);
  };

  // หา label แสดง (ใช้คอลัมน์แรกที่มีค่า)
  const firstField = editableFields[0];
  const subtitle = firstField ? String(row[firstField] || '') : '';

  const inputClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none hover:border-gray-300 transition-colors";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  // จัดกลุ่ม field เป็นคู่ (2 คอลัมน์) ยกเว้น textarea/readonly แสดงเต็มแถว
  const renderFields = () => {
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < editableFields.length) {
      const field = editableFields[i];
      const fieldType = getFieldType(field, statusFields, cbFields, ddFields);

      if (fieldType === 'textarea') {
        // textarea แสดงเต็มแถว
        elements.push(
          <div key={field}>
            <label className={labelClass}>{field}</label>
            <textarea
              value={form[field]}
              onChange={e => handleChange(field, e.target.value)}
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </div>
        );
        i++;
      } else if (fieldType === 'readonly') {
        // วันที่แก้ไข — read-only
        elements.push(
          <div key={field}>
            <label className={labelClass}>{field}</label>
            <input
              type="text"
              value={form[field]}
              readOnly
              className={`${inputClass} bg-gray-50 text-gray-500`}
            />
            <p className="text-xs text-gray-400 mt-1">จะอัปเดตอัตโนมัติเมื่อบันทึก</p>
          </div>
        );
        i++;
      } else {
        // text/select — จัดคู่ 2 คอลัมน์
        const nextField = i + 1 < editableFields.length ? editableFields[i + 1] : null;
        const nextFieldType = nextField ? getFieldType(nextField, statusFields, cbFields, ddFields) : null;
        const canPair = nextField && nextFieldType !== 'textarea' && nextFieldType !== 'readonly';

        if (canPair && nextField) {
          elements.push(
            <div key={field} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderSingleField(field, fieldType)}
              {renderSingleField(nextField, nextFieldType!)}
            </div>
          );
          i += 2;
        } else {
          elements.push(
            <div key={field} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderSingleField(field, fieldType)}
            </div>
          );
          i++;
        }
      }
    }

    return elements;
  };

  const renderSingleField = (field: string, fieldType: string) => {
    if (fieldType === 'checkbox') {
      const checked = form[field]?.toUpperCase() === 'TRUE';
      return (
        <div key={field}>
          <label className={labelClass}>{field}</label>
          <label className="flex items-center gap-3 mt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => handleChange(field, e.target.checked ? 'TRUE' : 'FALSE')}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer"
            />
            <span className={`text-sm font-medium ${checked ? 'text-emerald-600' : 'text-gray-400'}`}>
              {checked ? 'เสร็จแล้ว' : 'ยังไม่เสร็จ'}
            </span>
          </label>
        </div>
      );
    }

    if (fieldType === 'select-status') {
      return (
        <div key={field}>
          <label className={labelClass}>{field}</label>
          <select
            value={form[field]}
            onChange={e => handleChange(field, e.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="">-- เลือก --</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      );
    }

    if (fieldType === 'select-dropdown') {
      const opts = dropdownOptions[field] || [];
      return (
        <div key={field}>
          <label className={labelClass}>{field}</label>
          <select
            value={form[field]}
            onChange={e => handleChange(field, e.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="">-- เลือก --</option>
            {opts.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={field}>
        <label className={labelClass}>{field}</label>
        <input
          type="text"
          value={form[field]}
          onChange={e => handleChange(field, e.target.value)}
          className={inputClass}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border-0 sm:border border-gray-100"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-t-2xl"></div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">แก้ไขรายการ</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {renderFields()}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-200 hover:border-gray-300 font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold shadow-sm shadow-indigo-500/25 transition-all"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
