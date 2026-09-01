import { getPagination, formatResponse } from "../helpers/pagination.js";

describe("helpers/pagination", () => {
  describe("getPagination", () => {
    it("returns a zero offset for the first page", () => {
      expect(getPagination(1, 20)).toEqual({ limit: 20, offset: 0 });
    });

    it("offsets by (page - 1) * limit for later pages", () => {
      expect(getPagination(3, 10)).toEqual({ limit: 10, offset: 20 });
    });
  });

  describe("formatResponse", () => {
    it("maps a Sequelize findAndCountAll result to a paginated payload", () => {
      const rows = [{ id: 1 }, { id: 2 }];

      expect(formatResponse({ count: 25, rows }, 2, 10)).toEqual({
        totalItems: 25,
        items: rows,
        totalPages: 3,
        currentPage: 2,
        limit: 10,
      });
    });

    it("rounds the page count up for a partial last page", () => {
      expect(formatResponse({ count: 1, rows: [{ id: 1 }] }, 1, 10).totalPages).toBe(1);
    });
  });
});
