import { useMemo } from 'react';
import { useScrollProgress } from '../hooks/useScrollProgress';
import PopulationDots from '../PopulationDots';
import { generatePopulation, drawSampleIndices, mean } from '../../../utils/statistics';

interface SamplingIntroProps {
  /** Number of individuals to sample */
  sampleSize?: number;
}

// Animation phases as fractions of total scroll
const FADE_IN_END = 0.12;
const FADE_OUT_START = 0.88;

// Population parameters
const POPULATION_SIZE = 500;
const POPULATION_MEAN = 50;
const POPULATION_STD = 10;

function useSamplingAnimation(scrollProgress: number, sampleSize: number) {
  const fadeInProgress = Math.min(1, scrollProgress / FADE_IN_END);
  const samplingProgress =
    scrollProgress <= FADE_IN_END
      ? 0
      : scrollProgress >= FADE_OUT_START
        ? 1
        : (scrollProgress - FADE_IN_END) / (FADE_OUT_START - FADE_IN_END);
  const fadeOutProgress =
    scrollProgress <= FADE_OUT_START
      ? 0
      : (scrollProgress - FADE_OUT_START) / (1 - FADE_OUT_START);

  const phase = fadeInProgress < 1 ? 'entering' : fadeOutProgress > 0 ? 'exiting' : 'fullscreen';

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t: number) => Math.pow(t, 3);

  const sizePercent =
    phase === 'entering'
      ? 60 + easeOut(fadeInProgress) * 35
      : phase === 'exiting'
        ? 95 - easeIn(fadeOutProgress) * 35
        : 95;

  const opacity =
    phase === 'entering'
      ? 0.5 + fadeInProgress * 0.5
      : phase === 'exiting'
        ? 1 - fadeOutProgress * 0.5
        : 1;

  const sampledCount = Math.round(samplingProgress * sampleSize);

  return { phase, sizePercent, opacity, samplingProgress, sampledCount };
}

export default function SamplingIntro({ sampleSize = 25 }: SamplingIntroProps) {
  const [container1Ref, scrollProgress1] = useScrollProgress<HTMLDivElement>();
  const [container2Ref, scrollProgress2] = useScrollProgress<HTMLDivElement>();

  // Generate population data once
  const populationData = useMemo(() => {
    return generatePopulation('normal', POPULATION_MEAN, POPULATION_STD, POPULATION_SIZE);
  }, []);

  // Generate two different samples
  const sample1Indices = useMemo(() => {
    return drawSampleIndices(POPULATION_SIZE, sampleSize);
  }, [sampleSize]);

  const sample2Indices = useMemo(() => {
    return drawSampleIndices(POPULATION_SIZE, sampleSize);
  }, [sampleSize]);

  // Calculate sample means
  const sample1Mean = useMemo(() => {
    const sampleValues = sample1Indices.map(i => populationData[i]);
    return mean(sampleValues);
  }, [populationData, sample1Indices]);

  const sample2Mean = useMemo(() => {
    const sampleValues = sample2Indices.map(i => populationData[i]);
    return mean(sampleValues);
  }, [populationData, sample2Indices]);

  // Calculate population mean
  const actualPopulationMean = useMemo(() => {
    return mean(populationData);
  }, [populationData]);

  // Animation states for both samples
  const anim1 = useSamplingAnimation(scrollProgress1, sampleSize);
  const anim2 = useSamplingAnimation(scrollProgress2, sampleSize);

  return (
    <section className="narrative-section sampling-intro">
      {/* Intro text before the scrollytelling section */}
      <div className="section-intro">
        <h2>What is Sampling?</h2>

        <p className="intro-text">
          Imagine you want to know the average height of all students at a university.
          Measuring every single student would take forever. Instead, you can take a{' '}
          <strong>sample</strong> — a smaller group randomly selected from the population.
        </p>

        <p className="intro-text">
          Below is a <strong>population</strong> of {POPULATION_SIZE} individuals, represented as blue dots
          in a histogram. Scroll to watch as we randomly select {sampleSize} of them to form
          our sample.
        </p>
      </div>

      {/* First sampling animation */}
      <div ref={container1Ref} className="scrollytelling-container">
        <div className={`sticky-visualization phase-${anim1.phase}`}>
          <div
            className="visualization-wrapper"
            style={{
              width: `${anim1.sizePercent}vw`,
              maxWidth: `${anim1.sizePercent}vw`,
              opacity: anim1.opacity,
            }}
          >
            <PopulationDots
              populationData={populationData}
              sampleIndices={sample1Indices}
              highlightProgress={anim1.samplingProgress}
              mean={POPULATION_MEAN}
              std={POPULATION_STD}
            />

            <div className="progress-indicator">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${anim1.samplingProgress * 100}%` }}
                />
              </div>
              <p>
                <strong>{anim1.sampledCount}</strong> of <strong>{sampleSize}</strong> individuals
                selected
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* First conclusion - show sample mean */}
      <div className="section-conclusion">
        <p className="completion-text">
          We now have a sample of {sampleSize} individuals (shown in red). We can calculate the
          average height of the students in this sample: it is <strong>{sample1Mean.toFixed(1)}</strong>.
          Note that it is not equal to the population mean ({actualPopulationMean.toFixed(1)}). This is expected,
          since we are only sampling a random subset of the population. In fact, if we took another
          random sample, we would observe a different mean.
        </p>
      </div>

      {/* Second sampling animation */}
      <div ref={container2Ref} className="scrollytelling-container">
        <div className={`sticky-visualization phase-${anim2.phase}`}>
          <div
            className="visualization-wrapper"
            style={{
              width: `${anim2.sizePercent}vw`,
              maxWidth: `${anim2.sizePercent}vw`,
              opacity: anim2.opacity,
            }}
          >
            <PopulationDots
              populationData={populationData}
              sampleIndices={sample2Indices}
              highlightProgress={anim2.samplingProgress}
              mean={POPULATION_MEAN}
              std={POPULATION_STD}
            />

            <div className="progress-indicator">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${anim2.samplingProgress * 100}%` }}
                />
              </div>
              <p>
                <strong>{anim2.sampledCount}</strong> of <strong>{sampleSize}</strong> individuals
                selected
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Second conclusion - show different sample mean */}
      <div className="section-conclusion">
        <p className="completion-text">
          This time, our sample mean is <strong>{sample2Mean.toFixed(1)}</strong> — different from the
          first sample's mean of {sample1Mean.toFixed(1)}. This variability in sample means is called{' '}
          <strong>sampling variability</strong>, and understanding it is key to statistical inference.
        </p>
      </div>
    </section>
  );
}
