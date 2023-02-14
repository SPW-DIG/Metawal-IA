/**
 * Profil utilisateur
 */
export type PersonalProfile = {

  uri: string;

  contactInfo: ContactInfo,

  /**
   * liste des catégories de cet utilisateur
   * */
  userTypes: UserType[],

  /**
   * liste de tags ou mots-clés d'intérêt pour l'utilisateur.
   * Plain text, ou URIs d'éléments d'ontologie (INSPIRE, ...)
   * */
  tagsOfInterest: string[],

  /**
   * L'historique de recherche de l'utilisateur
   */
  searchHistory: SearchHistoryItem[],

  /**
   * L'historique de consultation de datasets de l'utilisateur.
   * TODO : quelle consultation? Dans Walonmap, dans les résultats du géoportail ?
   */
  browseHistory: BrowseHistoryItem[],

  /**
   * L'historique de téléchargement de datasets
   */
  downloadHistory: DownloadHistoryItem[],

  /**
   * La liste des cartes créées par l'utilisateur
   */
  savedMaps: MapContext[]
}


/**
 * Les catégories selon lesquelles un utilisateur peut se qualifier
 * */
export type UserType = 'Chercheur' | 'Architecte' | 'Notaire' /* | ... TODO */


/**
 * Contact info d'un utilisateur
 */
export type ContactInfo = {

  // TODO what is necesary, optional ?

  name: string,

  address?: string,

  telephone?: string

  /* ... */
}


/**
 * Definition d'une carte enregistrée par unu utilisateur dans le géoportail
 */
export type MapContext = {

  /** Identifiant de la carte (unique, permanent) */
  uri: string,

  /** Nom de la carte */
  name?: string,

  /** List de datasets inclus dans cette carte */
  layers: LayerDescriptor[]

  /** Emprise. WSG84 minx,miny,maxx,maxy */
  bbox: [number, number, number, number]
}


/**
 * Définition d'une couche dans une carte utilisateur
 */
export type LayerDescriptor = {

  /**
   * l'URI du dataset dans Metawal
   */
  uri: string,

  /**
   * dans le cas d'un service, le nom de la couche
   */
  layerName?: string,

  /**
   * dans le cas d'un service, l'URL du point d'accès
   * TODO nécessaire ?
   */
  serviceUrl?: string,

  /**
   * le style appliqué à la couche
   */
  style?: string

}


/**
 * Elément de l'historique de recherche
 */
export type SearchHistoryItem = {

  /** date de la recherche */
  timestamp: number,

  /** termes de recherche */
  searchstring: string

  // TODO autres filtres possibles ? recherche structurée ?

}


/**
 * Elément de l'historique de consultation
 */
export type BrowseHistoryItem = {

  /** date de la consultation */
  timestamp: number,

  /** URI du dataset consulté */
  datasetUri: string

}


/**
 * Elément de l'historique de téléchargement
 */
export type DownloadHistoryItem = {

  /** date du téléchargement */
  timestamp: number,

  /** URI du dataset téléchargé */
  datasetUri: string,

  /** Emprise du téléchargement */
  bbox: string,

  // TODO autres paramètres ?
}