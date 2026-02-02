import { useMemo } from 'react';
import { repeatedMeasuresANOVA } from '../../../utils/statistics';
import RMDecompositionTable from '../RMDecompositionTable';

// Fixed example data: 4 subjects × 3 conditions (Congruent, Neutral, Incongruent)
// MUST match the data in RMDecompositionTable.tsx
const FIXED_DATA = [
  [400, 440, 520], // S1
  [350, 410, 450], // S2
  [500, 540, 620], // S3
  [420, 490, 510], // S4
];

const SUBJECTS = ['S1', 'S2', 'S3', 'S4'];
const CONDITIONS = ['Congruent', 'Neutral', 'Incongruent'];

export default function ThreeCellDesign() {
  // Run RM-ANOVA
  const anova = useMemo(() => repeatedMeasuresANOVA(FIXED_DATA), []);

  const formatNum = (n: number, decimals: number = 2) => n.toFixed(decimals);

  // SVG dimensions for spaghetti plot
  const width = 500;
  const height = 280;
  const margin = { top: 30, right: 40, bottom: 50, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Scales
  const minRT = 300;
  const maxRT = 650;
  const yScale = (value: number) =>
    margin.top + plotHeight - ((value - minRT) / (maxRT - minRT)) * plotHeight;

  const xPositions = [
    margin.left + plotWidth * 0.2,
    margin.left + plotWidth * 0.5,
    margin.left + plotWidth * 0.8,
  ];

  return (
    <div className="section-intro">
      <h2>Repeated Measures ANOVA</h2>

      <p className="intro-text">
        With <strong>three or more conditions</strong>, we can't simply compute a single
        difference score. Instead, we need to explicitly partition the variance to
        remove subject effects. This is the domain of <em>repeated measures ANOVA</em>.
      </p>

      <h3>Three-Condition Stroop Task</h3>

      <p className="intro-text">
        Let's extend our Stroop example to include a <em>neutral</em> condition—where
        participants name the color of non-word stimuli (like "XXXX"). This gives us
        three conditions: Congruent, Neutral, and Incongruent.
      </p>

      <div className="stroop-example">
        <div className="stroop-condition congruent">
          <h5>Congruent</h5>
          <div className="stroop-word green">GREEN</div>
          <div className="response">Say "green"</div>
        </div>
        <div className="stroop-condition neutral">
          <h5>Neutral</h5>
          <div className="stroop-word gray">XXXX</div>
          <div className="response">Say "gray"</div>
        </div>
        <div className="stroop-condition incongruent">
          <h5>Incongruent</h5>
          <div className="stroop-word red">BLUE</div>
          <div className="response">Say "red"</div>
        </div>
      </div>

      <h3>The Data</h3>

      <div className="viz-container">
        <h4>Subject × Condition Data (Response Time in ms)</h4>

        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              {CONDITIONS.map((cond) => (
                <th key={cond}>{cond}</th>
              ))}
              <th style={{ background: 'rgba(244, 162, 97, 0.1)' }}>
                Subject Mean
              </th>
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map((subject, s) => (
              <tr key={subject}>
                <td style={{ color: '#f4a261', fontWeight: 600 }}>{subject}</td>
                {FIXED_DATA[s].map((value, c) => (
                  <td key={c}>{value}</td>
                ))}
                <td style={{ background: 'rgba(244, 162, 97, 0.1)', fontWeight: 500 }}>
                  {formatNum(anova.subjectMeans[s], 1)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <strong>Condition Mean</strong>
              </td>
              {anova.conditionMeans.map((cm, c) => (
                <td
                  key={c}
                  style={{ background: 'rgba(67, 97, 238, 0.1)', fontWeight: 600 }}
                >
                  {formatNum(cm, 1)}
                </td>
              ))}
              <td style={{ background: 'var(--bg-tertiary)', fontWeight: 700 }}>
                Ȳ<sub>T</sub> = {formatNum(anova.grandMean, 1)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <h4 style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
            Visualizing Individual Trajectories
          </h4>
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ display: 'block', margin: '0 auto' }}
          >
            {/* Y-axis */}
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={height - margin.bottom}
              stroke="var(--border)"
              strokeWidth={1}
            />

            {/* Y-axis ticks */}
            {[350, 400, 450, 500, 550, 600].map((tick) => (
              <g key={tick}>
                <line
                  x1={margin.left - 5}
                  y1={yScale(tick)}
                  x2={margin.left}
                  y2={yScale(tick)}
                  stroke="var(--border)"
                />
                <text
                  x={margin.left - 10}
                  y={yScale(tick)}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  fontSize={11}
                  fill="var(--text-secondary)"
                >
                  {tick}
                </text>
                <line
                  x1={margin.left}
                  y1={yScale(tick)}
                  x2={width - margin.right}
                  y2={yScale(tick)}
                  stroke="var(--border)"
                  strokeDasharray="3,3"
                  opacity={0.3}
                />
              </g>
            ))}

            {/* Y-axis label */}
            <text
              x={15}
              y={height / 2}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-secondary)"
              transform={`rotate(-90, 15, ${height / 2})`}
            >
              Response Time (ms)
            </text>

            {/* X-axis labels */}
            {CONDITIONS.map((cond, i) => (
              <text
                key={cond}
                x={xPositions[i]}
                y={height - 15}
                textAnchor="middle"
                fontSize={13}
                fill="var(--text-primary)"
                fontWeight={500}
              >
                {cond}
              </text>
            ))}

            {/* Subject lines (spaghetti) */}
            {FIXED_DATA.map((subjectData, s) => (
              <g key={SUBJECTS[s]}>
                {/* Lines connecting conditions */}
                <path
                  d={`M ${xPositions[0]} ${yScale(subjectData[0])}
                      L ${xPositions[1]} ${yScale(subjectData[1])}
                      L ${xPositions[2]} ${yScale(subjectData[2])}`}
                  fill="none"
                  stroke="#f4a261"
                  strokeWidth={2}
                  opacity={0.5}
                />
                {/* Points */}
                {subjectData.map((value, c) => (
                  <circle
                    key={c}
                    cx={xPositions[c]}
                    cy={yScale(value)}
                    r={5}
                    fill="#f4a261"
                    stroke="white"
                    strokeWidth={1.5}
                  />
                ))}
              </g>
            ))}

            {/* Condition means */}
            <path
              d={`M ${xPositions[0]} ${yScale(anova.conditionMeans[0])}
                  L ${xPositions[1]} ${yScale(anova.conditionMeans[1])}
                  L ${xPositions[2]} ${yScale(anova.conditionMeans[2])}`}
              fill="none"
              stroke="#4361ee"
              strokeWidth={3}
              strokeDasharray="6,4"
            />
            {anova.conditionMeans.map((cm, c) => (
              <circle
                key={c}
                cx={xPositions[c]}
                cy={yScale(cm)}
                r={8}
                fill="#4361ee"
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </svg>

          <div
            style={{
              textAlign: 'center',
              marginTop: 'var(--spacing-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
            }}
          >
            <span style={{ color: '#f4a261' }}>Orange lines</span> = individual
            subjects; <span style={{ color: '#4361ee' }}>Blue dashed</span> = condition
            means
          </div>
        </div>
      </div>

      <p className="intro-text">
        Notice how the lines generally slope upward from Congruent → Neutral → Incongruent,
        but not perfectly parallel—some subjects show larger effects than others.
        The spacing between subjects (vertical spread) represents individual differences.
        The variation in slopes represents the subject × condition interaction (residual).
      </p>

      <h3>The Variance Partition</h3>

      <div className="formula-box">
        <h3>Repeated Measures ANOVA Decomposition</h3>
        <div className="formula">
          <span className="formula-main">
            SS<sub>T</sub> = SS<sub>A</sub> + SS<sub>S</sub> + SS<sub>A×S</sub>
          </span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol condition">
              SS<sub>A</sub>
            </span>
            <span className="explanation">Between conditions (the effect we care about)</span>
          </div>
          <div className="formula-part">
            <span className="symbol subject">
              SS<sub>S</sub>
            </span>
            <span className="explanation">Between subjects (individual differences)</span>
          </div>
          <div className="formula-part">
            <span className="symbol residual">
              SS<sub>A×S</sub>
            </span>
            <span className="explanation">
              Residual (inconsistency in how subjects respond)
            </span>
          </div>
        </div>
      </div>

      <RMDecompositionTable />

      <h3>The ANOVA Summary Table</h3>

      <p className="intro-text">
        Now we can compute the F-ratio. The key difference from between-subjects ANOVA
        is that our error term is SS<sub>A×S</sub> (the subject × condition interaction),
        not SS<sub>S/A</sub>. This error term captures <em>inconsistency</em>—how
        much individual subjects deviate from the overall pattern.
      </p>

      <div className="viz-container">
        <h4>RM-ANOVA Summary</h4>
        <table className="anova-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>SS</th>
              <th>df</th>
              <th>MS</th>
              <th>F</th>
              <th>p</th>
            </tr>
          </thead>
          <tbody>
            <tr className="condition-row">
              <td style={{ textAlign: 'left' }}>Condition (A)</td>
              <td>{formatNum(anova.ssConditions, 1)}</td>
              <td>{anova.dfConditions}</td>
              <td>{formatNum(anova.msConditions, 2)}</td>
              <td>{formatNum(anova.F, 2)}</td>
              <td className={anova.p < 0.05 ? 'significant' : ''}>
                {anova.p < 0.001 ? '< .001' : formatNum(anova.p, 4)}
              </td>
            </tr>
            <tr className="subject-row">
              <td style={{ textAlign: 'left' }}>Subjects (S)</td>
              <td>{formatNum(anova.ssSubjects, 1)}</td>
              <td>{anova.dfSubjects}</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
            </tr>
            <tr className="residual-row">
              <td style={{ textAlign: 'left' }}>Residual (A×S)</td>
              <td>{formatNum(anova.ssResidual, 1)}</td>
              <td>{anova.dfResidual}</td>
              <td>{formatNum(anova.msResidual, 2)}</td>
              <td>—</td>
              <td>—</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>Total</strong>
              </td>
              <td>
                <strong>{formatNum(anova.ssTotal, 1)}</strong>
              </td>
              <td>
                <strong>{anova.dfConditions + anova.dfSubjects + anova.dfResidual}</strong>
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div style={{ marginTop: 'var(--spacing-md)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            F({anova.dfConditions}, {anova.dfResidual}) = {formatNum(anova.F, 2)}, p{' '}
            {anova.p < 0.001 ? '< .001' : `= ${formatNum(anova.p, 4)}`}
          </span>
        </div>
      </div>

      <div className="key-insight">
        <h4>The Small Error Term</h4>
        <p>
          Notice that SS<sub>S</sub> = {formatNum(anova.ssSubjects, 0)} accounts for a
          large portion of the total variance—this is the individual differences we're
          removing. After extracting both SS<sub>A</sub> (the Stroop effect) and
          SS<sub>S</sub> (subject differences), only SS<sub>A×S</sub> ={' '}
          {formatNum(anova.ssResidual, 0)} remains as error. This smaller error term is
          why our F-ratio is large ({formatNum(anova.F, 2)}) and p-value small.
          In a between-subjects design, all that subject variance would be part of the
          error term!
        </p>
      </div>
    </div>
  );
}
