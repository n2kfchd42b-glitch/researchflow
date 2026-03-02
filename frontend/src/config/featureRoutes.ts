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
  chi_square:           '',                      // not yet built
  logistic_regression:  '',                      // not yet built
  linear_regression:    '',                      // not yet built
  survival_analysis:    '/student/survival',
  mann_whitney:         '',                      // not yet built
  t_test:               '',                      // not yet built
  correlation:          '',                      // not yet built
  meta_analysis:        '/student/forest-plot',
  kruskal_wallis:       '',                      // not yet built
  anova:                '',                      // not yet built
  cox_regression:       '/student/survival',
};

const NGO_ROUTES: Record<FeatureKey, string> = {
  descriptive_stats:    '/ngo/descriptive',
  chi_square:           '',                      // not yet built
  logistic_regression:  '',                      // not yet built
  linear_regression:    '',                      // not yet built
  survival_analysis:    '/ngo/analysis/survival',
  mann_whitney:         '',                      // not yet built
  t_test:               '',                      // not yet built
  correlation:          '',                      // not yet built
  meta_analysis:        '/ngo/analysis/forest-plot',
  kruskal_wallis:       '',                      // not yet built
  anova:                '',                      // not yet built
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
