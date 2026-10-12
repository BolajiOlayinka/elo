'use strict';

const { valuesClause } = require('./wikidata-client');

const OCCUPATIONS = 'wd:Q937857 wd:Q628099';

function personIdQuery({ birthYear, afterQid, limit }) {
    return `
SELECT DISTINCT ?person WHERE {
  VALUES ?occupation { ${OCCUPATIONS} }
  ?person wdt:P106 ?occupation .
  ?person wdt:P569 ?dob .
  FILTER(YEAR(?dob) = ${Number(birthYear)})
  FILTER(xsd:integer(STRAFTER(STR(?person), "http://www.wikidata.org/entity/Q")) > ${Number(afterQid)})
  { ?person wdt:P54 ?team } UNION { ?person wdt:P6087 ?team }
}
ORDER BY xsd:integer(STRAFTER(STR(?person), "http://www.wikidata.org/entity/Q"))
LIMIT ${Number(limit)}
`.trim();
}

function identityQuery(qids) {
    return `
SELECT ?person ?personLabel ?dob ?citizenship ?citizenshipLabel ?position ?positionLabel
       ?alias ?wikiTitle ?transfermarkt ?worldfootball ?footballdatabase ?soccerbase ?fifa WHERE {
  VALUES ?person { ${valuesClause(qids)} }
  OPTIONAL { ?person wdt:P569 ?dob }
  OPTIONAL { ?person wdt:P27 ?citizenship }
  OPTIONAL { ?person wdt:P413 ?position }
  OPTIONAL { ?person wdt:P2446 ?transfermarkt }
  OPTIONAL { ?person wdt:P2020 ?worldfootball }
  OPTIONAL { ?person wdt:P3537 ?footballdatabase }
  OPTIONAL { ?person wdt:P2369 ?soccerbase }
  OPTIONAL { ?person wdt:P1469 ?fifa }
  OPTIONAL {
    ?person skos:altLabel ?alias .
    FILTER(LANG(?alias) = "en")
  }
  OPTIONAL {
    ?article schema:about ?person ;
             schema:isPartOf <https://en.wikipedia.org/> ;
             schema:name ?wikiTitle .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`.trim();
}

function stintQuery(qids) {
    return `
SELECT ?person ?kind ?team ?teamLabel ?start ?end ?apps ?goals WHERE {
  VALUES ?person { ${valuesClause(qids)} }
  {
    ?person p:P54 ?stmt .
    ?stmt ps:P54 ?team .
    BIND("player" AS ?kind)
    OPTIONAL { ?stmt pq:P580 ?start }
    OPTIONAL { ?stmt pq:P582 ?end }
    OPTIONAL { ?stmt pq:P1350 ?apps }
    OPTIONAL { ?stmt pq:P1351 ?goals }
  } UNION {
    ?person p:P6087 ?stmt .
    ?stmt ps:P6087 ?team .
    BIND("coach" AS ?kind)
    OPTIONAL { ?stmt pq:P580 ?start }
    OPTIONAL { ?stmt pq:P582 ?end }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`.trim();
}

module.exports = {
    personIdQuery,
    identityQuery,
    stintQuery
};
