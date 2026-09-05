import { jest } from "@jest/globals";

const monopayService = {
  createInvoice: jest.fn(),
  getInvoiceStatus: jest.fn(),
  cancelHold: jest.fn(),
};
const sequelize = { query: jest.fn() };
const Shift = { findByPk: jest.fn() };
const ShiftApplication = { findByPk: jest.fn() };
const Wallet = { findOrCreate: jest.fn() };
const Transaction = { create: jest.fn(), findAll: jest.fn() };

jest.unstable_mockModule("../services/monopayService.js", () => ({
  monopayService,
}));
jest.unstable_mockModule("../db/models/index.js", () => ({
  sequelize,
  Shift,
  ShiftApplication,
  Wallet,
  Transaction,
}));

const { createShiftInvoice, getWalletOverview } =
  await import("../controllers/paymentControllers.js");

const createResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

describe("payment controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("persists a description when creating a hold transaction", async () => {
    Shift.findByPk.mockResolvedValue({
      id: 12,
      status: "open",
      startTime: "2030-01-01T08:00:00.000Z",
      endTime: "2030-01-01T10:00:00.000Z",
      hourlyRate: 100,
      bonusRate: 0,
    });
    ShiftApplication.findByPk.mockResolvedValue({ id: 7, workerId: 44 });
    sequelize.query.mockResolvedValue([[]]);
    monopayService.createInvoice.mockResolvedValue({
      invoiceId: "invoice-12",
      pageUrl: "https://pay.example/invoice-12",
    });
    Transaction.create.mockResolvedValue({ id: 1 });
    const response = createResponse();

    await createShiftInvoice(
      { body: { shiftId: 12, applicationId: 7 }, user: { id: 5 } },
      response,
      jest.fn(),
    );

    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("#7"),
        externalId: "invoice-12",
      }),
    );
  });

  test("creates a fresh invoice when the previous invoice is still active", async () => {
    Shift.findByPk.mockResolvedValue({
      id: 12,
      status: "open",
      startTime: "2030-01-01T08:00:00.000Z",
      endTime: "2030-01-01T10:00:00.000Z",
      hourlyRate: 100,
      bonusRate: 0,
    });
    ShiftApplication.findByPk.mockResolvedValue({ id: 7, workerId: 44 });
    sequelize.query
      .mockResolvedValueOnce([
        [{ id: 9, external_id: "old-invoice", amount: "230.00" }],
      ])
      .mockResolvedValueOnce([[]]);
    monopayService.getInvoiceStatus.mockResolvedValue({ status: "created" });
    monopayService.createInvoice.mockResolvedValue({
      invoiceId: "new-invoice",
      pageUrl: "https://pay.example/new-invoice",
    });
    const response = createResponse();

    await createShiftInvoice(
      { body: { shiftId: 12, applicationId: 7 }, user: { id: 5 } },
      response,
      jest.fn(),
    );

    expect(monopayService.cancelHold).toHaveBeenCalledWith("old-invoice");
    expect(monopayService.createInvoice).toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId: "new-invoice",
        pageUrl: "https://pay.example/new-invoice",
      }),
    );
  });

  test("returns transactions with a nullable description", async () => {
    Wallet.findOrCreate.mockResolvedValue([
      { id: 8, balance: "1200.00", frozenBalance: "150.00", currency: "UAH" },
    ]);
    Transaction.findAll.mockResolvedValue([
      {
        toJSON: () => ({
          id: 3,
          amount: "150.00",
          description: null,
          created_at: "2030-01-02T10:00:00.000Z",
        }),
      },
    ]);
    const response = createResponse();

    await getWalletOverview({ user: { id: 5 } }, response, jest.fn());

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        transactions: [
          expect.objectContaining({
            description: null,
            createdAt: "2030-01-02T10:00:00.000Z",
          }),
        ],
      }),
    );
  });
});
