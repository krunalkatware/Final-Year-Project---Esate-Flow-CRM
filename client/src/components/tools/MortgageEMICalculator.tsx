import React, { useState } from 'react';
import { Calculator, DollarSign, Calendar, Percent, PieChart, Info } from 'lucide-react';

export const MortgageEMICalculator: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<number>(5000000); // 50 Lakhs default
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5% default
  const [tenureYears, setTenureYears] = useState<number>(20); // 20 years default

  // Calculate EMI: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const calculateEMI = () => {
    const p = loanAmount;
    const r = interestRate / 12 / 100;
    const n = tenureYears * 12;
    if (r === 0) return p / n;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return isNaN(emi) ? 0 : emi;
  };

  const emi = calculateEMI();
  const totalMonths = tenureYears * 12;
  const totalPayment = emi * totalMonths;
  const totalInterest = Math.max(0, totalPayment - loanAmount);
  const principalPct = Math.round((loanAmount / (totalPayment || 1)) * 100);
  const interestPct = 100 - principalPct;

  const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-heading font-extrabold text-white">Mortgage EMI Calculator</h3>
            <p className="text-xs text-slate-400">Estimate your monthly home loan repayments and interest schedule</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
          Live Estimator
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders & Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Loan Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-300">Home Loan Amount</span>
              <span className="text-primary font-bold font-mono text-base">{formatINR(loanAmount)}</span>
            </div>
            <input
              type="range"
              min={500000}
              max={50000000}
              step={100000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>₹5 Lakhs</span>
              <span>₹5 Crores</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-300">Interest Rate (% p.a.)</span>
              <span className="text-emerald-400 font-bold font-mono text-base">{interestRate}%</span>
            </div>
            <input
              type="range"
              min={6.0}
              max={15.0}
              step={0.1}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>6.0%</span>
              <span>15.0%</span>
            </div>
          </div>

          {/* Tenure */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-300">Loan Tenure</span>
              <span className="text-amber-400 font-bold font-mono text-base">{tenureYears} Years ({totalMonths} Months)</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>1 Year</span>
              <span>30 Years</span>
            </div>
          </div>
        </div>

        {/* Results Summary Box */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Monthly Loan EMI</span>
            <p className="text-3xl font-extrabold text-white font-heading mt-1">{formatINR(emi)} <span className="text-xs font-normal text-slate-400">/ mo</span></p>
          </div>

          <div className="space-y-3 text-xs pt-4 border-t border-slate-800/80">
            <div className="flex justify-between">
              <span className="text-slate-400">Principal Amount</span>
              <span className="font-bold text-white">{formatINR(loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Interest Payable</span>
              <span className="font-bold text-amber-400">{formatINR(totalInterest)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800 font-bold">
              <span className="text-slate-300">Total Payment</span>
              <span className="text-emerald-400 text-sm">{formatINR(totalPayment)}</span>
            </div>
          </div>

          {/* Visual Ratio Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-indigo-400">Principal: {principalPct}%</span>
              <span className="text-amber-400">Interest: {interestPct}%</span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${principalPct}%` }} />
              <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${interestPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
