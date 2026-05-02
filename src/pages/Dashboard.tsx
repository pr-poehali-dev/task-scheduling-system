import Icon from '@/components/ui/icon';

const stats = [
  { label: 'Активных нарядов', value: '24', icon: 'ClipboardList', color: 'text-blue-600', bg: 'bg-blue-50', change: '+3 за сегодня' },
  { label: 'Рабочих в базе', value: '148', icon: 'Users', color: 'text-emerald-600', bg: 'bg-emerald-50', change: '12 на объектах' },
  { label: 'Объектов', value: '31', icon: 'Building2', color: 'text-orange-500', bg: 'bg-orange-50', change: '8 активных' },
  { label: 'Выполнено за месяц', value: '87', icon: 'CheckCircle2', color: 'text-violet-600', bg: 'bg-violet-50', change: '+12% к плану' },
];

const recentOrders = [
  { id: 'НР-2024-089', object: 'ТЦ Меридиан, корп.2', type: 'Электромонтаж', workers: 3, date: '02.05.2026', status: 'В работе' },
  { id: 'НР-2024-088', object: 'Склад №4, ул. Заводская', type: 'Сантехника', workers: 2, date: '01.05.2026', status: 'Новый' },
  { id: 'НР-2024-087', object: 'Офисный центр Горизонт', type: 'Кровельные работы', workers: 5, date: '30.04.2026', status: 'Выполнен' },
  { id: 'НР-2024-086', object: 'ЖК Северный, секция 3', type: 'Штукатурка', workers: 4, date: '29.04.2026', status: 'В работе' },
  { id: 'НР-2024-085', object: 'Производственный цех А', type: 'Монтаж вентиляции', workers: 6, date: '28.04.2026', status: 'Выполнен' },
];

const statusStyles: Record<string, string> = {
  'Новый': 'bg-blue-100 text-blue-700',
  'В работе': 'bg-orange-100 text-orange-700',
  'Выполнен': 'bg-emerald-100 text-emerald-700',
  'Отменён': 'bg-gray-100 text-gray-600',
};

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <Icon name={stat.icon} size={20} className={stat.color} fallback="Circle" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mb-0.5">{stat.value}</div>
            <div className="text-sm text-muted-foreground leading-tight">{stat.label}</div>
            <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <span className="text-emerald-600">↑</span> {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Zap" size={16} className="text-accent" />
          Быстрые действия
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Icon name="Plus" size={16} />
            Создать наряд
          </button>
          <button
            onClick={() => onNavigate('workers')}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/70 transition-colors text-sm font-medium"
          >
            <Icon name="UserPlus" size={16} />
            Добавить рабочего
          </button>
          <button
            onClick={() => onNavigate('archive')}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/70 transition-colors text-sm font-medium"
          >
            <Icon name="FileSearch" size={16} />
            Поиск в архиве
          </button>
          <button
            onClick={() => onNavigate('statistics')}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/70 transition-colors text-sm font-medium"
          >
            <Icon name="Download" size={16} />
            Экспорт отчёта
          </button>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Последние наряды</h2>
          <button
            onClick={() => onNavigate('orders')}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Все наряды <Icon name="ChevronRight" size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">№ Наряда</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Объект</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Вид работ</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Рабочих</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Дата</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => (
                <tr key={order.id} className={`border-b border-border/50 hover:bg-background/60 transition-colors ${i === recentOrders.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-primary">{order.id}</td>
                  <td className="px-4 py-3.5 font-medium max-w-[200px] truncate">{order.object}</td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{order.type}</td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Icon name="Users" size={13} />
                      {order.workers}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">{order.date}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
