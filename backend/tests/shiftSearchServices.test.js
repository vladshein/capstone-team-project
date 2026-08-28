import { jest } from "@jest/globals";
import { Op } from "sequelize";

const findAndCountAll = jest.fn();
const findAll = jest.fn();

jest.unstable_mockModule("../db/models/index.js", () => ({
  Shift: { findAndCountAll, findAll },
  Location: {},
  Company: {},
  JobPosition: {},
  Category: {},
  ShiftApplication: {},
  User: {},
  WorkerProfile: {},
  Review: {},
}));

const { getAllShifts, getShiftMapMarkers } =
  await import("../services/shiftServices.js");

describe("shift search filters", () => {
  let logSpy;

  beforeEach(() => {
    jest.resetAllMocks();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("applies city, category, partner, and date filters while paginating the list", async () => {
    const rows = [{ id: 11 }, { id: 12 }, { id: 13 }];
    findAndCountAll.mockResolvedValue({ count: 8, rows });
    findAll.mockResolvedValue([
      { "Location.Company.name": "Coffee Point", count: "3" },
      { "Location.Company.name": "Bistro", count: 2 },
      { "Location.Company.name": null, count: "9" },
    ]);

    const result = await getAllShifts({
      page: "2",
      limit: "3",
      categoryIds: [4, "9"],
      partners: ["Coffee Point", "Bistro"],
      city: "Київ",
      dateFrom: "2035-05-01T00:00:00.000Z",
      dateTo: "2035-05-08T00:00:00.000Z",
    });

    expect(result).toEqual({
      totalItems: 8,
      totalPages: 3,
      currentPage: 2,
      data: rows,
      partnerOptions: [
        { label: "Coffee Point", count: 3 },
        { label: "Bistro", count: 2 },
      ],
    });

    const listOptions = findAndCountAll.mock.calls[0][0];
    expect(listOptions).toEqual(
      expect.objectContaining({ limit: 3, offset: 3 }),
    );
    expect(listOptions.where.status).toBe("open");
    expect(listOptions.where.categoryId).toEqual({ [Op.in]: ["4", "9"] });
    expect(listOptions.where.startTime).toEqual(
      expect.objectContaining({
        [Op.gt]: expect.any(Date),
        [Op.gte]: "2035-05-01T00:00:00.000Z",
        [Op.lt]: "2035-05-08T00:00:00.000Z",
      }),
    );

    const locationInclude = listOptions.include[2];
    expect(locationInclude).toEqual(
      expect.objectContaining({
        required: true,
        where: { city: { [Op.iLike]: "Київ" } },
      }),
    );
    expect(locationInclude.include[0]).toEqual(
      expect.objectContaining({
        required: true,
        where: { name: { [Op.in]: ["Coffee Point", "Bistro"] } },
      }),
    );

    const facetOptions = findAll.mock.calls[0][0];
    expect(facetOptions.where).toBe(listOptions.where);
    expect(facetOptions.include[0]).toEqual(
      expect.objectContaining({
        required: true,
        where: { city: { [Op.iLike]: "Київ" } },
      }),
    );
    expect(facetOptions.include[0].include[0].where).toBeUndefined();
  });

  test("uses a single category filter and falls back to default pagination for invalid values", async () => {
    findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    findAll.mockResolvedValue([]);

    const result = await getAllShifts({
      page: "not-a-page",
      limit: "0",
      categoryId: 7,
    });

    expect(result).toEqual({
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      data: [],
      partnerOptions: [],
    });

    const listOptions = findAndCountAll.mock.calls[0][0];
    expect(listOptions).toEqual(
      expect.objectContaining({ limit: 20, offset: 0 }),
    );
    expect(listOptions.where.categoryId).toBe("7");
  });

  test("searches case-insensitively by position title or shift description", async () => {
    findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    findAll.mockResolvedValue([]);

    await getAllShifts({ page: 1, limit: 8, search: "бариста" });

    const listOptions = findAndCountAll.mock.calls[0][0];
    expect(listOptions.where[Op.and]).toContainEqual({
      [Op.or]: [
        { description: { [Op.iLike]: "%бариста%" } },
        { "$JobPosition.title$": { [Op.iLike]: "%бариста%" } },
      ],
    });
    expect(findAll.mock.calls[0][0].include[0]).toEqual(
      expect.objectContaining({ model: expect.anything(), attributes: [] }),
    );
  });

  test("uses the radius expression for nearest map searches and limits map markers", async () => {
    const mapRows = Array.from({ length: 1001 }, (_, id) => ({ id }));
    findAll
      .mockResolvedValueOnce(mapRows)
      .mockResolvedValueOnce([
        { "Location.Company.name": "Coffee Point", count: "1001" },
      ]);

    const result = await getShiftMapMarkers({
      latitude: 50.4501,
      longitude: 30.5234,
      radiusKm: 15,
      sort: "nearest",
    });

    expect(result).toEqual({
      data: mapRows.slice(0, 1000),
      isTruncated: true,
      partnerOptions: [{ label: "Coffee Point", count: 1001 }],
    });

    const mapOptions = findAll.mock.calls[0][0];
    expect(mapOptions.limit).toBe(1001);
    expect(mapOptions.where[Op.and]).toHaveLength(1);

    const radiusCondition = mapOptions.where[Op.and][0];
    expect(radiusCondition.logic).toEqual({ [Op.lte]: 15 });
    expect(radiusCondition.attribute.val).toContain("radians(50.4501)");
    expect(radiusCondition.attribute.val).toContain("radians(30.5234)");
    expect(mapOptions.order[0][0].val).toContain("radians(50.4501)");
    expect(mapOptions.order).toEqual([
      [expect.anything(), "ASC"],
      ["startTime", "ASC"],
    ]);

    const facetOptions = findAll.mock.calls[1][0];
    expect(facetOptions.where).toBe(mapOptions.where);
    expect(facetOptions.include[0].where).toBeUndefined();
  });
});
