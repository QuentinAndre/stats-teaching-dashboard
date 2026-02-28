import { useMemo } from 'react';
import { ANCOVA_DATA, GROUP_COLORS, GROUP_NAMES, getGroupedData } from '../data';
import { oneWayANCOVA } from '../../../utils/statistics';

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

export default function ANCOVAIntro() {
  const stats = useMemo(() => {
    const grouped = getGroupedData();
    const ancova = oneWayANCOVA(grouped);
    const groupMeans = GROUP_NAMES.map((_, gi) => {
      const pts = ANCOVA_DATA.filter((d) => d.groupIndex === gi);
      return {
        yMean: pts.reduce((s, d) => s + d.examScore, 0) / pts.length,
        xMean: pts.reduce((s, d) => s + d.priorKnowledge, 0) / pts.length,
      };
    });
    return { ancova, groupMeans, grandMeanY: ancova.grandMeanY };
  }, []);

  const xTicks = [3, 4, 5, 6, 7, 8];
  const yTicks = [60, 65, 70, 75, 80, 85];

  return (
    <div className="section-intro">
      <h2>Why Covariates?</h2>

      <p className="intro-text">
        In a between-subjects experiment, random assignment should, on average,
        balance groups on all variables. But with small samples, groups often
        differ on pre-existing characteristics that also affect the dependent
        variable. These imbalances create two problems: they can bias group
        comparisons, and they inflate the error term by adding unexplained
        variance.
      </p>

      <h3>A Concrete Example</h3>

      <p className="intro-text">
        Suppose a researcher compares three teaching methods &mdash; Lecture,
        Discussion, and Flipped Classroom &mdash; by randomly assigning 24
        students (8 per group) and measuring their Final Exam scores. The
        researcher also records each student&rsquo;s Prior Knowledge on the
        subject (a 1&ndash;10 scale).
      </p>

      <p className="intro-text">
        The scatter plot below shows the data. Each point is one student,
        color-coded by teaching method. The horizontal dashed lines mark each
        group&rsquo;s mean exam score.
      </p>

      <div className="viz-container">
        <h4>Final Exam Scores by Prior Knowledge and Teaching Method</h4>
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

          {/* Data points */}
          {ANCOVA_DATA.map((d) => (
            <circle
              key={d.id}
              cx={xScale(d.priorKnowledge)}
              cy={yScale(d.examScore)}
              r={6}
              fill={GROUP_COLORS[d.groupIndex]}
              opacity={0.8}
              stroke="white"
              strokeWidth={1.5}
            />
          ))}

          {/* Group mean lines */}
          {stats.groupMeans.map((gm, gi) => (
            <line
              key={`mean-${gi}`}
              x1={MARGIN.left}
              y1={yScale(gm.yMean)}
              x2={SVG_WIDTH - MARGIN.right}
              y2={yScale(gm.yMean)}
              stroke={GROUP_COLORS[gi]}
              strokeWidth={2}
              strokeDasharray="8,4"
              opacity={0.7}
            />
          ))}

          {/* Grand mean */}
          <line
            x1={MARGIN.left}
            y1={yScale(stats.grandMeanY)}
            x2={SVG_WIDTH - MARGIN.right}
            y2={yScale(stats.grandMeanY)}
            stroke="var(--text-secondary)"
            strokeWidth={1.5}
            strokeDasharray="4,3"
            opacity={0.5}
          />
          <text
            x={SVG_WIDTH - MARGIN.right + 4}
            y={yScale(stats.grandMeanY) + 4}
            fontSize="10"
            fill="var(--text-secondary)"
          >
            Ȳ..
          </text>

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
            <g key={`legend-${gi}`} transform={`translate(${MARGIN.left + 10 + gi * 140}, ${MARGIN.top + 10})`}>
              <circle cx={0} cy={0} r={5} fill={GROUP_COLORS[gi]} />
              <text x={10} y={4} fontSize="12" fill="var(--text-primary)">
                {name} (Ȳ = {stats.groupMeans[gi].yMean.toFixed(1)})
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p className="intro-text">
        At first glance, the three groups look similar &mdash; their raw means
        range from about {Math.min(...stats.groupMeans.map((g) => g.yMean)).toFixed(1)} to{' '}
        {Math.max(...stats.groupMeans.map((g) => g.yMean)).toFixed(1)}.
        But notice that the Lecture group (blue) has the highest average prior
        knowledge (X̄ = {stats.groupMeans[0].xMean.toFixed(1)}), while
        the Flipped group (teal) has the lowest
        (X̄ = {stats.groupMeans[2].xMean.toFixed(1)}). Students with more
        prior knowledge tend to score higher regardless of teaching method.
      </p>

      <p className="intro-text">
        This raises a question: is the Lecture group&rsquo;s modest advantage
        real, or is it simply a reflection of their higher starting knowledge?
        And conversely, is the Flipped group&rsquo;s performance being
        <em> underestimated</em> because its students started with less?
      </p>

      <div className="key-insight">
        <h4>The Role of ANCOVA</h4>
        <p>
          Analysis of Covariance (ANCOVA) addresses both problems at once. It
          statistically adjusts group means for differences in the covariate
          (Prior Knowledge), and it removes covariate-related variance from
          the error term, increasing the power of the F-test. The result is a
          fairer and more sensitive comparison of the treatment effect.
        </p>
      </div>
    </div>
  );
}
