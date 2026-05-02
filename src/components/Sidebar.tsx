import Icon from '@/components/ui/icon';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'План работ', icon: 'LayoutDashboard' },
  { id: 'orders', label: 'Наряды-задания', icon: 'ClipboardList', badge: 2 },
  { id: 'workers', label: 'Табель персонала', icon: 'CalendarDays' },
  { id: 'objects', label: 'Виды работ', icon: 'Leaf' },
  { id: 'archive', label: 'Архив нарядов', icon: 'Archive' },
  { id: 'statistics', label: 'Статистика', icon: 'BarChart3' },
];

const adminItems: NavItem[] = [
  { id: 'import', label: 'Импорт Excel', icon: 'FileUp' },
  { id: 'admin', label: 'Администрирование', icon: 'Settings' },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-60 h-full bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-sidebar-primary flex items-center justify-center">
            <Icon name="Leaf" size={14} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">АПХ Абакан</div>
            <div className="text-sidebar-foreground/50 text-[10px] leading-tight">Парковое хозяйство</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <div className="mb-4">
          <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Главное
          </p>
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={currentPage === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </div>

        <div>
          <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Система
          </p>
          {adminItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={currentPage === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors text-sm">
          <Icon name="LogOut" size={15} />
          <span>Выйти</span>
        </div>
      </div>
    </aside>
  );
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2.5 px-2 py-2 rounded-md mb-0.5 text-sm transition-all duration-150 text-left
        ${active
          ? 'bg-sidebar-primary text-white font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        }
      `}
    >
      <Icon name={item.icon} size={16} fallback="Circle" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className={`
          text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
          ${active ? 'bg-white/20 text-white' : 'bg-accent text-white'}
        `}>
          {item.badge}
        </span>
      )}
    </button>
  );
}