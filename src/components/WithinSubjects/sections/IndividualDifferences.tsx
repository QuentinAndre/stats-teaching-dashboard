import { useState, useMemo } from 'react';

// Fixed Stroop data: 8 subjects × 2 conditions (RT in ms)
const STROOP_DATA = [
  { id: 'S1', congruent: 420, incongruent: 480 },
  { id: 'S2', congruent: 380, incongruent: 430 },
  { id: 'S3', congruent: 510, incongruent: 580 },
  { id: 'S4', congruent: 450, incongruent: 500 },
  { id: 'S5', congruent: 390, incongruent: 460 },
  { id: 'S6', congruent: 480, incongruent: 530 },
  { id: 'S7', congruent: 360, incongruent: 420 },
  { id: 'S8', congruent: 440, incongruent: 500 },
];

type ViewMode = 'between' | 'within';

export default function IndividualDifferences() {
  const [viewMode, setViewMode] = useState<ViewMode>('between');

  // Calculate statistics
  const stats = useMemo(() => {
    const congruentValues = STROOP_DATA.map((d) => d.congruent);
    const incongruentValues = STROOP_DATA.map((d) => d.incongruent);

    const meanCongruent =
      congruentValues.reduce((a, b) => a + b, 0) / congruentValues.length;
    const meanIncongruent =
      incongruentValues.reduce((a, b) => a + b, 0) / incongruentValues.length;

    // Combined variance (for between-subjects view)
    const allValues = [...congruentValues, ...incongruentValues];
    const grandMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;

    return {
      meanCongruent,
      meanIncongruent,
      grandMean,
      stroopEffect: meanIncongruent - meanCongruent,
    };
  }, []);

  // SVG dimensions
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 40, bottom: 40, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Scale for y-axis (RT values)
  const minRT = 300;
  const maxRT = 650;
  const yScale = (value: number) =>
    margin.top + plotHeight - ((value - minRT) / (maxRT - minRT)) * plotHeight;

  // X positions for conditions
  const xCongruent = margin.left + plotWidth * 0.3;
  const xIncongruent = margin.left + plotWidth * 0.7;

  // Add jitter for scatter plot view
  const jitterOffset = (index: number) => (index % 2 === 0 ? -8 : 8);

  return (
    <div className="section-intro">
      <h2>The Problem with People</h2>

      <p className="intro-text">
        Here's our Stroop data: 8 participants each completed congruent and incongruent
        trials. Notice how people vary dramatically in their overall speed—some respond
        around 400ms, others around 550ms. This person-to-person variation is what we
        call <em>individual differences</em>.
      </p>

      <div className="viz-container">
        <h4>The Same Data, Two Perspectives</h4>

        <div className="view-toggle">
          <button
            className={`toggle-button ${viewMode === 'between' ? 'active' : ''}`}
            onClick={() => setViewMode('between')}
          >
            Between-Subjects View
          </button>
          <button
            className={`toggle-button ${viewMode === 'within' ? 'active' : ''}`}
            onClick={() => setViewMode('within')}
          >
            Within-Subjects View
          </button>
        </div>

        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Y-axis */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="var(--border)"
            strokeWidth={1}
          />

          {/* Y-axis ticks and labels */}
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
                fontSize={12}
                fill="var(--text-secondary)"
              >
                {tick}
              </text>
              {/* Grid lines */}
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
          <text
            x={xCongruent}
            y={height - 10}
            textAnchor="middle"
            fontSize={14}
            fill="var(--text-primary)"
            fontWeight={500}
          >
            Congruent
          </text>
          <text
            x={xIncongruent}
            y={height - 10}
            textAnchor="middle"
            fontSize={14}
            fill="var(--text-primary)"
            fontWeight={500}
          >
            Incongruent
          </text>

          {/* Data points and lines */}
          {viewMode === 'between' ? (
            // Between-subjects view: scatter plot with no connections
            <>
              {STROOP_DATA.map((subject, i) => (
                <g key={subject.id}>
                  <circle
                    cx={xCongruent + jitterOffset(i)}
                    cy={yScale(subject.congruent)}
                    r={8}
                    fill="#4361ee"
                    opacity={0.6}
                  />
                  <circle
                    cx={xIncongruent + jitterOffset(i + 1)}
                    cy={yScale(subject.incongruent)}
                    r={8}
                    fill="#f4a261"
                    opacity={0.6}
                  />
                </g>
              ))}
              {/* Group means */}
              <line
                x1={xCongruent - 30}
                y1={yScale(stats.meanCongruent)}
                x2={xCongruent + 30}
                y2={yScale(stats.meanCongruent)}
                stroke="#4361ee"
                strokeWidth={3}
              />
              <line
                x1={xIncongruent - 30}
                y1={yScale(stats.meanIncongruent)}
                x2={xIncongruent + 30}
                y2={yScale(stats.meanIncongruent)}
                stroke="#f4a261"
                strokeWidth={3}
              />
            </>
          ) : (
            // Within-subjects view: connected lines (spaghetti plot)
            <>
              {STROOP_DATA.map((subject) => (
                <g key={subject.id}>
                  {/* Connecting line */}
                  <line
                    x1={xCongruent}
                    y1={yScale(subject.congruent)}
                    x2={xIncongruent}
                    y2={yScale(subject.incongruent)}
                    stroke="#f4a261"
                    strokeWidth={2}
                    opacity={0.5}
                  />
                  {/* Points */}
                  <circle
                    cx={xCongruent}
                    cy={yScale(subject.congruent)}
                    r={6}
                    fill="#f4a261"
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={xIncongruent}
                    cy={yScale(subject.incongruent)}
                    r={6}
                    fill="#f4a261"
                    stroke="white"
                    strokeWidth={1.5}
                  />
                </g>
              ))}
              {/* Condition means */}
              <circle
                cx={xCongruent}
                cy={yScale(stats.meanCongruent)}
                r={10}
                fill="#4361ee"
                stroke="white"
                strokeWidth={2}
              />
              <circle
                cx={xIncongruent}
                cy={yScale(stats.meanIncongruent)}
                r={10}
                fill="#4361ee"
                stroke="white"
                strokeWidth={2}
              />
              <line
                x1={xCongruent}
                y1={yScale(stats.meanCongruent)}
                x2={xIncongruent}
                y2={yScale(stats.meanIncongruent)}
                stroke="#4361ee"
                strokeWidth={3}
                strokeDasharray="5,3"
              />
            </>
          )}
        </svg>

        <div
          style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-md)',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
          }}
        >
          {viewMode === 'between' ? (
            <span>
              Without knowing who each point belongs to, the groups overlap
              substantially.
            </span>
          ) : (
            <span>
              When we connect each subject's scores, nearly every line goes
              <strong> up</strong>—the Stroop effect is consistent!
            </span>
          )}
        </div>
      </div>

      <p className="intro-text">
        Toggle between the two views above. In the <strong>between-subjects view</strong>,
        we see two clouds of points with substantial overlap—fast people in the
        incongruent condition are faster than slow people in the congruent condition.
        If we didn't know which points came from the same person, the effect would be
        hard to see.
      </p>

      <p className="intro-text">
        In the <strong>within-subjects view</strong>, we draw a line connecting each
        person's two scores. Now the pattern is crystal clear: virtually every line
        slopes upward, showing that each person is slower on incongruent trials. The
        consistency of the effect across individuals is remarkable.
      </p>

      <div className="key-insight">
        <h4>Where Does Subject Variance Go?</h4>
        <p>
          In a between-subjects analysis, the variation between people (some fast,
          some slow) goes into SS<sub>Within</sub>—the error term. It's noise we can't
          explain. But in a within-subjects analysis, we can <em>partition out</em> this
          variance as SS<sub>Subjects</sub>, leaving only the inconsistency in how
          people respond to the treatment (SS<sub>A×S</sub>) as error. This smaller
          error term means more statistical power.
        </p>
      </div>

      <h3>The Data</h3>

      <p className="intro-text">
        Here's our complete dataset. Notice the "Difference" column—this will become
        important in the next section.
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Congruent (ms)</th>
            <th>Incongruent (ms)</th>
            <th className="col-difference">Difference</th>
          </tr>
        </thead>
        <tbody>
          {STROOP_DATA.map((subject) => (
            <tr key={subject.id}>
              <td>{subject.id}</td>
              <td>{subject.congruent}</td>
              <td>{subject.incongruent}</td>
              <td className="col-difference">
                {subject.incongruent - subject.congruent}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Mean</td>
            <td>{stats.meanCongruent.toFixed(1)}</td>
            <td>{stats.meanIncongruent.toFixed(1)}</td>
            <td className="col-difference">{stats.stroopEffect.toFixed(1)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
