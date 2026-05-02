import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const AUTH_URL = 'https://functions.poehali.dev/657f0b95-ba26-4bf1-8a1b-481465de6d69';

type Role = 'admin' | 'master' | 'dispatcher' | 'user';
const ROLES: Record<Role, string> = {
  admin: 'Администратор',
  master: 'Мастер',
  dispatcher: 'Диспетчер',
  user: 'Пользователь',
};
const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-red-100 text-red-700',
  master: 'bg-blue-100 text-blue-700',
  dispatcher: 'bg-violet-100 text-violet-700',
  user: 'bg-gray-100 text-gray-600',
};

type User = {
  id: number;
  username: string;
  full_name: string;
  role: Role;
  role_label: string;
  is_active: boolean;
  created_at: string;
};

type ModalType = 'create' | 'password' | 'role' | 'delete' | null;

function authHeaders() {
  const token = localStorage.getItem('auth_token') || '';
  return { 'Content-Type': 'application/json', 'X-Auth-Token': token };
}

async function apiCall(path: string, body: object) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...body, _path: path }),
  });
  return res.json();
}

const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white';
const btnPrimary = 'flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary = 'px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/70 transition-colors';

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-background transition-colors text-muted-foreground">
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('user');
  const [showNewPw, setShowNewPw] = useState(false);

  const [changePw, setChangePw] = useState('');
  const [showChangePw, setShowChangePw] = useState(false);
  const [changeRole, setChangeRole] = useState<Role>('user');

  const currentUser = localStorage.getItem('auth_user') || '';

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = async () => {
    setLoading(true);
    const data = await apiCall('/users', {});
    if (data.ok) setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    if (!newUsername || !newPassword) return;
    const data = await apiCall('/create-user', { username: newUsername, password: newPassword, full_name: newFullName, role: newRole });
    if (data.ok) {
      setUsers(data.users); setModal(null);
      setNewUsername(''); setNewFullName(''); setNewPassword(''); setNewRole('user');
      showToast(data.message);
    } else showToast(data.error, false);
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !changePw) return;
    const data = await apiCall('/change-password', { user_id: selectedUser.id, password: changePw });
    if (data.ok) { setUsers(data.users); setModal(null); setChangePw(''); showToast(data.message); }
    else showToast(data.error, false);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    const data = await apiCall('/update-user', { user_id: selectedUser.id, role: changeRole });
    if (data.ok) { setUsers(data.users); setModal(null); showToast(data.message); }
    else showToast(data.error, false);
  };

  const handleToggle = async (user: User) => {
    const data = await apiCall('/toggle-user', { user_id: user.id });
    if (data.ok) { setUsers(data.users); showToast(data.message); }
    else showToast(data.error, false);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const data = await apiCall('/delete-user', { user_id: selectedUser.id, confirm: true });
    if (data.ok) { setUsers(data.users); setModal(null); setSelectedUser(null); showToast(data.message); }
    else showToast(data.error, false);
  };

  const openModal = (type: ModalType, user?: User) => {
    setSelectedUser(user || null);
    if (type === 'role' && user) setChangeRole(user.role);
    setModal(type);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-fade-in border ${
          toast.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <Icon name={toast.ok ? 'CheckCircle2' : 'AlertCircle'} size={16} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-lg text-foreground">Управление пользователями</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Только для администратора — создание, блокировка, удаление аккаунтов</p>
        </div>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
          <Icon name="UserPlus" size={15} />
          Создать аккаунт
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего', value: users.length, icon: 'Users', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Активных', value: users.filter(u => u.is_active).length, icon: 'UserCheck', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Заблокировано', value: users.filter(u => !u.is_active).length, icon: 'UserX', color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Администраторов', value: users.filter(u => u.role === 'admin').length, icon: 'ShieldCheck', color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon name={s.icon} size={18} className={s.color} fallback="User" />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            Загрузка...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background/60 border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-5 py-3 font-medium">Пользователь</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Логин</th>
                <th className="text-left px-4 py-3 font-medium">Роль</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Создан</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} className={`border-b border-border/40 hover:bg-background/40 transition-colors ${i === users.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        user.is_active ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {(user.full_name || user.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{user.full_name || user.username}</div>
                        {user.username === currentUser && (
                          <div className="text-[10px] text-primary font-medium">это вы</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground hidden sm:table-cell">{user.username}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {user.role_label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground hidden md:table-cell">
                    {user.created_at.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      {user.is_active ? 'Активен' : 'Заблокирован'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openModal('role', user)} title="Изменить роль"
                        disabled={user.username === currentUser}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed">
                        <Icon name="Shield" size={15} />
                      </button>
                      <button onClick={() => openModal('password', user)} title="Сменить пароль"
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-blue-600">
                        <Icon name="KeyRound" size={15} />
                      </button>
                      <button onClick={() => handleToggle(user)}
                        title={user.is_active ? 'Заблокировать' : 'Разблокировать'}
                        disabled={user.username === currentUser}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          user.is_active ? 'hover:bg-orange-50 text-muted-foreground hover:text-orange-600'
                            : 'hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600'}`}>
                        <Icon name={user.is_active ? 'UserX' : 'UserCheck'} size={15} />
                      </button>
                      <button onClick={() => openModal('delete', user)} title="Удалить навсегда"
                        disabled={user.username === currentUser}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Icon name="Trash2" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── МОДАЛКИ ────────────────────────────────────────────────── */}

      {modal === 'create' && (
        <Modal title="Создать аккаунт" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Field label="ФИО">
              <input className={inputCls} value={newFullName} onChange={e => setNewFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
            </Field>
            <Field label="Логин *">
              <input className={inputCls} value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Например: Мастер_Иванов" />
            </Field>
            <Field label="Пароль *">
              <div className="relative">
                <input className={inputCls + ' pr-10'} type={showNewPw ? 'text' : 'password'}
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Минимум 6 символов" />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Icon name={showNewPw ? 'EyeOff' : 'Eye'} size={14} />
                </button>
              </div>
            </Field>
            <Field label="Роль">
              <select className={inputCls} value={newRole} onChange={e => setNewRole(e.target.value as Role)}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <div className="pt-2 flex gap-2">
              <button onClick={handleCreate} disabled={!newUsername || newPassword.length < 6} className={btnPrimary}>
                <Icon name="UserPlus" size={14} /> Создать
              </button>
              <button onClick={() => setModal(null)} className={btnSecondary}>Отмена</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'password' && selectedUser && (
        <Modal title={`Новый пароль — ${selectedUser.full_name || selectedUser.username}`}
          onClose={() => { setModal(null); setChangePw(''); }}>
          <div className="space-y-3">
            <Field label="Новый пароль *">
              <div className="relative">
                <input className={inputCls + ' pr-10'} type={showChangePw ? 'text' : 'password'}
                  value={changePw} onChange={e => setChangePw(e.target.value)} placeholder="Минимум 6 символов" />
                <button type="button" onClick={() => setShowChangePw(!showChangePw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Icon name={showChangePw ? 'EyeOff' : 'Eye'} size={14} />
                </button>
              </div>
            </Field>
            <p className="text-xs text-orange-600 flex items-center gap-1.5">
              <Icon name="Info" size={12} />
              Пользователь будет выкинут и должен войти с новым паролем
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={handleChangePassword} disabled={changePw.length < 6} className={btnPrimary}>
                <Icon name="KeyRound" size={14} /> Сохранить
              </button>
              <button onClick={() => { setModal(null); setChangePw(''); }} className={btnSecondary}>Отмена</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'role' && selectedUser && (
        <Modal title={`Роль — ${selectedUser.full_name || selectedUser.username}`} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Field label="Новая роль">
              <select className={inputCls} value={changeRole} onChange={e => setChangeRole(e.target.value as Role)}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <div className="p-3 bg-background rounded-lg text-xs space-y-1 text-muted-foreground">
              <div><span className="font-semibold text-red-600">Администратор</span> — полный доступ, управление пользователями</div>
              <div><span className="font-semibold text-blue-600">Мастер</span> — создание и ведение нарядов</div>
              <div><span className="font-semibold text-violet-600">Диспетчер</span> — просмотр, табель</div>
              <div><span className="font-semibold text-gray-500">Пользователь</span> — только просмотр</div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleUpdateRole} className={btnPrimary}>
                <Icon name="Shield" size={14} /> Сохранить
              </button>
              <button onClick={() => setModal(null)} className={btnSecondary}>Отмена</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'delete' && selectedUser && (
        <Modal title="Удалить навсегда?" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-1.5">
                <Icon name="AlertTriangle" size={16} /> Это действие необратимо
              </div>
              <div className="text-sm text-red-600">
                Пользователь <strong>{selectedUser.full_name || selectedUser.username}</strong> будет удалён из системы навсегда.
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                <Icon name="Trash2" size={14} /> Удалить навсегда
              </button>
              <button onClick={() => setModal(null)} className={btnSecondary + ' flex-1 text-center'}>Отмена</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
