import { useMemo } from 'react';

export default function MainEffects() {
  // Cell means
  const cellMeans = useMemo(() => ({
    highStrong: 7,
    highWeak: 3,
    lowStrong: 5,
    lowWeak: 5,
  }), []);

  // Marginal means
  const marginalMeans = useMemo(() => ({
    highInvolvement: (cellMeans.highStrong + cellMeans.highWeak) / 2,
    lowInvolvement: (cellMeans.lowStrong + cellMeans.lowWeak) / 2,
    strongArgs: (cellMeans.highStrong + cellMeans.lowStrong) / 2,
    weakArgs: (cellMeans.highWeak + cellMeans.lowWeak) / 2,
    grand: (cellMeans.highStrong + cellMeans.highWeak + cellMeans.lowStrong + cellMeans.lowWeak) / 4,
  }), [cellMeans]);

  // SVG dimensions
  const width = 500;
  const height = 200;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Scale for y-axis (attitude scores)
  const yMin = 0;
  const yMax = 8;
  const yScale = (y: number) => plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;

  return (
    <div className="section-intro">
      <h2>Main Effects</h2>

      <p className="intro-text">
        A <strong>main effect</strong> is the overall effect of one factor, averaged across
        all levels of the other factor. We calculate main effects using the <em>marginal means</em>—
        the row and column averages from our cell means table.
      </p>

      <h3>Main Effect of Involvement (Factor A)</h3>

      <p className="intro-text">
        To find the main effect of involvement, we compare the marginal means for high vs. low
        involvement, ignoring argument quality:
      </p>

      <div className="viz-container">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Y-axis */}
            <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="var(--border)" strokeWidth={1} />

            {/* Y-axis ticks */}
            {[0, 2, 4, 6, 8].map((tick) => (
              <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                <line x1={-5} y1={0} x2={0} y2={0} stroke="var(--border)" />
                <text x={-10} y={4} textAnchor="end" fontSize={11} fill="var(--text-secondary)">
                  {tick}
                </text>
              </g>
            ))}

            {/* Y-axis label */}
            <text
              transform={`translate(-45, ${plotHeight / 2}) rotate(-90)`}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-secondary)"
            >
              Attitude Score
            </text>

            {/* Bars for marginal means */}
            <rect
              x={plotWidth * 0.15}
              y={yScale(marginalMeans.highInvolvement)}
              width={80}
              height={plotHeight - yScale(marginalMeans.highInvolvement)}
              fill="#4361ee"
              opacity={0.8}
            />
            <rect
              x={plotWidth * 0.55}
              y={yScale(marginalMeans.lowInvolvement)}
              width={80}
              height={plotHeight - yScale(marginalMeans.lowInvolvement)}
              fill="#4361ee"
              opacity={0.4}
            />

            {/* Bar labels */}
            <text
              x={plotWidth * 0.15 + 40}
              y={yScale(marginalMeans.highInvolvement) - 8}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fill="#4361ee"
            >
              {marginalMeans.highInvolvement.toFixed(1)}
            </text>
            <text
              x={plotWidth * 0.55 + 40}
              y={yScale(marginalMeans.lowInvolvement) - 8}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fill="#4361ee"
            >
              {marginalMeans.lowInvolvement.toFixed(1)}
            </text>

            {/* X-axis labels */}
            <text
              x={plotWidth * 0.15 + 40}
              y={plotHeight + 25}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              High Involvement
            </text>
            <text
              x={plotWidth * 0.55 + 40}
              y={plotHeight + 25}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Low Involvement
            </text>

            {/* Grand mean line */}
            <line
              x1={0}
              y1={yScale(marginalMeans.grand)}
              x2={plotWidth}
              y2={yScale(marginalMeans.grand)}
              stroke="var(--text-secondary)"
              strokeWidth={1.5}
              strokeDasharray="6,4"
            />
            <text
              x={plotWidth}
              y={yScale(marginalMeans.grand) - 5}
              textAnchor="end"
              fontSize={10}
              fill="var(--text-secondary)"
            >
              Grand Mean = {marginalMeans.grand.toFixed(1)}
            </text>
          </g>
        </svg>
      </div>

      <p className="intro-text">
        The main effect of involvement is <strong>{marginalMeans.highInvolvement.toFixed(1)} − {marginalMeans.lowInvolvement.toFixed(1)} = {(marginalMeans.highInvolvement - marginalMeans.lowInvolvement).toFixed(1)}</strong> points.
        On average, high involvement leads to no difference in attitudes compared to low involvement
        (when we average across argument quality).
      </p>

      <h3>Main Effect of Argument Quality (Factor B)</h3>

      <p className="intro-text">
        Similarly, we compare strong vs. weak arguments, averaging across involvement levels:
      </p>

      <div className="viz-container">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Y-axis */}
            <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="var(--border)" strokeWidth={1} />

            {/* Y-axis ticks */}
            {[0, 2, 4, 6, 8].map((tick) => (
              <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                <line x1={-5} y1={0} x2={0} y2={0} stroke="var(--border)" />
                <text x={-10} y={4} textAnchor="end" fontSize={11} fill="var(--text-secondary)">
                  {tick}
                </text>
              </g>
            ))}

            {/* Y-axis label */}
            <text
              transform={`translate(-45, ${plotHeight / 2}) rotate(-90)`}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-secondary)"
            >
              Attitude Score
            </text>

            {/* Bars for marginal means */}
            <rect
              x={plotWidth * 0.15}
              y={yScale(marginalMeans.strongArgs)}
              width={80}
              height={plotHeight - yScale(marginalMeans.strongArgs)}
              fill="#f4a261"
              opacity={0.8}
            />
            <rect
              x={plotWidth * 0.55}
              y={yScale(marginalMeans.weakArgs)}
              width={80}
              height={plotHeight - yScale(marginalMeans.weakArgs)}
              fill="#f4a261"
              opacity={0.4}
            />

            {/* Bar labels */}
            <text
              x={plotWidth * 0.15 + 40}
              y={yScale(marginalMeans.strongArgs) - 8}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fill="#f4a261"
            >
              {marginalMeans.strongArgs.toFixed(1)}
            </text>
            <text
              x={plotWidth * 0.55 + 40}
              y={yScale(marginalMeans.weakArgs) - 8}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fill="#f4a261"
            >
              {marginalMeans.weakArgs.toFixed(1)}
            </text>

            {/* X-axis labels */}
            <text
              x={plotWidth * 0.15 + 40}
              y={plotHeight + 25}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Strong Arguments
            </text>
            <text
              x={plotWidth * 0.55 + 40}
              y={plotHeight + 25}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Weak Arguments
            </text>

            {/* Grand mean line */}
            <line
              x1={0}
              y1={yScale(marginalMeans.grand)}
              x2={plotWidth}
              y2={yScale(marginalMeans.grand)}
              stroke="var(--text-secondary)"
              strokeWidth={1.5}
              strokeDasharray="6,4"
            />
            <text
              x={plotWidth}
              y={yScale(marginalMeans.grand) - 5}
              textAnchor="end"
              fontSize={10}
              fill="var(--text-secondary)"
            >
              Grand Mean = {marginalMeans.grand.toFixed(1)}
            </text>
          </g>
        </svg>
      </div>

      <p className="intro-text">
        The main effect of argument quality is <strong>{marginalMeans.strongArgs.toFixed(1)} − {marginalMeans.weakArgs.toFixed(1)} = {(marginalMeans.strongArgs - marginalMeans.weakArgs).toFixed(1)}</strong> points.
        On average, strong arguments produce higher attitudes than weak arguments.
      </p>

      <div className="key-insight">
        <h4>The Limitation of Main Effects</h4>
        <p>
          Main effects tell us about <em>average</em> differences, but they can be misleading.
          The small main effect of involvement (0.0) hides an important pattern: involvement
          matters a lot—but only when arguments are strong. To see this, we need to examine
          the <strong>interaction</strong>.
        </p>
      </div>

      <div className="formula-box">
        <h3>Calculating Main Effects</h3>
        <div className="formula">
          <span className="formula-main">Main Effect = Marginal Mean − Grand Mean</span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">A<sub>j</sub></span>
            <span className="explanation">
              Effect of Factor A level j: Ȳ<sub>A.</sub> − Ȳ<sub>T</sub>
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">B<sub>k</sub></span>
            <span className="explanation">
              Effect of Factor B level k: Ȳ<sub>.B</sub> − Ȳ<sub>T</sub>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
