import { jest } from "@jest/globals";
import checkRole from "../middlewares/checkRole.js";

const runMiddleware = (mw, req) => {
  const next = jest.fn();
  mw(req, {}, next);
  return next;
};

describe("middlewares/checkRole", () => {
  it("passes a request whose role is allowed", () => {
    const next = runMiddleware(checkRole("business_client", "admin"), {
      user: { role: "business_client" },
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects with 401 when the request never went through authenticate", () => {
    const next = runMiddleware(checkRole("admin"), {});

    const [error] = next.mock.calls[0];
    expect(error).toMatchObject({ status: 401 });
  });

  it("rejects with 403 when the role is not in the allowed list", () => {
    const next = runMiddleware(checkRole("admin"), { user: { role: "worker" } });

    const [error] = next.mock.calls[0];
    expect(error).toMatchObject({ status: 403 });
  });
});
