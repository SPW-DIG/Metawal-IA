export function fulltextSearch(text: string, type: string = 'dcat:Resource') {
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
    `
}