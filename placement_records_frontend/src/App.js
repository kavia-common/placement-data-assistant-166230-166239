import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';

/**
 * PUBLIC_INTERFACE
 * App is the main Connecto (Beta) chat UI component.
 * It renders:
 * - Header with logo and brand title
 * - Scrollable chat area with message bubbles
 * - Input bar with validation and send action
 * Integrates with FastAPI backend endpoints for health and chat.
 */
function App() {
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'bot', text: "Hi! I’m Connecto (Beta) 🤝 Ask me anything about historical placement records." }
  ]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [healthOk, setHealthOk] = useState(true);
  const [theme] = useState('light'); // locked to light theme per request details
  const chatEndRef = useRef(null);

  // Apply theme to document element (light theme requested)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending]);

  // Compute backend base URL; default to same origin but allow override via env if needed.
  const backendBaseUrl = useMemo(() => {
    // If future env is provided, use it; otherwise same origin on /api or port 3001 path.
    // We’ll default to the provided running backend origin inferred from docs link:
    // https://vscode-internal-25427-beta.beta01.cloud.kavia.ai:3001
    try {
      const docsUrl = new URL(window.location.href);
      // If running in preview, we don’t know the backend host; using relative /api by default.
      // Adjust below if reverse proxy maps /api -> backend.
      return process.env.REACT_APP_BACKEND_URL || '/';
    } catch {
      return process.env.REACT_APP_BACKEND_URL || '/';
    }
  }, []);

  // Health check on mount
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(new URL('/', window.location.origin + backendBaseUrl).toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        if (!res.ok) throw new Error('Health failed');
        const data = await res.json();
        setHealthOk(data?.status === 'ok');
      } catch {
        setHealthOk(false);
      }
    };
    run();
    return () => controller.abort();
  }, [backendBaseUrl]);

  // PUBLIC_INTERFACE
  /**
   * sendMessage validates input and posts to backend /chat.
   * - Adds user message
   * - Shows loading state
   * - Displays bot answer or fallback/error
   */
  const sendMessage = async () => {
    const trimmed = input.trim();
    setError('');
    if (!trimmed) {
      setError('Please enter a question.');
      return;
    }
    if (trimmed.length < 3) {
      setError('Your question is too short. Add a bit more detail.');
      return;
    }
    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setPending(true);
    setInput('');

    try {
      const res = await fetch(new URL('/chat', window.location.origin + backendBaseUrl).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed })
      });
      if (!res.ok) {
        let details = '';
        try {
          const j = await res.json();
          details = j?.detail ? `: ${JSON.stringify(j.detail)}` : '';
        } catch {
          // ignore json parse error
        }
        throw new Error(`Request failed${details}`);
      }
      const data = await res.json();
      const answer = typeof data?.answer === 'string' ? data.answer : 'Sorry, I could not parse a response.';
      const usedFallback = !!data?.used_fallback;
      const botMsg = {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: answer,
        usedFallback
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setError('Something went wrong while contacting the server. Please try again.');
      const botMsg = {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: 'I couldn’t reach the placement records service. Please try again in a moment.',
        usedFallback: true
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setPending(false);
    }
  };

  // Handle enter key
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !pending) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="connecto-app">
      <header className="connecto-header">
        <div className="brand">
          <div className="brand-logo" aria-hidden="true">C</div>
          <div className="brand-text">
            <div className="brand-title">Connecto (Beta)</div>
            <div className="brand-subtitle">Placement Records Assistant</div>
          </div>
        </div>
        <div className="status">
          <span className={`dot ${healthOk ? 'ok' : 'down'}`} />
          <span className="status-text">{healthOk ? 'Backend Online' : 'Backend Offline'}</span>
        </div>
      </header>

      <main className="chat-shell">
        <div className="chat-window" role="log" aria-live="polite">
          {messages.map(m => (
            <MessageBubble key={m.id} role={m.role} text={m.text} usedFallback={m.usedFallback} />
          ))}
          {pending && (
            <div className="bubble bot loading">
              <span className="dot-loader" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="sr-only">Connecto is typing…</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="input-bar">
          <textarea
            className="chat-input"
            placeholder="Ask about companies, roles, packages, or year-wise stats…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={pending}
            rows={1}
            aria-label="Your question"
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={pending || !input.trim()}
            aria-label="Send message"
            title="Send"
          >
            {pending ? '...' : 'Send'}
          </button>
        </div>
        {error && <div className="error-banner" role="alert">{error}</div>}
      </main>

      <footer className="connecto-footer">
        <span>Answers are strictly from historical placement records. No personal data stored.</span>
      </footer>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * MessageBubble renders a single chat message with role-based styling.
 */
function MessageBubble({ role, text, usedFallback }) {
  const isUser = role === 'user';
  return (
    <div className={`bubble ${isUser ? 'user' : 'bot'}`}>
      {!isUser && <span className="bot-badge">Connecto</span>}
      <p className="bubble-text">{text}</p>
      {!isUser && usedFallback ? (
        <span className="fallback-tag" title="Out-of-context question; showing fallback.">Fallback</span>
      ) : null}
    </div>
  );
}

export default App;
