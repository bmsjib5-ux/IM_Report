import { useState, useMemo } from 'react';
import type { GenericSheetData, GenericRow } from '../types';

interface GenericDataTableProps {
  data: GenericSheetData;
  loading?: boolean;
  columns?: string[];       // ถ้ากำหนด จะแสดงเฉพาะคอลัมน์เหล่านี้ตามลำดับ
  statusField?: string | string[];     // ชื่อคอลัมน์สถานะ — string = 1 กลุ่ม, array = หลายกลุ่ม
  statusOptions?: string[];            // ตัวเลือกสถานะที่กำหนดไว้ล่วงหน้า (แสดง card ครบตามลำดับ)
  requiredField?: string | string[];   // ชื่อคอลัมน์ที่ต้องไม่ว่าง — string = ต้องมีค่า, array = OR (มีอย่างใดอย่างหนึ่ง)
  checkboxFields?: string[];           // คอลัมน์ที่เป็น checkbox (TRUE/FALSE → ✓/✗)
  onRowClick?: (row: GenericRow) => void;  // คลิกแถวเพื่อแก้ไข
}

// สีตามชื่อสถานะ (ใช้ทั้ง card + เซลล์ในตาราง)
const STATUS_STYLE_MAP: Record<string, {
  gradient: string; text: string; border: string; ring: string;
  cellBg: string; cellText: string;
}> = {
  'รอดำเนินการ':    { gradient: 'from-amber-400 to-yellow-500',  text: 'text-amber-700',   border: 'border-amber-200',   ring: 'ring-amber-300',   cellBg: 'bg-amber-50',  cellText: 'text-amber-700' },
  'กำลังดำเนินการ':  { gradient: 'from-orange-400 to-orange-500', text: 'text-orange-700',  border: 'border-orange-200',  ring: 'ring-orange-300',  cellBg: 'bg-orange-50', cellText: 'text-orange-700' },
  'รอตรวจสอบ':     { gradient: 'from-pink-400 to-rose-500',     text: 'text-pink-700',    border: 'border-pink-200',    ring: 'ring-pink-300',    cellBg: 'bg-pink-50',   cellText: 'text-pink-700' },
  'ตรวจสอบแล้ว':    { gradient: 'from-blue-500 to-indigo-600',  text: 'text-blue-700',    border: 'border-blue-200',    ring: 'ring-blue-300',    cellBg: 'bg-blue-50',   cellText: 'text-blue-700' },
  'ดำเนินการแล้ว':   { gradient: 'from-emerald-500 to-green-600', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-300', cellBg: 'bg-emerald-50',cellText: 'text-emerald-700' },
  'ไม่สามารถทำได้':  { gradient: 'from-rose-500 to-red-600',     text: 'text-rose-700',    border: 'border-rose-200',    ring: 'ring-rose-300',    cellBg: 'bg-rose-50',   cellText: 'text-rose-700' },
  'ต้องแก้ไข':       { gradient: 'from-red-400 to-rose-500',     text: 'text-red-700',     border: 'border-red-200',     ring: 'ring-red-300',     cellBg: 'bg-red-50',    cellText: 'text-red-700' },
  'เจ้าหน้าที่ตรวจแล้ว': { gradient: 'from-teal-400 to-cyan-500', text: 'text-teal-700',   border: 'border-teal-200',   ring: 'ring-teal-300',   cellBg: 'bg-teal-50',  cellText: 'text-teal-700' },
  'แก้ไขแล้ว':       { gradient: 'from-green-400 to-emerald-500', text: 'text-green-700',  border: 'border-green-200',  ring: 'ring-green-300',  cellBg: 'bg-green-50', cellText: 'text-green-700' },
  'ใช้แบบเดิม':      { gradient: 'from-violet-400 to-purple-500', text: 'text-violet-700', border: 'border-violet-200', ring: 'ring-violet-300', cellBg: 'bg-violet-50',cellText: 'text-violet-700' },
};

// สีสำรอง (สำหรับสถานะที่ไม่ได้กำหนดไว้ — สีเทา)
const FALLBACK_STYLE = {
  gradient: 'from-gray-400 to-gray-500', text: 'text-gray-600', border: 'border-gray-200', ring: 'ring-gray-300',
  cellBg: 'bg-gray-100', cellText: 'text-gray-600',
};

function getStatusStyle(status: string) {
  return STATUS_STYLE_MAP[status] || FALLBACK_STYLE;
}

// Render checkbox value (TRUE → green check, FALSE/empty → gray dash)
function renderCheckbox(val: string) {
  const checked = val.toUpperCase() === 'TRUE';
  return checked ? (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-100 text-emerald-600">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 text-gray-400">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
      </svg>
    </span>
  );
}

export default function GenericDataTable({ data, loading, columns, statusField, statusOptions, requiredField, checkboxFields, onRowClick }: GenericDataTableProps) {
  const { rows: rawRows } = data;
  const cbFields = useMemo(() => new Set(checkboxFields || []), [checkboxFields]);

  // ถ้ามี columns prop ให้แสดงเฉพาะคอลัมน์ที่กำหนด (เฉพาะที่มีอยู่จริงใน data)
  const headers = columns
    ? columns.filter(col => data.headers.includes(col))
    : data.headers;

  // กรองแถวที่ requiredField ว่าง (array = OR: มีอย่างใดอย่างหนึ่งก็แสดง)
  const validRows = useMemo(() => {
    if (!requiredField) return rawRows;
    const fields = Array.isArray(requiredField) ? requiredField : [requiredField];
    return rawRows.filter(row =>
      fields.some(f => String(row[f] || '').trim() !== '')
    );
  }, [rawRows, requiredField]);

  // แปลง statusField เป็น array
  const statusFields = useMemo(() => {
    if (!statusField) return [];
    return Array.isArray(statusField) ? statusField : [statusField];
  }, [statusField]);

  // นับสถานะแยกตามแต่ละ field (ใช้ validRows)
  // ถ้ามี statusOptions → แสดงครบตามลำดับที่กำหนด (รวม count=0) + ค่าจากข้อมูลที่ไม่อยู่ใน config
  const statusGroups = useMemo(() => {
    return statusFields.map(field => {
      const counts = new Map<string, number>();
      for (const row of validRows) {
        const val = String(row[field] || '').trim();
        if (!val) continue;
        counts.set(val, (counts.get(val) || 0) + 1);
      }
      // ถ้ามี statusOptions ให้ใช้ลำดับจาก config + เพิ่มค่าจากข้อมูลที่ไม่อยู่ใน config
      if (statusOptions && statusOptions.length > 0) {
        const ordered = statusOptions.map(s => ({ status: s, count: counts.get(s) || 0 }));
        // เพิ่มสถานะที่มีในข้อมูลแต่ไม่มีใน config
        for (const [status, count] of counts) {
          if (!statusOptions.includes(status)) {
            ordered.push({ status, count });
          }
        }
        return { field, counts: ordered };
      }
      return {
        field,
        counts: Array.from(counts.entries()).map(([status, count]) => ({ status, count })),
      };
    });
  }, [validRows, statusFields, statusOptions]);

  // Search
  const [searchText, setSearchText] = useState('');

  // Status filter — เก็บทั้ง field + value
  const [activeStatusField, setActiveStatusField] = useState('');
  const [activeStatusValue, setActiveStatusValue] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Sort
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

  const filteredRows = useMemo(() => {
    let result = validRows;

    // กรองตามสถานะ (field + value)
    if (activeStatusField && activeStatusValue) {
      result = result.filter(row => String(row[activeStatusField] || '').trim() === activeStatusValue);
    }

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(row =>
        headers.some(h => String(row[h] || '').toLowerCase().includes(search))
      );
    }
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const aVal = String(a[sortCol] || '');
        const bVal = String(b[sortCol] || '');
        const cmp = aVal.localeCompare(bVal, 'th');
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [validRows, headers, searchText, sortCol, sortDir, activeStatusField, activeStatusValue]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDir === 'asc') { setSortDir('desc'); return; }
      if (sortDir === 'desc') { setSortCol(null); setSortDir(null); return; }
    }
    setSortCol(col);
    setSortDir('asc');
  };

  const getSortIcon = (col: string) => {
    if (sortCol !== col) {
      return (
        <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDir === 'asc' ? (
      <svg className="w-3 h-3 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Reset page when search/filter changes
  const handleSearchChange = (val: string) => {
    setSearchText(val);
    setCurrentPage(1);
  };

  const handleStatusClick = (field: string, status: string) => {
    if (activeStatusField === field && activeStatusValue === status) {
      setActiveStatusField('');
      setActiveStatusValue('');
    } else {
      setActiveStatusField(field);
      setActiveStatusValue(status);
    }
    setCurrentPage(1);
  };

  // Mobile card view
  const renderMobileCard = (row: GenericRow, idx: number) => (
    <div
      key={row._rowIndex || idx}
      onClick={() => onRowClick?.(row)}
      className={`rounded-xl border border-gray-100 p-3.5 bg-white/80 ${onRowClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-md transition-all' : ''}`}
    >
      {headers.slice(0, 6).map(h => {
        const val = String(row[h] || '');
        if (!val) return null;
        const isStatus = statusFields.includes(h);
        const isCheckbox = cbFields.has(h);
        const statusStyle = isStatus ? STATUS_STYLE_MAP[val] : null;
        return (
          <div key={h} className="flex gap-2 py-0.5 items-center">
            <span className="text-xs text-gray-400 shrink-0 w-24 truncate">{h}:</span>
            {isCheckbox ? (
              renderCheckbox(val)
            ) : isStatus && statusStyle ? (
              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle.cellBg} ${statusStyle.cellText}`}>
                {val}
              </span>
            ) : (
              <span className="text-sm text-gray-700 break-words">{val}</span>
            )}
          </div>
        );
      })}
      {headers.length > 6 && (
        <p className="text-xs text-gray-400 mt-1">+{headers.length - 6} คอลัมน์</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-16 text-center">
        <div className="relative mx-auto w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
        </div>
        <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (headers.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-16 text-center">
        <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-400 font-medium">ไม่พบข้อมูล</p>
      </div>
    );
  }

  const total = validRows.length;

  return (
    <div className="space-y-3">
      {/* Summary Cards — แถวเดียวกัน */}
      {statusGroups.some(g => g.counts.length > 0) && (
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 lg:items-end">
          {/* ทั้งหมด */}
          <div className="shrink-0">
            {statusFields.length > 1 && (
              <p className="text-xs font-semibold text-transparent mb-1.5 tracking-wide select-none">&nbsp;</p>
            )}
            <div
              onClick={() => { setActiveStatusField(''); setActiveStatusValue(''); setCurrentPage(1); }}
              className={`min-w-[120px] relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl border px-3 py-2.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                !activeStatusValue ? 'border-blue-200 ring-2 ring-blue-300 shadow-md' : 'border-white/60 shadow-sm hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-medium leading-tight ${!activeStatusValue ? 'text-blue-700' : 'text-gray-500'}`}>ทั้งหมด</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{total}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg p-1.5 shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-1.5">
                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* แต่ละ group ต่อกันในแถวเดียว */}
          {statusGroups.map(({ field, counts: groupCounts }) => groupCounts.length > 0 && (
            <div key={field} className="flex-1 min-w-0">
              {statusFields.length > 1 && (
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{field}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {groupCounts.map(({ status, count }) => {
                  const style = getStatusStyle(status);
                  const isActive = activeStatusField === field && activeStatusValue === status;
                  return (
                    <div
                      key={status}
                      onClick={() => { handleStatusClick(field, status); setCurrentPage(1); }}
                      className={`flex-1 min-w-[100px] relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl border px-3 py-2.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                        isActive ? `${style.border} ring-2 ${style.ring} shadow-md` : 'border-white/60 shadow-sm hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs font-medium leading-tight ${isActive ? style.text : 'text-gray-500'}`}>{status}</p>
                          <p className="text-xl font-bold text-gray-900 mt-0.5">{count}</p>
                        </div>
                        <div className={`bg-gradient-to-br ${style.gradient} text-white rounded-lg p-1.5 shadow-sm`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                      {total > 0 && (
                        <div className="mt-1.5">
                          <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                            <div
                              className={`bg-gradient-to-r ${style.gradient} h-1 rounded-full transition-all duration-700 ease-out`}
                              style={{ width: `${(count / total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + Info bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="ค้นหา..."
            value={searchText}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white/80"
          />
        </div>
        <p className="text-sm text-gray-500 font-medium">
          ทั้งหมด <span className="text-gray-800 font-bold">{filteredRows.length}</span> รายการ
          {activeStatusValue && (
            <span className="ml-1.5 inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-semibold">
              {activeStatusField}: {activeStatusValue}
              <button onClick={() => { setActiveStatusField(''); setActiveStatusValue(''); setCurrentPage(1); }} className="hover:text-indigo-800">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </span>
          )}
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
        {/* Mobile card view */}
        <div className="lg:hidden">
          {paginatedRows.length === 0 ? (
            <div className="px-4 py-16 text-center text-gray-400 text-base">
              <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ไม่พบข้อมูล
            </div>
          ) : (
            <div className="p-3 space-y-2.5">
              {paginatedRows.map((row, idx) => renderMobileCard(row, idx))}
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-600 tracking-wide w-10">#</th>
                {headers.map(h => (
                  <th
                    key={h}
                    onClick={() => handleSort(h)}
                    className="px-2 py-2.5 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:bg-indigo-50/50 transition-colors select-none tracking-wide whitespace-nowrap"
                  >
                    <div className="flex items-center gap-0.5">
                      <span>{h}</span>
                      {getSortIcon(h)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 1} className="px-2 py-12 text-center text-gray-400 text-sm">
                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <tr
                    key={row._rowIndex || idx}
                    onClick={() => onRowClick?.(row)}
                    className={`hover:bg-indigo-50/60 transition-colors duration-150 even:bg-slate-50/40 ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    <td className="px-2 py-1.5 text-center text-gray-400 text-xs">{startIndex + idx + 1}</td>
                    {headers.map(h => {
                      const val = String(row[h] || '');
                      const isStatus = statusFields.includes(h) && val;
                      const isCheckbox = cbFields.has(h);
                      const statusStyle = isStatus ? STATUS_STYLE_MAP[val] : null;
                      return (
                        <td key={h} className="px-2 py-1.5">
                          {isCheckbox ? (
                            renderCheckbox(val)
                          ) : isStatus && statusStyle ? (
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusStyle.cellBg} ${statusStyle.cellText}`}>
                              {val}
                            </span>
                          ) : (
                            <div className="text-gray-700" title={val}>
                              {val}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-slate-50/50 gap-2">
            <p className="text-sm text-gray-500 font-medium">
              <span className="text-gray-800">{startIndex + 1}-{Math.min(startIndex + pageSize, filteredRows.length)}</span> จาก {filteredRows.length}
            </p>
            <div className="flex gap-1 flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-gray-600 transition-colors"
              >
                ก่อนหน้า
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, idx, arr) => {
                  const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                  return (
                    <span key={page} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-gray-400 text-sm">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 text-sm border rounded-lg font-medium transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/25'
                            : 'border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-gray-600 transition-colors"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
