import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkerShiftsDynamics } from "../../../pages/worker/WorkerShiftsDynamics";
import type { ShiftsStatistics } from "../../../redux/worker-statistics/types";

const monthlyData: ShiftsStatistics = {
  totals: {
    completedShifts: 2,
    noShows: 1,
    scheduledCompletedHours: 16,
    estimatedCompletedEarnings: 3200,
  },
  series: [
    { period: "2026-07", completedShifts: 1, noShows: 0, scheduledHours: 8, estimatedEarnings: 1600 },
    { period: "2026-08", completedShifts: 1, noShows: 1, scheduledHours: 8, estimatedEarnings: 1600 },
  ],
};

function renderChart(overrides: Partial<ComponentProps<typeof WorkerShiftsDynamics>> = {}) {
  const props = {
    data: monthlyData,
    isLoading: false,
    error: null,
    groupBy: "month" as const,
    onGroupByChange: jest.fn(),
    onRetry: jest.fn(),
    ...overrides,
  };

  render(<WorkerShiftsDynamics {...props} />);
  return props;
}

describe("WorkerShiftsDynamics", () => {
  it("shows a loading message while fetching with no data yet", () => {
    renderChart({ data: null, isLoading: true });

    expect(screen.getByText("Завантаження…")).toBeInTheDocument();
  });

  it("shows the error message and retries on button click", async () => {
    const user = userEvent.setup();
    const props = renderChart({ error: "Не вдалося завантажити дані" });

    expect(screen.getByText("Не вдалося завантажити дані")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Спробувати ще раз" }));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders nothing chart-related when there is no data and no loading/error", () => {
    renderChart({ data: null });

    expect(screen.queryByText("Завантаження…")).not.toBeInTheDocument();
    expect(screen.queryByText("Кількість змін")).not.toBeInTheDocument();
  });

  it("renders formatted period labels for months", () => {
    renderChart();

    expect(screen.getByText("Лип 26")).toBeInTheDocument();
    expect(screen.getByText("Сер 26")).toBeInTheDocument();
  });

  it("renders formatted period labels for weeks", () => {
    renderChart({
      groupBy: "week",
      data: {
        totals: monthlyData.totals,
        series: [
          { period: "2026-W30", completedShifts: 1, noShows: 0, scheduledHours: 8, estimatedEarnings: 1600 },
        ],
      },
    });

    expect(screen.getByText("Т30")).toBeInTheDocument();
  });

  it("calls onGroupByChange when switching between week and month", async () => {
    const user = userEvent.setup();
    const props = renderChart();

    await user.click(screen.getByRole("button", { name: "Тижні" }));
    expect(props.onGroupByChange).toHaveBeenCalledWith("week");
  });

  it("shows the completed/no-show legend only for the count metric", async () => {
    const user = userEvent.setup();
    renderChart();

    expect(screen.getByText("Завершено змін")).toBeInTheDocument();
    expect(screen.getByText("No-show")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Години" }));

    expect(screen.getByText("Відпрацьовані години")).toBeInTheDocument();
    expect(screen.queryByText("No-show")).not.toBeInTheDocument();
  });

  it("pads a short series with leading placeholder slots", () => {
    renderChart({
      data: {
        totals: monthlyData.totals,
        series: [
          { period: "2026-08", completedShifts: 1, noShows: 0, scheduledHours: 8, estimatedEarnings: 1600 },
        ],
      },
    });

    // MIN_SLOTS is 6, so 5 placeholder months should precede the single real one.
    expect(screen.getByText("Бер 26")).toBeInTheDocument();
    expect(screen.getByText("Сер 26")).toBeInTheDocument();
  });
});
