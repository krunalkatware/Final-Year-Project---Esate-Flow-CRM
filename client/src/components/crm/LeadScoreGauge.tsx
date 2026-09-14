import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame, Clock, Target, Activity, Zap } from 'lucide-react';

interface LeadScoreProps {
  score: number; // 0-100
  trend?: 'up' | 'down' | 'stable';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const getScoreConfig = (score: number) => {
  if (score >= 90) return { label: 'VIP', color: '#7c3aed', bg: '#7c3aed22', ring: '#7c3aed44', icon: '⭐', description: 'Extremely high intent — close immediately' };
  if (score >= 75) return { label: 'Hot',  color: '#ef4444', bg: '#ef444422', ring: '#ef444444', icon: '🔥', description: 'High intent — prioritize now' };
  if (score >= 55) return { label: 'Warm', color: '#f97316', bg: '#f9731622', ring: '#f9731644', icon: '♨️', description: 'Active interest — nurture with follow-up' };
  if (score >= 35) return { label: 'Cool', color: '#3b82f6', bg: '#3b82f622', ring: '#3b82f644', icon: '🌊', description: 'Moderate interest — keep engaged' };
  return { label: 'Cold', color: '#6b7280', bg: '#6b728022', ring: '#6b728044', icon: '❄️', description: 'Low engagement — re-engage or archive' };
};

export const LeadScoreGauge: React.FC<LeadScoreProps> = ({
  score,
  trend = 'stable',
  size = 'md',
  showLabel = true,
  animated = true,
}) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const config = getScoreConfig(score);

  useEffect(() => {
    if (!animated) return;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + 2, score);
      setDisplayScore(current);
      if (current >= score) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [score, animated]);

  const radius = size === 'lg' ? 40 : size === 'sm' ? 20 : 30;
  const stroke = size === 'lg' ? 6 : size === 'sm' ? 3 : 4;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;
  const svgSize = (radius + stroke + 4) * 2;

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <div className="flex items-center gap-3">
      {/* Circular gauge */}
      <div className="relative flex-shrink-0" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring */}
          <circle cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          {/* Progress ring */}
          <circle cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke={config.color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 0.1s linear', filter: `drop-shadow(0 0 4px ${config.color}66)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-white leading-none ${size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {displayScore}
          </span>
        </div>
      </div>

      {showLabel && (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold" style={{ color: config.color }}>{config.label}</span>
            <span className={`text-xs font-bold ${trendColor}`}>{trendIcon}</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight max-w-28">{config.description}</p>
        </div>
      )}
    </div>
  );
};

interface ActivityTimelineProps {
  activities?: Array<{
    id: number;
    type: string;
    title: string;
    description?: string;
    actor?: string;
    time: string;
    icon?: React.ElementType;
    color?: string;
  }>;
  compact?: boolean;
}

const ACTIVITY_ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  booking_created: { icon: Target, color: '#f59e0b' },
  booking_updated: { icon: Activity, color: '#3b82f6' },
  site_visit_scheduled: { icon: Clock, color: '#10b981' },
  lead_stage_changed: { icon: TrendingUp, color: '#6366f1' },
  commission_credited: { icon: Zap, color: '#22c55e' },
  payment_received: { icon: Flame, color: '#f97316' },
  default: { icon: Activity, color: '#64748b' },
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities = [], compact = false }) => {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity size={24} className="text-slate-600 mb-2" />
        <p className="text-sm text-slate-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, idx) => {
        const { icon: Icon, color } = ACTIVITY_ICON_MAP[activity.type] || ACTIVITY_ICON_MAP.default;
        const ActivityIcon = activity.icon || Icon;
        const activityColor = activity.color || color;
        return (
          <div key={activity.id} className="flex gap-3 group">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ background: activityColor + '22', border: `1px solid ${activityColor}44` }}>
                <ActivityIcon size={13} style={{ color: activityColor }} />
              </div>
              {idx < activities.length - 1 && (
                <div className="w-0.5 flex-1 my-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
              )}
            </div>
            {/* Content */}
            <div className={`flex-1 pb-4 ${idx === activities.length - 1 ? 'pb-0' : ''}`}>
              <p className={`font-semibold text-white ${compact ? 'text-xs' : 'text-sm'}`}>{activity.title}</p>
              {activity.description && !compact && (
                <p className="text-xs text-slate-400 mt-0.5">{activity.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {activity.actor && (
                  <span className="text-[10px] text-slate-500">{activity.actor}</span>
                )}
                {activity.actor && <span className="text-slate-700 text-[10px]">·</span>}
                <span className="text-[10px] text-slate-500">{activity.time}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Lead score calculation utility
export const calculateLeadScore = (lead: {
  priority?: string;
  budget_max?: number;
  stage?: string;
  last_contacted?: string;
  activities_count?: number;
  visit_count?: number;
}): number => {
  let score = 0;
  
  // Priority
  const priorityScores: Record<string, number> = { vip: 35, hot: 28, high: 20, medium: 12, low: 5 };
  score += priorityScores[lead.priority || 'low'] || 0;
  
  // Budget
  if (lead.budget_max) {
    if (lead.budget_max >= 50000000) score += 20;      // 5Cr+
    else if (lead.budget_max >= 10000000) score += 15;  // 1Cr+
    else if (lead.budget_max >= 5000000) score += 10;   // 50L+
    else score += 5;
  }
  
  // Stage progression
  const stageScores: Record<string, number> = {
    new: 5, contacted: 10, interested: 18, site_visit_scheduled: 25,
    negotiation: 35, booking_requested: 42, booked: 50, closed: 50, lost: -10,
  };
  score += stageScores[lead.stage || 'new'] || 0;
  
  // Engagement
  if (lead.visit_count) score += Math.min(lead.visit_count * 5, 15);
  if (lead.activities_count) score += Math.min(lead.activities_count * 2, 10);
  
  return Math.max(0, Math.min(100, score));
};
