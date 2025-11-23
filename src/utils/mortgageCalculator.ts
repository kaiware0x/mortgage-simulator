// 住宅ローン計算のユーティリティ関数

export interface InterestRateChange {
  month: number; // 何ヶ月目に金利が変更されるか
  newRate: number; // 新しい年利率（%）
}

export interface LoanInput {
  principal: number; // 借入額
  annualRate: number; // 年利率（%）
  years: number; // 借入期間（年）
  earlyRepayments?: EarlyRepayment[]; // 繰上返済
  interestRateChanges?: InterestRateChange[]; // 金利変更
  // 住宅ローン控除用
  taxDeductionEnabled?: boolean;
  taxDeductionLimit?: number; // 控除対象借入限度額
  taxDeductionRate?: number; // 控除率
  taxDeductionPeriod?: number; // 控除期間
}

export interface EarlyRepayment {
  month: number; // 何ヶ月目に繰上返済するか
  amount: number; // 繰上返済額
  type: 'period-reduction' | 'payment-reduction'; // 期間短縮型 or 返済額軽減型
}

export interface MonthlyPayment {
  month: number; // 返済月
  payment: number; // 月々の支払額
  principal: number; // 元本返済額
  interest: number; // 利息額
  remainingBalance: number; // 残債
}

export interface SimulationResult {
  schedule: MonthlyPayment[];
  yearlyTaxDeductions: number[]; // 毎年の控除額
}

/**
 * 元利均等返済の月々の返済額を計算
 */
export function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  remainingMonths: number
): number {
  if (monthlyRate === 0) {
    return principal / remainingMonths;
  }

  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
    (Math.pow(1 + monthlyRate, remainingMonths) - 1)
  );
}

/**
 * 住宅ローンの返済スケジュールを計算
 */
export function calculateRepaymentSchedule(input: LoanInput): SimulationResult {
  const {
    principal,
    annualRate,
    years,
    earlyRepayments = [],
    interestRateChanges = [],
    taxDeductionEnabled = false,
    taxDeductionLimit = 0,
    taxDeductionRate = 0.007,
    taxDeductionPeriod = 13
  } = input;
  let currentAnnualRate = annualRate;
  let monthlyRate = currentAnnualRate / 100 / 12; // 月利
  const totalMonths = years * 12;

  const schedule: MonthlyPayment[] = [];
  let remainingBalance = principal;
  let currentMonthlyPayment = calculateMonthlyPayment(principal, monthlyRate, totalMonths);

  // 繰上返済を月でソート
  const sortedEarlyRepayments = [...earlyRepayments].sort((a, b) => a.month - b.month);
  let earlyRepaymentIndex = 0;

  // 金利変更を月でソート
  const sortedRateChanges = [...interestRateChanges].sort((a, b) => a.month - b.month);
  let rateChangeIndex = 0;

  let month = 1;
  let plannedEndMonth = totalMonths; // 返済予定終了月

  const yearlyTaxDeductions: number[] = [];

  while (remainingBalance > 0.01 && month <= totalMonths * 2) { // 最大2倍の期間でループ
    // 金利変更の処理
    while (
      rateChangeIndex < sortedRateChanges.length &&
      sortedRateChanges[rateChangeIndex].month === month
    ) {
      const rateChange = sortedRateChanges[rateChangeIndex];
      currentAnnualRate = rateChange.newRate;
      monthlyRate = currentAnnualRate / 100 / 12;

      // 金利変更時は残高と残期間で再計算（返済額軽減型と同じロジック）
      const remainingMonths = plannedEndMonth - month + 1; // 今月含む残期間
      currentMonthlyPayment = calculateMonthlyPayment(
        remainingBalance,
        monthlyRate,
        remainingMonths
      );

      rateChangeIndex++;
    }

    // 繰上返済の処理（同じ月の複数の繰上返済を処理）
    while (
      earlyRepaymentIndex < sortedEarlyRepayments.length &&
      sortedEarlyRepayments[earlyRepaymentIndex].month === month
    ) {
      const earlyRepayment = sortedEarlyRepayments[earlyRepaymentIndex];
      const earlyRepaymentAmount = earlyRepayment.amount;
      remainingBalance = Math.max(0, remainingBalance - earlyRepaymentAmount);

      if (remainingBalance > 0) {
        if (earlyRepayment.type === 'period-reduction') {
          // 期間短縮型：月々の返済額は変わらない、返済期間が短縮される
          // 月々の返済額はそのまま維持（currentMonthlyPaymentは変更しない）
          // 返済期間は自動的に短縮される（残高が減るため）
        } else if (earlyRepayment.type === 'payment-reduction') {
          // 返済額軽減型：返済期間は変わらない、月々の返済額を再計算
          const remainingMonths = plannedEndMonth - month; // 今月は繰上返済のみで通常の返済計算前なので、残期間はそのまま
          currentMonthlyPayment = calculateMonthlyPayment(
            remainingBalance,
            monthlyRate,
            remainingMonths
          );
        }
      }

      earlyRepaymentIndex++;
    }

    if (remainingBalance <= 0) break;

    // 利息の計算
    const interestPayment = remainingBalance * monthlyRate;

    // 元本返済額の計算
    let principalPayment = currentMonthlyPayment - interestPayment;

    // 最終月の調整
    if (principalPayment > remainingBalance) {
      principalPayment = remainingBalance;
      currentMonthlyPayment = principalPayment + interestPayment;
    }

    remainingBalance -= principalPayment;

    schedule.push({
      month,
      payment: currentMonthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      remainingBalance: Math.max(0, remainingBalance),
    });

    // 住宅ローン控除の計算（各年の12月時点）
    if (taxDeductionEnabled && month % 12 === 0) {
      const year = month / 12;
      if (year <= taxDeductionPeriod) {
        // 年末残高（12月の残高）
        const yearEndBalance = Math.max(0, remainingBalance);
        // 控除対象額（限度額と年末残高の小さい方）
        const deductionTarget = Math.min(yearEndBalance, taxDeductionLimit);
        // 控除額（100円未満切り捨てなどの端数処理は一旦行わず、単純計算）
        const deductionAmount = Math.floor(deductionTarget * taxDeductionRate);
        yearlyTaxDeductions.push(deductionAmount);
      }
    }

    month++;
  }

  return { schedule, yearlyTaxDeductions };
}

/**
 * 総返済額を計算
 */
export function calculateTotalPayment(schedule: MonthlyPayment[]): number {
  return schedule.reduce((total, payment) => total + payment.payment, 0);
}

/**
 * 総利息額を計算
 */
export function calculateTotalInterest(schedule: MonthlyPayment[]): number {
  return schedule.reduce((total, payment) => total + payment.interest, 0);
}
