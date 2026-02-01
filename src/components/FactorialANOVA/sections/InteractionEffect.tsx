import { useState, useMemo } from 'react';

export default function InteractionEffect() {
  const [showNoInteraction, setShowNoInteraction] = useState(false);

  // Cell means - with interaction (original data)
  const withInteraction = useMemo(() => ({
    highStrong: 7,
    highWeak: 3,
    lowStrong: 5,
    lowWeak: 5,
  }), []);

  // Cell means - without interaction (parallel lines)
  const withoutInteraction = useMemo(() => ({
    highStrong: 7,
    highWeak: 5,
    lowStrong: 5,
    lowWeak: 3,
  }), []);

  const cellMeans = showNoInteraction ? withoutInteraction : withInteraction;

  // SVG dimensions
  const width = 500;
  const height = 300;
  const margin = { top: 40, right: 120, bottom: 60, left: 70 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Scale for y-axis (attitude scores)
  const yMin = 0;
  const yMax = 8;
  const yScale = (y: number) => plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;

  // X positions for the two levels of Factor B
  const xStrong = plotWidth * 0.25;
  const xWeak = plotWidth * 0.75;

  return (
    <div className="section-intro">
      <h2>The Interaction Effect</h2>

      <p className="intro-text">
        An <strong>interaction</strong> occurs when the effect of one factor depends on the
        level of another factor. In our example: does the effect of argument quality depend
        on whether involvement is high or low?
      </p>

      <div className="key-insight">
        <h4>The Key Question</h4>
        <p>
          Is the difference between strong and weak arguments the <em>same</em> under high
          and low involvement? If yes, there's no interaction. If the difference changes,
          we have an interaction.
        </p>
      </div>

      <h3>Visualizing Interactions: The Line Plot</h3>

      <p className="intro-text">
        The classic way to visualize a 2×2 interaction is with a line plot. Each line represents
        one level of Factor A (involvement), and we plot the means across levels of Factor B
        (argument quality).
      </p>

      <div className="viz-container">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
          <button
            className={`toggle-button ${!showNoInteraction ? 'active' : ''}`}
            onClick={() => setShowNoInteraction(false)}
          >
            With Interaction
          </button>
          <button
            className={`toggle-button ${showNoInteraction ? 'active' : ''}`}
            onClick={() => setShowNoInteraction(true)}
          >
            No Interaction
          </button>
        </div>

        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Y-axis */}
            <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="var(--border)" strokeWidth={1} />

            {/* Y-axis ticks */}
            {[0, 2, 4, 6, 8].map((tick) => (
              <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                <line x1={-5} y1={0} x2={plotWidth} y2={0} stroke="var(--border)" strokeWidth={1} opacity={0.3} />
                <line x1={-5} y1={0} x2={0} y2={0} stroke="var(--border)" />
                <text x={-10} y={4} textAnchor="end" fontSize={11} fill="var(--text-secondary)">
                  {tick}
                </text>
              </g>
            ))}

            {/* Y-axis label */}
            <text
              transform={`translate(-50, ${plotHeight / 2}) rotate(-90)`}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-secondary)"
            >
              Attitude Score
            </text>

            {/* X-axis */}
            <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="var(--border)" strokeWidth={1} />

            {/* X-axis labels */}
            <text x={xStrong} y={plotHeight + 25} textAnchor="middle" fontSize={12} fill="var(--text-primary)">
              Strong Arguments
            </text>
            <text x={xWeak} y={plotHeight + 25} textAnchor="middle" fontSize={12} fill="var(--text-primary)">
              Weak Arguments
            </text>
            <text x={plotWidth / 2} y={plotHeight + 45} textAnchor="middle" fontSize={12} fill="var(--text-secondary)">
              Argument Quality
            </text>

            {/* High Involvement line */}
            <line
              x1={xStrong}
              y1={yScale(cellMeans.highStrong)}
              x2={xWeak}
              y2={yScale(cellMeans.highWeak)}
              stroke="#4361ee"
              strokeWidth={3}
            />
            <circle cx={xStrong} cy={yScale(cellMeans.highStrong)} r={8} fill="#4361ee" />
            <circle cx={xWeak} cy={yScale(cellMeans.highWeak)} r={8} fill="#4361ee" />

            {/* Low Involvement line */}
            <line
              x1={xStrong}
              y1={yScale(cellMeans.lowStrong)}
              x2={xWeak}
              y2={yScale(cellMeans.lowWeak)}
              stroke="#f4a261"
              strokeWidth={3}
            />
            <circle cx={xStrong} cy={yScale(cellMeans.lowStrong)} r={8} fill="#f4a261" />
            <circle cx={xWeak} cy={yScale(cellMeans.lowWeak)} r={8} fill="#f4a261" />

            {/* Data point labels */}
            <text x={xStrong - 15} y={yScale(cellMeans.highStrong) + 4} textAnchor="end" fontSize={12} fontWeight={600} fill="#4361ee">
              {cellMeans.highStrong.toFixed(1)}
            </text>
            <text x={xWeak + 15} y={yScale(cellMeans.highWeak) + 4} textAnchor="start" fontSize={12} fontWeight={600} fill="#4361ee">
              {cellMeans.highWeak.toFixed(1)}
            </text>
            <text x={xStrong - 15} y={yScale(cellMeans.lowStrong) + 4} textAnchor="end" fontSize={12} fontWeight={600} fill="#f4a261">
              {cellMeans.lowStrong.toFixed(1)}
            </text>
            <text x={xWeak + 15} y={yScale(cellMeans.lowWeak) + 4} textAnchor="start" fontSize={12} fontWeight={600} fill="#f4a261">
              {cellMeans.lowWeak.toFixed(1)}
            </text>

            {/* Legend */}
            <g transform={`translate(${plotWidth + 15}, 20)`}>
              <line x1={0} y1={0} x2={25} y2={0} stroke="#4361ee" strokeWidth={3} />
              <circle cx={12.5} cy={0} r={6} fill="#4361ee" />
              <text x={32} y={4} fontSize={11} fill="var(--text-primary)">High Involvement</text>

              <line x1={0} y1={25} x2={25} y2={25} stroke="#f4a261" strokeWidth={3} />
              <circle cx={12.5} cy={25} r={6} fill="#f4a261" />
              <text x={32} y={29} fontSize={11} fill="var(--text-primary)">Low Involvement</text>
            </g>
          </g>
        </svg>

        <div className="interaction-explanation" style={{
          background: showNoInteraction ? 'var(--bg-secondary)' : 'rgba(139, 92, 246, 0.1)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--border-radius-md)',
          marginTop: 'var(--spacing-md)',
          border: showNoInteraction ? '1px solid var(--border)' : '2px solid #8b5cf6'
        }}>
          {showNoInteraction ? (
            <>
              <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--text-primary)' }}>
                No Interaction: Parallel Lines
              </h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                When there's no interaction, the lines are <strong>parallel</strong>. The effect
                of argument quality is the same (2 points) regardless of involvement level.
                Both factors have independent, additive effects.
              </p>
            </>
          ) : (
            <>
              <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: '#8b5cf6' }}>
                Interaction Present: Non-Parallel Lines
              </h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                The lines are <strong>not parallel</strong>. Under high involvement, argument
                quality has a <strong>4-point effect</strong> (7 − 3 = 4). Under low involvement,
                argument quality has <strong>no effect</strong> (5 − 5 = 0). The effect of one
                factor depends on the level of the other.
              </p>
            </>
          )}
        </div>
      </div>

      <h3>Interpreting the Interaction</h3>

      <p className="intro-text">
        The Petty et al. study demonstrates a classic finding from the Elaboration Likelihood Model:
      </p>

      <div className="interpretation-cards">
        <div className="interpretation-card">
          <h4>High Involvement</h4>
          <p>
            When the product is personally relevant, people engage in <strong>central processing</strong>.
            They carefully evaluate the arguments, so argument quality matters a lot.
          </p>
        </div>
        <div className="interpretation-card">
          <h4>Low Involvement</h4>
          <p>
            When the product isn't personally relevant, people use <strong>peripheral processing</strong>.
            They don't scrutinize arguments carefully, so argument quality doesn't affect attitudes.
          </p>
        </div>
      </div>

      <div className="formula-box">
        <h3>The Interaction Effect</h3>
        <div className="formula">
          <span className="formula-main">(AB)<sub>jk</sub> = Ȳ<sub>AB</sub> − Ȳ<sub>A.</sub> − Ȳ<sub>.B</sub> + Ȳ<sub>T</sub></span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">Ȳ<sub>AB</sub></span>
            <span className="explanation">
              Cell mean for Factor A level j and Factor B level k
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">Ȳ<sub>A.</sub>, Ȳ<sub>.B</sub></span>
            <span className="explanation">
              Marginal means (row and column averages)
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">Ȳ<sub>T</sub></span>
            <span className="explanation">
              Grand mean (overall average)
            </span>
          </div>
        </div>
      </div>

      <p className="intro-text">
        The interaction captures what's left over after accounting for the main effects.
        It tells us: how much does each cell deviate from what we'd predict based on
        the row and column effects alone?
      </p>
    </div>
  );
}
