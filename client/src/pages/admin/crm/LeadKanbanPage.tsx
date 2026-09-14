import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Building2, User, Phone, MapPin, RefreshCw,
  TrendingUp, Sparkles, AlertCircle, Layers, Search,
  Filter, ArrowUpDown, DollarSign, Flame, CheckCircle2,
  X, Clock, ChevronDown
} from 'lucide-react';
import { adminCRMApi, LeadItem } from '../../../api/admin-crm.api';
import { toast } from '../../../contexts/ToastContext';

const STAGES = [
  { key: 'new',                   label: 'New Inbound',          color: '#6366f1' },
  { key: 'contacted',             label: 'Contacted',            color: '#3b82f6' },
  { key: 'interested',            label: 'Interested',           color: '#06b6d4' },
  { key: 'site_visit_scheduled',  label: 'Site Visit',           color: '#10b981' },
  { key: 'negotiation',           label: 'Negotiation',          color: '#f59e0b' },
  { key: 'booking_requested',     label: 'Booking Req.',         color: '#f97316' },
  { key: 'booked',                label: 'Booked / Won',         color: '#22c55e' },
  { key: 'lost',                  label: 'Lost',                 color: '#ef4444' },
  { key: 'closed',                label: 'Closed',               color: '#8b5cf6' },
];

const PRIORITY_BADGES: Record<string, { label: string; cls: string }> = {
  vip:    { label: '⭐ VIP',    cls: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-400/30' },
  hot:    { label: '🔥 Hot',    cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/30' },
  high:   { label: '↑ High',   cls: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-400/30' },
  medium: { label: 'Medium',   cls: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/30' },
  low:    { label: 'Low',      cls: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400/30' },
};

const formatBudget = (v?: number) => {
  if (!v || v <= 0) return '—';
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
};

interface KanbanCardProps {
  lead: LeadItem;
  onView: (id: number) => void;
  isUpdating?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ lead, onView, isUpdating }) => {
  const badge = PRIORITY_BADGES[lead.priority] || PRIORITY_BADGES.medium;
  const leadScore = lead.lead_score ?? 50;

  return (
    <div
      className={`bg-card rounded-2xl border border-border p-3.5 shadow-soft hover:shadow-card hover:border-primary/40 transition-all duration-200 group flex flex-col justify-between gap-2.5 relative ${
        isUpdating ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Header: Avatar, Name, Priority */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-navy flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {(lead.first_name?.[0] || 'L').toUpperCase()}{(lead.last_name?.[0] || '').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-text-primary truncate group-hover:text-primary transition-colors">
              {lead.full_name || `${lead.first_name} ${lead.last_name || ''}`.trim() || 'Prospective Buyer'}
            </p>
            <p className="text-[10px] text-text-muted font-mono">{lead.lead_number}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls} shrink-0`}>
          {badge.label}
        </span>
      </div>

      {/* Property & Budget Pill */}
      <div className="space-y-1.5 text-xs text-text-secondary">
        {lead.property_name && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-secondary/70 border border-border/50 text-[11px] text-text-primary">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate font-medium">{lead.property_name}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="text-text-muted">Budget:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatBudget(lead.budget_max || lead.estimated_deal_value)}
            </span>
          </div>
          {lead.preferred_bhk && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-secondary font-medium">
              {lead.preferred_bhk} BHK
            </span>
          )}
        </div>

        {(lead.city || lead.locality) && (
          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <MapPin className="w-3 h-3 text-text-muted shrink-0" />
            <span className="truncate">{lead.locality ? `${lead.locality}, ${lead.city || ''}` : lead.city}</span>
          </div>
        )}
      </div>

      {/* Footer: Assigned Agent / Score & Action */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/70 text-[11px]">
        <div className="flex items-center gap-1.5 text-text-muted min-w-0">
          <User className="w-3 h-3 text-text-muted shrink-0" />
          <span className="truncate text-[10px]">{lead.assigned_agent_name || 'Unassigned'}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              leadScore >= 70
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : leadScore >= 40
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'bg-surface-secondary text-text-muted'
            }`}
          >
            Score {leadScore}
          </span>
          <button
            onClick={() => onView(lead.id)}
            className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors"
            title="View Lead Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function LeadKanbanPage() {
  const [allLeads, setAllLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragLeadId, setDragLeadId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'budget' | 'score'>('newest');

  const navigate = useNavigate();

  useEffect(() => {
    loadAllLeads();
  }, []);

  const loadAllLeads = async () => {
    setLoading(true);
    try {
      const res = await adminCRMApi.getLeads({ limit: 300 });
      setAllLeads(res.items || []);
    } catch (e) {
      console.error('Failed to load leads for Kanban', e);
      toast.error('Failed to load CRM leads.');
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort leads
  const filteredLeads = useMemo(() => {
    let list = [...allLeads];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        l =>
          l.full_name?.toLowerCase().includes(q) ||
          l.first_name?.toLowerCase().includes(q) ||
          l.last_name?.toLowerCase().includes(q) ||
          l.lead_number?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.property_name?.toLowerCase().includes(q)
      );
    }

    if (priorityFilter !== 'all') {
      list = list.filter(l => l.priority === priorityFilter);
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'budget') {
      list.sort(
        (a, b) =>
          (b.budget_max || b.estimated_deal_value || 0) - (a.budget_max || a.estimated_deal_value || 0)
      );
    } else if (sortBy === 'score') {
      list.sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));
    }

    return list;
  }, [allLeads, searchQuery, priorityFilter, sortBy]);

  const getLeadsForStage = (stage: string) =>
    filteredLeads.filter(l => l.stage === stage);

  const getStageTotalValue = (stage: string) => {
    const stageLeads = getLeadsForStage(stage);
    return stageLeads.reduce((acc, l) => acc + (l.estimated_deal_value || l.budget_max || 0), 0);
  };

  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    setDragLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    if (!dragLeadId) return;

    const lead = allLeads.find(l => l.id === dragLeadId);
    if (!lead || lead.stage === newStage) {
      setDragLeadId(null);
      setDragOverStage(null);
      return;
    }

    const previousStage = lead.stage;
    const currentLeadId = dragLeadId;

    // 1. Optimistically update UI
    setAllLeads(prev => prev.map(l => (l.id === currentLeadId ? { ...l, stage: newStage } : l)));
    setDragLeadId(null);
    setDragOverStage(null);
    setUpdatingLeadId(currentLeadId);

    // 2. Call backend API
    try {
      await adminCRMApi.updateStage(currentLeadId, newStage);
      toast.success(`Lead #${lead.lead_number} moved to ${newStage.replace(/_/g, ' ')}`);
    } catch (err: any) {
      // 3. Rollback on failure
      setAllLeads(prev => prev.map(l => (l.id === currentLeadId ? { ...l, stage: previousStage } : l)));
      toast.error(err.response?.data?.detail || 'Failed to update lead stage. Reverted changes.');
      console.error('Stage update failed', err);
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handleDragLeave = () => setDragOverStage(null);

  // Analytics Strip
  const totalPipelineValue = allLeads.reduce((acc, l) => acc + (l.estimated_deal_value || l.budget_max || 0), 0);
  const hotLeadsCount = allLeads.filter(l => l.priority === 'hot' || l.priority === 'vip').length;
  const bookedLeadsCount = allLeads.filter(l => l.stage === 'booked').length;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-surface-secondary rounded-2xl w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-surface-secondary rounded-2xl" />
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(s => (
            <div key={s.key} className="shrink-0 w-72">
              <div className="h-12 bg-surface-secondary rounded-2xl mb-3" />
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-36 bg-surface-secondary rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col text-text-primary space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-bold text-text-primary">CRM Lead Pipeline</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {filteredLeads.length} of {allLeads.length} Leads
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Interactive Drag-and-Drop Opportunity Pipeline
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={loadAllLeads} className="btn btn-outline btn-sm gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => navigate('/admin/crm/leads/create')} className="btn btn-primary btn-sm gap-2">
            <Plus className="w-3.5 h-3.5" /> New Lead
          </button>
        </div>
      </div>

      {/* Analytics Strip Above Board */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block">Total In Pipeline</span>
            <span className="text-base font-bold text-text-primary">{allLeads.length} Leads</span>
          </div>
        </div>

        <div className="card p-3.5 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block">Pipeline Volume</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatBudget(totalPipelineValue)}</span>
          </div>
        </div>

        <div className="card p-3.5 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block">Hot & VIP Inquiries</span>
            <span className="text-base font-bold text-rose-600">{hotLeadsCount} Leads</span>
          </div>
        </div>

        <div className="card p-3.5 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block">Won & Booked</span>
            <span className="text-base font-bold text-purple-600">{bookedLeadsCount} Deals</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="card p-3 border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search leads, phone, property..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input input-sm pl-9 w-full text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Priority filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-text-muted text-[11px]">Priority:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="input input-sm text-xs py-1 px-2.5"
            >
              <option value="all">All Priorities</option>
              <option value="vip">⭐ VIP</option>
              <option value="hot">🔥 Hot</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-text-muted text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="input input-sm text-xs py-1 px-2.5"
            >
              <option value="newest">Newest First</option>
              <option value="budget">Highest Budget</option>
              <option value="score">Lead Score</option>
            </select>
          </div>

          {(searchQuery || priorityFilter !== 'all' || sortBy !== 'newest') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('all');
                setSortBy('newest');
              }}
              className="btn btn-outline btn-xs gap-1 text-text-muted"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Horizontal Track */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
        {STAGES.map(stage => {
          const stageLeads = getLeadsForStage(stage.key);
          const stageValue = getStageTotalValue(stage.key);
          const isOver = dragOverStage === stage.key;

          return (
            <div
              key={stage.key}
              className={`shrink-0 w-72 flex flex-col rounded-3xl transition-all duration-200 bg-surface/80 border border-border shadow-soft ${
                isOver ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''
              }`}
              onDragOver={e => handleDragOver(e, stage.key)}
              onDrop={e => handleDrop(e, stage.key)}
              onDragLeave={handleDragLeave}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: stage.color }} />
                  <span className="text-xs font-bold text-text-primary truncate">{stage.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {stageValue > 0 && (
                    <span className="text-[10px] font-semibold text-text-muted">
                      {formatBudget(stageValue)}
                    </span>
                  )}
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                    style={{ background: stage.color }}
                  >
                    {stageLeads.length}
                  </span>
                </div>
              </div>

              {/* Cards Stream */}
              <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-310px)] min-h-[240px]">
                {stageLeads.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-3 border border-dashed border-border/80 rounded-2xl bg-surface-secondary/30">
                    <Layers className="w-6 h-6 text-text-muted opacity-40 mb-1" />
                    <p className="text-xs font-medium text-text-muted">No leads in this stage</p>
                    <p className="text-[10px] text-text-muted opacity-75 mt-0.5">Drag cards here</p>
                  </div>
                ) : (
                  stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead.id)}
                      className={`cursor-grab active:cursor-grabbing transition-opacity ${
                        dragLeadId === lead.id ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <KanbanCard
                        lead={lead}
                        isUpdating={updatingLeadId === lead.id}
                        onView={id => navigate(`/admin/crm/leads/${id}`)}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Add Lead Column Footer */}
              <div className="p-2 pt-0">
                <button
                  onClick={() => navigate(`/admin/crm/leads/create?stage=${stage.key}`)}
                  className="w-full py-1.5 text-xs font-medium rounded-xl border border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5 text-text-secondary hover:text-primary"
                >
                  <Plus className="w-3 h-3" /> Add Lead
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
