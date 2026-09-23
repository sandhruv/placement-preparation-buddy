import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { startInterview } from '../api/client';
import Layout from '../components/Layout';
import { Spinner } from '../components/ui';

const TARGET_ROLES = [
  { id: 'Backend Developer', icon: '⚙️', desc: 'APIs, databases, systems' },
  { id: 'Frontend Developer', icon: '🎨', desc: 'UI, React, browser' },
  { id: 'Full Stack Developer', icon: '🔗', desc: 'End-to-end development' },
  { id: 'Software Engineer', icon: '💻', desc: 'DSA, design, coding' },
  { id: 'Data Analyst', icon: '📊', desc: 'SQL, insights, viz' },
  { id: 'Data Scientist', icon: '🧠', desc: 'ML, stats, modeling' },
  { id: 'DevOps Engineer', icon: '🚀', desc: 'CI/CD, cloud, infra' },
  { id: 'Cloud Engineer', icon: '☁️', desc: 'AWS, Azure, GCP' },
  { id: 'QA Engineer', icon: '🧪', desc: 'Testing, automation' },
  { id: 'Mobile Developer', icon: '📱', desc: 'Android, iOS, Flutter' },
  { id: 'ML Engineer', icon: '🤖', desc: 'Models, pipelines, MLOps' },
  { id: 'Product Manager', icon: '📋', desc: 'Roadmap, strategy, agile' },
];

const FEATURES = [
  {
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    title: 'Gap Analysis',
    desc: 'Resume vs real job requirements — know your weak spots before the interview.',
  },
  {
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    title: 'Dynamic Follow-ups',
    desc: 'Weak answers trigger targeted follow-up questions — just like a real interviewer.',
  },
  {
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Structured Report',
    desc: 'Scores across 5 dimensions with strengths, improvements, and full transcript.',
  },
];

const CUSTOM_ROLE = '__custom__';

export default function HomePage() {
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const isCustom = selectedRole === CUSTOM_ROLE;
  const targetRole = isCustom ? customRole.trim() : selectedRole;

  const validateFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setResume(file);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setResume(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) return setError('Please upload your resume');
    if (!targetRole) {
      return setError(isCustom ? 'Please type a target role' : 'Please select a target role');
    }
    if (isCustom && targetRole.length < 2) {
      return setError('Role must be at least 2 characters');
    }

    setLoading(true);
    setError('');
    try {
      const data = await startInterview(resume, targetRole);
      sessionStorage.setItem('interviewData', JSON.stringify(data));
      navigate('/gap-analysis');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-primary-100/50 via-accent-50/30 to-transparent blur-3xl pointer-events-none" />

        <div className="content-wrapper relative py-14 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-surface-200 shadow-sm text-xs font-semibold text-surface-600 mb-6 animate-fade-in-down">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              AI-powered mock interviews — free to use
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-surface-900 leading-[1.1] tracking-tight mb-5 animate-fade-up">
              Crack your next interview with{' '}
              <span className="text-gradient">realistic practice</span>
            </h1>

            <p className="text-lg text-surface-500 max-w-xl mx-auto mb-8 animate-fade-up animation-delay-200 leading-relaxed">
              Upload your resume, pick a role — AI researches real job requirements,
              finds your skill gaps, and conducts a dynamic mock interview just like the real thing.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-surface-400 animate-fade-up animation-delay-300">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Resume-based questions
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Real job research
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Instant evaluation report
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Setup Card */}
      <section className="content-wrapper pb-14 -mt-2">
        <div className="max-w-2xl mx-auto">
          <div className="card p-6 sm:p-8 animate-fade-up animation-delay-300">
            <form onSubmit={handleSubmit}>
              {/* Resume Upload */}
              <div className="mb-6">
                <label className="label">Resume (PDF)</label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer group ${
                    dragOver
                      ? 'border-primary-400 bg-primary-50/60 scale-[1.01]'
                      : resume
                      ? 'border-emerald-300 bg-emerald-50/50'
                      : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50/80'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <input
                    ref={inputRef}
                    id="resume-input"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {resume ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-emerald-800">{resume.name}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {(resume.size / 1024).toFixed(1)} KB — Click to replace
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-100 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                        <svg className="w-6 h-6 text-surface-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-surface-700">Drop your resume here</p>
                      <p className="text-xs text-surface-400 mt-1">or click to browse — PDF, max 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div className="mb-6">
                <label className="label">Target Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TARGET_ROLES.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => { setSelectedRole(role.id); setError(''); }}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                        selectedRole === role.id
                          ? 'border-primary-400 bg-primary-50/70 ring-1 ring-primary-200 shadow-sm'
                          : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50/80'
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{role.icon}</span>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${selectedRole === role.id ? 'text-primary-700' : 'text-surface-700'}`}>
                          {role.id}
                        </p>
                        <p className="text-xs text-surface-400 truncate">{role.desc}</p>
                      </div>
                      {selectedRole === role.id && (
                        <svg className="w-4 h-4 text-primary-500 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}

                  {/* Custom role option */}
                  <button
                    type="button"
                    onClick={() => { setSelectedRole(CUSTOM_ROLE); setError(''); }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 sm:col-span-2 ${
                      isCustom
                        ? 'border-accent-400 bg-accent-50/70 ring-1 ring-accent-200 shadow-sm'
                        : 'border-dashed border-surface-300 hover:border-accent-400 hover:bg-surface-50/80'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">✏️</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${isCustom ? 'text-accent-700' : 'text-surface-700'}`}>
                        Type your own role
                      </p>
                      <p className="text-xs text-surface-400">e.g. Blockchain Developer, Cybersecurity Analyst…</p>
                    </div>
                    {isCustom && (
                      <svg className="w-4 h-4 text-accent-500 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>

                {isCustom && (
                  <div className="mt-3 animate-fade-in">
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => { setCustomRole(e.target.value); setError(''); }}
                      placeholder="Type any job role…"
                      className="input-field"
                      maxLength={60}
                      autoFocus
                    />
                    <p className="text-xs text-surface-400 mt-1.5">
                      AI will research real requirements for this role.
                    </p>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-sm flex items-start gap-2.5 animate-fade-in">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !resume || !targetRole || (isCustom && targetRole.length < 2)}
                className="w-full btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Analyzing resume & researching role…
                  </>
                ) : (
                  <>
                    Start Preparation
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              {loading && (
                <p className="text-xs text-surface-400 text-center mt-3 animate-pulse">
                  This may take 15–30 seconds — resume parsing, job research & AI setup
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="content-wrapper pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-surface-900 mb-2">How it works</h2>
            <p className="text-surface-500 text-sm">Three steps to a complete mock interview experience</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="card-hover p-6 animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center mb-4 ring-1 ring-primary-100/50">
                  <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="font-bold text-surface-900 mb-1.5 text-[15px]">{f.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
