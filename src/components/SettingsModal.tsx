import { useState, useEffect } from 'react';
import type { AppSettings, Hospital, SheetLink, SheetType } from '../types';
import { generateId, SHEET_TYPE_OPTIONS } from '../types';
import { extractSheetInfo } from '../utils/csvParser';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, testSupabaseConnection, saveSettingsToSupabase, loadSettingsFromSupabase } from '../services/supabase';
import type { ConnectionResult } from '../services/supabase';
import { listUsers, addUser, updateUser, deleteUser } from '../services/auth';
import type { UserInfo } from '../services/auth';

type TabId = 'supabase' | 'users' | 'sheets';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

export default function SettingsModal({ settings, onClose, onSave }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('sheets');
  const [form, setForm] = useState<AppSettings>(JSON.parse(JSON.stringify(settings)));
  const [expandedHospital, setExpandedHospital] = useState<string | null>(
    form.hospitals.length > 0 ? form.hospitals[0].id : null
  );

  // Add hospital form
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [newHospCode, setNewHospCode] = useState('');
  const [newHospName, setNewHospName] = useState('');

  // Add sheet form
  const [addingSheetFor, setAddingSheetFor] = useState<string | null>(null);
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetUrl, setNewSheetUrl] = useState('');
  const [newSheetScript, setNewSheetScript] = useState('');
  const [newSheetType, setNewSheetType] = useState<SheetType>('issue');
  const [newSheetHeaderRow, setNewSheetHeaderRow] = useState('1');
  const [sheetUrlError, setSheetUrlError] = useState('');

  // Edit sheet
  const [editingSheet, setEditingSheet] = useState<{ hospitalId: string; sheet: SheetLink } | null>(null);
  const [editSheetName, setEditSheetName] = useState('');
  const [editSheetUrl, setEditSheetUrl] = useState('');
  const [editSheetScript, setEditSheetScript] = useState('');
  const [editSheetType, setEditSheetType] = useState<SheetType>('issue');
  const [editSheetHeaderRow, setEditSheetHeaderRow] = useState('1');
  const [editUrlError, setEditUrlError] = useState('');
  const [newScriptUrlError, setNewScriptUrlError] = useState('');
  const [editScriptError, setEditScriptError] = useState('');

  // Supabase config
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'none' | 'connected' | 'need_table' | 'error'>('none');
  const [supabaseUploading, setSupabaseUploading] = useState(false);
  const [supabaseDownloading, setSupabaseDownloading] = useState(false);
  const [supabaseMessage, setSupabaseMessage] = useState('');

  // User management
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editPassword, setEditPassword] = useState('');
  const [editUserLoading, setEditUserLoading] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    if (config) {
      setSupabaseUrl(config.url);
      setSupabaseKey(config.anonKey);
      setSupabaseStatus('connected');
      loadUsers();
    }
  }, []);

  const loadUsers = async () => {
    setUsersLoading(true);
    const result = await listUsers();
    setUsers(result);
    setUsersLoading(false);
  };

  const handleAddUser = async () => {
    if (!newUsername.trim() || !newPassword.trim() || !newDisplayName.trim()) return;
    setAddUserLoading(true);
    setUserMessage('');
    const result = await addUser(newUsername.trim(), newPassword, newDisplayName.trim(), newRole);
    if (result) {
      setUserMessage('เพิ่มผู้ใช้สำเร็จ');
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('user');
      setShowAddUser(false);
      await loadUsers();
    } else {
      setUserMessage('เพิ่มผู้ใช้ไม่สำเร็จ (อาจมี username ซ้ำ)');
    }
    setAddUserLoading(false);
  };

  const handleEditUser = async () => {
    if (!editingUser || !editDisplayName.trim()) return;
    setEditUserLoading(true);
    setUserMessage('');
    const ok = await updateUser(editingUser.id, editDisplayName.trim(), editRole, editPassword || undefined);
    if (ok) {
      setUserMessage('แก้ไขผู้ใช้สำเร็จ');
      setEditingUser(null);
      setEditPassword('');
      await loadUsers();
    } else {
      setUserMessage('แก้ไขผู้ใช้ไม่สำเร็จ');
    }
    setEditUserLoading(false);
  };

  const handleDeleteUser = async (user: UserInfo) => {
    if (!confirm(`ลบผู้ใช้ "${user.display_name}" (${user.username})?`)) return;
    setUserMessage('');
    const ok = await deleteUser(user.id);
    if (ok) {
      setUserMessage('ลบผู้ใช้สำเร็จ');
      await loadUsers();
    } else {
      setUserMessage('ลบผู้ใช้ไม่สำเร็จ');
    }
  };

  const startEditUser = (user: UserInfo) => {
    setEditingUser(user);
    setEditDisplayName(user.display_name);
    setEditRole(user.role as 'admin' | 'user');
    setEditPassword('');
    setUserMessage('');
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) return;
    setSupabaseTesting(true);
    setSupabaseMessage('');
    const result: ConnectionResult = await testSupabaseConnection({ url: supabaseUrl.trim(), anonKey: supabaseKey.trim() });
    if (result.ok) {
      saveSupabaseConfig({ url: supabaseUrl.trim(), anonKey: supabaseKey.trim() });
      setSupabaseStatus(result.tableExists ? 'connected' : 'need_table');
      if (result.tableExists) loadUsers();
    } else {
      setSupabaseStatus('error');
    }
    setSupabaseMessage(result.message);
    setSupabaseTesting(false);
  };

  const handleUploadToSupabase = async () => {
    const config = getSupabaseConfig();
    if (!config) return;
    setSupabaseUploading(true);
    setSupabaseMessage('');
    const ok = await saveSettingsToSupabase(config, form);
    setSupabaseMessage(ok ? 'อัปโหลดการตั้งค่าสำเร็จ' : 'อัปโหลดล้มเหลว');
    setSupabaseUploading(false);
  };

  const handleDownloadFromSupabase = async () => {
    const config = getSupabaseConfig();
    if (!config) return;
    setSupabaseDownloading(true);
    setSupabaseMessage('');
    const remote = await loadSettingsFromSupabase(config);
    if (remote) {
      setForm(remote);
      setSupabaseMessage('ดึงข้อมูลจาก Cloud สำเร็จ');
    } else {
      setSupabaseMessage('ไม่พบข้อมูลบน Cloud หรือเกิดข้อผิดพลาด');
    }
    setSupabaseDownloading(false);
  };

  const handleDisconnectSupabase = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseKey('');
    setSupabaseStatus('none');
    setSupabaseMessage('');
  };

  const validateAppsScriptUrl = (url: string): string => {
    if (!url.trim()) return '';
    if (url.includes('docs.google.com/spreadsheets')) {
      return 'นี่คือ URL ของ Google Sheet ไม่ใช่ Apps Script URL (ต้องเป็น https://script.google.com/macros/s/.../exec)';
    }
    if (!url.includes('script.google.com/macros/s/')) {
      return 'URL ไม่ถูกต้อง ต้องเป็น https://script.google.com/macros/s/.../exec';
    }
    return '';
  };

  const handleAddHospital = () => {
    if (!newHospCode.trim() || !newHospName.trim()) return;
    const hosp: Hospital = {
      id: generateId(),
      code: newHospCode.trim(),
      name: newHospName.trim(),
      sheets: [],
    };
    setForm(prev => ({ ...prev, hospitals: [...prev.hospitals, hosp] }));
    setExpandedHospital(hosp.id);
    setNewHospCode('');
    setNewHospName('');
    setShowAddHospital(false);
  };

  const handleRemoveHospital = (id: string) => {
    setForm(prev => ({
      ...prev,
      hospitals: prev.hospitals.filter(h => h.id !== id),
      activeHospitalId: prev.activeHospitalId === id ? '' : prev.activeHospitalId,
      activeSheetId: prev.hospitals.find(h => h.id === id)?.sheets.some(s => s.id === prev.activeSheetId)
        ? ''
        : prev.activeSheetId,
    }));
  };

  const handleEditHospital = (id: string, field: 'code' | 'name', value: string) => {
    setForm(prev => ({
      ...prev,
      hospitals: prev.hospitals.map(h => h.id === id ? { ...h, [field]: value } : h),
    }));
  };

  const validateSheetUrl = (url: string): boolean => {
    if (!url) {
      setSheetUrlError('');
      return false;
    }
    const info = extractSheetInfo(url);
    if (!info) {
      setSheetUrlError('URL ไม่ถูกต้อง กรุณาใส่ลิงก์ Google Sheets');
      return false;
    }
    setSheetUrlError('');
    return true;
  };

  const handleAddSheet = (hospitalId: string) => {
    if (!newSheetName.trim() || !newSheetUrl.trim()) return;
    const info = extractSheetInfo(newSheetUrl);
    if (!info) return;

    const headerRowNum = parseInt(newSheetHeaderRow, 10);
    const sheet: SheetLink = {
      id: generateId(),
      name: newSheetName.trim(),
      sheetUrl: newSheetUrl.trim(),
      sheetId: info.sheetId,
      gid: info.gid,
      appsScriptUrl: newSheetScript.trim(),
      sheetType: newSheetType,
      headerRow: headerRowNum > 1 ? headerRowNum : undefined,
    };

    setForm(prev => ({
      ...prev,
      hospitals: prev.hospitals.map(h =>
        h.id === hospitalId ? { ...h, sheets: [...h.sheets, sheet] } : h
      ),
    }));
    setAddingSheetFor(null);
    setNewSheetName('');
    setNewSheetUrl('');
    setNewSheetScript('');
    setNewSheetType('issue');
    setNewSheetHeaderRow('1');
    setSheetUrlError('');
    setNewScriptUrlError('');
  };

  const handleRemoveSheet = (hospitalId: string, sheetId: string) => {
    setForm(prev => ({
      ...prev,
      hospitals: prev.hospitals.map(h =>
        h.id === hospitalId ? { ...h, sheets: h.sheets.filter(s => s.id !== sheetId) } : h
      ),
      activeSheetId: prev.activeSheetId === sheetId ? '' : prev.activeSheetId,
    }));
  };

  const startEditSheet = (hospitalId: string, sheet: SheetLink) => {
    setEditingSheet({ hospitalId, sheet });
    setEditSheetName(sheet.name);
    setEditSheetUrl(sheet.sheetUrl);
    setEditSheetScript(sheet.appsScriptUrl);
    setEditSheetType(sheet.sheetType || 'issue');
    setEditSheetHeaderRow(String(sheet.headerRow || 1));
    setEditUrlError('');
    setEditScriptError('');
  };

  const handleSaveEditSheet = () => {
    if (!editingSheet || !editSheetName.trim() || !editSheetUrl.trim() || !!editScriptError) return;
    const info = extractSheetInfo(editSheetUrl);
    if (!info) {
      setEditUrlError('URL ไม่ถูกต้อง');
      return;
    }
    const headerRowNum = parseInt(editSheetHeaderRow, 10);

    setForm(prev => ({
      ...prev,
      hospitals: prev.hospitals.map(h =>
        h.id === editingSheet.hospitalId
          ? {
              ...h,
              sheets: h.sheets.map(s =>
                s.id === editingSheet.sheet.id
                  ? {
                      ...s,
                      name: editSheetName.trim(),
                      sheetUrl: editSheetUrl.trim(),
                      sheetId: info.sheetId,
                      gid: info.gid,
                      appsScriptUrl: editSheetScript.trim(),
                      sheetType: editSheetType,
                      headerRow: headerRowNum > 1 ? headerRowNum : undefined,
                    }
                  : s
              ),
            }
          : h
      ),
    }));
    setEditingSheet(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);

    // อัปโหลดไป Supabase อัตโนมัติถ้าเชื่อมต่ออยู่
    const config = getSupabaseConfig();
    if (config) {
      await saveSettingsToSupabase(config, form);
    }

    onClose();
  };

  // --- Tab definitions ---
  const tabs: { id: TabId; label: string; icon: React.ReactNode; show: boolean; badge?: string }[] = [
    {
      id: 'supabase',
      label: 'Cloud Sync',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      show: true,
      badge: supabaseStatus === 'connected' ? undefined : supabaseStatus === 'none' ? undefined : '!',
    },
    {
      id: 'users',
      label: 'ผู้ใช้งาน',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      show: supabaseStatus === 'connected',
      badge: users.length > 0 ? String(users.length) : undefined,
    },
    {
      id: 'sheets',
      label: 'Google Sheet',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      show: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] border-0 sm:border flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header + Tabs */}
        <div className="shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2">
            <h2 className="text-lg font-semibold text-gray-900">ตั้งค่าระบบ</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 px-4 sm:px-6 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
            {tabs.filter(t => t.show).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    tab.badge === '!'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

          {/* ===== TAB: Supabase Cloud Sync ===== */}
          {activeTab === 'supabase' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-800">Supabase Cloud Sync</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {supabaseStatus === 'connected' && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      พร้อมใช้งาน
                    </span>
                  )}
                  {supabaseStatus === 'need_table' && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      ต้องสร้างตาราง
                    </span>
                  )}
                  {supabaseStatus === 'error' && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      เชื่อมต่อไม่สำเร็จ
                    </span>
                  )}
                  {supabaseStatus === 'none' && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                      ยังไม่ได้ตั้งค่า
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Supabase URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={e => setSupabaseUrl(e.target.value)}
                    placeholder="https://xxxxx.supabase.co"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Anon Key</label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={e => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                  />
                </div>

                {supabaseMessage && (
                  <p className={`text-xs font-medium px-3 py-2 rounded-lg ${
                    supabaseMessage.includes('สำเร็จ') || supabaseMessage.includes('พร้อม')
                      ? 'bg-emerald-50 text-emerald-700'
                      : supabaseMessage.includes('ยังไม่พบตาราง')
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-600'
                  }`}>
                    {supabaseMessage}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={supabaseTesting || !supabaseUrl.trim() || !supabaseKey.trim()}
                    className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium transition-colors"
                  >
                    {supabaseTesting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                    ทดสอบการเชื่อมต่อ
                  </button>

                  {supabaseStatus === 'connected' && (
                    <>
                      <button
                        onClick={handleUploadToSupabase}
                        disabled={supabaseUploading}
                        className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 font-medium transition-colors"
                      >
                        {supabaseUploading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        อัปโหลดไป Cloud
                      </button>
                      <button
                        onClick={handleDownloadFromSupabase}
                        disabled={supabaseDownloading}
                        className="px-3 py-1.5 text-xs bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-1.5 font-medium transition-colors"
                      >
                        {supabaseDownloading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        ดึงจาก Cloud
                      </button>
                      <button
                        onClick={handleDisconnectSupabase}
                        className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 font-medium transition-colors"
                      >
                        ยกเลิกการเชื่อมต่อ
                      </button>
                    </>
                  )}

                  {(supabaseStatus === 'need_table' || supabaseStatus === 'error') && (
                    <button
                      onClick={handleDisconnectSupabase}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 font-medium transition-colors"
                    >
                      ยกเลิกการเชื่อมต่อ
                    </button>
                  )}
                </div>

                {/* SQL to create table */}
                {supabaseStatus === 'need_table' && (
                  <div className="bg-gray-900 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-amber-400">คัดลอก SQL นี้ไปรันใน Supabase SQL Editor:</p>
                      <button
                        onClick={() => {
                          const sql = `CREATE TABLE app_settings (\n  id TEXT PRIMARY KEY DEFAULT 'default',\n  settings JSONB NOT NULL,\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "Allow anonymous read" ON app_settings FOR SELECT USING (true);\nCREATE POLICY "Allow anonymous insert" ON app_settings FOR INSERT WITH CHECK (true);\nCREATE POLICY "Allow anonymous update" ON app_settings FOR UPDATE USING (true) WITH CHECK (true);`;
                          navigator.clipboard.writeText(sql);
                          setSupabaseMessage('คัดลอก SQL สำเร็จ ไปวางใน Supabase SQL Editor แล้วกด Run');
                        }}
                        className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 font-medium transition-colors"
                      >
                        คัดลอก SQL
                      </button>
                    </div>
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre leading-relaxed">{`CREATE TABLE app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read"
  ON app_settings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert"
  ON app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update"
  ON app_settings FOR UPDATE
  USING (true) WITH CHECK (true);`}</pre>
                    <p className="text-xs text-gray-400">สร้างตารางเสร็จแล้ว กด "ทดสอบการเชื่อมต่อ" อีกครั้ง</p>
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  เชื่อมต่อ Supabase เพื่อเก็บการตั้งค่าสถานพยาบาลแบบ Online ดึงมาใช้ได้จากทุกที่
                </p>
              </div>
            </>
          )}

          {/* ===== TAB: User Management ===== */}
          {activeTab === 'users' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-800">จัดการผู้ใช้งาน</span>
                </div>
                <span className="text-xs text-teal-600 font-medium">{users.length} คน</span>
              </div>

              <div className="space-y-3">
                {userMessage && (
                  <p className={`text-xs font-medium px-3 py-2 rounded-lg ${
                    userMessage.includes('สำเร็จ')
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {userMessage}
                  </p>
                )}

                {/* Users List */}
                {usersLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin"></div>
                    กำลังโหลด...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
                        {editingUser?.id === u.id ? (
                          /* Edit User Inline */
                          <div className="flex-1 space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">ชื่อผู้ใช้</label>
                                <input
                                  type="text"
                                  value={u.username}
                                  disabled
                                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">สิทธิ์</label>
                                <select
                                  value={editRole}
                                  onChange={e => setEditRole(e.target.value as 'admin' | 'user')}
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                  <option value="user">ทั่วไป</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-gray-500 mb-0.5">ชื่อที่แสดง</label>
                              <input
                                type="text"
                                value={editDisplayName}
                                onChange={e => setEditDisplayName(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-gray-500 mb-0.5">รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</label>
                              <input
                                type="password"
                                value={editPassword}
                                onChange={e => setEditPassword(e.target.value)}
                                placeholder="ไม่เปลี่ยนรหัสผ่าน"
                                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleEditUser}
                                disabled={editUserLoading || !editDisplayName.trim()}
                                className="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5 font-medium"
                              >
                                {editUserLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                บันทึก
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Display User */
                          <>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {u.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">{u.display_name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  u.role === 'admin'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {u.role === 'admin' ? 'Admin' : 'User'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">@{u.username}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startEditUser(u)}
                                className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                title="แก้ไข"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="ลบ"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {users.length === 0 && !usersLoading && (
                      <p className="text-sm text-gray-400 text-center py-6">ยังไม่มีผู้ใช้ในระบบ</p>
                    )}
                  </div>
                )}

                {/* Add User Form */}
                {showAddUser ? (
                  <div className="border border-dashed border-teal-300 rounded-xl p-4 bg-teal-50/50 space-y-3">
                    <p className="text-xs font-semibold text-teal-700">เพิ่มผู้ใช้ใหม่</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-0.5">ชื่อผู้ใช้ (username) *</label>
                        <input
                          type="text"
                          value={newUsername}
                          onChange={e => setNewUsername(e.target.value)}
                          placeholder="username"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-0.5">รหัสผ่าน *</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="password"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-0.5">ชื่อที่แสดง *</label>
                        <input
                          type="text"
                          value={newDisplayName}
                          onChange={e => setNewDisplayName(e.target.value)}
                          placeholder="เช่น สมชาย ใจดี"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-0.5">สิทธิ์</label>
                        <select
                          value={newRole}
                          onChange={e => setNewRole(e.target.value as 'admin' | 'user')}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-teal-500"
                        >
                          <option value="user">ทั่วไป</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddUser}
                        disabled={addUserLoading || !newUsername.trim() || !newPassword.trim() || !newDisplayName.trim()}
                        className="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
                      >
                        {addUserLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        เพิ่มผู้ใช้
                      </button>
                      <button
                        onClick={() => { setShowAddUser(false); setNewUsername(''); setNewPassword(''); setNewDisplayName(''); setNewRole('user'); }}
                        className="px-3 py-1.5 text-xs bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowAddUser(true); setUserMessage(''); }}
                    className="w-full py-2.5 border-2 border-dashed border-teal-300 rounded-xl text-xs text-teal-600 hover:border-teal-400 hover:bg-teal-50/50 transition-colors flex items-center justify-center gap-1.5 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    เพิ่มผู้ใช้
                  </button>
                )}

                <p className="text-xs text-gray-400">
                  จัดการผู้ใช้สำหรับ login เข้าใช้งานระบบ (Admin สามารถเข้าถึงการตั้งค่าได้)
                </p>
              </div>
            </>
          )}

          {/* ===== TAB: Google Sheet ===== */}
          {activeTab === 'sheets' && (
            <>
              {/* Hospital List */}
              {form.hospitals.map(hosp => (
                <div key={hosp.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Hospital Header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedHospital(expandedHospital === hosp.id ? null : hosp.id)}
                  >
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${expandedHospital === hosp.id ? 'rotate-90' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-100 text-blue-700">
                          {hosp.code}
                        </span>
                        <span className="font-medium text-gray-900 truncate">{hosp.name}</span>
                        <span className="text-xs text-gray-400">({hosp.sheets.length} sheets)</span>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveHospital(hosp.id); }}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="ลบสถานพยาบาล"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Hospital Body */}
                  {expandedHospital === hosp.id && (
                    <div className="p-4 space-y-3">
                      {/* Edit hospital info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">รหัสสถานพยาบาล</label>
                          <input
                            type="text"
                            value={hosp.code}
                            onChange={e => handleEditHospital(hosp.id, 'code', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">ชื่อสถานพยาบาล</label>
                          <input
                            type="text"
                            value={hosp.name}
                            onChange={e => handleEditHospital(hosp.id, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Sheet List */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Google Sheets</label>
                          <button
                            onClick={() => { setAddingSheetFor(hosp.id); setSheetUrlError(''); }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            เพิ่ม Sheet
                          </button>
                        </div>

                        {hosp.sheets.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-3">ยังไม่มี Sheet - กดเพิ่มด้านบน</p>
                        )}

                        <div className="space-y-2">
                          {hosp.sheets.map(sheet => (
                            <div
                              key={sheet.id}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                                form.activeHospitalId === hosp.id && form.activeSheetId === sheet.id
                                  ? 'border-blue-300 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              {/* Edit Sheet Inline */}
                              {editingSheet?.sheet.id === sheet.id ? (
                                <div className="flex-1 space-y-2">
                                  <input
                                    type="text"
                                    value={editSheetName}
                                    onChange={e => setEditSheetName(e.target.value)}
                                    placeholder="ชื่อ Sheet"
                                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    value={editSheetUrl}
                                    onChange={e => { setEditSheetUrl(e.target.value); setEditUrlError(''); }}
                                    placeholder="Google Sheet URL"
                                    className={`w-full px-2.5 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 ${editUrlError ? 'border-red-300' : 'border-gray-300'}`}
                                  />
                                  {editUrlError && <p className="text-xs text-red-500">{editUrlError}</p>}
                                  <input
                                    type="text"
                                    value={editSheetScript}
                                    onChange={e => { setEditSheetScript(e.target.value); setEditScriptError(validateAppsScriptUrl(e.target.value)); }}
                                    placeholder="Apps Script URL (ไม่บังคับ - https://script.google.com/macros/s/.../exec)"
                                    className={`w-full px-2.5 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 ${editScriptError ? 'border-red-300' : 'border-gray-300'}`}
                                  />
                                  {editScriptError && <p className="text-xs text-red-500">{editScriptError}</p>}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">ประเภท Sheet</label>
                                      <select
                                        value={editSheetType}
                                        onChange={e => setEditSheetType(e.target.value as SheetType)}
                                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        {SHEET_TYPE_OPTIONS.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">แถว Header (ปกติ=1)</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={editSheetHeaderRow}
                                        onChange={e => setEditSheetHeaderRow(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleSaveEditSheet}
                                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      บันทึก
                                    </button>
                                    <button
                                      onClick={() => setEditingSheet(null)}
                                      className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                    >
                                      ยกเลิก
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-gray-800">{sheet.name}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
                                        {SHEET_TYPE_OPTIONS.find(o => o.value === (sheet.sheetType || 'issue'))?.label || 'ปัญหา'}
                                      </span>
                                      {sheet.appsScriptUrl && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">R/W</span>
                                      )}
                                      {!sheet.appsScriptUrl && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">Read</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{sheet.sheetUrl}</p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => {
                                        setForm(prev => ({ ...prev, activeHospitalId: hosp.id, activeSheetId: sheet.id }));
                                      }}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        form.activeHospitalId === hosp.id && form.activeSheetId === sheet.id
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                      }`}
                                    >
                                      {form.activeHospitalId === hosp.id && form.activeSheetId === sheet.id ? 'ใช้งานอยู่' : 'เลือก'}
                                    </button>
                                    <button
                                      onClick={() => startEditSheet(hosp.id, sheet)}
                                      className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                      title="แก้ไข"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleRemoveSheet(hosp.id, sheet.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                      title="ลบ"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add Sheet Form */}
                        {addingSheetFor === hosp.id && (
                          <div className="mt-3 p-3 border border-dashed border-blue-300 rounded-lg bg-blue-50/50 space-y-2">
                            <p className="text-xs font-medium text-blue-700">เพิ่ม Google Sheet ใหม่</p>
                            <input
                              type="text"
                              value={newSheetName}
                              onChange={e => setNewSheetName(e.target.value)}
                              placeholder="ชื่อ Sheet เช่น แจ้งปัญหา OPD"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={newSheetUrl}
                              onChange={e => { setNewSheetUrl(e.target.value); validateSheetUrl(e.target.value); }}
                              placeholder="Google Sheet URL"
                              className={`w-full px-2.5 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 ${sheetUrlError ? 'border-red-300' : 'border-gray-300'}`}
                            />
                            {sheetUrlError && <p className="text-xs text-red-500">{sheetUrlError}</p>}
                            <input
                              type="text"
                              value={newSheetScript}
                              onChange={e => { setNewSheetScript(e.target.value); setNewScriptUrlError(validateAppsScriptUrl(e.target.value)); }}
                              placeholder="Apps Script URL (ไม่บังคับ - https://script.google.com/macros/s/.../exec)"
                              className={`w-full px-2.5 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 ${newScriptUrlError ? 'border-red-300' : 'border-gray-300'}`}
                            />
                            {newScriptUrlError && <p className="text-xs text-red-500">{newScriptUrlError}</p>}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">ประเภท Sheet</label>
                                <select
                                  value={newSheetType}
                                  onChange={e => setNewSheetType(e.target.value as SheetType)}
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  {SHEET_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">แถว Header (ปกติ=1)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={newSheetHeaderRow}
                                  onChange={e => setNewSheetHeaderRow(e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddSheet(hosp.id)}
                                disabled={!newSheetName.trim() || !newSheetUrl.trim() || !!sheetUrlError || !!newScriptUrlError}
                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                เพิ่ม Sheet
                              </button>
                              <button
                                onClick={() => { setAddingSheetFor(null); setNewSheetName(''); setNewSheetUrl(''); setNewSheetScript(''); setNewSheetType('issue'); setNewSheetHeaderRow('1'); setSheetUrlError(''); setNewScriptUrlError(''); }}
                                className="px-3 py-1.5 text-xs bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Hospital */}
              {showAddHospital ? (
                <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 bg-blue-50/30 space-y-3">
                  <p className="text-sm font-medium text-blue-800">เพิ่มสถานพยาบาลใหม่</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">รหัสสถานพยาบาล *</label>
                      <input
                        type="text"
                        value={newHospCode}
                        onChange={e => setNewHospCode(e.target.value)}
                        placeholder="เช่น 11111"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อสถานพยาบาล *</label>
                      <input
                        type="text"
                        value={newHospName}
                        onChange={e => setNewHospName(e.target.value)}
                        placeholder="เช่น รพ.ตัวอย่าง"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddHospital}
                      disabled={!newHospCode.trim() || !newHospName.trim()}
                      className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      เพิ่ม
                    </button>
                    <button
                      onClick={() => { setShowAddHospital(false); setNewHospCode(''); setNewHospName(''); }}
                      className="px-4 py-1.5 text-sm bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddHospital(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  เพิ่มสถานพยาบาล
                </button>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">วิธีตั้งค่า Google Apps Script (สำหรับแก้ไขข้อมูล)</h3>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>เปิด Google Sheet &gt; Extensions &gt; Apps Script</li>
                  <li>คัดลอกโค้ดจากไฟล์ <code className="bg-blue-100 px-1 rounded">Code.gs</code> ที่ให้มา</li>
                  <li>Deploy &gt; New deployment &gt; Web app</li>
                  <li>ตั้ง Execute as: Me, Who has access: Anyone</li>
                  <li>คัดลอก URL มาวางในช่อง Apps Script URL ของแต่ละ Sheet</li>
                </ol>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            บันทึกตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
}
