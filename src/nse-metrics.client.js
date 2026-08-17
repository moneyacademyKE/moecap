function nseNamedNumber(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return { key, value };
  }
  return null;
}

function nseRevenueFor(row) {
  const direct = nseNamedNumber(row, [
    "Revenue", "Turnover", "Service Revenue", "Gross Earned Premiums", "Interest Income",
  ]);
  if (direct) return direct;
  const netInterest = nseNamedNumber(row, ["Net Interest Income"]);
  const nonInterest = nseNamedNumber(row, ["Non-Interest Income"]);
  return netInterest && nonInterest
    ? { key: "Net Interest Income + Non-Interest Income", value: netInterest.value + nonInterest.value }
    : null;
}

function nseNetIncomeFor(row) {
  return nseNamedNumber(row, [
    "Net Income", "Profit after Tax", "Profit After Tax", "Net Profit", "Profit for the Year",
  ]);
}

function nseEquityFor(row) {
  return nseNamedNumber(row, ["Total Equity", "Shareholders Funds", "Shareholders Equity"]);
}

function nseAssetsFor(row) {
  return nseNamedNumber(row, ["Total Assets"]);
}

function nseOperatingProfitFor(row) {
  return nseNamedNumber(row, ["Operating Income", "EBIT"]);
}

function nsePercent(value) {
  return value === null || !Number.isFinite(value) ? null : value * 100;
}

function nseCalculateRoe(row, ratios = {}) {
  const reported = nseNamedNumber(ratios, ["ROE (%)"]);
  if (reported) return Math.abs(reported.value) < 1 ? reported.value * 100 : reported.value;
  const netIncome = nseNetIncomeFor(row);
  const equity = nseEquityFor(row);
  return netIncome && equity && equity.value > 0 ? nsePercent(netIncome.value / equity.value) : null;
}

function nseCalculateRoa(row, ratios = {}) {
  const reported = nseNamedNumber(ratios, ["ROA (%)"]);
  if (reported) return Math.abs(reported.value) < 1 ? reported.value * 100 : reported.value;
  const netIncome = nseNetIncomeFor(row);
  const assets = nseAssetsFor(row);
  return netIncome && assets && assets.value > 0 ? nsePercent(netIncome.value / assets.value) : null;
}

function nseCalculateNetMargin(row, ratios = {}) {
  const reported = nseNamedNumber(ratios, ["Net Margin (%)"]);
  if (reported) return Math.abs(reported.value) < 1 ? reported.value * 100 : reported.value;
  const netIncome = nseNetIncomeFor(row);
  const revenue = nseRevenueFor(row);
  return netIncome && revenue && revenue.value !== 0 ? nsePercent(netIncome.value / revenue.value) : null;
}

function nseCalculateAssetTurnover(row, ratios = {}) {
  const reported = nseNamedNumber(ratios, ["Asset Turnover (x)"]);
  if (reported) return reported.value;
  const revenue = nseRevenueFor(row);
  const assets = nseAssetsFor(row);
  return revenue && assets && assets.value > 0 ? revenue.value / assets.value : null;
}

function nseCalculateRoic(row) {
  const operatingProfit = nseOperatingProfitFor(row);
  const equity = nseEquityFor(row);
  if (!operatingProfit || !equity || equity.value <= 0) return null;
  const debt = nseNamedNumber(row, ["Total Debt"])?.value ?? 0;
  const cash = nseNamedNumber(row, ["Cash & Bank"])?.value ?? 0;
  const investedCapital = equity.value + debt - cash;
  if (investedCapital <= 0) return null;
  const taxExpense = nseNamedNumber(row, ["Income Tax Expense"])?.value ?? null;
  const taxRate = taxExpense !== null && operatingProfit.value > 0
    ? Math.min(0.5, Math.max(0, Math.abs(taxExpense) / operatingProfit.value))
    : 0.3;
  return nsePercent((operatingProfit.value * (1 - taxRate)) / investedCapital);
}
