import React, { useState } from 'react';
import { Calculator, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight, ShieldCheck, Layers } from 'lucide-react';

interface RevenueCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RevenueCalculatorModal: React.FC<RevenueCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [propertyPrice, setPropertyPrice] = useState<number>(12000000);
  const [commissionRate, setCommissionRate] = useState<number>(5);

  // Scenario A splits
  const [brokerShareA, setBrokerShareA] = useState<number>(35);
  const [seniorBrokerShareA, setSeniorBrokerShareA] = useState<number>(20);
  const [managerShareA, setManagerShareA] = useState<number>(10);
  const [companyShareA, setCompanyShareA] = useState<number>(35);

  // Scenario B splits
  const [brokerShareB, setBrokerShareB] = useState<number>(45);
  const [seniorBrokerShareB, setSeniorBrokerShareB] = useState<number>(15);
  const [managerShareB, setManagerShareB] = useState<number>(10);
  const [companyShareB, setCompanyShareB] = useState<number>(30);

  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison'>('calculator');

  if (!isOpen) return null;

  const totalEligibleRevenue = (propertyPrice * commissionRate) / 100;
  const sumA = brokerShareA + seniorBrokerShareA + managerShareA + companyShareA;
  const sumB = brokerShareB + seniorBrokerShareB + managerShareB + companyShareB;

  const isValidA = Math.abs(sumA - 100) < 0.1;
  const isValidB = Math.abs(sumB - 100) < 0.1;

  const calcAmount = (total: number, pct: number) => (total * pct) / 100;

  const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-lg text-white">Revenue Sharing Calculator & Simulator</h3>
                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  SIMULATION MODE
                </span>
              </div>
              <p className="text-xs text-slate-400">Simulate multi-level commission distribution & scenario modeling before rule activation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Inputs Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Transaction Price (INR)</label>
              <div className="mt-1.5 relative">
                <input
                  type="number"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-emerald-400 font-bold">
                  {formatINR(propertyPrice)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eligible Revenue Rate (%)</label>
              <div className="mt-1.5 relative">
                <input
                  type="number"
                  step="0.5"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-emerald-400 font-bold">
                  Gross: {formatINR(totalEligibleRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'calculator' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Interactive Distribution Model
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'comparison' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Scenario A vs Scenario B Comparison
            </button>
          </div>

          {activeTab === 'calculator' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sliders */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-300">Role Share Allocations</h4>
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${isValidA ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    Total: {sumA}% {isValidA ? '✓ Valid (100%)' : '⚠ Invalid Allocation'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">Broker Share ({brokerShareA}%)</span>
                      <span className="text-emerald-400 font-mono font-bold">{formatINR(calcAmount(totalEligibleRevenue, brokerShareA))}</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={brokerShareA}
                      onChange={(e) => setBrokerShareA(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">Senior Broker Share ({seniorBrokerShareA}%)</span>
                      <span className="text-indigo-400 font-mono font-bold">{formatINR(calcAmount(totalEligibleRevenue, seniorBrokerShareA))}</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={seniorBrokerShareA}
                      onChange={(e) => setSeniorBrokerShareA(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">Sales Manager Share ({managerShareA}%)</span>
                      <span className="text-amber-400 font-mono font-bold">{formatINR(calcAmount(totalEligibleRevenue, managerShareA))}</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={managerShareA}
                      onChange={(e) => setManagerShareA(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">Company / Platform Share ({companyShareA}%)</span>
                      <span className="text-slate-200 font-mono font-bold">{formatINR(calcAmount(totalEligibleRevenue, companyShareA))}</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={companyShareA}
                      onChange={(e) => setCompanyShareA(Number(e.target.value))}
                      className="w-full accent-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Visual Breakdown Waterfall Card */}
              <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Revenue Waterfall Flow</h4>
                
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">1. Property Sale Value</span>
                    <span className="text-white font-bold">{formatINR(propertyPrice)}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center text-emerald-400">
                    <span>2. Gross Commission ({commissionRate}%)</span>
                    <span className="font-bold">{formatINR(totalEligibleRevenue)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 space-y-1.5">
                    <div className="flex justify-between text-slate-300">
                      <span>• Broker (35%):</span>
                      <span className="text-emerald-400 font-bold">{formatINR(calcAmount(totalEligibleRevenue, brokerShareA))}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>• Sr. Broker (20%):</span>
                      <span className="text-indigo-400 font-bold">{formatINR(calcAmount(totalEligibleRevenue, seniorBrokerShareA))}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>• Manager (10%):</span>
                      <span className="text-amber-400 font-bold">{formatINR(calcAmount(totalEligibleRevenue, managerShareA))}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>• Company Share (35%):</span>
                      <span className="text-slate-200 font-bold">{formatINR(calcAmount(totalEligibleRevenue, companyShareA))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scenario A */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-sm text-emerald-400">Scenario A: Standard Tier</h4>
                  <span className="text-xs text-slate-400 font-mono">Sum: {sumA}%</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Broker (35%)</span>
                    <span className="font-bold font-mono text-emerald-400">{formatINR(calcAmount(totalEligibleRevenue, brokerShareA))}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Senior Broker (20%)</span>
                    <span className="font-bold font-mono text-indigo-400">{formatINR(calcAmount(totalEligibleRevenue, seniorBrokerShareA))}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Manager (10%)</span>
                    <span className="font-bold font-mono text-amber-400">{formatINR(calcAmount(totalEligibleRevenue, managerShareA))}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Company (35%)</span>
                    <span className="font-bold font-mono text-slate-200">{formatINR(calcAmount(totalEligibleRevenue, companyShareA))}</span>
                  </div>
                </div>
              </div>

              {/* Scenario B */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-sm text-indigo-400">Scenario B: Performance Incentive</h4>
                  <span className="text-xs text-slate-400 font-mono">Sum: {sumB}%</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Broker (45%)</span>
                    <span className="font-bold font-mono text-emerald-400">{formatINR(calcAmount(totalEligibleRevenue, brokerShareB))}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Senior Broker (15%)</span>
                    <span className="font-bold font-mono text-indigo-400">{formatINR(calcAmount(totalEligibleRevenue, seniorBrokerShareB))}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Manager (10%)</span>
                    <span className="font-bold font-mono text-amber-400">{formatINR(calcAmount(totalEligibleRevenue, managerShareB))}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Company (30%)</span>
                    <span className="font-bold font-mono text-slate-200">{formatINR(calcAmount(totalEligibleRevenue, companyShareB))}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
