export default function PreRegistration() {
  return (
    <div className="section-intro">
      <h2>Pre-Registration as a Solution</h2>

      <p className="intro-text">
        The fundamental problem with p-hacking is that researchers make analytic decisions
        <em> after</em> seeing their data. When you know what the data look like, it's
        easy—even unintentionally—to choose analyses that favor significant results.
        Pre-registration solves this by requiring researchers to commit to their analysis
        plan <em>before</em> collecting or analyzing data.
      </p>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>What a Pre-Registration Must Specify</h3>

      <p style={{ lineHeight: 1.7 }}>
        A pre-registration must lock in every decision that could be exploited as a
        researcher degree of freedom. Each element below corresponds to a specific
        type of flexibility that inflates false-positive rates:
      </p>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-lg)',
      }}>
        <h4 style={{ margin: '0 0 var(--spacing-md)', color: 'var(--primary)' }}>
          1. Sample Size and Stopping Rule
        </h4>
        <p style={{ margin: '0 0 var(--spacing-sm)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <strong>Prevents:</strong> Optional stopping (peeking at data and stopping when p &lt; .05)
        </p>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', lineHeight: 1.7 }}>
          <li>Specify your target sample size in advance</li>
          <li>Define exactly when data collection will end</li>
          <li>State whether any interim analyses are planned</li>
        </ul>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
      }}>
        <h4 style={{ margin: '0 0 var(--spacing-md)', color: 'var(--primary)' }}>
          2. Conditions to Be Analyzed
        </h4>
        <p style={{ margin: '0 0 var(--spacing-sm)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <strong>Prevents:</strong> Dropping conditions that don't show the expected effect
        </p>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', lineHeight: 1.7 }}>
          <li>List all experimental conditions</li>
          <li>Specify which comparisons will be tested</li>
        </ul>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
      }}>
        <h4 style={{ margin: '0 0 var(--spacing-md)', color: 'var(--primary)' }}>
          3. Dependent Variables
        </h4>
        <p style={{ margin: '0 0 var(--spacing-sm)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <strong>Prevents:</strong> Outcome switching (reporting whichever DV is significant)
        </p>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', lineHeight: 1.7 }}>
          <li>Define your dependent variable(s) precisely</li>
          <li>If multiple DVs, specify which is primary</li>
          <li>State how composite measures will be computed</li>
        </ul>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
      }}>
        <h4 style={{ margin: '0 0 var(--spacing-md)', color: 'var(--primary)' }}>
          4. Covariates
        </h4>
        <p style={{ margin: '0 0 var(--spacing-sm)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <strong>Prevents:</strong> Adding covariates post-hoc to change results
        </p>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', lineHeight: 1.7 }}>
          <li>List any covariates you will include in analyses</li>
          <li>Justify why each covariate is included</li>
        </ul>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
      }}>
        <h4 style={{ margin: '0 0 var(--spacing-md)', color: 'var(--primary)' }}>
          5. Exclusion Criteria
        </h4>
        <p style={{ margin: '0 0 var(--spacing-sm)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <strong>Prevents:</strong> Selectively excluding participants to change results
        </p>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', lineHeight: 1.7 }}>
          <li>Define outlier detection rules (e.g., ±3 SD)</li>
          <li>Specify attention check criteria</li>
          <li>List any other exclusion criteria</li>
        </ul>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
      }}>
        <h4 style={{ margin: '0 0 var(--spacing-md)', color: 'var(--primary)' }}>
          6. Statistical Analysis
        </h4>
        <p style={{ margin: '0 0 var(--spacing-sm)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <strong>Prevents:</strong> Trying multiple tests and reporting what works
        </p>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', lineHeight: 1.7 }}>
          <li>Specify your statistical test(s)</li>
          <li>State your alpha level</li>
          <li>Describe any corrections for multiple comparisons</li>
          <li>Specify any data transformations (e.g., log transform)</li>
        </ul>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
      }}>
        <h4 style={{ margin: '0 0 var(--spacing-md)', color: 'var(--primary)' }}>
          7. Subgroup Analyses
        </h4>
        <p style={{ margin: '0 0 var(--spacing-sm)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <strong>Prevents:</strong> Reporting whichever subgroup shows the effect
        </p>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', lineHeight: 1.7 }}>
          <li>List any planned subgroup analyses (e.g., by gender, age)</li>
          <li>If none planned, state that explicitly</li>
        </ul>
      </div>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Where to Pre-Register</h3>

      <ul style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.8 }}>
        <li>
          <strong>OSF (Open Science Framework)</strong> — osf.io
        </li>
        <li>
          <strong>AsPredicted</strong> — aspredicted.org
        </li>
      </ul>

      <div className="key-insight" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>The Key Principle</h4>
        <p>
          Every decision listed above is a potential researcher degree of freedom.
          By specifying each one in advance, you eliminate the flexibility that
          allows false positives to accumulate. What you cannot change, you cannot
          exploit—intentionally or not.
        </p>
      </div>
    </div>
  );
}
