import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-navy-950 p-10 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent-600/15 rounded-full blur-3xl" />

        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-lg font-extrabold text-white">
              Placement Prep <span className="text-accent-400">Buddy</span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-4">AI Mock Interviews</p>
          <h2 className="text-3xl font-extrabold text-white leading-snug mb-4">
            Practice like it's the real interview.
          </h2>
          <p className="text-surface-400 text-sm leading-relaxed">
            Resume gap analysis, adaptive follow-ups, and structured evaluation reports — built for placement season.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-6 text-xs text-surface-400">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Groq LLM</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary-400" />Tavily research</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent-400" />LangGraph flow</span>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center bg-surface-50 relative overflow-hidden px-4 py-12">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8 animate-fade-down">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6 lg:hidden">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-lg font-extrabold text-surface-900">
                Placement Prep <span className="text-gradient">Buddy</span>
              </span>
            </Link>
            <h1 className="text-2xl font-extrabold text-surface-900 mb-1.5">Welcome back</h1>
            <p className="text-sm text-surface-500">Sign in to continue your preparation</p>
          </div>

          <div className="card p-7 animate-fade-up">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200/80 rounded-lg text-red-700 text-sm flex items-start gap-2 animate-fade-in">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-surface-100 text-center">
              <p className="text-sm text-surface-500">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-primary-700 hover:text-primary-800 transition-colors">
                  Create one free
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-surface-400 mt-6">
            First registered user becomes <span className="font-semibold text-surface-500">admin</span>
          </p>
        </div>
      </div>
    </div>
  );
}
