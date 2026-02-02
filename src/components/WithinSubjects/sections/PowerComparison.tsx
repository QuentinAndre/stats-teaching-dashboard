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

  // Simulation results
  const [isSimulating, setIsSimulating] = useState(false);
  const [powerResults, setPowerResults] = useState<{
    withinPower: number;
    betweenPower: number;
    nSims: number;
  } | null>(null);

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

    setPowerResults(null);
  }, [sampleSize, conditionMeans, subjectSD]);

  // Run power simulation
  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    setPowerResults(null);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const nSims = 200;
      const errorSD = 15;
      let withinSig = 0;
      let betweenSig = 0;

      for (let i = 0; i < nSims; i++) {
        const data = generateWithinSubjectsData(
          sampleSize,
          conditionMeans,
          subjectSD,
          errorSD
        );

        // Within-subjects analysis
        const withinResult = repeatedMeasuresANOVA(data);
        if (withinResult.p < 0.05) withinSig++;

        // Between-subjects analysis
        const groups = [
          data.map((subject) => subject[0]),
          data.map((subject) => subject[1]),
          data.map((subject) => subject[2]),
        ];
        const betweenResult = oneWayANOVA(groups);
        if (betweenResult.pValue < 0.05) betweenSig++;
      }

      setPowerResults({
        withinPower: withinSig / nSims,
        betweenPower: betweenSig / nSims,
        nSims,
      });
      setIsSimulating(false);
    }, 50);
  }, [sampleSize, conditionMeans, subjectSD]);

  // SVG dimensions for power bar chart
  const barWidth = 400;
  const barHeight = 180;
  const barMargin = { top: 30, right: 30, bottom: 40, left: 30 };

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
        Let's see this in action. We'll generate data that could be analyzed either
        as a within-subjects design (respecting the pairing) or as a between-subjects
        design (ignoring who each observation came from).
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
        <button
          className="simulate-button"
          onClick={runSimulation}
          disabled={isSimulating}
        >
          {isSimulating ? 'Simulating...' : 'Run 200 Simulations'}
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

      {powerResults && (
        <div className="viz-container">
          <h4>Power Comparison ({powerResults.nSims} Simulations)</h4>

          <svg
            width={barWidth}
            height={barHeight}
            viewBox={`0 0 ${barWidth} ${barHeight}`}
            style={{ display: 'block', margin: '0 auto' }}
          >
            {/* Y-axis */}
            <line
              x1={barMargin.left}
              y1={barMargin.top}
              x2={barMargin.left}
              y2={barHeight - barMargin.bottom}
              stroke="var(--border)"
              strokeWidth={1}
            />

            {/* Y-axis label */}
            <text
              x={10}
              y={(barHeight - barMargin.top - barMargin.bottom) / 2 + barMargin.top}
              textAnchor="middle"
              fontSize={11}
              fill="var(--text-secondary)"
              transform={`rotate(-90, 10, ${(barHeight - barMargin.top - barMargin.bottom) / 2 + barMargin.top})`}
            >
              Power (% significant)
            </text>

            {/* Y-axis ticks */}
            {[0, 25, 50, 75, 100].map((tick) => {
              const y =
                barMargin.top +
                (barHeight - barMargin.top - barMargin.bottom) * (1 - tick / 100);
              return (
                <g key={tick}>
                  <line
                    x1={barMargin.left - 5}
                    y1={y}
                    x2={barMargin.left}
                    y2={y}
                    stroke="var(--border)"
                  />
                  <text
                    x={barMargin.left - 8}
                    y={y}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fontSize={10}
                    fill="var(--text-secondary)"
                  >
                    {tick}%
                  </text>
                  <line
                    x1={barMargin.left}
                    y1={y}
                    x2={barWidth - barMargin.right}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray="3,3"
                    opacity={0.3}
                  />
                </g>
              );
            })}

            {/* Bars */}
            {[
              {
                label: 'Between',
                value: powerResults.betweenPower,
                x: barMargin.left + 80,
                fill: '#6b7280',
              },
              {
                label: 'Within',
                value: powerResults.withinPower,
                x: barMargin.left + 220,
                fill: '#10b981',
              },
            ].map((bar) => {
              const barH =
                (bar.value / 1) *
                (barHeight - barMargin.top - barMargin.bottom);
              return (
                <g key={bar.label}>
                  <rect
                    x={bar.x - 40}
                    y={barMargin.top + (barHeight - barMargin.top - barMargin.bottom) - barH}
                    width={80}
                    height={barH}
                    fill={bar.fill}
                    rx={4}
                  />
                  <text
                    x={bar.x}
                    y={
                      barMargin.top +
                      (barHeight - barMargin.top - barMargin.bottom) -
                      barH -
                      8
                    }
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={600}
                    fill={bar.fill}
                  >
                    {(bar.value * 100).toFixed(0)}%
                  </text>
                  <text
                    x={bar.x}
                    y={barHeight - 15}
                    textAnchor="middle"
                    fontSize={12}
                    fill="var(--text-primary)"
                    fontWeight={500}
                  >
                    {bar.label}
                  </text>
                </g>
              );
            })}

            {/* Alpha line at 5% */}
            <line
              x1={barMargin.left}
              y1={
                barMargin.top +
                (barHeight - barMargin.top - barMargin.bottom) * (1 - 0.05)
              }
              x2={barWidth - barMargin.right}
              y2={
                barMargin.top +
                (barHeight - barMargin.top - barMargin.bottom) * (1 - 0.05)
              }
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5,3"
            />
            <text
              x={barWidth - barMargin.right + 5}
              y={
                barMargin.top +
                (barHeight - barMargin.top - barMargin.bottom) * (1 - 0.05)
              }
              alignmentBaseline="middle"
              fontSize={10}
              fill="#ef4444"
            >
              α = .05
            </text>
          </svg>

          <div
            style={{
              textAlign: 'center',
              marginTop: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '0.875rem',
            }}
          >
            <strong>Power advantage:</strong>{' '}
            {(
              ((powerResults.withinPower - powerResults.betweenPower) /
                Math.max(powerResults.betweenPower, 0.05)) *
              100
            ).toFixed(0)}
            % more likely to find a significant effect with within-subjects design
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
