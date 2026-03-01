import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Issue, SortConfig, AppSettings, GenericSheetData } from '../types';
import { SHEET_TYPE_CONFIG } from '../types';
import { fetchIssues, fetchGenericSheet, updateIssue, addIssue, getSettings, saveSettings, syncSettingsFromSupabase, getActiveHospital, getActiveSheet } from '../services/googleSheets';
import { isSupabaseConfigured } from '../services/supabase';
import { isAdmin } from '../services/auth';
import type { UserSession } from '../services/auth';
import { parseThaiDate } from '../utils/csvParser';
import SummaryCards from './SummaryCards';
import FilterBar from './FilterBar';
import DataTable from './DataTable';
import GenericDataTable from './GenericDataTable';
import EditModal from './EditModal';
import AddModal from './AddModal';
import SettingsModal from './SettingsModal';
import Sidebar from './Sidebar';

interface DashboardProps {
  user?: UserSession;
  onLogout?: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const canAdmin = isAdmin(user ?? null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [genericData, setGenericData] = useState<GenericSheetData>({ headers: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sort
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Supabase connection
  const [supabaseConnected, setSupabaseConnected] = useState(isSupabaseConfigured());

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const activeHospital = useMemo(() => getActiveHospital(settings), [settings]);
  const activeSheet = useMemo(() => getActiveSheet(settings), [settings]);
  const sheetType = activeSheet?.sheetType || 'issue';
  const isGenericSheet = sheetType !== 'issue';

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentSettings = getSettings();
      const sheet = getActiveSheet(currentSettings);
      const isGeneric = (sheet?.sheetType || 'issue') !== 'issue';
      if (isGeneric) {
        // ใช้ headerRow จาก SHEET_TYPE_CONFIG (override ค่าจาก sheet settings)
        const typeConfig = SHEET_TYPE_CONFIG[sheet!.sheetType as keyof typeof SHEET_TYPE_CONFIG];
        const sheetOverride = typeConfig?.headerRow !== undefined
          ? { ...sheet!, headerRow: typeConfig.headerRow }
          : sheet;
        const data = await fetchGenericSheet(sheetOverride);
        setGenericData(data);
        setIssues([]);
        setLastUpdated(new Date());
      } else {
        const data = await fetchIssues(sheet);
        setIssues(data);
        setGenericData({ headers: [], rows: [] });
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when active sheet changes
  const activeSheetId = settings.activeSheetId;
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSheetId]);

  // Sync settings from Supabase on mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      syncSettingsFromSupabase().then(remoteSettings => {
        setSettings(remoteSettings);
        setSupabaseConnected(true);
      });
    }
  }, []);

  // กรองเฉพาะรายการที่มีรายละเอียดปัญหา (ไม่นับแถวว่าง)
  const validIssues = useMemo(() => issues.filter(i => i.description.trim() !== ''), [issues]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(validIssues.map(i => i.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [validIssues]);

  // Filter and sort
  const filteredIssues = useMemo(() => {
    let result = validIssues;

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(i =>
        i.no.toLowerCase().includes(search) ||
        i.department.toLowerCase().includes(search) ||
        i.description.toLowerCase().includes(search) ||
        i.notes.toLowerCase().includes(search) ||
        i.reporter.toLowerCase().includes(search) ||
        i.responsible.toLowerCase().includes(search)
      );
    }

    if (statusFilter) {
      result = result.filter(i => i.status === statusFilter);
    }

    if (categoryFilter) {
      result = result.filter(i => i.category === categoryFilter);
    }

    if (departmentFilter) {
      result = result.filter(i => i.department === departmentFilter);
    }

    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      // Set to end of day for "to" comparison
      if (to) to.setHours(23, 59, 59, 999);
      result = result.filter(i => {
        const d = parseThaiDate(i.date);
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    if (sortConfig.key && sortConfig.direction) {
      const { key, direction } = sortConfig;
      result = [...result].sort((a, b) => {
        const aVal = a[key] || '';
        const bVal = b[key] || '';
        if (key === 'no') {
          const aNum = parseInt(String(aVal)) || 0;
          const bNum = parseInt(String(bVal)) || 0;
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        const comparison = String(aVal).localeCompare(String(bVal), 'th');
        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [validIssues, searchText, statusFilter, categoryFilter, departmentFilter, dateFrom, dateTo, sortConfig]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, categoryFilter, departmentFilter, dateFrom, dateTo]);

  const handleSort = (key: keyof Issue) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleEditSave = async (issue: Issue) => {
    setSaving(true);
    try {
      await updateIssue(issue);
      setIssues(prev => prev.map(i => (i.rowIndex === issue.rowIndex ? issue : i)));
      setEditingIssue(null);
      showToast('บันทึกสำเร็จ', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSave = async (issue: Omit<Issue, 'rowIndex'>) => {
    setSaving(true);
    try {
      await addIssue(issue);
      setShowAddModal(false);
      showToast('เพิ่มรายการสำเร็จ', 'success');
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSave = (newSettings: AppSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
    setSupabaseConnected(isSupabaseConfigured());
  };

  const handleHospitalChange = (hospitalId: string) => {
    const hospital = settings.hospitals.find(h => h.id === hospitalId);
    const firstSheet = hospital?.sheets[0];
    const updated = {
      ...settings,
      activeHospitalId: hospitalId,
      activeSheetId: firstSheet?.id || '',
    };
    saveSettings(updated);
    setSettings(updated);
  };

  const handleSheetChange = (sheetId: string) => {
    const updated = { ...settings, activeSheetId: sheetId };
    saveSettings(updated);
    setSettings(updated);
  };

  const nextNo = useMemo(() => {
    const maxNo = issues.reduce((max, i) => {
      const num = parseInt(i.no) || 0;
      return num > max ? num : max;
    }, 0);
    return maxNo + 1;
  }, [issues]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <div className="sticky top-0 h-screen">
          <Sidebar
            hospitals={settings.hospitals}
            activeHospitalId={settings.activeHospitalId}
            activeSheetId={settings.activeSheetId}
            onHospitalChange={handleHospitalChange}
            onSheetChange={handleSheetChange}
          />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full w-52" style={{ animation: 'slideRight 0.2s ease-out' }}>
            <Sidebar
              hospitals={settings.hospitals}
              activeHospitalId={settings.activeHospitalId}
              activeSheetId={settings.activeSheetId}
              onHospitalChange={handleHospitalChange}
              onSheetChange={(id) => { handleSheetChange(id); setSidebarOpen(false); }}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 shadow-lg shadow-indigo-500/20">
        <div className="max-w-full mx-auto px-4 py-3">
          {/* Top row: Logo + Desktop controls + Hamburger */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base lg:text-lg font-bold text-white leading-tight tracking-tight">IM Report</h1>
                <p className="text-xs text-blue-100 leading-tight hidden sm:block">ระบบติดตามการแจ้งปัญหาทีม IM</p>
              </div>
            </div>

            {/* Desktop controls - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-2">
              {settings.hospitals.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={settings.activeHospitalId}
                    onChange={e => handleHospitalChange(e.target.value)}
                    className="pl-2 pr-6 py-1.5 border border-white/30 rounded-lg text-sm outline-none bg-white/15 backdrop-blur-sm text-white font-medium max-w-[220px] [&>option]:text-gray-900 [&>option]:bg-white"
                  >
                    <option value="">-- เลือก รพ. --</option>
                    {settings.hospitals.map(h => (
                      <option key={h.id} value={h.id}>
                        [{h.code}] {h.name}
                      </option>
                    ))}
                  </select>

                  {activeHospital && activeHospital.sheets.length > 0 && (
                    <select
                      value={settings.activeSheetId}
                      onChange={e => handleSheetChange(e.target.value)}
                      className="pl-2 pr-6 py-1.5 border border-white/30 rounded-lg text-sm outline-none bg-white/15 backdrop-blur-sm text-white max-w-[200px] [&>option]:text-gray-900 [&>option]:bg-white"
                    >
                      {activeHospital.sheets.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {supabaseConnected && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-white/15 backdrop-blur-sm text-white rounded-lg font-medium border border-white/20" title="เชื่อมต่อ Supabase แล้ว">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Cloud
                </span>
              )}

              {canAdmin && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                  title="ตั้งค่า"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}

              {user && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-white/15 backdrop-blur-sm text-white rounded-lg font-medium border border-white/20">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {user.displayName}
                    {canAdmin && (
                      <span className="text-[10px] px-1 py-0.5 bg-amber-400/30 text-amber-200 rounded font-semibold">Admin</span>
                    )}
                  </span>
                  <button
                    onClick={onLogout}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                    title="ออกจากระบบ"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger - mobile only (opens sidebar) */}
            <button
              onClick={() => setSidebarOpen(prev => !prev)}
              className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
              aria-label="เมนู"
            >
              {sidebarOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile dropdown panel */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-3 pt-3 border-t border-white/20 space-y-3" style={{ animation: 'slideDown 0.2s ease-out' }}>
              {settings.hospitals.length > 0 && (
                <div className="space-y-2">
                  <select
                    value={settings.activeHospitalId}
                    onChange={e => handleHospitalChange(e.target.value)}
                    className="w-full pl-3 pr-6 py-2.5 border border-white/30 rounded-lg text-sm outline-none bg-white/15 backdrop-blur-sm text-white font-medium [&>option]:text-gray-900 [&>option]:bg-white"
                  >
                    <option value="">-- เลือก รพ. --</option>
                    {settings.hospitals.map(h => (
                      <option key={h.id} value={h.id}>[{h.code}] {h.name}</option>
                    ))}
                  </select>
                  {activeHospital && activeHospital.sheets.length > 0 && (
                    <select
                      value={settings.activeSheetId}
                      onChange={e => handleSheetChange(e.target.value)}
                      className="w-full pl-3 pr-6 py-2.5 border border-white/30 rounded-lg text-sm outline-none bg-white/15 backdrop-blur-sm text-white [&>option]:text-gray-900 [&>option]:bg-white"
                    >
                      {activeHospital.sheets.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {supabaseConnected && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-white/15 backdrop-blur-sm text-white rounded-lg font-medium border border-white/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Cloud
                    </span>
                  )}
                  {canAdmin && (
                    <button
                      onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
                      className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                      title="ตั้งค่า"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                </div>
                {user && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-white/15 backdrop-blur-sm text-white rounded-lg font-medium border border-white/20">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {user.displayName}
                      {canAdmin && (
                        <span className="text-[10px] px-1 py-0.5 bg-amber-400/30 text-amber-200 rounded font-semibold">Admin</span>
                      )}
                    </span>
                    <button
                      onClick={onLogout}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                      title="ออกจากระบบ"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4" style={{ animation: 'fadeIn 0.4s ease-out' }}>
        {/* Error Banner */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/60 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
            <div className="bg-red-100 rounded-lg p-1.5">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button
              onClick={loadData}
              className="ml-auto text-sm text-red-600 hover:text-red-800 font-semibold px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {/* No Sheet Warning */}
        {!activeSheet && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="bg-amber-100 rounded-lg p-1.5">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm text-amber-700">
              ยังไม่ได้เลือก Sheet
              {canAdmin && <>{' '}- <button onClick={() => setShowSettings(true)} className="text-amber-800 font-semibold underline hover:no-underline">ตั้งค่า</button></>}
            </p>
          </div>
        )}

        {/* Apps Script Warning */}
        {activeSheet && !activeSheet.appsScriptUrl && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="bg-amber-100 rounded-lg p-1.5">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm text-amber-700">
              "{activeSheet.name}" อยู่ในโหมดอ่านอย่างเดียว
              {canAdmin && <>{' '}<button onClick={() => setShowSettings(true)} className="text-amber-800 font-semibold underline hover:no-underline">ตั้งค่า Apps Script</button></>}
            </p>
          </div>
        )}

        {/* Active Info Badge */}
        {activeHospital && activeSheet && (
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              [{activeHospital.code}] {activeHospital.name}
            </span>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 font-medium border border-slate-100">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {activeSheet.name}
            </span>
            {activeSheet.appsScriptUrl ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                อ่าน/เขียน
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full font-medium border border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                อ่านอย่างเดียว
              </span>
            )}
          </div>
        )}

        {isGenericSheet ? (
          /* Generic Sheet View */
          <>
            {/* Refresh button + last updated */}
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white/80 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                รีเฟรช
              </button>
              {lastUpdated && (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  อัปเดตล่าสุด: {lastUpdated.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
            <GenericDataTable
              data={genericData}
              loading={loading && genericData.rows.length === 0}
              columns={SHEET_TYPE_CONFIG[sheetType]?.columns}
              statusField={SHEET_TYPE_CONFIG[sheetType]?.statusField}
              requiredField={SHEET_TYPE_CONFIG[sheetType]?.requiredField}
            />
          </>
        ) : (
          /* Issue Sheet View */
          <>
            {/* Summary Cards */}
            <SummaryCards issues={validIssues} activeStatus={statusFilter} onStatusClick={setStatusFilter} />

            {/* Last updated */}
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                อัปเดตล่าสุด: {lastUpdated.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            )}

            {/* Filter Bar */}
            <FilterBar
              searchText={searchText}
              onSearchChange={setSearchText}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              departmentFilter={departmentFilter}
              onDepartmentFilterChange={setDepartmentFilter}
              departments={departments}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
              onAddClick={() => setShowAddModal(true)}
              onRefresh={loadData}
              loading={loading}
            />

            {/* Loading State */}
            {loading && issues.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-16 text-center">
                <div className="relative mx-auto w-12 h-12 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
                </div>
                <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
              </div>
            ) : (
              <DataTable
                issues={filteredIssues}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={setEditingIssue}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </main>
      </div>{/* End Main Column */}

      {/* Modals */}
      {editingIssue && (
        <EditModal
          issue={editingIssue}
          onClose={() => setEditingIssue(null)}
          onSave={handleEditSave}
          saving={saving}
        />
      )}

      {showAddModal && (
        <AddModal
          nextNo={nextNo}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSave}
          saving={saving}
        />
      )}

      {showSettings && canAdmin && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSave}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div className={`rounded-xl shadow-2xl px-5 py-3.5 flex items-center gap-3 backdrop-blur-sm ${
            toast.type === 'success'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25'
              : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/25'
          }`}>
            <div className="bg-white/20 rounded-full p-1">
              {toast.type === 'success' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
