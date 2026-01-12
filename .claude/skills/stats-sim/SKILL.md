---
name: stats-sim
description: Creates interactive statistical simulations for teaching concepts like sampling distributions, hypothesis testing, confidence intervals, ANOVA, and regression. Use when building new statistical demonstrations.
---

When building statistical simulations:

## Component Structure
Create a folder per simulation:
```
src/components/simulations/[ConceptName]/
├── index.tsx          # Main component
├── Controls.tsx       # Parameter inputs
├── Visualization.tsx  # D3/chart component
├── hooks.ts           # Simulation logic
├── types.ts           # TypeScript interfaces
└── README.md          # Educational notes
```

## Implementation Pattern
1. **State**: Use Redux for shareable state, local state for UI-only
2. **Computation**: Keep statistical logic in custom hooks
3. **Animation**: Use requestAnimationFrame for smooth updates
4. **Responsiveness**: Charts should resize with container

## Educational Requirements
- Default parameters should show "typical" behavior
- Include edge cases students can explore
- Add "reset" functionality
- Show key statistics (mean, SE, etc.) updating live

## Common Statistical Simulations

### Sampling Distribution
- Draw random samples from population
- Show sample means accumulating into distribution
- Demonstrate Central Limit Theorem

### Hypothesis Testing
- Visual representation of null distribution
- Show alpha regions, p-values
- Interactive effect size adjustment

### Confidence Intervals
- Generate many CIs, show coverage rate
- Demonstrate interpretation (95 of 100 contain true parameter)

### ANOVA
- Multiple group comparisons
- Between vs within variance visualization
- F-distribution demonstration

### Regression
- Scatter plot with adjustable line
- Residuals visualization
- R-squared demonstration
