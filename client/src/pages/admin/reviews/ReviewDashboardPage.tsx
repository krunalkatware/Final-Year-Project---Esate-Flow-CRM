
import React, { useEffect, useState } from 'react';
import {
  Star, ThumbsUp, ShieldAlert, MessageSquare, CheckCircle, AlertTriangle,
  TrendingUp, Award, Clock, ArrowUpRight, Filter, Download
} from 'lucide-react';
import { reviewsApi } from '../../../api/reviews.api';

export const ReviewDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await reviewsApi.getDashboardMetrics();
      setData(res);
    } catch (err) {
      console.error("Failed to load review dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await reviewsApi.exportReviewsCsv();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `EstateFlow_Reviews_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export CSV", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const starDist = data?.star_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const sentiment = data?.sentiment_distribution || { positive: 0, neutral: 0, negative: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-2xl shadow-soft border border-border">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Review & Reputation Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Enterprise feedback intelligence, rating distribution, and sentiment monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="btn btn-primary btn-sm gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Average Rating</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-text-primary">{metrics.average_rating || '0.0'}</span>
              <span className="text-sm text-emerald-500 font-medium flex items-center">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline mr-0.5" /> / 5.0
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">From {metrics.total_reviews} total reviews</p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Pending Moderation</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-text-primary">{metrics.pending_reviews + metrics.flagged_reviews}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-semibold">Triage</span>
            </div>
            <p className="text-xs text-text-muted mt-1">{metrics.flagged_reviews} flagged by spam engine</p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Response Rate</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-text-primary">{metrics.response_rate}%</span>
              <span className="text-xs text-primary font-medium">SLA ~4.2h</span>
            </div>
            <p className="text-xs text-text-muted mt-1">Official replies published</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Spam / Abuse Blocked</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-rose-500">{metrics.spam_reviews}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-semibold">Protected</span>
            </div>
            <p className="text-xs text-text-muted mt-1">Filtered automatically</p>
          </div>
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Rating Breakdown & Sentiment Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Star Rating Distribution */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-soft">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            Star Rating Distribution
          </h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = starDist[star] || 0;
              const total = metrics.total_reviews || 1;
              const percent = Math.round((count / total) * 100);
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-text-secondary w-12 flex items-center gap-1">
                    {star} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                  </span>
                  <div className="flex-1 h-3 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-text-muted w-16 text-right">
                    {count} ({percent}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-soft">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            AI Sentiment Analysis Engine
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-xs font-bold text-emerald-500 uppercase">Positive</span>
              <p className="text-2xl font-extrabold text-text-primary mt-1">{sentiment.positive}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-secondary border border-border text-center">
              <span className="text-xs font-bold text-text-secondary uppercase">Neutral</span>
              <p className="text-2xl font-extrabold text-text-primary mt-1">{sentiment.neutral}</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="text-xs font-bold text-rose-500 uppercase">Negative</span>
              <p className="text-2xl font-extrabold text-text-primary mt-1">{sentiment.negative}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs text-text-secondary leading-relaxed">
            💡 Sentiment score is calculated using dynamic keyword matching and rating correlation to track builder reputation trends and identify customer delight points.
          </div>
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-soft">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Top Rated Properties
          </h2>
          <div className="divide-y divide-border">
            {(data?.top_properties || []).map((p: any) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.review_count} verified reviews</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {p.rating}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-soft">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Top Rated Builders
          </h2>
          <div className="divide-y divide-border">
            {(data?.top_builders || []).map((b: any) => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center font-bold text-primary text-sm">
                    {b.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{b.name}</p>
                    <p className="text-xs text-text-muted">{b.city || 'Mumbai'} • {b.reviews_count} reviews</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full font-bold text-sm">
                  <Star className="w-4 h-4 fill-primary/80 text-primary" />
                  {b.rating}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
