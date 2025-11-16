import type { LoanInput } from './mortgageCalculator';

/**
 * LoanInputオブジェクトをURL-safe文字列にエンコード
 */
export function encodeScenarios(scenarios: (LoanInput | null)[]): string {
  const data = scenarios.map((s) => {
    if (!s) return null;
    return {
      p: s.principal,
      r: s.annualRate,
      y: s.years,
      e: s.earlyRepayments?.map((er) => [er.month, er.amount, er.type]) || [],
    };
  });

  const json = JSON.stringify(data);
  return btoa(encodeURIComponent(json));
}

/**
 * URL-safe文字列をLoanInputオブジェクトにデコード
 */
export function decodeScenarios(encoded: string): (LoanInput | null)[] {
  try {
    const json = decodeURIComponent(atob(encoded));
    const data = JSON.parse(json);

    return data.map((s: any) => {
      if (!s) return null;
      return {
        principal: s.p,
        annualRate: s.r,
        years: s.y,
        earlyRepayments: s.e.map((er: [number, number, string]) => ({
          month: er[0],
          amount: er[1],
          type: er[2] as 'period-reduction' | 'payment-reduction',
        })),
      };
    });
  } catch (error) {
    console.error('Failed to decode scenarios:', error);
    return [null, null, null];
  }
}

/**
 * 現在のシナリオからURLを生成
 */
export function generateShareableUrl(scenarios: (LoanInput | null)[]): string {
  const encoded = encodeScenarios(scenarios);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?data=${encoded}`;
}

/**
 * URLからシナリオを取得
 */
export function getScenariosFromUrl(): (LoanInput | null)[] | null {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');

  if (!data) return null;

  return decodeScenarios(data);
}
