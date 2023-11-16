export function fulltextSearch(text: string, type: string = 'dcat:Resource', limit:number = 20) {
    return `
        CALL db.idx.fulltext.queryNodes('skos:Concept', '${text}') YIELD node as tag, score
    MATCH (res1:\`${type}\`)-[:\`dcat:theme\`]->(tag)
    WITH COLLECT({res: res1, score: score}) as conceptMatches
    CALL db.idx.fulltext.queryNodes('dcat:Resource', '${text}') YIELD node as res2, score
    MATCH (res2:\`${type}\`)
    WITH conceptMatches, COLLECT({res: res2, score: score}) as textMatches
    WITH conceptMatches + textMatches as allMatches
    UNWIND allMatches as match
    RETURN DISTINCT match.res.uri as uri, match.res.\`http://purl.org/dc/terms/identifier\` as id, match.res.\`http://purl.org/dc/terms/title\` as title, SUM(match.score) as score ORDER BY score DESC
    ${limit ? 'LIMIT '+limit : ''}
    `
}


export function fulltextSearchAndUser(text: string, userId: string, type: string = 'dcat:Resource', limit:number = 20) {
    return `
    MATCH (:User {uri:'${userId}'})-[:hasBrowsed]-()-[p:\`dct:dsrelation\`*..2]-(res3:\`${type}\`)
    WITH COLLECT({res: res3, score: 5}) as browseMatches
    CALL db.idx.fulltext.queryNodes('skos:Concept', '${text}') YIELD node as tag, score
    MATCH (res1:\`${type}\`)-[:\`dcat:theme\`]->(tag)
    WITH browseMatches, COLLECT({res: res1, score: score}) as conceptMatches
    CALL db.idx.fulltext.queryNodes('dcat:Resource', '${text}') YIELD node as res2, score
    MATCH (res2:\`${type}\`)
    WITH browseMatches, conceptMatches, COLLECT({res: res2, score: score}) as textMatches
    WITH browseMatches + conceptMatches + textMatches as allMatches
    UNWIND allMatches as match
    RETURN DISTINCT match.res.uri as uri, match.res.\`http://purl.org/dc/terms/identifier\` as id, match.res.\`http://purl.org/dc/terms/title\` as title, SUM(match.score) as score ORDER BY score DESC
    ${limit ? 'LIMIT '+limit : ''}
    `
}


export function userProximityResources(userId: string, type: string = 'dcat:Resource', limit:number = 20) {
    return `
    OPTIONAL MATCH (:User {uri:'${userId}'})-[:hasBrowsed]-(cause)-[p:\`dct:dsrelation\`*..2]-(res3:\`${type}\`)
    WITH COLLECT({res: res3, score: 5, cause: cause}) as browseMatches
    UNWIND browseMatches as match
    RETURN DISTINCT match.res.uri as uri, match.res.\`http://purl.org/dc/terms/identifier\` as id, match.res.\`http://purl.org/dc/terms/title\` as title, SUM(match.score) as score, collect(distinct {type: 'resource', uri: match.cause.uri, id: match.cause.\`http://purl.org/dc/terms/identifier\`[0], title: match.cause.\`http://purl.org/dc/terms/title\`[0]}) as causes ORDER BY score DESC
    ${limit ? 'LIMIT '+limit : ''}
    `
}

export function conceptProximityResources(text: string, type: string = 'dcat:Resource', limit:number = 20) {
    return `
    CALL db.idx.fulltext.queryNodes('skos:Concept', '${text}') YIELD node as tag, score
    OPTIONAL MATCH (res1:\`${type}\`)-[:\`dcat:theme\`]->(tag)
    WITH COLLECT({res: res1, score: score, cause: tag}) as conceptMatches
    UNWIND conceptMatches as match
    RETURN DISTINCT match.res.uri as uri, match.res.\`http://purl.org/dc/terms/identifier\` as id, match.res.\`http://purl.org/dc/terms/title\` as title, SUM(match.score) as score, collect(distinct {type: 'concept', uri: match.cause.uri, title: match.cause.\`http://www.w3.org/2004/02/skos/core#prefLabel\`[0]}) as causes ORDER BY score DESC
    ${limit ? 'LIMIT '+limit : ''}
    `
}

export function fulltextResources(text: string, type: string = 'dcat:Resource', limit:number = 20) {
    return `
    CALL db.idx.fulltext.queryNodes('dcat:Resource', '${text}') YIELD node as res2, score
    OPTIONAL MATCH (res2:\`${type}\`)
    WITH COLLECT({res: res2, score: score, cause: 'FULLTEXT'}) as textMatches
    UNWIND textMatches as match
    RETURN DISTINCT match.res.uri as uri, match.res.\`http://purl.org/dc/terms/identifier\` as id, match.res.\`http://purl.org/dc/terms/title\` as title, SUM(match.score) as score, collect(distinct {type: 'fulltext'}) as causes ORDER BY score DESC
    ${limit ? 'LIMIT '+limit : ''}
    `
}
