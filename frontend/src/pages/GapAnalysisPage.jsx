import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { EmptyState, SectionHeader } from '../components/ui';

export default function GapAnalysisPage() {
  const navigate = useNavigate();

  let data;
  try {
    data = JSON.parse(sessionStorage.getItem('interviewData'));
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <Layout hideSteps>
        <div className="content-wrapper py-20">
          <div className="max-w-md mx-auto">
            <EmptyState
              icon="📋"
              title="No interview data found"
              description="Start a new interview to see your personalized evaluation plan."
              action={
                <button onClick={() => navigate('/')} className="btn-primary">
                  Go Home
                </button>
              }
            />
          </div>
        </div>
      </Layout>
    );
  }

  const plan = data.evaluation_plan || [];
  const covered = plan.filter((p) => p.status === 'covered').length;
  const gaps = plan.length - covered;

  const handleStart = () => {
    sessionStorage.setItem('interviewActive', 'true');
    navigate('/interview');
  };

  return (
    <Layout>
      <div className="content-wrapper py-10">
        <div className="max-w-3xl mx-auto">
          {/* Page header */}
          <div className="text-center mb-8 animate-fade-up">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-surface-200 shadow-card mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 mb-2 tracking-tight">
              Your Evaluation Plan
            </h1>
            <p className="text-surface-500">
              Personalized focus areas for{' '}
              <span className="font-semibold text-surface-700">{data.target_role}</span>
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up animation-delay-100">
            <div className="card p-4 text-center">
              <p className="text-2xl font-extrabold text-surface-900">{plan.length}</p>
              <p className="text-xs text-surface-400 font-medium mt-0.5">Focus Areas</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-600">{covered}</p>
              <p className="text-xs text-surface-400 font-medium mt-0.5">Covered</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-extrabold text-amber-600">{gaps}</p>
              <p className="text-xs text-surface-400 font-medium mt-0.5">To Verify</p>
            </div>
          </div>

          {/* Plan list */}
          <div className="card p-6 mb-5 animate-fade-up animation-delay-200">
            <SectionHeader
              icon="🎯"
              title="Interview Focus Areas"
              subtitle="AI will prioritize ⚠️ items to verify your skills"
            />
            <div className="space-y-2.5">
              {plan.map((item, idx) => {
                const isCovered = item.status === 'covered';
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                      isCovered
                        ? 'bg-emerald-50/50 border-emerald-200/70'
                        : 'bg-amber-50/50 border-amber-200/70'
                    }`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isCovered ? 'bg-emerald-100' : 'bg-amber-100'
                      }`}
                    >
                      {isCovered ? (
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-sm ${isCovered ? 'text-emerald-800' : 'text-amber-800'}`}>
                          {item.topic}
                        </p>
                        <span className={isCovered ? 'badge-success' : 'badge-warning'}>
                          {isCovered ? 'Covered' : 'Needs verification'}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isCovered ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How it works */}
          <div className="card p-5 mb-6 bg-primary-50/50 border-primary-200/60 animate-fade-up animation-delay-300">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-primary-600" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-primary-900 text-sm">How the interview adapts</p>
                <p className="text-primary-700 text-sm mt-1 leading-relaxed">
                  Strong answers move you to the next topic. Weak answers trigger targeted
                  follow-ups (max 3 per topic) — just like a real interviewer probing deeper.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="w-full btn-primary btn-lg animate-fade-up animation-delay-400"
          >
            Start Interview
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </Layout>
  );
}
