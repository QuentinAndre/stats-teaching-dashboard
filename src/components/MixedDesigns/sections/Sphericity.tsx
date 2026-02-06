import { Link } from 'react-router-dom';

export default function Sphericity() {
  return (
    <div className="section-intro">
      <h2>Sphericity in Mixed Designs</h2>

      <p className="intro-text">
        The <em>sphericity</em> assumption we discussed in the{' '}
        <Link to="/within-subjects#sphericity" style={{ color: 'var(--color-within)' }}>
          Within-Subjects module
        </Link>{' '}
        also applies to the within-subjects portion of mixed designs.
      </p>

      <h3>Which Effects Are Affected?</h3>

      <p className="intro-text">
        In a mixed design, sphericity applies to effects tested with the within-subjects
        error term (MS<sub>B×S/A</sub>):
      </p>

      <div className="viz-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Effect</th>
              <th>Error Term</th>
              <th>Sphericity Applies?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 500 }}>Ad Appeal (A)</td>
              <td>MS<sub>S/A</sub></td>
              <td style={{ color: 'var(--text-secondary)' }}>No — between-subjects</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 500 }}>Time (B)</td>
              <td>MS<sub>B×S/A</sub></td>
              <td style={{ color: 'var(--color-within)' }}>Yes — if 3+ levels</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 500 }}>A × B</td>
              <td>MS<sub>B×S/A</sub></td>
              <td style={{ color: 'var(--color-within)' }}>Yes — if 3+ levels of B</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Good News for Our Example</h3>

      <p className="intro-text">
        In our Ad Appeal study, the within-subjects factor (Time) has only <strong>two
        levels</strong>: Immediate and Delayed. With two levels, there's only one possible
        difference score (Immediate − Delayed), so sphericity is automatically satisfied.
        No correction is needed.
      </p>

      <div className="key-insight">
        <h4>When You Need to Check</h4>
        <p>
          If your within-subjects factor has <strong>three or more levels</strong> (e.g.,
          Time 1, Time 2, Time 3), you should test sphericity using Mauchly's test and
          apply Greenhouse-Geisser or Huynh-Feldt corrections if violated. See the{' '}
          <Link to="/within-subjects#sphericity" style={{ color: 'var(--color-within)' }}>
            Within-Subjects module
          </Link>{' '}
          for details on these corrections.
        </p>
      </div>

      <h3>The Between-Subjects Factor</h3>

      <p className="intro-text">
        Sphericity only concerns the within-subjects portion of the design. The between-subjects
        factor (Ad Appeal) doesn't involve repeated measures on the same subjects, so
        sphericity doesn't apply to it. The test for Factor A uses MS<sub>S/A</sub> as its
        error term, which has different assumptions (primarily homogeneity of variance across
        groups).
      </p>

      <h3>Summary of Assumptions</h3>

      <div className="viz-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Effect</th>
              <th>Error Term</th>
              <th>Key Assumptions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 500 }}>Ad Appeal (A)</td>
              <td>MS<sub>S/A</sub></td>
              <td style={{ textAlign: 'left', fontSize: '0.875rem' }}>
                Homogeneity of variance across groups, normality
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 500 }}>Time (B)</td>
              <td>MS<sub>B×S/A</sub></td>
              <td style={{ textAlign: 'left', fontSize: '0.875rem' }}>
                Sphericity (if 3+ levels), normality
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 500 }}>A × B</td>
              <td>MS<sub>B×S/A</sub></td>
              <td style={{ textAlign: 'left', fontSize: '0.875rem' }}>
                Sphericity (if 3+ levels), normality
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
