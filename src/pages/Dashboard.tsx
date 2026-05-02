import { useState } from 'react';
import Icon from '@/components/ui/icon';

const TODAY = '1 мая 2026 г.';
const TODAY_DATE = new Date(2026, 4, 1);

const planRows = [
  { category: 'Уборщики', штатПост: 10, штатСез: 0, фактПост: 9, фактСез: 0, больничный: 0, отпуск: 0, прочее: 0, вакансии: 1 },
  { category: 'Рабочие', штатПост: 58, штатСез: 0, фактПост: 50, фактСез: 0, больничный: 0, отпуск: 0, прочее: 2, вакансии: 0 },
  { category: 'Водители', штатПост: 13, штатСез: 0, фактПост: 10, фактСез: 0, больничный: 0, отпуск: 0, прочее: 0, вакансии: 3 },
  { category: 'Отработчики', штатПост: 1, штатСез: 0, фактПост: 0, фактСез: 0, больничный: 0, отпуск: 0, прочее: 1, вакансии: 0 },
];

const workGroups = [
  {
    id: 'АПХ-001',
    name: 'Содержание территорий парков и скверов — Уборка парков и скверов',
    уборщики: 9, рзх: 0, водители: 0, отработчики: 0,
    доляТР: 100,
    детали: 'Уборка закреплённых территорий: Победы, Черногорский, Привокзальный, Мамонтёнок, Милосердия, Челюскинцев, 6, Комсомольский, Рублёва, Баранка, Алиса, Леопольд, Аскизская, 158, 160, И. Ярыгина',
  },
  {
    id: 'АПХ-002',
    name: 'Содержание территорий парков и скверов — Уборка газонов',
    уборщики: 0, рзх: 12, водители: 2, отработчики: 0,
    доляТР: 80,
    детали: 'Стрижка газонов, сбор и вывоз скошенной травы, полив зелёных насаждений',
  },
  {
    id: 'АПХ-003',
    name: 'Ремонт МАФ и оборудования',
    уборщики: 0, рзх: 8, водители: 2, отработчики: 1,
    доляТР: 60,
    детали: 'Ремонт скамеек, урн, спортивного оборудования на объектах города',
  },
  {
    id: 'АПХ-004',
    name: 'Посадка и уход за цветниками',
    уборщики: 0, рзх: 10, водители: 1, отработчики: 0,
    доляТР: 75,
    детали: 'Посадка рассады, прополка, полив цветников на центральных улицах города',
  },
];

const итого = {
  штат: planRows.reduce((s, r) => s + r.штатПост + r.штатСез, 0),
  факт: planRows.reduce((s, r) => s + r.фактПост + r.фактСез, 0),
  больничный: planRows.reduce((s, r) => s + r.больничный, 0),
  отпуск: planRows.reduce((s, r) => s + r.отпуск, 0),
  прочее: planRows.reduce((s, r) => s + r.прочее, 0),
  вакансии: planRows.reduce((s, r) => s + r.вакансии, 0),
};

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Муниципальное бюджетное учреждение города Абакана
          </div>
          <div className="text-base font-bold text-foreground mb-3">
            "Абаканское парковое хозяйство"
          </div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-semibold text-sm">
            <Icon name="Calendar" size={15} />
            ПЛАН РАБОТ на {TODAY}
          </div>
        </div>
      </div>

      {/* Сводная таблица */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-background/40 flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Icon name="Users" size={15} className="text-primary" />
            Персонал на день
          </h2>
          <button
            onClick={() => onNavigate('workers')}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Табель <Icon name="ChevronRight" size={13} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background/60 border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">Категория</th>
                <th className="text-center px-3 py-2.5 font-medium">Штат</th>
                <th className="text-center px-3 py-2.5 font-medium">Факт</th>
                <th className="text-center px-3 py-2.5 font-medium hidden md:table-cell">Больничный</th>
                <th className="text-center px-3 py-2.5 font-medium hidden md:table-cell">Отпуск</th>
                <th className="text-center px-3 py-2.5 font-medium hidden md:table-cell">Прочее</th>
                <th className="text-center px-3 py-2.5 font-medium">Вакансии</th>
                <th className="text-center px-3 py-2.5 font-medium">% явки</th>
              </tr>
            </thead>
            <tbody>
              {planRows.map((row, i) => {
                const totalШтат = row.штатПост + row.штатСез;
                const totalФакт = row.фактПост + row.фактСез;
                const явка = totalШтат > 0 ? Math.round((totalФакт / totalШтат) * 100) : 0;
                return (
                  <tr key={row.category} className={`border-b border-border/50 hover:bg-background/40 transition-colors ${i === planRows.length - 1 ? '' : ''}`}>
                    <td className="px-4 py-3 font-medium">{row.category}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{totalШтат}</td>
                    <td className="px-3 py-3 text-center font-semibold text-foreground">{totalФакт}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground hidden md:table-cell">{row.больничный || '—'}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground hidden md:table-cell">{row.отпуск || '—'}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground hidden md:table-cell">{row.прочее || '—'}</td>
                    <td className="px-3 py-3 text-center">
                      {row.вакансии > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-100 text-red-600 font-medium">{row.вакансии}</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-semibold ${явка >= 90 ? 'text-emerald-600' : явка >= 70 ? 'text-orange-500' : 'text-red-600'}`}>
                        {явка}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Итого */}
              <tr className="bg-primary/5 border-t-2 border-primary/20 font-semibold text-sm">
                <td className="px-4 py-3">Итого</td>
                <td className="px-3 py-3 text-center">{итого.штат}</td>
                <td className="px-3 py-3 text-center text-primary">{итого.факт}</td>
                <td className="px-3 py-3 text-center hidden md:table-cell text-muted-foreground">{итого.больничный || '—'}</td>
                <td className="px-3 py-3 text-center hidden md:table-cell text-muted-foreground">{итого.отпуск || '—'}</td>
                <td className="px-3 py-3 text-center hidden md:table-cell text-muted-foreground">{итого.прочее || '—'}</td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-100 text-red-600 font-medium">{итого.вакансии}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-xs font-bold text-emerald-600">
                    {Math.round((итого.факт / итого.штат) * 100)}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Распределение по видам работ */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-background/40 flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Icon name="ClipboardList" size={15} className="text-primary" />
            Распределение по видам работ
          </h2>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Все наряды <Icon name="ChevronRight" size={13} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background/60 border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">Учётный номер и наименование группы работ</th>
                <th className="text-center px-3 py-2.5 font-medium">Уборщ.</th>
                <th className="text-center px-3 py-2.5 font-medium">РЗХ</th>
                <th className="text-center px-3 py-2.5 font-medium">Водит.</th>
                <th className="text-center px-3 py-2.5 font-medium hidden md:table-cell">Отраб.</th>
                <th className="text-center px-3 py-2.5 font-medium hidden md:table-cell">Доля ТР, %</th>
                <th className="px-3 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {workGroups.map((group) => (
                <>
                  <tr
                    key={group.id}
                    className="border-b border-border/50 hover:bg-background/40 transition-colors cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === group.id ? null : group.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-xs text-primary mb-0.5">{group.id}</div>
                      <div className="text-sm leading-snug">{group.name}</div>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold">{group.уборщики || '—'}</td>
                    <td className="px-3 py-3 text-center font-semibold">{group.рзх || '—'}</td>
                    <td className="px-3 py-3 text-center font-semibold">{group.водители || '—'}</td>
                    <td className="px-3 py-3 text-center hidden md:table-cell font-semibold">{group.отработчики || '—'}</td>
                    <td className="px-3 py-3 text-center hidden md:table-cell">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="flex-1 max-w-[60px] bg-border rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${group.доляТР}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{group.доляТР}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <Icon name={expandedRow === group.id ? 'ChevronUp' : 'ChevronDown'} size={14} />
                    </td>
                  </tr>
                  {expandedRow === group.id && (
                    <tr className="bg-blue-50/50 border-b border-border/50">
                      <td colSpan={7} className="px-6 py-3">
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          <span className="font-medium text-foreground">Детальная информация: </span>
                          {group.детали}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Создать наряд', icon: 'FilePlus', page: 'orders', primary: true },
          { label: 'Табель персонала', icon: 'CalendarDays', page: 'workers', primary: false },
          { label: 'Виды работ', icon: 'ListChecks', page: 'objects', primary: false },
          { label: 'Архив нарядов', icon: 'Archive', page: 'archive', primary: false },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => onNavigate(action.page)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-sm font-medium hover:shadow-sm ${
              action.primary
                ? 'bg-primary text-white border-primary hover:bg-primary/90'
                : 'bg-white text-foreground border-border hover:border-primary/40'
            }`}
          >
            <Icon name={action.icon} size={20} fallback="Circle" className={action.primary ? 'text-white' : 'text-primary'} />
            <span className="text-center leading-tight">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
