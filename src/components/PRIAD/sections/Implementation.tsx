export default function Implementation() {
  return (
    <div className="section-intro">
      <h2>Implementing PRIADs</h2>

      <p className="intro-text">
        Ready to use PRIADs in your own research? This section provides practical guidance
        on pre-registration requirements and a step-by-step implementation guide.
      </p>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Ensuring the Validity of PRIADs</h3>

      <p style={{ lineHeight: 1.7 }}>
        For a PRIAD to be valid, you must add the following elements to your pre-registration:
      </p>

      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
      }}>
        <ol style={{ lineHeight: 1.8, marginBottom: 0 }}>
          <li style={{ marginBottom: 'var(--spacing-sm)' }}>
            <strong>How many observations will you, at most, collect?</strong> This can be
            determined by budget constraints, or by a power analysis based on your Smallest
            Effect Size of Interest.
          </li>
          <li style={{ marginBottom: 'var(--spacing-sm)' }}>
            <strong>How many times will you peek, and when?</strong> Frequent peeks sacrifice
            some power at the end, but have the opportunity to save more money.
          </li>
          <li>
            <strong>Which threshold type: Pocock or O'Brien-Fleming?</strong> Pocock gives you
            higher chances of stopping early; O'Brien-Fleming gives you more power to detect
            an effect at the end.
          </li>
        </ol>
      </div>

      <p style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}>
        As with a regular pre-registration, you must of course specify your independent and
        dependent variables, and how you are planning to analyze the data.
      </p>

      <div className="key-insight warning-box" style={{ marginTop: 'var(--spacing-lg)' }}>
        <h4>Critical Requirement</h4>
        <p>
          The PRIAD plan must be registered and time-stamped <em>before</em> any data is collected.
          Deciding on the number of stages or threshold values after seeing data defeats the
          entire purpose of the adjusted thresholds.
        </p>
      </div>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Step-by-Step Implementation</h3>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
      }}>
        <ol style={{ lineHeight: 1.8, marginBottom: 0 }}>
          <li style={{ marginBottom: 'var(--spacing-md)' }}>
            <strong>Pre-register your PRIAD:</strong> Document all details before collecting any data
          </li>
          <li style={{ marginBottom: 'var(--spacing-md)' }}>
            <strong>Collect Stage 1:</strong> Run first batch of participants
          </li>
          <li style={{ marginBottom: 'var(--spacing-md)' }}>
            <strong>Interim Analysis:</strong> Test hypothesis and compare p to Stage 1 threshold
          </li>
          <li style={{ marginBottom: 'var(--spacing-md)' }}>
            <strong>Decision:</strong> If p &lt; threshold, stop and report. Otherwise, continue
            to next stage.
          </li>
          <li>
            <strong>Repeat:</strong> Continue until significance is reached or final stage
            is completed
          </li>
        </ol>
      </div>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Reporting Results</h3>

      <p style={{ lineHeight: 1.7 }}>
        When reporting PRIAD results, include:
      </p>

      <ul style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.8 }}>
        <li>
          The PRIAD design used (e.g., "3-stage Pocock design")
        </li>
        <li>
          Sample size at each stage and at stopping
        </li>
        <li>
          The p-value at each interim analysis
        </li>
        <li>
          The threshold at each stage
        </li>
        <li>
          The stage at which the study stopped (and why)
        </li>
        <li>
          A link to the pre-registration
        </li>
      </ul>

      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-lg)',
        fontStyle: 'italic',
      }}>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          <strong>Example:</strong> "We used a pre-registered 2-stage O'Brien-Fleming PRIAD
          design (OSF: [link]). At Stage 1 (n = 30 per group), we observed p = .003, which
          exceeded the Stage 1 threshold (α₁ = .0052). At Stage 2 (n = 60 per group),
          we observed p = .012, which was below the Stage 2 threshold (α₂ = .048),
          so we stopped and rejected the null hypothesis."
        </p>
      </div>

      <div className="key-insight success-box" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>Summary</h4>
        <p>
          PRIADs offer a principled way to collect data efficiently while maintaining statistical
          rigor. By pre-registering adjusted thresholds, you can:
        </p>
        <ul style={{ marginTop: 'var(--spacing-sm)', marginBottom: 0 }}>
          <li>Stop early when effects are strong, saving resources</li>
          <li>Maintain exactly α = .05 Type I error rate</li>
          <li>Report results transparently and credibly</li>
        </ul>
      </div>
    </div>
  );
}
