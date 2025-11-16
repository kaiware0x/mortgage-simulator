import { useState, useEffect } from 'react';
import type { LoanInput } from './utils/mortgageCalculator';
import { getScenariosFromUrl } from './utils/urlEncoder';
import { LoanInputForm } from './components/LoanInputForm';
import { ComparisonView } from './components/ComparisonView';
import { ShareableLink } from './components/ShareableLink';

function App() {
  const [scenarios, setScenarios] = useState<(LoanInput | null)[]>([null, null, null]);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);

  // URLからシナリオを復元
  useEffect(() => {
    const urlScenarios = getScenariosFromUrl();
    if (urlScenarios) {
      setScenarios(urlScenarios);
    }
  }, []);

  const handleCalculate = (input: LoanInput) => {
    const newScenarios = [...scenarios];
    newScenarios[currentScenarioIndex] = input;
    setScenarios(newScenarios);
  };

  const handleClearScenario = (index: number) => {
    const newScenarios = [...scenarios];
    newScenarios[index] = null;
    setScenarios(newScenarios);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-6 sm:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            住宅ローンシミュレーター
          </h1>
          <p className="text-gray-600">
            借入額・金利・期間・繰上返済を入力して、返済計画を比較できます
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
          />
        </div>

        <ShareableLink scenarios={scenarios} />

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">比較結果</h2>
          <ComparisonView scenarios={scenarios} />
        </div>
      </div>
    </div>
  );
}

export default App;
