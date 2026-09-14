import React, { useState } from 'react';
import { HardHat, CheckCircle2, Clock, Upload, Camera, Calendar, Building, Layers } from 'lucide-react';
import { DropzoneUploader } from '../../../components/common/DropzoneUploader';

interface ConstructionMilestone {
  id: number;
  name: string;
  targetDate: string;
  completionPct: number;
  status: 'completed' | 'in_progress' | 'pending';
  photosCount: number;
}

const DEFAULT_MILESTONES: ConstructionMilestone[] = [
  { id: 1, name: 'Excavation & Foundation Pillaring', targetDate: 'Jan 2026', completionPct: 100, status: 'completed', photosCount: 12 },
  { id: 2, name: 'Basement & Ground Floor Slab', targetDate: 'Mar 2026', completionPct: 100, status: 'completed', photosCount: 8 },
  { id: 3, name: 'Superstructure (Floors 1 - 15)', targetDate: 'Jul 2026', completionPct: 75, status: 'in_progress', photosCount: 15 },
  { id: 4, name: 'Brickwork & External Plastering', targetDate: 'Oct 2026', completionPct: 30, status: 'in_progress', photosCount: 5 },
  { id: 5, name: 'MEP Electrical & Plumbing Fitting', targetDate: 'Dec 2026', completionPct: 0, status: 'pending', photosCount: 0 },
  { id: 6, name: 'Interior Finishing & Possession Handover', targetDate: 'Mar 2027', completionPct: 0, status: 'pending', photosCount: 0 },
];

export const BuilderProgressPage: React.FC = () => {
  const [milestones, setMilestones] = useState<ConstructionMilestone[]>(DEFAULT_MILESTONES);
  const [overallProgress, setOverallProgress] = useState<number>(60);
  const [selectedMilestone, setSelectedMilestone] = useState<ConstructionMilestone | null>(DEFAULT_MILESTONES[2]);

  const updateProgress = (id: number, newPct: number) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              completionPct: newPct,
              status: newPct === 100 ? 'completed' : newPct > 0 ? 'in_progress' : 'pending',
            }
          : m
      )
    );
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Construction Progress &amp; Milestone Tracker</h1>
          <p className="text-sm text-slate-400">Manage site construction updates, upload photos, and notify buyers</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
            Project: Sky Villas Tower A
          </span>
        </div>
      </div>

      {/* Overall Progress Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl shrink-0">
              <HardHat className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Overall Project Completion</h3>
              <p className="text-xs text-slate-400">Target Handover Date: March 2027 &bull; On Schedule</p>
            </div>
          </div>
          <p className="text-4xl font-extrabold text-amber-400 font-heading">{overallProgress}%</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Milestones List */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Construction Milestones ({milestones.length})
          </h3>

          <div className="space-y-3">
            {milestones.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMilestone(m)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                  selectedMilestone?.id === m.id
                    ? 'bg-slate-800/80 border-primary text-white shadow-glow-primary/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    m.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    m.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {m.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : `#${m.id}`}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{m.name}</h4>
                    <p className="text-xs text-slate-400">Target: {m.targetDate} &bull; {m.photosCount} photos uploaded</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-amber-400">{m.completionPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Milestone Photo Uploader & Slider */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          {selectedMilestone ? (
            <>
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs text-primary font-bold uppercase tracking-wider block">Editing Milestone #{selectedMilestone.id}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedMilestone.name}</h3>
              </div>

              {/* Progress Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Milestone Progress (%)</span>
                  <span className="text-amber-400 font-bold font-mono">{selectedMilestone.completionPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={selectedMilestone.completionPct}
                  onChange={(e) => updateProgress(selectedMilestone.id, Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Dropzone Uploader */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Upload Site Photos &amp; Inspection Reports
                </label>
                <DropzoneUploader
                  accept="image/*,application/pdf"
                  label="Drop site photos or PDF inspection reports"
                  subLabel="Supports JPG, PNG, PDF up to 10MB"
                />
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-10">Select a milestone to manage details</p>
          )}
        </div>
      </div>
    </div>
  );
};
