import { useStatistics } from './hooks';

export default function StatisticsPanel() {
  const {
    populationMean,
    populationStd,
    theoreticalSE,
    observedMean,
    observedSE,
    sampleCount,
  } = useStatistics();

  return (
    <div className="statistics-panel" role="region" aria-label="Live statistics">
      <h3>Statistics</h3>

      <div className="stat-section">
        <h4>Population</h4>
        <dl>
          <div className="stat-row">
            <dt>Mean (μ)</dt>
            <dd>{populationMean.toFixed(2)}</dd>
          </div>
          <div className="stat-row">
            <dt>Std Dev (σ)</dt>
            <dd>{populationStd.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      <div className="stat-section">
        <h4>Theoretical Sampling Distribution</h4>
        <dl>
          <div className="stat-row">
            <dt>SE = σ/√n</dt>
            <dd>{theoreticalSE.toFixed(3)}</dd>
          </div>
        </dl>
      </div>

      <div className="stat-section">
        <h4>Observed ({sampleCount} samples)</h4>
        <dl>
          <div className="stat-row">
            <dt>Mean of x̄</dt>
            <dd>{observedMean !== null ? observedMean.toFixed(3) : '—'}</dd>
          </div>
          <div className="stat-row">
            <dt>SE (observed)</dt>
            <dd>{observedSE !== null ? observedSE.toFixed(3) : '—'}</dd>
          </div>
        </dl>
      </div>

      {sampleCount > 10 && observedMean !== null && observedSE !== null && (
        <div className="stat-section comparison">
          <h4>Comparison</h4>
          <p className="comparison-note">
            Observed mean is{' '}
            <strong>
              {Math.abs(observedMean - populationMean).toFixed(3)}
            </strong>{' '}
            from μ
          </p>
          <p className="comparison-note">
            Observed SE is{' '}
            <strong>
              {((observedSE / theoreticalSE - 1) * 100).toFixed(1)}%
            </strong>{' '}
            {observedSE > theoreticalSE ? 'above' : 'below'} theoretical
          </p>
        </div>
      )}
    </div>
  );
}
