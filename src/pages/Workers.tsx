import { useState } from 'react';
import Icon from '@/components/ui/icon';

type TabCategory = 'Рабочие' | 'Водители' | 'ИТР' | 'Уборщики';

type Employee = {
  id: number;
  фио: string;
  должность: string;
  табельный: string;
  категория: TabCategory;
  дни: Record<number, string>; // 1..31 → '' | 'Я' | 'В' | 'Б' | 'О'
};

const MONTH_YEAR = 'Май 2026 г.';
const DAYS_IN_MONTH = 31;
const WEEKENDS = [2, 3, 9, 10, 16, 17, 23, 24, 30, 31]; // сб, вс мая 2026

function makeDays(workDays: number[]): Record<number, string> {
  const d: Record<number, string> = {};
  for (let i = 1; i <= DAYS_IN_MONTH; i++) {
    if (WEEKENDS.includes(i)) d[i] = 'В';
    else if (workDays.includes(i)) d[i] = 'Я';
    else d[i] = '';
  }
  return d;
}

const allEmployees: Employee[] = [
  // Рабочие
  { id: 1, фио: 'Амельчакова С.В.', должность: 'Рабочий зеленого хоз-ва (3 раз.)', табельный: '816', категория: 'Рабочие', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
  { id: 2, фио: 'Ананьин А.Е.', должность: 'Рабочий зеленого хоз-ва (6 р.) (сезонный)', табельный: '804', категория: 'Рабочие', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22]) },
  { id: 3, фио: 'Беженов В.В.', должность: 'Рабочий зеленого хоз-ва (4 раз.)', табельный: '476', категория: 'Рабочие', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
  { id: 4, фио: 'Белашов Д.П.', должность: 'Рабочий зеленого хоз-ва (6 р.) (сезонный)', табельный: '512', категория: 'Рабочие', дни: makeDays([1,4,5,6,7,8,11]) },
  { id: 5, фио: 'Бескопыльная И.А.', должность: 'Рабочий зеленого хоз-ва (3 раз.)', табельный: '388', категория: 'Рабочие', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
  { id: 6, фио: 'Бондаренко А.А.', должность: 'Рабочий зеленого хоз-ва (3 раз.)', табельный: '259', категория: 'Рабочие', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15]) },
  { id: 7, фио: 'Бондаренко С.Я.', должность: 'Рабочий зеленого хоз-ва (3 раз.)', табельный: '341', категория: 'Рабочие', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
  { id: 8, фио: 'Борговяк В.В.', должность: 'Рабочий зеленого хоз-ва (3 раз.)', табельный: '290', категория: 'Рабочие', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
  // Водители
  { id: 20, фио: 'Аев О.П.', должность: 'Водитель автомобиля', табельный: '359', категория: 'Водители', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
  { id: 21, фио: 'Александров С.И.', должность: 'Водитель автомобиля', табельный: '683', категория: 'Водители', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
  { id: 22, фио: 'Бабков А.И.', должность: 'Водитель автомобиля', табельный: '330', категория: 'Водители', дни: makeDays([1,4,5,6,7,8,11,12]) },
  { id: 23, фио: 'Васильев И.Е.', должность: 'Водитель автомобиля', табельный: '190', категория: 'Водители', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22]) },
  { id: 24, фио: 'Евипенко А.Г.', должность: 'Водитель автомобиля', табельный: '652', категория: 'Водители', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15]) },
  // ИТР
  { id: 40, фио: 'Понамарев Е.С.', должность: 'Мастер озеленения', табельный: '101', категория: 'ИТР', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
  { id: 41, фио: 'Вершинина О.В.', должность: 'Мастер озеленения', табельный: '102', категория: 'ИТР', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
  { id: 42, фио: 'Скоробогатый К.В.', должность: 'Гл. инженер', табельный: '001', категория: 'ИТР', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
  // Уборщики
  { id: 60, фио: 'Иванова М.С.', должность: 'Уборщик территорий', табельный: '501', категория: 'Уборщики', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
  { id: 61, фио: 'Петрова Г.А.', должность: 'Уборщик территорий', табельный: '502', категория: 'Уборщики', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18]) },
  { id: 62, фио: 'Сидорова Н.И.', должность: 'Уборщик территорий', табельный: '503', категория: 'Уборщики', дни: makeDays([1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]) },
];

const MARK_LABELS: Record<string, string> = {
  'Я': 'Явка',
  'В': 'Выходной',
  'Б': 'Больничный',
  'О': 'Отпуск',
  '': 'Нет данных',
};

const dayColors: Record<string, string> = {
  'Я': 'bg-yellow-300 text-yellow-900',
  'В': 'bg-gray-100 text-gray-400',
  'Б': 'bg-red-200 text-red-700',
  'О': 'bg-blue-200 text-blue-700',
  '': 'bg-white text-gray-200',
};

const CATEGORIES: TabCategory[] = ['Рабочие', 'Водители', 'ИТР', 'Уборщики'];

export default function Workers() {
  const [category, setCategory] = useState<TabCategory>('Рабочие');
  const [search, setSearch] = useState('');

  const employees = allEmployees.filter(e => {
    const matchCat = e.категория === category;
    const matchSearch = !search || e.фио.toLowerCase().includes(search.toLowerCase()) || e.должность.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);

  const countMark = (emp: Employee, mark: string) =>
    Object.values(emp.дни).filter(v => v === mark).length;

  return (
    <div className="max-w-full animate-fade-in">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Табель учёта рабочего времени</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Персонал МБУ г. Абакана "Абаканское парковое хозяйство" — {MONTH_YEAR}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/70 transition-colors">
            <Icon name="Download" size={14} />
            Экспорт
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-4 bg-white border border-border rounded-lg p-1 w-fit">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 text-sm rounded-md transition-all font-medium ${
              category === cat
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
            <span className={`ml-1.5 text-xs font-normal ${category === cat ? 'text-white/70' : 'text-muted-foreground'}`}>
              ({allEmployees.filter(e => e.категория === cat).length})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3 max-w-xs">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск по ФИО..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-3 flex-wrap">
        {Object.entries(MARK_LABELS).filter(([k]) => k !== '').map(([mark, label]) => (
          <div key={mark} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`inline-block w-5 h-5 rounded text-center text-xs font-bold leading-5 ${dayColors[mark]}`}>
              {mark}
            </span>
            {label}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse" style={{ minWidth: '900px' }}>
            <thead>
              <tr className="bg-background/80 border-b border-border">
                <th className="sticky left-0 bg-background/80 z-10 text-left px-3 py-2.5 font-semibold w-8 border-r border-border">№</th>
                <th className="sticky left-8 bg-background/80 z-10 text-left px-3 py-2.5 font-semibold min-w-[140px] border-r border-border">Должность</th>
                <th className="sticky left-[212px] bg-background/80 z-10 text-left px-3 py-2.5 font-semibold min-w-[160px] border-r border-border">Фамилия, инициалы</th>
                {days.map(d => (
                  <th
                    key={d}
                    className={`px-1 py-2.5 text-center font-medium w-7 ${WEEKENDS.includes(d) ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    {d}
                  </th>
                ))}
                <th className="px-2 py-2.5 text-center font-semibold border-l border-border text-primary">Я</th>
                <th className="px-2 py-2.5 text-center font-semibold text-muted-foreground">В</th>
                <th className="px-2 py-2.5 text-center font-semibold text-red-500">Б</th>
                <th className="px-2 py-2.5 text-center font-semibold text-blue-500">О</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => (
                <tr key={emp.id} className={`border-b border-border/50 hover:bg-yellow-50/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-background/30'}`}>
                  <td className="sticky left-0 bg-white z-10 px-3 py-2 text-muted-foreground border-r border-border/50 text-center">{idx + 1}</td>
                  <td className="sticky left-8 bg-white z-10 px-3 py-2 border-r border-border/50 max-w-[140px] leading-tight text-muted-foreground">{emp.должность}</td>
                  <td className="sticky left-[212px] bg-white z-10 px-3 py-2 border-r border-border/50 font-medium whitespace-nowrap">{emp.фио}</td>
                  {days.map(d => (
                    <td key={d} className="px-0.5 py-1 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold cursor-default ${dayColors[emp.дни[d] ?? '']}`}
                        title={`${emp.фио} — день ${d}: ${MARK_LABELS[emp.дни[d] ?? ''] ?? ''}`}
                      >
                        {emp.дни[d] || ''}
                      </span>
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-bold text-yellow-700 border-l border-border/50">{countMark(emp, 'Я')}</td>
                  <td className="px-2 py-2 text-center text-muted-foreground">{countMark(emp, 'В')}</td>
                  <td className="px-2 py-2 text-center text-red-500">{countMark(emp, 'Б') || ''}</td>
                  <td className="px-2 py-2 text-center text-blue-500">{countMark(emp, 'О') || ''}</td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={DAYS_IN_MONTH + 7} className="py-10 text-center text-muted-foreground">
                    Сотрудники не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Всего по категории "{category}": <strong>{employees.length}</strong> сотрудников
      </div>
    </div>
  );
}
