const GROUP_LABELS = ['CBT', 'Behavioral', 'Wait-list'];
const GROUP_COLORS = ['#4361ee', '#f4a261', '#e63946'];

// Fixed dataset: both therapies well above wait-list, CBT ≈ Behavioral
const MEANS = [82, 81, 65];
const N = 15;
const MS_WITHIN = 100; // MS_S/A
const DF_WITHIN = 42; // N_total - k = 45 - 3

// Derived ANOVA values
const GRAND_MEAN = (MEANS[0] + MEANS[1] + MEANS[2]) / 3; // 76
const SS_BETWEEN = N * MEANS.reduce((s, m) => s + (m - GRAND_MEAN) ** 2, 0); // 2730
const DF_BETWEEN = 2;
const MS_BETWEEN = SS_BETWEEN / DF_BETWEEN; // 1365
const F_OMNIBUS = MS_BETWEEN / MS_WITHIN; // 13.65

// Contrast 1: Therapy vs. Control [+1, +1, -2]
const W1 = [1, 1, -2];
const PSI1 = W1[0] * MEANS[0] + W1[1] * MEANS[1] + W1[2] * MEANS[2]; // 33
const SUM_C2_1 = W1.reduce((s, c) => s + c * c, 0); // 6
const SS_PSI1 = N * PSI1 * PSI1 / SUM_C2_1; // 2722.5
const F_PSI1 = SS_PSI1 / MS_WITHIN; // 27.225

// Contrast 2: CBT vs. Behavioral [+1, -1, 0]
const W2 = [1, -1, 0];
const PSI2 = W2[0] * MEANS[0] + W2[1] * MEANS[1] + W2[2] * MEANS[2]; // 1
const SUM_C2_2 = W2.reduce((s, c) => s + c * c, 0); // 2
const SS_PSI2 = N * PSI2 * PSI2 / SUM_C2_2; // 7.5
const F_PSI2 = SS_PSI2 / MS_WITHIN; // 0.075

function ContrastDerivation({
  label,
  weights,
  psiHat,
  sumC2,
  ssPsi,
  fPsi,
}: {
  label: string;
  weights: number[];
  psiHat: number;
  sumC2: number;
  ssPsi: number;
  fPsi: number;
}) {
  return (
    <>
      <h3>{label}: [{weights.map((c, i) => (i > 0 ? `, ${c > 0 ? '+' : ''}${c}` : `${c > 0 ? '+' : ''}${c}`)).join('')}]</h3>

      {/* Step 1: ψ̂ */}
      <div className="formula-box" style={{ marginBottom: 'var(--spacing-md)' }}>
        <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>
          Step 1 &mdash; Compute the contrast estimate ψ&#770;
        </h4>
        <div className="formula">
          <span className="formula-main">
            ψ&#770; = {weights.map((c, i) => {
              const sign = i === 0 ? (c >= 0 ? '' : '−') : (c >= 0 ? ' + ' : ' − ');
              const absC = Math.abs(c);
              return (
                <span key={i}>
                  {sign}{absC === 1 ? '' : absC}
                  <span style={{ color: GROUP_COLORS[i] }}>Y&#772;<sub>{GROUP_LABELS[i]}</sub></span>
                </span>
              );
            })}
          </span>
        </div>
        <div className="formula" style={{ marginTop: 'var(--spacing-xs)' }}>
          <span className="formula-main" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            = {weights.map((c, i) => {
              const sign = i === 0 ? (c >= 0 ? '' : '−') : (c >= 0 ? ' + ' : ' − ');
              const absC = Math.abs(c);
              return (
                <span key={i}>
                  {sign}({absC === 1 ? '' : `${absC} × `}{MEANS[i]})
                </span>
              );
            })}
          </span>
        </div>
        <div className="formula" style={{ marginTop: 'var(--spacing-xs)' }}>
          <span className="formula-main" style={{ fontWeight: 700 }}>
            = {psiHat}
          </span>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 'var(--spacing-xs) 0 0 0' }}>
          This single number captures the size of the difference the contrast is asking about.
        </p>
      </div>

      {/* Step 2: SS_ψ */}
      <div className="formula-box" style={{ marginBottom: 'var(--spacing-md)' }}>
        <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>
          Step 2 &mdash; Compute the contrast sum of squares: SS<sub>ψ</sub>
        </h4>
        <div className="formula">
          <span className="formula-main">
            SS<sub>ψ</sub> = <em>n</em> · ψ&#770;<sup>2</sup> / Σc<sub>j</sub><sup>2</sup>
          </span>
        </div>
        <div className="formula" style={{ marginTop: 'var(--spacing-xs)' }}>
          <span className="formula-main" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            = {N} × ({psiHat})<sup>2</sup>{' '}
            / ({weights.map((c, i) => {
              const prefix = i === 0 ? '' : ' + ';
              return <span key={i}>{prefix}({c})<sup>2</sup></span>;
            })})
          </span>
        </div>
        <div className="formula" style={{ marginTop: 'var(--spacing-xs)' }}>
          <span className="formula-main" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            = {N} × {psiHat * psiHat} / {sumC2}
          </span>
        </div>
        <div className="formula" style={{ marginTop: 'var(--spacing-xs)' }}>
          <span className="formula-main" style={{ fontWeight: 700 }}>
            = {ssPsi.toFixed(1)}
          </span>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 'var(--spacing-xs) 0 0 0' }}>
          The numerator (<em>n</em> · ψ&#770;<sup>2</sup>) scales the squared contrast by
          the sample size. The denominator (Σc<sub>j</sub><sup>2</sup> = {sumC2}) normalizes
          for the magnitude of the weights. Because a contrast always has <em>df</em> = 1,
          {' '}MS<sub>ψ</sub> = SS<sub>ψ</sub>.
        </p>
      </div>

      {/* Step 3: F_ψ */}
      <div className="formula-box" style={{ marginBottom: 'var(--spacing-md)' }}>
        <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>
          Step 3 &mdash; Form the F-ratio
        </h4>
        <div className="formula">
          <span className="formula-main">
            F<sub>ψ</sub> = MS<sub>ψ</sub> / MS<sub>S/A</sub> = SS<sub>ψ</sub> / MS<sub>S/A</sub>
          </span>
        </div>
        <div className="formula" style={{ marginTop: 'var(--spacing-xs)' }}>
          <span className="formula-main" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            = {ssPsi.toFixed(1)} / {MS_WITHIN.toFixed(2)}
          </span>
        </div>
        <div className="formula" style={{ marginTop: 'var(--spacing-xs)' }}>
          <span className="formula-main" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
            = {fPsi.toFixed(3)}
          </span>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 'var(--spacing-xs) 0 0 0' }}>
          Tested against F(1, {DF_WITHIN}) — a single focused degree of freedom.
        </p>
      </div>
    </>
  );
}

export default function ContrastTestStatistic() {
  return (
    <div className="section-intro">
      <h2>Testing a Contrast</h2>

      <p className="intro-text">
        Once you have a set of contrast weights and the group means, you have everything you
        need to build an F-statistic for that specific comparison. The entire calculation
        flows from three quantities: the weights (c<sub>j</sub>), the observed group
        means (Y&#772;<sub>j</sub>), and the sample size (<em>n</em>).
      </p>

      <p className="intro-text">
        Consider a dataset where both therapy groups outperform the wait-list control, and
        the two therapies perform about equally:
      </p>

      {/* Fixed data table */}
      <table className="anova-table" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <thead>
          <tr>
            <th>Group</th>
            <th>Y&#772;<sub>j</sub></th>
            <th><em>n</em></th>
          </tr>
        </thead>
        <tbody>
          {GROUP_LABELS.map((label, i) => (
            <tr key={i}>
              <td style={{ color: GROUP_COLORS[i], fontWeight: 600 }}>{label}</td>
              <td>{MEANS[i]}</td>
              <td>{N}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="intro-text" style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
        MS<sub>S/A</sub> = {MS_WITHIN.toFixed(2)} &nbsp;&nbsp;|&nbsp;&nbsp; <em>df</em><sub>within</sub> = {DF_WITHIN}
      </p>

      <p className="intro-text">
        We will walk through two contrasts on this same dataset. The first asks whether
        therapy works at all; the second asks whether the two therapies differ from each other.
        Watch how the same three steps produce very different F-statistics depending on which
        question the weights encode.
      </p>

      {/* Contrast 1: Therapy vs. Control */}
      <ContrastDerivation
        label="Contrast 1 — Therapy vs. Control"
        weights={W1}
        psiHat={PSI1}
        sumC2={SUM_C2_1}
        ssPsi={SS_PSI1}
        fPsi={F_PSI1}
      />

      {/* Contrast 2: CBT vs. Behavioral */}
      <ContrastDerivation
        label="Contrast 2 — CBT vs. Behavioral"
        weights={W2}
        psiHat={PSI2}
        sumC2={SUM_C2_2}
        ssPsi={SS_PSI2}
        fPsi={F_PSI2}
      />

      {/* Side-by-side comparison: both contrasts + omnibus */}
      <h3>Comparing the Three F-Statistics</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)',
      }}>
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'rgba(67, 97, 238, 0.06)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid rgba(67, 97, 238, 0.15)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Therapy vs. Control
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4361ee' }}>
            {F_PSI1.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            SS<sub>ψ</sub> = {SS_PSI1.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <em>df</em> = 1, {DF_WITHIN}
          </div>
        </div>
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'rgba(244, 162, 97, 0.06)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid rgba(244, 162, 97, 0.15)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            CBT vs. Behavioral
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f4a261' }}>
            {F_PSI2.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            SS<sub>ψ</sub> = {SS_PSI2.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <em>df</em> = 1, {DF_WITHIN}
          </div>
        </div>
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Omnibus F
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {F_OMNIBUS.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            SS<sub>A</sub> = {SS_BETWEEN.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <em>df</em> = {DF_BETWEEN}, {DF_WITHIN}
          </div>
        </div>
      </div>

      <p className="intro-text">
        The first contrast captures {(SS_PSI1 / SS_BETWEEN * 100).toFixed(1)}% of
        SS<sub>A</sub> — nearly all of the between-group variance sits in the therapy-vs.-control
        comparison. The second contrast accounts for just {(SS_PSI2 / SS_BETWEEN * 100).toFixed(1)}%.
        Together they exhaust all {DF_BETWEEN} degrees of freedom
        (SS<sub>ψ1</sub> + SS<sub>ψ2</sub> = {(SS_PSI1 + SS_PSI2).toFixed(1)} ≈ SS<sub>A</sub> = {SS_BETWEEN.toFixed(1)}).
      </p>

      <div className="key-insight">
        <h4>The Key Insight</h4>
        <p>
          To compute the F-statistic of a contrast, all you need are the group means, the
          contrast weights, and the within-group error (MS<sub>S/A</sub>). The weights
          determine <em>how</em> the group means combine into SS<sub>ψ</sub>: they specify
          exactly which part of the between-group variance your research question targets.
          The omnibus F spreads SS<sub>A</sub> across {DF_BETWEEN} degrees of freedom;
          each contrast concentrates its SS into just one. That is why a contrast can detect
          an effect even when the omnibus F does not — it directs all of its statistical
          power at a single, specific question.
        </p>
      </div>
    </div>
  );
}
