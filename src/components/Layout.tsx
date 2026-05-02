import { useState } from 'react';
import Sidebar from './Sidebar';
import Icon from '@/components/ui/icon';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitles: Record<string, string> = {
    dashboard: 'План работ на день',
    orders: 'Наряды-задания',
    workers: 'Табель персонала',
    objects: 'Виды работ',
    archive: 'Архив нарядов',
    statistics: 'Статистика и отчёты',
    admin: 'Администрирование',
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar currentPage={currentPage} onNavigate={(page) => { onNavigate(page); setSidebarOpen(false); }} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-border flex items-center px-4 gap-4 shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-secondary transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="Menu" size={20} />
          </button>
          <h1 className="text-base font-semibold text-foreground">{pageTitles[currentPage] ?? 'НарядПро'}</h1>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground">
              <Icon name="Bell" size={18} />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-accent rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                АД
              </div>
              <div className="hidden sm:block text-sm">
                <div className="font-medium leading-tight">Администратор</div>
                <div className="text-xs text-muted-foreground leading-tight">admin@company.ru</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}