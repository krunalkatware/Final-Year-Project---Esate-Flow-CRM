/**
 * EstateFlow — Admin Revenue Sharing Engine API Client
 * Covers: Dashboard KPIs, Commission Rules, Commissions, Wallets,
 *         Withdrawal Requests, Monthly Settlements, Financial Reports
 */
import { apiClient } from './axios';

// ── Types ────────────────────────────────────────────────────────────────────

export interface RevenueDashboardKPIs {
  total_revenue_inr: number;
  total_commissions_paid: number;
  pending_withdrawals_amount: number;
  pending_withdrawals_count: number;
  active_wallets: number;
  total_commission_records: number;
  pending_commissions: number;
  monthly_trend: { month: string; total: number }[];
  commission_by_role: { role: string; total: number }[];
}

export interface RevenueRule {
  id: number;
  name: string;
  description?: string;
  role: string;
  commission_type: 'percentage' | 'flat';
  value: number;
  min_booking_value?: number;
  max_commission_cap?: number;
  property_type?: string;
  city?: string;
  priority: number;
  is_active: boolean;
  effective_from?: string;
  effective_to?: string;
  created_at: string;
  updated_at?: string;
}

export interface RevenueRuleCreate {
  name: string;
  description?: string;
  role: string;
  commission_type: 'percentage' | 'flat';
  value: number;
  min_booking_value?: number;
  max_commission_cap?: number;
  property_type?: string;
  city?: string;
  priority?: number;
  is_active?: boolean;
}

export interface CommissionRecord {
  id: number;
  booking_id?: number;
  rule_id?: number;
  role: string;
  recipient_user_id?: string;
  recipient_name?: string;
  booking_value: number;
  commission_percentage?: number;
  commission_amount: number;
  status: string;
  notes?: string;
  paid_at?: string;
  settlement_id?: number;
  created_at: string;
}

export interface WalletSummary {
  id: number;
  user_id: string;
  balance: number;
  held_balance: number;
  total_earned: number;
  total_withdrawn: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  status: string;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  initiated_by?: string;
  created_at: string;
}

export interface WalletDetail extends WalletSummary {
  transactions: WalletTransaction[];
}

export interface WithdrawalRequest {
  id: number;
  wallet_id: number;
  user_id: string;
  amount: number;
  status: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  upi_id?: string;
  rejection_reason?: string;
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  transaction_reference?: string;
  requested_at: string;
  created_at: string;
}

export interface WithdrawalAction {
  admin_notes?: string;
  rejection_reason?: string;
  transaction_reference?: string;
}

export interface MonthlySettlement {
  id: number;
  settlement_month: number;
  settlement_year: number;
  total_commissions: number;
  total_paid: number;
  total_pending: number;
  num_records: number;
  status: string;
  notes?: string;
  initiated_by?: string;
  approved_by?: string;
  approved_at?: string;
  processed_at?: string;
  created_at: string;
}

export interface RevenueReports {
  by_role: { role: string; total: number; count: number }[];
  monthly: { month: string; total: number; count: number }[];
  by_status: { status: string; total: number; count: number }[];
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────────

export const getRevenueDashboard = (): Promise<RevenueDashboardKPIs> =>
  apiClient.get('/admin/revenue/dashboard').then((r) => r.data);

// ── Commission Rules ──────────────────────────────────────────────────────────

export const listRevenueRules = (params?: {
  role?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}): Promise<RevenueRule[]> =>
  apiClient.get('/admin/revenue/rules', { params }).then((r) => r.data);

export const createRevenueRule = (data: RevenueRuleCreate): Promise<RevenueRule> =>
  apiClient.post('/admin/revenue/rules', data).then((r) => r.data);

export const updateRevenueRule = (
  ruleId: number,
  data: Partial<RevenueRuleCreate>
): Promise<RevenueRule> =>
  apiClient.put(`/admin/revenue/rules/${ruleId}`, data).then((r) => r.data);

export const deleteRevenueRule = (ruleId: number): Promise<void> =>
  apiClient.delete(`/admin/revenue/rules/${ruleId}`).then(() => undefined);

// ── Commission Records ────────────────────────────────────────────────────────

export const listCommissions = (params?: {
  role?: string;
  commission_status?: string;
  booking_id?: number;
  skip?: number;
  limit?: number;
}): Promise<CommissionRecord[]> =>
  apiClient.get('/admin/revenue/commissions', { params }).then((r) => r.data);

export const calculateCommissions = (
  bookingId: number,
  bookingValue: number
): Promise<{ success: boolean; booking_id: number; commissions_created: any[] }> =>
  apiClient
    .post(`/admin/revenue/commissions/${bookingId}/calculate`, null, {
      params: { booking_value: bookingValue },
    })
    .then((r) => r.data);

// ── Wallets ───────────────────────────────────────────────────────────────────

export const listWallets = (params?: {
  is_active?: boolean;
  skip?: number;
  limit?: number;
}): Promise<WalletSummary[]> =>
  apiClient.get('/admin/revenue/wallets', { params }).then((r) => r.data);

export const getWalletByUser = (userId: string): Promise<WalletDetail> =>
  apiClient.get(`/admin/revenue/wallets/${userId}`).then((r) => r.data);

// ── Withdrawal Requests ───────────────────────────────────────────────────────

export const listWithdrawals = (params?: {
  withdrawal_status?: string;
  skip?: number;
  limit?: number;
}): Promise<WithdrawalRequest[]> =>
  apiClient.get('/admin/revenue/withdrawals', { params }).then((r) => r.data);

export const approveWithdrawal = (
  requestId: number,
  data: WithdrawalAction
): Promise<WithdrawalRequest> =>
  apiClient.put(`/admin/revenue/withdrawals/${requestId}/approve`, data).then((r) => r.data);

export const rejectWithdrawal = (
  requestId: number,
  data: WithdrawalAction
): Promise<WithdrawalRequest> =>
  apiClient.put(`/admin/revenue/withdrawals/${requestId}/reject`, data).then((r) => r.data);

// ── Monthly Settlements ───────────────────────────────────────────────────────

export const listSettlements = (params?: {
  settlement_status?: string;
}): Promise<MonthlySettlement[]> =>
  apiClient.get('/admin/revenue/settlements', { params }).then((r) => r.data);

export const createSettlement = (data: {
  settlement_month: number;
  settlement_year: number;
  notes?: string;
}): Promise<MonthlySettlement> =>
  apiClient.post('/admin/revenue/settlements', data).then((r) => r.data);

export const approveSettlement = (settlementId: number): Promise<MonthlySettlement> =>
  apiClient.put(`/admin/revenue/settlements/${settlementId}/approve`).then((r) => r.data);

// ── Reports ───────────────────────────────────────────────────────────────────

export const getRevenueReports = (year?: number): Promise<RevenueReports> =>
  apiClient.get('/admin/revenue/reports', { params: year ? { year } : {} }).then((r) => r.data);

// ── Helper: Export CSV ────────────────────────────────────────────────────────

export const exportCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((row) =>
    Object.values(row)
      .map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v))
      .join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
