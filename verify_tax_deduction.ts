import { calculateRepaymentSchedule, LoanInput } from './src/utils/mortgageCalculator';

const input: LoanInput = {
    principal: 50000000, // 5000万円
    annualRate: 0.8,
    years: 35,
    taxDeductionEnabled: true,
    taxDeductionLimit: 40000000, // 4000万円
    taxDeductionRate: 0.007, // 0.7%
    taxDeductionPeriod: 13, // 13年
};

const result = calculateRepaymentSchedule(input);
const { schedule, yearlyTaxDeductions } = result;

console.log('--- Tax Deduction Verification ---');
console.log(`Principal: ${input.principal}`);
console.log(`Limit: ${input.taxDeductionLimit}`);
console.log(`Rate: ${input.taxDeductionRate}`);
console.log(`Period: ${input.taxDeductionPeriod}`);

console.log('\nYearly Deductions:');
yearlyTaxDeductions.forEach((deduction, index) => {
    const year = index + 1;
    const month = year * 12;
    const balance = schedule.find(p => p.month === month)?.remainingBalance || 0;
    console.log(`Year ${year}: Balance=${Math.floor(balance)}, Deduction=${deduction}`);

    // Verification logic
    const expectedDeduction = Math.floor(Math.min(balance, input.taxDeductionLimit!) * input.taxDeductionRate!);
    if (deduction !== expectedDeduction) {
        console.error(`ERROR: Year ${year} deduction mismatch. Expected ${expectedDeduction}, got ${deduction}`);
    }
});

if (yearlyTaxDeductions.length !== input.taxDeductionPeriod) {
    console.error(`ERROR: Deduction period mismatch. Expected ${input.taxDeductionPeriod}, got ${yearlyTaxDeductions.length}`);
} else {
    console.log('\nDeduction period length check: OK');
}

// Case 2: Balance < Limit
console.log('\n--- Case 2: Balance < Limit ---');
const input2: LoanInput = {
    ...input,
    principal: 20000000, // 2000万円 (Limit 4000万円)
};
const result2 = calculateRepaymentSchedule(input2);
const deduction2 = result2.yearlyTaxDeductions[0];
const balance2 = result2.schedule.find(p => p.month === 12)?.remainingBalance || 0;
const expectedDeduction2 = Math.floor(balance2 * input.taxDeductionRate!);

console.log(`Year 1: Balance=${Math.floor(balance2)}, Deduction=${deduction2}`);
if (deduction2 === expectedDeduction2) {
    console.log('Calculation check (Balance < Limit): OK');
} else {
    console.error(`ERROR: Calculation mismatch. Expected ${expectedDeduction2}, got ${deduction2}`);
}
