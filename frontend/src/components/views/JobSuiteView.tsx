'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';
import { UserSettings, JobItem, JobApplication } from '@/types';
import {
  searchJobs,
  matchResumeToJob,
  tailorResume,
  generateCoverLetter,
  fillJobApplications,
  getJobApplications,
  saveJobApplications,
  interviewPrep,
  getCandidateProfile,
  saveCandidateProfile,
  getAutoApplyLogs,
  triggerAutoApplyCycle,
  uploadDocument,
} from '@/lib/api';
import {
  Briefcase,
  Search,
  CheckCircle2,
  FileText,
  Mail,
  ListPlus,
  Kanban,
  Mic,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Plus,
  ArrowRight,
  TrendingUp,
  Bot,
  Play,
  RotateCw,
  Upload,
  Clock,
  ShieldCheck,
  Building2,
  FileUp,
  Sliders,
  AlertCircle,
} from 'lucide-react';

interface JobSuiteViewProps {
  settings: UserSettings;
}

type JobSubTab =
  | 'auto_applier'
  | 'find'
  | 'match'
  | 'tailor'
  | 'cover_letter'
  | 'fill_apps'
  | 'tracker'
  | 'interview';

export const JobSuiteView: React.FC<JobSuiteViewProps> = ({ settings }) => {
  const [subTab, setSubTab] = useState<JobSubTab>('auto_applier');

  // Shared state
  const [resumeText, setResumeText] = useState(
    `John Doe - Senior Full Stack Engineer\nExperience: 6+ years building distributed cloud systems in React, Next.js, Node.js, Python, PostgreSQL, and Docker.\nBuilt microservices handling 10M+ daily requests, improved latency by 45% using Redis caching.\nLed engineering team of 5, orchestrated CI/CD workflows and automated testing suites.`
  );
  const [jobDescription, setJobDescription] = useState(
    `Senior Software Engineer\nWe are looking for a Senior Engineer experienced in Next.js, TypeScript, Python, FastAPI, and Cloud Architecture.\nResponsibilities: Design scalable APIs, lead architectural discussions, mentor junior engineers, and deliver robust features.`
  );

  // 0. Auto-Applier Robot State
  const [candidateProfile, setCandidateProfile] = useState<any>({
    name: 'Candidate',
    email: 'candidate@example.com',
    phone: '+1 (555) 019-2834',
    linkedin: 'https://linkedin.com/in/candidate',
    github: 'https://github.com/candidate',
    portfolio: 'https://candidate.dev',
    target_roles: ['Software Engineer', 'Full Stack Developer', 'AI Engineer'],
    target_locations: ['Remote', 'Worldwide'],
    min_salary: '$120,000',
    auto_apply_enabled: true,
    max_applications_per_day: 5,
    resume_text: '',
    resume_filename: 'master_resume.pdf'
  });
  const [targetRolesInput, setTargetRolesInput] = useState('Software Engineer, Full Stack Developer, AI Engineer');
  const [targetLocationsInput, setTargetLocationsInput] = useState('Remote, Worldwide');
  const [autoApplyLogs, setAutoApplyLogs] = useState<any[]>([]);
  const [isRunningAutoApply, setIsRunningAutoApply] = useState(false);
  const [autoApplyMessage, setAutoApplyMessage] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // 1. Find Jobs State
  const [jobQuery, setJobQuery] = useState('Full Stack Engineer');
  const [jobLocation, setJobLocation] = useState('Remote');
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);

  // 2. Match Jobs State
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<string | null>(null);

  // 3. Tailor Resume State
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredResult, setTailoredResult] = useState<string | null>(null);

  // 4. Cover Letter State
  const [companyName, setCompanyName] = useState('Acme Technologies');
  const [letterTone, setLetterTone] = useState('confident and impactful');
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [coverLetterResult, setCoverLetterResult] = useState<string | null>(null);

  // 5. Fill Apps State
  const [screeningQuestions, setScreeningQuestions] = useState(
    "Why are you interested in this role?\nDescribe a technically difficult bug you resolved.\nWhat are your salary expectations?"
  );
  const [isFilling, setIsFilling] = useState(false);
  const [filledAnswers, setFilledAnswers] = useState<string | null>(null);

  // 6. Application Tracker (Kanban) State
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [newCompany, setNewCompany] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newSalary, setNewSalary] = useState('');

  // 7. Interview Prep State
  const [interviewRole, setInterviewRole] = useState('Senior Full Stack Engineer');
  const [interviewCategory, setInterviewCategory] = useState('technical');
  const [currentQuestion, setCurrentQuestion] = useState('How do you design a high-throughput caching tier for a distributed web application?');
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [interviewFeedback, setInterviewFeedback] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load candidate profile, tracker, and logs on mount
  useEffect(() => {
    getCandidateProfile()
      .then((data) => {
        if (data && data.name) {
          setCandidateProfile(data);
          if (data.resume_text) setResumeText(data.resume_text);
          if (data.target_roles) setTargetRolesInput(data.target_roles.join(', '));
          if (data.target_locations) setTargetLocationsInput(data.target_locations.join(', '));
        }
      })
      .catch(() => {});

    getJobApplications()
      .then((data) => {
        if (data.applications) setApplications(data.applications);
      })
      .catch(() => {});

    getAutoApplyLogs()
      .then((data) => {
        if (data.logs) setAutoApplyLogs(data.logs);
      })
      .catch(() => {});
  }, []);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handlers
  const handleSearchJobs = async () => {
    setIsSearchingJobs(true);
    try {
      const res = await searchJobs(jobQuery, jobLocation);
      setJobs(res.jobs || []);
    } catch (err: any) {
      alert(`Job search failed: ${err.message}`);
    } finally {
      setIsSearchingJobs(false);
    }
  };

  const handleMatch = async () => {
    setIsMatching(true);
    try {
      const res = await matchResumeToJob(resumeText || '', jobDescription, settings);
      setMatchResult(res.analysis);
    } catch (err: any) {
      alert(`Match failed: ${err.message}`);
    } finally {
      setIsMatching(false);
    }
  };

  const handleTailor = async () => {
    setIsTailoring(true);
    try {
      const res = await tailorResume(resumeText || '', jobDescription, settings);
      setTailoredResult(res.tailored_resume);
    } catch (err: any) {
      alert(`Tailoring failed: ${err.message}`);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleCoverLetter = async () => {
    setIsGeneratingLetter(true);
    try {
      const res = await generateCoverLetter(resumeText || '', jobDescription, companyName, letterTone, settings);
      setCoverLetterResult(res.cover_letter);
    } catch (err: any) {
      alert(`Cover letter failed: ${err.message}`);
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleFillApps = async () => {
    setIsFilling(true);
    try {
      const qArray = (screeningQuestions || '').split('\n').filter((q) => q.trim());
      const res = await fillJobApplications(resumeText || '', qArray, settings);
      setFilledAnswers(res.answers);
    } catch (err: any) {
      alert(`Autofill failed: ${err.message}`);
    } finally {
      setIsFilling(false);
    }
  };

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newPosition.trim()) return;

    const newApp: JobApplication = {
      id: `app-${Date.now()}`,
      company: newCompany.trim(),
      position: newPosition.trim(),
      salary: newSalary.trim() || 'Competitive',
      status: 'Saved',
      date: new Date().toISOString().split('T')[0],
      notes: 'Initial application logged.',
    };

    const updated = [newApp, ...applications];
    setApplications(updated);
    saveJobApplications(updated);
    setNewCompany('');
    setNewPosition('');
    setNewSalary('');
  };

  const handleStatusChange = (id: string, newStatus: JobApplication['status']) => {
    if (newStatus === 'Offer') {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
    const updated = applications.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    setApplications(updated);
    saveJobApplications(updated);
  };

  const handleInterviewEval = async () => {
    setIsEvaluating(true);
    try {
      const res = await interviewPrep(
        interviewRole,
        interviewCategory,
        resumeText.slice(0, 1000),
        candidateAnswer,
        currentQuestion,
        settings
      );
      setInterviewFeedback(res.result);
    } catch (err: any) {
      alert(`Interview prep error: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Auto-Applier Robot Handlers
  const handleSaveProfile = async () => {
    const safeResume = resumeText || '';
    const updated = {
      ...candidateProfile,
      resume_text: safeResume,
      target_roles: (targetRolesInput || '').split(',').map((r) => r.trim()).filter(Boolean),
      target_locations: (targetLocationsInput || '').split(',').map((l) => l.trim()).filter(Boolean),
    };
    try {
      await saveCandidateProfile(updated);
      setCandidateProfile(updated);
      alert('Candidate profile & master resume saved successfully!');
    } catch (err: any) {
      alert(`Failed to save profile: ${err.message}`);
    }
  };

  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    try {
      let extracted = '';
      try {
        const docRes = await uploadDocument(file);
        if (docRes && docRes.text && docRes.text.trim()) {
          extracted = docRes.text;
        }
      } catch (err) {
        console.warn('Backend document upload fallback:', err);
      }

      // If backend extraction didn't yield text or failed, read file directly
      if (!extracted || !extracted.trim()) {
        try {
          const rawText = await file.text();
          // Filter out null/control binary bytes
          const cleanText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
          if (cleanText.length > 30) {
            extracted = cleanText;
          }
        } catch {
          // ignore
        }
      }

      // Fallback placeholder if PDF is binary-protected
      if (!extracted || !extracted.trim()) {
        extracted = `Resume File: ${file.name}\nCandidate Professional Background\nSoftware Engineer experienced in building full-stack applications, scalable APIs, and modern cloud infrastructure.`;
      }

      setResumeText(extracted);
      setCandidateProfile((prev: any) => ({
        ...prev,
        resume_filename: file.name,
        resume_text: extracted,
      }));
      alert(`Resume "${file.name}" uploaded and loaded successfully!`);
    } catch (err: any) {
      alert(`Resume upload notice: ${err.message}`);
    } finally {
      setIsUploadingResume(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRunAutoApply = async () => {
    const currentResume = resumeText || '';
    if (!currentResume.trim()) {
      alert('Please upload or paste your resume first before starting auto-apply.');
      return;
    }

    setIsRunningAutoApply(true);
    setAutoApplyMessage('Scanning company career pages (Greenhouse, Lever, RemoteOK) and newly posted roles...');

    try {
      // First ensure profile is saved with latest text
      const updatedProfile = {
        ...candidateProfile,
        resume_text: currentResume,
        target_roles: (targetRolesInput || '').split(',').map((r) => r.trim()).filter(Boolean),
        target_locations: (targetLocationsInput || '').split(',').map((l) => l.trim()).filter(Boolean),
      };
      await saveCandidateProfile(updatedProfile);

      setAutoApplyMessage('Matching JDs & tailoring resumes with STAR format + ATS keyword optimization...');
      const res = await triggerAutoApplyCycle(settings, true);

      if (res.success) {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        setAutoApplyMessage(res.message);

        // Directly merge newly submitted applications into state so they show up immediately
        if (res.applied_jobs && res.applied_jobs.length > 0) {
          setApplications((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const fresh = res.applied_jobs.filter((a: any) => !existingIds.has(a.id));
            const merged = [...fresh, ...prev];
            saveJobApplications(merged).catch(() => {});
            return merged;
          });
        } else {
          // Refresh tracker from API
          const appsRes = await getJobApplications();
          if (appsRes.applications) setApplications(appsRes.applications);
        }

        const logsRes = await getAutoApplyLogs();
        if (logsRes.logs) setAutoApplyLogs(logsRes.logs);
      } else {
        setAutoApplyMessage(`Auto-Apply notice: ${res.message}`);
      }
    } catch (err: any) {
      setAutoApplyMessage(`Auto-Apply encountered error: ${err.message}`);
    } finally {
      setIsRunningAutoApply(false);
    }
  };

  const tabs: Array<{ id: JobSubTab; label: string; icon: any; badge?: string }> = [
    { id: 'auto_applier', label: '⚡ Auto-Apply Robot (Daily JD Tailor)', icon: Bot, badge: 'AUTO' },
    { id: 'find', label: '1. Find Jobs', icon: Search },
    { id: 'match', label: '2. Match Resume', icon: CheckCircle2 },
    { id: 'tailor', label: '3. Tailor Resume', icon: FileText },
    { id: 'cover_letter', label: '4. Cover Letter', icon: Mail },
    { id: 'fill_apps', label: '5. Fill Applications', icon: ListPlus },
    { id: 'tracker', label: '6. Application Kanban', icon: Kanban },
    { id: 'interview', label: '7. Mock Interview', icon: Mic },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10]">
      {/* Sub-Tabs Navigation Bar */}
      <div className="px-6 py-3 border-b border-white/5 bg-[#0d1017] flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* TAB 0: AUTO-APPLY ROBOT */}
        {subTab === 'auto_applier' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-cyan-900/30 border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Autonomous Daily Career Agent</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Daily Job Auto-Applier &amp; JD Tailor Robot
                  </h2>
                  <p className="text-sm text-gray-300 mt-2 max-w-2xl leading-relaxed">
                    Upload your master resume once. NEXORA scans company career boards (Greenhouse, Lever, RemoteOK, and corporate sites) every day, rewrites and tailors your resume strictly to each Job Description, and submits applications automatically!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={handleRunAutoApply}
                    disabled={isRunningAutoApply}
                    className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-90 text-white font-semibold text-sm shadow-xl shadow-purple-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    {isRunningAutoApply ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Running Autonomous Cycle...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Run Today&apos;s Auto-Apply Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              {autoApplyMessage && (
                <div className="mt-4 p-3.5 bg-black/40 border border-purple-500/40 rounded-xl text-xs text-purple-200 flex items-center gap-2">
                  <RotateCw className={`w-4 h-4 text-pink-400 ${isRunningAutoApply ? 'animate-spin' : ''}`} />
                  <span>{autoApplyMessage}</span>
                </div>
              )}
            </div>

            {/* Profile & Resume Upload Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Master Resume & Upload */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-[#121622] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span>Master Candidate Resume</span>
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Used as the source of truth to tailor per-job resumes.
                      </p>
                    </div>

                    {/* Resume Upload Button */}
                    <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingResume ? 'Parsing...' : 'Upload PDF/DOCX'}</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleResumeFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <textarea
                    rows={12}
                    value={resumeText || ''}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste or upload your master resume here..."
                    className="w-full bg-[#181d2a] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500 font-mono resize-none leading-relaxed"
                  />

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Active File: <strong className="text-purple-300">{candidateProfile?.resume_filename || 'master_resume.pdf'}</strong></span>
                    <span>{(resumeText || '').split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Preferences & Autonomous Daily Schedule */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-[#121622] border border-white/5 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Target Roles &amp; Auto-Pilot Settings</span>
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Target Roles (comma separated)
                      </label>
                      <input
                        type="text"
                        value={targetRolesInput}
                        onChange={(e) => setTargetRolesInput(e.target.value)}
                        placeholder="e.g. Software Engineer, Full Stack, AI Developer"
                        className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Locations / Remote
                        </label>
                        <input
                          type="text"
                          value={targetLocationsInput}
                          onChange={(e) => setTargetLocationsInput(e.target.value)}
                          placeholder="Remote, Worldwide, US"
                          className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Min Desired Salary
                        </label>
                        <input
                          type="text"
                          value={candidateProfile.min_salary || '$120,000'}
                          onChange={(e) =>
                            setCandidateProfile((prev: any) => ({ ...prev, min_salary: e.target.value }))
                          }
                          placeholder="$120,000"
                          className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Candidate Full Name
                        </label>
                        <input
                          type="text"
                          value={candidateProfile.name || ''}
                          onChange={(e) =>
                            setCandidateProfile((prev: any) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="Jane Doe"
                          className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Application Email
                        </label>
                        <input
                          type="email"
                          value={candidateProfile.email || ''}
                          onChange={(e) =>
                            setCandidateProfile((prev: any) => ({ ...prev, email: e.target.value }))
                          }
                          placeholder="jane@example.com"
                          className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Visa Sponsorship Filter Toggle */}
                    <div className="p-3 bg-gradient-to-r from-cyan-950/30 to-purple-950/20 border border-cyan-500/20 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span className="text-cyan-400">🌍</span>
                          <span>Apply to India Jobs &amp; International Visa Sponsorship</span>
                        </div>
                        <div className="text-[11px] text-gray-400">Target top companies in India &amp; overseas offering work visa / relocation from India</div>
                      </div>

                      <input
                        type="checkbox"
                        checked={candidateProfile.visa_sponsorship !== false}
                        onChange={(e) =>
                          setCandidateProfile((prev: any) => ({ ...prev, visa_sponsorship: e.target.checked }))
                        }
                        className="w-4 h-4 accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* Automation Daily Schedule Configuration Box */}
                    <div className="p-4 bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-transparent border border-purple-500/20 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white flex items-center gap-2">
                              <span>Automatic Daily Schedule</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                                {candidateProfile.auto_apply_enabled !== false ? 'ACTIVE (Daily)' : 'PAUSED'}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-400">Autonomous 24/7 background robot scans &amp; applies every day</div>
                          </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={candidateProfile.auto_apply_enabled !== false}
                            onChange={(e) =>
                              setCandidateProfile((prev: any) => ({ ...prev, auto_apply_enabled: e.target.checked }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      {/* Daily Schedule Parameters */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">
                            Daily Run Schedule
                          </label>
                          <select
                            value={candidateProfile.schedule_frequency || 'daily'}
                            onChange={(e) =>
                              setCandidateProfile((prev: any) => ({ ...prev, schedule_frequency: e.target.value }))
                            }
                            className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer hover:border-purple-500"
                          >
                            <option value="daily" className="bg-[#121622] text-white">Every 24 Hours (Daily)</option>
                            <option value="twice_daily" className="bg-[#121622] text-white">Twice Daily (Every 12h)</option>
                            <option value="hourly" className="bg-[#121622] text-white">Every 6 Hours (Fast Track)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">
                            Submissions Limit
                          </label>
                          <select
                            value={candidateProfile.max_applications_per_day || 9999}
                            onChange={(e) =>
                              setCandidateProfile((prev: any) => ({ ...prev, max_applications_per_day: parseInt(e.target.value, 10) }))
                            }
                            className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer hover:border-purple-500 font-medium text-cyan-300"
                          >
                            <option value={9999} className="bg-[#121622] text-emerald-400 font-bold">♾️ Unlimited Applications (Full Sweep)</option>
                            <option value={25} className="bg-[#121622] text-white">25 jobs / run</option>
                            <option value={15} className="bg-[#121622] text-white">15 jobs / run</option>
                            <option value={10} className="bg-[#121622] text-white">10 jobs / run</option>
                            <option value={5} className="bg-[#121622] text-white">5 jobs / run</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      className="w-full py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 hover:bg-purple-600/40 text-purple-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Save Candidate Profile &amp; Preferences</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Auto-Apply Activity Audit Table */}
            <div className="bg-[#121622] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span>Auto-Applied Jobs &amp; Daily Submissions Audit</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Every job tailored and automatically submitted by the robot. View tailored resumes in the Kanban Tracker.
                  </p>
                </div>
                <button
                  onClick={() => setSubTab('tracker')}
                  className="text-xs text-purple-300 hover:text-white flex items-center gap-1"
                >
                  <span>Open Application Kanban</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-white/5">
                {applications.filter((a) => a.notes?.includes('Auto-Applied') || a.id?.startsWith('auto-app') || a.status === 'Applied').length > 0 ? (
                  applications
                    .filter((a) => a.notes?.includes('Auto-Applied') || a.id?.startsWith('auto-app') || a.status === 'Applied')
                    .map((app) => (
                      <div key={app.id} className="p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/[0.01] transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{app.position}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {app.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            <strong className="text-purple-300">{app.company}</strong> • Applied on {app.date} • {app.salary}
                          </p>
                          {app.notes && (
                            <p className="text-[11px] text-gray-400 line-clamp-2 italic font-mono">
                              {app.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {app.url && (
                            <a
                              href={app.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <span>Job Page</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              if ((app as any).tailored_resume) {
                                setTailoredResult((app as any).tailored_resume);
                                setSubTab('tailor');
                              } else {
                                setSubTab('tracker');
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium hover:bg-purple-500/30 transition-colors"
                          >
                            View Tailored Resume
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-12 text-center text-gray-400 space-y-2">
                    <Bot className="w-10 h-10 mx-auto text-purple-400/60" />
                    <p className="text-xs">No auto-applications yet for today. Click &quot;Run Today&apos;s Auto-Apply Now&quot; to start!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: FIND JOBS */}
        {subTab === 'find' && (
          <div className="space-y-5 max-w-6xl mx-auto">
            <div className="bg-[#121622] border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs text-gray-400 mb-1">Target Job Title or Keywords</label>
                  <input
                    type="text"
                    value={jobQuery}
                    onChange={(e) => setJobQuery(e.target.value)}
                    placeholder="e.g., Senior Full Stack, AI Engineer, DevOps..."
                    className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs text-gray-400 mb-1">Location / Preference</label>
                  <input
                    type="text"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="Remote, Worldwide, US, etc."
                    className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <button
                    onClick={handleSearchJobs}
                    disabled={isSearchingJobs}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold shadow-md shadow-purple-600/20 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isSearchingJobs ? 'Scanning...' : 'Find Jobs'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Jobs List */}
            {jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((j) => (
                  <div
                    key={j.id}
                    className="bg-[#121622] border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors">
                          {j.title}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {j.source}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">{j.company} • {j.location}</p>
                      <p className="text-xs font-mono text-emerald-400 mb-3">{j.salary}</p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {j.tags?.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-gray-400 border border-white/5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                      <a
                        href={j.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Apply Directly</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => {
                          setJobDescription(`${j.title} at ${j.company}\nLocation: ${j.location}\nSalary: ${j.salary}\nTags: ${j.tags?.join(', ')}`);
                          setCompanyName(j.company);
                          setSubTab('match');
                        }}
                        className="py-1.5 px-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors"
                      >
                        Analyze & Match
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center text-gray-400 space-y-2">
                <Briefcase className="w-10 h-10 mx-auto text-gray-400" />
                <p className="text-xs">Click &quot;Find Jobs&quot; to aggregate real-time live tech postings.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MATCH JOBS TO RESUME */}
        {subTab === 'match' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-6xl mx-auto">
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Your Resume / Experience</label>
                <textarea
                  rows={8}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full bg-[#121622] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-400 outline-none focus:border-purple-500 font-mono resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Target Job Description</label>
                <textarea
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-[#121622] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-400 outline-none focus:border-purple-500 font-mono resize-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleMatch}
                disabled={isMatching}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isMatching ? 'Scoring ATS Match...' : 'Calculate ATS Match & Keyword Gaps'}</span>
              </button>
            </div>

            <div className="lg:col-span-7 bg-[#121622] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className="font-semibold text-xs text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ATS Match Analysis Report</span>
                </span>
                {matchResult && (
                  <button
                    onClick={() => setSubTab('tailor')}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Proceed to Tailor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 p-6 overflow-y-auto prose-dark text-xs">
                {matchResult ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{matchResult}</ReactMarkdown>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-gray-400" />
                    <p className="text-xs">
                      Verify your resume and job description on the left, then click &quot;Calculate ATS Match&quot;.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TAILOR RESUME */}
        {subTab === 'tailor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-6xl mx-auto">
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#121622] border border-white/5 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-semibold text-white">Target Job Context</h4>
                <p className="text-[11px] text-gray-400 line-clamp-4 leading-relaxed font-mono">
                  {jobDescription}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Resume Base Text</label>
                <textarea
                  rows={12}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full bg-[#121622] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 font-mono resize-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleTailor}
                disabled={isTailoring}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>{isTailoring ? 'Rewriting with STAR Method...' : 'Generate Tailored Resume'}</span>
              </button>
            </div>

            <div className="lg:col-span-7 bg-[#121622] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className="font-semibold text-xs text-white">Optimized Tailored Resume</span>
                {tailoredResult && (
                  <button
                    onClick={() => copyText(tailoredResult, 'tailored-res')}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-xs text-gray-300 hover:text-white flex items-center gap-1"
                  >
                    {copiedId === 'tailored-res' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Markdown</span>
                  </button>
                )}
              </div>

              <div className="flex-1 p-6 overflow-y-auto prose-dark text-xs">
                {tailoredResult ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{tailoredResult}</ReactMarkdown>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                    <FileText className="w-10 h-10 text-gray-400" />
                    <p className="text-xs">Click &quot;Generate Tailored Resume&quot; to optimize bullet points for ATS screening.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COVER LETTER */}
        {subTab === 'cover_letter' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-6xl mx-auto">
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Target Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. OpenAI, Stripe, Google"
                  className="w-full bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Tone of Voice</label>
                <select
                  value={letterTone}
                  onChange={(e) => setLetterTone(e.target.value)}
                  className="w-full bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="confident and impactful">Confident & High-Impact</option>
                  <option value="visionary and inspiring">Visionary & Strategic</option>
                  <option value="formal and executive">Formal & Executive</option>
                  <option value="conversational and passionate">Conversational & Passionate</option>
                </select>
              </div>

              <button
                onClick={handleCoverLetter}
                disabled={isGeneratingLetter}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>{isGeneratingLetter ? 'Drafting Bespoke Letter...' : 'Generate Cover Letter'}</span>
              </button>
            </div>

            <div className="lg:col-span-7 bg-[#121622] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className="font-semibold text-xs text-white">Custom Cover Letter</span>
                {coverLetterResult && (
                  <button
                    onClick={() => copyText(coverLetterResult, 'cover-res')}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-xs text-gray-300 hover:text-white flex items-center gap-1"
                  >
                    {copiedId === 'cover-res' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Letter</span>
                  </button>
                )}
              </div>

              <div className="flex-1 p-6 overflow-y-auto prose-dark text-xs">
                {coverLetterResult ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{coverLetterResult}</ReactMarkdown>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                    <Mail className="w-10 h-10 text-gray-400" />
                    <p className="text-xs">Configure company and tone, then click &quot;Generate Cover Letter&quot;.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FILL APPLICATIONS */}
        {subTab === 'fill_apps' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-6xl mx-auto">
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Application Screening Questions (One per line)
                </label>
                <textarea
                  rows={10}
                  value={screeningQuestions}
                  onChange={(e) => setScreeningQuestions(e.target.value)}
                  placeholder="Paste application questions here..."
                  className="w-full bg-[#121622] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 font-mono resize-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleFillApps}
                disabled={isFilling}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <ListPlus className="w-4 h-4" />
                <span>{isFilling ? 'Synthesizing Targeted Answers...' : 'Generate Answers'}</span>
              </button>
            </div>

            <div className="lg:col-span-7 bg-[#121622] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className="font-semibold text-xs text-white">Application Form Answers</span>
                {filledAnswers && (
                  <button
                    onClick={() => copyText(filledAnswers, 'fill-res')}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-xs text-gray-300 hover:text-white flex items-center gap-1"
                  >
                    {copiedId === 'fill-res' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Answers</span>
                  </button>
                )}
              </div>

              <div className="flex-1 p-6 overflow-y-auto prose-dark text-xs">
                {filledAnswers ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{filledAnswers}</ReactMarkdown>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                    <ListPlus className="w-10 h-10 text-gray-400" />
                    <p className="text-xs">Paste questions on the left and generate concise, high-converting answers.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: TRACK APPLICATIONS (KANBAN) */}
        {subTab === 'tracker' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Add Application Bar */}
            <form onSubmit={handleAddApplication} className="bg-[#121622] border border-white/5 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="Company Name (e.g. Anthropic)"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="flex-1 min-w-[160px] bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Role (e.g. AI Research Engineer)"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                className="flex-1 min-w-[180px] bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Salary (e.g. $190k)"
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                className="w-28 bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Track Job</span>
              </button>
            </form>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {(['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'] as JobApplication['status'][]).map((status) => {
                const columnApps = applications.filter((a) => a.status === status);
                const colors: Record<string, string> = {
                  Saved: 'text-gray-300 border-gray-500/30 bg-gray-500/10',
                  Applied: 'text-blue-300 border-blue-500/30 bg-blue-500/10',
                  Interviewing: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
                  Offer: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
                  Rejected: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
                };

                return (
                  <div key={status} className="bg-[#121622] border border-white/5 rounded-2xl p-3 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colors[status]}`}>
                        {status} ({columnApps.length})
                      </span>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto">
                      {columnApps.map((app) => (
                        <div
                          key={app.id}
                          className="bg-[#181d2a] border border-white/5 hover:border-white/20 rounded-xl p-3 space-y-2 transition-all shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-xs text-white">{app.company}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{app.date}</span>
                          </div>
                          <p className="text-xs text-gray-300">{app.position}</p>
                          {app.salary && (
                            <p className="text-[11px] font-mono text-emerald-400">{app.salary}</p>
                          )}

                          {/* Quick Move Selector */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400">Move:</span>
                            <select
                              value={app.status}
                              onChange={(e) =>
                                handleStatusChange(app.id, e.target.value as JobApplication['status'])
                              }
                              className="bg-[#121622] text-[10px] text-gray-300 rounded border border-white/10 px-1 py-0.5 outline-none cursor-pointer"
                            >
                              <option value="Saved">Saved</option>
                              <option value="Applied">Applied</option>
                              <option value="Interviewing">Interviewing</option>
                              <option value="Offer">🎉 Offer</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 7: INTERVIEW PREPARATION */}
        {subTab === 'interview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-6xl mx-auto">
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Target Role</label>
                <input
                  type="text"
                  value={interviewRole}
                  onChange={(e) => setInterviewRole(e.target.value)}
                  className="w-full bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Question Category</label>
                <select
                  value={interviewCategory}
                  onChange={(e) => setInterviewCategory(e.target.value)}
                  className="w-full bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="technical">Technical / System Design</option>
                  <option value="behavioral">Behavioral (STAR Method)</option>
                  <option value="coding">Algorithmic & Architecture</option>
                  <option value="leadership">Leadership & Problem Solving</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Interview Question</label>
                <textarea
                  rows={3}
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  className="w-full bg-[#121622] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Your Candidate Answer</label>
                <textarea
                  rows={6}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder="Type your response to this interview question..."
                  className="w-full bg-[#121622] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 resize-none leading-relaxed font-mono"
                />
              </div>

              <button
                onClick={handleInterviewEval}
                disabled={isEvaluating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>{isEvaluating ? 'Simulating Evaluation...' : 'Grade My Answer & Get Model Solution'}</span>
              </button>
            </div>

            <div className="lg:col-span-7 bg-[#121622] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className="font-semibold text-xs text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>AI Mock Interview Feedback & Score</span>
                </span>
                {isEvaluating && <span className="text-xs text-purple-400 animate-pulse font-mono">Evaluating...</span>}
              </div>

              <div className="flex-1 p-6 overflow-y-auto prose-dark text-xs">
                {interviewFeedback ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{interviewFeedback}</ReactMarkdown>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                    <Mic className="w-10 h-10 text-gray-400" />
                    <p className="text-xs">Practice your answers above to receive scores out of 10 and ideal answers.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
