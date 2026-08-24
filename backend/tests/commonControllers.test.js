import { jest } from "@jest/globals";

const getCategories = jest.fn();
const getAreas = jest.fn();
const getJobPositions = jest.fn();

jest.unstable_mockModule("../services/commonServices.js", () => ({
  getCategories,
  getAreas,
  getJobPositions,
}));

const {
  categoriesController,
  areasController,
  jobPositionsController,
} = await import("../controllers/commonControllers.js");

describe("common controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns all categories from the common service", async () => {
    const categories = [{ id: "retail", name: "Ритейл" }];
    const res = { json: jest.fn() };
    getCategories.mockResolvedValue(categories);

    await categoriesController({}, res);

    expect(getCategories).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(categories);
  });

  test("returns available areas from the common service", async () => {
    const areas = [{ id: 1, name: "Вінницька область" }];
    const res = { json: jest.fn() };
    getAreas.mockResolvedValue(areas);

    await areasController({}, res);

    expect(getAreas).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(areas);
  });

  test("returns job positions from the common service", async () => {
    const positions = [{ id: 1, title: "Касир" }];
    const res = { json: jest.fn() };
    getJobPositions.mockResolvedValue(positions);

    await jobPositionsController({}, res);

    expect(getJobPositions).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(positions);
  });
});
