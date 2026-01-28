export default function NHSTSummary() {
  return (
    <div className="section-intro">
      <h2>The Logic of Null Hypothesis Significance Testing</h2>

      <p className="intro-text">
        We've now seen how NHST works for both one-sample and two-sample scenarios.
        Let's step back and summarize the general framework that underlies all
        significance tests.
      </p>

      <div className="key-insight">
        <h4>The Core Principle</h4>
        <p>
          NHST uses the <strong>sampling distribution</strong> to establish what we should
          expect to observe <em>if the null hypothesis is true</em>. We then compare our
          actual data to this expectation. If the data would be very unlikely under H₀,
          we reject H₀.
        </p>
      </div>

      <h3>The Four Steps of NHST</h3>

      <table className="comparison-table">
        <thead>
          <tr>
            <th>Step</th>
            <th>Description</th>
            <th>Example (Two-Sample)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. State Hypotheses</strong></td>
            <td>Define H₀ (null) and H₁ (alternative)</td>
            <td>H₀: μ₁ = μ₂ (no difference)<br />H₁: μ₁ ≠ μ₂ (difference exists)</td>
          </tr>
          <tr>
            <td><strong>2. Determine the Sampling Distribution</strong></td>
            <td>What does the test statistic look like under H₀?</td>
            <td>Under H₀, the t-statistic follows a t-distribution with appropriate df</td>
          </tr>
          <tr>
            <td><strong>3. Calculate Test Statistic</strong></td>
            <td>Compute from your data</td>
            <td>t = (X̄₂ - X̄₁) / SE<sub>diff</sub></td>
          </tr>
          <tr>
            <td><strong>4. Make a Decision</strong></td>
            <td>Compare to critical value or use p-value</td>
            <td>If p &lt; α, reject H₀</td>
          </tr>
        </tbody>
      </table>

      <h3>The Role of the Sampling Distribution</h3>

      <p className="intro-text">
        The sampling distribution is the bridge between data and inference. It answers
        the question: "If H₀ is true, what values of the test statistic are plausible,
        and what values are surprising?"
      </p>

      <div className="formula-box">
        <h3>Key Properties</h3>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">Center</span>
            <span className="explanation">
              Under H₀, the sampling distribution is centered at the null hypothesis value
              (e.g., difference = 0, or mean = claimed value).
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">Shape</span>
            <span className="explanation">
              For means, the sampling distribution approaches normality (Central Limit Theorem).
              When we estimate variability from the sample, we use the <strong>t-distribution</strong>.
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">Spread</span>
            <span className="explanation">
              The standard error (SE) determines the spread. Larger samples → smaller SE →
              easier to detect real effects.
            </span>
          </div>
        </div>
      </div>

      <h3>The t-Distribution: Key Concepts</h3>

      <p className="intro-text">
        The t-distribution is central to NHST when working with sample means:
      </p>

      <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 'var(--spacing-lg)' }}>
        <li>
          <strong>Why not the normal distribution?</strong> We use the t-distribution because
          we estimate the population standard deviation from our sample. This adds uncertainty
          that the normal distribution doesn't account for.
        </li>
        <li>
          <strong>Degrees of freedom (df)</strong> control the shape. For a one-sample test,
          df = n − 1. For two samples (Welch's test), df is calculated from both sample sizes
          and variances.
        </li>
        <li>
          <strong>Heavy tails:</strong> The t-distribution has heavier tails than the normal distribution,
          especially with small df. This means extreme values are more likely, making it
          harder to reject H₀—a built-in protection against false positives with small samples.
        </li>
        <li>
          <strong>Convergence to normal:</strong> As df increases (larger samples), the
          t-distribution approaches the standard normal distribution.
        </li>
      </ul>

      <h3>What the p-Value Really Means</h3>

      <div className="key-insight">
        <h4>Definition</h4>
        <p>
          The p-value is the probability of observing a test statistic <em>as extreme or more
          extreme</em> than the one we calculated, <strong>assuming H₀ is true</strong>.
        </p>
      </div>

      <p className="intro-text">
        A common misconception is that the p-value tells us the probability that H₀ is true.
        It does not. The p-value is a statement about the data, not about hypotheses:
      </p>

      <table className="comparison-table">
        <thead>
          <tr>
            <th>p-value is NOT</th>
            <th>p-value IS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>P(H₀ is true)</td>
            <td>P(data this extreme | H₀ true)</td>
          </tr>
          <tr>
            <td>P(H₁ is true)</td>
            <td>A measure of how surprising the data are under H₀</td>
          </tr>
          <tr>
            <td>The probability you're wrong</td>
            <td>A tool for decision-making with controlled error rates</td>
          </tr>
        </tbody>
      </table>

      <h3>Type I and Type II Errors</h3>

      <p className="intro-text">
        NHST is a decision procedure, and decisions can be wrong in two ways:
      </p>

      <table className="comparison-table">
        <thead>
          <tr>
            <th></th>
            <th>H₀ is True</th>
            <th>H₀ is False</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Reject H₀</strong></td>
            <td style={{ color: 'var(--accent)' }}>Type I Error (α)</td>
            <td style={{ color: 'var(--success, green)' }}>Correct (Power = 1-β)</td>
          </tr>
          <tr>
            <td><strong>Fail to Reject H₀</strong></td>
            <td style={{ color: 'var(--success, green)' }}>Correct</td>
            <td style={{ color: 'var(--accent)' }}>Type II Error (β)</td>
          </tr>
        </tbody>
      </table>

      <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)' }}>
        <li>
          <strong>Type I error (α):</strong> Rejecting H₀ when it's actually true (false positive).
          By setting α = 0.05, we accept a 5% false positive rate.
        </li>
        <li>
          <strong>Type II error (β):</strong> Failing to reject H₀ when it's actually false
          (missing a real effect). Power (1 − β) is increased by larger samples and larger effects.
        </li>
      </ul>

      <h3>Connecting to the Sampling Distribution Module</h3>

      <p className="intro-text">
        Everything we learned about sampling distributions directly supports NHST:
      </p>

      <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 'var(--spacing-lg)' }}>
        <li>
          The <strong>Central Limit Theorem</strong> tells us sample means are approximately
          normally distributed — enabling the use of t-tests.
        </li>
        <li>
          The <strong>Standard Error</strong> quantifies sampling variability and appears
          in the denominator of every t-statistic.
        </li>
        <li>
          <strong>Sample size effects</strong> work through SE: larger n → smaller SE
          → larger t-statistics → more power to detect effects.
        </li>
      </ul>

      <div className="key-insight" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>The Big Picture</h4>
        <p>
          NHST is a framework for making decisions about hypotheses while controlling
          the rate of false positives. The sampling distribution is the tool that makes
          this possible — it tells us what to expect by chance alone, so we can recognize
          when our data suggest something more than chance.
        </p>
      </div>
    </div>
  );
}
