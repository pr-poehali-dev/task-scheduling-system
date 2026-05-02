import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/cb72893c-16e7-40a8-ad51-33cdeed88596';

type FileType = 'employees' | 'work_types' | 'timesheet' | 'orders';
type DebugResult = { sheets: string[]; preview: Record<string, string[][]> } | null;

const FILE_CONFIGS: {
  type: FileType;
  label: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
  hint: string;
}[] = [
  {
    type: 'employees',
    label: 'Штатные сотрудники',
    description: 'Выгрузка из 1С: ФИО, должность, табельный номер',
    icon: 'Users',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    hint: 'Файл "штатные сотрудники.xlsx"',
  },
  {
    type: 'work_types',
    label: 'Виды работ',
    description: 'Справочник видов работ с нормативами',
    icon: 'Leaf',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    hint: 'Файл "виды работ.xlsx"',
  },
  {
    type: 'timesheet',
    label: 'Табель',
    description: 'Табель учёта рабочего времени по месяцам',
    icon: 'CalendarDays',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    hint: 'Файл "табель.xlsx" (листы: ИТР, Водители, Рабочие, Уборщики)',
  },
  {
    type: 'orders',
    label: 'Наряд-задание',
    description: 'Наряды с бригадами и режимом работы',
    icon: 'ClipboardList',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    hint: 'Файл "Наряд задание.xlsx" (листы по мастерам)',
  },
];

type ImportResult = {
  ok: boolean;
  imported: number;
  errors: number;
  warning?: string;
  error?: string;
};

type FileState = {
  file: File | null;
  status: 'idle' | 'loading' | 'done' | 'error';
  result: ImportResult | null;
};

export default function Import() {
  const [files, setFiles] = useState<Record<FileType, FileState>>({
    employees: { file: null, status: 'idle', result: null },
    work_types: { file: null, status: 'idle', result: null },
    timesheet: { file: null, status: 'idle', result: null },
    orders: { file: null, status: 'idle', result: null },
  });
  const [log, setLog] = useState<{ time: string; msg: string; ok: boolean }[]>([]);
  const [debugResult, setDebugResult] = useState<DebugResult>(null);
  const [debugLoading, setDebugLoading] = useState<FileType | null>(null);
  const inputRefs = useRef<Record<FileType, HTMLInputElement | null>>({
    employees: null, work_types: null, timesheet: null, orders: null,
  });

  const addLog = (msg: string, ok: boolean) => {
    setLog(prev => [{ time: new Date().toLocaleTimeString('ru'), msg, ok }, ...prev.slice(0, 29)]);
  };

  const handleFileSelect = (type: FileType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles(prev => ({
      ...prev,
      [type]: { file, status: 'idle', result: null },
    }));
  };

  const handleUpload = async (type: FileType) => {
    const fileState = files[type];
    if (!fileState.file) return;

    setFiles(prev => ({ ...prev, [type]: { ...prev[type], status: 'loading' } }));
    addLog(`Загружаю: ${fileState.file!.name}`, true);

    try {
      const b64 = await fileToBase64(fileState.file!);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: b64,
          type,
          name: fileState.file!.name,
        }),
      });

      const data: ImportResult = await res.json();

      if (data.ok) {
        setFiles(prev => ({ ...prev, [type]: { ...prev[type], status: 'done', result: data } }));
        addLog(`✓ ${FILE_CONFIGS.find(c => c.type === type)?.label}: импортировано ${data.imported} записей`, true);
      } else {
        setFiles(prev => ({ ...prev, [type]: { ...prev[type], status: 'error', result: data } }));
        addLog(`✗ Ошибка: ${data.error}`, false);
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Неизвестная ошибка';
      setFiles(prev => ({
        ...prev,
        [type]: { ...prev[type], status: 'error', result: { ok: false, imported: 0, errors: 1, error: errMsg } },
      }));
      addLog(`✗ Ошибка сети: ${errMsg}`, false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // result = "data:...;base64,XXXX" — берём только часть после запятой
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDebug = async (type: FileType) => {
    const fileState = files[type];
    if (!fileState.file) return;
    setDebugLoading(type);
    setDebugResult(null);
    try {
      const b64 = await fileToBase64(fileState.file!);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: b64, type: 'debug', name: fileState.file!.name }),
      });
      const data = await res.json();
      setDebugResult(data);
      addLog(`Диагностика: ${data.sheets?.length || 0} листов`, true);
    } catch (e: unknown) {
      addLog(`Ошибка диагностики: ${e instanceof Error ? e.message : ''}`, false);
    }
    setDebugLoading(null);
  };

  const handleDrop = (type: FileType, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setFiles(prev => ({ ...prev, [type]: { file, status: 'idle', result: null } }));
    }
  };

  const totalImported = Object.values(files).reduce((s, f) => s + (f.result?.imported || 0), 0);
  const anyLoading = Object.values(files).some(f => f.status === 'loading');

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-foreground text-lg">Импорт данных из Excel</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Загружайте Excel-файлы — система автоматически разберёт все листы и сохранит данные в базу
          </p>
        </div>
        {totalImported > 0 && (
          <div className="shrink-0 text-right">
            <div className="text-2xl font-bold text-primary">{totalImported}</div>
            <div className="text-xs text-muted-foreground">записей загружено</div>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FILE_CONFIGS.map(cfg => {
          const state = files[cfg.type];
          const isDone = state.status === 'done';
          const isError = state.status === 'error';
          const isLoading = state.status === 'loading';

          return (
            <div
              key={cfg.type}
              className={`bg-white rounded-xl border-2 transition-all ${
                isDone ? 'border-emerald-400' :
                isError ? 'border-red-300' :
                state.file ? 'border-primary/50' :
                'border-border'
              }`}
              onDrop={e => handleDrop(cfg.type, e)}
              onDragOver={e => e.preventDefault()}
            >
              <div className="p-4">
                {/* Top */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                    {isDone ? (
                      <Icon name="CheckCircle2" size={20} className="text-emerald-600" />
                    ) : isError ? (
                      <Icon name="AlertCircle" size={20} className="text-red-500" />
                    ) : (
                      <Icon name={cfg.icon} size={20} className={cfg.color} fallback="FileSpreadsheet" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{cfg.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{cfg.description}</div>
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  className={`relative rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors mb-3 ${
                    state.file ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-background/60'
                  }`}
                  onClick={() => inputRefs.current[cfg.type]?.click()}
                >
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    ref={el => { inputRefs.current[cfg.type] = el; }}
                    onChange={e => handleFileSelect(cfg.type, e)}
                  />
                  {state.file ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Icon name="FileSpreadsheet" size={16} className="text-primary" />
                      <span className="font-medium text-foreground truncate max-w-[200px]">{state.file.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({(state.file.size / 1024).toFixed(0)} КБ)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Icon name="Upload" size={20} className="text-muted-foreground mx-auto mb-1" />
                      <div className="text-xs text-muted-foreground">
                        Перетащите файл или <span className="text-primary">выберите</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground/70 mt-1">{cfg.hint}</div>
                    </div>
                  )}
                </div>

                {/* Result */}
                {isDone && state.result && (
                  <div className="mb-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 text-xs text-emerald-700">
                      <Icon name="CheckCircle2" size={13} />
                      <span className="font-semibold">Импортировано: {state.result.imported} записей</span>
                      {state.result.errors > 0 && (
                        <span className="text-orange-600 ml-1">({state.result.errors} ошибок)</span>
                      )}
                    </div>
                    {state.result.warning && (
                      <div className="text-[10px] text-orange-600 mt-1">{state.result.warning}</div>
                    )}
                  </div>
                )}

                {isError && state.result && (
                  <div className="mb-3 p-2.5 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-xs text-red-700">
                      <Icon name="AlertCircle" size={13} />
                      <span>{state.result.error || 'Ошибка при импорте'}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpload(cfg.type)}
                    disabled={!state.file || isLoading}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      !state.file
                        ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                        : isLoading
                        ? 'bg-primary/70 text-white cursor-wait'
                        : isDone
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Обрабатываю...
                      </>
                    ) : isDone ? (
                      <>
                        <Icon name="RefreshCw" size={14} />
                        Заново
                      </>
                    ) : (
                      <>
                        <Icon name="Upload" size={14} />
                        Импортировать
                      </>
                    )}
                  </button>
                  {state.file && (
                    <button
                      onClick={() => handleDebug(cfg.type)}
                      disabled={debugLoading === cfg.type}
                      title="Диагностика — показать структуру файла"
                      className="px-3 py-2 rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors text-sm"
                    >
                      {debugLoading === cfg.type
                        ? <div className="w-4 h-4 border-2 border-muted/30 border-t-primary rounded-full animate-spin" />
                        : <Icon name="ScanSearch" size={15} />
                      }
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Порядок загрузки */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Icon name="Info" size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-800 mb-1">Рекомендуемый порядок загрузки</div>
            <div className="text-xs text-amber-700 space-y-0.5">
              <div>1. Сначала загрузите <strong>Штатные сотрудники</strong> — создаётся база персонала</div>
              <div>2. Затем <strong>Виды работ</strong> — справочник</div>
              <div>3. <strong>Табель</strong> — привяжется к сотрудникам автоматически</div>
              <div>4. <strong>Наряд-задание</strong> — привяжет работников из базы</div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug result */}
      {debugResult && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-background/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="ScanSearch" size={14} className="text-primary" />
              <span className="text-sm font-medium">Структура файла — диагностика</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{debugResult.sheets.length} листов</span>
              <button onClick={() => setDebugResult(null)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={14} />
              </button>
            </div>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {debugResult.sheets.map(sheet => (
              <div key={sheet}>
                <div className="text-xs font-semibold text-primary mb-2">Лист: {sheet}</div>
                <div className="overflow-x-auto">
                  <table className="text-xs border-collapse w-full">
                    {(debugResult.preview[sheet] || []).map((row, ri) => (
                      <tr key={ri} className={ri === 0 ? 'bg-background/60 font-medium' : 'hover:bg-background/40'}>
                        <td className="border border-border/30 px-1 py-0.5 text-muted-foreground w-6 text-center">{ri + 1}</td>
                        {row.map((cell, ci) => (
                          <td key={ci} className={`border border-border/30 px-2 py-0.5 max-w-[150px] truncate ${cell ? '' : 'text-border'}`}>
                            {cell || '·'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-background/40 flex items-center gap-2">
            <Icon name="Terminal" size={14} className="text-muted-foreground" />
            <span className="text-sm font-medium">Лог импорта</span>
          </div>
          <div className="p-3 space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
            {log.map((entry, i) => (
              <div key={i} className={`flex gap-2 ${entry.ok ? 'text-foreground' : 'text-red-600'}`}>
                <span className="text-muted-foreground shrink-0">{entry.time}</span>
                <span>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}