import { useState, useMemo, useCallback } from 'react';

// Types
interface DataRow {
  id: number;
  factorA: 'High' | 'Low';
  factorB: 'Strong' | 'Weak';
  value: number;
}

interface CalculatedRow extends DataRow {
  grandMean: number;
  cellMean: number;
  factorAMean: number;
  factorBMean: number;
  deviationTotal: number;
  deviationTotalSq: number;
  effectA: number;
  effectASq: number;
  effectB: number;
  effectBSq: number;
  effectAB: number;
  effectABSq: number;
  deviationWithin: number;
  deviationWithinSq: number;
}

// Fixed example data - 16 observations (4 per cell)
// Designed to show clear interaction pattern
const FIXED_DATA: DataRow[] = [
  // High Involvement + Strong Arguments (mean = 7)
  { id: 1, factorA: 'High', factorB: 'Strong', value: 7 },
  { id: 2, factorA: 'High', factorB: 'Strong', value: 8 },
  { id: 3, factorA: 'High', factorB: 'Strong', value: 6 },
  { id: 4, factorA: 'High', factorB: 'Strong', value: 7 },
  // High Involvement + Weak Arguments (mean = 3)
  { id: 5, factorA: 'High', factorB: 'Weak', value: 3 },
  { id: 6, factorA: 'High', factorB: 'Weak', value: 4 },
  { id: 7, factorA: 'High', factorB: 'Weak', value: 2 },
  { id: 8, factorA: 'High', factorB: 'Weak', value: 3 },
  // Low Involvement + Strong Arguments (mean = 5)
  { id: 9, factorA: 'Low', factorB: 'Strong', value: 5 },
  { id: 10, factorA: 'Low', factorB: 'Strong', value: 6 },
  { id: 11, factorA: 'Low', factorB: 'Strong', value: 4 },
  { id: 12, factorA: 'Low', factorB: 'Strong', value: 5 },
  // Low Involvement + Weak Arguments (mean = 5)
  { id: 13, factorA: 'Low', factorB: 'Weak', value: 4 },
  { id: 14, factorA: 'Low', factorB: 'Weak', value: 5 },
  { id: 15, factorA: 'Low', factorB: 'Weak', value: 5 },
  { id: 16, factorA: 'Low', factorB: 'Weak', value: 6 },
];

// Step descriptions
const STEP_CONTENT = [
  {
    title: 'Step 1: Raw Data',
    text: "Here's our dataset: 16 observations from a 2×2 factorial experiment. Each participant was assigned to one of four conditions.",
  },
  {
    title: 'Step 2: Grand Mean (Ȳ..)',
    text: 'The grand mean is the average of ALL observations. This is our baseline for measuring total variability.',
  },
  {
    title: 'Step 3: Total Variance (SS_T)',
    text: 'How far is each observation from the grand mean? Square these deviations and sum them to get SS_T—the total variability to explain.',
  },
  {
    title: 'Step 4: Factor A Effect (SS_A)',
    text: 'The Factor A (Involvement) marginal means show the average for each level. The effect is the deviation of each marginal mean from the grand mean.',
  },
  {
    title: 'Step 5: Factor B Effect (SS_B)',
    text: 'Similarly, Factor B (Argument Quality) marginal means show the average for each level. We calculate SS_B from these deviations.',
  },
  {
    title: 'Step 6: Interaction Effect (SS_A×B)',
    text: 'The interaction captures variance that cell means add beyond what the main effects predict. For each cell: (AB)_jk = Ȳ_cell − Ȳ_A − Ȳ_B + Ȳ_T. For example, the High-Strong cell: 7 − 5 − 6 + 5 = 1. This positive value means this cell is higher than predicted from the main effects alone. The interaction is significant when cells systematically deviate from additive predictions.',
  },
  {
    title: 'Step 7: Within-Cell Variance (SS_S/AB)',
    text: 'Finally, how far is each observation from its own cell mean? This is the residual variation within each condition—our error term.',
  },
];

// Computation functions
function computeAllValues(data: DataRow[]): CalculatedRow[] {
  const grandMean = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  // Calculate marginal means for Factor A
  const highData = data.filter((d) => d.factorA === 'High');
  const lowData = data.filter((d) => d.factorA === 'Low');
  const highMean = highData.reduce((s, d) => s + d.value, 0) / highData.length;
  const lowMean = lowData.reduce((s, d) => s + d.value, 0) / lowData.length;

  // Calculate marginal means for Factor B
  const strongData = data.filter((d) => d.factorB === 'Strong');
  const weakData = data.filter((d) => d.factorB === 'Weak');
  const strongMean = strongData.reduce((s, d) => s + d.value, 0) / strongData.length;
  const weakMean = weakData.reduce((s, d) => s + d.value, 0) / weakData.length;

  // Calculate cell means
  const cellMeans: Record<string, number> = {};
  const cells = ['High-Strong', 'High-Weak', 'Low-Strong', 'Low-Weak'];
  cells.forEach((cell) => {
    const [a, b] = cell.split('-');
    const cellData = data.filter((d) => d.factorA === a && d.factorB === b);
    cellMeans[cell] = cellData.reduce((s, d) => s + d.value, 0) / cellData.length;
  });

  return data.map((row) => {
    const factorAMean = row.factorA === 'High' ? highMean : lowMean;
    const factorBMean = row.factorB === 'Strong' ? strongMean : weakMean;
    const cellKey = `${row.factorA}-${row.factorB}`;
    const cellMean = cellMeans[cellKey];

    const deviationTotal = row.value - grandMean;
    const effectA = factorAMean - grandMean;
    const effectB = factorBMean - grandMean;
    const effectAB = cellMean - factorAMean - factorBMean + grandMean;
    const deviationWithin = row.value - cellMean;

    return {
      ...row,
      grandMean,
      cellMean,
      factorAMean,
      factorBMean,
      deviationTotal,
      deviationTotalSq: deviationTotal ** 2,
      effectA,
      effectASq: effectA ** 2,
      effectB,
      effectBSq: effectB ** 2,
      effectAB,
      effectABSq: effectAB ** 2,
      deviationWithin,
      deviationWithinSq: deviationWithin ** 2,
    };
  });
}

function computeSums(data: CalculatedRow[]) {
  return {
    ssTotal: data.reduce((s, d) => s + d.deviationTotalSq, 0),
    ssA: data.reduce((s, d) => s + d.effectASq, 0),
    ssB: data.reduce((s, d) => s + d.effectBSq, 0),
    ssAB: data.reduce((s, d) => s + d.effectABSq, 0),
    ssWithin: data.reduce((s, d) => s + d.deviationWithinSq, 0),
  };
}

export default function FactorialDecompositionTable() {
  const [currentStep, setCurrentStep] = useState(0);
  const [animatingStep, setAnimatingStep] = useState<number | null>(null);

  const MAX_STEP = 6;

  const calculatedData = useMemo(() => computeAllValues(FIXED_DATA), []);
  const sums = useMemo(() => computeSums(calculatedData), [calculatedData]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < MAX_STEP) {
      setAnimatingStep(currentStep + 1);
      setCurrentStep((s) => s + 1);
      setTimeout(() => setAnimatingStep(null), 500);
    }
  }, [currentStep]);

  // Determine which columns are visible at current step
  const visibleColumns = useMemo(
    () => ({
      factorA: true,
      factorB: true,
      value: true,
      grandMean: currentStep >= 1,
      deviationTotal: currentStep >= 2,
      deviationTotalSq: currentStep >= 2,
      factorAMean: currentStep >= 3,
      effectA: currentStep >= 3,
      effectASq: currentStep >= 3,
      factorBMean: currentStep >= 4,
      effectB: currentStep >= 4,
      effectBSq: currentStep >= 4,
      cellMean: currentStep >= 5,
      effectAB: currentStep >= 5,
      effectABSq: currentStep >= 5,
      deviationWithin: currentStep >= 6,
      deviationWithinSq: currentStep >= 6,
    }),
    [currentStep]
  );

  // Format number for display
  const formatNum = (n: number, decimals: number = 1) => {
    return n.toFixed(decimals);
  };


  return (
    <div className="viz-container">
      <h4>Step Through the Calculation</h4>

      {/* Step description */}
      <div className="step-description-box">
        <strong>{STEP_CONTENT[currentStep].title}</strong>
        <p>{STEP_CONTENT[currentStep].text}</p>
      </div>

      {/* Table */}
      <div className="decomposition-table-wrapper">
        <table className="decomposition-table factorial">
          <thead>
            <tr>
              <th>Inv.</th>
              <th>Args</th>
              <th>Y</th>
              {visibleColumns.grandMean && (
                <th className={animatingStep === 1 ? 'col-entering' : ''}>Ȳ<sub>T</sub></th>
              )}
              {visibleColumns.deviationTotal && (
                <th className={`col-total ${animatingStep === 2 ? 'col-entering' : ''}`}>
                  Y−Ȳ<sub>T</sub>
                </th>
              )}
              {visibleColumns.deviationTotalSq && (
                <th className={`col-total ${animatingStep === 2 ? 'col-entering' : ''}`}>
                  (Y−Ȳ<sub>T</sub>)²
                </th>
              )}
              {visibleColumns.factorAMean && (
                <th className={animatingStep === 3 ? 'col-entering' : ''}>Ȳ<sub>A.</sub></th>
              )}
              {visibleColumns.effectA && (
                <th className={`col-factor-a ${animatingStep === 3 ? 'col-entering' : ''}`}>
                  A
                </th>
              )}
              {visibleColumns.effectASq && (
                <th className={`col-factor-a ${animatingStep === 3 ? 'col-entering' : ''}`}>
                  A²
                </th>
              )}
              {visibleColumns.factorBMean && (
                <th className={animatingStep === 4 ? 'col-entering' : ''}>Ȳ<sub>.B</sub></th>
              )}
              {visibleColumns.effectB && (
                <th className={`col-factor-b ${animatingStep === 4 ? 'col-entering' : ''}`}>
                  B
                </th>
              )}
              {visibleColumns.effectBSq && (
                <th className={`col-factor-b ${animatingStep === 4 ? 'col-entering' : ''}`}>
                  B²
                </th>
              )}
              {visibleColumns.cellMean && (
                <th className={animatingStep === 5 ? 'col-entering' : ''}>Ȳ<sub>AB</sub></th>
              )}
              {visibleColumns.effectAB && (
                <th className={`col-interaction ${animatingStep === 5 ? 'col-entering' : ''}`}>
                  AB
                </th>
              )}
              {visibleColumns.effectABSq && (
                <th className={`col-interaction ${animatingStep === 5 ? 'col-entering' : ''}`}>
                  AB²
                </th>
              )}
              {visibleColumns.deviationWithin && (
                <th className={`col-within ${animatingStep === 6 ? 'col-entering' : ''}`}>
                  Y−Ȳ<sub>AB</sub>
                </th>
              )}
              {visibleColumns.deviationWithinSq && (
                <th className={`col-within ${animatingStep === 6 ? 'col-entering' : ''}`}>
                  (Y−Ȳ<sub>AB</sub>)²
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {calculatedData.map((row) => (
              <tr key={row.id}>
                <td>{row.factorA}</td>
                <td>{row.factorB}</td>
                <td>{row.value}</td>
                {visibleColumns.grandMean && <td>{formatNum(row.grandMean)}</td>}
                {visibleColumns.deviationTotal && (
                  <td className="col-total">{formatNum(row.deviationTotal)}</td>
                )}
                {visibleColumns.deviationTotalSq && (
                  <td className="col-total">{formatNum(row.deviationTotalSq, 2)}</td>
                )}
                {visibleColumns.factorAMean && <td>{formatNum(row.factorAMean)}</td>}
                {visibleColumns.effectA && (
                  <td className="col-factor-a">{formatNum(row.effectA)}</td>
                )}
                {visibleColumns.effectASq && (
                  <td className="col-factor-a">{formatNum(row.effectASq, 2)}</td>
                )}
                {visibleColumns.factorBMean && <td>{formatNum(row.factorBMean)}</td>}
                {visibleColumns.effectB && (
                  <td className="col-factor-b">{formatNum(row.effectB)}</td>
                )}
                {visibleColumns.effectBSq && (
                  <td className="col-factor-b">{formatNum(row.effectBSq, 2)}</td>
                )}
                {visibleColumns.cellMean && <td>{formatNum(row.cellMean)}</td>}
                {visibleColumns.effectAB && (
                  <td className="col-interaction">{formatNum(row.effectAB)}</td>
                )}
                {visibleColumns.effectABSq && (
                  <td className="col-interaction">{formatNum(row.effectABSq, 2)}</td>
                )}
                {visibleColumns.deviationWithin && (
                  <td className="col-within">{formatNum(row.deviationWithin)}</td>
                )}
                {visibleColumns.deviationWithinSq && (
                  <td className="col-within">{formatNum(row.deviationWithinSq, 2)}</td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="sum-row">
              <td colSpan={3}><strong>Sum</strong></td>
              {visibleColumns.grandMean && <td></td>}
              {visibleColumns.deviationTotal && <td className="col-total"></td>}
              {visibleColumns.deviationTotalSq && (
                <td className={`col-total ss-value ${currentStep === 2 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>T</sub>={formatNum(sums.ssTotal)}</strong>
                </td>
              )}
              {visibleColumns.factorAMean && <td></td>}
              {visibleColumns.effectA && <td className="col-factor-a"></td>}
              {visibleColumns.effectASq && (
                <td className={`col-factor-a ss-value ${currentStep === 3 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>A</sub>={formatNum(sums.ssA)}</strong>
                </td>
              )}
              {visibleColumns.factorBMean && <td></td>}
              {visibleColumns.effectB && <td className="col-factor-b"></td>}
              {visibleColumns.effectBSq && (
                <td className={`col-factor-b ss-value ${currentStep === 4 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>B</sub>={formatNum(sums.ssB)}</strong>
                </td>
              )}
              {visibleColumns.cellMean && <td></td>}
              {visibleColumns.effectAB && <td className="col-interaction"></td>}
              {visibleColumns.effectABSq && (
                <td className={`col-interaction ss-value ${currentStep === 5 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>A×B</sub>={formatNum(sums.ssAB)}</strong>
                </td>
              )}
              {visibleColumns.deviationWithin && <td className="col-within"></td>}
              {visibleColumns.deviationWithinSq && (
                <td className={`col-within ss-value ${currentStep === 6 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>W</sub>={formatNum(sums.ssWithin)}</strong>
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Verification display at final step */}
      {currentStep === 6 && (
        <div className="verification-box">
          <span className="check-icon">&#10003;</span>
          <div className="verification-content">
            <span className="verification-label">
              SS<sub>T</sub> = SS<sub>A</sub> + SS<sub>B</sub> + SS<sub>A×B</sub> + SS<sub>W</sub>
            </span>
            <span className="verification-equation">
              {formatNum(sums.ssTotal)} = {formatNum(sums.ssA)} + {formatNum(sums.ssB)} + {formatNum(sums.ssAB)} + {formatNum(sums.ssWithin)}
            </span>
          </div>
        </div>
      )}

      {/* Navigation controls */}
      <div className="decomposition-controls">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="phase-button"
        >
          &larr; Previous
        </button>

        <span className="step-indicator">
          Step {currentStep + 1} of {MAX_STEP + 1}
        </span>

        <button
          onClick={handleNext}
          disabled={currentStep === MAX_STEP}
          className="phase-button active"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
