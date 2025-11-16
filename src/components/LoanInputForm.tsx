import { useState, useEffect } from 'react';
import type { LoanInput } from '../utils/mortgageCalculator';

interface LoanInputFormProps {
  onCalculate: (input: LoanInput) => void;
  initialValues?: LoanInput;
}

export function LoanInputForm({ onCalculate, initialValues }: LoanInputFormProps) {
  // 内部では万円単位で管理
  const [principalManEn, setPrincipalManEn] = useState(
    initialValues?.principal ? initialValues.principal / 10000 : 3000
  );
  const [annualRate, setAnnualRate] = useState(initialValues?.annualRate || 1.5);
  const [years, setYears] = useState(initialValues?.years || 35);
  const [earlyRepaymentsManEn, setEarlyRepaymentsManEn] = useState<Array<{ month: number; amount: number; type: 'period-reduction' | 'payment-reduction' }>>(
    initialValues?.earlyRepayments?.map(er => ({ month: er.month, amount: er.amount / 10000, type: er.type })) || []
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success'>('idle');

  // initialValuesが変更されたときに入力フィールドを更新
  useEffect(() => {
    if (initialValues) {
      setPrincipalManEn(initialValues.principal / 10000);
      setAnnualRate(initialValues.annualRate);
      setYears(initialValues.years);
      setEarlyRepaymentsManEn(
        initialValues.earlyRepayments?.map(er => ({
          month: er.month,
          amount: er.amount / 10000,
          type: er.type
        })) || []
      );
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

  const handleSubmit = () => {
    // エラーメッセージをクリア
    setErrorMessage(null);

    // 重複月チェック
    if (earlyRepaymentsManEn.length > 0) {
      const monthSet = new Set(earlyRepaymentsManEn.map(er => er.month));
      if (monthSet.size !== earlyRepaymentsManEn.length) {
        setErrorMessage('同じ月に複数の繰上返済が設定されています。月を変更してください。');
        // 3秒後に自動で消す
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
    }

    // ローディング開始
    setButtonState('loading');
    const startTime = Date.now();

    // 万円→円に変換して計算ロジックに渡す
    onCalculate({
      principal: principalManEn * 10000,
      annualRate,
      years,
      earlyRepayments: earlyRepaymentsManEn.length > 0
        ? earlyRepaymentsManEn.map(er => ({ month: er.month, amount: er.amount * 10000, type: er.type }))
        : undefined,
    });

    // 最低0.5秒のローディング表示を保証
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, 750 - elapsedTime);

    setTimeout(() => {
      setButtonState('success');
      setTimeout(() => {
        setButtonState('idle');
      }, 1500);
    }, remainingTime);
  };

  return (
    <>
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <div>
          <label htmlFor="principal" className="block text-sm font-medium text-gray-700 mb-2">
            借入額（万円）
          </label>
          <input
            type="number"
            id="principal"
            value={principalManEn}
            onChange={(e) => setPrincipalManEn(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
            step="10"
            required
          />
        </div>

        <div>
          <label htmlFor="annualRate" className="block text-sm font-medium text-gray-700 mb-2">
            年利率（%）
          </label>
          <input
            type="number"
            id="annualRate"
            value={annualRate}
            onChange={(e) => setAnnualRate(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
            max="20"
            step="0.001"
            required
          />
        </div>

        <div>
          <label htmlFor="years" className="block text-sm font-medium text-gray-700 mb-2">
            借入期間（年）
          </label>
          <input
            type="number"
            id="years"
            value={years === 0 ? '' : years}
            onChange={(e) => setYears(e.target.value === '' ? 0 : Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            max="50"
            required
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">繰上返済</h3>
            <button
              type="button"
              onClick={handleAddEarlyRepayment}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
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
                      placeholder="何年目"
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
                      placeholder="何ヶ月目"
                      value={repayment.month % 12}
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
        disabled={buttonState !== 'idle'}
        className={`w-full px-6 py-3 font-medium rounded-md transition-all duration-300 flex items-center justify-center gap-3 ${errorMessage ? 'mt-2' : 'mt-6'
          } ${buttonState === 'idle'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : buttonState === 'loading'
              ? 'bg-blue-500 text-white cursor-wait'
              : 'bg-green-600 text-white'
          }`}
      >
        {buttonState === 'loading' && (
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
        {buttonState === 'success' && (
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
          {buttonState === 'idle' && '計算する'}
          {buttonState === 'loading' && '計算中...'}
          {buttonState === 'success' && '完了'}
        </span>
      </button>
    </>
  );
}
