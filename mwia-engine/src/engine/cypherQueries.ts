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



