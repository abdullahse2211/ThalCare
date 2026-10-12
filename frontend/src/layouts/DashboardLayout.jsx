/**
 * ThalCare Dashboard Layout
 */

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  Activity,
  BarChart3,
  Settings,
  UserPlus,
  Upload,
  FileText,
  Cog,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { useAuth, UserRoles } from '../context/AuthContext';
import { NAVIGATION_ITEMS } from '../constants';
import { Avatar } from '../components/common';
import { cn } from '../utils';

// Icon mapping
const iconMap = {
  LayoutDashboard,
  Users,
  Clock,
  Activity,
  BarChart3,
  Settings,
  UserPlus,
  Upload,
  FileText,
  Cog,
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Patient Registered', message: 'Malaika Khan has been registered.', time: '5m ago', type: 'info', read: false },
    { id: 2, title: 'Test Result Ready', message: 'CBC result for Zehaha Ali is ready for review.', time: '20m ago', type: 'success', read: false },
    { id: 3, title: 'System Update', message: 'ThalCare v1.2 has been deployed successfully.', time: '1h ago', type: 'system', read: true },
  ]);

  const navItems = NAVIGATION_ITEMS[user?.role] || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getRolePath = () => {
    switch (user?.role) {
      case UserRoles.DOCTOR:
        return '/doctor';
      case UserRoles.LAB_TECHNICIAN:
        return '/lab';
      case UserRoles.ADMIN:
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <NavLink to={getRolePath()} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ThalCare</span>
          </NavLink>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Right Section */}
            <div className="flex items-center gap-4 ml-auto">
              {/* Notifications */}
              <div className="relative">
                <button
                  id="notification-bell-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setNotificationsOpen(prev => !prev);
                  }}
                  className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-50"
                >
                  <Bell className="w-5 h-5 pointer-events-none" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[60]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotificationsOpen(false);
                      }}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[70] animate-in fade-in zoom-in duration-200 origin-top-right">
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {notifications.map(notification => (
                              <div
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-primary-50/30' : ''}`}
                                onClick={() => {
                                  setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
                                }}
                              >
                                <div className="flex gap-3">
                                  <div className={`mt-1 p-1.5 rounded-full ${notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                      notification.type === 'system' ? 'bg-blue-100 text-blue-600' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                    <Bell className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium tracking-wider">
                                      {notification.time}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="mt-2 w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No new notifications</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                        <button className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                          View all activity
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <Avatar name={user?.name} size="sm" />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <NavLink
                        to={`${getRolePath()}/settings`}
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
