import { useState, useMemo } from 'react';

export default function ANOVAIntro() {
  const [numGroups, setNumGroups] = useState(3);
  const alpha = 0.05;

  // Calculate number of pairwise comparisons and familywise error rate
  const stats = useMemo(() => {
    const k = numGroups;
    const numComparisons = (k * (k - 1)) / 2;
    const familywiseError = 1 - Math.pow(1 - alpha, numComparisons);
    return { numComparisons, familywiseError };
  }, [numGroups]);

  // SVG dimensions for circular node graph
  const width = 400;
  const height = 280;
  const centerX = width / 2;
  const centerY = height / 2 - 10;
  const radius = 90;
  const nodeRadius = 24;
  const colors = ['#4361ee', '#f4a261', '#e63946', '#2a9d8f', '#9b5de5', '#00b4d8'];

  // Generate group positions in a circle
  const groupVisuals = useMemo(() => {
    return Array.from({ length: numGroups }, (_, i) => {
      const angle = (2 * Math.PI * i) / numGroups - Math.PI / 2; // Start from top
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        color: colors[i % colors.length],
        label: String.fromCharCode(65 + i), // A, B, C, ...
      };
    });
  }, [numGroups, centerX, centerY, radius]);

  // Generate curved connection lines between all pairs
  const connectionLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; key: string; ctrlX: number; ctrlY: number }[] = [];
    for (let i = 0; i < groupVisuals.length; i++) {
      for (let j = i + 1; j < groupVisuals.length; j++) {
        const x1 = groupVisuals[i].x;
        const y1 = groupVisuals[i].y;
        const x2 = groupVisuals[j].x;
        const y2 = groupVisuals[j].y;

        // Control point curves toward center for aesthetic
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const curveFactor = 0.15 + (dist / (2 * radius)) * 0.1; // More curve for longer connections

        const ctrlX = midX + (centerX - midX) * curveFactor;
        const ctrlY = midY + (centerY - midY) * curveFactor;

        lines.push({ x1, y1, x2, y2, ctrlX, ctrlY, key: `${i}-${j}` });
      }
    }
    return lines;
  }, [groupVisuals, centerX, centerY, radius]);

  return (
    <div className="section-intro">
      <h2>From t-Tests to Variance Partitioning</h2>

      <p className="intro-text">
        In the previous module, we learned how the <strong>two-sample t-test</strong> compares
        the means of two groups. But what happens when we have <em>more than two groups</em>?
      </p>

      <h3>The Multiple Comparisons Problem</h3>

      <p className="intro-text">
        Imagine you're comparing the effectiveness of three different teaching methods (A, B, and C)
        on exam scores. Your first instinct might be to run three separate t-tests:
      </p>

      <div className="comparison-highlight">
        <div className="comparison-pair">A vs B</div>
        <div className="comparison-pair">A vs C</div>
        <div className="comparison-pair">B vs C</div>
      </div>

      <p className="intro-text">
        But there's a hidden problem: <strong>each test carries a 5% chance of a false positive</strong>.
        When you run multiple tests, these errors accumulate.
      </p>

      <div className="viz-container">
        <h4>How Error Rates Inflate with Multiple Comparisons</h4>

        <div className="controls-row">
          <div className="control-group">
            <label htmlFor="num-groups">Number of Groups</label>
            <input
              type="range"
              id="num-groups"
              min="2"
              max="6"
              value={numGroups}
              onChange={(e) => setNumGroups(parseInt(e.target.value))}
            />
            <span className="control-value">{numGroups} groups</span>
          </div>
        </div>

        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', margin: '0 auto' }}>
          {/* Curved connection lines between groups */}
          {connectionLines.map((line) => (
            <path
              key={line.key}
              d={`M ${line.x1} ${line.y1} Q ${line.ctrlX} ${line.ctrlY} ${line.x2} ${line.y2}`}
              stroke="#e63946"
              strokeWidth={2}
              fill="none"
              opacity={0.5}
            />
          ))}

          {/* Group nodes in circular arrangement */}
          {groupVisuals.map((group, i) => (
            <g key={i}>
              {/* Outer glow */}
              <circle
                cx={group.x}
                cy={group.y}
                r={nodeRadius + 4}
                fill={group.color}
                opacity={0.2}
              />
              {/* Node circle */}
              <circle
                cx={group.x}
                cy={group.y}
                r={nodeRadius}
                fill={group.color}
                stroke="white"
                strokeWidth={2}
              />
              {/* Label inside node */}
              <text
                x={group.x}
                y={group.y + 6}
                textAnchor="middle"
                fill="white"
                fontSize={16}
                fontWeight={700}
              >
                {group.label}
              </text>
            </g>
          ))}

          {/* Connection count in center */}
          <text
            x={centerX}
            y={centerY - 8}
            textAnchor="middle"
            fontSize={28}
            fontWeight={700}
            fill="#e63946"
          >
            {stats.numComparisons}
          </text>
          <text
            x={centerX}
            y={centerY + 14}
            textAnchor="middle"
            fontSize={11}
            fill="#6c757d"
          >
            comparisons
          </text>
        </svg>

        <div className="results-row" style={{ marginTop: 'var(--spacing-md)' }}>
          <div className="result-card">
            <div className="result-label">Pairwise Comparisons</div>
            <div className="result-value">{stats.numComparisons}</div>
          </div>
          <div className="result-card">
            <div className="result-label">Per-Test α</div>
            <div className="result-value">.05</div>
          </div>
          <div className="result-card">
            <div className="result-label">Familywise Error Rate</div>
            <div className="result-value significant">
              {(stats.familywiseError * 100).toFixed(1)}%
            </div>
          </div>
        </div>

      </div>

      <p className="intro-text">
        With just {numGroups} groups, you need {stats.numComparisons} separate comparisons.
        Even if no real differences exist, your chance of finding at least one
        "significant" result is{' '}
        <strong style={{ color: 'var(--accent)' }}>
          {(stats.familywiseError * 100).toFixed(1)}%
        </strong>
        —far higher than the 5% we intended.
      </p>

      <div className="formula-box">
        <h3>The Familywise Error Rate</h3>
        <div className="formula">
          <span className="formula-main">
            α<sub>FW</sub> = 1 − (1 − α)<sup>k</sup>
          </span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">α<sub>FW</sub></span>
            <span className="explanation">
              Probability of at least one false positive across all tests
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">α</span>
            <span className="explanation">
              Per-test significance level (typically 0.05)
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">k</span>
            <span className="explanation">
              Number of comparisons = n(n−1)/2 for n groups
            </span>
          </div>
        </div>
      </div>

      <h3>The Solution: Analysis of Variance</h3>

      <p className="intro-text">
        <strong>ANOVA</strong> (Analysis of Variance) solves this problem by providing
        a single test that asks: "Is there <em>any</em> difference among these groups?"
      </p>

      <p className="intro-text">
        But ANOVA does something even more clever than just controlling error rates.
        Instead of comparing means directly, it asks a fundamentally different question:
      </p>

      <div className="key-insight">
        <h4>The Key Question</h4>
        <p>
          <strong>Where does the variability in our data come from?</strong> ANOVA
          partitions the total variance into meaningful sources: variation
          <em> between groups</em> (the effect we're testing) and variation
          <em> within groups</em> (random error). If between-group variance is large
          relative to within-group variance, we have evidence that the groups differ.
        </p>
      </div>

      <p className="intro-text">
        This variance partitioning approach, championed by statisticians like Keppel and
        Wickens, provides deep insight into our data's structure. In the following sections,
        we'll build this intuition step by step.
      </p>
    </div>
  );
}
