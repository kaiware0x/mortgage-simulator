import { useState, useEffect, useRef } from 'react';
import type { LoanInput, SimulationResult } from './utils/mortgageCalculator';
import { getScenariosFromUrl, encodeScenarios } from './utils/urlEncoder';
import { LoanInputForm } from './components/LoanInputForm';
import { ComparisonView } from './components/ComparisonView';
import { TaxDeductionView } from './components/TaxDeductionView';
import { ShareableLink } from './components/ShareableLink';
import type { WorkerMessage, WorkerResponse } from './workers/calculationWorker';

function App() {
  const [scenarios, setScenarios] = useState<(LoanInput | null)[]>([null, null, null]);
  const [simulationResults, setSimulationResults] = useState<(SimulationResult | null)[]>([null, null, null]);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const workerRef = useRef<Worker | null>(null);

  // Workerの初期化
  useEffect(() => {
    workerRef.current = new Worker(new URL('./workers/calculationWorker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload } = event.data;
      if (type === 'result') {
        setSimulationResults(payload.results);
        setIsCalculating(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // 計算実行関数
  const runCalculation = (currentScenarios: (LoanInput | null)[]) => {
    if (!workerRef.current) return;

    setIsCalculating(true);
    const message: WorkerMessage = {
      type: 'calculate',
      payload: { scenarios: currentScenarios },
    };
    workerRef.current.postMessage(message);
  };

  // URLからシナリオを復元
  useEffect(() => {
    const urlScenarios = getScenariosFromUrl();
    if (urlScenarios) {
      setScenarios(urlScenarios);
      // 復元したシナリオで計算を実行
      runCalculation(urlScenarios);
    }

    // タブパラメータの読み込み
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      const index = Number(tab);
      if (!isNaN(index) && index >= 0 && index <= 2) {
        setCurrentScenarioIndex(index);
      }
    }

    setIsInitialized(true);
  }, []);

  // シナリオ変更時にURLを更新
  useEffect(() => {
    if (!isInitialized) return;

    const encoded = encodeScenarios(scenarios);
    const params = new URLSearchParams(window.location.search);
    params.set('data', encoded);
    params.set('tab', String(currentScenarioIndex));

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [scenarios, currentScenarioIndex, isInitialized]);

  const handleCalculate = (input: LoanInput) => {
    const newScenarios = [...scenarios];
    newScenarios[currentScenarioIndex] = input;
    setScenarios(newScenarios);
    runCalculation(newScenarios);
  };

  const handleClearScenario = (index: number) => {
    const newScenarios = [...scenarios];
    newScenarios[index] = null;
    setScenarios(newScenarios);
    runCalculation(newScenarios);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-6 sm:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            住宅ローンシミュレーター
          </h1>
          <p className="text-gray-600">
            借入額・金利・期間・繰上返済を入力して、返済計画を比較できます。
            <br />
            計算結果には多少の誤差があります。ご了承ください。
          </p>
        </header>

        <div className="mb-8">
          <div className="flex gap-2 mb-4 flex-wrap">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => setCurrentScenarioIndex(index)}
                className={`px-4 py-2 rounded-md font-medium transition ${currentScenarioIndex === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                シナリオ {index + 1}
                {scenarios[index] && ' ✓'}
              </button>
            ))}
            {scenarios[currentScenarioIndex] && (
              <button
                onClick={() => handleClearScenario(currentScenarioIndex)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                現在のシナリオをクリア
              </button>
            )}
          </div>

          <LoanInputForm
            onCalculate={handleCalculate}
            initialValues={scenarios[currentScenarioIndex] || undefined}
            isCalculating={isCalculating}
          />
        </div>

        <ShareableLink scenarios={scenarios} />

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">比較結果</h2>
          <ComparisonView results={simulationResults} scenarios={scenarios} />
          <TaxDeductionView results={simulationResults} scenarios={scenarios} />
        </div>
      </div>
    </div>
  );
}

export default App;
