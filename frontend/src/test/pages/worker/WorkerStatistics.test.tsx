import { render, screen } from "@testing-library/react";
import { WorkerStatistics } from "../../../pages/worker/WorkerStatistics";
import type { StatisticsSummary } from "../../../redux/worker-statistics/types";

const baseSummary: StatisticsSummary = {
  applications: { total: 10, pending: 2, approved: 3, rejected: 1, completed: 4, noShow: 5 },
  shifts: {
    completed: 6,
    upcoming: 7,
    scheduledCompletedHours: 24.5,
    estimatedCompletedEarnings: 4800,
  },
  companiesWorkedFor: 8,
  attendance: { completed: 3, noShow: 1, rate: 75 },
  wallet: { balance: 1200, frozenBalance: 200 },
};

describe("WorkerStatistics", () => {
  it("renders the application counters", () => {
    render(<WorkerStatistics summary={baseSummary} />);

    expect(screen.getByText("Усього заявок")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders scheduled hours and estimated earnings", () => {
    render(<WorkerStatistics summary={baseSummary} />);

    expect(screen.getByText("24.5")).toBeInTheDocument();
    expect(screen.getByText(/4\s?800\s?₴/)).toBeInTheDocument();
  });

  it("renders the attendance rate and hint", () => {
    render(<WorkerStatistics summary={baseSummary} />);

    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("3 відвідано · 1 неявок")).toBeInTheDocument();
  });

  it("renders the wallet balance with frozen balance hint when present", () => {
    render(<WorkerStatistics summary={baseSummary} />);

    expect(screen.getByText("Баланс гаманця")).toBeInTheDocument();
    expect(screen.getByText(/200\s?₴ заморожено/)).toBeInTheDocument();
  });

  it("omits the wallet card entirely when wallet is null", () => {
    render(<WorkerStatistics summary={{ ...baseSummary, wallet: null }} />);

    expect(screen.queryByText("Баланс гаманця")).not.toBeInTheDocument();
  });

  it("omits the frozen balance hint when there is nothing frozen", () => {
    render(
      <WorkerStatistics
        summary={{ ...baseSummary, wallet: { balance: 1200, frozenBalance: 0 } }}
      />,
    );

    expect(screen.getByText("Баланс гаманця")).toBeInTheDocument();
    expect(screen.queryByText(/заморожено/)).not.toBeInTheDocument();
  });
});
