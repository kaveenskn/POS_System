import { useState } from 'react';
import type { MonthlyTrendPoint, SalesTrendPoint } from '../../../types/dashboard.types';

interface SalesOverviewProps {
  salesTrendDays: SalesTrendPoint[];
  monthlyTrend: MonthlyTrendPoint[];
  activePeriod: '7days' | '6months';
  onPeriodChange: (period: '7days' | '6months') => void;
}

export function SalesOverview({
  salesTrendDays,
  monthlyTrend,
  activePeriod,
  onPeriodChange,
}: SalesOverviewProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const dataPoints =
    activePeriod === '7days'
      ? salesTrendDays.map((d) => ({
          label: d.label,
          shortLabel: d.label.split(' ')[0], // e.g. "Mon"
          date: d.date,
          revenue: d.revenue,
          count: d.invoices_count,
        }))
      : monthlyTrend.map((m) => ({
          label: m.label,
          shortLabel: m.label.split(' ')[0], // e.g. "Nov"
          date: m.month,
          revenue: m.revenue,
          count: m.invoices_count,
        }));

  const totalPeriodRevenue = dataPoints.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalPeriodInvoices = dataPoints.reduce((acc, curr) => acc + curr.count, 0);
  const maxRevenue = Math.max(...dataPoints.map((d) => d.revenue), 1000);

  // SVG dimensions
  const svgWidth = 900;
  const svgHeight = 200;
  const padX = 35;
  const padTop = 25;
  const padBottom = 35;
  const drawWidth = svgWidth - padX * 2;
  const drawHeight = svgHeight - padTop - padBottom;

  const count = dataPoints.length;
  const points = dataPoints.map((pt, index) => {
    const x = count > 1 ? padX + (index / (count - 1)) * drawWidth : padX + drawWidth / 2;
    const ratio = pt.revenue / maxRevenue;
    const y = padTop + drawHeight - ratio * drawHeight;
    return { ...pt, x, y };
  });

  // Build SVG path
  let pathD = '';
  let areaD = '';

  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      pathD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }

    const firstPt = points[0];
    const lastPt = points[points.length - 1];
    const groundY = padTop + drawHeight;
    areaD = `${pathD} L ${lastPt.x} ${groundY} L ${firstPt.x} ${groundY} Z`;
  }

  return (
    <section className="sales-overview border border-[#292b31] bg-[#17181c] rounded-2xl p-6 sm:p-7 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 id="sales-overview-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight !mb-0">
              Sales & Revenue Performance
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f04b2f]/10 text-[#f05232] border border-[#f04b2f]/20">
              Live POS Data
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8a8d99] mt-1">
            Tracking counter invoices and completed orders across time
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-2 bg-[#121316] p-1 rounded-xl border border-[#25272e]">
          <button
            type="button"
            onClick={() => onPeriodChange('7days')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activePeriod === '7days'
                ? 'bg-[#f04b2f] text-white shadow-md'
                : 'text-[#9a9ca6] hover:text-white hover:bg-[#1c1d22]'
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange('6months')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activePeriod === '6months'
                ? 'bg-[#f04b2f] text-white shadow-md'
                : 'text-[#9a9ca6] hover:text-white hover:bg-[#1c1d22]'
            }`}
          >
            Last 6 Months
          </button>
        </div>
      </div>

      {/* Metrics Snapshot Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 p-3.5 bg-[#121316] rounded-xl border border-[#22242a]">
        <div>
          <span className="text-xs text-[#80838f] block font-medium">Period Revenue</span>
          <span className="text-base sm:text-lg font-bold text-white tracking-tight">
            Rs. {totalPeriodRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-xs text-[#80838f] block font-medium">Invoices Settled</span>
          <span className="text-base sm:text-lg font-bold text-white tracking-tight">
            {totalPeriodInvoices} {totalPeriodInvoices === 1 ? 'sale' : 'sales'}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-xs text-[#80838f] block font-medium">Period Peak Value</span>
          <span className="text-base sm:text-lg font-bold text-emerald-400 tracking-tight">
            Rs. {maxRevenue > 1000 ? maxRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </span>
        </div>
      </div>

      {/* Dynamic SVG Chart */}
      <div className="relative h-[220px] w-full pt-2">
        {/* Background Grid Lines */}
        <div className="absolute inset-x-0 top-6 bottom-9 flex flex-col justify-between pointer-events-none">
          <div className="border-b border-[#25272e]/60 w-full" />
          <div className="border-b border-[#25272e]/60 w-full" />
          <div className="border-b border-[#25272e]/60 w-full" />
          <div className="border-b border-[#292b31] w-full" />
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="dashboardChartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f04b2f" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#f04b2f" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f04b2f" stopOpacity="0" />
            </linearGradient>
            <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#f04b2f" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#dashboardChartFill)" />}

          {/* Line stroke */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#f05232"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#chartGlow)"
            />
          )}

          {/* Data Points */}
          {points.map((pt, i) => (
            <g
              key={pt.date}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Invisible larger hit target */}
              <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
              {/* Outer ring */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? '7' : '4'}
                fill="#17181c"
                stroke="#f05232"
                strokeWidth={hoveredIndex === i ? '3' : '2'}
                className="transition-all duration-150"
              />
              {/* Center dot */}
              <circle cx={pt.x} cy={pt.y} r="2" fill="#ffffff" />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-[#0d0e10] border border-[#f04b2f]/50 px-3 py-2 rounded-xl shadow-2xl text-xs whitespace-nowrap"
            style={{
              left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
              top: `${(points[hoveredIndex].y / svgHeight) * 100 - 8}%`,
            }}
          >
            <p className="font-semibold text-white">{points[hoveredIndex].label}</p>
            <p className="text-[#f05232] font-bold text-sm mt-0.5">
              Rs. {points[hoveredIndex].revenue.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[#8a8d99] text-[11px] mt-0.5">
              {points[hoveredIndex].count} {points[hoveredIndex].count === 1 ? 'sale' : 'sales'}
            </p>
          </div>
        )}

        {/* Bottom X-Axis Date Labels */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-3 text-xs text-[#8a8d99] font-medium select-none pointer-events-none">
          {points.map((pt) => (
            <span key={pt.date} className="text-center w-16 truncate">
              {pt.shortLabel}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
