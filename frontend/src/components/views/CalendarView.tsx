'use client';

import React, { useState } from 'react';
import { UserSettings } from '@/types';
import { parseCalendarEvent } from '@/lib/api';
import { Calendar, Download, ExternalLink, Sparkles, Clock, MapPin, Check } from 'lucide-react';

interface CalendarViewProps {
  settings: UserSettings;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ settings }) => {
  const [prompt, setPrompt] = useState('Final round engineering interview with Acme Corp on Friday at 3:00 PM for 45 minutes on Google Meet');
  const [isParsing, setIsParsing] = useState(false);
  const [eventData, setEventData] = useState<{
    event: {
      title: string;
      description: string;
      location: string;
      start_time: string;
      end_time: string;
      summary_text: string;
    };
    ics_content: string;
    gcal_url: string;
  } | null>(null);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsParsing(true);
    try {
      const res = await parseCalendarEvent(prompt.trim(), settings);
      setEventData(res);
    } catch (err: any) {
      alert(`Scheduling error: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const downloadICS = () => {
    if (!eventData) return;
    const blob = new Blob([eventData.ics_content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${eventData.event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10] p-6 space-y-4">
      {/* Top Banner */}
      <div className="bg-[#121622] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Calendar Agent (.ICS & Google Calendar)</h2>
            <p className="text-xs text-gray-400">
              Schedule meetings using pure natural language. Generates downloadable `.ics` files and instant Google Calendar links.
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
        {/* Left: Natural Language Input */}
        <form onSubmit={handleParse} className="lg:col-span-5 bg-[#121622] border border-white/5 rounded-2xl p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs text-gray-300 mb-1.5">Describe Event in Natural Language</label>
            <textarea
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. System design prep session tomorrow at 4:30 PM for 1 hour with John on Zoom..."
              className="w-full bg-[#181d2a] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 resize-none leading-relaxed font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isParsing || !prompt.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isParsing ? 'Parsing Dates & Times...' : 'Parse & Schedule Event'}</span>
          </button>
        </form>

        {/* Right: Scheduled Event Card & Exports */}
        <div className="lg:col-span-7 bg-[#121622] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className="font-semibold text-xs text-white">Event Confirmation</span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {eventData ? (
              <div className="bg-[#181d2a] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">{eventData.event.title}</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">{eventData.event.description}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Confirmed
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/5 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>Time: <strong className="text-white font-mono">{eventData.event.start_time}</strong> to <strong className="text-white font-mono">{eventData.event.end_time}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>Location: <strong className="text-white">{eventData.event.location}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                  <button
                    onClick={downloadICS}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .ICS Calendar File</span>
                  </button>

                  <a
                    href={eventData.gcal_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Add to Google Calendar</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                <Calendar className="w-10 h-10 text-gray-400" />
                <p className="text-xs">Enter your natural language schedule request to create an event.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
