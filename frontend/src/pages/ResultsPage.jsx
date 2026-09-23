import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { EmptyState, ScoreRing, SectionHeader } from '../components/ui';

const SCORE_ITEMS = [
  { key: 'technical_knowledge', label: 'Technical Knowledge', icon: '💻', desc: 'Core skills for the role' },
  { key: 'problem_solving', label: 'Problem Solving', icon: '🧩', desc: 'Analytical thinking' },
  { key: 'communication', label: 'Communication', icon: '💬', desc: 'Clarity & structure' },
  { key: 'role_knowledge', label: 'Role Knowledge', icon: '🎯', desc: 'Domain expertise' },
  { key: 'depth_of_understanding', label: 'Depth', icon: '🔍', desc: 'Real vs surface-level' },
];

function getBarColor(score) {
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-primary-500';
  if (score >= 4) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreLabel(score) {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Average';
  return 'Needs Work';
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    try {
      const data = JSON.parse(sessionStorage.getItem('evaluationData'));
      if (data) {
        setEvaluation(data.evaluation || data);
        setTranscript(data.transcript || []);
      }
    } catch {
      // no data
    }
  }, []);

  if (!evaluation) {
    return (
      <Layout hideSteps>
        <div className="content-wrapper py-20">
          <div className="max-w-md mx-auto">
            <EmptyState
              icon="📊"
              title="No evaluation data found"
              description="Complete an interview first to see your performance report."
              action={
                <button onClick={() => navigate('/')} className="btn-primary">
                  Start New Interview
                </button>
              }
            />
          </div>
        </div>
      </Layout>
    );
  }

  const scores = evaluation.scores || {};
  const scoreValues = SCORE_ITEMS.map((s) => scores[s.key] || 0);
  const overall = Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10;

  const handleNewInterview = () => {
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <Layout hideSteps>
      <div className="content-wrapper py-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-up">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-surface-200 shadow-card mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 mb-2 tracking-tight">
              Evaluation Report
            </h1>
            <p className="text-surface-500">AI-generated performance analysis</p>
          </div>

          {/* Overall score */}
          <div className="card p-6 sm:p-8 mb-5 animate-fade-up animation-delay-100">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={overall} size={130} strokeWidth={10} />
              <div className="flex-1 text-center sm:text-left">
                <span className="badge-info mb-2">{getScoreLabel(overall)}</span>
                <h2 className="text-xl font-bold text-surface-900 mt-2">Overall Performance</h2>
                <p className="text-sm text-surface-500 mt-1 leading-relaxed">
                  {evaluation.overall_feedback || 'No feedback available.'}
                </p>
              </div>
            </div>
          </div>

          {/* Score cards */}
          <div className="card p-6 mb-5 animate-fade-up animation-delay-200">
            <SectionHeader icon="📈" title="Performance Scores" subtitle="Rated across 5 dimensions" />
            <div className="space-y-4">
              {SCORE_ITEMS.map((item, i) => {
                const score = scores[item.key] || 0;
                return (
                  <div key={item.key} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{item.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-surface-800">{item.label}</p>
                          <p className="text-xs text-surface-400">{item.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-surface-900">{score}</span>
                        <span className="text-sm text-surface-400 font-medium">/10</span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${getBarColor(score)}`}
                        style={{ width: `${score * 10}%`, transitionDelay: `${i * 100}ms` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths + Improvements side by side */}
          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div className="card p-6 animate-fade-up animation-delay-300">
              <SectionHeader icon="✅" title="Strengths" />
              <ul className="space-y-3">
                {(evaluation.strengths || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-surface-700">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
                {(evaluation.strengths || []).length === 0 && (
                  <li className="text-sm text-surface-400">No strengths recorded.</li>
                )}
              </ul>
            </div>

            <div className="card p-6 animate-fade-up animation-delay-400">
              <SectionHeader icon="⚠️" title="Areas to Improve" />
              <ul className="space-y-3">
                {(evaluation.areas_to_improve || []).map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-surface-700">
                    <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="leading-relaxed">{a}</span>
                  </li>
                ))}
                {(evaluation.areas_to_improve || []).length === 0 && (
                  <li className="text-sm text-surface-400">Nothing to improve — great job!</li>
                )}
              </ul>
            </div>
          </div>

          {/* Transcript */}
          <div className="card p-6 mb-5 animate-fade-up animation-delay-500">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-50 flex items-center justify-center ring-1 ring-surface-100">
                  <svg className="w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-surface-900">Interview Transcript</h2>
                  <p className="text-xs text-surface-400">{transcript.length} messages</p>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-surface-400 transition-transform duration-200 group-hover:text-surface-600 ${showTranscript ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showTranscript && (
              <div className="mt-5 pt-5 border-t border-surface-100 space-y-4 max-h-[28rem] overflow-y-auto pr-1">
                {transcript.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                        msg.role === 'candidate'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-surface-100 text-surface-500'
                      }`}
                    >
                      {msg.role === 'candidate' ? 'You' : 'AI'}
                    </div>
                    <div
                      className={`rounded-xl px-3.5 py-2.5 max-w-[85%] ${
                        msg.role === 'candidate'
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-surface-50 text-surface-700 rounded-bl-sm border border-surface-100'
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-up animation-delay-500">
            <button onClick={handleNewInterview} className="btn-primary btn-lg flex-1">
              Start New Interview
            </button>
            <button
              onClick={() => window.print()}
              className="btn-secondary btn-lg flex-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Report
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
