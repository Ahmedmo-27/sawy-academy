function normalize(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/\p{Diacritic}/gu, "");
}

function score(haystack: string, needle: string) {
  const text = normalize(haystack);
  const query = normalize(needle);
  const direct = text.indexOf(query);
  if (direct >= 0) return direct;

  let queryIndex = 0;
  let distance = 0;
  for (let index = 0; index < text.length && queryIndex < query.length; index += 1) {
    if (text[index] === query[queryIndex]) {
      distance += index;
      queryIndex += 1;
    }
  }
  return queryIndex === query.length ? distance + 100 : Number.POSITIVE_INFINITY;
}

export function fuzzySearch<T>(
  items: T[],
  query: string,
  fields: (item: T) => Array<string | undefined>
) {
  const trimmed = query.trim();
  if (!trimmed) return items;

  return items
    .map((item) => ({
      item,
      score: Math.min(...fields(item).map((field) => score(field ?? "", trimmed))),
    }))
    .filter((result) => Number.isFinite(result.score))
    .sort((left, right) => left.score - right.score)
    .map((result) => result.item);
}
