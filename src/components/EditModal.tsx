import { useState } from 'react';
import type { Issue } from '../types';
import { STATUS_OPTIONS, CATEGORY_OPTIONS } from '../types';

interface EditModalProps {
  issue: Issue;
  onClose: () => void;
  onSave: (issue: Issue) => Promise<void>;
  saving: boolean;
}

export default function EditModal({ issue, onClose, onSave, saving }: EditModalProps) {
  const [form, setForm] = useState<Issue>({ ...issue });

  const handleChange = (field: keyof Issue, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-set วันที่แก้ไข เป็นวันนี้ (พ.ศ.)
    const today = new Date();
    const thaiYear = today.getFullYear() + 543;
    const editDateStr = `${today.getDate()}/${today.getMonth() + 1}/${thaiYear}`;
    await onSave({ ...form, editDate: editDateStr });
  };

  const inputClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none hover:border-gray-300 transition-colors";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose} style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border-0 sm:border border-gray-100"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-t-2xl"></div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">แก้ไขรายการ</h2>
              <p className="text-sm text-gray-500 mt-0.5">#{form.no}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>ลำดับ</label>
              <input type="text" value={form.no} onChange={e => handleChange('no', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>แผนก/สถานที่</label>
              <input type="text" value={form.department} onChange={e => handleChange('department', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>วันที่</label>
              <input type="text" value={form.date} onChange={e => handleChange('date', e.target.value)} className={inputClass} placeholder="dd/mm/yyyy" />
            </div>
            <div>
              <label className={labelClass}>ประเภท</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)} className={`${inputClass} bg-white`}>
                <option value="">-- เลือก --</option>
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>รายละเอียดปัญหา</label>
            <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={4} className={`${inputClass} resize-y`} />
          </div>

          <div>
            <label className={labelClass}>สถานะ</label>
            <select value={form.status} onChange={e => handleChange('status', e.target.value)} className={`${inputClass} bg-white`}>
              <option value="">-- เลือก --</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>หมายเหตุ/การดำเนินการ</label>
            <textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={3} className={`${inputClass} resize-y`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>ผู้แจ้ง</label>
              <input type="text" value={form.reporter} onChange={e => handleChange('reporter', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>ผู้รับผิดชอบ</label>
              <input type="text" value={form.responsible} onChange={e => handleChange('responsible', e.target.value)} className={inputClass} />
            </div>
          </div>

          {form.editDate && (
            <div>
              <label className={labelClass}>วันที่แก้ไขล่าสุด</label>
              <input type="text" value={form.editDate} readOnly className={`${inputClass} bg-gray-50 text-gray-500`} />
            </div>
          )}

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
