import { useState, useEffect, useRef } from 'react';
import type { LoanInput } from '../utils/mortgageCalculator';

interface LoanInputFormProps {
  onCalculate: (input: LoanInput) => void;
  initialValues?: LoanInput;
  isCalculating: boolean;
}

export function LoanInputForm({ onCalculate, initialValues, isCalculating }: LoanInputFormProps) {
  // 内部では万円単位で管理（文字列として保持して入力中の状態を正しく反映）
  const [principalManEn, setPrincipalManEn] = useState(
    initialValues?.principal ? String(initialValues.principal / 10000) : '3000'
  );
  const [annualRate, setAnnualRate] = useState(
    initialValues?.annualRate !== undefined ? String(initialValues.annualRate) : '0.8'
  );
  const [years, setYears] = useState(initialValues?.years || 35);
  const [earlyRepaymentsManEn, setEarlyRepaymentsManEn] = useState<Array<{ month: number; amount: number; type: 'period-reduction' | 'payment-reduction' }>>(
    initialValues?.earlyRepayments?.map(er => ({ month: er.month, amount: er.amount / 10000, type: er.type })) || []
  );
  const [interestRateChanges, setInterestRateChanges] = useState<Array<{ month: number; newRate: number }>>(
    initialValues?.interestRateChanges?.map(irc => ({ month: irc.month, newRate: irc.newRate })) || []
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 住宅ローン控除用State
  const [taxDeductionEnabled, setTaxDeductionEnabled] = useState(initialValues?.taxDeductionEnabled || false);
  const [taxDeductionLimit, setTaxDeductionLimit] = useState(initialValues?.taxDeductionLimit ? String(initialValues.taxDeductionLimit / 10000) : '4000');
  const [taxDeductionRate, setTaxDeductionRate] = useState(initialValues?.taxDeductionRate ? (initialValues.taxDeductionRate * 100).toFixed(1) : '0.7');
  const [taxDeductionPeriod, setTaxDeductionPeriod] = useState(initialValues?.taxDeductionPeriod || 13);

  const [showSuccess, setShowSuccess] = useState(false);
  // isCalculatingの前の値を保持して完了を検知
  const prevIsCalculating = useRef(isCalculating);

  useEffect(() => {
    if (prevIsCalculating.current && !isCalculating) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    }
    prevIsCalculating.current = isCalculating;
  }, [isCalculating]);

  // initialValuesが変更されたときに入力フィールドを更新
  useEffect(() => {
    if (initialValues) {
      setPrincipalManEn(String(initialValues.principal / 10000));
      setAnnualRate(String(initialValues.annualRate));
      setYears(initialValues.years);
      setEarlyRepaymentsManEn(
        initialValues.earlyRepayments?.map(er => ({
          month: er.month,
          amount: er.amount / 10000,
          type: er.type
        })) || []
      );
      setInterestRateChanges(
        initialValues.interestRateChanges?.map(irc => ({
          month: irc.month,
          newRate: irc.newRate
        })) || []
      );
      if (initialValues.taxDeductionEnabled !== undefined) {
        setTaxDeductionEnabled(initialValues.taxDeductionEnabled);
        setTaxDeductionLimit(initialValues.taxDeductionLimit ? String(initialValues.taxDeductionLimit / 10000) : '4000');
        setTaxDeductionRate(initialValues.taxDeductionRate ? (initialValues.taxDeductionRate * 100).toFixed(1) : '0.7');
        setTaxDeductionPeriod(initialValues.taxDeductionPeriod || 13);
      }
    }
  }, [initialValues]);

  const handleAddEarlyRepayment = () => {
    setEarlyRepaymentsManEn([...earlyRepaymentsManEn, { month: 60, amount: 100, type: 'period-reduction' }]);
  };

  const handleRemoveEarlyRepayment = (index: number) => {
    setEarlyRepaymentsManEn(earlyRepaymentsManEn.filter((_, i) => i !== index));
  };

  const handleEarlyRepaymentChange = (
    index: number,
    field: 'month' | 'amount' | 'type',
    value: number | string
  ) => {
    const updated = [...earlyRepaymentsManEn];
    updated[index] = { ...updated[index], [field]: value };
    setEarlyRepaymentsManEn(updated);
  };

  const handleAddInterestRateChange = () => {
    setInterestRateChanges([...interestRateChanges, { month: 132, newRate: 1.5 }]); // デフォルト11年目
  };

  const handleRemoveInterestRateChange = (index: number) => {
    setInterestRateChanges(interestRateChanges.filter((_, i) => i !== index));
  };

  const handleInterestRateChangeUpdate = (
    index: number,
    field: 'month' | 'newRate',
    value: number | string
  ) => {
    const updated = [...interestRateChanges];
    // @ts-ignore
    updated[index] = { ...updated[index], [field]: value };
    setInterestRateChanges(updated);
  };

  const handleSubmit = () => {
    // エラーメッセージをクリア
    setErrorMessage(null);

    // 借入額チェック
    const principal = Number(principalManEn);
    if (principal < 10) {
      setErrorMessage('借入額は10万円以上で入力してください。');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    // 年利率チェック
    const rate = Number(annualRate);
    if (rate < 0 || rate > 50) {
      setErrorMessage('年利率は0%〜50%の間で入力してください。');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    // 重複月チェック
    if (earlyRepaymentsManEn.length > 0) {
      const monthSet = new Set(earlyRepaymentsManEn.map(er => er.month));
      if (monthSet.size !== earlyRepaymentsManEn.length) {
        setErrorMessage('同じ月に複数の金利変更が設定されています。月を変更してください。');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
    }

    // 万円→円に変換して計算ロジックに渡す
    onCalculate({
      principal: Number(principalManEn) * 10000,
      annualRate: Number(annualRate),
      years,
      earlyRepayments: earlyRepaymentsManEn.length > 0
        ? earlyRepaymentsManEn.map(er => ({ month: er.month, amount: er.amount * 10000, type: er.type }))
        : undefined,
      interestRateChanges: interestRateChanges.length > 0
        ? interestRateChanges
        : undefined,
      taxDeductionEnabled,
      taxDeductionLimit: taxDeductionEnabled ? Number(taxDeductionLimit) * 10000 : undefined,
      taxDeductionRate: taxDeductionEnabled ? Number(taxDeductionRate) / 100 : undefined,
      taxDeductionPeriod: taxDeductionEnabled ? taxDeductionPeriod : undefined,
    });
  };

  return (
    <>
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        {/* 借入額 */}
        <div>
          <label htmlFor="principal" className="block text-sm font-medium text-gray-700 mb-2">
            借入額（万円）
          </label>
          <input
            type="number"
            id="principal"
            value={principalManEn}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val > 100000000) return;
              setPrincipalManEn(e.target.value);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="10"
            max="100000000"
            step="100"
            required
          />
        </div>

        {/* 年利率 */}
        <div>
          <label htmlFor="annualRate" className="block text-sm font-medium text-gray-700 mb-2">
            年利率（%）
          </label>
          <input
            type="number"
            id="annualRate"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
            max="50"
            step="0.001"
            required
          />
        </div>

        {/* 借入期間 */}
        <div>
          <label htmlFor="years" className="block text-sm font-medium text-gray-700 mb-2">
            借入期間（年）
          </label>
          <input
            type="number"
            id="years"
            value={years === 0 ? '' : years}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val > 99) return;
              setYears(e.target.value === '' ? 0 : val);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            max="99"
            required
          />
        </div>
      </div>

      {/* 繰上返済 */}
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-md mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-700">繰上返済</h3>
          <button
            type="button"
            onClick={handleAddEarlyRepayment}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            + 追加
          </button>
        </div>

        {earlyRepaymentsManEn.map((repayment, index) => (
          <div key={index} className="flex gap-4 mb-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                返済年月（{index + 1}回目）
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="0"
                    value={Math.floor(repayment.month / 12) === 0 ? '' : Math.floor(repayment.month / 12)}
                    onChange={(e) => {
                      const inputYears = e.target.value === '' ? 0 : Number(e.target.value);
                      const months = repayment.month % 12;
                      handleEarlyRepaymentChange(index, 'month', inputYears * 12 + months);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    min="0"
                    max={years}
                    required
                  />
                  <span className="text-xs text-gray-500 block mt-1">年</span>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="0"
                    value={repayment.month % 12 === 0 ? '' : repayment.month % 12}
                    onChange={(e) => {
                      const currentYears = Math.floor(repayment.month / 12);
                      const inputMonths = e.target.value === '' ? 0 : Number(e.target.value);
                      handleEarlyRepaymentChange(index, 'month', currentYears * 12 + inputMonths);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    min="0"
                    max="11"
                    required
                  />
                  <span className="text-xs text-gray-500 block mt-1">ヶ月</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                返済額（万円）
              </label>
              <input
                type="number"
                value={repayment.amount === 0 ? '' : repayment.amount}
                onChange={(e) =>
                  handleEarlyRepaymentChange(index, 'amount', e.target.value === '' ? 0 : Number(e.target.value))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="1"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                返済タイプ
              </label>
              <select
                value={repayment.type}
                onChange={(e) =>
                  handleEarlyRepaymentChange(index, 'type', e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="period-reduction">期間短縮型</option>
                <option value="payment-reduction">返済額軽減型</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveEarlyRepayment(index)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              削除
            </button>
          </div>
        ))}
      </div>

      {/* 金利変更 */}
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-md mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-700">金利変更（変動金利・固定期間終了後など）</h3>
          <button
            type="button"
            onClick={handleAddInterestRateChange}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            + 追加
          </button>
        </div>

        {interestRateChanges.map((change, index) => (
          <div key={index} className="flex gap-4 mb-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                変更時期（{index + 1}回目）
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="0"
                    value={Math.floor(change.month / 12) === 0 ? '' : Math.floor(change.month / 12)}
                    onChange={(e) => {
                      const inputYears = e.target.value === '' ? 0 : Number(e.target.value);
                      const months = change.month % 12;
                      handleInterestRateChangeUpdate(index, 'month', inputYears * 12 + months);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    min="0"
                    max={years}
                    required
                  />
                  <span className="text-xs text-gray-500 block mt-1">年</span>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="0"
                    value={change.month % 12 === 0 ? '' : change.month % 12}
                    onChange={(e) => {
                      const currentYears = Math.floor(change.month / 12);
                      const inputMonths = e.target.value === '' ? 0 : Number(e.target.value);
                      handleInterestRateChangeUpdate(index, 'month', currentYears * 12 + inputMonths);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    min="0"
                    max="11"
                    required
                  />
                  <span className="text-xs text-gray-500 block mt-1">ヶ月</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新しい年利率（%）
              </label>
              <input
                type="number"
                value={change.newRate}
                onChange={(e) =>
                  handleInterestRateChangeUpdate(index, 'newRate', e.target.value === '' ? 0 : Number(e.target.value))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="50"
                step="0.001"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveInterestRateChange(index)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              削除
            </button>
          </div>
        ))}
      </div>

      {/* 住宅ローン控除設定 */}
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-md mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-700">住宅ローン控除設定</h3>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="taxDeductionEnabled"
              checked={taxDeductionEnabled}
              onChange={(e) => setTaxDeductionEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="taxDeductionEnabled" className="ml-2 block text-sm text-gray-900">
              有効にする
            </label>
          </div>
        </div>

        {taxDeductionEnabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  控除対象借入限度額
                </label>
                <select
                  value={taxDeductionLimit}
                  onChange={(e) => setTaxDeductionLimit(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="5000">5000万円</option>
                  <option value="4500">4500万円</option>
                  <option value="4000">4000万円</option>
                  <option value="3500">3500万円</option>
                  <option value="3000">3000万円</option>
                  <option value="2000">2000万円</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  控除率
                </label>
                <select
                  value={taxDeductionRate}
                  onChange={(e) => setTaxDeductionRate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0.7">0.7%</option>
                  <option value="1.0">1.0%</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  控除期間
                </label>
                <select
                  value={taxDeductionPeriod}
                  onChange={(e) => setTaxDeductionPeriod(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="13">13年</option>
                  <option value="10">10年</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* エラーツールチップ */}
      {errorMessage && (
        <div className="mt-4 relative">
          <div className="bg-red-500 text-white px-4 py-3 rounded-md shadow-lg flex items-start gap-3">
            <span className="flex-shrink-0 text-xl">⚠️</span>
            <p className="text-sm">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="flex-shrink-0 ml-auto text-white hover:text-red-100 font-bold text-xl leading-none"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
          {/* 下向き矢印 */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-red-500"></div>
          </div>
        </div>
      )}

      {/* 計算ボタン */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isCalculating}
        className={`w-full px-6 py-3 font-medium rounded-md transition-all duration-300 flex items-center justify-center gap-3 ${errorMessage ? 'mt-2' : 'mt-6'
          } ${isCalculating
            ? 'bg-blue-500 text-white cursor-wait'
            : showSuccess
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
      >
        {isCalculating && (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {showSuccess && !isCalculating && (
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        <span>
          {isCalculating ? '計算中...' : showSuccess ? '完了' : '計算する'}
        </span>
      </button>
    </>
  );
}
