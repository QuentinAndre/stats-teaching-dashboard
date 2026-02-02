import { useState, useMemo, useCallback } from 'react';

// Fixed example data: 4 subjects × 3 conditions in LONG FORM
// Smaller dataset for clarity, with non-zero residuals
const FIXED_DATA = [
  { subject: 'S1', condition: 'Con', value: 400 },
  { subject: 'S1', condition: 'Neu', value: 440 },
  { subject: 'S1', condition: 'Inc', value: 520 },
  { subject: 'S2', condition: 'Con', value: 350 },
  { subject: 'S2', condition: 'Neu', value: 410 },
  { subject: 'S2', condition: 'Inc', value: 450 },
  { subject: 'S3', condition: 'Con', value: 500 },
  { subject: 'S3', condition: 'Neu', value: 540 },
  { subject: 'S3', condition: 'Inc', value: 620 },
  { subject: 'S4', condition: 'Con', value: 420 },
  { subject: 'S4', condition: 'Neu', value: 490 },
  { subject: 'S4', condition: 'Inc', value: 510 },
];

// Step descriptions matching ANOVA module progression
const STEP_CONTENT = [
  {
    title: 'Step 1: Raw Data',
    text: "Here's our Stroop data: 4 subjects × 3 conditions = 12 observations. Each row is one measurement.",
  },
  {
    title: 'Step 2: Grand Mean (ȲT)',
    text: 'The grand mean ȲT is the average of ALL 12 observations. This is our baseline for measuring total variability.',
  },
  {
    title: 'Step 3: Total Variance (SST)',
    text: 'How far is each observation from the grand mean? Square these deviations and sum them to get SST. This is the total variability we need to explain.',
  },
  {
    title: 'Step 4: Condition Variance (SSA)',
    text: 'Each condition has a mean (Ȳa). How far is each condition mean from the grand mean? Square and sum (weighted by n subjects) to get SSA—the effect we care about.',
  },
  {
    title: 'Step 5: Subject Variance (SSS)',
    text: 'Each subject has a mean (Ȳs). How far is each subject mean from the grand mean? Square and sum (weighted by n conditions) to get SSS—individual differences we remove.',
  },
  {
    title: 'Step 6: Residual Variance (SSA×S)',
    text: 'The residual is what remains: Y − Ȳa − Ȳs + ȲT. Square and sum to get SSA×S—our error term representing inconsistency in how subjects respond to conditions.',
  },
];

interface CalculatedRow {
  subject: string;
  condition: string;
  value: number;
  grandMean: number;
  subjectMean: number;
  conditionMean: number;
  devTotal: number;
  devTotalSq: number;
  devCondition: number;
  devConditionSq: number;
  devSubject: number;
  devSubjectSq: number;
  residual: number;
  residualSq: number;
}

function computeAllValues(data: typeof FIXED_DATA) {
  const n = data.length;
  const grandMean = data.reduce((sum, d) => sum + d.value, 0) / n;

  // Compute subject means
  const subjects = [...new Set(data.map((d) => d.subject))];
  const subjectMeans: Record<string, number> = {};
  for (const s of subjects) {
    const vals = data.filter((d) => d.subject === s).map((d) => d.value);
    subjectMeans[s] = vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  // Compute condition means
  const conditions = [...new Set(data.map((d) => d.condition))];
  const conditionMeans: Record<string, number> = {};
  for (const c of conditions) {
    const vals = data.filter((d) => d.condition === c).map((d) => d.value);
    conditionMeans[c] = vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  const nSubjects = subjects.length;
  const nConditions = conditions.length;

  // Calculate per-row values
  const rows: CalculatedRow[] = data.map((d) => {
    const devTotal = d.value - grandMean;
    const devCondition = conditionMeans[d.condition] - grandMean;
    const devSubject = subjectMeans[d.subject] - grandMean;
    const residual = d.value - subjectMeans[d.subject] - conditionMeans[d.condition] + grandMean;

    return {
      subject: d.subject,
      condition: d.condition,
      value: d.value,
      grandMean,
      subjectMean: subjectMeans[d.subject],
      conditionMean: conditionMeans[d.condition],
      devTotal,
      devTotalSq: devTotal ** 2,
      devCondition,
      devConditionSq: devCondition ** 2,
      devSubject,
      devSubjectSq: devSubject ** 2,
      residual,
      residualSq: residual ** 2,
    };
  });

  // Compute SS values
  const ssTotal = rows.reduce((sum, r) => sum + r.devTotalSq, 0);
  const ssConditions = rows.reduce((sum, r) => sum + r.devConditionSq, 0);
  const ssSubjects = rows.reduce((sum, r) => sum + r.devSubjectSq, 0);
  const ssResidual = rows.reduce((sum, r) => sum + r.residualSq, 0);

  return {
    rows,
    grandMean,
    ssTotal,
    ssConditions,
    ssSubjects,
    ssResidual,
    nSubjects,
    nConditions,
  };
}

export default function RMDecompositionTable() {
  const [currentStep, setCurrentStep] = useState(0);
  const [animatingStep, setAnimatingStep] = useState<number | null>(null);

  const MAX_STEP = 5;
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

  const formatNum = (n: number, d: number = 1) => n.toFixed(d);

  // Column visibility by step (matching ANOVA progression exactly)
  const show = {
    grandMean: currentStep >= 1,
    devTotal: currentStep >= 2,
    devTotalSq: currentStep >= 2,
    conditionMean: currentStep >= 3,
    devCondition: currentStep >= 3,
    devConditionSq: currentStep >= 3,
    subjectMean: currentStep >= 4,
    devSubject: currentStep >= 4,
    devSubjectSq: currentStep >= 4,
    residual: currentStep >= 5,
    residualSq: currentStep >= 5,
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
              <th>Cond</th>
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
                  (Y−Ȳ<sub>T</sub>)²
                </th>
              )}
              {show.conditionMean && (
                <th className={animatingStep === 3 ? 'col-entering' : ''}>
                  Ȳ<sub>a</sub>
                </th>
              )}
              {show.devCondition && (
                <th className={`col-condition ${animatingStep === 3 ? 'col-entering' : ''}`}>
                  Ȳ<sub>a</sub>−Ȳ<sub>T</sub>
                </th>
              )}
              {show.devConditionSq && (
                <th className={`col-condition ${animatingStep === 3 ? 'col-entering' : ''}`}>
                  (Ȳ<sub>a</sub>−Ȳ<sub>T</sub>)²
                </th>
              )}
              {show.subjectMean && (
                <th className={animatingStep === 4 ? 'col-entering' : ''}>
                  Ȳ<sub>s</sub>
                </th>
              )}
              {show.devSubject && (
                <th className={`col-subject ${animatingStep === 4 ? 'col-entering' : ''}`}>
                  Ȳ<sub>s</sub>−Ȳ<sub>T</sub>
                </th>
              )}
              {show.devSubjectSq && (
                <th className={`col-subject ${animatingStep === 4 ? 'col-entering' : ''}`}>
                  (Ȳ<sub>s</sub>−Ȳ<sub>T</sub>)²
                </th>
              )}
              {show.residual && (
                <th className={`col-residual ${animatingStep === 5 ? 'col-entering' : ''}`}>
                  resid
                </th>
              )}
              {show.residualSq && (
                <th className={`col-residual ${animatingStep === 5 ? 'col-entering' : ''}`}>
                  resid²
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((row, i) => (
              <tr key={i}>
                <td style={{ color: '#f4a261', fontWeight: 600 }}>{row.subject}</td>
                <td style={{ color: '#4361ee', fontWeight: 500 }}>{row.condition}</td>
                <td>{row.value}</td>
                {show.grandMean && <td>{formatNum(row.grandMean)}</td>}
                {show.devTotal && (
                  <td className="col-total">{formatNum(row.devTotal)}</td>
                )}
                {show.devTotalSq && (
                  <td className="col-total">{formatNum(row.devTotalSq, 0)}</td>
                )}
                {show.conditionMean && <td>{formatNum(row.conditionMean)}</td>}
                {show.devCondition && (
                  <td className="col-condition">{formatNum(row.devCondition)}</td>
                )}
                {show.devConditionSq && (
                  <td className="col-condition">{formatNum(row.devConditionSq, 0)}</td>
                )}
                {show.subjectMean && <td>{formatNum(row.subjectMean)}</td>}
                {show.devSubject && (
                  <td className="col-subject">{formatNum(row.devSubject)}</td>
                )}
                {show.devSubjectSq && (
                  <td className="col-subject">{formatNum(row.devSubjectSq, 0)}</td>
                )}
                {show.residual && (
                  <td className="col-residual">{formatNum(row.residual)}</td>
                )}
                {show.residualSq && (
                  <td className="col-residual">{formatNum(row.residualSq, 0)}</td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="sum-row">
              <td colSpan={3}>
                <strong>Sum</strong>
              </td>
              {show.grandMean && <td></td>}
              {show.devTotal && <td className="col-total"></td>}
              {show.devTotalSq && (
                <td className={`col-total ss-value ${currentStep === 2 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>T</sub>={formatNum(calc.ssTotal, 0)}</strong>
                </td>
              )}
              {show.conditionMean && <td></td>}
              {show.devCondition && <td className="col-condition"></td>}
              {show.devConditionSq && (
                <td className={`col-condition ss-value ${currentStep === 3 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>A</sub>={formatNum(calc.ssConditions, 0)}</strong>
                </td>
              )}
              {show.subjectMean && <td></td>}
              {show.devSubject && <td className="col-subject"></td>}
              {show.devSubjectSq && (
                <td className={`col-subject ss-value ${currentStep === 4 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>S</sub>={formatNum(calc.ssSubjects, 0)}</strong>
                </td>
              )}
              {show.residual && <td className="col-residual"></td>}
              {show.residualSq && (
                <td className={`col-residual ss-value ${currentStep === 5 ? 'cell-highlight' : ''}`}>
                  <strong>SS<sub>A×S</sub>={formatNum(calc.ssResidual, 0)}</strong>
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Verification at final step */}
      {currentStep === 5 && (
        <div className="verification-box">
          <span className="check-icon">&#10003;</span>
          <div className="verification-content">
            <span className="verification-label">
              SS<sub>T</sub> = SS<sub>A</sub> + SS<sub>S</sub> + SS<sub>A×S</sub>
            </span>
            <span className="verification-equation">
              {formatNum(calc.ssTotal, 0)} = {formatNum(calc.ssConditions, 0)} +{' '}
              {formatNum(calc.ssSubjects, 0)} + {formatNum(calc.ssResidual, 0)}
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
