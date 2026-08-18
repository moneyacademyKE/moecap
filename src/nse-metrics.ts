export type MetricRow = Record<string, unknown>;

export type NamedNumber = { key: string; value: number };

function namedNumber(row: MetricRow, keys: readonly string[]): NamedNumber | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return { key, value };
  }
  return null;
}

export function revenueFor(row: MetricRow): NamedNumber | null {
  const direct = namedNumber(row, [
    "Revenue",
    "Turnover",
    "Total Revenue",
    "Service Revenue",
    "Gross Earned Premiums",
    "Insurance Revenue",
    "Total Operating Income",
    "Total Income",
    "Interest Income",
  ]);
  if (direct) return direct;

  const netInterest = namedNumber(row, ["Net Interest Income"]);
  const nonInterest = namedNumber(row, ["Non-Interest Income"]);
  if (netInterest && nonInterest) {
    return { key: "Net Interest Income + Non-Interest Income", value: netInterest.value + nonInterest.value };
  }
  return null;
}

export function netIncomeFor(row: MetricRow): NamedNumber | null {
  return namedNumber(row, [
    "Net Income",
    "Profit after Tax",
    "Profit After Tax",
    "Net Profit",
    "Profit for the Year",
    "Profit for the year",
  ]);
}

export function equityFor(row: MetricRow): NamedNumber | null {
  return namedNumber(row, [
    "Total Equity",
    "Shareholders Funds",
    "Shareholders Equity",
    "Total Shareholders Equity",
  ]);
}

export function assetsFor(row: MetricRow): NamedNumber | null {
  return namedNumber(row, ["Total Assets"]);
}

export function operatingProfitFor(row: MetricRow): NamedNumber | null {
  return namedNumber(row, ["Operating Income", "EBIT"]);
}

export function percent(value: number | null): number | null {
  return value === null || !Number.isFinite(value) ? null : value * 100;
}

export function calculateRoe(row: MetricRow, ratios: MetricRow = {}): number | null {
  const reported = namedNumber(ratios, ["ROE (%)"]);
  if (reported) return Math.abs(reported.value) < 1 ? reported.value * 100 : reported.value;

  const netIncome = netIncomeFor(row);
  const equity = equityFor(row);
  return netIncome && equity && equity.value > 0 ? percent(netIncome.value / equity.value) : null;
}

export function calculateRoa(row: MetricRow, ratios: MetricRow = {}): number | null {
  const reported = namedNumber(ratios, ["ROA (%)"]);
  if (reported) return Math.abs(reported.value) < 1 ? reported.value * 100 : reported.value;

  const netIncome = netIncomeFor(row);
  const assets = assetsFor(row);
  return netIncome && assets && assets.value > 0 ? percent(netIncome.value / assets.value) : null;
}

export function calculateNetMargin(row: MetricRow, ratios: MetricRow = {}): number | null {
  const reported = namedNumber(ratios, ["Net Margin (%)"]);
  if (reported) return Math.abs(reported.value) < 1 ? reported.value * 100 : reported.value;

  const netIncome = netIncomeFor(row);
  const revenue = revenueFor(row);
  return netIncome && revenue && revenue.value !== 0 ? percent(netIncome.value / revenue.value) : null;
}

export function calculateAssetTurnover(row: MetricRow, ratios: MetricRow = {}): number | null {
  const reported = namedNumber(ratios, ["Asset Turnover (x)"]);
  if (reported) return reported.value;

  const revenue = revenueFor(row);
  const assets = assetsFor(row);
  return revenue && assets && assets.value > 0 ? revenue.value / assets.value : null;
}

export function calculateRoic(row: MetricRow): number | null {
  const operatingProfit = operatingProfitFor(row);
  const equity = equityFor(row);
  if (!operatingProfit || !equity || equity.value <= 0) return null;

  const debt = namedNumber(row, ["Total Debt"])?.value ?? 0;
  const cash = namedNumber(row, ["Cash & Bank"])?.value ?? 0;
  const investedCapital = equity.value + debt - cash;
  if (investedCapital <= 0) return null;

  const taxExpense = namedNumber(row, ["Income Tax Expense"])?.value ?? null;
  const taxRate = taxExpense !== null && operatingProfit.value > 0
    ? Math.min(0.5, Math.max(0, Math.abs(taxExpense) / operatingProfit.value))
    : 0.3;
  return percent((operatingProfit.value * (1 - taxRate)) / investedCapital);
}
