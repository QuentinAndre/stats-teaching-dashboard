/**
 * Single source of truth for module ordering across the app.
 * Used by the landing page, module navigation, and routing.
 */
export interface ModuleDefinition {
  id: string;
  path: string;
  title: string;
  description: string;
}

export const modules: ModuleDefinition[] = [
  {
    id: 'sampling-distributions',
    path: '/sampling-distributions',
    title: 'Sampling Distributions',
    description:
      'Explore how sample means vary and why larger samples give more precise estimates. Visualize the Central Limit Theorem in action.',
  },
  {
    id: 'nhst',
    path: '/nhst',
    title: 'Null Hypothesis Significance Testing',
    description:
      'Understand how sampling distributions enable hypothesis testing. Learn the logic of p-values, t-statistics, and statistical decisions.',
  },
  {
    id: 'outlier-exclusions',
    path: '/outlier-exclusions',
    title: 'Outlier Exclusions',
    description:
      'Learn why outlier exclusion procedures must be blind to experimental conditions. See how improper exclusions inflate false positive rates.',
  },
  {
    id: 'anova',
    path: '/anova',
    title: 'Analysis of Variance (ANOVA)',
    description:
      'Understand ANOVA as a tool for partitioning variance. See how between-group and within-group variability combine to test for group differences.',
  },
  {
    id: 'effect-sizes-power',
    path: '/effect-sizes-power',
    title: 'Effect Sizes & Power',
    description:
      "Learn why p-values aren't enough. Understand effect sizes (Cohen's d, \u03B7\u00B2, \u03C9\u00B2) and how to plan adequately powered studies.",
  },
  {
    id: 'p-hacking',
    path: '/p-hacking',
    title: 'P-Hacking',
    description:
      'Discover how researcher degrees of freedom inflate false-positive rates. See why pre-registration and transparent reporting are essential for credible science.',
  },
  {
    id: 'priad',
    path: '/priad',
    title: 'PRIADs',
    description:
      'Discover Pre-Registered Interim Analysis Designs for efficient data collection. Learn how to stop early while maintaining \u03B1 = 0.05 through adjusted thresholds.',
  },
  {
    id: 'factorial-anova',
    path: '/factorial-anova',
    title: 'Factorial ANOVA',
    description:
      'Explore how multiple factors combine in experimental designs. Understand main effects, interactions, and variance partitioning in 2\u00D72 designs.',
  },
  {
    id: 'planned-contrasts',
    path: '/planned-contrasts',
    title: 'Planned Contrasts',
    description:
      'Learn to ask specific, theory-driven questions about group differences. Understand contrast weights, orthogonality, and why focused comparisons are more powerful than the omnibus F.',
  },
  {
    id: 'ancova',
    path: '/ancova',
    title: 'Analysis of Covariance (ANCOVA)',
    description:
      'Learn how adding a covariate to ANOVA reduces error variance, increases power, and adjusts group means. Understand when and why ANCOVA is appropriate.',
  },
  {
    id: 'continuous-interactions',
    path: '/continuous-interactions',
    title: 'Continuous Moderators',
    description:
      'Learn to probe interactions with continuous predictors. Understand spotlight analysis, floodlight analysis (Johnson-Neyman), marginal effects, and the "magic number zero."',
  },
  {
    id: 'within-subjects',
    path: '/within-subjects',
    title: 'Within-Subject Designs',
    description:
      'Learn how measuring the same subjects multiple times removes individual differences from error. Understand paired t-tests and repeated measures ANOVA.',
  },
  {
    id: 'mixed-designs',
    path: '/mixed-designs',
    title: 'Mixed Designs',
    description:
      'Explore split-plot designs that combine between-subjects and within-subjects factors. Understand different error terms and interaction effects.',
  },
  {
    id: 'mediation',
    path: '/mediation',
    title: 'Mediation Analysis',
    description:
      'Understand simple mediation (X\u2192M\u2192Y) and the bootstrap test of the indirect effect.',
  },
  {
    id: 'causal-pitfalls',
    path: '/causal-pitfalls',
    title: 'Causal Pitfalls of Mediation',
    description:
      'Why a significant indirect effect does not establish causal mediation. Explore confounding, equivalent models, and the gap between statistics and causation.',
  },
  {
    id: 'beyond-mediation',
    path: '/beyond-mediation',
    title: 'Beyond Simple Mediation',
    description:
      'Parallel mediation, serial mediation, and moderated mediation (conditional indirect effects).',
  },
];
