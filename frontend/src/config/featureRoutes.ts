/**
 * Central map from AI-returned feature_key values to ResearchFlow route
 * segments.  The consuming component must prepend the product-context
 * prefix (e.g. "/student" or "/ngo") using `getFeatureRoute()`.
 */

export type FeatureKey =
  | 'descriptive_stats'
  | 'chi_square'
  | 'logistic_regression'
  | 'linear_regression'
  | 'survival_analysis'
  | 'mann_whitney'
  | 't_test'
  | 'correlation'
  | 'meta_analysis'
  | 'kruskal_wallis'
  | 'anova'
  | 'cox_regression';

/**
 * Raw route segments relative to the product prefix.
 * Keys that map to a feature not yet available in the given context
 * return an empty string — the caller should show "Coming soon".
 */
const STUDENT_ROUTES: Record<FeatureKey, string> = {
  descriptive_stats:    '/student/descriptive',
  chi_square:           '/student/descriptive',
  logistic_regression:  '/student/descriptive',
  linear_regression:    '/student/descriptive',
  survival_analysis:    '/student/survival',
  mann_whitney:         '/student/descriptive',
  t_test:               '/student/descriptive',
  correlation:          '/student/descriptive',
  meta_analysis:        '/student/forest-plot',
  kruskal_wallis:       '/student/descriptive',
  anova:                '/student/descriptive',
  cox_regression:       '/student/survival',
};

const NGO_ROUTES: Record<FeatureKey, string> = {
  descriptive_stats:    '/ngo/descriptive',
  chi_square:           '/ngo/descriptive',
  logistic_regression:  '/ngo/descriptive',
  linear_regression:    '/ngo/descriptive',
  survival_analysis:    '/ngo/analysis/survival',
  mann_whitney:         '/ngo/descriptive',
  t_test:               '/ngo/descriptive',
  correlation:          '/ngo/descriptive',
  meta_analysis:        '/ngo/analysis/forest-plot',
  kruskal_wallis:       '/ngo/descriptive',
  anova:                '/ngo/descriptive',
  cox_regression:       '/ngo/analysis/survival',
};

export type ProductContext = 'student' | 'ngo';

/**
 * Returns the absolute route for a given feature key and product context.
 * Returns '' if the feature_key is unknown (caller should grey out the button).
 */
export function getFeatureRoute(
  featureKey: string,
  context: ProductContext = 'student',
): string {
  const map = context === 'ngo' ? NGO_ROUTES : STUDENT_ROUTES;
  return (map as Record<string, string>)[featureKey] ?? '';
}

/** Check whether a feature_key exists in the routing map. */
export function isKnownFeatureKey(featureKey: string): featureKey is FeatureKey {
  return featureKey in STUDENT_ROUTES;
}
