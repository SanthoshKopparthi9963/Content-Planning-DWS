import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  ClipboardList, 
  Puzzle, 
  Users, 
  Repeat, 
  CheckCircle2, 
  BarChart3, 
  UserCog, 
  Settings,
  Menu,
  ChevronLeft,
  Search,
  Bell,
  LogOut,
  Plus,
  Filter,
  MoreVertical,
  Calendar as CalendarIcon,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  XCircle,
  ArrowRightLeft,
  MessageSquare,
  Zap,
  TrendingUp,
  Download,
  Archive,
  RefreshCw,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SIDEBAR_ITEMS, GROUPS } from './constants';
import { User, Task, TaskStatus, Assignment, DeadlineRequest } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const SidebarItem = ({ 
  item, 
  active, 
  collapsed, 
  onClick 
}: { 
  item: any; 
  active: boolean; 
  collapsed: boolean; 
  onClick: () => void 
}) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon size={20} className={cn("shrink-0", active ? "text-white" : "group-hover:text-indigo-400")} />
      {!collapsed && (
        <span className="font-medium text-sm whitespace-nowrap overflow-hidden">
          {item.label}
        </span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          {item.label}
        </div>
      )}
    </button>
  );
};

const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {trend && (
          <p className={cn("text-[10px] mt-1 font-bold", trend.positive ? "text-emerald-500" : "text-rose-500")}>
            {trend.positive ? '↑' : '↓'} {trend.value}% vs last week
          </p>
        )}
      </div>
      <div className={cn("p-2.5 rounded-xl", color)}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [viewingAllocationTask, setViewingAllocationTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasks(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([fetchUsers(), fetchTasks()]);
        // Auto-login as Satyaki Lead for demo
        const uRes = await fetch('/api/users');
        const uData = await uRes.json();
        const lead = uData.find((u: any) => u.role === 'LEAD');
        if (lead) setCurrentUser(lead);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleConfirmAssignment = async (data: any) => {
    try {
      const res = await fetch('/api/assignments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to assign task');
        return;
      }

      await Promise.all([fetchTasks(), fetchUsers()]);
      setAssigningTask(null);
    } catch (err) {
      console.error(err);
      alert('An error occurred while assigning task');
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen tasks={tasks} users={users} />;
      case 'incoming':
        return (
          <IncomingTasksScreen 
            tasks={tasks} 
            users={users} 
            onAssign={(task) => setAssigningTask(task)} 
            onViewAllocation={(task) => setViewingAllocationTask(task)}
          />
        );
      case 'tasks':
        return <TaskManagementScreen tasks={tasks} />;
      case 'assignments':
        return <AssignmentsScreen tasks={tasks} users={users} />;
      case 'capacity':
        return <TeamCapacityScreen users={users} />;
      case 'deadlines':
        return <DeadlineRequestsScreen />;
      case 'reviews':
        return <ReviewsScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'team':
        return <TeamManagementScreen users={users} />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen tasks={tasks} users={users} />;
    }
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 260 }}
        className="bg-white border-r border-slate-200 flex flex-col relative z-30"
      >
        <div className="p-6 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <FileText size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Satyaki</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
              <FileText size={18} className="text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 overflow-y-auto space-y-6 py-4 scrollbar-hide">
          {GROUPS.map(group => {
            const items = SIDEBAR_ITEMS.filter(i => i.group === group.id);
            if (items.length === 0) return null;
            return (
              <div key={group.id} className="space-y-1">
                {!sidebarCollapsed && (
                  <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    {group.label}
                  </p>
                )}
                {items.map(item => (
                  <SidebarItem 
                    key={item.id} 
                    item={item} 
                    active={activeTab === item.id} 
                    collapsed={sidebarCollapsed}
                    onClick={() => setActiveTab(item.id)}
                  />
                ))}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors mb-4"
          >
            {sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
          
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-xl transition-all",
            !sidebarCollapsed && "bg-slate-100"
          )}>
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
              {currentUser?.name[0]}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-slate-600 truncate uppercase font-bold tracking-tighter">Team Lead</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/70 border-b border-slate-200 flex items-center justify-between px-8 shrink-0 backdrop-blur-md z-20">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-lg font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h2>
            <div className="max-w-md w-full relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search tasks, members, reports..." 
                className="w-full bg-white border border-slate-300 rounded-full py-1.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-600 hover:text-slate-900 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium">
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-900 text-slate-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {assigningTask && (
          <AssignmentModal 
            task={assigningTask} 
            onClose={() => setAssigningTask(null)}
            onConfirm={handleConfirmAssignment}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingAllocationTask && (
          <ViewAllocationModal 
            task={viewingAllocationTask}
            onClose={() => setViewingAllocationTask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Screen Components ---

const MastersPanel = ({ items, onReload }: { items: any[]; onReload: () => Promise<void> }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', daily: '', min: '', max: '' });

  const save = async () => {
    if (!form.name || !form.daily || !form.min || !form.max) {
      alert('Please fill all fields');
      return;
    }
    await fetch('/api/masters/task-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'LEAD' },
      body: JSON.stringify({
        name: form.name,
        words_per_hour: 0,
        allowed_role: 'BOTH',
        daily_target: form.daily,
        est_hours_min: parseFloat(form.min),
        est_hours_max: parseFloat(form.max),
      })
    });
    setShowAdd(false);
    setForm({ name: '', daily: '', min: '', max: '' });
    await onReload();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Task Types</h3>
        <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold">Add</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              <th className="px-4 py-2">Task Type</th>
              <th className="px-4 py-2">Target Words</th>
              <th className="px-4 py-2">Estimated Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((tt, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-bold text-slate-900">{tt.name}</td>
                <td className="px-4 py-2 text-sm text-slate-700">{tt.daily_target || '-'}</td>
                <td className="px-4 py-2 text-sm text-slate-700">{tt.est_hours_min ?? '-'} - {tt.est_hours_max ?? '-'} h</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-sm text-slate-500">No task types</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Task Type</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Words</label>
              <input value={form.daily} onChange={e => setForm({ ...form, daily: e.target.value })}
                placeholder='e.g., "2,500 words"'
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Min (h)</label>
                <input type="number" step="0.1" value={form.min} onChange={e => setForm({ ...form, min: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Max (h)</label>
                <input type="number" step="0.1" value={form.max} onChange={e => setForm({ ...form, max: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowAdd(false); setForm({ name: '', daily: '', min: '', max: '' }); }} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold">Cancel</button>
            <button onClick={save} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardScreen = ({ tasks, users }: { tasks: Task[], users: User[] }) => {
  const stats = [
    { label: 'New Tasks', value: tasks.filter(t => t.status === 'NEW').length, icon: Inbox, color: 'bg-indigo-500', trend: { value: 12, positive: true } },
    { label: 'In Progress', value: tasks.filter(t => t.status === 'IN_PROGRESS').length, icon: Clock, color: 'bg-amber-500', trend: { value: 5, positive: false } },
    { label: 'Submitted', value: tasks.filter(t => t.status === 'SUBMITTED').length, icon: CheckCircle, color: 'bg-emerald-500', trend: { value: 8, positive: true } },
    { label: 'Overdue', value: tasks.filter(t => t.status === 'OVERDUE').length, icon: AlertTriangle, color: 'bg-rose-500', trend: { value: 2, positive: false } },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome back, Satyaki</h1>
          <p className="text-slate-400 mt-1">Here's what's happening with your team today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-sm font-bold transition-all border border-slate-300">
            <CalendarIcon size={16} />
            <span>Feb 24, 2026</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (stat.label !== 'Overdue' || stat.value > 0) && (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Alerts & Risks</h3>
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-1 rounded">Action Required</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4 p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Overload Risk: Anika</p>
                  <p className="text-xs text-slate-600 mt-1">Capacity exceeded by 45 minutes for tomorrow's shift.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <Clock className="text-amber-500 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Deadline Risk: Q1 Blog Post</p>
                  <p className="text-xs text-slate-600 mt-1">Task is 60% complete with only 2 hours remaining.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Activity</h3>
              <button className="text-xs text-indigo-600 font-bold uppercase tracking-widest hover:text-indigo-500">View All</button>
            </div>
            <div className="divide-y divide-slate-200">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">JD</div>
                    <div>
                      <p className="text-sm text-slate-900 font-medium">Bisman submitted <span className="text-indigo-600">Task #104</span></p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">12 minutes ago</p>
                    </div>
                  </div>
                  <button className="text-xs text-slate-600 hover:text-slate-900">Details</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="font-bold text-white mb-4">Today's Team Capacity</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overall Utilization</span>
                <span className="text-lg font-bold text-white">78%</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-2">1,240 / 1,600 minutes assigned</p>
            </div>
            <div className="mt-8 space-y-3">
              {users.slice(0, 5).map(user => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-slate-400">{user.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{user.base_capacity - (user.assigned || 0)}m left</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewAllocationModal = ({ task, onClose }: { task: Task; onClose: () => void }) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}/assignments`);
        const data = await res.json();
        setAssignments(data);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [task.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Task Allocation</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{task.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors">
            <LogOut size={20} className="rotate-180" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Task Type</p>
              <p className="text-sm text-slate-900 font-medium">{task.type_name}</p>
            </div>
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Minutes</p>
              <p className="text-sm text-slate-900 font-mono font-bold">{task.total_minutes_required}m</p>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Assigned To</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-emerald-500"></div>
              </div>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-8">No assignments found for this task.</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((asgn, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {asgn.user_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{asgn.user_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{asgn.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-emerald-500">{asgn.minutes_assigned}m</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{asgn.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button 
            onClick={onClose}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const IncomingTasksScreen = ({ tasks, users, onAssign, onViewAllocation }: { 
  tasks: Task[], 
  users: User[], 
  onAssign: (task: Task) => void,
  onViewAllocation: (task: Task) => void
}) => {
  const [filters, setFilters] = useState({
    deadline: '',
    pm: '',
    type: '',
    ai: ''
  });

  const incoming = tasks.filter(t => t.status === 'NEW' || t.status === 'PARTIALLY_ASSIGNED' || t.source === 'Google Form');
  
  const filtered = incoming.filter(t => {
    return (
      (!filters.deadline || t.deadline === filters.deadline) &&
      (!filters.pm || t.pm_name?.toLowerCase().includes(filters.pm.toLowerCase())) &&
      (!filters.type || t.type_name === filters.type) &&
      (!filters.ai || t.ai_requirement === filters.ai)
    );
  });

  const taskTypes = Array.from(new Set(tasks.map(t => t.type_name))).filter(Boolean);
  const aiOptions = Array.from(new Set(tasks.map(t => t.ai_requirement))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Incoming Tasks</h1>
            <p className="text-slate-600 text-sm">Review and assign tasks from Google Forms.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">
              Sync Forms
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deadline</label>
            <input 
              type="date" 
              value={filters.deadline}
              onChange={e => setFilters({...filters, deadline: e.target.value})}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PM Name</label>
            <input 
              type="text" 
              placeholder="Filter by PM..."
              value={filters.pm}
              onChange={e => setFilters({...filters, pm: e.target.value})}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Task Type</label>
            <select 
              value={filters.type}
              onChange={e => setFilters({...filters, type: e.target.value})}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              {taskTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Required</label>
            <select 
              value={filters.ai}
              onChange={e => setFilters({...filters, ai: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All</option>
              {aiOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
      </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-left min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              <th className="px-6 py-4">Project Name</th>
              <th className="px-6 py-4">Task Type</th>
              <th className="px-6 py-4">Total Word Count</th>
              <th className="px-6 py-4">Total Minutes</th>
              <th className="px-6 py-4">Deadline</th>
              <th className="px-6 py-4">PM Name</th>
              <th className="px-6 py-4">Reviewer</th>
              <th className="px-6 py-4">AI Requirement</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-slate-500 italic">No tasks match your filters.</td>
              </tr>
            ) : filtered.map(task => (
              <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{task.name}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{task.type_name}</td>
                <td className="px-6 py-4 text-xs font-mono">{task.total_word_count}</td>
                <td className="px-6 py-4 text-xs font-mono">{task.total_minutes_required}m</td>
                <td className="px-6 py-4 text-xs font-mono">{task.deadline}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{task.pm_name || '-'}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{task.reviewer || '-'}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{task.ai_requirement || 'No'}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    task.status === 'NEW' ? "bg-indigo-500/10 text-indigo-500" :
                    task.status === 'PARTIALLY_ASSIGNED' ? "bg-amber-500/10 text-amber-500" :
                    task.status === 'FULLY_ASSIGNED' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                  )}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {task.status === 'FULLY_ASSIGNED' ? (
                    <button 
                      onClick={() => onViewAllocation(task)}
                      className="text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-widest"
                    >
                      View Allocation
                    </button>
                  ) : (
                    <button 
                      onClick={() => onAssign(task)}
                      className="text-indigo-600 hover:text-indigo-500 text-xs font-bold uppercase tracking-widest"
                    >
                      Assign Now
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AssignmentModal = ({ 
  task, 
  onClose, 
  onConfirm 
}: { 
  task: Task; 
  onClose: () => void; 
  onConfirm: (data: any) => void; 
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [capacityData, setCapacityData] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [allocations, setAllocations] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'WRITER' | 'EDITOR'>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCapacity = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/capacity/${selectedDate}`);
        const data = await res.json();
        setCapacityData(data);
      } catch (err) {
        console.error('Failed to fetch capacity:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCapacity();
  }, [selectedDate]);

  const toggleUser = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
      const newAllocations = { ...allocations };
      delete newAllocations[userId];
      setAllocations(newAllocations);
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
      setAllocations({ ...allocations, [userId]: 0 });
    }
  };

  const updateAllocation = (userId: number, mins: number) => {
    setAllocations({ ...allocations, [userId]: mins });
  };

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const taskRemainingAfter = task.remaining_minutes - totalAllocated;

  const handleConfirm = () => {
    if (selectedUserIds.length === 0) return setError('Please select at least one user');
    if (totalAllocated <= 0) return setError('Please enter minutes to assign');
    if (totalAllocated > task.remaining_minutes) return setError('Total allocation exceeds task remaining');

    const payload = {
      task_id: task.id,
      allocations: selectedUserIds.map(userId => ({
        user_id: userId,
        date: selectedDate,
        minutes_assigned: allocations[userId]
      }))
    };

    onConfirm(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-slate-900 border border-slate-800 w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header with Date Picker */}
        <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Puzzle size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Assignment Modal</h2>
              <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Configure task distribution</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl border border-slate-300">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest px-2">Select Assignment Date</span>
            <div className="relative">
              <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* SECTION 1: Task Summary */}
          <div className="w-64 bg-slate-50 p-6 border-r border-slate-200 overflow-y-auto shrink-0">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Task Summary</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Project Name</p>
                <p className="text-sm font-bold text-slate-900 leading-tight">{task.name}</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Task Type</p>
                  <p className="text-xs text-slate-700 font-medium">{task.type_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Word Count</p>
                  <p className="text-xs font-mono text-slate-700">{task.total_word_count}</p>
                </div>
              </div>
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Live Status</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">Remaining</span>
                    <span className="text-sm font-mono font-bold text-slate-900">{task.remaining_minutes}m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">Allocation</span>
                    <span className="text-sm font-mono font-bold text-indigo-400">-{totalAllocated}m</span>
                  </div>
                  <div className="h-px bg-slate-200 my-1"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">After</span>
                    <span className={cn(
                      "text-sm font-mono font-bold",
                      taskRemainingAfter < 0 ? "text-rose-500" : "text-emerald-500"
                    )}>{taskRemainingAfter}m</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Deadline</p>
                <p className="text-xs font-mono text-slate-700">{task.deadline}</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Capacity Panel */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capacity Panel</h3>
                <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-300">
                  <button 
                    onClick={() => setRoleFilter('ALL')}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                      roleFilter === 'ALL' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >ALL</button>
                  <button 
                    onClick={() => setRoleFilter('WRITER')}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                      roleFilter === 'WRITER' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >WRITERS</button>
                  <button 
                    onClick={() => setRoleFilter('EDITOR')}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                      roleFilter === 'EDITOR' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >EDITORS</button>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">
                {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-titter">
                      <th className="px-4 py-4 w-12"></th>
                      <th className="px-4 py-4">Name</th>
                      <th className="px-4 py-4">Role</th>
                      <th className="px-4 py-4">Capacity</th>
                      <th className="px-4 py-4">Assigned</th>
                      <th className="px-4 py-4">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {capacityData
                      .filter(u => roleFilter === 'ALL' || u.member_type === roleFilter)
                      .map(user => {
                      const isWriter = user.member_type === 'WRITER';
                      const isEditingTask = task.type_name?.toLowerCase().includes('editing');
                      const roleMismatch = isWriter && isEditingTask;
                      const isSelected = selectedUserIds.includes(user.id);

                      if (roleMismatch) return null;

                      return (
                        <tr 
                          key={user.id} 
                          className={cn(
                            "transition-colors group",
                            isSelected ? "bg-indigo-600/10" : "hover:bg-slate-50 cursor-pointer"
                          )}
                          onClick={() => toggleUser(user.id)}
                        >
                          <td className="px-4 py-4">
                            <div className={cn(
                              "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                              isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300 group-hover:border-slate-400"
                            )}>
                              {isSelected && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                          </td>
                          <td className="px-4 py-4 font-bold text-slate-900">{user.name}</td>
                          <td className="px-4 py-4 text-slate-600">{user.member_type}</td>
                          <td className="px-4 py-4 font-mono text-slate-600">{user.base_capacity}m</td>
                          <td className="px-4 py-4 font-mono text-slate-600">{user.assigned}m</td>
                          <td className="px-4 py-4">
                            <span className={cn(
                              "font-mono font-bold px-2 py-1 rounded-lg",
                              user.remaining > 120 ? "text-emerald-500 bg-emerald-500/10" : 
                              user.remaining > 0 ? "text-amber-500 bg-amber-500/10" : 
                              "text-rose-500 bg-rose-500/10"
                            )}>
                              {user.remaining}m
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 3 & 4: Allocation Panel */}
          <div className="w-96 p-8 bg-slate-50 flex flex-col shrink-0">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">Minute Allocation Panel</h3>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
              {selectedUserIds.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-500">
                    <Users size={32} />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Select team members from the list to allocate minutes</p>
                </div>
              ) : (
                selectedUserIds.map(userId => {
                  const user = capacityData.find(u => u.id === userId);
                  if (!user) return null;

                  const allocation = allocations[userId] || 0;
                  const maxForUser = Math.min(user.remaining, task.remaining_minutes);
                  const afterRemaining = user.remaining - allocation;

                  return (
                    <motion.div 
                      key={userId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-5 bg-white rounded-3xl border border-slate-200 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">{user.name}</p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleUser(userId); }}
                          className="text-slate-500 hover:text-rose-500"
                        >
                          <LogOut size={14} className="rotate-180" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl border border-slate-200">
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">User Remaining</p>
                          <p className="text-sm font-mono font-bold text-slate-900">{user.remaining}m</p>
                        </div>
                        <div className="p-2 bg-slate-100 rounded-xl border border-slate-200">
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">After Allocation</p>
                          <p className={cn(
                            "text-sm font-mono font-bold",
                            afterRemaining < 0 ? "text-rose-500" : "text-emerald-500"
                          )}>{afterRemaining}m</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Minutes</label>
                          <span className="text-[10px] text-slate-500 font-bold">Max: {maxForUser}m</span>
                        </div>
                        <input 
                          type="number" 
                          value={allocation === 0 ? '' : allocation}
                          onChange={e => updateAllocation(userId, parseInt(e.target.value) || 0)}
                          placeholder="Enter minutes..."
                          className={cn(
                            "w-full bg-white border rounded-xl px-4 py-3 text-slate-900 focus:ring-2 outline-none font-mono text-lg transition-all",
                            allocation > user.remaining || allocation > task.remaining_minutes 
                              ? "border-rose-500 focus:ring-rose-500" 
                              : "border-slate-300 focus:ring-indigo-500"
                          )}
                        />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div className="pt-8 mt-auto border-t border-slate-200">
              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500">
                  <AlertTriangle size={14} />
                  <span className="text-xs font-bold">{error}</span>
                </div>
              )}
              <button 
                onClick={handleConfirm}
                disabled={selectedUserIds.length === 0 || totalAllocated > task.remaining_minutes}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                <span>Confirm {selectedUserIds.length} Assignments</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const TaskManagementScreen = ({ tasks }: { tasks: Task[] }) => {
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const filteredTasks = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);

  const stats = [
    { label: 'Total Tasks', value: tasks.length, color: 'text-slate-300' },
    { label: 'New', value: tasks.filter(t => t.status === 'NEW').length, color: 'text-indigo-400' },
    { label: 'Partially Assigned', value: tasks.filter(t => t.status === 'PARTIALLY_ASSIGNED').length, color: 'text-amber-400' },
    { label: 'In Progress', value: tasks.filter(t => t.status === 'IN_PROGRESS').length, color: 'text-blue-400' },
    { label: 'Overdue', value: tasks.filter(t => t.status === 'OVERDUE').length, color: 'text-rose-500', highlight: true },
  ];

  const tabs: { id: TaskStatus | 'ALL', label: string }[] = [
    { id: 'ALL', label: 'All Tasks' },
    { id: 'NEW', label: 'New' },
    { id: 'PARTIALLY_ASSIGNED', label: 'Partially Assigned' },
    { id: 'FULLY_ASSIGNED', label: 'Fully Assigned' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'SUBMITTED', label: 'Submitted' },
    { id: 'OVERDUE', label: 'Overdue' },
    { id: 'COMPLETED', label: 'Completed' },
  ];

  const getStatusBadge = (status: TaskStatus) => {
    const styles = {
      NEW: "bg-indigo-500/10 text-indigo-500",
      PARTIALLY_ASSIGNED: "bg-amber-500/10 text-amber-500",
      FULLY_ASSIGNED: "bg-emerald-500/10 text-emerald-500",
      IN_PROGRESS: "bg-blue-500/10 text-blue-500",
      SUBMITTED: "bg-purple-500/10 text-purple-500",
      OVERDUE: "bg-rose-500/10 text-rose-500",
      COMPLETED: "bg-slate-500/10 text-slate-400"
    };
    return cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider", styles[status]);
  };

  return (
    <div className="space-y-8">
      {/* Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={cn(
            "p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center",
            stat.highlight && "border-rose-500/30 bg-rose-500/5 shadow-lg shadow-rose-500/5"
          )}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-300">Task Management</h1>
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide max-w-full">
            {tabs.map(tab => {
              const count = tab.id === 'ALL' ? tasks.length : tasks.filter(t => t.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                    filter === tab.id ? "bg-indigo-600 text-slate-300 shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px]",
                    filter === tab.id ? "bg-white/20 text-slate-300" : "bg-slate-800 text-slate-500",
                    tab.id === 'OVERDUE' && count > 0 && "bg-rose-500 text-slate-300"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1200px]">
              <thead>
                <tr className="bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-5">Task Details</th>
                  <th className="px-6 py-5">Minutes (Total/Assigned)</th>
                  <th className="px-6 py-5">Assigned Members</th>
                  <th className="px-6 py-5">Progress</th>
                  <th className="px-6 py-5">Deadline</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-slate-500 italic">No tasks found in this category.</td>
                  </tr>
                ) : filteredTasks.map(task => {
                  const assignedMins = task.total_minutes_required - task.remaining_minutes;
                  const progress = Math.round((assignedMins / task.total_minutes_required) * 100);
                  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'COMPLETED';
                  const deadlineDate = new Date(task.deadline);
                  const isApproaching = !isOverdue && (deadlineDate.getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;

                  return (
                    <tr key={task.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{task.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mt-1">
                            {task.type_name} • {task.total_word_count} words
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-300">{task.total_minutes_required}m</span>
                            <span className="text-[10px] text-slate-600">/</span>
                            <span className="text-xs font-mono font-bold text-indigo-400">{assignedMins}m</span>
                          </div>
                          {task.remaining_minutes > 0 && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                              <AlertTriangle size={10} />
                              <span>{task.remaining_minutes}m remaining</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          {task.assigned_members && task.assigned_members.length > 0 ? (
                            <>
                              <div className="flex -space-x-2 overflow-hidden">
                                {task.assigned_members.slice(0, 3).map((m, i) => (
                                  <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-300 uppercase" title={m.name}>
                                    {m.name[0]}
                                  </div>
                                ))}
                                {task.assigned_members.length > 3 && (
                                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-300">
                                    +{task.assigned_members.length - 3}
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {task.assigned_members.length} {task.assigned_members.length === 1 ? 'Member' : 'Members'} Assigned
                              </p>
                              {task.assigned_members.some(m => m.total_day_minutes > 480) && (
                                <div className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase tracking-tighter">
                                  <AlertTriangle size={10} />
                                  <span>Capacity Risk</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="w-32 space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className={cn(
                                "h-full rounded-full",
                                progress === 100 ? "bg-emerald-500" : "bg-indigo-500"
                              )}
                            ></motion.div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-xs font-mono font-bold",
                            isOverdue ? "text-rose-500" : isApproaching ? "text-amber-500" : "text-slate-400"
                          )}>
                            {task.deadline}
                          </span>
                          {isOverdue && (
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                              <XCircle size={8} /> Overdue
                            </span>
                          )}
                          {isApproaching && (
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                              <Clock size={8} /> Due Soon
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(task.status)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <TaskActionMenu task={task} onAction={(action) => {
                          if (action === 'VIEW_BREAKDOWN') setSelectedTaskForDetails(task);
                        }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedTaskForDetails && (
          <TaskDetailPanel 
            task={selectedTaskForDetails} 
            onClose={() => setSelectedTaskForDetails(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const TaskActionMenu = ({ task, onAction }: { task: Task, onAction: (action: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions: Record<TaskStatus, { label: string, icon: any, id: string, danger?: boolean }[]> = {
    NEW: [
      { id: 'ASSIGN', label: 'Assign Task', icon: Puzzle },
      { id: 'EDIT', label: 'Edit Task', icon: Edit2 },
      { id: 'DEADLINE', label: 'Modify Deadline', icon: Calendar },
      { id: 'DELETE', label: 'Delete Task', icon: Trash2, danger: true },
    ],
    PARTIALLY_ASSIGNED: [
      { id: 'ASSIGN_REMAINING', label: 'Assign Remaining', icon: Puzzle },
      { id: 'VIEW_BREAKDOWN', label: 'View Breakdown', icon: Eye },
      { id: 'REASSIGN', label: 'Reassign', icon: ArrowRightLeft },
      { id: 'DEADLINE', label: 'Modify Deadline', icon: Calendar },
      { id: 'CANCEL', label: 'Cancel Task', icon: XCircle, danger: true },
    ],
    FULLY_ASSIGNED: [
      { id: 'VIEW_BREAKDOWN', label: 'View Breakdown', icon: Eye },
      { id: 'REASSIGN', label: 'Reassign User', icon: ArrowRightLeft },
      { id: 'MODIFY_DATE', label: 'Modify Date', icon: Calendar },
      { id: 'DEADLINE', label: 'Modify Deadline', icon: Calendar },
    ],
    IN_PROGRESS: [
      { id: 'VIEW_PROGRESS', label: 'View Progress', icon: TrendingUp },
      { id: 'VIEW_MEMBERS', label: 'View Members', icon: Users },
      { id: 'REASSIGN', label: 'Reassign Remaining', icon: ArrowRightLeft },
      { id: 'EXTEND', label: 'Extend Deadline', icon: Clock },
      { id: 'URGENT', label: 'Mark as Urgent', icon: Zap },
      { id: 'MESSAGE', label: 'Message Assignee', icon: MessageSquare },
    ],
    SUBMITTED: [
      { id: 'REVIEW', label: 'Review Submission', icon: Eye },
      { id: 'APPROVE', label: 'Approve', icon: CheckCircle },
      { id: 'REJECT', label: 'Reject', icon: XCircle, danger: true },
      { id: 'REVISION', label: 'Send for Revision', icon: RefreshCw },
      { id: 'CHANGE_REVIEWER', label: 'Change Reviewer', icon: UserCog },
    ],
    OVERDUE: [
      { id: 'EXTEND', label: 'Extend Deadline', icon: Clock },
      { id: 'REASSIGN', label: 'Reassign', icon: ArrowRightLeft },
      { id: 'ESCALATE', label: 'Escalate', icon: AlertTriangle },
      { id: 'DELAY_REASON', label: 'View Delay Reason', icon: History },
      { id: 'FORCE_CLOSE', label: 'Force Close', icon: XCircle, danger: true },
    ],
    COMPLETED: [
      { id: 'VIEW_DETAILS', label: 'View Details', icon: Eye },
      { id: 'DOWNLOAD', label: 'Download Submission', icon: Download },
      { id: 'TIME_SPENT', label: 'View Time Spent', icon: Clock },
      { id: 'REOPEN', label: 'Reopen Task', icon: RefreshCw },
      { id: 'ARCHIVE', label: 'Archive', icon: Archive },
    ]
  };

  const currentActions = actions[task.status] || [];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
      >
        <MoreVertical size={16} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2">
                {currentActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      onAction(action.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all",
                      action.danger ? "text-rose-500 hover:bg-rose-500/10" : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <action.icon size={14} />
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const TaskDetailPanel = ({ task, onClose }: { task: Task, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Eye size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Assignment Breakdown</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{task.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <ChevronLeft size={20} className="rotate-180" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {/* Task Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Minutes</p>
              <p className="text-lg font-mono font-bold text-white">{task.total_minutes_required}m</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Remaining</p>
              <p className="text-lg font-mono font-bold text-indigo-400">{task.remaining_minutes}m</p>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={14} /> Assigned Team Members
            </h3>
            <div className="space-y-3">
              {task.assigned_members && task.assigned_members.length > 0 ? (
                task.assigned_members.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-xs font-bold text-white">
                        {m.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{m.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{m.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-indigo-400">{m.minutes}m</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Allocation</p>
                      {m.total_day_minutes > 480 && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase tracking-tighter mt-1">
                          <AlertTriangle size={10} />
                          <span>Over Capacity ({m.total_day_minutes}m)</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
                  <p className="text-sm text-slate-500 italic">No members assigned yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Timeline Placeholder */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> Execution Progress
            </h3>
            <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black text-white">{Math.round(((task.total_minutes_required - task.remaining_minutes) / task.total_minutes_required) * 100)}%</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Overall Completion</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-emerald-500">{task.total_minutes_required - task.remaining_minutes}m</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Minutes Logged</p>
                </div>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                  style={{ width: `${((task.total_minutes_required - task.remaining_minutes) / task.total_minutes_required) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-800 bg-slate-900/50">
          <button 
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            Close Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AssignmentsScreen = ({ tasks, users }: { tasks: Task[], users: User[] }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Operational Assignment Panel</h1>
          <p className="text-slate-400 text-sm">Assign, split, and reassign tasks to team members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-800/30">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unassigned Tasks</h3>
            </div>
            <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto scrollbar-hide">
              {tasks.filter(t => t.remaining_minutes > 0).map(task => (
                <div key={task.id} className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{task.name}</h4>
                    <span className="text-[10px] font-mono text-indigo-400">{task.remaining_minutes}m</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{task.type_name}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Due {task.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
            <Puzzle size={48} className="text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-white">Select a task to start assignment</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-xs">You can split tasks across multiple days or multiple team members to optimize capacity.</p>
            <button className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20">
              Quick Assign (AI Optimized)
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team Allocation Breakdown</h3>
              <button className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">View Heatmap</button>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {users.slice(0, 8).map(user => (
                <div key={user.id} className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${Math.random() * 100}%` }}></div>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">75% Assigned</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamCapacityScreen = ({ users }: { users: User[] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [capacityData, setCapacityData] = useState<User[]>(users);

  const getWeekDates = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return Array.from({ length: 7 }).map((_, i) => {
      const newDate = new Date(monday);
      newDate.setDate(monday.getDate() + i);
      return newDate;
    });
  };

  useEffect(() => {
    const fetchCapacityData = async () => {
      const response = await fetch(`/api/capacity?date=${selectedDate}`);
      const data = await response.json();
      setCapacityData(data);
    };

    const fetchWeeklyCapacityData = async () => {
      const weekDates = getWeekDates(selectedDate);
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];
      const response = await fetch(`/api/capacity/weekly?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      setCapacityData(data);
    };

    if (viewMode === 'daily') {
      fetchCapacityData();
    } else {
      fetchWeeklyCapacityData();
    }
  }, [selectedDate, viewMode]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Capacity Planning</h1>
          <p className="text-slate-600 text-sm">Monitor daily availability and weekly workload heatmaps.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-300">
            <button 
              onClick={() => setViewMode('daily')}
              className={cn(
                "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                viewMode === 'daily' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >DAILY</button>
            <button 
              onClick={() => setViewMode('weekly')}
              className={cn(
                "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                viewMode === 'weekly' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >WEEKLY</button>
          </div>
          <div className="relative">
            <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {viewMode === 'daily' ? (
            <>
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Daily Capacity Breakdown</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Busy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full</span>
                  </div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {capacityData.filter(u => u.role === 'MEMBER').map(user => (
                  <div key={user.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold border border-slate-200">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{user.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{user.member_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-slate-900">{user.base_capacity - (user.assigned || 0)}m remaining</p>
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            (user.assigned || 0) / user.base_capacity > 0.9 ? "bg-rose-500" :
                            (user.assigned || 0) / user.base_capacity > 0.7 ? "bg-amber-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${((user.assigned || 0) / user.base_capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-6">
              <h3 className="font-bold text-slate-900">Weekly Capacity Breakdown</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 border border-slate-200 text-left text-xs font-bold text-slate-600 uppercase">Member</th>
                      {getWeekDates(selectedDate).map(date => (
                        <th key={date.toISOString()} className="p-2 border border-slate-200 text-center text-xs font-bold text-slate-600 uppercase">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          <br />
                          {date.toLocaleDateString('en-US', { day: 'numeric', month: 'numeric' })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {capacityData.filter(u => u.role === 'MEMBER').map(user => (
                      <tr key={user.id}>
                        <td className="p-2 border border-slate-200 text-sm font-bold text-slate-900">{user.name}</td>
                        {getWeekDates(selectedDate).map(date => {
                          const assignments = (user.assignments || []).filter(a => a.date === date.toISOString().split('T')[0]);
                          const totalMinutes = assignments.reduce((sum, a) => sum + a.minutes_assigned, 0);
                          const leave = (user.leaves || []).find(l => l.date === date.toISOString().split('T')[0]);

                          const cellClass = leave
                            ? 'bg-slate-200'
                            : totalMinutes >= user.base_capacity
                              ? 'bg-rose-200'
                              : totalMinutes > user.base_capacity / 2
                                ? 'bg-amber-200'
                                : totalMinutes > 0
                                  ? 'bg-emerald-200'
                                  : '';

                          return (
                            <td key={date.toISOString()} className={cn("p-2 border border-slate-200 text-center", cellClass)}>
                              {leave ? (
                                <div className="text-xs font-bold text-slate-500">LEAVE</div>
                              ) : (
                                assignments.map(a => (
                                  <div key={a.id} className="text-xs text-slate-700">
                                    {a.task_name} - {a.minutes_assigned}m
                                  </div>
                                ))
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl">
            <h3 className="font-bold text-slate-900 mb-6">Weekly Heatmap</h3>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "aspect-square rounded-sm",
                    i % 7 === 5 || i % 7 === 6 ? "bg-slate-100" :
                    Math.random() > 0.7 ? "bg-rose-500/60" :
                    Math.random() > 0.4 ? "bg-indigo-500/40" : "bg-indigo-500/10"
                  )}
                ></div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl">
            <h3 className="font-bold text-slate-900 mb-4">Leave Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-slate-100 rounded-lg">
                <span className="text-xs text-slate-700">Trishna</span>
                <span className="text-[10px] font-bold text-amber-500 uppercase">Sick Leave</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-100 rounded-lg">
                <span className="text-xs text-slate-700">Rahul</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Planned</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeadlineRequestsScreen = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-white">Deadline Requests</h1>
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
        <button className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">Pending</button>
        <button className="px-4 py-1.5 text-slate-500 hover:text-slate-300 rounded-lg text-xs font-bold">History</button>
      </div>
    </div>
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
      <Repeat size={48} className="mx-auto text-slate-700 mb-4" />
      <h3 className="text-lg font-bold text-white">No pending requests</h3>
      <p className="text-slate-500 text-sm mt-2">When team members request ETA changes, they will appear here for your approval.</p>
    </div>
  </div>
);

const ReviewsScreen = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-white">Reviews & Approvals</h1>
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <h3 className="font-bold text-white">Submitted Tasks Awaiting Review</h3>
      </div>
      <div className="p-12 text-center text-slate-500 italic">
        All caught up! No tasks waiting for review.
      </div>
    </div>
  </div>
);

const ReportsScreen = () => (
  <div className="space-y-8">
    <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-6">Productivity Report</h3>
        <div className="h-48 flex items-end gap-2">
          {[60, 80, 45, 90, 70, 85, 50].map((h, i) => (
            <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg relative group">
              <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-lg transition-all" style={{ height: `${h}%` }}></div>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-100 text-slate-900 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {h}%
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
          <span>Mon</span>
          <span>Sun</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-6">Utilization %</h3>
        <div className="flex flex-col items-center justify-center h-48">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path className="text-slate-200" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              <path className="text-indigo-500" strokeDasharray="82, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">82%</span>
              <span className="text-[8px] text-slate-500 uppercase font-bold">Avg. Weekly</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-6">Planned vs Actual</h3>
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Planned Words</span>
              <span className="text-slate-900 font-bold">45,000</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400 w-full"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Actual Words</span>
              <span className="text-slate-900 font-bold">42,300</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[94%]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TeamManagementScreen = ({ users }: { users: User[] }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
        <Plus size={18} />
        <span>Add Member</span>
      </button>
    </div>
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Capacity</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {users.map(user => (
            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">{user.name[0]}</div>
                  <span className="font-bold text-slate-900">{user.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-xs text-slate-600 font-medium">{user.role === 'LEAD' ? 'Team Lead' : user.member_type}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-xs font-mono text-slate-700">{user.base_capacity}m / day</span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-xs text-slate-600 hover:text-slate-900 font-bold uppercase tracking-widest">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SettingsScreen = () => {
  const [tab, setTab] = useState<'MASTERS' | 'ROLES' | 'WORK' | 'LEAVES' | 'TASK_RULES' | 'BUFFER' | 'NOTIFICATIONS'>('WORK');
  const [global, setGlobal] = useState<any>(null);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const canEdit = true;

  const loadGlobal = async () => {
    const r = await fetch('/api/settings/global');
    const d = await r.json();
    setGlobal(d);
  };
  const loadTaskTypes = async () => {
    const r = await fetch('/api/masters/task-types');
    setTaskTypes(await r.json());
  };
  const loadLeaveTypes = async () => {
    const r = await fetch('/api/leave-types');
    setLeaveTypes(await r.json());
  };

  useEffect(() => {
    loadGlobal();
    loadTaskTypes();
    loadLeaveTypes();
  }, []);

  const saveGlobal = async () => {
    if (!global) return;
    await fetch('/api/settings/global', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'LEAD' },
      body: JSON.stringify(global)
    });
    await loadGlobal();
    alert('Settings saved');
  };

  const addTaskType = async () => {
    const name = prompt('Task Type Name') || '';
    if (!name) return;
    const daily_target = prompt('Daily Target (e.g., "2,500 words" or "80 units")') || '';
    const estMin = parseFloat(prompt('Estimated Hours (min, e.g., 2.5)') || '0');
    const estMax = parseFloat(prompt('Estimated Hours (max, e.g., 3.0)') || '0');
    if (!estMin || !estMax) {
      alert('Please enter valid estimated hours');
      return;
    }
    await fetch('/api/masters/task-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'LEAD' },
      body: JSON.stringify({
        name,
        words_per_hour: 0,
        allowed_role: 'BOTH',
        daily_target,
        est_hours_min: estMin,
        est_hours_max: estMax
      })
    });
    await loadTaskTypes();
  };

  const addLeaveType = async () => {
    const name = prompt('Leave Type Name') || '';
    if (!name) return;
    const minutes = parseInt(prompt('Available Minutes') || '0', 10);
    if (!minutes) return;
    await fetch('/api/leave-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'LEAD' },
      body: JSON.stringify({ name, minutes, require_approval: 1, auto_block: 0 })
    });
    await loadLeaveTypes();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">System Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          {[
            { id: 'MASTERS', label: 'Masters' },
            { id: 'ROLES', label: 'Roles & Privileges' },
            { id: 'WORK', label: 'Work Hours & Capacity' },
            { id: 'LEAVES', label: 'Leave Rules' },
            { id: 'TASK_RULES', label: 'Task Rules' },
            { id: 'BUFFER', label: 'Buffer & Rounding' },
            { id: 'NOTIFICATIONS', label: 'Notification Settings' },
          ].map(i => (
            <button
              key={i.id}
              onClick={() => setTab(i.id as any)}
              className={cn(
                "w-full text-left px-4 py-2 rounded-lg text-sm font-bold",
                tab === i.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
        <div className="md:col-span-3">
          {tab === 'WORK' && global && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Day Minutes</label>
                  <input type="number" value={global.full_day_minutes}
                    onChange={e => setGlobal({ ...global, full_day_minutes: parseInt(e.target.value || '0', 10) })}
                    disabled={!canEdit}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Half Day Minutes</label>
                  <input type="number" value={global.half_day_minutes}
                    onChange={e => setGlobal({ ...global, half_day_minutes: parseInt(e.target.value || '0', 10) })}
                    disabled={!canEdit}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Short Leave Minutes</label>
                  <input type="number" value={global.short_leave_minutes}
                    onChange={e => setGlobal({ ...global, short_leave_minutes: parseInt(e.target.value || '0', 10) })}
                    disabled={!canEdit}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Working Days</label>
                  <input type="text" value={global.working_days}
                    onChange={e => setGlobal({ ...global, working_days: e.target.value })}
                    disabled={!canEdit}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Office Start</label>
                  <input type="time" value={global.office_start}
                    onChange={e => setGlobal({ ...global, office_start: e.target.value })}
                    disabled={!canEdit}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Office End</label>
                  <input type="time" value={global.office_end}
                    onChange={e => setGlobal({ ...global, office_end: e.target.value })}
                    disabled={!canEdit}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm" />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={saveGlobal} disabled={!canEdit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold">
                  Save
                </button>
              </div>
            </div>
          )}

          {tab === 'BUFFER' && global && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Default Buffer %</label>
                  <input type="number" value={global.default_buffer_pct}
                    onChange={e => setGlobal({ ...global, default_buffer_pct: parseInt(e.target.value || '0', 10) })}
                    disabled={!canEdit}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rounding Rule</label>
                  <select value={global.rounding_rule}
                    onChange={e => setGlobal({ ...global, rounding_rule: e.target.value })}
                    disabled={!canEdit}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm">
                    <option value="NEAREST">Nearest</option>
                    <option value="UP">Round Up</option>
                    <option value="BLOCK5">5-minute block</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Over-capacity Policy</label>
                  <select value={global.over_capacity_policy}
                    onChange={e => setGlobal({ ...global, over_capacity_policy: e.target.value })}
                    disabled={!canEdit}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm">
                    <option value="BLOCK">Block</option>
                    <option value="WARN">Warn</option>
                    <option value="ALLOW">Allow</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!global.allow_split_users}
                    onChange={e => setGlobal({ ...global, allow_split_users: e.target.checked ? 1 : 0 })}
                    disabled={!canEdit} />
                  <span className="text-sm">Allow task splitting across users</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!global.allow_split_dates}
                    onChange={e => setGlobal({ ...global, allow_split_dates: e.target.checked ? 1 : 0 })}
                    disabled={!canEdit} />
                  <span className="text-sm">Allow task splitting across dates</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!global.auto_overdue}
                    onChange={e => setGlobal({ ...global, auto_overdue: e.target.checked ? 1 : 0 })}
                    disabled={!canEdit} />
                  <span className="text-sm">Auto move to Overdue</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!global.auto_close}
                    onChange={e => setGlobal({ ...global, auto_close: e.target.checked ? 1 : 0 })}
                    disabled={!canEdit} />
                  <span className="text-sm">Auto close when 100% complete</span>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={saveGlobal} disabled={!canEdit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold">
                  Save
                </button>
              </div>
            </div>
          )}

          {tab === 'MASTERS' && (
            <MastersPanel
              items={taskTypes}
              onReload={loadTaskTypes}
            />
          )}

          {tab === 'LEAVES' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Leave Types</h3>
                <button onClick={addLeaveType} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold">Add</button>
              </div>
              <div className="divide-y divide-slate-200">
                {leaveTypes.map(l => (
                  <div key={l.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-900">{l.name}</span>
                      <span className="text-xs text-slate-600">{l.minutes} min</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">{l.require_approval ? 'Approval' : 'No Approval'}</span>
                  </div>
                ))}
                {leaveTypes.length === 0 && <div className="py-4 text-sm text-slate-500">No leave types</div>}
              </div>
            </div>
          )}

          {tab === 'ROLES' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-slate-900">Roles & Privileges</h3>
              <p className="text-sm text-slate-600">Team Lead has full access by default. Granular role editing can be extended.</p>
              <ul className="text-sm text-slate-700 list-disc pl-5">
                <li>Create Task</li>
                <li>Edit Task</li>
                <li>Delete Task</li>
                <li>Assign Task</li>
                <li>Modify Deadline</li>
                <li>Approve Deadline Request</li>
                <li>Manage Masters</li>
                <li>View Reports</li>
                <li>Override Capacity</li>
                <li>Review Submissions</li>
              </ul>
            </div>
          )}

          {tab === 'TASK_RULES' && global && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={!!global.allow_split_users}
                  onChange={e => setGlobal({ ...global, allow_split_users: e.target.checked ? 1 : 0 })} />
                <span className="text-sm">Allow task splitting across users</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={!!global.allow_split_dates}
                  onChange={e => setGlobal({ ...global, allow_split_dates: e.target.checked ? 1 : 0 })} />
                <span className="text-sm">Allow task splitting across dates</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={!!global.auto_overdue}
                  onChange={e => setGlobal({ ...global, auto_overdue: e.target.checked ? 1 : 0 })} />
                <span className="text-sm">Auto move to Overdue</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={!!global.auto_close}
                  onChange={e => setGlobal({ ...global, auto_close: e.target.checked ? 1 : 0 })} />
                <span className="text-sm">Auto close when 100% complete</span>
              </div>
              <div className="flex justify-end">
                <button onClick={saveGlobal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold">Save</button>
              </div>
            </div>
          )}

          {tab === 'NOTIFICATIONS' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-sm text-slate-600">Notification settings can integrate email or chat tools.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
