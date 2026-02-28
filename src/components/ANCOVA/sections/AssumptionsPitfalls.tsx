import { useState, useMemo } from 'react';
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

export default function AssumptionsPitfalls() {
  const [slopeDivergence, setSlopeDivergence] = useState(0);

  const { baseSlope, groupMeans } = useMemo(() => {
    const grouped = getGroupedData();
    const pooled = pooledWithinGroupSlope(grouped);
    const means = GROUP_NAMES.map((_, gi) => {
      const pts = ANCOVA_DATA.filter((d) => d.groupIndex === gi);
      return {
        yMean: pts.reduce((s, d) => s + d.examScore, 0) / pts.length,
        xMean: pts.reduce((s, d) => s + d.priorKnowledge, 0) / pts.length,
      };
    });
    return { baseSlope: pooled, groupMeans: means };
  }, []);

  // Modify slopes based on divergence slider
  // At 0: all slopes equal (pooled). At 1: slopes diverge significantly.
  const displaySlopes = useMemo(() => {
    const offsets = [-1.5, 0, 1.5]; // Group 0 flattens, Group 2 steepens
    return GROUP_NAMES.map((_, gi) =>
      baseSlope + slopeDivergence * offsets[gi]
    );
  }, [slopeDivergence, baseSlope]);

  const maxDiff = Math.max(...displaySlopes) - Math.min(...displaySlopes);
  const assumptionMet = maxDiff < 1.5;

  const xTicks = [3, 4, 5, 6, 7, 8];
  const yTicks = [60, 65, 70, 75, 80, 85];

  return (
    <div className="section-intro">
      <h2>Assumptions &amp; Pitfalls</h2>

      <p className="intro-text">
        ANCOVA shares the standard ANOVA assumptions (independence, normality,
        homogeneity of variance) but adds one critical assumption of its own:
        the <strong>homogeneity of regression slopes</strong>. Violating this
        assumption can make the ANCOVA results misleading.
      </p>

      <h3>Homogeneity of Regression Slopes</h3>

      <p className="intro-text">
        The ANCOVA model fits a single regression slope &beta; across all
        groups. This assumes the covariate has the <em>same</em> linear
        relationship with Y in every group. When slopes differ, the
        &ldquo;adjusted&rdquo; means depend on which covariate value you
        evaluate them at, making a single set of adjusted means meaningless.
      </p>

      <p className="intro-text">
        Use the slider below to see what happens when this assumption is
        violated. At zero divergence, all groups share the same slope
        (assumption met). As divergence increases, the slopes pull apart.
      </p>

      <div className="controls-row">
        <div className="control-group">
          <label htmlFor="divergence-slider">Slope divergence</label>
          <input
            id="divergence-slider"
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={slopeDivergence}
            onChange={(e) => setSlopeDivergence(parseFloat(e.target.value))}
          />
          <span className="control-value">{slopeDivergence.toFixed(1)}</span>
        </div>
      </div>

      <div className={`status-indicator ${assumptionMet ? 'met' : 'violated'}`}>
        {assumptionMet ? (
          <>&#10003; Slopes are approximately parallel &mdash; ANCOVA is appropriate.</>
        ) : (
          <>&#10007; Slopes differ substantially across groups &mdash; ANCOVA adjustment is misleading.</>
        )}
      </div>

      <div className="viz-container">
        <h4>
          Within-Group Regression Slopes
          {displaySlopes.map((s, i) => (
            <span key={i} style={{ marginLeft: 12, fontSize: '0.8125rem', color: GROUP_COLORS[i] }}>
              {GROUP_NAMES[i]}: b = {s.toFixed(2)}
            </span>
          ))}
        </h4>
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} style={{ width: '100%', maxWidth: SVG_WIDTH }}>
          {/* Grid */}
          {yTicks.map((t) => (
            <line
              key={`grid-${t}`}
              x1={MARGIN.left}
              y1={yScale(t)}
              x2={SVG_WIDTH - MARGIN.right}
              y2={yScale(t)}
              stroke="var(--border)"
              strokeWidth="1"
              opacity="0.4"
            />
          ))}

          {/* Regression lines with divergent slopes */}
          {GROUP_NAMES.map((_, gi) => {
            const intercept = groupMeans[gi].yMean - displaySlopes[gi] * groupMeans[gi].xMean;
            const y1Val = intercept + displaySlopes[gi] * X_MIN;
            const y2Val = intercept + displaySlopes[gi] * X_MAX;
            return (
              <line
                key={`regline-${gi}`}
                x1={xScale(X_MIN)}
                y1={yScale(Math.max(Y_MIN, Math.min(Y_MAX, y1Val)))}
                x2={xScale(X_MAX)}
                y2={yScale(Math.max(Y_MIN, Math.min(Y_MAX, y2Val)))}
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
              opacity={0.6}
              stroke="white"
              strokeWidth={1.5}
            />
          ))}

          {/* Axes */}
          <line x1={MARGIN.left} y1={MARGIN.top + PLOT_HEIGHT} x2={SVG_WIDTH - MARGIN.right} y2={MARGIN.top + PLOT_HEIGHT} stroke="var(--text-secondary)" />
          {xTicks.map((t) => (
            <g key={`xtick-${t}`}>
              <line x1={xScale(t)} y1={MARGIN.top + PLOT_HEIGHT} x2={xScale(t)} y2={MARGIN.top + PLOT_HEIGHT + 5} stroke="var(--text-secondary)" />
              <text x={xScale(t)} y={MARGIN.top + PLOT_HEIGHT + 18} textAnchor="middle" fontSize="12" fill="var(--text-secondary)">{t}</text>
            </g>
          ))}
          <text x={MARGIN.left + PLOT_WIDTH / 2} y={SVG_HEIGHT - 5} textAnchor="middle" fontSize="13" fill="var(--text-primary)">
            Prior Knowledge
          </text>

          <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + PLOT_HEIGHT} stroke="var(--text-secondary)" />
          {yTicks.map((t) => (
            <g key={`ytick-${t}`}>
              <line x1={MARGIN.left - 5} y1={yScale(t)} x2={MARGIN.left} y2={yScale(t)} stroke="var(--text-secondary)" />
              <text x={MARGIN.left - 10} y={yScale(t) + 4} textAnchor="end" fontSize="12" fill="var(--text-secondary)">{t}</text>
            </g>
          ))}
          <text x={15} y={MARGIN.top + PLOT_HEIGHT / 2} textAnchor="middle" fontSize="13" fill="var(--text-primary)" transform={`rotate(-90, 15, ${MARGIN.top + PLOT_HEIGHT / 2})`}>
            Exam Score
          </text>

          {/* Legend */}
          {GROUP_NAMES.map((name, gi) => (
            <g key={`legend-${gi}`} transform={`translate(${MARGIN.left + 10 + gi * 130}, ${MARGIN.top + 10})`}>
              <line x1={-8} y1={0} x2={8} y2={0} stroke={GROUP_COLORS[gi]} strokeWidth={2.5} />
              <circle cx={0} cy={0} r={4} fill={GROUP_COLORS[gi]} />
              <text x={14} y={4} fontSize="11" fill="var(--text-primary)">{name}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="key-insight">
        <h4>When Slopes Differ</h4>
        <p>
          If the within-group regression slopes are not parallel, the covariate
          is not just a nuisance variable &mdash; it is a <strong>moderator</strong>{' '}
          of the treatment effect. The covariate&rsquo;s relationship with Y
          depends on which group you are in. In this case, ANCOVA&rsquo;s
          single-slope model is inappropriate. Consider instead a model that
          includes the group &times; covariate interaction.
        </p>
      </div>

      <h3>Other Assumptions</h3>

      <p className="intro-text">
        Beyond homogeneity of slopes, ANCOVA requires:
      </p>

      <ul className="intro-text" style={{ paddingLeft: 'var(--spacing-xl)', lineHeight: 2 }}>
        <li>
          <strong>Linearity:</strong> The covariate&ndash;DV relationship
          should be approximately linear within each group.
        </li>
        <li>
          <strong>Independence:</strong> Observations must be independent
          (same as ANOVA).
        </li>
        <li>
          <strong>Normality:</strong> Residuals should be approximately
          normally distributed (robust with moderate sample sizes).
        </li>
        <li>
          <strong>Homogeneity of variance:</strong> The residual variance
          should be similar across groups.
        </li>
      </ul>

      <h3>A Common Misuse</h3>

      <div className="warning-box">
        <h4>Never Use Post-Treatment Variables as Covariates</h4>
        <p>
          The covariate must be measured <strong>before</strong> the treatment
          is administered, or it must be a stable individual difference
          unaffected by the treatment. If you &ldquo;control for&rdquo; a
          variable that was itself changed by the treatment (e.g., a
          manipulation check, a post-test attitude), you can absorb the very
          effect you are trying to detect. The result is a biased test that
          may miss a real treatment effect or create a spurious one.
        </p>
      </div>

      <p className="intro-text">
        When used correctly &mdash; with a pre-treatment covariate and
        reasonably parallel slopes &mdash; ANCOVA is one of the most effective
        tools for increasing the precision of between-subjects comparisons.
      </p>
    </div>
  );
}
