import { useState } from 'react';
import Icon from '@/components/ui/icon';

const users = [
  { id: 1, name: 'Администратор Системы', email: 'admin@company.ru', role: 'Администратор', status: 'Активен', lastLogin: '02.05.2026, 09:15' },
  { id: 2, name: 'Петров Иван Алексеевич', email: 'petrov@company.ru', role: 'Мастер', status: 'Активен', lastLogin: '02.05.2026, 08:30' },
  { id: 3, name: 'Козлов Владимир Михайлович', email: 'kozlov@company.ru', role: 'Мастер', status: 'Активен', lastLogin: '01.05.2026, 17:45' },
  { id: 4, name: 'Новиков Сергей Викторович', email: 'novikov@company.ru', role: 'Инженер', status: 'Активен', lastLogin: '01.05.2026, 16:00' },
  { id: 5, name: 'Лебедев Константин Олегович', email: 'lebedev@company.ru', role: 'Мастер', status: 'Заблокирован', lastLogin: '25.04.2026, 11:20' },
  { id: 6, name: 'Смирнов Андрей Юрьевич', email: 'smirnov@company.ru', role: 'Инженер', status: 'Активен', lastLogin: '02.05.2026, 10:00' },
];

const roles = [
  { name: 'Администратор', color: 'bg-red-100 text-red-700', desc: 'Полный доступ ко всем разделам и настройкам' },
  { name: 'Инженер', color: 'bg-violet-100 text-violet-700', desc: 'Создание нарядов, просмотр всех разделов, экспорт' },
  { name: 'Мастер', color: 'bg-blue-100 text-blue-700', desc: 'Просмотр и управление своими нарядами' },
];

const roleStyles: Record<string, string> = {
  'Администратор': 'bg-red-100 text-red-700',
  'Инженер': 'bg-violet-100 text-violet-700',
  'Мастер': 'bg-blue-100 text-blue-700',
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'system'>('users');
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-border rounded-xl p-1 w-fit">
        {([
          { id: 'users', label: 'Пользователи', icon: 'Users' },
          { id: 'roles', label: 'Роли и права', icon: 'Shield' },
          { id: 'system', label: 'Система', icon: 'Settings' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.id ? 'bg-primary text-white font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-background'
            }`}
          >
            <Icon name={tab.icon} size={14} fallback="Circle" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск пользователя..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors ml-auto">
              <Icon name="UserPlus" size={15} />
              Добавить
            </button>
          </div>

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/60">
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Пользователь</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Роль</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Последний вход</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Статус</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <tr key={user.id} className={`border-b border-border/50 hover:bg-background/60 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell text-xs">{user.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleStyles[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">{user.lastLogin}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium flex items-center gap-1 ${user.status === 'Активен' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        ● {user.status}
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
        </>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-4">
          {roles.map(role => (
            <div key={role.name} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
                    {role.name}
                  </span>
                  <span className="text-sm text-muted-foreground">{role.desc}</span>
                </div>
                <button className="text-sm text-primary hover:underline">Настроить</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  ['Наряды', 'ClipboardList', role.name !== 'Мастер'],
                  ['База рабочих', 'Users', role.name !== 'Мастер'],
                  ['Объекты', 'Building2', true],
                  ['Архив', 'Archive', true],
                  ['Статистика', 'BarChart3', role.name !== 'Мастер'],
                  ['Администрирование', 'Settings', role.name === 'Администратор'],
                  ['Экспорт PDF', 'FileDown', role.name !== 'Мастер'],
                  ['Экспорт Excel', 'FileSpreadsheet', role.name !== 'Мастер'],
                  ['Управление пользователями', 'UserCog', role.name === 'Администратор'],
                ].map(([label, icon, allowed]) => (
                  <div key={label as string} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${allowed ? 'bg-emerald-50 text-emerald-700' : 'bg-secondary text-muted-foreground'}`}>
                    <Icon name={icon as string} size={13} fallback="Circle" />
                    {label}
                    <Icon name={allowed ? 'Check' : 'X'} size={12} className="ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5 space-y-4">
            <h2 className="font-semibold">Интеграция с 1С</h2>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
              <Icon name="CheckCircle2" size={18} className="text-emerald-600" />
              <div>
                <div className="text-sm font-medium text-emerald-800">Синхронизация активна</div>
                <div className="text-xs text-emerald-600">Последняя синхронизация: 02.05.2026, 08:00</div>
              </div>
              <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors">
                <Icon name="RefreshCw" size={13} />
                Синхр. сейчас
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Адрес сервера 1С</label>
                <input className="w-full px-3 py-2 border border-border rounded-lg bg-background text-muted-foreground" value="192.168.1.100:8080" readOnly />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Интервал синхронизации</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option>Каждый час</option>
                  <option>Каждые 6 часов</option>
                  <option>Раз в сутки</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5 space-y-4">
            <h2 className="font-semibold">Экспорт и архивирование</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Экспорт базы рабочих', icon: 'Users', format: 'Excel' },
                { label: 'Полный архив нарядов', icon: 'Archive', format: 'PDF + Excel' },
                { label: 'Отчёт по статистике', icon: 'BarChart3', format: 'Excel' },
              ].map(e => (
                <button key={e.label} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-colors text-left">
                  <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                    <Icon name={e.icon} size={16} className="text-primary" fallback="Circle" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{e.label}</div>
                    <div className="text-xs text-muted-foreground">{e.format}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
