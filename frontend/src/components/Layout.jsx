import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { path: '/', label: 'Upload' },
  { path: '/gap-analysis', label: 'Analysis' },
  { path: '/interview', label: 'Interview' },
  { path: '/results', label: 'Results' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.35)] group-hover:shadow-[0_2px_12px_rgba(37,99,235,0.5)] transition-shadow">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div className="hidden sm:block">
        <span className="text-[15px] font-bold text-white leading-tight tracking-tight">Placement Prep </span>
        <span className="text-[15px] font-bold text-accent-400 leading-tight tracking-tight">Buddy</span>
      </div>
    </Link>
  );
}

function StepIndicator({ currentPath }) {
  const currentIndex = STEPS.findIndex((s) => s.path === currentPath);
  if (currentIndex === -1) return null;

  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="Progress">
      {STEPS.map((step, idx) => {
        const isActive = step.path === currentPath;
        const isCompleted = currentIndex > idx;
        const isLast = idx === STEPS.length - 1;
        return (
          <div key={step.path} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive ? 'bg-white/10 text-white ring-1 ring-white/20'
                : isCompleted ? 'text-accent-300' : 'text-surface-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-accent-500 text-navy-950'
                  : isCompleted ? 'bg-accent-500/20 text-accent-300'
                  : 'bg-white/10 text-surface-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : idx + 1}
              </div>
              <span>{step.label}</span>
            </div>
            {!isLast && <div className={`w-6 h-px mx-1 ${isCompleted ? 'bg-accent-500/40' : 'bg-white/15'}`} />}
          </div>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="text-surface-300 hover:text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
          Sign in
        </Link>
        <Link to="/register" className="bg-white text-navy-900 hover:bg-accent-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-semibold ring-1 ring-amber-400/30 hover:bg-amber-500/25 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Admin
        </button>
      )}
      <div className="hidden sm:flex items-center gap-2 pl-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
          {(user.name || user.email)?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="text-sm font-semibold text-surface-200 max-w-[100px] truncate">{user.name}</span>
      </div>
      <button
        onClick={logout}
        className="px-3 py-1.5 text-xs font-semibold text-surface-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Logout"
      >
        Logout
      </button>
    </div>
  );
}

export default function Layout({ children, hideSteps = false }) {
  const location = useLocation();

  return (
    <div className="page-container flex flex-col bg-surface-50">
      <header className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur-xl border-b border-white/10">
        <div className="content-wrapper">
          <div className="flex items-center justify-between h-16 gap-4">
            <Logo />
            {!hideSteps && <StepIndicator currentPath={location.pathname} />}
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-surface-200 bg-white">
        <div className="content-wrapper">
          <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-surface-400">
              © {new Date().getFullYear()} Placement Prep Buddy
            </p>
            <div className="flex items-center gap-4 text-xs text-surface-400">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Groq</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary-500" />Tavily</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent-500" />LangGraph</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
