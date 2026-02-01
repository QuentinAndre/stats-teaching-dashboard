import { useState, useMemo, useCallback } from 'react';

// Types
interface DataRow {
  id: number;
  group: 'A' | 'B';
  value: number;
}

interface CalculatedRow extends DataRow {
  grandMean: number;
  groupMean: number;
  deviationTotal: number;
  deviationTotalSq: number;
  deviationBetween: number;
  deviationBetweenSq: number;
  deviationWithin: number;
  deviationWithinSq: number;
}

// Fixed example data - simple sequential numbers for easy mental tracking
const FIXED_DATA: DataRow[] = [
  { id: 1, group: 'A', value: 2 },
  { id: 2, group: 'A', value: 4 },
  { id: 3, group: 'A', value: 6 },
  { id: 4, group: 'A', value: 8 },
  { id: 5, group: 'A', value: 10 },
  { id: 6, group: 'B', value: 7 },
  { id: 7, group: 'B', value: 9 },
  { id: 8, group: 'B', value: 11 },
  { id: 9, group: 'B', value: 13 },
  { id: 10, group: 'B', value: 15 },
];

// Step descriptions for educational content (using Keppel & Wickens notation)
const STEP_CONTENT = [
  {
    title: 'Step 1: Raw Data',
    text: "Here's our dataset: 10 observations (Y) from a two-group experiment. Groups A and B each have 5 participants.",
  },
  {
    title: 'Step 2: Grand Mean (ȲT)',
    text: 'The grand mean ȲT is the average of ALL observations: (2+4+6+8+10+7+9+11+13+15) / 10 = 8.5. This is our baseline for measuring total variability.',
  },
  {
    title: 'Step 3: Total Variance (SST)',
    text: 'How far is each observation from the grand mean? Square these deviations and sum them to get SST = 262.5. This is the total variability we need to explain.',
  },
  {
    title: 'Step 4: Between-Group Variance (SSA)',
    text: 'Now reveal the group means ȲA (A = 6, B = 11). How far is each group mean from the grand mean? Square and sum to get SSA = 62.5. This is the "signal" due to group membership.',
  },
  {
    title: 'Step 5: Within-Group Variance (SSS/A)',
    text: 'Finally, how far is each observation from its own group mean? Square and sum to get SSS/A = 200. This is the "noise"—individual variation within groups.',
  },
];

// Computation functions
function computeAllValues(data: DataRow[]): CalculatedRow[] {
  const grandMean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  const groupAValues = data.filter((d) => d.group === 'A');
  const groupBValues = data.filter((d) => d.group === 'B');
  const groupAMean =
    groupAValues.reduce((s, d) => s + d.value, 0) / groupAValues.length;
  const groupBMean =
    groupBValues.reduce((s, d) => s + d.value, 0) / groupBValues.length;

  return data.map((row) => {
    const groupMean = row.group === 'A' ? groupAMean : groupBMean;
    const deviationTotal = row.value - grandMean;
    const deviationBetween = groupMean - grandMean;
    const deviationWithin = row.value - groupMean;

    return {
      ...row,
      grandMean,
      groupMean,
      deviationTotal,
      deviationTotalSq: deviationTotal ** 2,
      deviationBetween,
      deviationBetweenSq: deviationBetween ** 2,
      deviationWithin,
      deviationWithinSq: deviationWithin ** 2,
    };
  });
}

function computeSums(data: CalculatedRow[]) {
  return {
    ssTotal: data.reduce((s, d) => s + d.deviationTotalSq, 0),
    ssBetween: data.reduce((s, d) => s + d.deviationBetweenSq, 0),
    ssWithin: data.reduce((s, d) => s + d.deviationWithinSq, 0),
  };
}

export default function ANOVADecompositionTable() {
  const [currentStep, setCurrentStep] = useState(0);
  const [animatingStep, setAnimatingStep] = useState<number | null>(null);

  const MAX_STEP = 4;

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
  // Step 0: raw data, Step 1: grand mean, Step 2: total SS, Step 3: between SS, Step 4: within SS
  const visibleColumns = useMemo(
    () => ({
      group: true,
      value: true,
      grandMean: currentStep >= 1,
      deviationTotal: currentStep >= 2,
      deviationTotalSq: currentStep >= 2,
      groupMean: currentStep >= 3,
      deviationBetween: currentStep >= 3,
      deviationBetweenSq: currentStep >= 3,
      deviationWithin: currentStep >= 4,
      deviationWithinSq: currentStep >= 4,
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
        <table className="decomposition-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>
                Y
              </th>
              {visibleColumns.grandMean && (
                <th className={animatingStep === 1 ? 'col-entering' : ''}>
                  Ȳ<sub>T</sub>
                </th>
              )}
              {visibleColumns.deviationTotal && (
                <th
                  className={`col-total ${animatingStep === 2 ? 'col-entering' : ''}`}
                >
                  Y - Ȳ<sub>T</sub>
                </th>
              )}
              {visibleColumns.deviationTotalSq && (
                <th
                  className={`col-total ${animatingStep === 2 ? 'col-entering' : ''}`}
                >
                  (Y - Ȳ<sub>T</sub>)²
                </th>
              )}
              {visibleColumns.groupMean && (
                <th className={animatingStep === 3 ? 'col-entering' : ''}>
                  Ȳ<sub>A</sub>
                </th>
              )}
              {visibleColumns.deviationBetween && (
                <th
                  className={`col-between ${animatingStep === 3 ? 'col-entering' : ''}`}
                >
                  Ȳ<sub>A</sub> - Ȳ<sub>T</sub>
                </th>
              )}
              {visibleColumns.deviationBetweenSq && (
                <th
                  className={`col-between ${animatingStep === 3 ? 'col-entering' : ''}`}
                >
                  (Ȳ<sub>A</sub> - Ȳ<sub>T</sub>)²
                </th>
              )}
              {visibleColumns.deviationWithin && (
                <th
                  className={`col-within ${animatingStep === 4 ? 'col-entering' : ''}`}
                >
                  Y - Ȳ<sub>A</sub>
                </th>
              )}
              {visibleColumns.deviationWithinSq && (
                <th
                  className={`col-within ${animatingStep === 4 ? 'col-entering' : ''}`}
                >
                  (Y - Ȳ<sub>A</sub>)²
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {calculatedData.map((row) => (
              <tr key={row.id} className={`group-${row.group.toLowerCase()}`}>
                <td
                  style={{
                    color: row.group === 'A' ? '#4361ee' : '#f4a261',
                    fontWeight: 600,
                  }}
                >
                  {row.group}
                </td>
                <td>{row.value}</td>
                {visibleColumns.grandMean && (
                  <td>{formatNum(row.grandMean)}</td>
                )}
                {visibleColumns.deviationTotal && (
                  <td className="col-total">
                    {formatNum(row.deviationTotal)}
                  </td>
                )}
                {visibleColumns.deviationTotalSq && (
                  <td className="col-total">
                    {formatNum(row.deviationTotalSq, 2)}
                  </td>
                )}
                {visibleColumns.groupMean && (
                  <td>{formatNum(row.groupMean)}</td>
                )}
                {visibleColumns.deviationBetween && (
                  <td className="col-between">
                    {formatNum(row.deviationBetween)}
                  </td>
                )}
                {visibleColumns.deviationBetweenSq && (
                  <td className="col-between">
                    {formatNum(row.deviationBetweenSq, 2)}
                  </td>
                )}
                {visibleColumns.deviationWithin && (
                  <td className="col-within">
                    {formatNum(row.deviationWithin)}
                  </td>
                )}
                {visibleColumns.deviationWithinSq && (
                  <td className="col-within">
                    {formatNum(row.deviationWithinSq, 2)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="sum-row">
              <td colSpan={2}>
                <strong>Sum</strong>
              </td>
              {visibleColumns.grandMean && <td></td>}
              {visibleColumns.deviationTotal && (
                <td className="col-total"></td>
              )}
              {visibleColumns.deviationTotalSq && (
                <td
                  className={`col-total ss-value ${currentStep === 2 ? 'cell-highlight' : ''}`}
                >
                  <strong>SS<sub>T</sub> = {formatNum(sums.ssTotal)}</strong>
                </td>
              )}
              {visibleColumns.groupMean && <td></td>}
              {visibleColumns.deviationBetween && (
                <td className="col-between"></td>
              )}
              {visibleColumns.deviationBetweenSq && (
                <td
                  className={`col-between ss-value ${currentStep === 3 ? 'cell-highlight' : ''}`}
                >
                  <strong>SS<sub>A</sub> = {formatNum(sums.ssBetween)}</strong>
                </td>
              )}
              {visibleColumns.deviationWithin && (
                <td className="col-within"></td>
              )}
              {visibleColumns.deviationWithinSq && (
                <td
                  className={`col-within ss-value ${currentStep === 4 ? 'cell-highlight' : ''}`}
                >
                  <strong>SS<sub>S/A</sub> = {formatNum(sums.ssWithin)}</strong>
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Verification display at final step */}
      {currentStep === 4 && (
        <div className="verification-box">
          <span className="check-icon">&#10003;</span>
          <div className="verification-content">
            <span className="verification-label">
              SS<sub>T</sub> = SS<sub>A</sub> + SS<sub>S/A</sub>
            </span>
            <span className="verification-equation">
              {formatNum(sums.ssTotal)} = {formatNum(sums.ssBetween)} +{' '}
              {formatNum(sums.ssWithin)}
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
