import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth, api } from '../context/AuthContext';
import { Spinner, SectionHeader } from '../components/ui';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'interviews', label: 'Interviews', icon: '📝' },
  { id: 'evaluations', label: 'Evaluations', icon: '📈' },
];

function StatCard({ label, value, icon, color = 'primary', delay = 0 }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600 ring-primary-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    accent: 'bg-accent-50 text-accent-600 ring-accent-100',
  };
  return (
    <div className="card p-5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3.5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ring-1 ${colors[color]}`}>
          <span className="text-lg">{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-surface-900 leading-none">{value}</p>
          <p className="text-xs text-surface-400 font-medium mt-1">{label}</p>
        </div>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return d;
  }
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, u, i, e] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/interviews'),
        api.get('/admin/evaluations'),
      ]);
      setStats(s.data);
      setUsers(u.data.users);
      setInterviews(i.data.interviews);
      setEvaluations(e.data.evaluations);
    } catch (err) {
      console.error('Admin load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  const handleToggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change role to ${newRole}?`)) return;
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  const handleDeleteInterview = async (id) => {
    if (!confirm('Delete this interview?')) return;
    try {
      await api.delete(`/admin/interviews/${id}`);
      setInterviews((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  if (loading) {
    return (
      <Layout hideSteps>
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" className="text-primary-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideSteps>
      <div className="content-wrapper py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="badge-warning">Admin</span>
              <span className="text-xs text-surface-400">Welcome, {user?.name}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-surface-500 mt-0.5">Manage users, interviews & evaluations</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadData} className="btn-secondary text-sm py-2.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button onClick={() => { logout(); }} className="btn-danger text-sm py-2.5">
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 animate-fade-up animation-delay-100">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                tab === t.id
                  ? 'bg-surface-900 text-white shadow-md'
                  : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total Users" value={stats.total_users} icon="👥" color="primary" delay={0} />
              <StatCard label="Total Interviews" value={stats.total_interviews} icon="📝" color="accent" delay={80} />
              <StatCard label="Completed" value={stats.completed_interviews} icon="✅" color="emerald" delay={160} />
              <StatCard label="In Progress" value={stats.in_progress_interviews} icon="⏳" color="amber" delay={240} />
              <StatCard label="Evaluations" value={stats.total_evaluations} icon="📈" color="primary" delay={320} />
              <StatCard label="Avg Score" value={`${stats.average_score}/10`} icon="⭐" color="emerald" delay={400} />
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="card overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-surface-100">
              <SectionHeader icon="👥" title="Registered Users" subtitle={`${users.length} total`} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 text-left">
                    <th className="px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Name</th>
                    <th className="px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Joined</th>
                    <th className="px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(u.name || u.email)?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-semibold text-surface-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-surface-500">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={u.role === 'admin' ? 'badge-warning' : 'badge-info'}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3.5 text-surface-400 text-xs">{formatDate(u.created_at)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleRole(u.id, u.role)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-100 text-surface-600 hover:bg-surface-200 transition-colors"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>
                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan="5" className="px-5 py-8 text-center text-surface-400">No users yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Interviews */}
        {tab === 'interviews' && (
          <div className="card overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-surface-100">
              <SectionHeader icon="📝" title="All Interviews" subtitle={`${interviews.length} records`} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 text-left">
                    <th className="px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Score</th>
                    <th className="px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Started</th>
                    <th className="px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Q's</th>
                    <th className="px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {interviews.map((iv) => (
                    <tr key={iv._id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-surface-800">{iv.target_role}</td>
                      <td className="px-5 py-3.5">
                        <span className={iv.status === 'completed' ? 'badge-success' : 'badge-warning'}>
                          {iv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {iv.avg_score != null ? (
                          <span className="font-bold text-surface-900">{iv.avg_score}/10</span>
                        ) : (
                          <span className="text-surface-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-surface-400 text-xs">{formatDate(iv.start_time)}</td>
                      <td className="px-5 py-3.5 text-surface-500">{iv.transcript?.length || 0}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteInterview(iv._id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {interviews.length === 0 && (
                    <tr><td colSpan="6" className="px-5 py-8 text-center text-surface-400">No interviews yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Evaluations */}
        {tab === 'evaluations' && (
          <div className="space-y-4 animate-fade-up">
            {evaluations.map((ev, i) => (
              <div key={ev._id} className="card p-5" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="badge-info">Evaluation</span>
                    <span className="text-xs text-surface-400">{formatDate(ev.created_at)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {Object.entries(ev.scores || {}).map(([key, val]) => (
                    <div key={key} className="text-center p-2 bg-surface-50 rounded-lg">
                      <p className="text-lg font-extrabold text-surface-900">{val}</p>
                      <p className="text-[10px] text-surface-400 capitalize leading-tight mt-0.5">
                        {key.replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-surface-600 leading-relaxed">
                  {ev.overall_feedback}
                </p>
              </div>
            ))}
            {evaluations.length === 0 && (
              <div className="card p-10 text-center text-surface-400">No evaluations yet</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
