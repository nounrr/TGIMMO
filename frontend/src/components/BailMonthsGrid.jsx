import React, { useMemo } from 'react';

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(date, months) {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}
function diffInMonthsInclusive(start, end) {
  const s = startOfMonth(start);
  const e = startOfMonth(end);
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
  return months <= 0 ? 0 : months;
}

export default function BailMonthsGrid({ startDate, endDate, durationMonths, maxMonths = 60, className }) {
  const items = useMemo(() => {
    if (!startDate) return [];
    const s = startOfMonth(new Date(startDate));
    let count = 0;
    if (endDate) {
      count = diffInMonthsInclusive(s, new Date(endDate));
    } else if (durationMonths) {
      count = Math.max(0, Number(durationMonths));
    } else {
      count = 12; // default 12 months if nothing else
    }
    if (count > maxMonths) count = maxMonths;

    const nowMonth = startOfMonth(new Date());
    return Array.from({ length: count }).map((_, i) => {
      const d = addMonths(s, i);
      const label = d.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const status = d < nowMonth ? 'past' : (d.getTime() === nowMonth.getTime() ? 'current' : 'future');
      return { key, label, status };
    });
  }, [startDate, endDate, durationMonths, maxMonths]);

  return (
    <div className={"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 " + (className || '')}>
      {items.length === 0 ? (
        <div className="text-slate-500 text-sm">Aucune période définie</div>
      ) : (
        items.map((m) => (
          <div
            key={m.key}
            className={
              "border rounded p-3 text-center text-xs font-medium " +
              (m.status === 'current'
                ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                : m.status === 'past'
                ? 'bg-slate-50 text-slate-600'
                : 'bg-white')
            }
            title={m.label}
          >
            {m.label}
          </div>
        ))
      )}
    </div>
  );
}
