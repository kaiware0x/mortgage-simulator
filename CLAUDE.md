# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Japanese mortgage payment simulator web application. It allows users to:
- Input loan amount, interest rate, borrowing period, and early repayment timing/amounts
- View monthly payment breakdowns (principal vs. interest) and remaining balance
- Compare up to 3 different simulation scenarios
- Share results via URLs and QR codes for result restoration

The app will be published on GitHub Pages as a public, login-free tool.

## Tech Stack

- **Frontend Framework**: React
- **Styling**: TailwindCSS
- **Deployment**: GitHub Pages
- **Language**: Japanese UI

## Project Structure

```
src/
├── components/          # React UI components
│   ├── LoanInputForm.tsx       # Input form for loan parameters
│   ├── RepaymentSchedule.tsx   # Display single scenario results
│   ├── ComparisonView.tsx      # Compare up to 3 scenarios
│   └── ShareableLink.tsx       # URL/QR code generation
├── utils/               # Business logic utilities
│   ├── mortgageCalculator.ts  # Loan calculation algorithms
│   └── urlEncoder.ts          # URL encoding/decoding for sharing
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles (Tailwind)
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (hot reload enabled)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Key Architecture

### Loan Calculation (`src/utils/mortgageCalculator.ts`)
- Implements equal principal and interest repayment (元利均等返済)
- Supports early repayments with period reduction (期間短縮型)
- Calculates monthly payments, principal/interest breakdown, and remaining balance
- All calculations are performed client-side

### State Management
- React useState manages 3 scenarios simultaneously in `App.tsx`
- Users can switch between scenarios using tab-like buttons
- Each scenario maintains independent loan parameters

### URL Sharing
- Scenarios are encoded to Base64 and included in URL query parameters
- QR codes are generated using `qrcode.react` library
- Shared URLs automatically restore all scenario parameters on page load

## Important Notes

- No backend/authentication needed - this is a client-side only application
- All calculation and state should be managed in the browser
- The application should be fully self-contained for easy GitHub Pages deployment
