import { useMemo } from 'react';
import { mixedANOVA, type MixedDesignData } from '../../../utils/statistics';

// Fixed example data: crossing interaction with small main effects
// Emotional drops ~2 points, Rational rises ~1.8 points
// Results in: small main effects of A and B, strong A×B interaction
const STUDY_DATA: MixedDesignData[] = [
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

interface InteractionPlotProps {
  cellMeans: Record<string, Record<string, number>>;
  groups: string[];
  times: string[];
  title: string;
}

function InteractionPlot({ cellMeans, groups, times, title }: InteractionPlotProps) {
  // SVG dimensions
  const width = 500;
  const height = 300;
  const margin = { top: 30, right: 100, bottom: 50, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Get all values to determine scale
  const allValues = groups.flatMap((g) => times.map((t) => cellMeans[g][t]));
  const minVal = Math.min(...allValues) - 0.5;
  const maxVal = Math.max(...allValues) + 0.5;

  // Scale functions
  const xScale = (i: number) => margin.left + (i * plotWidth) / (times.length - 1);
  const yScale = (val: number) =>
    margin.top + plotHeight - ((val - minVal) / (maxVal - minVal)) * plotHeight;

  // Colors for groups
  const colors = {
    Emotional: '#6366f1',
    Rational: '#f59e0b',
  };

  return (
    <div className="interaction-plot">
      <svg viewBox={`0 0 ${width} ${height}`}>
        {/* Title */}
        <text x={width / 2} y={15} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--text-primary)">
          {title}
        </text>

        {/* Y-axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + plotHeight}
          stroke="var(--border)"
          strokeWidth="1"
        />
        {/* Y-axis label */}
        <text
          x={15}
          y={margin.top + plotHeight / 2}
          textAnchor="middle"
          fontSize="12"
          fill="var(--text-secondary)"
          transform={`rotate(-90, 15, ${margin.top + plotHeight / 2})`}
        >
          Purchase Intention
        </text>
        {/* Y-axis ticks */}
        {[minVal, (minVal + maxVal) / 2, maxVal].map((val, i) => (
          <g key={i}>
            <line
              x1={margin.left - 5}
              y1={yScale(val)}
              x2={margin.left}
              y2={yScale(val)}
              stroke="var(--border)"
            />
            <text
              x={margin.left - 10}
              y={yScale(val) + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--text-secondary)"
            >
              {val.toFixed(1)}
            </text>
          </g>
        ))}

        {/* X-axis */}
        <line
          x1={margin.left}
          y1={margin.top + plotHeight}
          x2={margin.left + plotWidth}
          y2={margin.top + plotHeight}
          stroke="var(--border)"
          strokeWidth="1"
        />
        {/* X-axis labels */}
        {times.map((t, i) => (
          <text
            key={t}
            x={xScale(i)}
            y={margin.top + plotHeight + 25}
            textAnchor="middle"
            fontSize="12"
            fill="var(--text-secondary)"
          >
            {t}
          </text>
        ))}
        {/* X-axis title */}
        <text
          x={margin.left + plotWidth / 2}
          y={height - 10}
          textAnchor="middle"
          fontSize="12"
          fill="var(--text-secondary)"
        >
          Time Point
        </text>

        {/* Lines and points for each group */}
        {groups.map((group) => (
          <g key={group}>
            {/* Line connecting time points */}
            <line
              x1={xScale(0)}
              y1={yScale(cellMeans[group][times[0]])}
              x2={xScale(1)}
              y2={yScale(cellMeans[group][times[1]])}
              stroke={colors[group as keyof typeof colors]}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Points at each time */}
            {times.map((t, i) => (
              <circle
                key={t}
                cx={xScale(i)}
                cy={yScale(cellMeans[group][t])}
                r="8"
                fill={colors[group as keyof typeof colors]}
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </g>
        ))}

        {/* Legend */}
        {groups.map((group, i) => (
          <g key={group} transform={`translate(${width - margin.right + 15}, ${margin.top + 20 + i * 25})`}>
            <line
              x1="0"
              y1="0"
              x2="20"
              y2="0"
              stroke={colors[group as keyof typeof colors]}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="10" cy="0" r="5" fill={colors[group as keyof typeof colors]} />
            <text x="28" y="4" fontSize="11" fill="var(--text-secondary)">
              {group}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function InteractionEffects() {
  const anovaResult = useMemo(() => mixedANOVA(STUDY_DATA), []);

  const groups = ['Emotional', 'Rational'];
  const times = ['Immediate', 'Delayed'];

  const formatP = (p: number) => (p < 0.002 ? '< .001' : p.toFixed(3));

  return (
    <div className="section-intro">
      <h2>Interpreting the A×B Interaction</h2>

      <p className="intro-text">
        The interaction is often the most interesting finding in a mixed design. It tells
        us whether the within-subjects effect (Time) differs depending on the between-subjects
        factor (Ad Appeal). In our example: <strong>Does the effect of time depend on which
        ad type participants saw?</strong>
      </p>

      <h3>Visualizing the Interaction</h3>

      <p className="intro-text">
        An interaction plot shows cell means with one factor on the x-axis and separate lines
        for each level of the other factor. <strong>Non-parallel lines indicate an interaction.</strong>
      </p>

      <div className="viz-container">
        <InteractionPlot
          cellMeans={anovaResult.cellMeans}
          groups={groups}
          times={times}
          title="Crossing Lines = Interaction"
        />

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-xl)', marginTop: 'var(--spacing-md)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Interaction F</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: anovaResult.p_AB < 0.05 ? '#10b981' : 'var(--text-secondary)' }}>
              {anovaResult.F_AB.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>p-value</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: anovaResult.p_AB < 0.05 ? '#10b981' : 'var(--text-secondary)' }}>
              {formatP(anovaResult.p_AB)}
            </div>
          </div>
        </div>
      </div>

      <h3>What the Interaction Means</h3>

      <p className="intro-text">
        In our data, the lines cross symmetrically—a textbook <em>disordinal interaction</em>.
        This tells us:
      </p>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>
          <strong>Emotional appeals:</strong> Start high (M = {anovaResult.cellMeans['Emotional']['Immediate'].toFixed(1)})
          but drop substantially after a week (M = {anovaResult.cellMeans['Emotional']['Delayed'].toFixed(1)}).
          The emotional impact fades quickly.
        </li>
        <li>
          <strong>Rational appeals:</strong> Start lower (M = {anovaResult.cellMeans['Rational']['Immediate'].toFixed(1)})
          but <em>increase</em> after a week (M = {anovaResult.cellMeans['Rational']['Delayed'].toFixed(1)}).
          The logical arguments strengthen as people reflect on them.
        </li>
      </ul>

      <p className="intro-text">
        This interaction is statistically significant (F = {anovaResult.F_AB.toFixed(2)},
        p {formatP(anovaResult.p_AB)}). The effect of time completely <em>reverses</em> depending on ad type.</p>

      <h3>Simple Effects</h3>

      <p className="intro-text">
        When there's a significant interaction, it's often more informative to examine
        <em> simple effects</em> rather than main effects. Simple effects ask: "What is the
        effect of one factor at a specific level of the other factor?"
      </p>

      <div className="viz-container">
        <h4>Simple Effects Analysis</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Comparison</th>
              <th>Effect</th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left' }}>Time effect for Emotional</td>
              <td style={{ color: '#ef4444', fontWeight: 600 }}>
                −{(anovaResult.cellMeans['Emotional']['Immediate'] - anovaResult.cellMeans['Emotional']['Delayed']).toFixed(1)} points
              </td>
              <td style={{ textAlign: 'left', fontSize: '0.875rem' }}>Substantial decrease over time</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>Time effect for Rational</td>
              <td style={{ color: '#10b981', fontWeight: 600 }}>
                +{(anovaResult.cellMeans['Rational']['Delayed'] - anovaResult.cellMeans['Rational']['Immediate']).toFixed(1)} points
              </td>
              <td style={{ textAlign: 'left', fontSize: '0.875rem' }}>Slight increase over time</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>Ad type effect at Immediate</td>
              <td style={{ color: '#6366f1', fontWeight: 600 }}>
                +{(anovaResult.cellMeans['Emotional']['Immediate'] - anovaResult.cellMeans['Rational']['Immediate']).toFixed(1)} points
              </td>
              <td style={{ textAlign: 'left', fontSize: '0.875rem' }}>Emotional wins immediately</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>Ad type effect at Delayed</td>
              <td style={{ color: '#f59e0b', fontWeight: 600 }}>
                −{(anovaResult.cellMeans['Rational']['Delayed'] - anovaResult.cellMeans['Emotional']['Delayed']).toFixed(1)} points
              </td>
              <td style={{ textAlign: 'left', fontSize: '0.875rem' }}>Rational wins after delay</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="key-insight">
        <h4>Practical Implications</h4>
        <p>
          Our significant interaction has real-world implications for advertisers: if you want
          immediate action (flash sale, limited-time offer), emotional appeals work better. But
          if you want lasting brand preference, rational appeals may be more effective—their
          impact actually grows over time as customers reflect on the logical benefits.
        </p>
      </div>
    </div>
  );
}
