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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col"
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
                  <CodeBlock code={APPS_SCRIPT_CODE} />
                </StepItem>

                <StepItem
                  number={3}
                  title='★ กด Run ฟังก์ชัน "authorizeAndTest" เพื่อ Authorize สิทธิ์'
                  description="ขั้นตอนนี้สำคัญมาก! ถ้าข้ามจะเกิด Error 401 (Unauthorized):"
                >
                  <ol className="mt-2 text-xs text-gray-600 space-y-1.5 list-inside">
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.1</span>
                      <span>ที่ dropdown ด้านบน เลือกฟังก์ชัน <span className="font-semibold text-gray-800 bg-yellow-100 px-1 rounded">authorizeAndTest</span></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.2</span>
                      <span>กดปุ่ม <span className="font-semibold text-gray-800">▶ Run</span></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.3</span>
                      <span>จะมีหน้าต่างขออนุญาต → กด <span className="font-semibold text-gray-800">Review Permissions</span></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.4</span>
                      <span>เลือก <span className="font-semibold text-gray-800">บัญชี Google</span> ของคุณ</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.5</span>
                      <span>กด <span className="font-semibold text-gray-800">"Advanced"</span> → กด <span className="font-semibold text-gray-800">"Go to [ชื่อโปรเจกต์] (unsafe)"</span></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.6</span>
                      <span>กด <span className="font-semibold text-gray-800">"Allow"</span> เพื่ออนุญาตให้ Script เข้าถึง Google Sheet</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">3.7</span>
                      <span>ดู <span className="font-semibold text-gray-800">Execution log</span> ด้านล่าง → ถ้าเห็น <span className="font-semibold text-emerald-600">"✅ Setup OK!"</span> แสดงว่าพร้อม</span>
                    </li>
                  </ol>
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-700 font-medium">
                      ⚠ ถ้าข้ามขั้นตอนนี้ จะเกิด Error 401 (Unauthorized) เมื่อบันทึกข้อมูลจาก Dashboard
                    </p>
                  </div>
                </StepItem>

                <StepItem
                  number={4}
                  title="Deploy เป็น Web App"
                  description="ทำตามขั้นตอนดังนี้:"
                >
                  <ol className="mt-2 text-xs text-gray-600 space-y-1.5 list-inside">
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">4.1</span>
                      <span>คลิก <span className="font-semibold text-gray-800">Deploy</span> {'>'} <span className="font-semibold text-gray-800">New deployment</span></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">4.2</span>
                      <span>คลิกไอคอนเฟือง {'>'} เลือก <span className="font-semibold text-gray-800">Web app</span></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">4.3</span>
                      <span>ตั้งค่า:</span>
                    </li>
                    <li className="ml-8 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Execute as:</span>
                        <span className="font-semibold text-gray-800 bg-blue-50 px-1.5 py-0.5 rounded">Me</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Who has access:</span>
                        <span className="font-semibold text-gray-800 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Anyone</span>
                        <span className="text-red-500 font-bold text-[10px]">← สำคัญ!</span>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">4.4</span>
                      <span>คลิก <span className="font-semibold text-gray-800">Deploy</span></span>
                    </li>
                  </ol>
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700 font-medium">
                      ⚠ ต้องเลือก "Anyone" ไม่ใช่ "Anyone with Google Account" ถ้าเลือกผิดจะเกิด CORS Error
                    </p>
                  </div>
                </StepItem>

                <StepItem
                  number={5}
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

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-red-700">แก้ไข Error 401 (Unauthorized)</h4>
                  <p className="text-xs text-red-600">ถ้าบันทึกข้อมูลแล้วเจอ Error 401 ให้ทำตามนี้:</p>
                  <ol className="text-xs text-red-600 space-y-1 list-decimal list-inside">
                    <li>เปิด Apps Script Editor (Extensions {'>'} Apps Script)</li>
                    <li>เลือกฟังก์ชัน <span className="font-mono font-bold">authorizeAndTest</span> แล้วกด ▶ Run</li>
                    <li>ทำตามขั้นตอน Authorize สิทธิ์ให้ครบ</li>
                    <li>ไปที่ Deploy {'>'} New deployment → ตั้ง "Anyone" → Deploy</li>
                    <li>คัดลอก URL ใหม่ไปใส่ในตั้งค่า Dashboard</li>
                  </ol>
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

/* Code block with copy button + feedback */
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2 bg-gray-900 rounded-lg p-3 relative">
      <button
        onClick={handleCopy}
        className={`absolute top-2 right-2 px-2.5 py-1 text-[10px] rounded font-medium transition-colors ${
          copied
            ? 'bg-emerald-500 text-white'
            : 'bg-indigo-500 text-white hover:bg-indigo-600'
        }`}
      >
        {copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}
      </button>
      <pre className="text-[11px] text-green-400 font-mono overflow-x-auto whitespace-pre leading-relaxed max-h-64 overflow-y-auto pr-20">
        {code}
      </pre>
    </div>
  );
}

/* Apps Script code for copy — full version from Code.gs */
const APPS_SCRIPT_CODE = `/**
 * Google Apps Script สำหรับ IM Report Dashboard
 *
 * รองรับหลาย Sheet tab ใน Spreadsheet เดียว
 * Frontend ส่ง gid มาเพื่อระบุว่าจะทำงานกับ tab ไหน
 *
 * วิธีติดตั้ง:
 * 1. เปิด Google Sheet ที่ต้องการ
 * 2. ไปที่ Extensions > Apps Script
 * 3. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดนี้
 * 4. คลิก Deploy > New deployment
 * 5. เลือก Type: Web app
 * 6. ตั้งค่า:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. คลิก Deploy
 * 8. คัดลอก URL ไปใส่ในหน้า Settings ของ Dashboard
 *
 * หมายเหตุ: เมื่อแก้ไขโค้ด ต้อง Deploy > Manage deployments > Edit > New version
 */

// คอลัมน์ที่ใช้งาน (A-J)
var VALID_COLUMNS = ['no', 'department', 'date', 'description', 'category', 'status', 'notes', 'reporter', 'responsible', 'editDate'];
var REQUIRED_FIELDS_ADD = ['department', 'description'];
var REQUIRED_FIELDS_UPDATE = ['no'];
var MAX_TEXT_LENGTH = 5000;

/**
 * ★★★ ขั้นตอนแรก: กดปุ่ม Run ที่ฟังก์ชันนี้เพื่อ Authorize สิทธิ์ ★★★
 *
 * เลือกฟังก์ชันนี้จาก dropdown แล้วกด ▶ Run
 * จะมีหน้าต่างขออนุญาต → กด "Review Permissions" → เลือก Google Account
 * → กด "Advanced" → กด "Go to [project name] (unsafe)" → กด "Allow"
 *
 * หลัง Authorize สำเร็จ ให้ดูผลลัพธ์ที่ Execution log ด้านล่าง
 * ถ้าเห็น "✅ Setup OK!" แสดงว่าพร้อมใช้งาน → ไป Deploy ได้เลย
 */
function authorizeAndTest() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('✅ Setup OK! เชื่อมต่อกับ Spreadsheet: ' + ss.getName());
  Logger.log('URL: ' + ss.getUrl());

  var sheets = ss.getSheets();
  Logger.log('พบ ' + sheets.length + ' แท็บ:');
  for (var i = 0; i < sheets.length; i++) {
    Logger.log('  - ' + sheets[i].getName() + ' (gid=' + sheets[i].getSheetId() + ', rows=' + sheets[i].getLastRow() + ')');
  }

  Logger.log('');
  Logger.log('★ ขั้นตอนถัดไป:');
  Logger.log('  1. ไปที่ Deploy > New deployment');
  Logger.log('  2. Type: Web app');
  Logger.log('  3. Execute as: Me');
  Logger.log('  4. Who has access: Anyone');
  Logger.log('  5. กด Deploy → คัดลอก URL ไปใส่ในตั้งค่า Dashboard');
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var output;

  try {
    var params;

    if (e.postData) {
      // ตรวจสอบขนาด payload
      if (e.postData.contents && e.postData.contents.length > 50000) {
        return createJsonOutput({ success: false, error: 'Payload too large (max 50KB)' });
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

    // ตรวจสอบ action เป็น string
    if (typeof action !== 'string') {
      return createJsonOutput({ success: false, error: 'Invalid action type' });
    }

    switch (action) {
      case 'get':
        output = getAllData(gid);
        break;
      case 'update':
        output = updateRow(params.rowIndex, params.data, gid);
        break;
      case 'add':
        output = addRow(params.data, gid);
        break;
      case 'updateGeneric':
        output = updateGenericRow(params.rowIndex, params.values, gid, params.headerRow);
        break;
      default:
        output = { success: false, error: 'Unknown action: ' + action };
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

// ========== Utility Functions ==========

/**
 * หา Sheet tab จาก gid (Sheet ID)
 * - ถ้าส่ง gid มา → หา tab ที่ตรงกัน
 * - ถ้าไม่ส่ง gid → ใช้ tab แรก
 * - ถ้าหาไม่เจอ → return error
 */
function getSheetByGid(gid) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allSheets = ss.getSheets();

  if (!gid) {
    // ไม่ส่ง gid → ใช้ tab แรก (backward compatible)
    return { success: true, sheet: allSheets[0] };
  }

  // ค้นหา tab ที่มี gid ตรงกัน
  var targetGid = String(gid);
  for (var i = 0; i < allSheets.length; i++) {
    if (String(allSheets[i].getSheetId()) === targetGid) {
      return { success: true, sheet: allSheets[i] };
    }
  }

  // หาไม่เจอ → แสดง gid ที่มีทั้งหมดให้ debug
  var available = allSheets.map(function(s) {
    return s.getName() + ' (gid=' + s.getSheetId() + ')';
  });

  return {
    success: false,
    error: 'ไม่พบ Sheet tab ที่มี gid=' + gid + ' | มีอยู่: ' + available.join(', ')
  };
}

/**
 * แสดงรายการ Sheet tab ทั้งหมดใน Spreadsheet
 */
function listSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allSheets = ss.getSheets();
  var list = [];

  for (var i = 0; i < allSheets.length; i++) {
    list.push({
      name: allSheets[i].getName(),
      gid: String(allSheets[i].getSheetId()),
      index: i,
      rows: allSheets[i].getLastRow()
    });
  }

  return { success: true, sheets: list };
}

function sanitizeString(value) {
  if (value === null || value === undefined) return '';
  var str = String(value).trim();
  if (str.length > MAX_TEXT_LENGTH) {
    str = str.substring(0, MAX_TEXT_LENGTH);
  }
  return str;
}

function validateRequiredFields(data, requiredFields) {
  var missing = [];
  for (var i = 0; i < requiredFields.length; i++) {
    var field = requiredFields[i];
    if (!data[field] || String(data[field]).trim() === '') {
      missing.push(field);
    }
  }
  return missing;
}

function validateDate(dateStr) {
  if (!dateStr || dateStr === '') return true; // optional
  var pattern = /^\\d{1,2}\\/\\d{1,2}\\/\\d{4}$/;
  return pattern.test(String(dateStr).trim());
}

function validateRowIndex(rowIndex, sheet) {
  var idx = Number(rowIndex);
  if (isNaN(idx) || idx !== Math.floor(idx)) {
    return { valid: false, error: 'rowIndex ต้องเป็นจำนวนเต็ม' };
  }
  if (idx <= 1) {
    return { valid: false, error: 'rowIndex ต้องมากกว่า 1 (row 1 คือ header)' };
  }
  var lastRow = sheet.getLastRow();
  if (idx > lastRow) {
    return { valid: false, error: 'rowIndex ' + idx + ' เกินจำนวนแถวข้อมูล (มี ' + lastRow + ' แถว)' };
  }
  return { valid: true, index: idx };
}

function buildRowValues(data) {
  return [
    sanitizeString(data.no),           // Column A
    sanitizeString(data.department),   // Column B
    sanitizeString(data.date),         // Column C
    sanitizeString(data.description),  // Column D
    sanitizeString(data.category),     // Column E
    sanitizeString(data.status),       // Column F
    sanitizeString(data.notes),        // Column G
    sanitizeString(data.reporter),     // Column H
    sanitizeString(data.responsible),  // Column I
    sanitizeString(data.editDate)      // Column J - วันที่แก้ไข
  ];
}

function isDuplicateNo(sheet, no, excludeRowIndex) {
  if (!no || no === '') return false;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var colA = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < colA.length; i++) {
    var currentRowIndex = i + 2;
    if (excludeRowIndex && currentRowIndex === excludeRowIndex) continue;
    if (String(colA[i][0]).trim() === String(no).trim()) {
      return true;
    }
  }
  return false;
}

// ========== Main Functions ==========

function getAllData(gid) {
  // 1. หา sheet tab จาก gid
  var result = getSheetByGid(gid);
  if (!result.success) return result;
  var sheet = result.sheet;

  var lastRow = sheet.getLastRow();

  if (lastRow === 0) {
    return { success: true, data: [], headers: [], sheetName: sheet.getName(), gid: String(sheet.getSheetId()) };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === '' || data[i][0] === null || data[i][0] === undefined) {
      continue;
    }
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    row._rowIndex = i + 1;
    rows.push(row);
  }

  return {
    success: true,
    data: rows,
    headers: headers,
    totalRows: lastRow - 1,
    sheetName: sheet.getName(),
    gid: String(sheet.getSheetId())
  };
}

function updateRow(rowIndex, data, gid) {
  // 1. ตรวจสอบ parameter พื้นฐาน (ก่อน lock)
  if (rowIndex === null || rowIndex === undefined) {
    return { success: false, error: 'กรุณาระบุ rowIndex' };
  }
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'กรุณาระบุ data เป็น object' };
  }

  var missingFields = validateRequiredFields(data, REQUIRED_FIELDS_UPDATE);
  if (missingFields.length > 0) {
    return { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็น: ' + missingFields.join(', ') };
  }

  if (data.date && !validateDate(data.date)) {
    return { success: false, error: 'รูปแบบวันที่ไม่ถูกต้อง (ใช้ dd/mm/yyyy)' };
  }

  // 2. ใช้ LockService ป้องกัน concurrent writes
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, error: 'มีผู้ใช้อื่นกำลังบันทึกข้อมูลอยู่ กรุณาลองใหม่อีกครั้ง' };
  }

  try {
    // 3. หา sheet tab จาก gid
    var result = getSheetByGid(gid);
    if (!result.success) return result;
    var sheet = result.sheet;

    // 4. ตรวจสอบ rowIndex อยู่ในช่วงที่ถูกต้อง
    var rowCheck = validateRowIndex(rowIndex, sheet);
    if (!rowCheck.valid) {
      return { success: false, error: rowCheck.error };
    }

    // 5. ตรวจสอบว่า row นั้นมีข้อมูลอยู่จริง
    var existingRow = sheet.getRange(rowCheck.index, 1, 1, 10).getValues()[0];
    var isEmpty = existingRow.every(function(cell) {
      return cell === '' || cell === null || cell === undefined;
    });
    if (isEmpty) {
      return { success: false, error: 'Row ' + rowCheck.index + ' ไม่มีข้อมูล ไม่สามารถแก้ไขได้' };
    }

    // 6. ตรวจสอบลำดับซ้ำ (ถ้าเปลี่ยน no)
    if (data.no && String(data.no).trim() !== String(existingRow[0]).trim()) {
      if (isDuplicateNo(sheet, data.no, rowCheck.index)) {
        return { success: false, error: 'ลำดับ "' + data.no + '" ซ้ำกับรายการที่มีอยู่แล้ว' };
      }
    }

    // 7. Sanitize และบันทึก
    var values = buildRowValues(data);
    sheet.getRange(rowCheck.index, 1, 1, values.length).setValues([values]);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'อัปเดต row ' + rowCheck.index + ' สำเร็จ (sheet: ' + sheet.getName() + ')',
      rowIndex: rowCheck.index,
      sheetName: sheet.getName()
    };
  } finally {
    lock.releaseLock();
  }
}

function addRow(data, gid) {
  // 1. ตรวจสอบ parameter พื้นฐาน (ก่อน lock เพื่อไม่ให้ hold lock นาน)
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'กรุณาระบุ data เป็น object' };
  }

  var missingFields = validateRequiredFields(data, REQUIRED_FIELDS_ADD);
  if (missingFields.length > 0) {
    return { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็น: ' + missingFields.join(', ') };
  }

  if (data.date && !validateDate(data.date)) {
    return { success: false, error: 'รูปแบบวันที่ไม่ถูกต้อง (ใช้ dd/mm/yyyy)' };
  }

  // 2. ใช้ LockService ป้องกันการเขียนซ้อนกัน (concurrent writes)
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // รอ lock สูงสุด 15 วินาที
  } catch (e) {
    return { success: false, error: 'มีผู้ใช้อื่นกำลังบันทึกข้อมูลอยู่ กรุณาลองใหม่อีกครั้ง' };
  }

  try {
    // 3. หา sheet tab จาก gid (ภายใน lock)
    var result = getSheetByGid(gid);
    if (!result.success) return result;
    var sheet = result.sheet;

    // 4. ตรวจสอบลำดับซ้ำ (ภายใน lock เพื่อข้อมูลล่าสุด)
    if (data.no && isDuplicateNo(sheet, data.no, null)) {
      return { success: false, error: 'ลำดับ "' + data.no + '" ซ้ำกับรายการที่มีอยู่แล้ว' };
    }

    // 5. หาแถวที่จะเพิ่มข้อมูล (batch read ครั้งเดียว เร็วกว่า row-by-row)
    var lastRow = sheet.getLastRow();
    var newRow = lastRow + 1;

    if (lastRow >= 2) {
      // อ่านทุกคอลัมน์ (A-J) ทีเดียว → ไม่ต้อง getRange ทีละแถว
      var allData = sheet.getRange(2, 1, lastRow - 1, 10).getValues();

      // หาแถวสุดท้ายที่มีรายละเอียดปัญหา (column D) อยู่จริง
      var lastFilledRow = 1; // row 1 = header
      for (var i = 0; i < allData.length; i++) {
        var hasDescription = allData[i][3] !== '' && allData[i][3] !== null && allData[i][3] !== undefined;
        if (hasDescription) {
          lastFilledRow = i + 2; // i=0 → row 2
        }
      }

      // เริ่มจากแถวหลังข้อมูลล่าสุด
      newRow = lastFilledRow + 1;

      // ตรวจสอบว่าแถวนั้นว่างจริง (ใช้ข้อมูลที่อ่านมาแล้ว ไม่ต้องเรียก API เพิ่ม)
      while (newRow <= lastRow) {
        var rowData = allData[newRow - 2]; // allData[0] = row 2
        var isRowEmpty = rowData.every(function(cell) {
          return cell === '' || cell === null || cell === undefined;
        });
        if (isRowEmpty) {
          break; // แถวนี้ว่าง ใช้ได้
        }
        newRow++; // แถวนี้มีคนจองแล้ว ไปแถวถัดไป
      }
    }

    // 6. Sanitize และบันทึก
    var values = buildRowValues(data);
    sheet.getRange(newRow, 1, 1, values.length).setValues([values]);

    // 7. Force flush เพื่อให้แน่ใจว่าเขียนสำเร็จก่อนปล่อย lock
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'เพิ่มรายการที่ row ' + newRow + ' สำเร็จ (sheet: ' + sheet.getName() + ')',
      rowIndex: newRow,
      sheetName: sheet.getName()
    };
  } finally {
    lock.releaseLock();
  }
}

// ========== Generic Sheet Update ==========

/**
 * อัปเดตแถวใน sheet ทั่วไป (form, report, assessment)
 * รับ values เป็น array ตามลำดับคอลัมน์ แทนที่จะใช้ field name เหมือน updateRow
 *
 * @param {number} rowIndex - แถวที่จะอัปเดต (1-based)
 * @param {Array} values - ค่าที่จะเขียน ตามลำดับคอลัมน์
 * @param {string} gid - Sheet tab ID
 * @param {number} headerRow - แถวที่เป็น header (default=1)
 */
function updateGenericRow(rowIndex, values, gid, headerRow) {
  // 1. ตรวจสอบ parameter
  if (rowIndex === null || rowIndex === undefined) {
    return { success: false, error: 'กรุณาระบุ rowIndex' };
  }
  if (!values || !Array.isArray(values)) {
    return { success: false, error: 'กรุณาระบุ values เป็น array' };
  }
  if (!headerRow || headerRow < 1) {
    headerRow = 1;
  }

  // 2. LockService
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, error: 'มีผู้ใช้อื่นกำลังบันทึกอยู่ กรุณาลองใหม่อีกครั้ง' };
  }

  try {
    // 3. หา sheet
    var result = getSheetByGid(gid);
    if (!result.success) return result;
    var sheet = result.sheet;

    // 4. ตรวจสอบ rowIndex
    var idx = Number(rowIndex);
    if (isNaN(idx) || idx <= headerRow || idx > sheet.getLastRow()) {
      return { success: false, error: 'rowIndex ไม่ถูกต้อง: ' + rowIndex + ' (header อยู่แถว ' + headerRow + ', มีข้อมูล ' + sheet.getLastRow() + ' แถว)' };
    }

    // 5. อ่าน header row เพื่อนับจำนวนคอลัมน์จริง
    var lastCol = sheet.getLastColumn();
    var headerValues = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
    var numCols = 0;
    for (var i = 0; i < headerValues.length; i++) {
      if (String(headerValues[i]).trim() !== '') numCols = i + 1;
    }
    if (numCols === 0) {
      return { success: false, error: 'ไม่พบ header ในแถวที่ ' + headerRow };
    }

    // 6. ตรวจสอบว่า row มีข้อมูลอยู่จริง
    var existingRow = sheet.getRange(idx, 1, 1, numCols).getValues()[0];
    var isEmpty = existingRow.every(function(cell) {
      return cell === '' || cell === null || cell === undefined;
    });
    if (isEmpty) {
      return { success: false, error: 'Row ' + idx + ' ไม่มีข้อมูล ไม่สามารถแก้ไขได้' };
    }

    // 7. Sanitize + pad/trim ให้ตรงจำนวนคอลัมน์
    //    ถ้าคอลัมน์เดิมเป็น boolean (checkbox) → แปลง "TRUE"/"FALSE" กลับเป็น boolean
    var sanitized = [];
    for (var j = 0; j < numCols; j++) {
      var rawVal = j < values.length ? values[j] : '';
      if (typeof existingRow[j] === 'boolean') {
        sanitized.push(String(rawVal).toUpperCase() === 'TRUE');
      } else {
        sanitized.push(sanitizeString(rawVal));
      }
    }

    // 8. เขียนข้อมูล
    sheet.getRange(idx, 1, 1, numCols).setValues([sanitized]);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'อัปเดต row ' + idx + ' สำเร็จ (sheet: ' + sheet.getName() + ')',
      rowIndex: idx,
      sheetName: sheet.getName()
    };
  } finally {
    lock.releaseLock();
  }
}`;
