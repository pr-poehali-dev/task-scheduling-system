import { useState } from 'react';
import Icon from '@/components/ui/icon';

const archiveOrders = [
  { id: 'НР-2024-080', object: 'БЦ Сапфир', type: 'Электромонтаж', master: 'Петров И.А.', workers: 4, dateStart: '15.03.2026', dateEnd: '22.03.2026', status: 'Выполнен' },
  { id: 'НР-2024-079', object: 'Школа №45', type: 'Сантехника', master: 'Козлов В.М.', workers: 2, dateStart: '10.03.2026', dateEnd: '18.03.2026', status: 'Выполнен' },
  { id: 'НР-2024-078', object: 'Детский сад №12', type: 'Штукатурка', master: 'Новиков С.В.', workers: 5, dateStart: '05.03.2026', dateEnd: '14.03.2026', status: 'Выполнен' },
  { id: 'НР-2024-077', object: 'Торговый дом Полюс', type: 'Кровля', master: 'Лебедев К.О.', workers: 3, dateStart: '01.03.2026', dateEnd: '07.03.2026', status: 'Выполнен' },
  { id: 'НР-2024-076', object: 'Офис Ромашка', type: 'Монтаж вентиляции', master: 'Смирнов А.Ю.', workers: 6, dateStart: '20.02.2026', dateEnd: '28.02.2026', status: 'Выполнен' },
  { id: 'НР-2024-075', object: 'ЖК Западный', type: 'Электромонтаж', master: 'Васильев П.Т.', workers: 2, dateStart: '15.02.2026', dateEnd: '25.02.2026', status: 'Отменён' },
  { id: 'НР-2024-074', object: 'Автосалон Премиум', type: 'Укладка плитки', master: 'Петров И.А.', workers: 3, dateStart: '10.02.2026', dateEnd: '20.02.2026', status: 'Выполнен' },
  { id: 'НР-2024-073', object: 'Больница №1', type: 'Монтаж вентиляции', master: 'Козлов В.М.', workers: 4, dateStart: '01.02.2026', dateEnd: '12.02.2026', status: 'Выполнен' },
];

const statusStyles: Record<string, string> = {
  'Выполнен': 'bg-emerald-100 text-emerald-700',
  'Отменён': 'bg-gray-100 text-gray-500',
};

export default function Archive() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Все');

  const filtered = archiveOrders.filter(o => {
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.object.toLowerCase().includes(search.toLowerCase()) ||
      o.master.toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === 'Все' || o.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-border p-4">
        <h2 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <Icon name="Filter" size={14} />
          Фильтр поиска
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск по №, объекту, мастеру..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Дата от"
            />
          </div>
          <div>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Дата до"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {['Все', 'Выполнен', 'Отменён'].map(s => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                selectedStatus === s ? 'bg-primary text-white border-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {s}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/70 transition-colors">
              <Icon name="FileDown" size={13} />
              Экспорт PDF
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/70 transition-colors">
              <Icon name="FileSpreadsheet" size={13} />
              Экспорт Excel
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Найдено нарядов: <span className="font-semibold text-foreground">{filtered.length}</span></span>
        <span className="text-xs">Архив: все завершённые и отменённые наряды</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">№ Наряда</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Объект / Вид работ</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Мастер</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Рабочих</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Выполнен</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Итог</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <tr key={order.id} className={`border-b border-border/50 hover:bg-background/60 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-muted-foreground">{order.id}</td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium">{order.object}</div>
                    <div className="text-xs text-muted-foreground">{order.type}</div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{order.master}</td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Icon name="Users" size={13} />
                      {order.workers}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                    <div>{order.dateStart}</div>
                    <div>→ {order.dateEnd}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="p-1.5 rounded hover:bg-background transition-colors text-muted-foreground" title="Просмотр">
                      <Icon name="Eye" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Icon name="SearchX" size={32} className="mx-auto mb-2 opacity-30" />
              <p>Ничего не найдено по вашему запросу</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
