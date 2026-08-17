import { describe, expect, test } from "bun:test";
import {
  calculateAssetTurnover,
  calculateNetMargin,
  calculateRoa,
  calculateRoe,
  calculateRoic,
  netIncomeFor,
  revenueFor,
} from "../src/nse-metrics";

describe("NSE computed metrics", () => {
  test("recognises audited bank aliases and derives revenue from same-period income lines", () => {
    const metrics = {
      "Net Interest Income": 126_940,
      "Non-Interest Income": 90_800,
      "Profit after Tax": 75_550,
      "Total Assets": 1_971_160,
      "Shareholders Funds": 331_466,
    };

    expect(revenueFor(metrics)).toEqual({
      key: "Net Interest Income + Non-Interest Income",
      value: 217_740,
    });
    expect(netIncomeFor(metrics)).toEqual({ key: "Profit after Tax", value: 75_550 });
    expect(calculateRoe(metrics)).toBeCloseTo(22.79, 2);
    expect(calculateRoa(metrics)).toBeCloseTo(3.83, 2);
    expect(calculateNetMargin(metrics)).toBeCloseTo(34.70, 2);
    expect(calculateAssetTurnover(metrics)).toBeCloseTo(0.11, 2);
  });

  test("prefers reported ratios, normalising decimal percentages", () => {
    expect(calculateRoe({}, { "ROE (%)": 0.233 })).toBeCloseTo(23.3, 6);
    expect(calculateNetMargin({}, { "Net Margin (%)": 0.15 })).toBeCloseTo(15, 6);
    expect(calculateAssetTurnover({}, { "Asset Turnover (x)": 1.4 })).toBe(1.4);
  });

  test("leaves ROIC unavailable without an operating-profit basis", () => {
    expect(calculateRoic({ "Profit after Tax": 29_750, "Shareholders Funds": 165_470 })).toBeNull();
  });

  test("computes ROIC only from an operating-profit basis and same-period capital", () => {
    const metrics = {
      "Operating Income": 10_000,
      "Total Equity": 50_000,
      "Total Debt": 20_000,
      "Cash & Bank": 5_000,
      "Income Tax Expense": -3_000,
    };
    expect(calculateRoic(metrics)).toBeCloseTo(10.769230769, 6);
  });
});
