export default function NHSTIntro() {
  return (
    <div className="section-intro">
      <h2>From Sampling to Inference</h2>

      <p className="intro-text">
        In the previous module, you learned that sample means follow a predictable pattern:
        they form a <strong>sampling distribution</strong> centered on the population mean.
        This distribution tells us exactly how sample means should behave — how much they
        should vary, and how likely any particular value is.
      </p>

      <p className="intro-text">
        This predictability is the foundation of <strong>null hypothesis significance testing (NHST)</strong>.
        The key insight is simple but powerful: if we know what should happen when nothing
        special is going on, we can detect when something <em>is</em> going on.
      </p>

      <div className="key-insight">
        <h4>The Core Logic of NHST</h4>
        <p>
          The sampling distribution represents what we expect to see <strong>if the null
          hypothesis is true</strong>. When we observe data, we ask: "How surprising is this
          result under the null?" If it's very surprising (unlikely to occur by chance),
          we have evidence against the null hypothesis.
        </p>
      </div>

      <p className="intro-text" style={{ marginTop: 'var(--spacing-lg)' }}>
        In the sections that follow, we'll formalize this logic using the <strong>t-statistic</strong> and
        the <strong>t-distribution</strong>, which tell us exactly how to quantify "how surprising"
        an observation is.
      </p>
    </div>
  );
}
