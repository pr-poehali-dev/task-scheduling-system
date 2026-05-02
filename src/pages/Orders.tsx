import { useState } from 'react';
import Icon from '@/components/ui/icon';

const orders = [
  { id: 'НР-2024-089', object: 'ТЦ Меридиан, корп.2', type: 'Электромонтаж', master: 'Петров И.А.', workers: ['Иванов С.П.', 'Сидоров А.В.', 'Кузнецов Д.Н.'], date: '02.05.2026', deadline: '09.05.2026', status: 'В работе', priority: 'Высокий' },
  { id: 'НР-2024-088', object: 'Склад №4, ул. Заводская', type: 'Сантехника', master: 'Козлов В.М.', workers: ['Морозов К.Л.', 'Волков Р.Е.'], date: '01.05.2026', deadline: '05.05.2026', status: 'Новый', priority: 'Средний' },
  { id: 'НР-2024-087', object: 'Офисный центр Горизонт', type: 'Кровельные работы', master: 'Новиков С.В.', workers: ['Попов В.Н.', 'Лебедев И.Ф.', 'Козлов М.А.', 'Новиков Д.К.', 'Соколов А.П.'], date: '30.04.2026', deadline: '30.04.2026', status: 'Выполнен', priority: 'Низкий' },
  { id: 'НР-2024-086', object: 'ЖК Северный, секция 3', type: 'Штукатурка', master: 'Лебедев К.О.', workers: ['Зайцев И.В.', 'Соколов Г.Л.', 'Орлов Н.П.', 'Макаров С.А.'], date: '29.04.2026', deadline: '10.05.2026', status: 'В работе', priority: 'Высокий' },
  { id: 'НР-2024-085', object: 'Производственный цех А', type: 'Монтаж вентиляции', master: 'Смирнов А.Ю.', workers: ['Фёдоров Д.А.', 'Михайлов В.С.', 'Карпов О.Н.', 'Жуков А.Л.', 'Орлов М.К.', 'Степанов Р.И.'], date: '28.04.2026', deadline: '28.04.2026', status: 'Выполнен', priority: 'Средний' },
  { id: 'НР-2024-084', object: 'Больница №2, корпус Б', type: 'Укладка плитки', master: 'Васильев П.Т.', workers: ['Сорокин В.Г.'], date: '27.04.2026', deadline: '03.05.2026', status: 'Отменён', priority: 'Низкий' },
];

const statusStyles: Record<string, string> = {
  'Новый': 'bg-blue-100 text-blue-700',
  'В работе': 'bg-orange-100 text-orange-700',
  'Выполнен': 'bg-emerald-100 text-emerald-700',
  'Отменён': 'bg-gray-100 text-gray-500',
};

const priorityStyles: Record<string, string> = {
  'Высокий': 'text-red-600',
  'Средний': 'text-orange-500',
  'Низкий': 'text-gray-400',
};

const allStatuses = ['Все', 'Новый', 'В работе', 'Выполнен', 'Отменён'];

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState('Все');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null);

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'Все' || o.status === statusFilter;
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.object.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по номеру или объекту..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {allStatuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shrink-0"
        >
          <Icon name="Plus" size={15} />
          Создать наряд
        </button>
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
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Рабочие</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Срок</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Статус</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <tr key={order.id} className={`border-b border-border/50 hover:bg-background/60 transition-colors cursor-pointer ${i === filtered.length - 1 ? 'border-0' : ''}`}
                  onClick={() => setSelectedOrder(order)}>
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-xs font-semibold text-primary">{order.id}</div>
                    <div className={`text-xs mt-0.5 ${priorityStyles[order.priority]}`}>● {order.priority} приоритет</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium truncate max-w-[200px]">{order.object}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{order.type}</div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{order.master}</td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Icon name="Users" size={13} />
                      {order.workers.length} чел.
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell text-xs">{order.deadline}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="p-1.5 rounded hover:bg-background transition-colors text-muted-foreground">
                      <Icon name="MoreVertical" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Icon name="ClipboardX" size={32} className="mx-auto mb-2 opacity-30" />
              <p>Нарядов не найдено</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      {showModal && <CreateOrderModal onClose={() => setShowModal(false)} />}

      {/* Order Detail Modal */}
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}

function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const workers = ['Иванов С.П.', 'Сидоров А.В.', 'Кузнецов Д.Н.', 'Морозов К.Л.', 'Волков Р.Е.', 'Попов В.Н.', 'Лебедев И.Ф.', 'Козлов М.А.'];
  const objects = ['ТЦ Меридиан, корп.2', 'Склад №4, ул. Заводская', 'Офисный центр Горизонт', 'ЖК Северный, секция 3', 'Производственный цех А'];
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [selectedObject, setSelectedObject] = useState('');

  const toggleWorker = (w: string) => {
    setSelectedWorkers(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-lg">Создать новый наряд</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Object */}
          <div>
            <label className="block text-sm font-medium mb-2">Объект</label>
            <select
              value={selectedObject}
              onChange={e => setSelectedObject(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Выберите объект...</option>
              {objects.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Work type */}
          <div>
            <label className="block text-sm font-medium mb-2">Вид работ</label>
            <input
              type="text"
              placeholder="Введите вид работ..."
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Dates & Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Дата начала</label>
              <input type="date" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Срок сдачи</label>
              <input type="date" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Приоритет</label>
              <select className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option>Средний</option>
                <option>Высокий</option>
                <option>Низкий</option>
              </select>
            </div>
          </div>

          {/* Workers */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Рабочие
              {selectedWorkers.length > 0 && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Выбрано: {selectedWorkers.length}
                </span>
              )}
            </label>
            <div className="border border-border rounded-lg overflow-hidden">
              {workers.map((w, i) => (
                <label
                  key={w}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-background transition-colors ${i < workers.length - 1 ? 'border-b border-border/50' : ''} ${selectedWorkers.includes(w) ? 'bg-primary/5' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedWorkers.includes(w)}
                    onChange={() => toggleWorker(w)}
                    className="w-4 h-4 accent-primary"
                  />
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    {w.split(' ')[0][0]}
                  </div>
                  <span className="text-sm">{w}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Описание / задание</label>
            <textarea
              rows={3}
              placeholder="Опишите задание и особые требования..."
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Создать наряд
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: typeof orders[0]; onClose: () => void }) {
  const statusStyles: Record<string, string> = {
    'Новый': 'bg-blue-100 text-blue-700',
    'В работе': 'bg-orange-100 text-orange-700',
    'Выполнен': 'bg-emerald-100 text-emerald-700',
    'Отменён': 'bg-gray-100 text-gray-500',
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="font-mono text-xs font-semibold text-primary">{order.id}</div>
            <h2 className="font-semibold text-base mt-0.5">{order.object}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[order.status]}`}>{order.status}</span>
            <span className="px-3 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">{order.type}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-muted-foreground text-xs mb-1">Мастер</div><div className="font-medium">{order.master}</div></div>
            <div><div className="text-muted-foreground text-xs mb-1">Приоритет</div><div className="font-medium">{order.priority}</div></div>
            <div><div className="text-muted-foreground text-xs mb-1">Дата создания</div><div>{order.date}</div></div>
            <div><div className="text-muted-foreground text-xs mb-1">Срок сдачи</div><div className="font-medium">{order.deadline}</div></div>
          </div>

          <div>
            <div className="text-muted-foreground text-xs mb-2">Рабочие ({order.workers.length} чел.)</div>
            <div className="flex flex-wrap gap-2">
              {order.workers.map(w => (
                <span key={w} className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary rounded-lg text-xs">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                    {w[0]}
                  </div>
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/70 transition-colors">
            <Icon name="FileDown" size={15} />
            Экспорт PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/70 transition-colors">
            <Icon name="FileSpreadsheet" size={15} />
            Экспорт Excel
          </button>
          <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors">
            <Icon name="Pencil" size={15} />
            Редактировать
          </button>
        </div>
      </div>
    </div>
  );
}
