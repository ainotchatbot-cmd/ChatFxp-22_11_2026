import React, { useState } from 'react';
import { FileSpreadsheet, Plus, Redo2, Undo2 } from 'lucide-react';

interface FakeSpreadsheetDecoyProps {
  onRestore: () => void;
  onReturnPortal?: () => void;
  restoreLabel?: string;
  returnLabel?: string;
}

interface SheetRow {
  row: number;
  category: string;
  oct: number;
  nov: number;
  dec: number;
  budget: number;
  status: string;
}

const SHEET_TABS = ['Q4_Summary', 'Dept_Breakdown', 'Vendor_Invoices', 'Headcount_Model'] as const;

const ROWS: SheetRow[] = [
  { row: 2, category: 'Cloud Infrastructure & Hosting', oct: 14250, nov: 14820, dec: 15110, budget: 46000, status: 'Approved' },
  { row: 3, category: 'Q4 Paid Search & Acquisition', oct: 18400, nov: 21150, dec: 19800, budget: 60000, status: 'Approved' },
  { row: 4, category: 'Facilities, Lease & Utilities', oct: 9600, nov: 9600, dec: 9850, budget: 29500, status: 'Locked' },
  { row: 5, category: 'Enterprise SaaS & Security', oct: 6180, nov: 6340, dec: 6290, budget: 19200, status: 'Approved' },
  { row: 6, category: 'Advisory & Legal Retainers', oct: 5400, nov: 4800, dec: 5100, budget: 16500, status: 'Review' },
  { row: 7, category: 'Regional Logistics & Travel', oct: 3290, nov: 2840, dec: 4120, budget: 11000, status: 'Approved' },
  { row: 8, category: 'Hardware & Workstation Lease', oct: 2950, nov: 2950, dec: 2950, budget: 9000, status: 'Locked' },
  { row: 9, category: 'Contingency Reserve (4%)', oct: 1200, nov: 1500, dec: 1800, budget: 5000, status: 'Active' },
];

const DEPT_ROWS: SheetRow[] = [
  { row: 2, category: 'Engineering & Platform Ops', oct: 24500, nov: 25100, dec: 25800, budget: 76000, status: 'Approved' },
  { row: 3, category: 'Product Design & Research', oct: 11200, nov: 11450, dec: 11900, budget: 35000, status: 'Approved' },
  { row: 4, category: 'Revenue Operations & CRM', oct: 14800, nov: 15900, dec: 16200, budget: 48000, status: 'Review' },
  { row: 5, category: 'Compliance & Internal Audit', oct: 6900, nov: 7100, dec: 7050, budget: 21500, status: 'Locked' },
  { row: 6, category: 'Customer Support Desk', oct: 8300, nov: 8450, dec: 8900, budget: 26000, status: 'Approved' },
];

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export const FakeSpreadsheetDecoy: React.FC<FakeSpreadsheetDecoyProps> = ({
  onRestore,
  onReturnPortal,
  restoreLabel = 'Restore Session',
  returnLabel,
}) => {
  const [activeTab, setActiveTab] = useState<(typeof SHEET_TABS)[number]>('Q4_Summary');
  const [selectedCell, setSelectedCell] = useState<{ coord: string; formula: string }>({
    coord: 'E10',
    formula: '=SUM(E2:E9)',
  });

  const activeRows = activeTab === 'Dept_Breakdown' ? DEPT_ROWS : ROWS;
  const totalRowNum = activeRows.length + 2;
  const sumOct = activeRows.reduce((s, r) => s + r.oct, 0);
  const sumNov = activeRows.reduce((s, r) => s + r.nov, 0);
  const sumDec = activeRows.reduce((s, r) => s + r.dec, 0);
  const sumQ4 = sumOct + sumNov + sumDec;
  const sumBudget = activeRows.reduce((s, r) => s + r.budget, 0);
  const totalVariancePct = (((sumQ4 - sumBudget) / sumBudget) * 100).toFixed(1);

  return (
    <div
      dir="ltr"
      className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1E293B] font-sans select-none"
    >
      {/* Top Spreadsheet Title + Menu Bar */}
      <header className="border-b border-slate-300 bg-white px-3 sm:px-4 pt-2 pb-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#107C41] text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-slate-900 truncate">
                  Q4_2026_Operating_Budget_Forecast.xlsx
                </h1>
                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                  Saved locally
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-600 mt-0.5">
                {['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Extensions', 'Help'].map((m) => (
                  <span key={m} className="hover:text-slate-900 cursor-default">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.location.replace('about:blank')}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              about:blank
            </button>
            {onReturnPortal && returnLabel && (
              <button
                type="button"
                onClick={onReturnPortal}
                className="rounded border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                {returnLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onRestore}
              className="rounded bg-[#107C41] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#0D6535] cursor-pointer"
            >
              {restoreLabel}
            </button>
          </div>
        </div>

        {/* Classic Formatting Toolbar */}
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-full bg-[#EDF2FA] px-3 py-1 text-[11px] text-slate-700">
          <Undo2 className="w-3.5 h-3.5 text-slate-500" />
          <Redo2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="h-3.5 w-px bg-slate-300" />
          <span className="font-mono font-semibold">100%</span>
          <span className="h-3.5 w-px bg-slate-300" />
          <span className="font-semibold">$</span>
          <span>%</span>
          <span className="font-mono">.00</span>
          <span className="h-3.5 w-px bg-slate-300" />
          <span className="font-bold">B</span>
          <span className="italic">I</span>
          <span className="line-through">S</span>
          <span className="h-3.5 w-px bg-slate-300" />
          <span className="text-[10px] text-slate-500">Segoe UI · 10</span>
        </div>
      </header>

      {/* Formula Bar */}
      <div className="flex items-center border-b border-slate-300 bg-white text-xs">
        <div className="w-20 shrink-0 border-e border-slate-300 px-2.5 py-1.5 font-mono font-semibold text-slate-700 text-center">
          {selectedCell.coord}
        </div>
        <div className="px-2.5 py-1.5 font-mono italic font-bold text-slate-400">fx</div>
        <div className="flex-1 px-2 py-1.5 font-mono text-slate-800 truncate">
          {selectedCell.formula}
        </div>
      </div>

      {/* Main Grid Viewport */}
      <div className="flex-1 overflow-auto bg-[#F1F5F9]">
        <table className="w-full min-w-[820px] border-collapse bg-white text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
              <th className="w-10 border border-slate-300 bg-[#F1F5F9] py-1 text-center" />
              <th className="w-[290px] border border-slate-300 py-1 text-center">A</th>
              <th className="border border-slate-300 py-1 text-center">B</th>
              <th className="border border-slate-300 py-1 text-center">C</th>
              <th className="border border-slate-300 py-1 text-center">D</th>
              <th className="border border-slate-300 py-1 text-center">E</th>
              <th className="border border-slate-300 py-1 text-center">F</th>
              <th className="border border-slate-300 py-1 text-center">G</th>
              <th className="border border-slate-300 py-1 text-center">H</th>
            </tr>
            {/* Row 1: Column Headers */}
            <tr className="bg-[#EEF2F6] font-bold text-slate-800">
              <td className="border border-slate-300 bg-[#F1F5F9] px-2 py-1.5 text-center font-mono text-[11px] text-slate-500">
                1
              </td>
              <td className="border border-slate-300 px-2.5 py-1.5">Line Item / Cost Center</td>
              <td className="border border-slate-300 px-2.5 py-1.5 text-right">Oct (Actual)</td>
              <td className="border border-slate-300 px-2.5 py-1.5 text-right">Nov (Actual)</td>
              <td className="border border-slate-300 px-2.5 py-1.5 text-right">Dec (Est.)</td>
              <td className="border border-slate-300 px-2.5 py-1.5 text-right">Q4 Total</td>
              <td className="border border-slate-300 px-2.5 py-1.5 text-right">Budget Cap</td>
              <td className="border border-slate-300 px-2.5 py-1.5 text-right">Variance %</td>
              <td className="border border-slate-300 px-2.5 py-1.5 text-center">Audit Status</td>
            </tr>
          </thead>

          <tbody>
            {activeRows.map((item) => {
              const q4Total = item.oct + item.nov + item.dec;
              const variancePct = (((q4Total - item.budget) / item.budget) * 100).toFixed(1);
              const varianceNum = Number(variancePct);
              const r = item.row;

              return (
                <tr key={r} className="hover:bg-sky-50/40">
                  <td className="border border-slate-300 bg-[#F8FAFC] px-2 py-1.5 text-center font-mono text-[11px] text-slate-500">
                    {r}
                  </td>
                  <td
                    onClick={() => setSelectedCell({ coord: `A${r}`, formula: item.category })}
                    className={`border border-slate-300 px-2.5 py-1.5 font-medium text-slate-800 cursor-cell ${
                      selectedCell.coord === `A${r}` ? 'ring-2 ring-inset ring-[#107C41] bg-emerald-50/40' : ''
                    }`}
                  >
                    {item.category}
                  </td>
                  <td
                    onClick={() => setSelectedCell({ coord: `B${r}`, formula: String(item.oct) })}
                    className={`border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums cursor-cell ${
                      selectedCell.coord === `B${r}` ? 'ring-2 ring-inset ring-[#107C41] bg-emerald-50/40' : ''
                    }`}
                  >
                    {fmtCurrency(item.oct)}
                  </td>
                  <td
                    onClick={() => setSelectedCell({ coord: `C${r}`, formula: String(item.nov) })}
                    className={`border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums cursor-cell ${
                      selectedCell.coord === `C${r}` ? 'ring-2 ring-inset ring-[#107C41] bg-emerald-50/40' : ''
                    }`}
                  >
                    {fmtCurrency(item.nov)}
                  </td>
                  <td
                    onClick={() => setSelectedCell({ coord: `D${r}`, formula: String(item.dec) })}
                    className={`border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums cursor-cell ${
                      selectedCell.coord === `D${r}` ? 'ring-2 ring-inset ring-[#107C41] bg-emerald-50/40' : ''
                    }`}
                  >
                    {fmtCurrency(item.dec)}
                  </td>
                  <td
                    onClick={() => setSelectedCell({ coord: `E${r}`, formula: `=SUM(B${r}:D${r})` })}
                    className={`border border-slate-300 px-2.5 py-1.5 text-right font-mono font-semibold tabular-nums bg-slate-50/70 cursor-cell ${
                      selectedCell.coord === `E${r}` ? 'ring-2 ring-inset ring-[#107C41] bg-emerald-50/40' : ''
                    }`}
                  >
                    {fmtCurrency(q4Total)}
                  </td>
                  <td
                    onClick={() => setSelectedCell({ coord: `F${r}`, formula: String(item.budget) })}
                    className={`border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums cursor-cell ${
                      selectedCell.coord === `F${r}` ? 'ring-2 ring-inset ring-[#107C41] bg-emerald-50/40' : ''
                    }`}
                  >
                    {fmtCurrency(item.budget)}
                  </td>
                  <td
                    onClick={() =>
                      setSelectedCell({
                        coord: `G${r}`,
                        formula: `=ROUND((E${r}-F${r})/F${r}*100,1)&"%"`,
                      })
                    }
                    className={`border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums cursor-cell ${
                      varianceNum <= 0 ? 'text-emerald-700' : 'text-rose-700'
                    } ${selectedCell.coord === `G${r}` ? 'ring-2 ring-inset ring-[#107C41] bg-emerald-50/40' : ''}`}
                  >
                    {varianceNum > 0 ? `+${variancePct}%` : `${variancePct}%`}
                  </td>
                  <td
                    onClick={() =>
                      setSelectedCell({
                        coord: `H${r}`,
                        formula: `=IF(E${r}<=F${r},"${item.status}","Flag")`,
                      })
                    }
                    className={`border border-slate-300 px-2.5 py-1.5 text-center text-[11px] font-medium text-slate-600 cursor-cell ${
                      selectedCell.coord === `H${r}` ? 'ring-2 ring-inset ring-[#107C41] bg-emerald-50/40' : ''
                    }`}
                  >
                    {item.status}
                  </td>
                </tr>
              );
            })}

            {/* Formula Totals Row */}
            <tr className="bg-[#E8F5E9]/60 font-bold text-slate-900">
              <td className="border border-slate-300 bg-[#F1F5F9] px-2 py-1.5 text-center font-mono text-[11px] text-slate-500">
                {totalRowNum}
              </td>
              <td className="border border-slate-300 px-2.5 py-1.5">TOTAL OPERATING EXPENSE</td>
              <td
                onClick={() =>
                  setSelectedCell({ coord: `B${totalRowNum}`, formula: `=SUM(B2:B${totalRowNum - 1})` })
                }
                className="border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums cursor-cell"
              >
                {fmtCurrency(sumOct)}
              </td>
              <td
                onClick={() =>
                  setSelectedCell({ coord: `C${totalRowNum}`, formula: `=SUM(C2:C${totalRowNum - 1})` })
                }
                className="border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums cursor-cell"
              >
                {fmtCurrency(sumNov)}
              </td>
              <td
                onClick={() =>
                  setSelectedCell({ coord: `D${totalRowNum}`, formula: `=SUM(D2:D${totalRowNum - 1})` })
                }
                className="border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums cursor-cell"
              >
                {fmtCurrency(sumDec)}
              </td>
              <td
                onClick={() =>
                  setSelectedCell({ coord: `E${totalRowNum}`, formula: `=SUM(E2:E${totalRowNum - 1})` })
                }
                className={`border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums cursor-cell ${
                  selectedCell.coord === `E${totalRowNum}` ? 'ring-2 ring-inset ring-[#107C41]' : ''
                }`}
              >
                {fmtCurrency(sumQ4)}
              </td>
              <td
                onClick={() =>
                  setSelectedCell({ coord: `F${totalRowNum}`, formula: `=SUM(F2:F${totalRowNum - 1})` })
                }
                className="border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums cursor-cell"
              >
                {fmtCurrency(sumBudget)}
              </td>
              <td
                onClick={() =>
                  setSelectedCell({
                    coord: `G${totalRowNum}`,
                    formula: `=ROUND((E${totalRowNum}-F${totalRowNum})/F${totalRowNum}*100,1)&"%"`,
                  })
                }
                className="border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums text-emerald-700 cursor-cell"
              >
                {totalVariancePct}%
              </td>
              <td className="border border-slate-300 px-2.5 py-1.5 text-center text-[11px] text-emerald-700">
                Within Cap
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Worksheet Tabs */}
      <footer className="flex items-center justify-between border-t border-slate-300 bg-[#EEF2F6] px-3 py-1 text-[11px] text-slate-600">
        <div className="flex items-center gap-1 overflow-x-auto">
          <Plus className="w-3.5 h-3.5 me-1 text-slate-500 shrink-0" />
          {SHEET_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setSelectedCell({ coord: 'A1', formula: `Sheet: ${tab}` });
              }}
              className={`border px-3 py-1 font-medium cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? 'border-slate-300 border-t-2 border-t-[#107C41] bg-white font-semibold text-[#107C41]'
                  : 'border-transparent hover:bg-slate-200/70'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-slate-500">
          <span>SUM: {fmtCurrency(sumQ4)}</span>
          <span>AVG: {fmtCurrency(Math.round(sumQ4 / activeRows.length))}</span>
          <span>COUNT: {activeRows.length}</span>
        </div>
      </footer>
    </div>
  );
};
