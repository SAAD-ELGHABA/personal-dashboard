import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Workflow, 
  Briefcase, 
  Key, 
  Settings, 
  LogOut,
  Bot,
  FolderKanban,
  BookOpen,
  Boxes
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'n8n Stats', path: '/n8n', icon: Workflow },
  { name: 'Portfolio Stats', path: '/portfolio', icon: Briefcase },
  { name: 'AI Models', path: '/ai-models', icon: Bot },
  { name: 'Model Types', path: '/model-types', icon: Boxes },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'My Blogs', path: '/blogs', icon: BookOpen },
  { name: 'API Management', path: '/api-tokens', icon: Key },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r border-border">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Personal Analytics</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};
