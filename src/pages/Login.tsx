import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const AUTH_URL = 'https://functions.poehali.dev/657f0b95-ba26-4bf1-8a1b-481465de6d69';
const PARK_IMG = 'https://cdn.poehali.dev/projects/40548ce4-6dc7-410b-b3a2-5cb111635781/bucket/825777b3-2146-42eb-a32a-b4189d6e7288.jpg';

interface LoginProps {
  onLogin: (token: string, username: string, role: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fountainHint, setFountainHint] = useState(false);

  // Авто-создание первого администратора при первом визите
  useEffect(() => {
    fetch(`${AUTH_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Администратор',
        password: 'Cehbrfns25&Vfyuecns77!',
        full_name: 'Администратор',
        role: 'admin',
        setup_key: 'APX_SETUP_2026',
        _path: '/setup',
      }),
    }).catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, _path: '/login' }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', data.username);
        localStorage.setItem('auth_role', data.role);
        onLogin(data.token, data.username, data.role);
      } else {
        setError(data.error || 'Неверный логин или пароль');
      }
    } catch {
      setError('Ошибка подключения к серверу');
    }
    setLoading(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      {/* Фоновое фото парка */}
      <img
        src={PARK_IMG}
        alt="Парк Преображенский, Абакан"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: 'center 30%' }}
      />

      {/* Тонкий оверлей для читаемости */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />

      {/* Заголовок вверху */}
      <div className="absolute top-6 left-0 right-0 flex flex-col items-center gap-1 z-10">
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/30 shadow-lg">
          <Icon name="Leaf" size={18} className="text-white" />
          <span className="text-white font-bold text-sm tracking-wide">МБУ "Абаканское парковое хозяйство"</span>
        </div>
        <div className="text-white/70 text-xs mt-1">Парк Преображенский · Абакан</div>
      </div>

      {/* Кликабельный фонтан — скрытая зона */}
      <button
        className="absolute z-10 cursor-pointer group"
        style={{ right: '34%', top: '28%', width: 90, height: 110 }}
        onClick={() => setShowForm(true)}
        onMouseEnter={() => setFountainHint(true)}
        onMouseLeave={() => setFountainHint(false)}
        title="Вход в систему"
        aria-label="Открыть вход в систему"
      >
        {/* Невидимая зона — никакой рамки */}
        <div className="w-full h-full rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500
          bg-white/10 backdrop-blur-sm border border-white/20" />
      </button>

      {/* Подсказка при наведении на фонтан */}
      {fountainHint && !showForm && (
        <div
          className="absolute z-20 pointer-events-none animate-fade-in"
          style={{ right: '28%', top: '20%' }}
        >
          <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1.5 rounded-full shadow-lg border border-white/50 flex items-center gap-1.5">
            <Icon name="LogIn" size={12} className="text-primary" />
            Войти в систему
          </div>
        </div>
      )}

      {/* Нижняя подпись */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
        <div className="text-white/50 text-xs">
          © 2026 МБУ АПХ Абакан · Система управления нарядами
        </div>
      </div>

      {/* Форма авторизации */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
            {/* Шапка формы с мини-фото */}
            <div className="relative h-28 overflow-hidden">
              <img src={PARK_IMG} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <div className="text-white font-bold text-base leading-tight">Вход в систему</div>
                  <div className="text-white/70 text-xs">АПХ Абакан</div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-white/70 hover:text-white transition-colors p-1"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
            </div>

            {/* Форма */}
            <form onSubmit={handleLogin} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Логин
                </label>
                <div className="relative">
                  <Icon name="User" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Введите логин"
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Пароль
                </label>
                <div className="relative">
                  <Icon name="Lock" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={15} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 animate-fade-in">
                  <Icon name="AlertCircle" size={13} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Вхожу...
                  </>
                ) : (
                  <>
                    <Icon name="LogIn" size={15} />
                    Войти
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
