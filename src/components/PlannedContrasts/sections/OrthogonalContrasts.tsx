import { useState, useMemo, useCallback } from 'react';
import {
  oneWayANOVA,
  calculateGroupStatistics,
  contrastFTest,
  areContrastsOrthogonal,
  validateContrastWeights,
} from '../../../utils/statistics';

const GROUP_LABELS = ['CBT', 'Behavioral', 'Wait-list'];
const GROUP_COLORS = ['#4361ee', '#f4a261', '#e63946'];

export default function OrthogonalContrasts() {
  const [groupMeans, setGroupMeans] = useState([85, 79, 68]);
  const [withinSD] = useState(12);
  const [sampleSize] = useState(15);
  const [dataSeed, setDataSeed] = useState(1);

  const [weights1, setWeights1] = useState([1, 1, -2]);
  const [weights2, setWeights2] = useState([1, -1, 0]);

  const groups = useMemo(() => {
    const seedRandom = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
    };

    const generateSeededNormal = (n: number, mean: number, sd: number, seed: number): number[] => {
      const rand = seedRandom(seed);
      const values: number[] = [];
      for (let i = 0; i < n; i++) {
        const u1 = rand();
        const u2 = rand();
        const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
        values.push(mean + sd * z);
      }
      return values;
    };

    return Array.from({ length: 3 }, (_, i) =>
      generateSeededNormal(sampleSize, groupMeans[i], withinSD, dataSeed * (i + 1) * 1000)
    );
  }, [groupMeans, withinSD, sampleSize, dataSeed]);

  const anova = useMemo(() => oneWayANOVA(groups), [groups]);
  const stats = useMemo(() => calculateGroupStatistics(groups), [groups]);
  const observedMeans = stats.means;

  const validation1 = useMemo(() => validateContrastWeights(weights1), [weights1]);
  const validation2 = useMemo(() => validateContrastWeights(weights2), [weights2]);

  const orthogonality = useMemo(
    () => areContrastsOrthogonal(weights1, weights2),
    [weights1, weights2]
  );

  const contrast1 = useMemo(
    () => contrastFTest(weights1, observedMeans, sampleSize, anova.msWithin, anova.dfWithin),
    [weights1, observedMeans, sampleSize, anova.msWithin, anova.dfWithin]
  );

  const contrast2 = useMemo(
    () => contrastFTest(weights2, observedMeans, sampleSize, anova.msWithin, anova.dfWithin),
    [weights2, observedMeans, sampleSize, anova.msWithin, anova.dfWithin]
  );

  const regenerateData = useCallback(() => {
    setDataSeed((s) => s + 1);
  }, []);

  const updateGroupMean = (index: number, value: number) => {
    setGroupMeans((prev) => {
      const newMeans = [...prev];
      newMeans[index] = value;
      return newMeans;
    });
  };

  const handleWeight1Change = (index: number, value: string) => {
    const parsed = parseFloat(value);
    setWeights1((prev) => {
      const newWeights = [...prev];
      newWeights[index] = isNaN(parsed) ? 0 : parsed;
      return newWeights;
    });
  };

  const handleWeight2Change = (index: number, value: string) => {
    const parsed = parseFloat(value);
    setWeights2((prev) => {
      const newWeights = [...prev];
      newWeights[index] = isNaN(parsed) ? 0 : parsed;
      return newWeights;
    });
  };

  const loadPreset = () => {
    setWeights1([1, 1, -2]);
    setWeights2([1, -1, 0]);
  };

  // SS partition data
  const ssPartition = useMemo(() => {
    const ssA = anova.ssBetween;
    const ss1 = contrast1.ssContrast;
    const ss2 = contrast2.ssContrast;

    if (ssA <= 0) return { ss1Pct: 0, ss2Pct: 0, remainderPct: 0, overlapPct: 0, sumsToSS: false };

    const sumSS = ss1 + ss2;
    const sumsToSS = Math.abs(sumSS - ssA) < 0.1 * ssA + 0.01;

    if (orthogonality.isOrthogonal && validation1.isValid && validation2.isValid) {
      // Orthogonal: clean partition
      const ss1Pct = (ss1 / ssA) * 100;
      const ss2Pct = (ss2 / ssA) * 100;
      // Small rounding correction
      const remainder = Math.max(0, 100 - ss1Pct - ss2Pct);
      return { ss1Pct, ss2Pct, remainderPct: remainder, overlapPct: 0, sumsToSS };
    } else {
      // Non-orthogonal: show overlap
      if (sumSS <= ssA) {
        const ss1Pct = (ss1 / ssA) * 100;
        const ss2Pct = (ss2 / ssA) * 100;
        const remainder = Math.max(0, 100 - ss1Pct - ss2Pct);
        return { ss1Pct, ss2Pct, remainderPct: remainder, overlapPct: 0, sumsToSS };
      } else {
        // Overlapping: SS values exceed SS_A
        const overlap = sumSS - ssA;
        const overlapPct = (overlap / ssA) * 100;
        const ss1Pct = Math.min((ss1 / ssA) * 100, 100);
        const ss2Pct = Math.min((ss2 / ssA) * 100, 100 - ss1Pct);
        return { ss1Pct, ss2Pct, remainderPct: 0, overlapPct, sumsToSS };
      }
    }
  }, [anova.ssBetween, contrast1.ssContrast, contrast2.ssContrast, orthogonality.isOrthogonal, validation1.isValid, validation2.isValid]);

  return (
    <div className="section-intro">
      <h2>Orthogonal Contrasts</h2>

      <p className="intro-text">
        Two contrasts are <strong>orthogonal</strong> when their dot product equals zero:
      </p>

      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">
            Σ c<sub>j</sub> · d<sub>j</sub> = 0
          </span>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
          (for equal n; with unequal n, use Σ c<sub>j</sub> d<sub>j</sub> / n<sub>j</sub> = 0)
        </p>
      </div>

      <p className="intro-text">
        Orthogonality means the two contrasts are <em>statistically independent</em>: they
        address non-overlapping questions about the data. With <em>k</em> groups, you can
        define at most <em>k</em> - 1 orthogonal contrasts. Together, they completely decompose
        SS<sub>A</sub> -- each contrast accounts for a unique portion of the between-group
        variance, and their SS values sum exactly to SS<sub>A</sub>.
      </p>

      <p className="intro-text">
        The two contrasts that we have previously discussed were orthogonal, which is why they
        perfectly decomposed the total variance into two parts. Use the tool below to define
        contrasts, and check what happens when they are orthogonal (vs. not).
      </p>

      <div className="viz-container">
        <h4>Orthogonality Checker</h4>

        {/* Data controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-sm)',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--border-radius-md)',
          marginBottom: 'var(--spacing-md)',
        }}>
          {GROUP_LABELS.map((label, i) => (
            <div key={i} className="control-group" style={{ gap: '2px', flex: 1 }}>
              <label style={{ color: GROUP_COLORS[i], fontWeight: 600, fontSize: '0.8125rem' }}>
                {label}
              </label>
              <input type="range" min="50" max="100" value={groupMeans[i]}
                onChange={(e) => updateGroupMean(i, parseInt(e.target.value))} />
              <span className="control-value">{groupMeans[i]}</span>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button className="primary-button" onClick={regenerateData} style={{ whiteSpace: 'nowrap' }}>
              New Data
            </button>
            <button className="primary-button" onClick={loadPreset}
              style={{ whiteSpace: 'nowrap', background: '#6c757d', fontSize: '0.75rem', padding: '4px 8px' }}>
              Reset Weights
            </button>
          </div>
        </div>

        {/* Two contrast weight panels side by side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-lg)',
          marginTop: 'var(--spacing-md)',
        }}>
          {/* Contrast 1 */}
          <div style={{
            padding: 'var(--spacing-md)',
            background: 'rgba(67, 97, 238, 0.05)',
            borderRadius: 'var(--border-radius-md)',
            border: '2px solid #4361ee',
          }}>
            <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: '#4361ee', fontSize: '0.9375rem' }}>
              ψ<sub>1</sub> weights (c<sub>j</sub>)
            </h4>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
              {GROUP_LABELS.map((label, i) => (
                <div key={i} className="contrast-weight-group">
                  <label style={{ color: GROUP_COLORS[i] }}>{label}</label>
                  <input
                    type="number"
                    className={`contrast-weight-input ${!validation1.isValid ? 'invalid' : ''}`}
                    value={weights1[i]}
                    onChange={(e) => handleWeight1Change(i, e.target.value)}
                    step={1}
                  />
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xs)' }}>
              <span className={`weight-validation ${validation1.isValid ? 'valid' : 'invalid'}`}>
                Σc = {validation1.sum.toFixed(0)} {validation1.isValid ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* Contrast 2 */}
          <div style={{
            padding: 'var(--spacing-md)',
            background: 'rgba(139, 92, 246, 0.05)',
            borderRadius: 'var(--border-radius-md)',
            border: '2px solid #8b5cf6',
          }}>
            <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: '#8b5cf6', fontSize: '0.9375rem' }}>
              ψ<sub>2</sub> weights (d<sub>j</sub>)
            </h4>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
              {GROUP_LABELS.map((label, i) => (
                <div key={i} className="contrast-weight-group">
                  <label style={{ color: GROUP_COLORS[i] }}>{label}</label>
                  <input
                    type="number"
                    className={`contrast-weight-input ${!validation2.isValid ? 'invalid' : ''}`}
                    value={weights2[i]}
                    onChange={(e) => handleWeight2Change(i, e.target.value)}
                    step={1}
                  />
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xs)' }}>
              <span className={`weight-validation ${validation2.isValid ? 'valid' : 'invalid'}`}>
                Σd = {validation2.sum.toFixed(0)} {validation2.isValid ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Dot product and orthogonality badge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginTop: 'var(--spacing-lg)',
        }}>
          <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            Σ c<sub>j</sub>·d<sub>j</sub> = {weights1.map((c, i) => `(${c})(${weights2[i]})`).join(' + ')} = {orthogonality.dotProduct}
          </div>
          <span className={`orthogonality-badge ${orthogonality.isOrthogonal ? 'orthogonal' : 'non-orthogonal'}`}>
            {orthogonality.isOrthogonal ? '✓ Orthogonal' : '✗ Not Orthogonal'}
          </span>
        </div>

        {/* SS Partition Visualization: Two bars */}
        {validation1.isValid && validation2.isValid && (
          <>
            <h4 style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)', textAlign: 'center' }}>
              SS<sub>A</sub> Decomposition
            </h4>

            {(() => {
              const ssA = anova.ssBetween;
              const ss1 = contrast1.ssContrast;
              const ss2 = contrast2.ssContrast;
              const sumSS = ss1 + ss2;
              const maxVal = Math.max(ssA, sumSS);

              const ss1WidthPct = maxVal > 0 ? (ss1 / maxVal) * 100 : 0;
              const ss2WidthPct = maxVal > 0 ? (ss2 / maxVal) * 100 : 0;
              const ssAWidthPct = maxVal > 0 ? (ssA / maxVal) * 100 : 0;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {/* Bar 1: SS_ψ1 + SS_ψ2 */}
                  <div>
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                      fontFamily: 'monospace',
                    }}>
                      SS<sub>ψ₁</sub> + SS<sub>ψ₂</sub> = {ss1.toFixed(1)} + {ss2.toFixed(1)} = {sumSS.toFixed(1)}
                    </div>
                    <div style={{
                      display: 'flex',
                      height: '32px',
                      borderRadius: 'var(--border-radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                    }}>
                      <div style={{
                        width: `${ss1WidthPct}%`,
                        background: '#4361ee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        minWidth: 0,
                      }}>
                        {ss1WidthPct > 12 ? 'ψ₁' : ''}
                      </div>
                      <div style={{
                        width: `${ss2WidthPct}%`,
                        background: '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        minWidth: 0,
                      }}>
                        {ss2WidthPct > 12 ? 'ψ₂' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Bar 2: SS_A */}
                  <div>
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                      fontFamily: 'monospace',
                    }}>
                      SS<sub>A</sub> = {ssA.toFixed(1)}
                    </div>
                    <div style={{
                      display: 'flex',
                      height: '32px',
                      borderRadius: 'var(--border-radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                    }}>
                      <div style={{
                        width: `${ssAWidthPct}%`,
                        background: '#e63946',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        SS<sub style={{ color: 'white' }}>A</sub>
                      </div>
                    </div>
                  </div>

                  {/* Match / mismatch indicator */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    color: ssPartition.sumsToSS ? '#10b981' : '#e63946',
                    fontWeight: 600,
                  }}>
                    {ssPartition.sumsToSS
                      ? `SS_ψ₁ + SS_ψ₂ = SS_A ✓`
                      : `SS_ψ₁ + SS_ψ₂ (${sumSS.toFixed(1)}) ≠ SS_A (${ssA.toFixed(1)})`
                    }
                  </div>
                </div>
              );
            })()}

            {!orthogonality.isOrthogonal && validation1.isValid && validation2.isValid && (
              <div style={{
                padding: 'var(--spacing-md)',
                background: 'rgba(230, 57, 70, 0.08)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid rgba(230, 57, 70, 0.2)',
                marginTop: 'var(--spacing-md)',
                fontSize: '0.9375rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
              }}>
                These contrasts are <strong>not orthogonal</strong> (dot product = {orthogonality.dotProduct}).
                Their SS values do not sum to SS<sub>A</sub> because the two questions overlap -- they
                partially address the same variance. Each individual F-test is still valid, but the
                two tests are not independent of each other.
              </div>
            )}
          </>
        )}
      </div>

      <h3>Non-Orthogonal Contrasts</h3>

      <p className="intro-text">
        Non-orthogonal contrasts are not wrong -- they are perfectly valid individual tests.
        The issue is that they overlap: both contrasts partially account for the same variance
        in the data. This means their SS values will not sum to SS<sub>A</sub>, and the two
        tests are correlated rather than independent. When reporting non-orthogonal contrasts,
        be transparent that they address overlapping questions.
      </p>

      <div className="key-insight">
        <h4>The k - 1 Rule</h4>
        <p>
          With <em>k</em> groups, the between-group variance (SS<sub>A</sub>) has <em>k</em> - 1
          degrees of freedom. You can define at most <em>k</em> - 1 orthogonal contrasts, and
          together they completely decompose SS<sub>A</sub>. With 3 groups, two orthogonal
          contrasts exhaust all the between-group information.
        </p>
      </div>
    </div>
  );
}
