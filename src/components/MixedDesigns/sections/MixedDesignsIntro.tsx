export default function MixedDesignsIntro() {
  return (
    <div className="section-intro">
      <h2>When and Why Use Mixed Designs</h2>

      <p className="intro-text">
        In the previous module, we saw how <em>within-subjects</em> designs remove individual
        differences from error, boosting statistical power. But sometimes one factor
        <strong> must</strong> be between-subjects while another can be within-subjects.
        This is where <em>mixed designs</em> (also called split-plot designs) come in.
      </p>

      <h3>A Consumer Research Example</h3>

      <p className="intro-text">
        Imagine a marketing researcher testing how different advertising appeals affect
        purchase intentions. The study examines:
      </p>

      <div className="factor-display">
        <div className="factor-box between">
          <h5>Between-Subjects</h5>
          <div className="factor-name">Ad Appeal (Factor A)</div>
          <div className="factor-levels">Emotional vs. Rational</div>
        </div>
        <div className="factor-box within">
          <h5>Within-Subjects</h5>
          <div className="factor-name">Time (Factor B)</div>
          <div className="factor-levels">Immediate vs. Delayed (1 week)</div>
        </div>
      </div>

      <p className="intro-text">
        Each participant sees <strong>one</strong> type of ad (emotional or rational)—this
        is between-subjects because showing both types would cause contamination. But the
        <em> same</em> participants are measured at <strong>both</strong> time points—this
        is within-subjects, letting us track how intentions change over time within individuals.
      </p>

      <h3>The Research Question</h3>

      <p className="intro-text">
        Do emotional appeals have stronger immediate effects that fade over time, while
        rational appeals show more persistent effects? This question requires examining the
        <strong> interaction</strong> between ad type and time—something neither a pure
        between-subjects nor a pure within-subjects design can answer efficiently.
      </p>

      <h3>Design Comparison</h3>

      <div className="design-comparison">
        <div className="design-card between">
          <h5>Fully Between</h5>
          <p>
            Different people in each cell. Would need 4 groups. Cannot track individuals
            over time.
          </p>
        </div>
        <div className="design-card within">
          <h5>Fully Within</h5>
          <p>
            Same people see all conditions. Not possible here—can't "unsee" an ad to
            view the other type.
          </p>
        </div>
        <div className="design-card mixed">
          <h5>Mixed Design</h5>
          <p>
            Between-subjects where needed (ad type), within-subjects where possible (time).
            Most efficient design.
          </p>
        </div>
      </div>

      <h3>Our Example Data</h3>

      <p className="intro-text">
        We'll work with data from 8 participants (4 per ad type), each measured twice.
        Purchase intention is rated on a 1-7 scale.
      </p>

      <div className="viz-container">
        <h4>Ad Appeal Study Data</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th className="between-header">Ad Appeal</th>
              <th className="within-header">Immediate</th>
              <th className="within-header">Delayed</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>S1</td>
              <td className="group-emotional">Emotional</td>
              <td>6.4</td>
              <td>5.2</td>
            </tr>
            <tr>
              <td>S2</td>
              <td className="group-emotional">Emotional</td>
              <td>5.4</td>
              <td>3.0</td>
            </tr>
            <tr>
              <td>S3</td>
              <td className="group-emotional">Emotional</td>
              <td>6.6</td>
              <td>4.2</td>
            </tr>
            <tr>
              <td>S4</td>
              <td className="group-emotional">Emotional</td>
              <td>5.6</td>
              <td>4.4</td>
            </tr>
            <tr>
              <td>S5</td>
              <td className="group-rational">Rational</td>
              <td>4.4</td>
              <td>4.6</td>
            </tr>
            <tr>
              <td>S6</td>
              <td className="group-rational">Rational</td>
              <td>3.4</td>
              <td>5.2</td>
            </tr>
            <tr>
              <td>S7</td>
              <td className="group-rational">Rational</td>
              <td>4.4</td>
              <td>5.2</td>
            </tr>
            <tr>
              <td>S8</td>
              <td className="group-rational">Rational</td>
              <td>3.8</td>
              <td>5.0</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="intro-text">
        Notice the pattern: emotional appeals start high (mean = 6.0) but drop substantially
        by one week (mean = 4.2). Rational appeals start lower (mean = 4.0) but increase
        over time (mean = 5.0). The lines cross—the effect of time reverses depending on
        ad type. This is a classic interaction effect.
      </p>

      <div className="key-insight">
        <h4>The Core Advantage</h4>
        <p>
          Mixed designs give us the best of both worlds: we can study factors that must be
          between-subjects while still gaining the power advantage of within-subjects
          measurement where possible. The within-subjects portion (Time) will have a smaller
          error term than if we had used a fully between-subjects design.
        </p>
      </div>

      <h3>What's Coming</h3>

      <p className="intro-text">
        In the sections that follow, we'll explore:
      </p>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>How variance is partitioned into 5 components in mixed designs</li>
        <li>Why different effects use different error terms</li>
        <li>How to interpret the A×B interaction (ad type × time)</li>
        <li>Brief notes on sphericity assumptions</li>
      </ul>
    </div>
  );
}
