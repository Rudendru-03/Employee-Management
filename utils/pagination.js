function parsePagination(query) {
  const rawLimit = Number(query.limit ?? 10);
  const rawOffset = Number(query.offset ?? 0);

  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 100)
    : 10;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

  return { limit, offset };
}

function buildEqualityFilter(query, allowedFields) {
  const filter = {};
  allowedFields.forEach((field) => {
    if (query[field] !== undefined && query[field] !== "") {
      filter[field] = query[field];
    }
  });
  return filter;
}

function buildPaginatedResult({ items, total, limit, offset }) {
  return {
    data: items,
    pagination: {
      total,
      limit,
      offset,
      hasNext: offset + items.length < total,
      hasPrev: offset > 0,
    },
  };
}

module.exports = {
  parsePagination,
  buildEqualityFilter,
  buildPaginatedResult,
};
