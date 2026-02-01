# Statistics Teaching Dashboard

Educational dashboard helping students understand experimental design concepts through interactive visualizations and simulations.

## Tech Stack
- Frontend: React with Redux for state management
- Visualization: TBD (D3.js, Recharts, or similar)
- Backend: Python (Flask/FastAPI) if needed for complex computations
- Deployment: Heroku

## Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `python -m pytest` - Run backend tests (if applicable)

## Code Conventions
- Use TypeScript for all new React components
- Redux Toolkit for state management (createSlice pattern)
- Component files: PascalCase (e.g., SamplingDistribution.tsx)
- Hooks: camelCase with "use" prefix
- Statistical functions should include JSDoc with mathematical notation

## Statistical Components Pattern
Each simulation/visualization component should:
1. Have clear parameter controls (sliders, inputs)
2. Show real-time updates as parameters change
3. Include brief educational text explaining the concept
4. Be self-contained in its own directory with component, hooks, and tests

## Explanation Style
When explaining code or statistical concepts, include:
- The statistical principle being demonstrated
- Why this visualization helps students understand it
- Any simplifications made for educational purposes

## Writing Style
- Keep content pedagogic and descriptive
- Avoid fluff words like "elegant", "profound", "beautiful", "amazing", or similar hyperbole
- Use clear, direct language that focuses on teaching the concept
- Let the content speak for itself without embellishment
- Always include a space after closing italics/emphasis tags (e.g., `<em>word</em> next` not `<em>word</em>next`)

## Statistical Notation
- Use Keppel & Wickens notation consistently throughout all modules
- Observations: Y (not X)
- Grand mean: Ȳ_T or Ȳ.. (with subscript dots for marginal means)
- Group/cell means: Ȳ_A, Ȳ_B, Ȳ_AB
- Sums of squares: SS_T, SS_A, SS_B, SS_AB, SS_S/A, SS_S/AB
- Mean squares: MS_A, MS_B, MS_AB, MS_S/AB
- Effect notation: Use descriptive labels (e.g., "Factor A effect") rather than Greek letters (α, β) in explanatory text
