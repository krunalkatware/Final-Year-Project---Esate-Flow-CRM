import React, { useState } from 'react';
import { formatCurrency, calculateEMI } from '../../utils/formatters';
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react';

interface EMICalculatorProps {
  propertyPrice?: number;
}

export const EMICalculator: React.FC<EMICalculatorProps> = ({ propertyPrice = 15000000 }) => {
  const [price, setPrice] = useState<number>(propertyPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);

  const downPaymentAmount = price * (downPaymentPercent / 100);
  const loanAmount = price - downPaymentAmount;
  const monthlyEMI = calculateEMI(price, downPaymentPercent, interestRate, tenureYears);
  const totalPayment = monthlyEMI * tenureYears * 12;
  const totalInterest = Math.max(0, totalPayment - loanAmount);

  const principalPercent = totalPayment > 0 ? Math.round((loanAmount / totalPayment) * 100) : 50;
  const interestPercent = 100 - principalPercent;

  return (
    <div className="bg-card text-text-primary rounded-2xl border border-border p-6 shadow-card space-y-6">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <div className="p-2 bg-primary/15 rounded-xl text-primary">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-lg text-text-primary">EMI Calculator</h3>
          <p className="text-xs text-text-secondary">Estimate your monthly mortgage payments</p>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-5 text-sm">
        {/* Property Price */}
        <div>
          <div className="flex justify-between mb-1.5 font-medium">
            <span className="text-text-secondary">Property Value</span>
            <span className="text-primary font-bold">{formatCurrency(price)}</span>
          </div>
          <input
            type="range"
            min={2000000}
            max={100000000}
            step={500000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full accent-primary h-2 bg-surface-secondary rounded-lg cursor-pointer"
          />
        </div>

        {/* Down Payment */}
        <div>
          <div className="flex justify-between mb-1.5 font-medium">
            <span className="text-text-secondary">Down Payment ({downPaymentPercent}%)</span>
            <span className="text-secondary font-bold">{formatCurrency(downPaymentAmount)}</span>
          </div>
          <input
            type="range"
            min={10}
            max={80}
            step={5}
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            className="w-full accent-secondary h-2 bg-surface-secondary rounded-lg cursor-pointer"
          />
        </div>

        {/* Interest Rate */}
        <div>
          <div className="flex justify-between mb-1.5 font-medium">
            <span className="text-text-secondary">Interest Rate</span>
            <span className="text-accent font-bold">{interestRate}% p.a.</span>
          </div>
          <input
            type="range"
            min={6.5}
            max={15}
            step={0.1}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full accent-accent h-2 bg-surface-secondary rounded-lg cursor-pointer"
          />
        </div>

        {/* Loan Tenure */}
        <div>
          <div className="flex justify-between mb-1.5 font-medium">
            <span className="text-text-secondary">Loan Tenure</span>
            <span className="text-text-primary font-bold">{tenureYears} Years</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="w-full accent-primary h-2 bg-surface-secondary rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Result Display */}
      <div className="bg-navy/95 dark:bg-surface-secondary text-white rounded-2xl p-5 space-y-4 border border-border/40 shadow-soft">
        <div>
          <span className="text-xs text-white/70 uppercase tracking-wider font-semibold">Monthly EMI</span>
          <div className="text-3xl font-heading font-extrabold text-white mt-1">
            {formatCurrency(monthlyEMI)}<span className="text-sm font-normal text-white/70"> / mo</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden flex">
            <div style={{ width: `${principalPercent}%` }} className="bg-primary h-full" />
            <div style={{ width: `${interestPercent}%` }} className="bg-accent h-full" />
          </div>
          <div className="flex justify-between text-xs text-white/80">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              Principal ({principalPercent}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent inline-block" />
              Interest ({interestPercent}%)
            </span>
          </div>
        </div>

        {/* Financial Summary Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
          <div>
            <span className="text-white/70">Loan Amount</span>
            <p className="font-semibold text-white mt-0.5">{formatCurrency(loanAmount)}</p>
          </div>
          <div>
            <span className="text-white/70">Total Interest</span>
            <p className="font-semibold text-accent mt-0.5">{formatCurrency(totalInterest)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
