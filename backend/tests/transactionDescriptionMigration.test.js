import { jest } from "@jest/globals";

const { up, down } = await import(
  "../db/migrations/2026.09.05T00.01.00.add-transaction-description.js"
);

const queryInterface = {
  describeTable: jest.fn(),
  addColumn: jest.fn(),
  removeColumn: jest.fn(),
};

describe("transaction description migration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("adds a nullable description column when it is absent", async () => {
    queryInterface.describeTable.mockResolvedValue({});

    await up({ context: queryInterface });

    expect(queryInterface.addColumn).toHaveBeenCalledWith(
      "transactions",
      "description",
      expect.objectContaining({ allowNull: true }),
    );
  });

  test("removes the description column on rollback", async () => {
    queryInterface.describeTable.mockResolvedValue({ description: {} });

    await down({ context: queryInterface });

    expect(queryInterface.removeColumn).toHaveBeenCalledWith(
      "transactions",
      "description",
    );
  });
});
