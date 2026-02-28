import { useMemo } from 'react';
import { generateMediationData, fitSimpleRegression, fitMultipleRegression2 } from '../../../utils/statistics';
import PathDiagram from '../../shared/PathDiagram';

/**
 * TheThreeRegressions (Section 2)
 *
 * Interactive section demonstrating the three OLS regressions that make up
 * simple mediation (PROCESS Model 4). Uses the autonomy-supportive leadership
 * example: X (binary) → M (empowerment) → Y (job satisfaction).
 *
 * Population parameters:
 *   a = 0.80, b = 0.55, c' = 0.25
 *   interceptM = 3.80, interceptY = 1.41
 *   sdM = 1.0, sdY = 0.9, n = 120
 *
 * A fixed sample is used to illustrate the algebraic identity c = c' + ab.
 */

// Population parameters
const POP_A = 0.80;
const POP_B = 0.55;
const POP_C_PRIME = 0.25;
const INTERCEPT_M = 3.80;
const INTERCEPT_Y = 1.41;
const SD_M = 1.0;
const SD_Y = 0.9;
const N = 120;

/** Format a p-value: if < .001, show "< .001"; otherwise 3 decimal places with no leading zero. */
function formatP(p: number): string {
  if (p < 0.001) return '< .001';
  const str = p.toFixed(3);
  // Remove leading zero: "0.032" → ".032"
  return str.startsWith('0') ? str.slice(1) : str;
}

export default function TheThreeRegressions() {
  // Generate data and fit all three regressions (fixed seed)
  const results = useMemo(() => {
    const data = generateMediationData(
      77, N, POP_A, POP_B, POP_C_PRIME,
      INTERCEPT_M, INTERCEPT_Y, SD_M, SD_Y
    );

    // Equation 1: Y = i1 + c * X  (total effect)
    const totalModel = fitSimpleRegression(data.y, data.x);

    // Equation 2: M = i2 + a * X  (a-path)
    const aPathModel = fitSimpleRegression(data.m, data.x);

    // Equation 3: Y = i3 + c' * X + b * M  (mediation model)
    // x1 = X, x2 = M → b1 = c', b2 = b
    const medModel = fitMultipleRegression2(data.y, data.x, data.m);

    const cHat = totalModel.slope;
    const aHat = aPathModel.slope;
    const cPrimeHat = medModel.b1;
    const bHat = medModel.b2;
    const indirectHat = aHat * bHat;

    return {
      totalModel,
      aPathModel,
      medModel,
      cHat,
      aHat,
      cPrimeHat,
      bHat,
      indirectHat,
    };
  }, []);

  const { totalModel, aPathModel, medModel, cHat, aHat, cPrimeHat, bHat, indirectHat } = results;

  return (
    <div className="section-intro">
      <h2>The Three Regressions</h2>

      <p className="intro-text">
        Simple mediation requires fitting three ordinary least-squares regression
        equations. Each equation isolates a different piece of the mediation model.
        Using our leadership training example (X = autonomy-supportive vs. standard,
        M = empowerment, Y = job satisfaction), here are the three equations and
        what each one estimates:
      </p>

      {/* ---- The three equations ---- */}
      <div className="formula-box">
        <div className="formula" style={{ marginBottom: 'var(--spacing-sm)' }}>
          <span className="formula-main">
            Eq 1: &nbsp; Y = <em>i</em><sub>1</sub> + <em>c</em> &middot; X
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>
            total effect
          </span>
        </div>
        <div className="formula" style={{ marginBottom: 'var(--spacing-sm)' }}>
          <span className="formula-main">
            Eq 2: &nbsp; M = <em>i</em><sub>2</sub> + <em>a</em> &middot; X
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>
            <em>a</em> path
          </span>
        </div>
        <div className="formula" style={{ marginBottom: 0 }}>
          <span className="formula-main">
            Eq 3: &nbsp; Y = <em>i</em><sub>3</sub> + <em>c'</em> &middot; X + <em>b</em> &middot; M
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>
            direct + <em>b</em> path
          </span>
        </div>
      </div>

      <p className="intro-text">
        Equation 1 regresses Y on X alone and yields the <strong>total
        effect</strong> <em>c</em> — the overall difference in job satisfaction
        between the two leadership conditions. Equation 2 regresses M on X and
        yields the <em>a</em> path — how much autonomy-supportive leadership raises
        empowerment. Equation 3 regresses Y on both X and M simultaneously, yielding
        the <strong>direct effect</strong> <em>c'</em> (the effect of leadership
        style on satisfaction after controlling for empowerment) and
        the <em>b</em> path (the effect of empowerment on satisfaction, controlling
        for leadership condition).
      </p>

      <p className="intro-text">
        The table below shows the results of fitting all three equations to a single
        simulated sample of <em>n</em> = {N} employees (60 per condition). The
        population parameters used to generate these data
        are <em>a</em> = {POP_A.toFixed(2)}, <em>b</em> = {POP_B.toFixed(2)},
        and <em>c'</em> = {POP_C_PRIME.toFixed(2)}, giving a true total
        effect of <em>c</em> = {(POP_C_PRIME + POP_A * POP_B).toFixed(2)} and a
        true indirect effect of <em>ab</em> = {(POP_A * POP_B).toFixed(2)}.
      </p>

      {/* ---- Coefficient table ---- */}
      <div className="viz-container">
        <h4>Regression Coefficients</h4>
        <table className="coeff-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Model</th>
              <th style={{ textAlign: 'left' }}>Predictor</th>
              <th>Coefficient</th>
              <th>SE</th>
              <th><em>t</em></th>
              <th><em>p</em></th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: Total effect model — c */}
            <tr className="highlight-row">
              <td style={{ textAlign: 'left' }}>Total effect (Eq 1)</td>
              <td style={{ textAlign: 'left' }}>
                X{' '}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  (<em>c</em>)
                </span>
              </td>
              <td>{cHat.toFixed(3)}</td>
              <td>{totalModel.seSlope.toFixed(3)}</td>
              <td>{totalModel.t.toFixed(2)}</td>
              <td>{formatP(totalModel.p)}</td>
            </tr>

            {/* Row 2: a-path model — a */}
            <tr>
              <td style={{ textAlign: 'left' }}><em>a</em>-path (Eq 2)</td>
              <td style={{ textAlign: 'left' }}>
                X{' '}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  (<em>a</em>)
                </span>
              </td>
              <td>{aHat.toFixed(3)}</td>
              <td>{aPathModel.seSlope.toFixed(3)}</td>
              <td>{aPathModel.t.toFixed(2)}</td>
              <td>{formatP(aPathModel.p)}</td>
            </tr>

            {/* Row 3: Mediation model — c' */}
            <tr>
              <td style={{ textAlign: 'left' }}>Mediation model (Eq 3)</td>
              <td style={{ textAlign: 'left' }}>
                X{' '}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  (<em>c'</em>)
                </span>
              </td>
              <td>{cPrimeHat.toFixed(3)}</td>
              <td>{medModel.seB1.toFixed(3)}</td>
              <td>{medModel.t1.toFixed(2)}</td>
              <td>{formatP(medModel.p1)}</td>
            </tr>

            {/* Row 4: Mediation model — b */}
            <tr className="highlight-row">
              <td style={{ textAlign: 'left' }}>Mediation model (Eq 3)</td>
              <td style={{ textAlign: 'left' }}>
                M{' '}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  (<em>b</em>)
                </span>
              </td>
              <td>{bHat.toFixed(3)}</td>
              <td>{medModel.seB2.toFixed(3)}</td>
              <td>{medModel.t2.toFixed(2)}</td>
              <td>{formatP(medModel.p2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ---- Path diagram with fitted coefficients ---- */}
      <p className="intro-text">
        The path diagram below displays the estimated coefficients from this sample.
        The <em>a</em> path and <em>b</em> path together form the indirect route from
        X to Y through M. The <em>c'</em> path is the remaining direct route.
      </p>

      <div className="viz-container">
        <h4>Estimated Path Coefficients</h4>
        <div className="path-diagram-container">
          <PathDiagram
            xLabel="X"
            mLabel="M"
            yLabel="Y"
            xDesc="Leadership Style"
            mDesc="Empowerment"
            yDesc="Job Satisfaction"
            aLabel={`a = ${aHat.toFixed(2)}`}
            bLabel={`b = ${bHat.toFixed(2)}`}
            cPrimeLabel={`c' = ${cPrimeHat.toFixed(2)}`}
          />
        </div>
      </div>

      {/* ---- Decomposition with actual numbers ---- */}
      <h3>The Algebraic Decomposition</h3>

      <p className="intro-text">
        The total effect <em>c</em> from Equation 1 must equal the sum of the direct
        effect <em>c'</em> and the indirect effect <em>a</em> &times; <em>b</em>.
        Here is that identity with the values from our sample:
      </p>

      <div className="formula-box">
        <div className="formula" style={{ marginBottom: 'var(--spacing-sm)' }}>
          <span className="formula-main">
            <em>c</em> = <em>c'</em> + <em>a</em> &times; <em>b</em>
          </span>
        </div>
        <div className="formula">
          <span className="formula-main">
            {cHat.toFixed(3)} = {cPrimeHat.toFixed(3)} + ({aHat.toFixed(3)} &times; {bHat.toFixed(3)}) = {cPrimeHat.toFixed(3)} + {indirectHat.toFixed(3)}
          </span>
        </div>
        <div style={{ marginTop: 'var(--spacing-md)', textAlign: 'center' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
            <em>c</em> = {cHat.toFixed(3)} &nbsp;&nbsp; <em>ab</em> = {indirectHat.toFixed(3)} &nbsp;&nbsp; <em>c'</em> = {cPrimeHat.toFixed(3)}
          </span>
        </div>
      </div>

      <p className="intro-text">
        This decomposition will always hold exactly — it is not a statistical test
        or an approximation. Much like a variance decomposition in ANOVA, the total
        effect will always equal the sum of the direct and indirect effects. This is
        a mathematical consequence of how OLS regression partitions variance in a
        single-mediator model. What remains uncertain is whether the indirect effect
        is large enough to be distinguishable from zero. That question requires an
        inferential test, which we turn to next.
      </p>
    </div>
  );
}
