import { useMemo } from 'react';
import { ANCOVA_DATA, GROUP_COLORS, GROUP_NAMES, getGroupedData } from '../data';
import { pooledWithinGroupSlope } from '../../../utils/statistics';

const SVG_WIDTH = 600;
const SVG_HEIGHT = 340;
const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 };
const PLOT_WIDTH = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

const X_MIN = 2;
const X_MAX = 9;
const Y_MIN = 55;
const Y_MAX = 90;

function xScale(val: number): number {
  return MARGIN.left + ((val - X_MIN) / (X_MAX - X_MIN)) * PLOT_WIDTH;
}

function yScale(val: number): number {
  return MARGIN.top + ((Y_MAX - val) / (Y_MAX - Y_MIN)) * PLOT_HEIGHT;
}

export default function TheANCOVAModel() {
  const { slope, groupIntercepts } = useMemo(() => {
    const grouped = getGroupedData();
    const b = pooledWithinGroupSlope(grouped);

    const means = GROUP_NAMES.map((_, gi) => {
      const pts = ANCOVA_DATA.filter((d) => d.groupIndex === gi);
      return {
        yMean: pts.reduce((s, d) => s + d.examScore, 0) / pts.length,
        xMean: pts.reduce((s, d) => s + d.priorKnowledge, 0) / pts.length,
      };
    });

    // Within-group regression line: Y = Ȳ_j + b(X - X̄_j)
    // Intercept (for plotting): a_j = Ȳ_j - b * X̄_j
    const intercepts = means.map((m) => m.yMean - b * m.xMean);

    return { slope: b, groupIntercepts: intercepts, groupMeans: means };
  }, []);

  const xTicks = [3, 4, 5, 6, 7, 8];
  const yTicks = [60, 65, 70, 75, 80, 85];

  return (
    <div className="section-intro">
      <h2>The ANCOVA Model</h2>

      <p className="intro-text">
        ANCOVA combines ANOVA&rsquo;s group structure with regression&rsquo;s
        ability to control for a continuous variable. The model says that each
        observation&rsquo;s score depends on three things: which group it
        belongs to, how its covariate value compares to the overall average,
        and random error.
      </p>

      <div className="formula-box">
        <h3>The ANCOVA Model Equation</h3>
        <div className="formula">
          <span className="formula-main">
            Y<sub>ij</sub> = &mu; + &alpha;<sub>j</sub> + &beta;(X<sub>ij</sub> &minus; X̄<sub>..</sub>) + &epsilon;<sub>ij</sub>
          </span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">Y<sub>ij</sub></span>
            <span className="explanation">Observation <em>i</em> in group <em>j</em></span>
          </div>
          <div className="formula-part">
            <span className="symbol">&mu;</span>
            <span className="explanation">Grand mean of Y</span>
          </div>
          <div className="formula-part">
            <span className="symbol">&alpha;<sub>j</sub></span>
            <span className="explanation">Effect of group <em>j</em> (with &Sigma;&alpha;<sub>j</sub> = 0)</span>
          </div>
          <div className="formula-part">
            <span className="symbol">&beta;</span>
            <span className="explanation">Common within-group regression slope</span>
          </div>
          <div className="formula-part">
            <span className="symbol">X<sub>ij</sub> &minus; X̄<sub>..</sub></span>
            <span className="explanation">Covariate deviation from grand mean</span>
          </div>
          <div className="formula-part">
            <span className="symbol">&epsilon;<sub>ij</sub></span>
            <span className="explanation">Residual error</span>
          </div>
        </div>
      </div>

      <p className="intro-text">
        The &beta; term does the work of the covariate: for every unit increase
        in Prior Knowledge, the model predicts the exam score to be &beta; points
        higher, regardless of group. This is equivalent to fitting parallel
        regression lines &mdash; one per group, all with the same slope.
      </p>

      <h3>Visualizing the Model</h3>

      <p className="intro-text">
        The plot below shows the same data as before, but now with the
        ANCOVA model&rsquo;s fitted regression lines overlaid. Each group gets
        its own line, but all three share the same slope (b = {slope.toFixed(2)}).
        The vertical distance between lines represents the adjusted group
        differences.
      </p>

      <div className="viz-container">
        <h4>ANCOVA Model: Parallel Within-Group Regression Lines</h4>
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} style={{ width: '100%', maxWidth: SVG_WIDTH }}>
          {/* Grid lines */}
          {yTicks.map((t) => (
            <line
              key={`grid-${t}`}
              x1={MARGIN.left}
              y1={yScale(t)}
              x2={SVG_WIDTH - MARGIN.right}
              y2={yScale(t)}
              stroke="var(--border)"
              strokeWidth="1"
              opacity="0.5"
            />
          ))}

          {/* Regression lines */}
          {groupIntercepts.map((intercept, gi) => {
            const y1 = intercept + slope * X_MIN;
            const y2 = intercept + slope * X_MAX;
            return (
              <line
                key={`regline-${gi}`}
                x1={xScale(X_MIN)}
                y1={yScale(y1)}
                x2={xScale(X_MAX)}
                y2={yScale(y2)}
                stroke={GROUP_COLORS[gi]}
                strokeWidth={2.5}
                opacity={0.8}
              />
            );
          })}

          {/* Data points */}
          {ANCOVA_DATA.map((d) => (
            <circle
              key={d.id}
              cx={xScale(d.priorKnowledge)}
              cy={yScale(d.examScore)}
              r={5}
              fill={GROUP_COLORS[d.groupIndex]}
              opacity={0.7}
              stroke="white"
              strokeWidth={1.5}
            />
          ))}

          {/* Slope annotation */}
          <g transform={`translate(${xScale(7.5)}, ${yScale(groupIntercepts[1] + slope * 7.5) - 15})`}>
            <text fontSize="12" fill="var(--text-primary)" fontStyle="italic" textAnchor="middle">
              slope b = {slope.toFixed(2)}
            </text>
          </g>

          {/* X axis */}
          <line
            x1={MARGIN.left}
            y1={MARGIN.top + PLOT_HEIGHT}
            x2={SVG_WIDTH - MARGIN.right}
            y2={MARGIN.top + PLOT_HEIGHT}
            stroke="var(--text-secondary)"
            strokeWidth={1}
          />
          {xTicks.map((t) => (
            <g key={`xtick-${t}`}>
              <line
                x1={xScale(t)}
                y1={MARGIN.top + PLOT_HEIGHT}
                x2={xScale(t)}
                y2={MARGIN.top + PLOT_HEIGHT + 5}
                stroke="var(--text-secondary)"
              />
              <text
                x={xScale(t)}
                y={MARGIN.top + PLOT_HEIGHT + 18}
                textAnchor="middle"
                fontSize="12"
                fill="var(--text-secondary)"
              >
                {t}
              </text>
            </g>
          ))}
          <text
            x={MARGIN.left + PLOT_WIDTH / 2}
            y={SVG_HEIGHT - 5}
            textAnchor="middle"
            fontSize="13"
            fill="var(--text-primary)"
          >
            Prior Knowledge
          </text>

          {/* Y axis */}
          <line
            x1={MARGIN.left}
            y1={MARGIN.top}
            x2={MARGIN.left}
            y2={MARGIN.top + PLOT_HEIGHT}
            stroke="var(--text-secondary)"
            strokeWidth={1}
          />
          {yTicks.map((t) => (
            <g key={`ytick-${t}`}>
              <line
                x1={MARGIN.left - 5}
                y1={yScale(t)}
                x2={MARGIN.left}
                y2={yScale(t)}
                stroke="var(--text-secondary)"
              />
              <text
                x={MARGIN.left - 10}
                y={yScale(t) + 4}
                textAnchor="end"
                fontSize="12"
                fill="var(--text-secondary)"
              >
                {t}
              </text>
            </g>
          ))}
          <text
            x={15}
            y={MARGIN.top + PLOT_HEIGHT / 2}
            textAnchor="middle"
            fontSize="13"
            fill="var(--text-primary)"
            transform={`rotate(-90, 15, ${MARGIN.top + PLOT_HEIGHT / 2})`}
          >
            Exam Score
          </text>

          {/* Legend */}
          {GROUP_NAMES.map((name, gi) => (
            <g key={`legend-${gi}`} transform={`translate(${MARGIN.left + 10 + gi * 130}, ${MARGIN.top + 10})`}>
              <line x1={-8} y1={0} x2={8} y2={0} stroke={GROUP_COLORS[gi]} strokeWidth={2.5} />
              <circle cx={0} cy={0} r={4} fill={GROUP_COLORS[gi]} />
              <text x={14} y={4} fontSize="11" fill="var(--text-primary)">
                {name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p className="intro-text">
        If &beta; = 0 (the covariate is unrelated to Y), these lines would be
        flat and ANCOVA would reduce to ordinary one-way ANOVA. If the group
        effects &alpha;<sub>j</sub> are all zero, the three lines would
        collapse into a single regression line. ANCOVA is most useful when both
        components are present: the covariate has a meaningful relationship with
        Y, <em>and</em> the groups differ after accounting for it.
      </p>

      <div className="key-insight">
        <h4>The Key Assumption</h4>
        <p>
          The ANCOVA model assumes that every group shares the same regression
          slope &beta;. This is the <strong>homogeneity of regression slopes</strong>{' '}
          assumption. If the covariate&rsquo;s effect on Y differs across groups
          (i.e., the lines are not parallel), then a single adjustment is
          misleading. We will return to this assumption in the final section.
        </p>
      </div>

      <h3>Connecting ANOVA and Regression</h3>

      <p className="intro-text">
        ANCOVA can be understood as either (a) ANOVA with a covariate added to
        the model, or (b) multiple regression with dummy-coded group variables
        plus the continuous covariate. Both framings produce identical results.
        The ANOVA framing emphasizes variance partitioning; the regression
        framing emphasizes prediction. We will use the ANOVA framing in the
        sections that follow, since it connects directly to the SS decomposition
        students already know.
      </p>
    </div>
  );
}
