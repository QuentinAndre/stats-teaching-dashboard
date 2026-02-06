export default function AdjustedThresholds() {
  return (
    <div className="section-intro">
      <h2>Adjusted Significance Thresholds</h2>

      <p className="intro-text">
        The solution to the peeking problem is straightforward: use <em>stricter</em> significance
        thresholds at each interim analysis. By requiring stronger evidence at each look, we
        maintain the overall Type I error rate at exactly α = 0.05.
      </p>

      <p style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}>
        Two main approaches have been developed, each with different trade-offs:
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)' }}>
        <div>
          <h4 style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-sm)' }}>Pocock</h4>
          <ul style={{ lineHeight: 1.7 }}>
            <li>Same threshold at every stage</li>
            <li>Easier to explain and apply</li>
            <li>Higher chance of early stopping</li>
            <li>Slightly lower power at final stage</li>
          </ul>
        </div>
        <div>
          <h4 style={{ color: 'var(--accent)', marginBottom: 'var(--spacing-sm)' }}>O'Brien-Fleming</h4>
          <ul style={{ lineHeight: 1.7 }}>
            <li>Very strict early, lenient late</li>
            <li>Final threshold near .05</li>
            <li>Early stopping only with strong effects</li>
            <li>Preserves nearly full power at final stage</li>
          </ul>
        </div>
      </div>

      <div className="key-insight" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>Both Maintain α = .05</h4>
        <p>
          Despite their different threshold patterns, both Pocock and O'Brien-Fleming boundaries
          guarantee that the probability of a false positive (when H₀ is true) is exactly 5%
          across all stages combined. The trade-off is between early stopping probability and
          final-stage power.
        </p>
      </div>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Threshold Reference Table</h3>

      <p style={{ lineHeight: 1.7 }}>
        Here are the exact thresholds from André & Reinholtz for different PRIAD configurations:
      </p>

      <table className="threshold-table">
        <thead>
          <tr>
            <th>PRIAD Type</th>
            <th>Stage 1</th>
            <th>Stage 2</th>
            <th>Stage 3</th>
            <th>Stage 4</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="row-label">2-Stage Pocock</td>
            <td className="pocock">.0294</td>
            <td className="pocock">.0294</td>
            <td>—</td>
            <td>—</td>
          </tr>
          <tr>
            <td className="row-label">3-Stage Pocock</td>
            <td className="pocock">.022</td>
            <td className="pocock">.022</td>
            <td className="pocock">.022</td>
            <td>—</td>
          </tr>
          <tr>
            <td className="row-label">4-Stage Pocock</td>
            <td className="pocock">.0182</td>
            <td className="pocock">.0182</td>
            <td className="pocock">.0182</td>
            <td className="pocock">.0182</td>
          </tr>
          <tr>
            <td className="row-label">2-Stage O'Brien-Fleming</td>
            <td className="obf">.0052</td>
            <td className="obf">.048</td>
            <td>—</td>
            <td>—</td>
          </tr>
          <tr>
            <td className="row-label">3-Stage O'Brien-Fleming</td>
            <td className="obf">.0005</td>
            <td className="obf">.0137</td>
            <td className="obf">.0452</td>
            <td>—</td>
          </tr>
          <tr>
            <td className="row-label">4-Stage O'Brien-Fleming</td>
            <td className="obf">.0001</td>
            <td className="obf">.0042</td>
            <td className="obf">.0194</td>
            <td className="obf">.0429</td>
          </tr>
        </tbody>
      </table>

      <div className="key-insight success-box" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>Why This Works</h4>
        <p>
          The thresholds are calculated using sequential analysis theory to ensure that the
          cumulative probability of rejection under the null hypothesis equals exactly α = .05.
          By "spending" some of your alpha at each interim look, you control the family-wise
          error rate across all analyses.
        </p>
      </div>
    </div>
  );
}
