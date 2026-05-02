import { useState } from 'react';
import Icon from '@/components/ui/icon';

const workers = [
  { id: 'W001', name: 'Иванов Сергей Петрович', position: 'Электромонтажник 4р.', department: 'Электроцех', phone: '+7 (912) 345-67-89', status: 'На объекте', object: 'ТЦ Меридиан', sync: '1С' },
  { id: 'W002', name: 'Сидоров Алексей Викторович', position: 'Сантехник 5р.', department: 'Сантех. цех', phone: '+7 (903) 456-78-90', status: 'На объекте', object: 'ТЦ Меридиан', sync: '1С' },
  { id: 'W003', name: 'Кузнецов Дмитрий Николаевич', position: 'Электромонтажник 3р.', department: 'Электроцех', phone: '+7 (916) 567-89-01', status: 'Свободен', object: '—', sync: '1С' },
  { id: 'W004', name: 'Морозов Константин Леонидович', position: 'Кровельщик 5р.', department: 'Кровельный цех', phone: '+7 (926) 678-90-12', status: 'Свободен', object: '—', sync: '1С' },
  { id: 'W005', name: 'Волков Роман Евгеньевич', position: 'Штукатур 4р.', department: 'Отделочный цех', phone: '+7 (999) 789-01-23', status: 'На объекте', object: 'ЖК Северный', sync: '1С' },
  { id: 'W006', name: 'Попов Виктор Николаевич', position: 'Вентиляционщик 5р.', department: 'Вентиляц. цех', phone: '+7 (911) 890-12-34', status: 'Отпуск', object: '—', sync: '1С' },
  { id: 'W007', name: 'Лебедев Игорь Фёдорович', position: 'Плиточник 4р.', department: 'Отделочный цех', phone: '+7 (922) 901-23-45', status: 'Свободен', object: '—', sync: 'Ручной' },
  { id: 'W008', name: 'Козлов Михаил Андреевич', position: 'Электромонтажник 5р.', department: 'Электроцех', phone: '+7 (933) 012-34-56', status: 'На объекте', object: 'Произв. цех А', sync: '1С' },
];

const statusStyles: Record<string, string> = {
  'На объекте': 'bg-emerald-100 text-emerald-700',
  'Свободен': 'bg-blue-100 text-blue-700',
  'Отпуск': 'bg-yellow-100 text-yellow-700',
  'Больничный': 'bg-red-100 text-red-600',
};

export default function Workers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Все');

  const statuses = ['Все', 'Свободен', 'На объекте', 'Отпуск'];

  const filtered = workers.filter(w => {
    const matchStatus = statusFilter === 'Все' || w.status === statusFilter;
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.position.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    total: workers.length,
    active: workers.filter(w => w.status === 'На объекте').length,
    free: workers.filter(w => w.status === 'Свободен').length,
    synced: workers.filter(w => w.sync === '1С').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всего рабочих', value: counts.total, icon: 'Users', color: 'text-primary', bg: 'bg-blue-50' },
          { label: 'На объектах', value: counts.active, icon: 'HardHat', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Свободные', value: counts.free, icon: 'UserCheck', color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Синхронизировано 1С', value: counts.synced, icon: 'RefreshCw', color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-border p-4">
            <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon name={c.icon} size={18} className={c.color} fallback="Circle" />
            </div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по имени или должности..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/70 transition-colors">
            <Icon name="RefreshCw" size={14} />
            Синхр. 1С
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Icon name="UserPlus" size={14} />
            Добавить
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Рабочий</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Должность</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Подразделение</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Телефон</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Статус</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Источник</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((worker, i) => (
                <tr key={worker.id} className={`border-b border-border/50 hover:bg-background/60 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {worker.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{worker.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{worker.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{worker.position}</td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">{worker.department}</td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell font-mono text-xs">{worker.phone}</td>
                  <td className="px-4 py-3.5">
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[worker.status]}`}>
                        {worker.status}
                      </span>
                      {worker.object !== '—' && (
                        <div className="text-xs text-muted-foreground mt-0.5">{worker.object}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 text-xs ${worker.sync === '1С' ? 'text-violet-600' : 'text-muted-foreground'}`}>
                      <Icon name={worker.sync === '1С' ? 'RefreshCw' : 'User'} size={11} />
                      {worker.sync}
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
        </div>
      </div>
    </div>
  );
}
