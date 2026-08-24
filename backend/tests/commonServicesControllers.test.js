import { jest } from "@jest/globals";

const findCategories = jest.fn();
const findAreas = jest.fn();
const findPositions = jest.fn();

// Common services import model files directly. Mocking the shared Sequelize
// instance lets those real model modules load without a database connection
// while preserving their actual import path.
const models = {
  category: { findAll: findCategories },
  area: { findAll: findAreas },
  JobPosition: { findAll: findPositions },
};

jest.unstable_mockModule("../db/sequelize.js", () => ({
  default: {
    define: jest.fn((modelName) => models[modelName]),
  },
}));

const { getCategories, getAreas, getJobPositions } = await import(
  "../services/commonServices.js"
);
const {
  categoriesController,
  areasController,
  jobPositionsController,
} = await import("../controllers/commonControllers.js");

const createResponse = () => ({ json: jest.fn() });

describe("common directory services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads all shift categories", async () => {
    const categories = [{ id: "retail", name: "Ритейл" }];
    findCategories.mockResolvedValue(categories);

    await expect(getCategories()).resolves.toBe(categories);
    expect(findCategories).toHaveBeenCalledWith();
  });

  test("loads all areas", async () => {
    const areas = [{ id: "vinnytsia", name: "Вінниця" }];
    findAreas.mockResolvedValue(areas);

    await expect(getAreas()).resolves.toBe(areas);
    expect(findAreas).toHaveBeenCalledWith();
  });

  test("loads job positions in alphabetical title order", async () => {
    const positions = [{ id: 1, title: "Бариста" }];
    findPositions.mockResolvedValue(positions);

    await expect(getJobPositions()).resolves.toBe(positions);
    expect(findPositions).toHaveBeenCalledWith({ order: [["title", "ASC"]] });
  });
});

describe("common directory controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("serializes the categories returned by the directory service", async () => {
    const categories = [{ id: "retail", name: "Ритейл" }];
    const res = createResponse();
    findCategories.mockResolvedValue(categories);

    await categoriesController({}, res);

    expect(findCategories).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith(categories);
  });

  test("serializes the areas returned by the directory service", async () => {
    const areas = [{ id: "vinnytsia", name: "Вінниця" }];
    const res = createResponse();
    findAreas.mockResolvedValue(areas);

    await areasController({}, res);

    expect(findAreas).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith(areas);
  });

  test("serializes positions in the same sorted order used by the service", async () => {
    const positions = [{ id: 1, title: "Бариста" }];
    const res = createResponse();
    findPositions.mockResolvedValue(positions);

    await jobPositionsController({}, res);

    expect(findPositions).toHaveBeenCalledWith({ order: [["title", "ASC"]] });
    expect(res.json).toHaveBeenCalledWith(positions);
  });
});
