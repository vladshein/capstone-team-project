import type { ComponentType } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkerShiftsDynamics } from "../../pages/worker/WorkerShiftsDynamics";
import { BusinessShiftsDynamics } from "../../pages/business/BusinessShiftsDynamics";

type GroupBy = "week" | "month";

interface Variant {
  name: string;
  Component: ComponentType<Record<string, unknown>>;
  moneyField: "estimatedEarnings" | "spend";
  totalsMoneyField: "estimatedCompletedEarnings" | "estimatedSpend";
  moneyMetricLabel: string;
}

const variants: Variant[] = [
  {
    name: "WorkerShiftsDynamics",
    Component: WorkerShiftsDynamics as never,
    moneyField: "estimatedEarnings",
    totalsMoneyField: "estimatedCompletedEarnings",
    moneyMetricLabel: "Орієнтовний заробіток, ₴",
  },
  {
    name: "BusinessShiftsDynamics",
    Component: BusinessShiftsDynamics as never,
    moneyField: "spend",
    totalsMoneyField: "estimatedSpend",
    moneyMetricLabel: "Орієнтовні виплати, ₴",
  },
];

describe.each(variants)(
  "$name",
  ({ Component, moneyField, totalsMoneyField, moneyMetricLabel }) => {
    const point = (period: string, completed: number, noShow: number, hours: number, money: number) => ({
      period,
      completedShifts: completed,
      noShows: noShow,
      scheduledHours: hours,
      [moneyField]: money,
    });

    const totals = {
      completedShifts: 2,
      noShows: 1,
      scheduledCompletedHours: 16,
      [totalsMoneyField]: 3200,
    };

    const twoMonths = {
      totals,
      series: [point("2026-07", 1, 0, 8, 1600), point("2026-08", 1, 1, 8, 1600)],
    };

    const oneMonth = (period: string) => ({ totals, series: [point(period, 1, 0, 8, 1600)] });

    const renderChart = (overrides: Record<string, unknown> = {}) => {
      const props = {
        data: twoMonths,
        isLoading: false,
        error: null,
        groupBy: "month" as GroupBy,
        onGroupByChange: jest.fn(),
        onRetry: jest.fn(),
        ...overrides,
      };
      render(<Component {...props} />);
      return props;
    };

    const hoverBar = (label: string) => {
      const bar = screen.getByText(label).parentElement as HTMLElement;
      fireEvent.mouseEnter(bar);
      return bar;
    };

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

    it("renders nothing chart-related without data, loading or error", () => {
      renderChart({ data: null });
      expect(screen.queryByText("Завантаження…")).not.toBeInTheDocument();
      expect(screen.queryByText("Кількість змін")).not.toBeInTheDocument();
    });

    it("renders formatted month labels", () => {
      renderChart();
      expect(screen.getByText("Лип 26")).toBeInTheDocument();
      expect(screen.getByText("Сер 26")).toBeInTheDocument();
    });

    it("renders formatted week labels", () => {
      renderChart({ groupBy: "week", data: oneMonth("2026-W30") });
      expect(screen.getByText("Т30")).toBeInTheDocument();
    });

    it("calls onGroupByChange when switching week/month", async () => {
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

      await user.click(screen.getByRole("button", { name: "Гроші" }));

      expect(screen.getByText(moneyMetricLabel)).toBeInTheDocument();
      expect(screen.queryByText("No-show")).not.toBeInTheDocument();
    });

    it("pads a short series with leading placeholder slots", () => {
      renderChart({ data: oneMonth("2026-08") });
      // MIN_SLOTS = 6 → 5 placeholder months precede the single real one.
      expect(screen.getByText("Бер 26")).toBeInTheDocument();
      expect(screen.getByText("Сер 26")).toBeInTheDocument();
    });

    it("formats the count-metric tooltip on hover", () => {
      renderChart();
      hoverBar("Сер 26");
      expect(screen.getByText("2026-08: 1 завершено, 1 no-show")).toBeInTheDocument();
    });

    it("formats the hours-metric tooltip", async () => {
      const user = userEvent.setup();
      renderChart();

      await user.click(screen.getByRole("button", { name: "Години" }));
      hoverBar("Сер 26");
      expect(screen.getByText("2026-08: 8.0 год")).toBeInTheDocument();
    });

    it("formats the money-metric tooltip with the currency formatter", async () => {
      const user = userEvent.setup();
      renderChart();

      await user.click(screen.getByRole("button", { name: "Гроші" }));
      hoverBar("Сер 26");
      // uk-UA groups thousands with a (narrow) no-break space.
      expect(screen.getByText(/^2026-08: 1[\s  ]?600 ₴$/)).toBeInTheDocument();
    });

    it("hides the tooltip again on mouse leave", () => {
      renderChart();
      const bar = hoverBar("Сер 26");

      expect(screen.getByText("2026-08: 1 завершено, 1 no-show")).toBeInTheDocument();
      fireEvent.mouseLeave(bar);
      expect(screen.queryByText("2026-08: 1 завершено, 1 no-show")).not.toBeInTheDocument();
    });

    it("shows a 'no data' tooltip for a placeholder slot", () => {
      renderChart({ data: oneMonth("2026-08") });
      hoverBar("Бер 26");
      expect(screen.getByText("Бер 26: немає даних")).toBeInTheDocument();
    });
  },
);
