import { useState, useMemo, useCallback } from 'react';
import {
  generateWithinSubjectsData,
  repeatedMeasuresANOVA,
  oneWayANOVA,
  mean,
} from '../../../utils/statistics';

interface SimulationResult {
  withinF: number;
  withinP: number;
  betweenF: number;
  betweenP: number;
}

export default function PowerComparison() {
  // Simulation parameters
  const [effectSize, setEffectSize] = useState(30); // Condition mean difference
  const [subjectSD, setSubjectSD] = useState(60); // Individual differences magnitude
  const [sampleSize, setSampleSize] = useState(12); // n subjects

  // Current sample
  const [currentSample, setCurrentSample] = useState<SimulationResult | null>(null);
  const [currentData, setCurrentData] = useState<number[][] | null>(null);


  // Condition means (3 conditions with specified effect size)
  const conditionMeans = useMemo(
    () => [500, 500 + effectSize / 2, 500 + effectSize],
    [effectSize]
  );

  // Generate a single sample and analyze both ways
  const generateSample = useCallback(() => {
    const errorSD = 15; // Within-subject noise (kept constant)
    const data = generateWithinSubjectsData(
      sampleSize,
      conditionMeans,
      subjectSD,
      errorSD
    );

    // Within-subjects analysis
    const withinResult = repeatedMeasuresANOVA(data);

    // Between-subjects analysis: treat as independent groups
    const groups = [
      data.map((subject) => subject[0]), // Condition 1
      data.map((subject) => subject[1]), // Condition 2
      data.map((subject) => subject[2]), // Condition 3
    ];
    const betweenResult = oneWayANOVA(groups);

    setCurrentData(data);
    setCurrentSample({
      withinF: withinResult.F,
      withinP: withinResult.p,
      betweenF: betweenResult.fStatistic,
      betweenP: betweenResult.pValue,
    });
  }, [sampleSize, conditionMeans, subjectSD]);


  // Calculate condition means for the current data
  const dataConditionMeans = useMemo(() => {
    if (!currentData) return null;
    return [
      mean(currentData.map((s) => s[0])),
      mean(currentData.map((s) => s[1])),
      mean(currentData.map((s) => s[2])),
    ];
  }, [currentData]);

  return (
    <div className="section-intro">
      <h2>The Power Advantage</h2>

      <p className="intro-text">
        Now for the payoff: why go through all this trouble? The answer is
        <strong> statistical power</strong>. Within-subjects designs can detect
        smaller effects with fewer participants because they remove individual
        differences from the error term.
      </p>

      <p className="intro-text">
        Let's see this in action. We'll generate data from a repeated measures design
        where each participant provides one observation in each of three conditions
        (e.g., response times under low, medium, and high cognitive load). The same
        data can be analyzed either as a within-subjects design (respecting which
        observations came from the same person) or as a between-subjects design
        (ignoring the pairing structure entirely).
      </p>

      <h3>Interactive Simulation</h3>

      <div className="power-controls">
        <div className="power-control">
          <label>True Effect Size (ms)</label>
          <input
            type="range"
            min="10"
            max="80"
            value={effectSize}
            onChange={(e) => setEffectSize(Number(e.target.value))}
          />
          <div className="value-display">{effectSize}ms</div>
        </div>

        <div className="power-control">
          <label>Subject Variability (SD)</label>
          <input
            type="range"
            min="20"
            max="120"
            value={subjectSD}
            onChange={(e) => setSubjectSD(Number(e.target.value))}
          />
          <div className="value-display">{subjectSD}ms</div>
        </div>

        <div className="power-control">
          <label>Sample Size (n subjects)</label>
          <input
            type="range"
            min="6"
            max="30"
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
          />
          <div className="value-display">{sampleSize}</div>
        </div>
      </div>

      <div className="power-buttons">
        <button className="generate-button" onClick={generateSample}>
          Generate New Sample
        </button>
      </div>

      {currentSample && (
        <div className="viz-container">
          <h4>Current Sample Results</h4>

          {dataConditionMeans && (
            <div
              style={{
                textAlign: 'center',
                marginBottom: 'var(--spacing-md)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}
            >
              Sample condition means: {dataConditionMeans[0].toFixed(1)}ms →{' '}
              {dataConditionMeans[1].toFixed(1)}ms →{' '}
              {dataConditionMeans[2].toFixed(1)}ms
            </div>
          )}

          <div className="power-results">
            <div className="power-result-card between">
              <h5>Between-Subjects Analysis</h5>
              <div className="f-value">F = {currentSample.betweenF.toFixed(2)}</div>
              <div
                className={`p-value ${currentSample.betweenP < 0.05 ? 'significant' : ''}`}
              >
                p ={' '}
                {currentSample.betweenP < 0.001
                  ? '< .001'
                  : currentSample.betweenP.toFixed(3)}
                {currentSample.betweenP < 0.05 ? ' *' : ''}
              </div>
            </div>

            <div className="power-result-card within">
              <h5>Within-Subjects Analysis</h5>
              <div className="f-value">F = {currentSample.withinF.toFixed(2)}</div>
              <div
                className={`p-value ${currentSample.withinP < 0.05 ? 'significant' : ''}`}
              >
                p ={' '}
                {currentSample.withinP < 0.001
                  ? '< .001'
                  : currentSample.withinP.toFixed(3)}
                {currentSample.withinP < 0.05 ? ' *' : ''}
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: 'var(--spacing-md)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}
          >
            Same data, same effect—but the within-subjects F is typically{' '}
            <strong>larger</strong> because the error term is smaller.
          </div>
        </div>
      )}

      <h3>Try It Yourself</h3>

      <p className="intro-text">
        Experiment with the sliders above to see how different factors affect the power
        advantage:
      </p>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>
          <strong>Higher subject variability</strong> → greater power advantage for
          within-subjects (more variance to remove)
        </li>
        <li>
          <strong>Smaller effect size</strong> → within-subjects design becomes
          essential for detection
        </li>
        <li>
          <strong>Smaller sample size</strong> → within-subjects power holds up better
          than between-subjects
        </li>
      </ul>

      <div className="key-insight">
        <h4>When Does It Matter Most?</h4>
        <p>
          The power advantage of within-subjects designs is greatest when individual
          differences are large relative to the treatment effect. If people vary a lot
          (high subject SD) and the effect is subtle (small effect size), a between-subjects
          design might have only 20-30% power while a within-subjects design could have
          80%+. This is why repeated measures are so valuable in psychology, where
          individual differences are often substantial.
        </p>
      </div>
    </div>
  );
}
