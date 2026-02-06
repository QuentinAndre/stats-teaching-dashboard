import { useState, useMemo, useCallback } from 'react';

// Fixed example data: Ad Appeal study (8 subjects, 4 per group, 2 time points)
// Designed for: small main effects of A and B, strong A×B interaction
const FIXED_DATA = [
  { subject: 'S1', group: 'Emotional', time: 'Immediate', value: 6.4 },
  { subject: 'S1', group: 'Emotional', time: 'Delayed', value: 5.2 },
  { subject: 'S2', group: 'Emotional', time: 'Immediate', value: 5.4 },
  { subject: 'S2', group: 'Emotional', time: 'Delayed', value: 3.0 },
  { subject: 'S3', group: 'Emotional', time: 'Immediate', value: 6.6 },
  { subject: 'S3', group: 'Emotional', time: 'Delayed', value: 4.2 },
  { subject: 'S4', group: 'Emotional', time: 'Immediate', value: 5.6 },
  { subject: 'S4', group: 'Emotional', time: 'Delayed', value: 4.4 },
  { subject: 'S5', group: 'Rational', time: 'Immediate', value: 4.4 },
  { subject: 'S5', group: 'Rational', time: 'Delayed', value: 4.6 },
  { subject: 'S6', group: 'Rational', time: 'Immediate', value: 3.4 },
  { subject: 'S6', group: 'Rational', time: 'Delayed', value: 5.2 },
  { subject: 'S7', group: 'Rational', time: 'Immediate', value: 4.4 },
  { subject: 'S7', group: 'Rational', time: 'Delayed', value: 5.2 },
  { subject: 'S8', group: 'Rational', time: 'Immediate', value: 3.8 },
  { subject: 'S8', group: 'Rational', time: 'Delayed', value: 5.0 },
];

// Step descriptions for mixed designs
const STEP_CONTENT = [
  {
    title: 'Step 1: Raw Data',
    text: "Here's our Ad Appeal study: 8 subjects (4 per group) × 2 time points = 16 observations. Each row is one measurement.",
  },
  {
    title: 'Step 2: Grand Mean (ȲT)',
    text: 'The grand mean ȲT is the average of ALL 16 observations. This is our baseline for measuring total variability.',
  },
  {
    title: 'Step 3: Total Variance (SST)',
    text: 'How far is each observation from the grand mean? Square these deviations and sum them to get SST.',
  },
  {
    title: 'Step 4: Between-Subjects Factor (SSA)',
    text: 'Each ad appeal group has a mean (Ȳa). The deviation of group means from the grand mean, weighted by n×b, gives SSA—the main effect of Ad Appeal.',
  },
  {
    title: 'Step 5: Subjects Within Groups (SSS/A)',
    text: "Each subject has a mean across time points (Ȳs). The deviation of subject means from their group mean, weighted by b, gives SSS/A—individual differences within each group. This is the error term for testing Factor A.",
  },
  {
    title: 'Step 6: Within-Subjects Factor (SSB)',
    text: 'Each time point has a mean (Ȳb). The deviation of time means from the grand mean, weighted by a×n, gives SSB—the main effect of Time.',
  },
  {
    title: 'Step 7: Interaction (SSA×B)',
    text: 'The interaction effect represents how the time effect differs between ad appeal groups. We compute: n × Σ(Ȳab - Ȳa - Ȳb + ȲT)² for each cell.',
  },
  {
    title: 'Step 8: Residual (SSB×S/A)',
    text: "What's left is the residual: Y - Ȳab - Ȳs + Ȳa. This represents inconsistency in how subjects respond across time—the error term for testing B and A×B.",
  },
];

interface CalculatedRow {
  subject: string;
  group: string;
  time: string;
  value: number;
  grandMean: number;
  groupMean: number;
  timeMean: number;
  cellMean: number;
  subjectMean: number;
  devTotal: number;
  devTotalSq: number;
  devGroup: number;
  devGroupSq: number;
  devSubject: number;
  devSubjectSq: number;
  devTime: number;
  devTimeSq: number;
  devInteraction: number;
  devInteractionSq: number;
  residual: number;
  residualSq: number;
}

function computeAllValues(data: typeof FIXED_DATA) {
  const n = data.length;
  const grandMean = data.reduce((sum, d) => sum + d.value, 0) / n;

  // Get unique groups, times, subjects
  const groups = [...new Set(data.map((d) => d.group))];
  const times = [...new Set(data.map((d) => d.time))];
  const subjects = [...new Set(data.map((d) => d.subject))];

  const a = groups.length;
  const b = times.length;
  const nPerGroup = subjects.length / a;

  // Compute group means
  const groupMeans: Record<string, number> = {};
  for (const g of groups) {
    const vals = data.filter((d) => d.group === g).map((d) => d.value);
    groupMeans[g] = vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  // Compute time means
  const timeMeans: Record<string, number> = {};
  for (const t of times) {
    const vals = data.filter((d) => d.time === t).map((d) => d.value);
    timeMeans[t] = vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  // Compute cell means (group × time)
  const cellMeans: Record<string, Record<string, number>> = {};
  for (const g of groups) {
    cellMeans[g] = {};
    for (const t of times) {
      const vals = data.filter((d) => d.group === g && d.time === t).map((d) => d.value);
      cellMeans[g][t] = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
  }

  // Compute subject means
  const subjectMeans: Record<string, number> = {};
  for (const s of subjects) {
    const vals = data.filter((d) => d.subject === s).map((d) => d.value);
    subjectMeans[s] = vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  // Calculate per-row values
  const rows: CalculatedRow[] = data.map((d) => {
    const devTotal = d.value - grandMean;
    const devGroup = groupMeans[d.group] - grandMean;
    const devSubject = subjectMeans[d.subject] - groupMeans[d.group];
    const devTime = timeMeans[d.time] - grandMean;
    const devInteraction = cellMeans[d.group][d.time] - groupMeans[d.group] - timeMeans[d.time] + grandMean;
    const residual = d.value - cellMeans[d.group][d.time] - subjectMeans[d.subject] + groupMeans[d.group];

    return {
      subject: d.subject,
      group: d.group,
      time: d.time,
      value: d.value,
      grandMean,
      groupMean: groupMeans[d.group],
      timeMean: timeMeans[d.time],
      cellMean: cellMeans[d.group][d.time],
      subjectMean: subjectMeans[d.subject],
      devTotal,
      devTotalSq: devTotal ** 2,
      devGroup,
      devGroupSq: devGroup ** 2,
      devSubject,
      devSubjectSq: devSubject ** 2,
      devTime,
      devTimeSq: devTime ** 2,
      devInteraction,
      devInteractionSq: devInteraction ** 2,
      residual,
      residualSq: residual ** 2,
    };
  });

  // Compute SS values
  const ssTotal = rows.reduce((sum, r) => sum + r.devTotalSq, 0);
  // SSA: multiply by n_per_group * b for proper weighting
  const ssGroup = nPerGroup * b * groups.reduce((sum, g) => {
    return sum + Math.pow(groupMeans[g] - grandMean, 2);
  }, 0);
  // SSS/A: multiply by b for proper weighting
  const ssSubject = b * subjects.reduce((sum, s) => {
    const subjectGroup = data.find((d) => d.subject === s)!.group;
    return sum + Math.pow(subjectMeans[s] - groupMeans[subjectGroup], 2);
  }, 0);
  // SSB: multiply by a * n_per_group for proper weighting
  const ssTime = a * nPerGroup * times.reduce((sum, t) => {
    return sum + Math.pow(timeMeans[t] - grandMean, 2);
  }, 0);
  // SSAB: multiply by n_per_group for proper weighting
  const ssInteraction = nPerGroup * groups.reduce((sum, g) => {
    return sum + times.reduce((tSum, t) => {
      const interaction = cellMeans[g][t] - groupMeans[g] - timeMeans[t] + grandMean;
      return tSum + Math.pow(interaction, 2);
    }, 0);
  }, 0);
  // SSB×S/A (residual): sum of squared residuals
  const ssResidual = rows.reduce((sum, r) => sum + r.residualSq, 0);

  return {
    rows,
    grandMean,
    groupMeans,
    timeMeans,
    cellMeans,
    subjectMeans,
    ssTotal,
    ssGroup,
    ssSubject,
    ssTime,
    ssInteraction,
    ssResidual,
    a,
    b,
    nPerGroup,
  };
}

export default function MixedDecompositionTable() {
  const [currentStep, setCurrentStep] = useState(0);
  const [animatingStep, setAnimatingStep] = useState<number | null>(null);

  const MAX_STEP = 7;
  const calc = useMemo(() => computeAllValues(FIXED_DATA), []);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < MAX_STEP) {
      setAnimatingStep(currentStep + 1);
      setCurrentStep((s) => s + 1);
      setTimeout(() => setAnimatingStep(null), 500);
    }
  }, [currentStep]);

  const formatNum = (n: number, d: number = 2) => n.toFixed(d);

  // Column visibility by step
  const show = {
    grandMean: currentStep >= 1,
    devTotal: currentStep >= 2,
    devTotalSq: currentStep >= 2,
    groupMean: currentStep >= 3,
    devGroup: currentStep >= 3,
    devGroupSq: currentStep >= 3,
    subjectMean: currentStep >= 4,
    devSubject: currentStep >= 4,
    devSubjectSq: currentStep >= 4,
    timeMean: currentStep >= 5,
    devTime: currentStep >= 5,
    devTimeSq: currentStep >= 5,
    devInteraction: currentStep >= 6,
    devInteractionSq: currentStep >= 6,
    residual: currentStep >= 7,
    residualSq: currentStep >= 7,
  };

  return (
    <div className="viz-container">
      <h4>Step Through the Calculation</h4>

      <div className="step-description-box">
        <strong>{STEP_CONTENT[currentStep].title}</strong>
        <p>{STEP_CONTENT[currentStep].text}</p>
      </div>

      <div className="decomposition-table-wrapper">
        <table className="decomposition-table">
          <thead>
            <tr>
              <th>Subj</th>
              <th>Group</th>
              <th>Time</th>
              <th>Y</th>
              {show.grandMean && (
                <th className={animatingStep === 1 ? 'col-entering' : ''}>
                  Ȳ<sub>T</sub>
                </th>
              )}
              {show.devTotal && (
                <th className={`col-total ${animatingStep === 2 ? 'col-entering' : ''}`}>
                  Y−Ȳ<sub>T</sub>
                </th>
              )}
              {show.devTotalSq && (
                <th className={`col-total ${animatingStep === 2 ? 'col-entering' : ''}`}>
                  (...)²
                </th>
              )}
              {show.groupMean && (
                <th className={animatingStep === 3 ? 'col-entering' : ''}>
                  Ȳ<sub>a</sub>
                </th>
              )}
              {show.devGroup && (
                <th className={`col-between ${animatingStep === 3 ? 'col-entering' : ''}`}>
                  Ȳ<sub>a</sub>−Ȳ<sub>T</sub>
                </th>
              )}
              {show.devGroupSq && (
                <th className={`col-between ${animatingStep === 3 ? 'col-entering' : ''}`}>
                  (...)²
                </th>
              )}
              {show.subjectMean && (
                <th className={animatingStep === 4 ? 'col-entering' : ''}>
                  Ȳ<sub>s</sub>
                </th>
              )}
              {show.devSubject && (
                <th className={`col-subject ${animatingStep === 4 ? 'col-entering' : ''}`}>
                  Ȳ<sub>s</sub>−Ȳ<sub>a</sub>
                </th>
              )}
              {show.devSubjectSq && (
                <th className={`col-subject ${animatingStep === 4 ? 'col-entering' : ''}`}>
                  (...)²
                </th>
              )}
              {show.timeMean && (
                <th className={animatingStep === 5 ? 'col-entering' : ''}>
                  Ȳ<sub>b</sub>
                </th>
              )}
              {show.devTime && (
                <th className={`col-within ${animatingStep === 5 ? 'col-entering' : ''}`}>
                  Ȳ<sub>b</sub>−Ȳ<sub>T</sub>
                </th>
              )}
              {show.devTimeSq && (
                <th className={`col-within ${animatingStep === 5 ? 'col-entering' : ''}`}>
                  (...)²
                </th>
              )}
              {show.devInteraction && (
                <th className={`col-interaction ${animatingStep === 6 ? 'col-entering' : ''}`}>
                  int
                </th>
              )}
              {show.devInteractionSq && (
                <th className={`col-interaction ${animatingStep === 6 ? 'col-entering' : ''}`}>
                  (...)²
                </th>
              )}
              {show.residual && (
                <th className={`col-residual ${animatingStep === 7 ? 'col-entering' : ''}`}>
                  resid
                </th>
              )}
              {show.residualSq && (
                <th className={`col-residual ${animatingStep === 7 ? 'col-entering' : ''}`}>
                  (...)²
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((row, i) => (
              <tr key={i}>
                <td style={{ color: '#f4a261', fontWeight: 600 }}>{row.subject}</td>
                <td style={{ color: row.group === 'Emotional' ? '#6366f1' : '#6b7280', fontWeight: 500 }}>
                  {row.group.slice(0, 4)}
                </td>
                <td style={{ color: '#f59e0b', fontWeight: 500 }}>{row.time.slice(0, 4)}</td>
                <td>{formatNum(row.value, 1)}</td>
                {show.grandMean && <td>{formatNum(row.grandMean)}</td>}
                {show.devTotal && (
                  <td className="col-total">{formatNum(row.devTotal)}</td>
                )}
                {show.devTotalSq && (
                  <td className="col-total">{formatNum(row.devTotalSq)}</td>
                )}
                {show.groupMean && <td>{formatNum(row.groupMean)}</td>}
                {show.devGroup && (
                  <td className="col-between">{formatNum(row.devGroup)}</td>
                )}
                {show.devGroupSq && (
                  <td className="col-between">{formatNum(row.devGroupSq)}</td>
                )}
                {show.subjectMean && <td>{formatNum(row.subjectMean)}</td>}
                {show.devSubject && (
                  <td className="col-subject">{formatNum(row.devSubject)}</td>
                )}
                {show.devSubjectSq && (
                  <td className="col-subject">{formatNum(row.devSubjectSq)}</td>
                )}
                {show.timeMean && <td>{formatNum(row.timeMean)}</td>}
                {show.devTime && (
                  <td className="col-within">{formatNum(row.devTime)}</td>
                )}
                {show.devTimeSq && (
                  <td className="col-within">{formatNum(row.devTimeSq)}</td>
                )}
                {show.devInteraction && (
                  <td className="col-interaction">{formatNum(row.devInteraction)}</td>
                )}
                {show.devInteractionSq && (
                  <td className="col-interaction">{formatNum(row.devInteractionSq)}</td>
                )}
                {show.residual && (
                  <td className="col-residual">{formatNum(row.residual)}</td>
                )}
                {show.residualSq && (
                  <td className="col-residual">{formatNum(row.residualSq)}</td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="sum-row">
              <td colSpan={4}>
                <strong>Sum</strong>
              </td>
              {show.grandMean && <td></td>}
              {show.devTotal && <td className="col-total"></td>}
              {show.devTotalSq && (
                <td className={`col-total ss-value ${currentStep === 2 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>T</sub>={formatNum(calc.ssTotal, 1)}</strong>
                </td>
              )}
              {show.groupMean && <td></td>}
              {show.devGroup && <td className="col-between"></td>}
              {show.devGroupSq && (
                <td className={`col-between ss-value ${currentStep === 3 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>A</sub>={formatNum(calc.ssGroup, 2)}</strong>
                </td>
              )}
              {show.subjectMean && <td></td>}
              {show.devSubject && <td className="col-subject"></td>}
              {show.devSubjectSq && (
                <td className={`col-subject ss-value ${currentStep === 4 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>S/A</sub>={formatNum(calc.ssSubject, 2)}</strong>
                </td>
              )}
              {show.timeMean && <td></td>}
              {show.devTime && <td className="col-within"></td>}
              {show.devTimeSq && (
                <td className={`col-within ss-value ${currentStep === 5 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>B</sub>={formatNum(calc.ssTime, 2)}</strong>
                </td>
              )}
              {show.devInteraction && <td className="col-interaction"></td>}
              {show.devInteractionSq && (
                <td className={`col-interaction ss-value ${currentStep === 6 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>A×B</sub>={formatNum(calc.ssInteraction, 2)}</strong>
                </td>
              )}
              {show.residual && <td className="col-residual"></td>}
              {show.residualSq && (
                <td className={`col-residual ss-value ${currentStep === 7 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>B×S/A</sub>={formatNum(calc.ssResidual, 2)}</strong>
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Verification at final step */}
      {currentStep === 7 && (
        <div className="verification-box">
          <span className="check-icon">&#10003;</span>
          <div className="verification-content">
            <span className="verification-label">
              SS<sub>T</sub> = SS<sub>A</sub> + SS<sub>S/A</sub> + SS<sub>B</sub> + SS<sub>A×B</sub> + SS<sub>B×S/A</sub>
            </span>
            <span className="verification-equation">
              {formatNum(calc.ssTotal, 1)} = {formatNum(calc.ssGroup, 2)} +{' '}
              {formatNum(calc.ssSubject, 2)} + {formatNum(calc.ssTime, 2)} +{' '}
              {formatNum(calc.ssInteraction, 2)} + {formatNum(calc.ssResidual, 2)}
            </span>
          </div>
        </div>
      )}

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
