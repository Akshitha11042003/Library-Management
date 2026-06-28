import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  User as UserIcon,
  Menu,
  X,
  Library,
  BookMarked
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['MEMBER', 'LIBRARIAN'] },
    { name: 'Catalog', path: '/books', icon: BookOpen, roles: ['MEMBER', 'LIBRARIAN'] },
    { name: 'My Borrows', path: '/borrows', icon: BookMarked, roles: ['MEMBER'] },
    { name: 'Members', path: '/members', icon: Users, roles: ['LIBRARIAN'] },
  ];

  const bottomNavItems = [
    { name: 'Profile', path: '/profile', icon: UserIcon },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="space-y-1 py-4 flex-1">
        {navItems
          .filter((item) => !item.roles || item.roles.includes(user?.role || ''))
          .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClick}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative mx-2",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn(
                  "flex-shrink-0 transition-colors", 
                  isSidebarOpen ? "mr-3 w-5 h-5" : "mx-auto w-5 h-5",
                  isActive ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600"
                )} />
                {isSidebarOpen && <span>{item.name}</span>}
              </NavLink>
            );
          })}
      </div>

      <div className="p-2 space-y-1 border-t border-slate-100">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClick}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group mx-2",
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn(
                "flex-shrink-0 transition-colors", 
                isSidebarOpen ? "mr-3 w-5 h-5" : "mx-auto w-5 h-5",
                isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {isSidebarOpen && <span>{item.name}</span>}
            </NavLink>
          );
        })}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 group mx-2 mt-1",
            !isSidebarOpen && "justify-center"
          )}
        >
          <LogOut className={cn("flex-shrink-0 w-5 h-5", isSidebarOpen && "mr-3")} />
          {isSidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="hidden md:flex flex-col bg-white border-r border-slate-200 z-20 flex-shrink-0 transition-all duration-300 ease-in-out"
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-100">
          <div className={cn("flex items-center w-full", isSidebarOpen ? "justify-between" : "justify-center")}>
            {isSidebarOpen && (
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Library className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-slate-900 truncate">Acme Library</span>
              </div>
            )}
            {!isSidebarOpen && (
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => setSidebarOpen(true)}>
                <Library className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
          <NavLinks />
        </div>
      </motion.aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 md:hidden flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Library className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-slate-900">Acme Library</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavLinks onClick={() => setMobileMenuOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="hidden md:flex p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-full px-1.5 py-1.5 pr-4 transition-colors hover:border-slate-300">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
                  {user?.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 leading-none mb-1">{user?.name}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 leading-none">{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
