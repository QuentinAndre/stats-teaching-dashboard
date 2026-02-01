import { useMemo } from 'react';

export default function FactorialIntro() {
  // Cell means from Petty et al. study pattern
  const cellMeans = useMemo(() => ({
    highStrong: 7,
    highWeak: 3,
    lowStrong: 5,
    lowWeak: 5,
  }), []);

  // Calculate marginal means
  const marginalMeans = useMemo(() => ({
    highInvolvement: (cellMeans.highStrong + cellMeans.highWeak) / 2,
    lowInvolvement: (cellMeans.lowStrong + cellMeans.lowWeak) / 2,
    strongArgs: (cellMeans.highStrong + cellMeans.lowStrong) / 2,
    weakArgs: (cellMeans.highWeak + cellMeans.lowWeak) / 2,
    grand: (cellMeans.highStrong + cellMeans.highWeak + cellMeans.lowStrong + cellMeans.lowWeak) / 4,
  }), [cellMeans]);

  return (
    <div className="section-intro">
      <h2>Why Factorial Designs?</h2>

      <p className="intro-text">
        In the previous module, we learned how one-way ANOVA compares means across levels
        of a <em>single</em> factor. But real-world phenomena often involve <strong>multiple
        factors</strong> acting simultaneously. Factorial designs let us study how these
        factors combine—and whether their effects depend on each other.
      </p>

      <div className="key-insight">
        <h4>The Central Question</h4>
        <p>
          Does the effect of one factor <strong>depend on</strong> the level of another factor?
          This dependency is called an <strong>interaction</strong>, and factorial designs
          are the only way to detect it.
        </p>
      </div>

      <h3>A Classic Example: Petty, Cacioppo & Schumann (1983)</h3>

      <p className="intro-text">
        In one of the most cited studies in consumer psychology, researchers examined how
        people process persuasive messages. They showed participants an advertisement for
        a new product and measured their attitudes afterward.
      </p>

      <p className="intro-text">
        The study manipulated two factors:
      </p>

      <div className="factor-cards">
        <div className="factor-card factor-a">
          <h4>Factor A: Involvement</h4>
          <div className="factor-levels">
            <span className="level"><strong>High:</strong> Product available locally soon</span>
            <span className="level"><strong>Low:</strong> Product available in distant city</span>
          </div>
        </div>
        <div className="factor-card factor-b">
          <h4>Factor B: Argument Quality</h4>
          <div className="factor-levels">
            <span className="level"><strong>Strong:</strong> Compelling, logical arguments</span>
            <span className="level"><strong>Weak:</strong> Superficial, unconvincing arguments</span>
          </div>
        </div>
      </div>

      <h3>The 2×2 Design</h3>

      <p className="intro-text">
        Crossing these two factors creates four experimental conditions. Each participant
        was randomly assigned to one cell:
      </p>

      <div className="cell-means-table">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Strong Arguments</th>
              <th>Weak Arguments</th>
              <th className="col-marginal">Row Mean</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>High Involvement</th>
              <td className="cell-value">{cellMeans.highStrong.toFixed(1)}</td>
              <td className="cell-value">{cellMeans.highWeak.toFixed(1)}</td>
              <td className="marginal-value">{marginalMeans.highInvolvement.toFixed(1)}</td>
            </tr>
            <tr>
              <th>Low Involvement</th>
              <td className="cell-value">{cellMeans.lowStrong.toFixed(1)}</td>
              <td className="cell-value">{cellMeans.lowWeak.toFixed(1)}</td>
              <td className="marginal-value">{marginalMeans.lowInvolvement.toFixed(1)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th>Column Mean</th>
              <td className="marginal-value">{marginalMeans.strongArgs.toFixed(1)}</td>
              <td className="marginal-value">{marginalMeans.weakArgs.toFixed(1)}</td>
              <td className="grand-mean">{marginalMeans.grand.toFixed(1)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="intro-text">
        Notice something interesting in the cell means: under <strong>high involvement</strong>,
        argument quality makes a big difference (7.0 vs 3.0). But under <strong>low involvement</strong>,
        the difference nearly disappears (5.0 vs 5.0). This pattern suggests an <em>interaction</em> between
        the two factors.
      </p>

      <div className="formula-box">
        <h3>The 2×2 Factorial Structure</h3>
        <div className="formula">
          <span className="formula-main">2 × 2 = 4 cells</span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">Factor A</span>
            <span className="explanation">
              2 levels (High vs. Low Involvement)
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">Factor B</span>
            <span className="explanation">
              2 levels (Strong vs. Weak Arguments)
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">n per cell</span>
            <span className="explanation">
              4 participants in each condition (16 total)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
