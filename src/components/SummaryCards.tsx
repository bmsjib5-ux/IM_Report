import type { Issue } from '../types';

interface SummaryCardsProps {
  issues: Issue[];
  activeStatus: string;
  onStatusClick: (status: string) => void;
}

export default function SummaryCards({ issues, activeStatus, onStatusClick }: SummaryCardsProps) {
  const total = issues.length;
  const completed = issues.filter(i => i.status === 'ดำเนินการแล้ว').length;
  const pending = issues.filter(i => i.status === 'รอดำเนินการ').length;
  const inProgress = issues.filter(i => i.status === 'กำลังดำเนินการ').length;
  const cannotDo = issues.filter(i => i.status === 'ไม่สามารถทำได้').length;

  const cards = [
    { label: 'ทั้งหมด', value: total, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-300', icon: '📋', statusKey: '' },
    { label: 'ดำเนินการแล้ว', value: completed, gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-300', icon: '✅', statusKey: 'ดำเนินการแล้ว' },
    { label: 'รอดำเนินการ', value: pending, gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-300', icon: '⏳', statusKey: 'รอดำเนินการ' },
    { label: 'กำลังดำเนินการ', value: inProgress, gradient: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', ring: 'ring-cyan-300', icon: '🔄', statusKey: 'กำลังดำเนินการ' },
    { label: 'ไม่สามารถทำได้', value: cannotDo, gradient: 'from-rose-500 to-red-600', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', ring: 'ring-rose-300', icon: '❌', statusKey: 'ไม่สามารถทำได้' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
      {cards.map(card => {
        const isActive = activeStatus === card.statusKey;
        return (
        <div
          key={card.label}
          onClick={() => onStatusClick(isActive && card.statusKey !== '' ? '' : card.statusKey)}
          className={`relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl border px-3.5 py-3 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
            isActive ? `${card.border} ring-2 ${card.ring} shadow-md` : 'border-white/60 shadow-sm hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className={`text-xs font-medium leading-tight ${isActive ? card.text : 'text-gray-500'}`}>{card.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{card.value}</p>
            </div>
            <div className={`bg-gradient-to-br ${card.gradient} text-white rounded-xl p-2 text-sm shadow-sm`}>
              {card.icon}
            </div>
          </div>
          {total > 0 && (
            <div className="mt-2 relative z-10">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${card.gradient} h-1.5 rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${(card.value / total) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 text-right">{total > 0 ? ((card.value / total) * 100).toFixed(0) : 0}%</p>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
