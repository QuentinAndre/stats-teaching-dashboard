const GROUP_LABELS = ['CBT', 'Behavioral', 'Wait-list'];
const GROUP_COLORS = ['#4361ee', '#f4a261', '#e63946'];

// Fixed dataset: both therapies well above wait-list, CBT ≈ Behavioral
// Population means: CBT = 82, Behavioral = 81, Wait-list = 65; SD ≈ 10; n = 15
const MEANS = [82, 81, 65];
const N = 15;

// Generate fixed data points using a deterministic seed
function seededData(mean: number, sd: number, n: number, seed: number): number[] {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const u1 = rand();
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
    values.push(mean + sd * z);
  }
  return values;
}

const GROUPS = [
  seededData(82, 10, N, 4000),
  seededData(81, 10, N, 8000),
  seededData(65, 10, N, 12000),
];

// Compute observed means
const OBS_MEANS = GROUPS.map(g => g.reduce((s, v) => s + v, 0) / g.length);
const GRAND_MEAN = GROUPS.flat().reduce((s, v) => s + v, 0) / (N * 3);

// Compute ANOVA values from the fixed data
const SS_BETWEEN = N * OBS_MEANS.reduce((s, m) => s + (m - GRAND_MEAN) ** 2, 0);
const SS_WITHIN = GROUPS.reduce((s, g, i) =>
  s + g.reduce((gs, v) => gs + (v - OBS_MEANS[i]) ** 2, 0), 0);
const SS_TOTAL = SS_BETWEEN + SS_WITHIN;
const DF_BETWEEN = 2;
const DF_WITHIN = N * 3 - 3;
const DF_TOTAL = N * 3 - 1;
const MS_BETWEEN = SS_BETWEEN / DF_BETWEEN;
const MS_WITHIN = SS_WITHIN / DF_WITHIN;
const F_STAT = MS_BETWEEN / MS_WITHIN;

// Approximate p-value using the incomplete beta function
function fCDF(f: number, d1: number, d2: number): number {
  const x = d2 / (d2 + d1 * f);
  // Regularized incomplete beta via continued fraction (Lentz)
  const a = d2 / 2;
  const b = d1 / 2;
  const lnBeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta) / a;
  // Continued fraction for I_x(a, b)
  let cf = 1;
  const maxIter = 200;
  let c = 1e30;
  let d = 1;
  for (let m = 0; m <= maxIter; m++) {
    let numerator: number;
    if (m === 0) {
      numerator = 1;
    } else {
      const k = m;
      const isEven = k % 2 === 0;
      const halfK = Math.floor(k / 2);
      if (isEven) {
        const mm = halfK;
        numerator = (mm * (b - mm) * x) / ((a + 2 * mm - 1) * (a + 2 * mm));
      } else {
        const mm = halfK;
        numerator = -((a + mm) * (a + b + mm) * x) / ((a + 2 * mm) * (a + 2 * mm + 1));
      }
    }
    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    const delta = c * d;
    cf *= delta;
    if (Math.abs(delta - 1) < 1e-10) break;
  }
  const ibeta = front * cf;
  return ibeta; // This is I_x(a,b) = P(F > f) complement... actually I_x(d2/2, d1/2)
}

function lgamma(z: number): number {
  const g = 7;
  const coef = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  }
  z -= 1;
  let x = coef[0];
  for (let i = 1; i < g + 2; i++) {
    x += coef[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// p-value = P(F > observed) = I_x(d2/2, d1/2) where x = d2/(d2 + d1*F)
const P_VALUE = fCDF(F_STAT, DF_BETWEEN, DF_WITHIN);
const IS_SIGNIFICANT = P_VALUE < 0.05;

// SVG layout
const SVG_WIDTH = 700;
const SVG_HEIGHT = 300;
const MARGIN = { top: 30, right: 40, bottom: 60, left: 60 };
const PLOT_W = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

const ALL_VALUES = GROUPS.flat();
const Y_MIN = Math.min(...ALL_VALUES) - 10;
const Y_MAX = Math.max(...ALL_VALUES) + 10;
const yScale = (y: number) => PLOT_H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
const GROUP_W = PLOT_W / 3;

// Pre-compute dot positions with deterministic jitter
const POINTS = GROUPS.flatMap((group, gi) => {
  const baseX = GROUP_W * gi + GROUP_W / 2;
  return group.map((value, i) => {
    const jitter = ((i * 7919 + gi * 104729 + 15485863) % 1000) / 1000;
    return {
      x: baseX + (jitter - 0.5) * 50,
      y: yScale(value),
      groupIdx: gi,
    };
  });
});

const MEAN_YS = OBS_MEANS.map(m => yScale(m));
const GRAND_MEAN_Y = yScale(GRAND_MEAN);

export default function ContrastsIntro() {
  return (
    <div className="section-intro">
      <h2>The Omnibus F Problem</h2>

      <p className="intro-text">
        In the ANOVA module, we saw that a significant <em>F</em> tells us <em>something</em>{' '}
        differs among the group means -- but nothing more specific than that. This is the
        limitation of the <strong>omnibus F-test</strong>: it spreads its degrees of freedom
        across all possible differences simultaneously.
      </p>

      <p className="intro-text">
        Consider a therapy study comparing three treatments for anxiety: Cognitive Behavioral
        Therapy (CBT), Behavioral Therapy alone, and a Wait-list Control. A researcher might
        have specific questions: Does therapy (either kind) reduce anxiety compared to no
        treatment? Does CBT outperform Behavioral therapy? The omnibus F cannot answer either
        question directly.
      </p>

      <div className="viz-container">
        <h4>Therapy Study: Three-Group ANOVA</h4>

        {/* Dot plot */}
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ marginTop: 'var(--spacing-md)', maxWidth: '100%' }}>
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {/* Y-axis */}
            <line x1={0} y1={0} x2={0} y2={PLOT_H} stroke="var(--border)" strokeWidth={1} />

            {/* Y-axis ticks */}
            {[Y_MIN, (Y_MIN + Y_MAX) / 2, Y_MAX].map((tick, i) => (
              <g key={i} transform={`translate(0, ${yScale(tick)})`}>
                <line x1={-5} y1={0} x2={0} y2={0} stroke="var(--border)" />
                <text x={-10} y={4} textAnchor="end" fontSize={11} fill="var(--text-secondary)">
                  {tick.toFixed(0)}
                </text>
              </g>
            ))}

            {/* Y-axis label */}
            <text
              transform={`translate(-45, ${PLOT_H / 2}) rotate(-90)`}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-secondary)"
            >
              Anxiety Score
            </text>

            {/* Grand mean line */}
            <line
              x1={0} y1={GRAND_MEAN_Y}
              x2={PLOT_W - 85} y2={GRAND_MEAN_Y}
              stroke="var(--text-secondary)" strokeWidth={2}
              strokeDasharray="6,4" opacity={0.6}
            />
            <text x={PLOT_W - 5} y={GRAND_MEAN_Y + 4}
              fontSize={10} fill="var(--text-secondary)" textAnchor="end">
              Grand Mean
            </text>

            {/* Group mean lines */}
            {OBS_MEANS.map((_, i) => {
              const baseX = GROUP_W * i + GROUP_W / 2;
              return (
                <line key={`mean-${i}`}
                  x1={baseX - 35} y1={MEAN_YS[i]}
                  x2={baseX + 35} y2={MEAN_YS[i]}
                  stroke={GROUP_COLORS[i]} strokeWidth={3}
                />
              );
            })}

            {/* Data points */}
            {POINTS.map((point, i) => (
              <circle key={`point-${i}`}
                cx={point.x} cy={point.y} r={5}
                fill={GROUP_COLORS[point.groupIdx]}
                opacity={0.6} stroke="white" strokeWidth={1}
              />
            ))}

            {/* X-axis labels */}
            {GROUP_LABELS.map((label, i) => {
              const baseX = GROUP_W * i + GROUP_W / 2;
              return (
                <g key={`label-${i}`}>
                  <text x={baseX} y={PLOT_H + 20} textAnchor="middle"
                    fontSize={12} fill={GROUP_COLORS[i]} fontWeight={600}>
                    {label}
                  </text>
                  <text x={baseX} y={PLOT_H + 35} textAnchor="middle"
                    fontSize={10} fill="var(--text-secondary)">
                    Y&#772; = {OBS_MEANS[i].toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* ANOVA Summary Table */}
        <table className="anova-table" style={{ marginTop: 'var(--spacing-md)' }}>
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
            <tr>
              <td>Between (A)</td>
              <td>{SS_BETWEEN.toFixed(2)}</td>
              <td>{DF_BETWEEN}</td>
              <td>{MS_BETWEEN.toFixed(2)}</td>
              <td style={{ fontWeight: 600, color: IS_SIGNIFICANT ? 'var(--accent)' : 'var(--text-primary)' }}>
                {F_STAT.toFixed(3)}
              </td>
              <td style={{ color: IS_SIGNIFICANT ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {P_VALUE < 0.001 ? '< .001' : P_VALUE.toFixed(3)}
              </td>
            </tr>
            <tr>
              <td>Within (S/A)</td>
              <td>{SS_WITHIN.toFixed(2)}</td>
              <td>{DF_WITHIN}</td>
              <td>{MS_WITHIN.toFixed(2)}</td>
              <td></td>
              <td></td>
            </tr>
            <tr style={{ fontWeight: 600 }}>
              <td>Total</td>
              <td>{SS_TOTAL.toFixed(2)}</td>
              <td>{DF_TOTAL}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div style={{
          padding: 'var(--spacing-md)',
          background: 'rgba(230, 57, 70, 0.08)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid rgba(230, 57, 70, 0.2)',
          marginTop: 'var(--spacing-md)',
          fontSize: '0.9375rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
        }}>
          The omnibus F is significant (<em>p</em> {P_VALUE < 0.001 ? '< .001' : `= ${P_VALUE.toFixed(3)}`}).
          We know <em>something</em> differs among the three groups -- but is CBT better than
          Wait-list? Are the two active therapies different from each other? The omnibus F
          cannot answer these specific questions.
        </div>
      </div>

      <p className="intro-text">
        To know whether and how the different cell means differ from each other, researchers must
        probe them using contrasts. These contrasts can be either planned (i.e., defined a priori,
        before seeing the data) or post-hoc (i.e., executed after seeing the data).
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--spacing-lg)',
        margin: 'var(--spacing-lg) 0',
      }}>
        <div style={{
          padding: 'var(--spacing-lg)',
          background: 'rgba(67, 97, 238, 0.05)',
          borderRadius: 'var(--border-radius-md)',
          border: '2px solid #4361ee',
        }}>
          <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: '#4361ee' }}>Planned Contrasts</h4>
          <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            <li>Theory-driven, specified before data collection</li>
            <li>More statistical power</li>
            <li>Does not require a significant omnibus test</li>
            <li>Only compare specific groups</li>
          </ul>
        </div>
        <div style={{
          padding: 'var(--spacing-lg)',
          background: 'rgba(108, 117, 125, 0.05)',
          borderRadius: 'var(--border-radius-md)',
          border: '2px solid #adb5bd',
        }}>
          <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: '#6c757d' }}>Post-Hoc Tests</h4>
          <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            <li>Exploratory, decided after seeing the data</li>
            <li>Multiple-comparison correction reduces power</li>
            <li>Typically require a significant omnibus F first</li>
            <li>Compare all possible pairs</li>
          </ul>
        </div>
      </div>

      <p className="intro-text">
        In this section, we are going to review Planned Contrasts, and we will discuss Post-Hoc
        Tests in a follow-up module.
      </p>
    </div>
  );
}
