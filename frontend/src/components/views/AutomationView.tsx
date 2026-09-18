'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserSettings } from '@/types';
import { runAutomation } from '@/lib/api';
import { Zap, Play, CheckCircle2, RefreshCw, Layers, Sparkles, Clock } from 'lucide-react';

interface AutomationViewProps {
  settings: UserSettings;
}

export const AutomationView: React.FC<AutomationViewProps> = ({ settings }) => {
  const [pipelineType, setPipelineType] = useState('research_report');
  const [topic, setTopic] = useState('Autonomous Agent Architectures 2026');
  const [jobRole, setJobRole] = useState('Senior Full Stack Developer');
  const [customGoal, setCustomGoal] = useState('Analyze competitor AI landscape, summarize core product offerings, and build a feature matrix table.');
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    pipeline: string;
    logs: Array<{ step: string; status: string; detail: string }>;
    output?: string;
    cover_letter?: string;
    top_job?: any;
    match_analysis?: string;
  } | null>(null);

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setExecutionResult(null);

    let parameters: Record<string, any> = {};
    if (pipelineType === 'research_report') {
      parameters = { topic };
    } else if (pipelineType === 'job_hunt_pipeline') {
      parameters = {
        role: jobRole,
        location: 'Remote',
        resume: 'Senior software engineer with extensive React, Node.js, Python FastAPI, and Cloud Architecture experience.',
      };
    } else {
      parameters = { goal: customGoal };
    }

    try {
      const res = await runAutomation(pipelineType, parameters, settings);
      setExecutionResult(res);
    } catch (err: any) {
      alert(`Pipeline error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10] p-6 space-y-4">
      {/* Top Banner */}
      <div className="bg-[#121622] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Automation Agent & Pipeline Runner</h2>
            <p className="text-xs text-gray-400">
              Execute multi-step autonomous agent workflows without human intervention.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={isRunning}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 disabled:opacity-40 transition-all flex items-center gap-2"
        >
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isRunning ? 'Running Pipeline...' : 'Execute Workflow'}</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
        {/* Left: Pipeline Configuration */}
        <div className="lg:col-span-5 bg-[#121622] border border-white/5 rounded-2xl p-5 overflow-y-auto space-y-4">
          <h3 className="text-xs font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Select Autonomous Pipeline</span>
          </h3>

          <div className="space-y-2">
            {[
              {
                id: 'research_report',
                title: 'Deep Research & Dossier',
                desc: 'Live Web Search → Synthesize Citations → Executive Briefing',
              },
              {
                id: 'job_hunt_pipeline',
                title: 'Autonomous Job Hunter',
                desc: 'Job Boards Scrape → ATS Match → Bespoke Cover Letter',
              },
              {
                id: 'custom_workflow',
                title: 'Custom Agent Planner',
                desc: 'Autonomous multi-step task decomposition and resolution',
              },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPipelineType(p.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  pipelineType === p.id
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                    : 'bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <p className="text-xs font-semibold text-amber-200">{p.title}</p>
                <p className="text-[11px] text-gray-400 mt-1 font-mono">{p.desc}</p>
              </button>
            ))}
          </div>

          {/* Dynamic Inputs */}
          <div className="pt-3 border-t border-white/5 space-y-3">
            {pipelineType === 'research_report' && (
              <div>
                <label className="block text-xs text-gray-300 mb-1">Research Subject / Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>
            )}

            {pipelineType === 'job_hunt_pipeline' && (
              <div>
                <label className="block text-xs text-gray-300 mb-1">Job Role Target</label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>
            )}

            {pipelineType === 'custom_workflow' && (
              <div>
                <label className="block text-xs text-gray-300 mb-1">Custom Autonomous Goal</label>
                <textarea
                  rows={4}
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  className="w-full bg-[#181d2a] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 resize-none font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Step Logs & Deliverables */}
        <div className="lg:col-span-7 bg-[#121622] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className="font-semibold text-xs text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pipeline Execution Log</span>
            </span>
            {isRunning && <span className="text-xs text-amber-400 animate-pulse font-mono">Running steps...</span>}
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {executionResult ? (
              <div className="space-y-5">
                {/* Steps Trace */}
                <div className="space-y-2">
                  {executionResult.logs?.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-white">{log.step}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono">{log.detail}</span>
                    </div>
                  ))}
                </div>

                {/* Final Output */}
                <div className="bg-[#181d2a] border border-white/5 rounded-xl p-5 prose-dark text-xs">
                  {executionResult.output && (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{executionResult.output}</ReactMarkdown>
                  )}
                  {executionResult.cover_letter && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-amber-300">Generated Targeted Cover Letter</h4>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{executionResult.cover_letter}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                <Zap className="w-10 h-10 text-gray-400" />
                <p className="text-xs">Choose a pipeline preset and click &quot;Execute Workflow&quot;.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
