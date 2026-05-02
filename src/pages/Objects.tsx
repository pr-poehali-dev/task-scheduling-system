import { useState } from 'react';
import Icon from '@/components/ui/icon';

const objects = [
  { id: 'OBJ-01', name: 'ТЦ Меридиан, корп.2', address: 'ул. Ленина, 45', type: 'Коммерческая', activeOrders: 2, totalOrders: 8, status: 'Активный', area: '12 400 м²' },
  { id: 'OBJ-02', name: 'Склад №4, ул. Заводская', address: 'ул. Заводская, 12', type: 'Складской', activeOrders: 1, totalOrders: 3, status: 'Активный', area: '4 200 м²' },
  { id: 'OBJ-03', name: 'Офисный центр Горизонт', address: 'пр. Победы, 87', type: 'Офисный', activeOrders: 0, totalOrders: 12, status: 'Завершён', area: '8 600 м²' },
  { id: 'OBJ-04', name: 'ЖК Северный, секция 3', address: 'ул. Северная, 23', type: 'Жилой', activeOrders: 3, totalOrders: 15, status: 'Активный', area: '21 000 м²' },
  { id: 'OBJ-05', name: 'Производственный цех А', address: 'пр. Индустриальный, 5', type: 'Производственный', activeOrders: 0, totalOrders: 6, status: 'Завершён', area: '6 800 м²' },
  { id: 'OBJ-06', name: 'Больница №2, корпус Б', address: 'ул. Медицинская, 3', type: 'Социальный', activeOrders: 0, totalOrders: 4, status: 'Приостановлен', area: '9 100 м²' },
  { id: 'OBJ-07', name: 'Торговый дом Полюс', address: 'ул. Центральная, 1', type: 'Коммерческая', activeOrders: 1, totalOrders: 2, status: 'Активный', area: '3 200 м²' },
];

const typeColors: Record<string, string> = {
  'Коммерческая': 'bg-blue-100 text-blue-700',
  'Складской': 'bg-orange-100 text-orange-700',
  'Офисный': 'bg-purple-100 text-purple-700',
  'Жилой': 'bg-emerald-100 text-emerald-700',
  'Производственный': 'bg-gray-100 text-gray-600',
  'Социальный': 'bg-pink-100 text-pink-700',
};

const statusStyles: Record<string, string> = {
  'Активный': 'text-emerald-600',
  'Завершён': 'text-muted-foreground',
  'Приостановлен': 'text-orange-500',
};

export default function Objects() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);

  const filtered = objects.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.address.toLowerCase().includes(search.toLowerCase())
  );

  const toggleObject = (id: string) => {
    setSelectedObjects(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по названию или адресу..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        {selectedObjects.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm">
            <Icon name="CheckSquare" size={14} />
            Выбрано: {selectedObjects.length}
          </div>
        )}
        <div className="flex gap-1 ml-auto border border-border rounded-lg p-0.5 bg-white">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Icon name="LayoutGrid" size={15} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Icon name="List" size={15} />
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Icon name="Plus" size={15} />
          Добавить объект
        </button>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(obj => (
            <div
              key={obj.id}
              className={`bg-white rounded-xl border-2 transition-all cursor-pointer ${
                selectedObjects.includes(obj.id) ? 'border-primary shadow-md' : 'border-border hover:border-primary/30 hover:shadow-sm'
              }`}
              onClick={() => toggleObject(obj.id)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Icon name="Building2" size={20} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedObjects.includes(obj.id) && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Icon name="Check" size={12} className="text-white" />
                      </div>
                    )}
                    <span className={`text-xs font-medium flex items-center gap-1 ${statusStyles[obj.status]}`}>
                      ● {obj.status}
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1 leading-tight">{obj.name}</h3>
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <Icon name="MapPin" size={11} /> {obj.address}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[obj.type]}`}>
                    {obj.type}
                  </span>
                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Icon name="ClipboardList" size={11} />
                      {obj.activeOrders > 0 ? (
                        <span className="text-primary font-medium">{obj.activeOrders} акт.</span>
                      ) : (
                        <span>0 акт.</span>
                      )}
                    </span>
                    <span>{obj.totalOrders} всего</span>
                  </div>
                </div>
              </div>
              <div className="px-5 py-2.5 border-t border-border/50 text-xs text-muted-foreground">
                Площадь: {obj.area}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60">
                <th className="w-10 px-4 py-3"><input type="checkbox" className="w-4 h-4 accent-primary" /></th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Объект</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Тип</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Площадь</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Наряды</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((obj, i) => (
                <tr key={obj.id} className={`border-b border-border/50 hover:bg-background/60 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedObjects.includes(obj.id)}
                      onChange={() => toggleObject(obj.id)}
                      className="w-4 h-4 accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium">{obj.name}</div>
                    <div className="text-xs text-muted-foreground">{obj.address}</div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[obj.type]}`}>{obj.type}</span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">{obj.area}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-primary font-medium">{obj.activeOrders}</span>
                    <span className="text-muted-foreground"> / {obj.totalOrders}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium ${statusStyles[obj.status]}`}>● {obj.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
