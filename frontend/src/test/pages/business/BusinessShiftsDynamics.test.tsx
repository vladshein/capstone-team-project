import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BusinessShiftsDynamics } from "../../../pages/business/BusinessShiftsDynamics";
import type { BusinessShiftsStatistics } from "../../../redux/business-statistics/types";

const monthlyData: BusinessShiftsStatistics = {
  totals: {
    completedShifts: 2,
    noShows: 1,
    scheduledCompletedHours: 16,
    estimatedSpend: 3200,
  },
  series: [
    { period: "2026-07", completedShifts: 1, noShows: 0, scheduledHours: 8, spend: 1600 },
    { period: "2026-08", completedShifts: 1, noShows: 1, scheduledHours: 8, spend: 1600 },
  ],
};

function renderChart(overrides: Partial<ComponentProps<typeof BusinessShiftsDynamics>> = {}) {
  const props = {
    data: monthlyData,
    isLoading: false,
    error: null,
    groupBy: "month" as const,
    onGroupByChange: jest.fn(),
    onRetry: jest.fn(),
    ...overrides,
  };

  render(<BusinessShiftsDynamics {...props} />);
  return props;
}

describe("BusinessShiftsDynamics", () => {
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

  it("renders formatted period labels for months", () => {
    renderChart();

    expect(screen.getByText("Лип 26")).toBeInTheDocument();
    expect(screen.getByText("Сер 26")).toBeInTheDocument();
  });

  it("calls onGroupByChange when switching between week and month", async () => {
    const user = userEvent.setup();
    const props = renderChart();

    await user.click(screen.getByRole("button", { name: "Тижні" }));
    expect(props.onGroupByChange).toHaveBeenCalledWith("week");
  });

  it("shows the completed/no-show legend only for the count metric, and money for the spend metric", async () => {
    const user = userEvent.setup();
    renderChart();

    expect(screen.getByText("Завершено змін")).toBeInTheDocument();
    expect(screen.getByText("No-show")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Гроші" }));

    expect(screen.getByText("Орієнтовні виплати, ₴")).toBeInTheDocument();
    expect(screen.queryByText("No-show")).not.toBeInTheDocument();
  });

  it("pads a short series with leading placeholder slots", () => {
    renderChart({
      data: {
        totals: monthlyData.totals,
        series: [
          { period: "2026-08", completedShifts: 1, noShows: 0, scheduledHours: 8, spend: 1600 },
        ],
      },
    });

    // MIN_SLOTS is 6, so 5 placeholder months should precede the single real one.
    expect(screen.getByText("Бер 26")).toBeInTheDocument();
    expect(screen.getByText("Сер 26")).toBeInTheDocument();
  });

  const hoverBar = (label: string) => {
    const bar = screen.getByText(label).parentElement as HTMLElement;
    fireEvent.mouseEnter(bar);
    return bar;
  };

  it("formats the count-metric tooltip on hover", () => {
    renderChart();

    hoverBar("Сер 26");
    expect(
      screen.getByText("2026-08: 1 завершено, 1 no-show"),
    ).toBeInTheDocument();
  });

  it("formats the hours-metric tooltip", async () => {
    const user = userEvent.setup();
    renderChart();

    await user.click(screen.getByRole("button", { name: "Години" }));
    hoverBar("Сер 26");

    expect(screen.getByText("2026-08: 8.0 год")).toBeInTheDocument();
  });

  it("formats the spend-metric tooltip with the currency formatter", async () => {
    const user = userEvent.setup();
    renderChart();

    await user.click(screen.getByRole("button", { name: "Гроші" }));
    hoverBar("Сер 26");

    expect(screen.getByText(/^2026-08: 1[\s  ]?600 ₴$/)).toBeInTheDocument();
  });

  it("shows a 'no data' tooltip for a placeholder slot", () => {
    renderChart({
      data: {
        totals: monthlyData.totals,
        series: [
          { period: "2026-08", completedShifts: 1, noShows: 0, scheduledHours: 8, spend: 1600 },
        ],
      },
    });

    hoverBar("Бер 26");
    expect(screen.getByText("Бер 26: немає даних")).toBeInTheDocument();
  });
});
