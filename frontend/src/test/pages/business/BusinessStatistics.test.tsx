import { render, screen } from "@testing-library/react";
import { BusinessStatistics } from "../../../pages/business/BusinessStatistics";
import type { BusinessStatisticsSummary } from "../../../redux/business-statistics/types";

const summary: BusinessStatisticsSummary = {
  companies: { total: 3 },
  shifts: { total: 12, open: 2, booked: 3, inProgress: 1, completed: 5, cancelled: 4 },
  applications: { total: 20, pending: 6, approved: 7, rejected: 8, completed: 9, noShow: 10 },
  workers: { applied: 11, worked: 13 },
  money: { totalPaidOut: 15400 },
};

describe("BusinessStatistics", () => {
  it("renders the shift counters", () => {
    render(<BusinessStatistics summary={summary} />);

    expect(screen.getByText("Усього змін")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument(); // total
    expect(screen.getByText("2")).toBeInTheDocument(); // open
    expect(screen.getByText("3")).toBeInTheDocument(); // booked
    expect(screen.getByText("1")).toBeInTheDocument(); // inProgress
    expect(screen.getByText("5")).toBeInTheDocument(); // completed
    expect(screen.getByText("4")).toBeInTheDocument(); // cancelled
  });

  it("renders the application counters", () => {
    render(<BusinessStatistics summary={summary} />);

    expect(screen.getByText("Усього заявок")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders worker counts and the estimated payout with its hint", () => {
    render(<BusinessStatistics summary={summary} />);

    expect(screen.getByText("Подавали заявки")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();

    expect(screen.getByText("Орієнтовні виплати")).toBeInTheDocument();
    expect(screen.getByText(/15[\s  ]?400 ₴/)).toBeInTheDocument();
    expect(
      screen.getByText("Оцінка за ставкою і бонусом завершених змін"),
    ).toBeInTheDocument();
  });
});
