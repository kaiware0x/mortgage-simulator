import { calculateRepaymentSchedule, type LoanInput, type SimulationResult } from '../utils/mortgageCalculator';

// メッセージの型定義
export type WorkerMessage = {
    type: 'calculate';
    payload: {
        scenarios: (LoanInput | null)[];
    };
};

export type WorkerResponse = {
    type: 'result';
    payload: {
        results: (SimulationResult | null)[];
    };
};

// メッセージハンドラ
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const { type, payload } = event.data;

    if (type === 'calculate') {
        const { scenarios } = payload;
        const results = scenarios.map((scenario) => {
            if (!scenario) return null;
            return calculateRepaymentSchedule(scenario);
        });

        const response: WorkerResponse = {
            type: 'result',
            payload: { results },
        };

        self.postMessage(response);
    }
};
