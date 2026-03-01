import type { Hospital, SheetType } from '../types';

const SHEET_TYPE_ICONS: Record<SheetType, { icon: string; color: string; label: string }> = {
  issue: { icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-amber-500', label: 'ปัญหา' },
  form: { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-blue-500', label: 'แบบฟอร์ม' },
  report: { icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-emerald-500', label: 'รายงาน' },
  assessment: { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'text-purple-500', label: 'Assessment' },
};

interface SidebarProps {
  hospitals: Hospital[];
  activeHospitalId: string;
  activeSheetId: string;
  onHospitalChange: (id: string) => void;
  onSheetChange: (id: string) => void;
  onClose?: () => void;
}

export default function Sidebar({
  hospitals,
  activeHospitalId,
  activeSheetId,
  onHospitalChange,
  onSheetChange,
  onClose,
}: SidebarProps) {
  const activeHospital = hospitals.find(h => h.id === activeHospitalId);

  const handleSheetClick = (sheetId: string) => {
    onSheetChange(sheetId);
    onClose?.();
  };

  return (
    <aside className="flex flex-col h-full bg-white border-r border-gray-200 w-52">
      {/* Hospital selector */}
      <div className="p-3 border-b border-gray-100">
        <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">โรงพยาบาล</label>
        <select
          value={activeHospitalId}
          onChange={e => onHospitalChange(e.target.value)}
          className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white font-medium text-gray-700 truncate"
        >
          <option value="">-- เลือก รพ. --</option>
          {hospitals.map(h => (
            <option key={h.id} value={h.id}>
              [{h.code}] {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sheet list */}
      <div className="flex-1 overflow-y-auto py-2">
        <p className="px-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">รายการ Sheet</p>
        {activeHospital && activeHospital.sheets.length > 0 ? (
          <nav className="space-y-0.5 px-2">
            {activeHospital.sheets.map(sheet => {
              const isActive = sheet.id === activeSheetId;
              const hasScript = !!sheet.appsScriptUrl;
              const typeInfo = SHEET_TYPE_ICONS[sheet.sheetType || 'issue'];
              return (
                <button
                  key={sheet.id}
                  onClick={() => handleSheetClick(sheet.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group flex items-start gap-2.5 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-l-[3px] border-indigo-500 font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-[3px] border-transparent'
                  }`}
                >
                  {/* Sheet type icon */}
                  <svg className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? typeInfo.color : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeInfo.icon} />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="truncate leading-tight">{sheet.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] ${isActive ? typeInfo.color : 'text-gray-400'}`}>
                        {typeInfo.label}
                      </span>
                      <span className={`text-[10px] ${isActive ? 'text-indigo-400' : 'text-gray-300'}`}>|</span>
                      <span className={`text-[10px] ${isActive ? 'text-indigo-500' : 'text-gray-400'}`}>
                        {hasScript ? 'อ่าน/เขียน' : 'อ่านอย่างเดียว'}
                      </span>
                    </div>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                  )}
                </button>
              );
            })}
          </nav>
        ) : (
          <p className="px-3 text-xs text-gray-400 italic">ไม่มี Sheet</p>
        )}
      </div>
    </aside>
  );
}
