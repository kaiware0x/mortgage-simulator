import type { MonthlyPayment, EarlyRepayment } from '../utils/mortgageCalculator';

interface RepaymentScheduleProps {
  schedule: MonthlyPayment[];
  title: string;
  color: string;
  originalPrincipal: number;
  earlyRepayments?: EarlyRepayment[];
}

export function RepaymentSchedule({ schedule, title, color, originalPrincipal, earlyRepayments = [] }: RepaymentScheduleProps) {
  const monthlyTotal = schedule.reduce((sum, p) => sum + p.payment, 0);
  const earlyRepaymentTotal = earlyRepayments.reduce((sum, er) => sum + er.amount, 0);
  const totalPayment = monthlyTotal + earlyRepaymentTotal;
  const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
  const totalPrincipal = originalPrincipal;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(amount));
  };

  const formatMonth = (month: number) => {
    const years = Math.floor(month / 12);
    const months = month % 12;
    if (years === 0) {
      return `${months}ヶ月`;
    }
    if (months === 0) {
      return `${years}年`;
    }
    return `${years}年${months}ヶ月`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-t-4 ${color}`}>
      <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>

      <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-md">
        <div>
          <p className="text-sm text-gray-600">総返済額</p>
          <p className="text-2xl font-bold text-gray-900">
            ¥{formatCurrency(totalPayment)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">総利息額</p>
          <p className="text-2xl font-bold text-red-600">
            ¥{formatCurrency(totalInterest)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">元本合計</p>
          <p className="text-lg font-semibold text-blue-600">
            ¥{formatCurrency(totalPrincipal)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">返済期間</p>
          <p className="text-lg font-semibold text-gray-700">
            {formatMonth(schedule.length)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-2 py-2 text-left whitespace-nowrap w-10">年月</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">支払額</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">元本</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">利息</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">残債</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((payment) => (
              <tr key={payment.month} className="border-b hover:bg-gray-50">
                <td className="px-2 py-2 whitespace-nowrap">{formatMonth(payment.month)}</td>
                <td className="px-2 py-2 text-right">
                  ¥{formatCurrency(payment.payment)}
                </td>
                <td className="px-2 py-2 text-right text-blue-600">
                  ¥{formatCurrency(payment.principal)}
                </td>
                <td className="px-2 py-2 text-right text-red-600">
                  ¥{formatCurrency(payment.interest)}
                </td>
                <td className="px-2 py-2 text-right font-medium">
                  ¥{formatCurrency(payment.remainingBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
