/**
 * Recommendation pour un utilisateur donné.
 */
export type DatasetRecommendation = {

  /** date de la recommandation */
  timestamp: number,

  /** URI du dataset sujet de la recommandation */
  datasetUri: string,

  /** Titre du dataset sujet de la recommandation */
  title: string,

  /** ID du dataset sujet de la recommandation */
  id: string,

  /** Score */
  score: number,
}