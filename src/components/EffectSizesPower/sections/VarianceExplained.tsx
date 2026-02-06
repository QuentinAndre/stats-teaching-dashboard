import { useState, useMemo } from 'react';
import { etaSquared, omegaSquared } from '../../../utils/statistics';

export default function VarianceExplained() {
  const [meanA, setMeanA] = useState(45);
  const [meanB, setMeanB] = useState(50);
  const [meanC, setMeanC] = useState(55);
  const [withinSD, setWithinSD] = useState(12);
  const [sampleSize, setSampleSize] = useState(15);

  // Compute ANOVA from deterministic expected values
  // For balanced designs with equal variances, expected SS values are:
  // - SS_A = n * Σ(μ_j - μ..)² (between-group variance)
  // - SS_S/A = (n-1) * k * σ²_within (within-group variance)
  // - SS_T = SS_A + SS_S/A
  const anovaResults = useMemo(() => {
    const k = 3; // number of groups
    const n = sampleSize;
    const grandMean = (meanA + meanB + meanC) / 3;

    // Expected SS_Between (population value)
    // SS_A = n * Σ(μ_j - μ_T)²
    const ssBetween = n * (
      Math.pow(meanA - grandMean, 2) +
      Math.pow(meanB - grandMean, 2) +
      Math.pow(meanC - grandMean, 2)
    );

    // Expected SS_Within (population value)
    // E[SS_S/A] = (n-1) * k * σ²
    const ssWithin = (n - 1) * k * Math.pow(withinSD, 2);

    // Total SS
    const ssTotal = ssBetween + ssWithin;

    // Degrees of freedom
    const dfBetween = k - 1;
    const dfWithin = k * (n - 1);

    // Mean squares
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;

    // F-statistic and related values
    const fStatistic = msWithin > 0 ? msBetween / msWithin : 0;

    // Effect sizes
    const eta2 = etaSquared(ssBetween, ssTotal);
    const omega2 = omegaSquared(ssBetween, dfBetween, msWithin, ssTotal);

    return {
      ssBetween,
      ssWithin,
      ssTotal,
      dfBetween,
      dfWithin,
      msBetween,
      msWithin,
      fStatistic,
      eta2,
      omega2,
      grandMean,
    };
  }, [meanA, meanB, meanC, withinSD, sampleSize]);

  // Calculate percentages for pie chart
  const betweenPercent = (anovaResults.ssBetween / anovaResults.ssTotal) * 100;

  // Pie chart arc calculation
  const radius = 80;
  const centerX = 100;
  const centerY = 100;

  const getArcPath = (startPercent: number, endPercent: number) => {
    const startAngle = (startPercent / 100) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (endPercent / 100) * 2 * Math.PI - Math.PI / 2;
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    const largeArc = endPercent - startPercent > 50 ? 1 : 0;
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="section-intro">
      <h2>Variance Explained: η² and ω²</h2>

      <p className="intro-text">
        In ANOVA contexts, we often want to know what proportion of the total variability in our
        data can be attributed to the experimental manipulation. Two common measures are
        <strong> eta-squared (η²)</strong> and <strong>omega-squared (ω²)</strong>.
      </p>

      <div className="formula-box">
        <h3>Eta-Squared (η²)</h3>
        <div className="formula">
          <span className="formula-main">η² = SS<sub>A</sub> / SS<sub>T</sub></span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">SS<sub>A</sub></span>
            <span className="explanation">Sum of squares for the factor (between-group variance)</span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>T</sub></span>
            <span className="explanation">Total sum of squares (all variance in the data)</span>
          </div>
        </div>
        <p className="intro-text" style={{ marginTop: 'var(--spacing-md)', fontSize: '0.9rem' }}>
          η² is simple to calculate but <strong>biased upward</strong>—it overestimates the population
          effect size, especially with small samples.
        </p>
      </div>

      <div className="formula-box">
        <h3>Omega-Squared (ω²)</h3>
        <div className="formula">
          <span className="formula-main">ω² = (SS<sub>A</sub> − df<sub>A</sub> × MS<sub>S/A</sub>) / (SS<sub>T</sub> + MS<sub>S/A</sub>)</span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">df<sub>A</sub></span>
            <span className="explanation">Degrees of freedom for the factor (number of groups − 1)</span>
          </div>
          <div className="formula-part">
            <span className="symbol">MS<sub>S/A</sub></span>
            <span className="explanation">Mean square error (within-group variance estimate)</span>
          </div>
        </div>
        <p className="intro-text" style={{ marginTop: 'var(--spacing-md)', fontSize: '0.9rem' }}>
          ω² provides a <strong>less biased</strong> estimate of the population effect size. It's
          generally preferred for reporting, though η² remains common in the literature.
        </p>
      </div>

      <h3>Interactive Visualization</h3>

      <p className="intro-text">
        Adjust the group means and within-group variability to see how the proportion of variance
        explained changes. The values shown are the <em>expected</em> (population) values for these
        parameters—what you would obtain on average with these true group means and within-group
        variability.
      </p>

      <div className="viz-container">
        <h4>Three-Group ANOVA: Variance Decomposition</h4>

        <div className="controls-row">
          <div className="control-group">
            <label>Group A Mean</label>
            <input
              type="range"
              min="30"
              max="70"
              value={meanA}
              onChange={(e) => setMeanA(Number(e.target.value))}
              className="slider-group-a"
            />
            <span className="control-value" style={{ color: '#4361ee' }}>{meanA}</span>
          </div>
          <div className="control-group">
            <label>Group B Mean</label>
            <input
              type="range"
              min="30"
              max="70"
              value={meanB}
              onChange={(e) => setMeanB(Number(e.target.value))}
              className="slider-group-b"
            />
            <span className="control-value" style={{ color: '#f4a261' }}>{meanB}</span>
          </div>
          <div className="control-group">
            <label>Group C Mean</label>
            <input
              type="range"
              min="30"
              max="70"
              value={meanC}
              onChange={(e) => setMeanC(Number(e.target.value))}
              className="slider-group-c"
            />
            <span className="control-value" style={{ color: '#e63946' }}>{meanC}</span>
          </div>
        </div>

        <div className="controls-row">
          <div className="control-group">
            <label>Within-Group SD (σ)</label>
            <input
              type="range"
              min="5"
              max="25"
              value={withinSD}
              onChange={(e) => setWithinSD(Number(e.target.value))}
            />
            <span className="control-value">{withinSD}</span>
          </div>
          <div className="control-group">
            <label>Sample Size per Group</label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
            />
            <span className="control-value">n = {sampleSize}</span>
          </div>
        </div>

        {/* Variance pie chart */}
        <div className="pie-chart-container">
          <svg viewBox="0 0 200 200" className="pie-chart">
            {/* Between-group slice (effect) */}
            <path
              d={getArcPath(0, betweenPercent)}
              fill="#8b5cf6"
              stroke="white"
              strokeWidth="2"
            />
            {/* Within-group slice (error) */}
            <path
              d={getArcPath(betweenPercent, 100)}
              fill="#94a3b8"
              stroke="white"
              strokeWidth="2"
            />
            {/* Center text */}
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fill="var(--text-primary)"
            >
              SS_T
            </text>
            <text
              x={centerX}
              y={centerY + 12}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text-secondary)"
            >
              {anovaResults.ssTotal.toFixed(0)}
            </text>
          </svg>
        </div>

        <div className="variance-legend">
          <div className="legend-item">
            <div className="legend-color effect" />
            <span>Between Groups (SS<sub style={{ fontSize: '0.7em' }}>A</sub> = {anovaResults.ssBetween.toFixed(0)})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color error" />
            <span>Within Groups (SS<sub style={{ fontSize: '0.7em' }}>S/A</sub> = {anovaResults.ssWithin.toFixed(0)})</span>
          </div>
        </div>

        {/* Effect size comparison */}
        <div className="comparison-box">
          <div className="comparison-card">
            <h5>Eta-Squared (η²)</h5>
            <div className="value biased">{(anovaResults.eta2 * 100).toFixed(1)}%</div>
            <div className="note">Biased estimate</div>
          </div>
          <div className="comparison-card">
            <h5>Omega-Squared (ω²)</h5>
            <div className="value">{(anovaResults.omega2 * 100).toFixed(1)}%</div>
            <div className="note">Less biased estimate</div>
          </div>
        </div>

        <div className="results-row">
          <div className="result-card">
            <div className="result-label">Grand Mean</div>
            <div className="result-value">{anovaResults.grandMean.toFixed(1)}</div>
          </div>
          <div className="result-card">
            <div className="result-label">MS<sub style={{ fontSize: '0.7em' }}>A</sub></div>
            <div className="result-value">{anovaResults.msBetween.toFixed(1)}</div>
          </div>
          <div className="result-card">
            <div className="result-label">MS<sub style={{ fontSize: '0.7em' }}>S/A</sub></div>
            <div className="result-value">{anovaResults.msWithin.toFixed(1)}</div>
          </div>
          <div className="result-card">
            <div className="result-label">F-Statistic</div>
            <div className="result-value highlight">{anovaResults.fStatistic.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <h3>Why ω² Is Preferred</h3>

      <p className="intro-text">
        The difference between η² and ω² becomes more pronounced with smaller samples. η² is a
        descriptive statistic that describes the variance partition in a particular sample, while
        ω² estimates the population parameter (the proportion of variance that would be explained
        if we could measure everyone).
      </p>

      <p className="intro-text">
        Notice in the visualization above that η² is always larger than ω². This is because η²
        attributes all between-group sum of squares to the treatment effect, while ω² recognizes
        that some of this apparent effect is due to sampling error. The correction becomes less
        important as sample size increases.
      </p>

      <div className="key-insight">
        <h4>Interpreting Variance Explained</h4>
        <p>
          The proportion of variance explained should be interpreted in context, not compared to
          arbitrary benchmarks. A manipulation that explains 5% of variance in an important health
          outcome might have substantial practical significance. Conversely, explaining 20% of
          variance in a trivial outcome may not be meaningful. The question is always: what does
          this effect size mean for the phenomenon being studied?
        </p>
      </div>

      <h3>The Bias in η²</h3>

      <p className="intro-text">
        To understand why η² is biased, consider what happens when there's no true effect
        (all population means are equal). Even then, sample means will differ due to sampling
        error, producing a non-zero SS<sub>A</sub>. η² doesn't account for this, so it always
        overestimates the true effect. ω² subtracts the expected contribution of sampling error
        (df<sub>A</sub> × MS<sub>S/A</sub>), providing a more accurate population estimate.
      </p>
    </div>
  );
}
