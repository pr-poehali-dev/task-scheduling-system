import { useState } from 'react';
import Icon from '@/components/ui/icon';

type Worker = {
  должность: string;
  фио: string;
  начало1: string;
  конец1: string;
  начало2: string;
  конец2: string;
  план: number;
  факт: number;
  ок: boolean;
  примечание: string;
};

type Brigade = {
  номер: number;
  работники: Worker[];
};

type Order = {
  id: string;
  дата: string;
  мастер: string;
  ответственное_лицо: string;
  утверждает: string;
  должность_утверждающего: string;
  статус: string;
  бригады: Brigade[];
};

const orders: Order[] = [
  {
    id: 'НЗ-2026-022',
    дата: '22 января 2026 г.',
    мастер: 'Понамарев Е. С.',
    ответственное_лицо: 'Понамарев Е. С.',
    утверждает: 'К. В. Скоробогатый',
    должность_утверждающего: 'Гл. инженер МБУ города Абакана "Абаканское парковое хозяйство"',
    статус: 'В работе',
    бригады: [
      {
        номер: 1,
        работники: [
          { должность: 'рем. бр', фио: 'Тамарский Д.П.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '17:00', план: 8, факт: 0, ок: false, примечание: '' },
          { должность: 'рем. бр', фио: 'Потехин А.Д.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '17:00', план: 8, факт: 0, ок: false, примечание: '' },
          { должность: 'рем. бр', фио: 'Пеленев В.Н.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '18:00', план: 9, факт: 0, ок: false, примечание: '' },
          { должность: 'рзх 5', фио: 'Гудин Д.А.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '17:00', план: 8, факт: 0, ок: false, примечание: '' },
          { должность: 'рзх 6', фио: 'Шутенков Ю.Л.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '17:00', план: 8, факт: 0, ок: false, примечание: '' },
          { должность: 'слесарь', фио: 'Туниеков А.А.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '17:00', план: 8, факт: 0, ок: false, примечание: '' },
          { должность: 'рзх 6', фио: 'Демидюк А.М.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '17:00', план: 8, факт: 0, ок: false, примечание: '' },
          { должность: 'рем. бр', фио: 'Веревкин В.В.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '17:00', план: 8, факт: 0, ок: false, примечание: '' },
          { должность: 'рем. бр', фио: 'Иванов Е.Ю.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '17:00', план: 8, факт: 0, ок: false, примечание: '' },
          { должность: 'рзх 6', фио: 'Файль А.В.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '17:00', план: 8, факт: 0, ок: false, примечание: '' },
        ],
      },
      {
        номер: 2,
        работники: [
          { должность: 'кочегар', фио: 'Канзычаков В.С.', начало1: '8:00', конец1: '20:00', начало2: '', конец2: '', план: 12, факт: 0, ок: false, примечание: '' },
          { должность: 'кочегар', фио: 'Патачаков И.В.', начало1: '20:00', конец1: '8:00', начало2: '', конец2: '', план: 12, факт: 0, ок: false, примечание: '' },
          { должность: 'кочегар', фио: 'Иванченко С.А.', начало1: '8:00', конец1: '20:00', начало2: '', конец2: '', план: 12, факт: 0, ок: false, примечание: '' },
          { должность: 'кочегар', фио: 'Чебодаев П.И.', начало1: '20:00', конец1: '8:00', начало2: '', конец2: '', план: 12, факт: 0, ок: false, примечание: '' },
        ],
      },
    ],
  },
  {
    id: 'НЗ-2026-021',
    дата: '21 января 2026 г.',
    мастер: 'Вершинина О.В.',
    ответственное_лицо: 'Вершинина О.В.',
    утверждает: 'К. В. Скоробогатый',
    должность_утверждающего: 'Гл. инженер МБУ города Абакана "Абаканское парковое хозяйство"',
    статус: 'Выполнен',
    бригады: [
      {
        номер: 1,
        работники: [
          { должность: 'рзх 4', фио: 'Петров А.В.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '17:00', план: 8, факт: 8, ок: true, примечание: '' },
          { должность: 'рзх 3', фио: 'Сидоров К.Л.', начало1: '8:00', конец1: '12:00', начало2: '13:00', конец2: '17:00', план: 8, факт: 8, ок: true, примечание: '' },
        ],
      },
    ],
  },
];

const statusStyles: Record<string, string> = {
  'Новый': 'bg-blue-100 text-blue-700',
  'В работе': 'bg-orange-100 text-orange-700',
  'Выполнен': 'bg-emerald-100 text-emerald-700',
  'Отменён': 'bg-gray-100 text-gray-500',
};

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">Наряды-задания</h2>
          <p className="text-xs text-muted-foreground mt-0.5">На выполнение работ по содержанию озеленённых территорий</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Icon name="Plus" size={15} />
          Новый наряд
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {orders.map(order => (
          <div
            key={order.id}
            className="bg-white rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
            onClick={() => setSelectedOrder(order)}
          >
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-primary">{order.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[order.статус]}`}>
                    {order.статус}
                  </span>
                </div>
                <div className="text-sm font-semibold mb-1">На выполнение работ по содержанию озеленённых территорий</div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Icon name="Calendar" size={11} />
                    {order.дата}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="User" size={11} />
                    Мастер: {order.мастер}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Users" size={11} />
                    Бригад: {order.бригады.length} / Рабочих: {order.бригады.reduce((s, b) => s + b.работники.length, 0)}
                  </span>
                </div>
              </div>
              <Icon name="ChevronRight" size={16} className="text-muted-foreground shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {/* Create stub */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in text-center">
            <Icon name="FilePlus" size={40} className="text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Создание наряда</h3>
            <p className="text-sm text-muted-foreground mb-4">Напишите нам, что именно должна делать форма создания наряда, и мы её настроим.</p>
            <button onClick={() => setShowCreate(false)} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl my-4 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">НАРЯД-ЗАДАНИЕ {order.id}</div>
            <div className="font-bold text-base">На выполнение работ по содержанию озеленённых территорий</div>
            <div className="text-sm text-muted-foreground">на {order.дата}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground ml-4 shrink-0">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-border">
          <div className="px-6 py-4 border-b md:border-b-0 md:border-r border-border">
            <div className="text-xs text-muted-foreground mb-1">Мастер / ответственное лицо</div>
            <div className="font-semibold">{order.мастер}</div>
          </div>
          <div className="px-6 py-4">
            <div className="text-xs text-muted-foreground mb-1">УТВЕРЖДАЮ</div>
            <div className="text-xs text-muted-foreground">{order.должность_утверждающего}</div>
            <div className="font-semibold mt-0.5">{order.утверждает}</div>
          </div>
        </div>

        {/* Brigades */}
        <div className="p-6 space-y-5">
          {order.бригады.map(brigade => (
            <div key={brigade.номер} className="border border-border rounded-xl overflow-hidden">
              <div className="bg-primary/8 px-4 py-2.5 border-b border-border flex items-center gap-2">
                <Icon name="Users" size={14} className="text-primary" />
                <span className="font-semibold text-sm">БРИГАДА № {brigade.номер}</span>
                <span className="ml-auto text-xs text-muted-foreground">{brigade.работники.length} чел.</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-background/60 border-b border-border text-muted-foreground">
                      <th className="text-left px-3 py-2 font-medium">Должность</th>
                      <th className="text-left px-3 py-2 font-medium">Фамилия, инициалы</th>
                      <th className="text-center px-2 py-2 font-medium" colSpan={2}>Режим работы 1</th>
                      <th className="text-center px-2 py-2 font-medium" colSpan={2}>Режим работы 2</th>
                      <th className="text-center px-2 py-2 font-medium">План</th>
                      <th className="text-center px-2 py-2 font-medium">Факт</th>
                      <th className="text-center px-2 py-2 font-medium">ОК</th>
                      <th className="text-left px-2 py-2 font-medium hidden lg:table-cell">Примечание</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brigade.работники.map((w, i) => (
                      <tr key={i} className={`border-b border-border/40 hover:bg-background/40 transition-colors ${i === brigade.работники.length - 1 ? 'border-0' : ''}`}>
                        <td className="px-3 py-2.5 text-muted-foreground">{w.должность}</td>
                        <td className="px-3 py-2.5 font-medium whitespace-nowrap">{w.фио}</td>
                        <td className="px-2 py-2.5 text-center text-muted-foreground whitespace-nowrap">{w.начало1}</td>
                        <td className="px-2 py-2.5 text-center text-muted-foreground whitespace-nowrap">{w.конец1}</td>
                        <td className="px-2 py-2.5 text-center text-muted-foreground whitespace-nowrap">{w.начало2 || '—'}</td>
                        <td className="px-2 py-2.5 text-center text-muted-foreground whitespace-nowrap">{w.конец2 || '—'}</td>
                        <td className="px-2 py-2.5 text-center font-semibold">{w.план}</td>
                        <td className="px-2 py-2.5 text-center">
                          {w.факт > 0 ? (
                            <span className="text-emerald-600 font-semibold">{w.факт}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          {w.ок ? (
                            <Icon name="CheckCircle2" size={14} className="text-emerald-500 mx-auto" />
                          ) : (
                            <Icon name="Circle" size={14} className="text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground hidden lg:table-cell">{w.примечание || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background/40 rounded-b-2xl flex items-center gap-3 justify-end">
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/70 transition-colors">
            <Icon name="Printer" size={14} />
            Печать
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
