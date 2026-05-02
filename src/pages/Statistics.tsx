import Icon from '@/components/ui/icon';

const monthlyData = [
  { month: 'Ноя', orders: 52, done: 48, workers: 31 },
  { month: 'Дек', orders: 61, done: 55, workers: 34 },
  { month: 'Янв', orders: 43, done: 40, workers: 28 },
  { month: 'Фев', orders: 58, done: 54, workers: 36 },
  { month: 'Мар', orders: 74, done: 68, workers: 42 },
  { month: 'Апр', orders: 87, done: 82, workers: 48 },
];

const topWorkers = [
  { name: 'Иванов С.П.', orders: 24, done: 23, rate: 96 },
  { name: 'Петров А.В.', orders: 21, done: 20, rate: 95 },
  { name: 'Козлов В.М.', orders: 19, done: 17, rate: 89 },
  { name: 'Новиков С.В.', orders: 18, done: 18, rate: 100 },
  { name: 'Смирнов А.Ю.', orders: 16, done: 14, rate: 87 },
];

const topObjects = [
  { name: 'ТЦ Меридиан, корп.2', orders: 8, workers: 12 },
  { name: 'ЖК Северный, секция 3', orders: 15, workers: 18 },
  { name: 'Офисный центр Горизонт', orders: 12, workers: 9 },
  { name: 'Производственный цех А', orders: 6, workers: 14 },
];

const maxOrders = Math.max(...monthlyData.map(d => d.orders));

export default function Statistics() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всего нарядов (год)', value: '375', sub: '+23% к прошлому году', icon: 'ClipboardList', color: 'text-primary', bg: 'bg-blue-50' },
          { label: 'Выполнено', value: '340', sub: '90.7% от общего числа', icon: 'CheckCircle2', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Средний срок наряда', value: '6.4 дн.', sub: '-0.8 дней к норме', icon: 'Clock', color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Чел/нарядов (ср.)', value: '3.8', sub: 'человек на наряд', icon: 'Users', color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-border p-4">
            <div className={`w-9 h-9 ${k.bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon name={k.icon} size={18} className={k.color} fallback="Circle" />
            </div>
            <div className="text-2xl font-bold">{k.value}</div>
            <div className="text-sm text-muted-foreground">{k.label}</div>
            <div className="text-xs text-emerald-600 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Динамика нарядов по месяцам</h2>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Icon name="FileSpreadsheet" size={14} />
              Excel
            </button>
          </div>
          <div className="flex items-end gap-3 h-40">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 items-end" style={{ height: '128px' }}>
                  <div
                    className="flex-1 bg-primary/20 rounded-t-sm transition-all"
                    style={{ height: `${(d.orders / maxOrders) * 100}%` }}
                    title={`Создано: ${d.orders}`}
                  />
                  <div
                    className="flex-1 bg-emerald-500 rounded-t-sm transition-all"
                    style={{ height: `${(d.done / maxOrders) * 100}%` }}
                    title={`Выполнено: ${d.done}`}
                  />
                </div>
                <div className="text-xs text-muted-foreground">{d.month}</div>
                <div className="text-xs font-medium">{d.orders}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm bg-primary/20" /> Создано
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" /> Выполнено
            </div>
          </div>
        </div>

        {/* Top objects */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-4">Топ объектов</h2>
          <div className="space-y-3">
            {topObjects.map((obj, i) => (
              <div key={obj.name} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{obj.name}</div>
                  <div className="text-xs text-muted-foreground">{obj.orders} нарядов · {obj.workers} рабочих</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top workers */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Топ рабочих по выполнению</h2>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Icon name="FileDown" size={14} />
            PDF-отчёт
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60">
              <th className="text-left px-5 py-3 text-muted-foreground font-medium">#</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Рабочий</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Нарядов</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Выполнено</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Процент</th>
            </tr>
          </thead>
          <tbody>
            {topWorkers.map((w, i) => (
              <tr key={w.name} className={`border-b border-border/50 hover:bg-background/60 transition-colors ${i === topWorkers.length - 1 ? 'border-0' : ''}`}>
                <td className="px-5 py-3.5 font-bold text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {w.name[0]}
                    </div>
                    <span className="font-medium">{w.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell text-muted-foreground">{w.orders}</td>
                <td className="px-4 py-3.5 hidden md:table-cell text-muted-foreground">{w.done}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden max-w-[100px]">
                      <div
                        className={`h-full rounded-full ${w.rate >= 95 ? 'bg-emerald-500' : w.rate >= 85 ? 'bg-orange-400' : 'bg-red-400'}`}
                        style={{ width: `${w.rate}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${w.rate >= 95 ? 'text-emerald-600' : w.rate >= 85 ? 'text-orange-500' : 'text-red-500'}`}>
                      {w.rate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
