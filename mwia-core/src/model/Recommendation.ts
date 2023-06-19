/**
 * Recommendation pour un utilisateur donné.
 */
export type DatasetRecommendation = {

  /** date de la recommandation */
  timestamp: number,

  /** URI du dataset sujet de la recommandation */
  datasetUri: string,

  /** Score */
  score: number,
}