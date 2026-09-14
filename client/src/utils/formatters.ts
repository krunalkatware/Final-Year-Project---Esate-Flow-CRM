/**
 * Format Indian Rupee Currency (Crores, Lakhs, Thousands)
 */
export const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh % 1 === 0 ? lakh : lakh.toFixed(2)} Lakh`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Calculate Monthly EMI estimate for given loan amount
 * Standard formula: P * r * (1+r)^n / ((1+r)^n - 1)
 * Defaults: 80% LTV, 8.5% interest rate, 20 years tenure (240 months)
 */
export const calculateEMI = (
  propertyPrice: number,
  downPaymentPercent = 20,
  annualInterestRate = 8.5,
  tenureYears = 20
): number => {
  const loanAmount = propertyPrice * (1 - downPaymentPercent / 100);
  const monthlyRate = annualInterestRate / 12 / 100;
  const numberOfMonths = tenureYears * 12;

  const emi =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) /
    (Math.pow(1 + monthlyRate, numberOfMonths) - 1);

  return Math.round(emi);
};
