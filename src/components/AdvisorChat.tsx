import React, { useState } from 'react';
import { 
  MessageSquareCode, 
  Send, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Loader2, 
  Check, 
  Copy,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface AdvisorChatProps {
  onSelectTopic?: (topic: string) => void;
}

export const AdvisorChat: React.FC<AdvisorChatProps> = () => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    source?: string;
  }>>([
    {
      role: 'assistant',
      content: `### Welcome to the PQC Cryptographic & RFC Advisory Engine

I can assist you with transitioning enterprise network security architectures to post-quantum standards:
- **NIST Standards**: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), FIPS 206 (FN-DSA / FALCON).
- **Network Protocol Integration**: TLS 1.3 hybrid key shares (X25519MLKEM768), IPsec IKEv2 multiple key exchange (RFC 9370), OpenSSH 9.x hybrid sntrup761, WireGuard KEM PSK.
- **Wire Overhead & Fragmentation**: TCP MSS clamping, PMTU discovery, DoS amplification mitigation, and KEMTLS alternatives.

Select a preset question below or enter your specific architecture query.`,
      source: 'system'
    }
  ]);

  const presetQueries = [
    "How to prevent TCP packet fragmentation when deploying ML-DSA certificates in TLS 1.3?",
    "Explain the X25519MLKEM768 hybrid key exchange mechanism deployed in Chrome and Cloudflare.",
    "What is KEMTLS and how does it eliminate digital signature bloat in constrained networks?",
    "Why does Shor's algorithm break RSA-2048 and ECDSA, but fail against Module-LWE lattices?",
    "Does AES-256 need to be replaced by a post-quantum cipher under Grover's algorithm?"
  ];

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || query;
    if (!messageText.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/pqc/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: messageText,
          networkContext: 'Enterprise Post-Quantum Network Infrastructure',
          algorithmFocus: 'FIPS 203/204/205 & TLS 1.3'
        })
      });

      const data = await res.json();
      if (data.analysis) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.analysis,
            source: data.source
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `**Error**: ${data.error || 'Failed to retrieve cryptographic analysis.'}`,
            source: 'error'
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `**Connection Error**: Could not reach backend advisor service. ${err?.message || ''}`,
          source: 'error'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
              Cryptographic Architecture Advisor
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              RFC Standards & Network Transition Advisor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Consult with a specialized engineering advisor on NIST FIPS guidelines, IETF drafts, and middlebox resilience.
            </p>
          </div>
        </div>

        {/* Preset query buttons */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-400 block mb-2">COMMON ARCHITECTURAL INQUIRIES:</span>
          <div className="flex flex-wrap gap-2">
            {presetQueries.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="text-left px-3 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Display & Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg flex flex-col h-[580px] overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-lg p-4 relative group ${
                    isUser
                      ? 'bg-cyan-600 text-white font-medium'
                      : 'bg-slate-950 border border-slate-800 text-slate-200'
                  }`}
                >
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(m.content, idx)}
                      className="absolute top-2.5 right-2.5 p-1 rounded bg-slate-800 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <div className="whitespace-pre-wrap space-y-2">
                    {m.content}
                  </div>

                  {m.source && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Source: {m.source}</span>
                      <span>Verified RFC Context</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <MessageSquareCode className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 flex items-center gap-2">
                <span>Analyzing cryptographic protocol specifications...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about TLS 1.3 key shares, ML-KEM parameters, or VPN migration..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold rounded text-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Analyze</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
