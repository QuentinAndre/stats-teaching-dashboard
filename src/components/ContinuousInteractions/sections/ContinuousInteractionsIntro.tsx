import { useMemo } from 'react';

// Simple deterministic pseudo-random number generator (mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ScatterPoint {
  x: number; // NFC (continuous moderator)
  y: number; // Product attitude (outcome)
  z: number; // Condition: 0 = weak arguments, 1 = strong arguments
}

export default function ContinuousInteractionsIntro() {
  // --- Generate scatter data from the NFC × Argument Quality model ---
  // Y = b0 + b1*Z + b2*X + b3*Z*X + noise
  // b0 = 5.80, b1 = -2.40, b2 = -0.22, b3 = 1.18
  // Z is coded 0/1 (weak vs. strong arguments)
  // X is NFC (item-mean, 1–5 scale)
  const scatterData = useMemo<ScatterPoint[]>(() => {
    const rng = mulberry32(42);
    const points: ScatterPoint[] = [];
    const n = 50;
    const b0 = 5.80;
    const b1 = -2.40;
    const b2 = -0.22;
    const b3 = 1.18;

    for (let i = 0; i < n; i++) {
      const z = i < n / 2 ? 0 : 1;
      // NFC normally distributed: M = 3.20, SD = 0.70, truncated to [1, 5]
      let x: number;
      do {
        x = 3.20 + 0.70 * (Math.sqrt(-2 * Math.log(rng() + 0.001)) * Math.cos(2 * Math.PI * rng()));
      } while (x < 1 || x > 5);
      // Gaussian noise
      const u1 = rng();
      const u2 = rng();
      const noise = Math.sqrt(-2 * Math.log(u1 + 0.001)) * Math.cos(2 * Math.PI * u2) * 0.80;
      const y = b0 + b1 * z + b2 * x + b3 * z * x + noise;
      points.push({ x, y: Math.max(1, Math.min(9, y)), z });
    }
    return points;
  }, []);

  // --- Left panel: 2-group categorical interaction plot ---
  // Means derived from the regression model at two discrete NFC values
  // "Low NFC": item-mean = 2.0
  // "High NFC": item-mean = 4.0
  const categoricalMeans = useMemo(() => {
    const b0 = 5.80;
    const b1 = -2.40;
    const b2 = -0.22;
    const b3 = 1.18;

    // Y at each (Z, X) combination
    // Z=0 (weak arguments), Low NFC (2.0)
    const z0_low = b0 + b1 * 0 + b2 * 2.0 + b3 * 0 * 2.0;
    // Z=0, High NFC (4.0)
    const z0_high = b0 + b1 * 0 + b2 * 4.0 + b3 * 0 * 4.0;
    // Z=1 (strong arguments), Low NFC (2.0)
    const z1_low = b0 + b1 * 1 + b2 * 2.0 + b3 * 1 * 2.0;
    // Z=1, High NFC (4.0)
    const z1_high = b0 + b1 * 1 + b2 * 4.0 + b3 * 1 * 4.0;

    return { z0_low, z0_high, z1_low, z1_high };
  }, []);

  // --- SVG dimensions ---
  const catWidth = 380;
  const catHeight = 280;
  const catMargin = { top: 30, right: 100, bottom: 55, left: 65 };
  const catPlotW = catWidth - catMargin.left - catMargin.right;
  const catPlotH = catHeight - catMargin.top - catMargin.bottom;

  const scatWidth = 380;
  const scatHeight = 280;
  const scatMargin = { top: 30, right: 20, bottom: 55, left: 65 };
  const scatPlotW = scatWidth - scatMargin.left - scatMargin.right;
  const scatPlotH = scatHeight - scatMargin.top - scatMargin.bottom;

  // --- Categorical plot scales ---
  const catYMin = 1;
  const catYMax = 9;
  const catYScale = (v: number) =>
    catPlotH - ((v - catYMin) / (catYMax - catYMin)) * catPlotH;
  const catXLow = catPlotW * 0.3;
  const catXHigh = catPlotW * 0.7;

  // --- Scatter plot scales ---
  const scatXMin = 1;
  const scatXMax = 5;
  const scatYMin = 1;
  const scatYMax = 9;
  const scatXScale = (v: number) =>
    ((v - scatXMin) / (scatXMax - scatXMin)) * scatPlotW;
  const scatYScale = (v: number) =>
    scatPlotH - ((v - scatYMin) / (scatYMax - scatYMin)) * scatPlotH;

  // Regression lines for the scatter plot
  const regLinePoints = useMemo(() => {
    const b0 = 5.80;
    const b1 = -2.40;
    const b2 = -0.22;
    const b3 = 1.18;
    const xStart = 1.2;
    const xEnd = 4.8;

    // Z=0 line (weak arguments)
    const z0Start = b0 + b2 * xStart;
    const z0End = b0 + b2 * xEnd;
    // Z=1 line (strong arguments)
    const z1Start = b0 + b1 + (b2 + b3) * xStart;
    const z1End = b0 + b1 + (b2 + b3) * xEnd;

    return {
      z0: {
        x1: scatXScale(xStart),
        y1: scatYScale(z0Start),
        x2: scatXScale(xEnd),
        y2: scatYScale(z0End),
      },
      z1: {
        x1: scatXScale(xStart),
        y1: scatYScale(z1Start),
        x2: scatXScale(xEnd),
        y2: scatYScale(z1End),
      },
    };
  }, []);

  // Colors
  const colorStrong = '#4361ee'; // blue — strong arguments (Z=1)
  const colorWeak = '#f4a261'; // orange — weak arguments (Z=0)

  // Categorical plot y-axis ticks
  const catYTicks = [1, 3, 5, 7, 9];

  // Scatter y-axis ticks
  const scatYTicks = [1, 3, 5, 7, 9];

  // Scatter x-axis ticks
  const scatXTicks = [1, 2, 3, 4, 5];

  return (
    <div className="section-intro">
      <h2>Why Continuous Moderators?</h2>

      <p className="intro-text">
        In the Factorial ANOVA module, we saw how to test interactions between two
        categorical factors. The logic was straightforward: plot two lines (one per level
        of Factor A) across the levels of Factor B. If the lines are not parallel, there
        is an interaction — the effect of one factor depends on the level of the other.
        That approach works well when both factors have a small number of discrete levels.
      </p>

      <p className="intro-text">
        But what happens when one of those factors is <em>continuous</em> rather than
        categorical? Many variables we care about in psychology — personality traits,
        cognitive ability, motivation, attitudes — are measured on continuous scales. A
        researcher who wants to know whether the effect of an experimental manipulation
        depends on one of these variables faces a different kind of analytic problem.
      </p>

      <h3>The Argument Quality × Need for Cognition Scenario</h3>

      <p className="intro-text">
        Consider a study on persuasion, inspired by the Elaboration Likelihood Model
        (Petty &amp; Cacioppo, 1986). In this experiment, participants read an
        advertisement for a new product. The advertisement contains either{' '}
        <strong>weak arguments</strong> (e.g., vague claims, irrelevant details) or{' '}
        <strong>strong arguments</strong> (e.g., specific evidence, clear benefits).
        Participants then rate their attitude toward the product on a 1–9 scale.
      </p>

      <p className="intro-text">
        The key question is whether the effect of argument quality depends on the
        participant's <strong>Need for Cognition</strong> (NFC) — a stable individual
        difference reflecting how much a person enjoys effortful thinking (Cacioppo
        &amp; Petty, 1982). In the Factorial ANOVA module, we saw this studied with a
        median split: participants were classified as "low NFC" or "high NFC" and crossed
        with argument quality in a 2×2 design. But suppose instead we keep NFC as a
        continuous variable measured by the NCS-18 (scored as an item-level mean from 1
        to 5). Now we have:
      </p>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>
          <strong>Y</strong> (outcome): attitude toward the product (1–9)
        </li>
        <li>
          <strong>Z</strong> (manipulated factor): argument quality (0 = weak, 1 = strong)
        </li>
        <li>
          <strong>X</strong> (continuous moderator): Need for Cognition (1–5 item-mean)
        </li>
      </ul>

      <p className="intro-text">
        The interaction hypothesis is the same — the effect of argument quality on
        attitudes depends on how much the person engages in effortful thinking. But our
        analytic tools need to change. To see why, compare the two representations below.
      </p>

      <h3>Categorical vs. Continuous: A Side-by-Side Comparison</h3>

      <div className="dual-panel">
        {/* ============ LEFT PANEL: Categorical interaction plot ============ */}
        <div className="viz-container">
          <h4>Categorical Moderator (2 levels)</h4>
          <svg
            viewBox={`0 0 ${catWidth} ${catHeight}`}
            style={{ width: '100%', height: 'auto' }}
          >
            <g transform={`translate(${catMargin.left}, ${catMargin.top})`}>
              {/* Y-axis */}
              <line
                x1={0} y1={0} x2={0} y2={catPlotH}
                stroke="var(--border)" strokeWidth={1}
              />
              {/* Y-axis ticks and grid */}
              {catYTicks.map((tick) => (
                <g key={tick} transform={`translate(0, ${catYScale(tick)})`}>
                  <line
                    x1={0} y1={0} x2={catPlotW} y2={0}
                    stroke="var(--border)" strokeWidth={1} opacity={0.25}
                  />
                  <line x1={-5} y1={0} x2={0} y2={0} stroke="var(--border)" />
                  <text
                    x={-10} y={4} textAnchor="end"
                    fontSize={11} fill="var(--text-secondary)"
                  >
                    {tick}
                  </text>
                </g>
              ))}
              {/* Y-axis label */}
              <text
                transform={`translate(-48, ${catPlotH / 2}) rotate(-90)`}
                textAnchor="middle" fontSize={11} fill="var(--text-secondary)"
              >
                Product Attitude (Y)
              </text>

              {/* X-axis */}
              <line
                x1={0} y1={catPlotH} x2={catPlotW} y2={catPlotH}
                stroke="var(--border)" strokeWidth={1}
              />
              {/* X-axis labels */}
              <text
                x={catXLow} y={catPlotH + 20}
                textAnchor="middle" fontSize={11} fill="var(--text-primary)"
              >
                Low NFC
              </text>
              <text
                x={catXHigh} y={catPlotH + 20}
                textAnchor="middle" fontSize={11} fill="var(--text-primary)"
              >
                High NFC
              </text>
              <text
                x={catPlotW / 2} y={catPlotH + 40}
                textAnchor="middle" fontSize={11} fill="var(--text-secondary)"
              >
                Need for Cognition
              </text>

              {/* Strong arguments line (Z=1) — blue */}
              <line
                x1={catXLow} y1={catYScale(categoricalMeans.z1_low)}
                x2={catXHigh} y2={catYScale(categoricalMeans.z1_high)}
                stroke={colorStrong} strokeWidth={2.5}
              />
              <circle
                cx={catXLow} cy={catYScale(categoricalMeans.z1_low)}
                r={6} fill={colorStrong}
              />
              <circle
                cx={catXHigh} cy={catYScale(categoricalMeans.z1_high)}
                r={6} fill={colorStrong}
              />
              {/* Mean labels for strong-argument line */}
              <text
                x={catXLow - 12} y={catYScale(categoricalMeans.z1_low) + 4}
                textAnchor="end" fontSize={11} fontWeight={600} fill={colorStrong}
              >
                {categoricalMeans.z1_low.toFixed(1)}
              </text>
              <text
                x={catXHigh + 12} y={catYScale(categoricalMeans.z1_high) + 4}
                textAnchor="start" fontSize={11} fontWeight={600} fill={colorStrong}
              >
                {categoricalMeans.z1_high.toFixed(1)}
              </text>

              {/* Weak arguments line (Z=0) — orange */}
              <line
                x1={catXLow} y1={catYScale(categoricalMeans.z0_low)}
                x2={catXHigh} y2={catYScale(categoricalMeans.z0_high)}
                stroke={colorWeak} strokeWidth={2.5}
              />
              <circle
                cx={catXLow} cy={catYScale(categoricalMeans.z0_low)}
                r={6} fill={colorWeak}
              />
              <circle
                cx={catXHigh} cy={catYScale(categoricalMeans.z0_high)}
                r={6} fill={colorWeak}
              />
              {/* Mean labels for weak-argument line */}
              <text
                x={catXLow - 12} y={catYScale(categoricalMeans.z0_low) + 4}
                textAnchor="end" fontSize={11} fontWeight={600} fill={colorWeak}
              >
                {categoricalMeans.z0_low.toFixed(1)}
              </text>
              <text
                x={catXHigh + 12} y={catYScale(categoricalMeans.z0_high) + 4}
                textAnchor="start" fontSize={11} fontWeight={600} fill={colorWeak}
              >
                {categoricalMeans.z0_high.toFixed(1)}
              </text>

              {/* Legend */}
              <g transform={`translate(8, 10)`}>
                <line x1={0} y1={0} x2={20} y2={0} stroke={colorStrong} strokeWidth={2.5} />
                <circle cx={10} cy={0} r={4} fill={colorStrong} />
                <text x={26} y={4} fontSize={10} fill="var(--text-primary)">
                  Strong args (Z = 1)
                </text>

                <line x1={0} y1={22} x2={20} y2={22} stroke={colorWeak} strokeWidth={2.5} />
                <circle cx={10} cy={22} r={4} fill={colorWeak} />
                <text x={26} y={26} fontSize={10} fill="var(--text-primary)">
                  Weak args (Z = 0)
                </text>
              </g>
            </g>
          </svg>
          <p style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            margin: 'var(--spacing-sm) 0 0 0',
            lineHeight: 1.5,
          }}>
            Two lines, two points each. The non-parallel pattern is easy to
            see: the gap between conditions grows as NFC increases.
          </p>
        </div>

        {/* ============ RIGHT PANEL: Scatterplot ============ */}
        <div className="viz-container">
          <h4>Continuous Moderator (NFC)</h4>
          <svg
            viewBox={`0 0 ${scatWidth} ${scatHeight}`}
            style={{ width: '100%', height: 'auto' }}
          >
            <g transform={`translate(${scatMargin.left}, ${scatMargin.top})`}>
              {/* Y-axis */}
              <line
                x1={0} y1={0} x2={0} y2={scatPlotH}
                stroke="var(--border)" strokeWidth={1}
              />
              {/* Y-axis ticks and grid */}
              {scatYTicks.map((tick) => (
                <g key={tick} transform={`translate(0, ${scatYScale(tick)})`}>
                  <line
                    x1={0} y1={0} x2={scatPlotW} y2={0}
                    stroke="var(--border)" strokeWidth={1} opacity={0.25}
                  />
                  <line x1={-5} y1={0} x2={0} y2={0} stroke="var(--border)" />
                  <text
                    x={-10} y={4} textAnchor="end"
                    fontSize={11} fill="var(--text-secondary)"
                  >
                    {tick}
                  </text>
                </g>
              ))}
              {/* Y-axis label */}
              <text
                transform={`translate(-48, ${scatPlotH / 2}) rotate(-90)`}
                textAnchor="middle" fontSize={11} fill="var(--text-secondary)"
              >
                Product Attitude (Y)
              </text>

              {/* X-axis */}
              <line
                x1={0} y1={scatPlotH} x2={scatPlotW} y2={scatPlotH}
                stroke="var(--border)" strokeWidth={1}
              />
              {/* X-axis ticks */}
              {scatXTicks.map((tick) => (
                <g key={tick} transform={`translate(${scatXScale(tick)}, ${scatPlotH})`}>
                  <line x1={0} y1={0} x2={0} y2={5} stroke="var(--border)" />
                  <text
                    x={0} y={18} textAnchor="middle"
                    fontSize={11} fill="var(--text-secondary)"
                  >
                    {tick}
                  </text>
                </g>
              ))}
              {/* X-axis label */}
              <text
                x={scatPlotW / 2} y={scatPlotH + 40}
                textAnchor="middle" fontSize={11} fill="var(--text-secondary)"
              >
                Need for Cognition (X)
              </text>

              {/* Scatter points — draw weak (Z=0) first, then strong (Z=1) */}
              {scatterData
                .filter((d) => d.z === 0)
                .map((d, i) => (
                  <circle
                    key={`z0-${i}`}
                    cx={scatXScale(d.x)}
                    cy={scatYScale(d.y)}
                    r={3.5}
                    fill={colorWeak}
                    opacity={0.7}
                  />
                ))}
              {scatterData
                .filter((d) => d.z === 1)
                .map((d, i) => (
                  <circle
                    key={`z1-${i}`}
                    cx={scatXScale(d.x)}
                    cy={scatYScale(d.y)}
                    r={3.5}
                    fill={colorStrong}
                    opacity={0.7}
                  />
                ))}

              {/* Regression lines */}
              <line
                x1={regLinePoints.z0.x1} y1={regLinePoints.z0.y1}
                x2={regLinePoints.z0.x2} y2={regLinePoints.z0.y2}
                stroke={colorWeak} strokeWidth={2} strokeDasharray="6,3"
              />
              <line
                x1={regLinePoints.z1.x1} y1={regLinePoints.z1.y1}
                x2={regLinePoints.z1.x2} y2={regLinePoints.z1.y2}
                stroke={colorStrong} strokeWidth={2} strokeDasharray="6,3"
              />

              {/* Inline legend */}
              <g transform={`translate(4, 4)`}>
                <circle cx={0} cy={0} r={4} fill={colorStrong} opacity={0.8} />
                <text x={8} y={4} fontSize={10} fill="var(--text-primary)">
                  Strong args (Z = 1)
                </text>
                <circle cx={0} cy={16} r={4} fill={colorWeak} opacity={0.8} />
                <text x={8} y={20} fontSize={10} fill="var(--text-primary)">
                  Weak args (Z = 0)
                </text>
              </g>
            </g>
          </svg>
          <p style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            margin: 'var(--spacing-sm) 0 0 0',
            lineHeight: 1.5,
          }}>
            Same underlying pattern — the diverging regression lines are
            clearly visible. But which NFC values yield a significant effect?
          </p>
        </div>
      </div>

      <h3>The Problem with "Just Compare Two Groups"</h3>

      <p className="intro-text">
        On the left, the categorical version makes the interaction obvious: two lines,
        two points each — you can immediately see whether they are parallel. On the
        right, the same interaction shows up as diverging regression lines. The visual
        pattern is still clear, but the statistical question changes. With a continuous
        moderator, there is no natural pair of levels to compare. Researchers
        occasionally "solve" this problem by conducting a median split — creating a
        "low NFC" group and a "high NFC" group based on whether participants fall above
        or below the sample median — and then running a standard 2&times;2 ANOVA. This is
        common practice, but it comes with serious costs: it discards information,
        reduces statistical power, and can produce misleading results.
      </p>

      <p className="intro-text">
        Instead, better tools exist. <strong>Spotlight analysis</strong> tests the
        effect of the manipulation at specific, researcher-chosen values of the
        moderator (e.g., the mean or &plusmn; 1 SD) and reports whether the effect is
        statistically significant at each value. <strong>Floodlight analysis</strong>{' '}
        goes further: it computes the marginal effect and its confidence interval across
        the full range of the moderator and identifies the Johnson-Neyman point — the
        exact moderator value at which the confidence interval crosses zero and the
        effect becomes (or ceases to be) statistically significant.
      </p>

      <h3>What This Module Covers</h3>

      <p className="intro-text">
        In the sections that follow, we will build up the full framework for analyzing
        interactions with continuous moderators:
      </p>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>
          The regression model that encodes the interaction as a product term
          (Z &times; X), and how to interpret it as <em>marginal effects</em> — the
          effect of Z at any chosen value of X
        </li>
        <li>
          <strong>Spotlight analysis</strong>: probing the interaction at specific
          moderator values (e.g., 1 SD below the mean, the mean, 1 SD above)
        </li>
        <li>
          <strong>Floodlight analysis</strong>: computing the marginal effect and its
          confidence interval across the full range of X to identify the Johnson-Neyman
          point — the moderator value at which the confidence interval crosses zero
        </li>
        <li>
          Why <em>centering</em> the moderator changes interpretation but not the overall
          model fit
        </li>
      </ul>
    </div>
  );
}
