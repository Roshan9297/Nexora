'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserSettings } from '@/types';
import { composeEmail } from '@/lib/api';
import { Mail, Send, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';

interface EmailViewProps {
  settings: UserSettings;
}

export const EmailView: React.FC<EmailViewProps> = ({ settings }) => {
  const [recipient, setRecipient] = useState('team@partner.com');
  const [goal, setGoal] = useState('Propose strategic partnership for AI integrations');
  const [context, setContext] = useState('We have built NEXORA AI, an autonomous multi-agent platform. Looking to collaborate on enterprise workflow automation.');
  const [tone, setTone] = useState('professional, concise and persuasive');
  const [isComposing, setIsComposing] = useState(false);
  const [result, setResult] = useState<{
    recipient: string;
    subjects: string[];
    body: string;
    mailto_url: string;
    raw: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsComposing(true);
    try {
      const res = await composeEmail(recipient, goal, context, tone, settings);
      setResult(res);
    } catch (err: any) {
      alert(`Email generation error: ${err.message}`);
    } finally {
      setIsComposing(false);
    }
  };

  const copyEmail = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Subject: ${result.subjects[0] || ''}\n\n${result.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10] p-6 space-y-4">
      {/* Top Banner */}
      <div className="bg-[#121622] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Email Agent & Mailto Launcher</h2>
            <p className="text-xs text-gray-400">
              Draft executive-level cold emails, partner outreach, or follow-ups with high-converting subject lines.
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
        {/* Left: Input Form */}
        <form onSubmit={handleCompose} className="lg:col-span-5 bg-[#121622] border border-white/5 rounded-2xl p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Recipient Email / Name</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. alex@company.com"
              className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">Email Objective / Goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Schedule quick 15-min discovery call"
              className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">Key Context & Value Proposition</label>
            <textarea
              rows={5}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Add specific details, past discussions, or metrics..."
              className="w-full bg-[#181d2a] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500 resize-none leading-relaxed font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">Tone & Persona</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
            >
              <option value="professional, concise and persuasive">Professional, Concise & Persuasive</option>
              <option value="warm, casual and friendly">Warm, Casual & Friendly</option>
              <option value="formal and executive">Formal & Executive</option>
              <option value="urgent and direct">Urgent & Direct Follow-Up</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isComposing}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isComposing ? 'Crafting Email...' : 'Generate Email Draft'}</span>
          </button>
        </form>

        {/* Right: Email Output Panel */}
        <div className="lg:col-span-7 bg-[#121622] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className="font-semibold text-xs text-white">Synthesized Email</span>
            {result && (
              <div className="flex items-center gap-2">
                <button
                  onClick={copyEmail}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-gray-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
                <a
                  href={result.mailto_url}
                  className="px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Mail Client</span>
                </a>
              </div>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {result ? (
              <div className="space-y-4">
                {/* Alternative Subject Lines */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                    Subject Line Candidates:
                  </span>
                  {result.subjects.map((s, idx) => (
                    <div key={idx} className="text-xs text-gray-200 font-medium flex items-center gap-2">
                      <span className="text-gray-400">{idx + 1}.</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>

                {/* Email Body */}
                <div className="bg-[#181d2a] border border-white/5 rounded-xl p-5 text-xs text-gray-100 whitespace-pre-wrap leading-relaxed font-sans">
                  {result.body}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                <Mail className="w-10 h-10 text-gray-400" />
                <p className="text-xs">Fill in your recipient and goals to craft an email draft.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
