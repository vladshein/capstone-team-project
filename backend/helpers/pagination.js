/**
 * Pagination
 *
 * @param {*} page
 * @param {*} limit
 * @returns
 */
export const getPagination = (page, limit) => {
  const offset = (page - 1) * limit; // page number is 1-based
  return { limit, offset };
};

/**
 * format Response
 *
 * @param {*} data
 * @param {*} page
 * @param {*} limit
 * @returns
 */
export const formatResponse = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, items, totalPages, currentPage, limit };
};
