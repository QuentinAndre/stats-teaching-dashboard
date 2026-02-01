export default function TheFRatio() {
  return (
    <div className="section-intro">
      <h2>Signal vs. Noise: The F-Statistic</h2>

      <p className="intro-text">
        We've partitioned variance into SS<sub>A</sub> and SS<sub>S/A</sub>.
        But raw sums of squares can't be directly compared—they depend on sample size
        and number of groups. To make a fair comparison, we convert them to <strong>Mean Squares</strong>.
      </p>

      <div className="formula-box">
        <h3>From Sums of Squares to Mean Squares</h3>
        <div className="formula">
          <span className="formula-main">MS = SS / df</span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">MS<sub>A</sub></span>
            <span className="explanation">
              SS<sub>A</sub> / (a − 1), where a = number of groups
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">MS<sub>S/A</sub></span>
            <span className="explanation">
              SS<sub>S/A</sub> / (N − a), where N = total sample size
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">F</span>
            <span className="explanation">
              MS<sub>A</sub> / MS<sub>S/A</sub> — the ratio of between-group to within-group variance
            </span>
          </div>
        </div>
      </div>

      <p className="intro-text">
        The F-ratio tells us: <strong>"How many times larger is the between-group variance
        than the within-group variance?"</strong>
      </p>

      <div className="key-insight">
        <h4>Understanding the F-Ratio</h4>
        <p>
          Under H₀ (no group differences), both MS<sub>A</sub> and MS<sub>S/A</sub>
          estimate the same thing: the population variance σ². So F should be around 1.
          When groups truly differ, MS<sub>A</sub> is inflated by the group differences,
          making F larger than 1. The bigger F gets, the stronger the evidence against H₀.
        </p>
      </div>
    </div>
  );
}
