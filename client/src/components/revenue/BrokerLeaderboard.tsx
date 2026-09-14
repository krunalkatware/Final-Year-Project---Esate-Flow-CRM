import React from 'react';
import { Trophy, Award, Star, TrendingUp, ShieldCheck } from 'lucide-react';

export interface BrokerPerformance {
  rank: number;
  name: string;
  agency: string;
  totalEarnings: number;
  dealsClosed: number;
  rating: number;
  badge: string;
  avatar: string;
}

const SAMPLE_LEADERBOARD: BrokerPerformance[] = [
  { rank: 1, name: 'Rahul Verma', agency: 'Apex Realty Group', totalEarnings: 1850000, dealsClosed: 14, rating: 4.9, badge: 'Top Producer', avatar: 'RV' },
  { rank: 2, name: 'Priya Sharma', agency: 'Urban Living Consultants', totalEarnings: 1420000, dealsClosed: 11, rating: 4.8, badge: 'Gold Partner', avatar: 'PS' },
  { rank: 3, name: 'Vikram Mehta', agency: 'Skyline Capital Assets', totalEarnings: 1180000, dealsClosed: 9, rating: 4.7, badge: 'Silver Partner', avatar: 'VM' },
  { rank: 4, name: 'Ananya Desai', agency: 'Prime Homes Network', totalEarnings: 950000, dealsClosed: 7, rating: 4.6, badge: 'Star Broker', avatar: 'AD' },
  { rank: 5, name: 'Sanjay Gupta', agency: 'Estate Flow Direct', totalEarnings: 820000, dealsClosed: 6, rating: 4.5, badge: 'Rising Star', avatar: 'SG' },
];

export const BrokerLeaderboard: React.FC = () => {
  const formatINR = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-white">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-heading font-extrabold text-white">Broker Performance Leaderboard</h3>
            <p className="text-xs text-slate-400">Top earning channel partners and real estate brokers</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
          2026 Season Rankings
        </span>
      </div>

      <div className="space-y-3">
        {SAMPLE_LEADERBOARD.map((b) => (
          <div
            key={b.rank}
            className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-2xl hover:bg-slate-800/40 transition gap-4"
          >
            <div className="flex items-center gap-4">
              {/* Rank Circle */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  b.rank === 1 ? 'bg-amber-500 text-slate-950 shadow-glow-amber' :
                  b.rank === 2 ? 'bg-slate-300 text-slate-950' :
                  b.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                #{b.rank}
              </div>

              {/* Avatar & Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {b.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{b.name}</h4>
                    <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {b.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{b.agency} &bull; {b.dealsClosed} deals won</p>
                </div>
              </div>
            </div>

            {/* Total Earnings */}
            <div className="text-right shrink-0">
              <p className="text-sm font-extrabold text-emerald-400 font-heading">{formatINR(b.totalEarnings)}</p>
              <div className="flex items-center justify-end gap-1 text-[11px] text-amber-400 font-bold mt-0.5">
                <Star className="w-3 h-3 fill-amber-400" /> {b.rating}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
