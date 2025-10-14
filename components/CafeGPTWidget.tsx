'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type Suggestion = {
  id: string;
  name: string;
  location: string;
  region: string;
  features: string[];
  recommended?: boolean;
  image?: string | null;
  notes?: string;
};

export default function CafeGPTWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [summary, setSummary] = useState<string>('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isOpen]);

  const send = async () => {
    if (!canSend) return;
    const text = input.trim();
    setInput('');
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setSuggestions([]);
    setSummary('');
    try {
      const res = await fetch('/api/cafegpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          // enable test mode when user includes #test in the prompt
          test: text.toLowerCase().includes('#test')
        })
      });
      const data = await res.json();
      const resultSummary = data?.summary || '';
      const result: Suggestion[] = data?.suggestions || [];
      setSummary(resultSummary);
      setSuggestions(result);
      const assistantText = result.length
        ? `I found ${result.length} places ${resultSummary}.`
        : 'I could not find anything specific. Try mentioning a city or type (coffee, bubble tea).';
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: assistantText }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-[10001]">
      <div className="flex flex-col items-end space-y-2">
        {isOpen && (
          <div className="w-[min(90vw,380px)] rounded-lg shadow-2xl overflow-hidden border border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
              <div className="text-sm font-semibold">CafeGPT</div>
              <button
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                onClick={() => setIsOpen(false)}
              >
                close
              </button>
            </div>

            <div ref={listRef} className="max-h-64 overflow-y-auto px-3 py-3 space-y-2">
              {messages.map(m => (
                <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div className={`inline-block px-3 py-2 rounded-md text-sm ${m.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {summary && (
                <div className="text-xs text-gray-600">{summary}</div>
              )}

              {suggestions.length > 0 && (
                <div className="space-y-2">
                  {suggestions.map(s => (
                    <div key={s.id} className="border border-gray-200 rounded-md p-2 text-sm hover:bg-gray-50">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-gray-600">⚲ {s.location} • {s.region}</div>
                      {s.features?.length ? (
                        <div className="text-[11px] text-gray-500 mt-1">{s.features.join(', ')}</div>
                      ) : null}
                      {s.notes ? (
                        <div className="text-[11px] text-gray-600 mt-1">{s.notes}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="text-xs text-gray-500">Thinking…</div>
              )}
            </div>

            <div className="p-2 border-t border-gray-200 flex items-center space-x-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="ask for coffee/boba by city, region, or features"
                className="flex-1 text-sm px-3 py-2 rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-gray-300 text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={send}
                disabled={!canSend}
                className={`text-sm px-3 py-2 rounded-md ${canSend ? 'bg-gray-900 text-white hover:opacity-90' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
              >
                Send
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(v => !v)}
          className="rounded-full shadow-xl border border-gray-200 bg-white/95 backdrop-blur px-4 py-2 text-sm hover:bg-white"
        >
          {isOpen ? 'Hide CafeGPT' : 'Open CafeGPT'}
        </button>
      </div>
    </div>
  );
}


