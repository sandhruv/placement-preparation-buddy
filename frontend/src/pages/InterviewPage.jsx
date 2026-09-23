import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitAnswer, finishInterview } from '../api/client';
import Layout from '../components/Layout';
import { Spinner, TypingDots } from '../components/ui';

function Avatar({ role }) {
  if (role === 'candidate') {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-white text-[11px] font-bold">You</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-surface-100 border border-surface-200 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
  );
}

export default function InterviewPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [currentTopic, setCurrentTopic] = useState('');
  const [interviewComplete, setInterviewComplete] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  let interviewData;
  try {
    interviewData = JSON.parse(sessionStorage.getItem('interviewData'));
  } catch {
    interviewData = null;
  }

  const interviewId = interviewData?.interview_id;

  useEffect(() => {
    if (!interviewData) {
      navigate('/');
      return;
    }
    const firstQ = interviewData.first_question;
    if (firstQ) {
      setMessages([{ role: 'interviewer', content: firstQ }]);
      setCurrentTopic(interviewData.evaluation_plan?.[0]?.topic || '');
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!loading && !interviewComplete) inputRef.current?.focus();
  }, [loading, interviewComplete]);

  const handleSend = async () => {
    const answer = input.trim();
    if (!answer || loading || interviewComplete) return;

    setMessages((prev) => [...prev, { role: 'candidate', content: answer }]);
    setInput('');
    setLoading(true);

    try {
      const data = await submitAnswer(interviewId, answer);

      if (data.type === 'interview_complete') {
        setInterviewComplete(true);
        setMessages((prev) => [...prev, { role: 'interviewer', content: data.message }]);
        sessionStorage.setItem('evaluationData', JSON.stringify(data));
        setTimeout(() => navigate('/results'), 1500);
        return;
      }

      if (data.next_question) {
        setMessages((prev) => [...prev, { role: 'interviewer', content: data.next_question }]);
        setQuestionNumber(data.question_number || questionNumber + 1);
        setCurrentTopic(data.current_topic || currentTopic);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'interviewer', content: 'Sorry, there was an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndInterview = async () => {
    if (!confirm('End the interview and generate your report?')) return;
    setLoading(true);
    try {
      const data = await finishInterview(interviewId);
      sessionStorage.setItem('evaluationData', JSON.stringify(data));
      navigate('/results');
    } catch {
      navigate('/results');
    }
  };

  const totalQuestions = interviewData?.evaluation_plan?.length || 5;

  return (
    <Layout hideSteps>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Chat header */}
        <div className="bg-white border-b border-surface-200/70 px-4 sm:px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.3)] flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-surface-900 text-sm leading-tight">AI Interviewer</h1>
                <p className="text-xs text-surface-400 truncate">{interviewData?.target_role || 'Interview'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-50 rounded-lg border border-surface-200">
                <span className="text-xs font-bold text-primary-600">Q{questionNumber}</span>
                <span className="text-surface-300">/</span>
                <span className="text-xs text-surface-400">{totalQuestions}</span>
                {currentTopic && (
                  <>
                    <span className="w-px h-3 bg-surface-200" />
                    <span className="text-xs font-medium text-surface-600 max-w-[120px] truncate">
                      {currentTopic}
                    </span>
                  </>
                )}
              </div>

              {/* Progress bar */}
              <div className="hidden md:block w-24">
                <div className="progress-track h-1.5">
                  <div
                    className="progress-fill bg-primary-500"
                    style={{ width: `${Math.min((questionNumber / totalQuestions) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleEndInterview}
                disabled={interviewComplete}
                className="btn-danger text-xs py-2 px-3"
              >
                End
              </button>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto bg-surface-50/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 animate-fade-up ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar role={msg.role} />
                <div className={msg.role === 'candidate' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 animate-fade-in">
                <Avatar role="interviewer" />
                <div className="chat-bubble-ai">
                  <div className="flex items-center gap-2.5">
                    <TypingDots />
                    <span className="text-xs text-surface-400 font-medium">Thinking…</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input */}
        {!interviewComplete && (
          <div className="bg-white border-t border-surface-200/70 px-4 sm:px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer… (Enter to send)"
                    disabled={loading}
                    className="input-field resize-none min-h-[48px] max-h-32 pr-12 leading-relaxed"
                    style={{ paddingTop: '12px', paddingBottom: '12px' }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="btn-primary h-12 w-12 !p-0 flex-shrink-0"
                  aria-label="Send answer"
                >
                  {loading ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-surface-400 mt-2 text-center">
                Answers are evaluated in real-time — weak responses may trigger follow-up questions
              </p>
            </div>
          </div>
        )}

        {/* Complete banner */}
        {interviewComplete && (
          <div className="bg-emerald-50 border-t border-emerald-200 px-6 py-4 text-center animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Interview complete — generating your evaluation report…
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
