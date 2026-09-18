'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserSettings } from '@/types';
import { executeCode, analyzeCode } from '@/lib/api';
import { Play, Sparkles, Check, Copy, Bug, BookOpen, ShieldCheck, RefreshCw, Terminal } from 'lucide-react';

interface CodingViewProps {
  settings: UserSettings;
}

export const CodingView: React.FC<CodingViewProps> = ({ settings }) => {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(
    `# NEXORA Coding Agent Sandbox\n# Write Python or JavaScript and click 'Run Code'\n\ndef fibonacci(n):\n    sequence = [0, 1]\n    for i in range(2, n):\n        sequence.append(sequence[i-1] + sequence[i-2])\n    return sequence\n\nresult = fibonacci(12)\nprint("Fibonacci Sequence (first 12):", result)\n`
  );
  const [stdout, setStdout] = useState<string | null>(null);
  const [stderr, setStderr] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setStdout(null);
    setStderr(null);
    try {
      const res = await executeCode(language, code);
      setStdout(res.stdout || '');
      setStderr(res.stderr || '');
    } catch (err: any) {
      setStderr(err.message || 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleAiAction = async (task: string) => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeCode(code, task, language, '', settings);
      setAiAnalysis(res.analysis || 'No feedback generated.');
    } catch (err: any) {
      setAiAnalysis(`Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10]">
      {/* Top Toolbar */}
      <div className="px-6 py-3 border-b border-white/5 bg-[#0d1017] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => {
              const newLang = e.target.value;
              setLanguage(newLang);
              if (newLang === 'javascript') {
                setCode(`// NEXORA JavaScript Runner\nfunction calculatePrimes(max) {\n  const primes = [];\n  for (let i = 2; i <= max; i++) {\n    if (primes.every(p => i % p !== 0)) primes.push(i);\n  }\n  return primes;\n}\nconsole.log("Primes up to 50:", calculatePrimes(50));\n`);
              } else if (newLang === 'python') {
                setCode(`def fibonacci(n):\n    sequence = [0, 1]\n    for i in range(2, n):\n        sequence.append(sequence[i-1] + sequence[i-2])\n    return sequence\n\nprint("Fibonacci:", fibonacci(10))\n`);
              }
            }}
            aria-label="Coding Language"
            className="bg-[#161a23] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
          >
            <option value="python">Python 3.13</option>
            <option value="javascript">JavaScript (Node.js)</option>
          </select>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>

        {/* AI Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAiAction('review')}
            disabled={isAnalyzing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs border border-white/5 transition-colors"
          >
            <Bug className="w-3.5 h-3.5 text-rose-400" />
            <span>Bug Review</span>
          </button>
          <button
            onClick={() => handleAiAction('explain')}
            disabled={isAnalyzing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs border border-white/5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Explain</span>
          </button>
          <button
            onClick={() => handleAiAction('test')}
            disabled={isAnalyzing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs border border-white/5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gen Tests</span>
          </button>
          <button
            onClick={() => handleAiAction('refactor')}
            disabled={isAnalyzing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs border border-white/5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>Refactor</span>
          </button>
          <button
            onClick={copyCode}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/5 transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Workspace (Editor + Output Split) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        {/* Editor Area */}
        <div className="h-full flex flex-col border-r border-white/5 bg-[#0b0d13]">
          <div className="px-4 py-2 border-b border-white/5 text-[11px] font-mono text-gray-400 flex items-center justify-between">
            <span>main.{language === 'python' ? 'py' : 'js'}</span>
            <span>UTF-8</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full bg-transparent p-4 font-mono text-xs text-gray-200 resize-none outline-none leading-relaxed select-text"
            spellCheck={false}
          />
        </div>

        {/* Right Panel: Terminal Output & AI Analysis */}
        <div className="h-full flex flex-col bg-[#0d1017] overflow-hidden">
          {/* Terminal Sandbox Output */}
          <div className="h-1/2 flex flex-col border-b border-white/5">
            <div className="px-4 py-2 bg-black/40 border-b border-white/5 text-[11px] font-mono text-gray-400 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Execution Output (Sandbox)</span>
            </div>
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-black/60">
              {stdout === null && stderr === null ? (
                <span className="text-gray-400 italic">Click &quot;Run Code&quot; to execute your script in the Python/Node environment.</span>
              ) : (
                <>
                  {stdout && <div className="text-emerald-300 whitespace-pre-wrap">{stdout}</div>}
                  {stderr && <div className="text-rose-400 whitespace-pre-wrap mt-2">{stderr}</div>}
                </>
              )}
            </div>
          </div>

          {/* AI Architecture & Review Panel */}
          <div className="h-1/2 flex flex-col overflow-hidden bg-[#0d1017]">
            <div className="px-4 py-2 bg-black/40 border-b border-white/5 text-[11px] font-mono text-gray-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>NEXORA AI Code Assistant</span>
              {isAnalyzing && <span className="text-cyan-400 animate-pulse text-[10px] ml-2">Analyzing...</span>}
            </div>
            <div className="flex-1 p-4 overflow-y-auto prose-dark text-xs">
              {aiAnalysis ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAnalysis}</ReactMarkdown>
              ) : (
                <div className="text-gray-400 italic">
                  Select Bug Review, Explain, Gen Tests, or Refactor to trigger senior AI code analysis.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
