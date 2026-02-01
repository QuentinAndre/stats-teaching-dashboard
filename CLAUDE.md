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
