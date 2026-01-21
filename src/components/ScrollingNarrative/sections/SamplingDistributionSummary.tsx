import './SamplingDistributionSummary.css';

export default function SamplingDistributionSummary() {
  return (
    <section className="narrative-section sampling-summary">
      <h2>Putting It All Together: The Sampling Distribution</h2>

      <div className="summary-content">
        <p className="key-insight">
          The simulations above demonstrate a remarkable fact: <strong>the behavior of means
          calculated from random samples is entirely predictable</strong>, regardless of
          the shape of the population they come from.
        </p>

        <div className="convergence-box">
          <h3>What Sample Means Converge To</h3>
          <p>
            When you repeatedly draw samples of size <em>n</em> from a population and calculate
            their means, those sample means will form a distribution that is:
          </p>
          <ul>
            <li><strong>Centered at the population mean (μ)</strong> — sample means are unbiased estimators of the true mean</li>
            <li><strong>Narrower than the original population</strong> — averaging reduces variability</li>
            <li><strong>Predictably shaped</strong> — even if the population is not normal, the distribution of means sampled from this population becomes bell-shaped</li>
          </ul>
        </div>

        <div className="clt-box">
          <h3>The Central Limit Theorem</h3>
          <p>
            The remarkable pattern you observed above is formalized in one of the most important
            results in statistics: the <strong>Central Limit Theorem (CLT)</strong>.
          </p>
          <div className="theorem-statement">
            <p>
              <strong>Central Limit Theorem:</strong> As the sample size <em>n</em> increases, the
              distribution of the sample mean <span className="math">X̄</span> converges in distribution
              to a normal distribution, regardless of the shape of the original population:
            </p>
            <div className="formula">
              <span className="formula-main">X̄ → N(μ, σ²/n)</span>
            </div>
          </div>
          <div className="clt-implications">
            <h4>Key Implications</h4>
            <ul>
              <li>
                <strong>Universality:</strong> The CLT applies to any population with finite mean and
                variance — normal, skewed, uniform, or otherwise. This universality makes it the
                workhorse of statistical inference.
              </li>
              <li>
                <strong>Convergence rate:</strong> The convergence to normality depends on the original
                population's shape. Symmetric distributions converge quickly (n ≈ 15-20 is often sufficient),
                while heavily skewed distributions may require larger samples (n ≥ 30 or more).
              </li>
              <li>
                <strong>Practical interpretation:</strong> Even when we don't know the population's
                distribution, we can still make probabilistic statements about sample means — because
                we know they will be approximately normally distributed for sufficiently large samples.
              </li>
            </ul>
          </div>
        </div>

        <div className="formula-box">
          <h3>The Standard Error Formula</h3>
          <p>The spread of the sampling distribution is quantified by the <strong>Standard Error (SE)</strong>:</p>

          <div className="formula">
            <span className="formula-main">SE = σ / √n</span>
          </div>

          <div className="formula-parts">
            <div className="formula-part">
              <span className="symbol">SE</span>
              <span className="explanation">
                <strong>Standard Error</strong> — the standard deviation of the sampling distribution.
                This tells you how much sample means typically vary from the true population mean.
              </span>
            </div>

            <div className="formula-part">
              <span className="symbol">σ</span>
              <span className="explanation">
                <strong>Population Standard Deviation</strong> — the variability in the original population.
                More heterogeneous populations (larger σ) produce more variable sample means.
              </span>
            </div>

            <div className="formula-part">
              <span className="symbol">√n</span>
              <span className="explanation">
                <strong>Square Root of Sample Size</strong> — larger samples produce more precise estimates.
                Note the square root: to halve the SE, you must quadruple the sample size.
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
