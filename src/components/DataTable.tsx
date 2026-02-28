import { useState, useEffect, useRef, useCallback } from 'react';
import type { Issue, SortConfig } from '../types';
import StatusBadge from './StatusBadge';

// --- Column Definitions ---
interface ColumnDef {
  key: keyof Issue;
  label: string;
  defaultWidth: number;
  minWidth: number;
}

const COLUMN_DEFS: ColumnDef[] = [
  { key: 'no', label: '#', defaultWidth: 45, minWidth: 35 },
  { key: 'department', label: 'แผนก', defaultWidth: 80, minWidth: 50 },
  { key: 'date', label: 'วันที่', defaultWidth: 85, minWidth: 60 },
  { key: 'description', label: 'รายละเอียดปัญหา', defaultWidth: 250, minWidth: 100 },
  { key: 'category', label: 'ประเภท', defaultWidth: 80, minWidth: 50 },
  { key: 'status', label: 'สถานะ', defaultWidth: 95, minWidth: 60 },
  { key: 'notes', label: 'หมายเหตุ', defaultWidth: 160, minWidth: 80 },
  { key: 'reporter', label: 'ผู้แจ้ง', defaultWidth: 100, minWidth: 50 },
  { key: 'responsible', label: 'ผู้ดูแล', defaultWidth: 75, minWidth: 50 },
];

const DEFAULT_ORDER = COLUMN_DEFS.map(c => c.key);
const DEFAULT_WIDTHS: Record<string, number> = Object.fromEntries(
  COLUMN_DEFS.map(c => [c.key, c.defaultWidth])
);

const ROW_STATUS_BG: Record<string, string> = {
  'รอดำเนินการ': 'bg-orange-100/80',
  'กำลังดำเนินการ': 'bg-yellow-100/80',
  'ไม่สามารถทำได้': 'bg-red-100/80',
};

const STORAGE_KEY = 'im-table-column-config';

interface ColumnConfig {
  order: string[];
  widths: Record<string, number>;
}

function loadColumnConfig(): ColumnConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ColumnConfig;
      // Validate: ensure all keys are present
      const allKeys = new Set<string>(DEFAULT_ORDER);
      const validOrder = parsed.order.filter((k: string) => allKeys.has(k));
      // Add any missing keys at the end
      for (const k of DEFAULT_ORDER) {
        if (!validOrder.includes(k)) validOrder.push(k);
      }
      const validWidths: Record<string, number> = {};
      for (const k of DEFAULT_ORDER) {
        validWidths[k] = typeof parsed.widths[k] === 'number' ? parsed.widths[k] : DEFAULT_WIDTHS[k];
      }
      return { order: validOrder, widths: validWidths };
    }
  } catch { /* ignore */ }
  return { order: [...DEFAULT_ORDER], widths: { ...DEFAULT_WIDTHS } };
}

function saveColumnConfig(config: ColumnConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// --- Cell Renderer ---
function renderCell(issue: Issue, key: keyof Issue) {
  const value = issue[key];
  switch (key) {
    case 'no':
      return <span className="font-medium text-gray-900">{value}</span>;
    case 'status':
      return <StatusBadge status={String(value)} />;
    case 'description':
    case 'notes':
      return (
        <div className="line-clamp-2 leading-snug text-gray-700" title={String(value)}>
          {value}
        </div>
      );
    case 'date':
      return <span className="text-gray-700 whitespace-nowrap">{value}</span>;
    default:
      return (
        <div className="truncate text-gray-700" title={String(value)}>
          {value}
        </div>
      );
  }
}

// --- Component ---
interface DataTableProps {
  issues: Issue[];
  sortConfig: SortConfig;
  onSort: (key: keyof Issue) => void;
  onRowClick: (issue: Issue) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function DataTable({
  issues,
  sortConfig,
  onSort,
  onRowClick,
  currentPage,
  pageSize,
  onPageChange,
}: DataTableProps) {
  const totalPages = Math.ceil(issues.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedIssues = issues.slice(startIndex, startIndex + pageSize);

  // Column config state
  const [columnOrder, setColumnOrder] = useState<string[]>(() => loadColumnConfig().order);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => loadColumnConfig().widths);

  // Resize state
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const didResizeRef = useRef(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const didDragRef = useRef(false);

  // Column def lookup
  const colDefMap = Object.fromEntries(COLUMN_DEFS.map(c => [c.key, c]));

  // Get ordered columns (filtered to valid ones)
  const orderedColumns: ColumnDef[] = columnOrder
    .map(key => colDefMap[key])
    .filter(Boolean);

  // --- Persist helpers ---
  const persistConfig = useCallback((order: string[], widths: Record<string, number>) => {
    saveColumnConfig({ order, widths });
  }, []);

  // --- Resize handlers ---
  const handleResizeStart = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      key,
      startX: e.clientX,
      startWidth: columnWidths[key] || DEFAULT_WIDTHS[key],
    };
    didResizeRef.current = false;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      didResizeRef.current = true;
      const { key, startX, startWidth } = resizingRef.current;
      const minW = colDefMap[key]?.minWidth || 30;
      const delta = e.clientX - startX;
      const newWidth = Math.max(minW, startWidth + delta);
      setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
    };

    const handleMouseUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Save after resize
      setColumnWidths(prev => {
        persistConfig(columnOrder, prev);
        return prev;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [colDefMap, columnOrder, persistConfig]);

  // --- Drag handlers ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    didDragRef.current = false;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Make ghost semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      setTimeout(() => {
        (e.currentTarget as HTMLElement).style.opacity = '0.4';
      }, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    didDragRef.current = true;
    const newOrder = [...columnOrder];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, moved);
    setColumnOrder(newOrder);
    persistConfig(newOrder, columnWidths);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '';
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // --- Sort click (prevent during resize/drag) ---
  const handleHeaderClick = (key: keyof Issue) => {
    if (didResizeRef.current || didDragRef.current) {
      didResizeRef.current = false;
      didDragRef.current = false;
      return;
    }
    onSort(key);
  };

  // --- Reset columns ---
  const handleResetColumns = () => {
    const order = [...DEFAULT_ORDER];
    const widths = { ...DEFAULT_WIDTHS };
    setColumnOrder(order);
    setColumnWidths(widths);
    persistConfig(order, widths);
  };

  // --- Sort icon ---
  const getSortIcon = (key: keyof Issue) => {
    if (sortConfig.key !== key) {
      return (
        <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-3 h-3 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // --- Mobile card renderer ---
  const renderMobileCard = (issue: Issue, idx: number) => {
    const rowBg = ROW_STATUS_BG[issue.status] || '';
    return (
      <div
        key={`${issue.no}-${idx}`}
        onClick={() => onRowClick(issue)}
        className={`rounded-xl border border-gray-100 p-3.5 cursor-pointer transition-all duration-150 active:scale-[0.98] hover:shadow-md ${rowBg || 'bg-white/80'}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-900">#{issue.no}</span>
          <StatusBadge status={issue.status} />
        </div>
        <p className="text-sm text-gray-700 line-clamp-2 mb-2">{issue.description}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          {issue.department && <span>{issue.department}</span>}
          {issue.date && <span>{issue.date}</span>}
          {issue.category && <span>{issue.category}</span>}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
          {issue.reporter && <span>แจ้ง: {issue.reporter}</span>}
          {issue.responsible && <span>ดูแล: {issue.responsible}</span>}
        </div>
        {issue.notes && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-1 italic">{issue.notes}</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
      {/* Mobile card view */}
      <div className="lg:hidden">
        {paginatedIssues.length === 0 ? (
          <div className="px-4 py-16 text-center text-gray-400 text-base">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ไม่พบข้อมูล
          </div>
        ) : (
          <div className="p-3 space-y-2.5">
            {paginatedIssues.map((issue, idx) => renderMobileCard(issue, idx))}
          </div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            {orderedColumns.map(col => (
              <col key={col.key} style={{ width: columnWidths[col.key] || col.defaultWidth }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
              {orderedColumns.map((col, i) => (
                <th
                  key={col.key}
                  draggable
                  onDragStart={e => handleDragStart(e, i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={e => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleHeaderClick(col.key)}
                  className={`relative px-2 py-2.5 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:bg-indigo-50/50 transition-colors select-none uppercase tracking-wide ${
                    dragOverIndex === i && dragIndex !== i ? 'bg-indigo-50 border-l-2 border-indigo-400' : ''
                  }`}
                  style={{ width: columnWidths[col.key] || col.defaultWidth }}
                >
                  <div className="flex items-center gap-0.5">
                    <span className="truncate">{col.label}</span>
                    {getSortIcon(col.key)}
                  </div>
                  <div
                    onMouseDown={e => handleResizeStart(e, col.key)}
                    className="absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize hover:bg-indigo-400/40 active:bg-indigo-500/50 z-10"
                    onClick={e => e.stopPropagation()}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedIssues.length === 0 ? (
              <tr>
                <td colSpan={orderedColumns.length} className="px-2 py-16 text-center text-gray-400 text-base">
                  <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              paginatedIssues.map((issue, idx) => {
                const rowBg = ROW_STATUS_BG[issue.status] || '';
                return (
                <tr
                  key={`${issue.no}-${idx}`}
                  onClick={() => onRowClick(issue)}
                  className={`hover:bg-indigo-50/60 cursor-pointer transition-colors duration-150 group ${rowBg || 'even:bg-slate-50/40'}`}
                >
                  {orderedColumns.map(col => (
                    <td
                      key={col.key}
                      className={`px-1.5 py-1.5${col.key === 'no' ? ' text-center' : ''}`}
                    >
                      {renderCell(issue, col.key)}
                    </td>
                  ))}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-slate-50/50 gap-2">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500 font-medium">
              <span className="text-gray-800">{startIndex + 1}-{Math.min(startIndex + pageSize, issues.length)}</span> จาก {issues.length}
            </p>
            <button
              onClick={handleResetColumns}
              className="hidden lg:inline-block text-xs text-gray-400 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
              title="รีเซ็ตคอลัมน์กลับค่าเริ่มต้น"
            >
              รีเซ็ตคอลัมน์
            </button>
          </div>
          <div className="flex gap-1 flex-wrap justify-center">
            <button
              onClick={() => onPageChange(currentPage - 1)}
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
                      onClick={() => onPageChange(page)}
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
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-gray-600 transition-colors"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
