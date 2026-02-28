import { STATUS_OPTIONS, CATEGORY_OPTIONS } from '../types';

interface FilterBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (dept: string) => void;
  departments: string[];
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  onAddClick: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function FilterBar({
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  departments,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onAddClick,
  onRefresh,
  loading,
}: FilterBarProps) {
  const selectClass = "px-2.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none bg-white hover:border-gray-300 transition-colors";
  const dateClass = "px-2 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none bg-white hover:border-gray-300 transition-colors";

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="w-full lg:flex-1 lg:min-w-[200px] lg:w-auto">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="ค้นหา รายละเอียด, หมายเหตุ, ผู้แจ้ง, ผู้ดูแล..."
              value={searchText}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none hover:border-gray-300 transition-colors placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-7 w-px bg-gray-200 hidden lg:block"></div>

        {/* Filter Selects */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select value={statusFilter} onChange={e => onStatusFilterChange(e.target.value)} className={`${selectClass} flex-1 sm:flex-none min-w-0`}>
            <option value="">สถานะทั้งหมด</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={e => onCategoryFilterChange(e.target.value)} className={`${selectClass} flex-1 sm:flex-none min-w-0`}>
            <option value="">ประเภททั้งหมด</option>
            {CATEGORY_OPTIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={departmentFilter} onChange={e => onDepartmentFilterChange(e.target.value)} className={`${selectClass} flex-1 sm:flex-none min-w-0`}>
            <option value="">แผนกทั้งหมด</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="h-7 w-px bg-gray-200 hidden lg:block"></div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input type="date" value={dateFrom} onChange={e => onDateFromChange(e.target.value)} className={`${dateClass} flex-1 min-w-0`} />
          <span className="text-gray-300 text-sm font-medium">-</span>
          <input type="date" value={dateTo} onChange={e => onDateToChange(e.target.value)} className={`${dateClass} flex-1 min-w-0`} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm hover:bg-gray-100 border border-gray-200 hover:border-gray-300 disabled:opacity-50 flex items-center justify-center gap-1.5 font-medium transition-colors"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            รีเฟรช
          </button>
          <button
            onClick={onAddClick}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm hover:from-indigo-700 hover:to-blue-700 flex items-center justify-center gap-1.5 font-semibold shadow-sm shadow-indigo-500/25 hover:shadow-md hover:shadow-indigo-500/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่ม
          </button>
        </div>
      </div>
    </div>
  );
}
