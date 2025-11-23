import type { LoanInput } from '../utils/mortgageCalculator';
import { calculateRepaymentSchedule } from '../utils/mortgageCalculator';

interface TaxDeductionViewProps {
    scenarios: (LoanInput | null)[];
}

const COLORS = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-black-600'];
const BG_COLORS = ['bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-gray-50'];

export function TaxDeductionView({ scenarios }: TaxDeductionViewProps) {
    const validScenarios = scenarios
        .map((scenario, index) => {
            if (!scenario || !scenario.taxDeductionEnabled) return null;
            const { yearlyTaxDeductions } = calculateRepaymentSchedule(scenario);
            const title = `シナリオ${index + 1}`;
            return {
                yearlyTaxDeductions,
                title,
                color: COLORS[index],
                bgColor: BG_COLORS[index],
                index,
            };
        })
        .filter((s) => s !== null);

    if (validScenarios.length === 0) {
        return null;
    }

    // 最大年数を取得
    const maxYears = Math.max(...validScenarios.map(s => s!.yearlyTaxDeductions.length));
    const years = Array.from({ length: maxYears }, (_, i) => i + 1);

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">住宅ローン控除（減税額）シミュレーション</h2>
            <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                計算式：控除額 = min(年末残高, 借入限度額) × 控除率
            </p>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                年数
                            </th>
                            {validScenarios.map((scenario) => (
                                <th key={scenario!.index} scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${scenario!.color}`}>
                                    {scenario!.title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {years.map((year) => (
                            <tr key={year} className={year % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {year}年目
                                </td>
                                {validScenarios.map((scenario) => {
                                    const amount = scenario!.yearlyTaxDeductions[year - 1] || 0;
                                    return (
                                        <td key={scenario!.index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {amount.toLocaleString()} 円
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {/* 合計行 */}
                        <tr className="bg-gray-100 font-bold">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                合計
                            </td>
                            {validScenarios.map((scenario) => {
                                const total = scenario!.yearlyTaxDeductions.reduce((sum, val) => sum + val, 0);
                                return (
                                    <td key={scenario!.index} className={`px-6 py-4 whitespace-nowrap text-sm ${scenario!.color}`}>
                                        {total.toLocaleString()} 円
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
                ※ 控除額は年末残高と借入限度額の小さい方に控除率を掛けて計算しています。<br />
                ※ 実際の控除額は、所得税・住民税の納税額が上限となります（本シミュレーションでは納税額上限は考慮していません）。
            </p>
        </div>
    );
}
