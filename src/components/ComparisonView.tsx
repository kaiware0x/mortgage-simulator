import type { LoanInput } from '../utils/mortgageCalculator';
import { calculateRepaymentSchedule } from '../utils/mortgageCalculator';
import { RepaymentSchedule } from './RepaymentSchedule';

interface ComparisonViewProps {
  scenarios: (LoanInput | null)[];
}

const COLORS = ['border-blue-500', 'border-green-500', 'border-purple-500', 'border-black-500'];

export function ComparisonView({ scenarios }: ComparisonViewProps) {
  const validScenarios = scenarios
    .map((scenario, index) => {
      if (!scenario) return null;
      const schedule = calculateRepaymentSchedule(scenario);
      const title = `シナリオ${index + 1}`;
      return {
        schedule,
        title: title,
        color: COLORS[index],
        originalPrincipal: scenario.principal,
        earlyRepayments: scenario.earlyRepayments || [],
      };
    })
    .filter((s) => s !== null);

  if (validScenarios.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">まだ計算結果がありません</p>
        <p className="text-sm mt-2">上のフォームから計算を実行してください</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {validScenarios.map((scenario, index) => (
        <RepaymentSchedule
          key={index}
          schedule={scenario.schedule}
          title={scenario.title}
          color={scenario.color}
          originalPrincipal={scenario.originalPrincipal}
          earlyRepayments={scenario.earlyRepayments}
        />
      ))}
    </div>
  );
}
