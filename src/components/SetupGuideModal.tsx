import { useState } from 'react';

interface SetupGuideModalProps {
  onClose: () => void;
}

type StepId = 'overview' | 'google-sheet' | 'apps-script' | 'settings' | 'cloud-sync';

const STEPS: { id: StepId; label: string; icon: string }[] = [
  { id: 'overview', label: 'ภาพรวม', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'google-sheet', label: 'เตรียม Google Sheet', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'apps-script', label: 'ตั้งค่า Apps Script', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { id: 'settings', label: 'ตั้งค่าในระบบ', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { id: 'cloud-sync', label: 'Cloud Sync (เสริม)', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
];

export default function SetupGuideModal({ onClose }: SetupGuideModalProps) {
  const [activeStep, setActiveStep] = useState<StepId>('overview');

  const currentIndex = STEPS.findIndex(s => s.id === activeStep);

  const goNext = () => {
    if (currentIndex < STEPS.length - 1) {
      setActiveStep(STEPS[currentIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setActiveStep(STEPS[currentIndex - 1].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg p-1.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">วิธีการตั้งค่าใช้งาน</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step tabs */}
          <div className="flex gap-1 px-4 sm:px-6 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeStep === step.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  activeStep === step.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* Step 1: Overview */}
          {activeStep === 'overview' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
                <h3 className="text-base font-bold text-indigo-900 mb-2">IM Report Dashboard คืออะไร?</h3>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  ระบบติดตามการแจ้งปัญหาทีม IM ที่ดึงข้อมูลจาก Google Sheet มาแสดงผลเป็น Dashboard
                  สามารถดูข้อมูล, กรอง, ค้นหา และแก้ไขข้อมูลกลับไปที่ Google Sheet ได้
                </p>
              </div>

              <h3 className="text-sm font-bold text-gray-800">สิ่งที่ต้องเตรียม</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex gap-3 p-3 rounded-xl border border-gray-200 bg-white">
                  <div className="bg-green-100 rounded-lg p-2 h-fit shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Google Sheet</p>
                    <p className="text-xs text-gray-500 mt-0.5">สเปรดชีตที่เก็บข้อมูลปัญหา ต้องแชร์เป็น "Anyone with the link"</p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-xl border border-gray-200 bg-white">
                  <div className="bg-blue-100 rounded-lg p-2 h-fit shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Google Apps Script</p>
                    <p className="text-xs text-gray-500 mt-0.5">สำหรับแก้ไข/เพิ่มข้อมูลกลับไปที่ Sheet (ไม่บังคับ ถ้าต้องการแค่ดูข้อมูล)</p>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-800 mt-4">ขั้นตอนการตั้งค่า</h3>
              <div className="space-y-2">
                {STEPS.slice(1).map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-left"
                  >
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{step.label}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Google Sheet */}
          {activeStep === 'google-sheet' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <h3 className="text-sm font-bold text-green-900 mb-1">เตรียม Google Sheet ให้พร้อม</h3>
                <p className="text-xs text-green-700">ขั้นตอนนี้ทำเพื่อให้ Dashboard สามารถอ่านข้อมูลจาก Google Sheet ได้</p>
              </div>

              <div className="space-y-4">
                <StepItem
                  number={1}
                  title="สร้าง Google Sheet ใหม่ หรือเปิด Sheet ที่มีอยู่"
                  description="เปิด Google Sheets (sheets.google.com) แล้วสร้างสเปรดชีตใหม่ หรือเปิด Sheet ที่มีข้อมูลอยู่แล้ว"
                />

                <StepItem
                  number={2}
                  title='จัดรูปแบบคอลัมน์ (สำหรับ Sheet ประเภท "ปัญหา")'
                  description="ตั้งหัวคอลัมน์แถวแรก ตามลำดับดังนี้:"
                >
                  <div className="mt-2 overflow-x-auto">
                    <table className="text-xs border border-gray-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2.5 py-1.5 text-left font-semibold text-gray-600 border-b border-r border-gray-200">คอลัมน์</th>
                          <th className="px-2.5 py-1.5 text-left font-semibold text-gray-600 border-b border-r border-gray-200">หัวข้อ</th>
                          <th className="px-2.5 py-1.5 text-left font-semibold text-gray-600 border-b border-gray-200">คำอธิบาย</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['A', 'ลำดับ', 'เลขลำดับ เช่น 1, 2, 3'],
                          ['B', 'แผนก/สถานที่', 'ชื่อแผนกที่แจ้ง'],
                          ['C', 'วันที่', 'วันที่แจ้ง (dd/mm/yyyy)'],
                          ['D', 'รายละเอียดปัญหา', 'อธิบายปัญหาที่พบ'],
                          ['E', 'ประเภท', 'เช่น Hardware, Software, Network'],
                          ['F', 'สถานะ', 'เช่น รอดำเนินการ, กำลังดำเนินการ, เสร็จแล้ว'],
                          ['G', 'หมายเหตุ', 'รายละเอียดการดำเนินการ'],
                          ['H', 'ผู้แจ้ง', 'ชื่อผู้แจ้งปัญหา'],
                          ['I', 'ผู้รับผิดชอบ', 'ชื่อผู้รับผิดชอบ'],
                          ['J', 'วันที่แก้ไข', '(อัตโนมัติ) วันที่แก้ไขล่าสุด'],
                        ].map(([col, header, desc]) => (
                          <tr key={col} className="hover:bg-gray-50">
                            <td className="px-2.5 py-1.5 border-b border-r border-gray-200 font-mono font-bold text-indigo-600">{col}</td>
                            <td className="px-2.5 py-1.5 border-b border-r border-gray-200 font-medium text-gray-800">{header}</td>
                            <td className="px-2.5 py-1.5 border-b border-gray-200 text-gray-500">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </StepItem>

                <StepItem
                  number={3}
                  title='แชร์ Google Sheet เป็น "Anyone with the link"'
                  description="คลิกปุ่ม Share (มุมขวาบน) > General access > เปลี่ยนเป็น Anyone with the link > Viewer"
                >
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700 font-medium">
                      สำคัญ: ถ้าไม่แชร์ Sheet ระบบจะไม่สามารถอ่านข้อมูลได้
                    </p>
                  </div>
                </StepItem>

                <StepItem
                  number={4}
                  title="คัดลอก URL ของ Google Sheet"
                  description='คัดลอก URL จาก Address Bar ของเบราว์เซอร์ ตัวอย่าง:'
                >
                  <div className="mt-2 bg-gray-900 rounded-lg p-3">
                    <code className="text-xs text-green-400 break-all">
                      https://docs.google.com/spreadsheets/d/xxxxxxxxx/edit?gid=0#gid=0
                    </code>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">URL นี้จะใช้ใส่ในหน้าตั้งค่าของ Dashboard</p>
                </StepItem>
              </div>
            </div>
          )}

          {/* Step 3: Apps Script */}
          {activeStep === 'apps-script' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <h3 className="text-sm font-bold text-blue-900 mb-1">ตั้งค่า Google Apps Script</h3>
                <p className="text-xs text-blue-700">ขั้นตอนนี้จำเป็นเฉพาะเมื่อต้องการ "แก้ไข/เพิ่ม" ข้อมูลจาก Dashboard กลับไปที่ Sheet</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 font-medium">
                  ถ้าต้องการแค่ "ดูข้อมูล" อย่างเดียว ข้ามขั้นตอนนี้ได้เลย
                </p>
              </div>

              <div className="space-y-4">
                <StepItem
                  number={1}
                  title="เปิด Apps Script Editor"
                  description='ใน Google Sheet ไปที่เมนู Extensions > Apps Script จะเปิดหน้าใหม่ขึ้นมา'
                />

                <StepItem
                  number={2}
                  title="ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดใหม่"
                  description="ลบโค้ดที่มีอยู่ในไฟล์ Code.gs แล้ววางโค้ดด้านล่างนี้:"
                >
                  <div className="mt-2 bg-gray-900 rounded-lg p-3 relative">
                    <button
                      onClick={() => {
                        const code = APPS_SCRIPT_CODE;
                        navigator.clipboard.writeText(code);
                      }}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] bg-indigo-500 text-white rounded hover:bg-indigo-600 font-medium transition-colors"
                    >
                      คัดลอกโค้ด
                    </button>
                    <pre className="text-[11px] text-green-400 font-mono overflow-x-auto whitespace-pre leading-relaxed max-h-48 overflow-y-auto">
{`function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  var output;
  try {
    var params;
    if (e.postData) {
      params = JSON.parse(e.postData.contents);
    } else {
      return createJsonOutput(getAllData(null));
    }
    var action = params.action;
    var gid = params.gid || null;
    switch (action) {
      case 'update':
        output = updateRow(
          params.rowIndex, params.data, gid);
        break;
      case 'add':
        output = addRow(params.data, gid);
        break;
      default:
        output = { success: false,
          error: 'Unknown action' };
    }
  } catch (err) {
    output = { success: false,
      error: err.toString() };
  }
  return createJsonOutput(output);
}

// ... (ดูโค้ดเต็มในไฟล์ Code.gs)`}</pre>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    โค้ดเต็มอยู่ในไฟล์ <span className="font-mono bg-gray-100 px-1 rounded">google-apps-script/Code.gs</span> ของโปรเจกต์
                  </p>
                </StepItem>

                <StepItem
                  number={3}
                  title="Deploy เป็น Web App"
                  description="ทำตามขั้นตอนดังนี้:"
                >
                  <ol className="mt-2 text-xs text-gray-600 space-y-1.5 list-inside">
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.1</span>
                      <span>คลิก <span className="font-semibold text-gray-800">Deploy</span> {'>'} <span className="font-semibold text-gray-800">New deployment</span></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.2</span>
                      <span>คลิกไอคอนเฟือง {'>'} เลือก <span className="font-semibold text-gray-800">Web app</span></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.3</span>
                      <span>ตั้งค่า:</span>
                    </li>
                    <li className="ml-8 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Execute as:</span>
                        <span className="font-semibold text-gray-800 bg-blue-50 px-1.5 py-0.5 rounded">Me</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Who has access:</span>
                        <span className="font-semibold text-gray-800 bg-blue-50 px-1.5 py-0.5 rounded">Anyone</span>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.4</span>
                      <span>คลิก <span className="font-semibold text-gray-800">Deploy</span></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.5</span>
                      <span>คลิก <span className="font-semibold text-gray-800">Authorize access</span> {'>'} เลือกบัญชี Google {'>'} คลิก <span className="font-semibold text-gray-800">Allow</span></span>
                    </li>
                  </ol>
                </StepItem>

                <StepItem
                  number={4}
                  title="คัดลอก Web App URL"
                  description="หลัง Deploy สำเร็จ จะแสดง URL ของ Web App:"
                >
                  <div className="mt-2 bg-gray-900 rounded-lg p-3">
                    <code className="text-xs text-green-400 break-all">
                      https://script.google.com/macros/s/AKfycbw.../exec
                    </code>
                  </div>
                  <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs text-emerald-700 font-medium">
                      คัดลอก URL นี้ไว้ จะนำไปใส่ในหน้าตั้งค่าของ Dashboard ในขั้นตอนถัดไป
                    </p>
                  </div>
                </StepItem>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-gray-700">การอัปเดตโค้ด Apps Script</h4>
                  <p className="text-xs text-gray-500">
                    เมื่อแก้ไขโค้ดแล้ว ต้องไปที่ <span className="font-semibold">Deploy {'>'} Manage deployments {'>'} Edit (ไอคอนดินสอ) {'>'} Version: New version {'>'} Deploy</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Settings */}
          {activeStep === 'settings' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-xl p-4 border border-purple-100">
                <h3 className="text-sm font-bold text-purple-900 mb-1">ตั้งค่าในระบบ Dashboard</h3>
                <p className="text-xs text-purple-700">นำ URL ที่ได้ไปใส่ในหน้าตั้งค่าของ Dashboard</p>
              </div>

              <div className="space-y-4">
                <StepItem
                  number={1}
                  title='เปิดหน้าตั้งค่า'
                  description='คลิกที่ไอคอนเฟือง (ตั้งค่า) ที่ Header ด้านบน แล้วไปที่แท็บ "Google Sheet"'
                />

                <StepItem
                  number={2}
                  title="เพิ่มสถานพยาบาล"
                  description='คลิก "เพิ่มสถานพยาบาล" แล้วกรอก:'
                >
                  <ul className="mt-2 text-xs text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span>
                      <span><span className="font-semibold text-gray-800">รหัสสถานพยาบาล</span> - เช่น 11111</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span>
                      <span><span className="font-semibold text-gray-800">ชื่อสถานพยาบาล</span> - เช่น รพ.ตัวอย่าง</span>
                    </li>
                  </ul>
                </StepItem>

                <StepItem
                  number={3}
                  title="เพิ่ม Google Sheet"
                  description='คลิก "เพิ่ม Sheet" ภายในสถานพยาบาล แล้วกรอก:'
                >
                  <ul className="mt-2 text-xs text-gray-600 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1"></span>
                      <span><span className="font-semibold text-gray-800">ชื่อ Sheet</span> - ชื่อที่แสดงใน Dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1"></span>
                      <span><span className="font-semibold text-gray-800">Google Sheet URL</span> - URL ที่คัดลอกจากขั้นตอนเตรียม Google Sheet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1"></span>
                      <span><span className="font-semibold text-gray-800">Apps Script URL</span> - URL ที่ได้จากขั้นตอน Deploy (ไม่บังคับ)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1"></span>
                      <span><span className="font-semibold text-gray-800">ประเภท Sheet</span> - เลือกให้ตรงกับประเภทข้อมูลใน Sheet</span>
                    </li>
                  </ul>
                </StepItem>

                <StepItem
                  number={4}
                  title='คลิก "เลือก" เพื่อใช้งาน Sheet นั้น'
                  description='คลิกปุ่ม "เลือก" ที่ Sheet ที่ต้องการใช้งาน จากนั้นกด "บันทึกตั้งค่า"'
                />

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-gray-700">สถานะการเชื่อมต่อ</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        อ่าน/เขียน
                      </span>
                      <span className="text-gray-500">= ใส่ Apps Script URL แล้ว สามารถแก้ไข/เพิ่มข้อมูลได้</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full font-medium border border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        อ่านอย่างเดียว
                      </span>
                      <span className="text-gray-500">= ยังไม่ได้ใส่ Apps Script URL ดูข้อมูลได้อย่างเดียว</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Cloud Sync */}
          {activeStep === 'cloud-sync' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-cyan-50 to-sky-50 rounded-xl p-4 border border-cyan-100">
                <h3 className="text-sm font-bold text-cyan-900 mb-1">Cloud Sync ด้วย Supabase (ไม่บังคับ)</h3>
                <p className="text-xs text-cyan-700">เชื่อมต่อ Supabase เพื่อเก็บการตั้งค่าแบบ Online ดึงมาใช้ได้จากทุกที่</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 font-medium">
                  ฟีเจอร์นี้เป็นทางเลือกเสริม ไม่จำเป็นต้องตั้งค่าก็ใช้งาน Dashboard ได้ปกติ
                </p>
              </div>

              <div className="space-y-4">
                <StepItem
                  number={1}
                  title="สมัครบัญชี Supabase"
                  description='ไปที่ supabase.com แล้วสมัครบัญชี (ฟรี) จากนั้นสร้าง Project ใหม่'
                />

                <StepItem
                  number={2}
                  title="คัดลอก URL และ Anon Key"
                  description='ไปที่ Settings > API ใน Supabase Dashboard แล้วคัดลอก:'
                >
                  <ul className="mt-2 text-xs text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span><span className="font-semibold text-gray-800">Project URL</span> - เช่น https://xxxxx.supabase.co</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span><span className="font-semibold text-gray-800">anon/public key</span> - คีย์สำหรับเชื่อมต่อ</span>
                    </li>
                  </ul>
                </StepItem>

                <StepItem
                  number={3}
                  title="ตั้งค่าในระบบ"
                  description='เปิดหน้าตั้งค่า > แท็บ "Cloud Sync" > กรอก URL และ Anon Key > คลิก "ทดสอบการเชื่อมต่อ"'
                />

                <StepItem
                  number={4}
                  title="สร้างตาราง (ถ้าจำเป็น)"
                  description="ถ้าระบบแจ้งว่าต้องสร้างตาราง จะมี SQL ให้คัดลอก นำไปรันใน Supabase SQL Editor"
                />

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-gray-700">ความสามารถของ Cloud Sync</h4>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      เก็บการตั้งค่าสถานพยาบาลและ Sheet แบบ Online
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      ดึงการตั้งค่าจาก Cloud ได้จากทุกอุปกรณ์
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      จัดการผู้ใช้งาน (Login System)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 shrink-0">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ย้อนกลับ
          </button>

          <span className="text-xs text-gray-400">
            {currentIndex + 1} / {STEPS.length}
          </span>

          {currentIndex < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              ถัดไป
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              เสร็จสิ้น
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Sub-component for each step item */
function StepItem({ number, title, description, children }: {
  number: number;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        {children}
      </div>
    </div>
  );
}

/* Apps Script code for copy */
const APPS_SCRIPT_CODE = `function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  var output;
  try {
    var params;
    if (e.postData) {
      if (e.postData.contents && e.postData.contents.length > 50000) {
        return createJsonOutput({ success: false, error: 'Payload too large' });
      }
      params = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.action) {
      params = e.parameter;
    } else {
      output = getAllData(null);
      return createJsonOutput(output);
    }
    var action = params.action;
    var gid = params.gid || null;
    switch (action) {
      case 'get': output = getAllData(gid); break;
      case 'update': output = updateRow(params.rowIndex, params.data, gid); break;
      case 'add': output = addRow(params.data, gid); break;
      default: output = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    output = { success: false, error: err.toString() };
  }
  return createJsonOutput(output);
}

function createJsonOutput(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getSheetByGid(gid) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allSheets = ss.getSheets();
  if (!gid) return { success: true, sheet: allSheets[0] };
  var targetGid = String(gid);
  for (var i = 0; i < allSheets.length; i++) {
    if (String(allSheets[i].getSheetId()) === targetGid) {
      return { success: true, sheet: allSheets[i] };
    }
  }
  return { success: false, error: 'Sheet not found for gid=' + gid };
}

function sanitizeString(value) {
  if (value === null || value === undefined) return '';
  var str = String(value).trim();
  if (str.length > 5000) str = str.substring(0, 5000);
  return str;
}

function buildRowValues(data) {
  return [
    sanitizeString(data.no),
    sanitizeString(data.department),
    sanitizeString(data.date),
    sanitizeString(data.description),
    sanitizeString(data.category),
    sanitizeString(data.status),
    sanitizeString(data.notes),
    sanitizeString(data.reporter),
    sanitizeString(data.responsible),
    sanitizeString(data.editDate)
  ];
}

function getAllData(gid) {
  var result = getSheetByGid(gid);
  if (!result.success) return result;
  var sheet = result.sheet;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    row._rowIndex = i + 1;
    rows.push(row);
  }
  return { success: true, data: rows, headers: headers };
}

function updateRow(rowIndex, data, gid) {
  var result = getSheetByGid(gid);
  if (!result.success) return result;
  var sheet = result.sheet;
  if (!rowIndex || !data) return { success: false, error: 'Missing params' };
  var values = buildRowValues(data);
  sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
  return { success: true, message: 'Row ' + rowIndex + ' updated' };
}

function addRow(data, gid) {
  var result = getSheetByGid(gid);
  if (!result.success) return result;
  var sheet = result.sheet;
  if (!data) return { success: false, error: 'Missing data' };
  var lastRow = sheet.getLastRow();
  var newRow = lastRow + 1;
  var values = buildRowValues(data);
  sheet.getRange(newRow, 1, 1, values.length).setValues([values]);
  return { success: true, message: 'Row added at ' + newRow, rowIndex: newRow };
}`;
