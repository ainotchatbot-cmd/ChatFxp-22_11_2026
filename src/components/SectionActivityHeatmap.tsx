import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Clock, Flame, Layers, RefreshCw, Search, X } from 'lucide-react';
import type { ActivityHeatmapPayload, LanguageCode } from '../types';

type GranularityMode = 'hourly' | 'blocks';
type MetricMode = 'intensity' | 'count';

interface DisplayCell {
  sectionId: string;
  labelHe: string;
  labelEn: string;
  colKey: string;
  colLabel: string;
  timeRangeLabel: string;
  value: number;
  intensity: number;
  count: number;
  heatScore: number;
}

interface TooltipState {
  cell: DisplayCell;
  x: number;
  y: number;
}

interface SectionActivityHeatmapProps {
  data?: ActivityHeatmapPayload;
  sectionHeat?: Record<string, number>;
  lang: LanguageCode;
  loading?: boolean;
  onRefresh?: () => void;
}

const TIME_BLOCKS: {
  key: string;
  hours: number[];
  labelHe: string;
  labelEn: string;
  range: string;
}[] = [
  { key: 'night', hours: [0, 1, 2, 3], labelHe: 'אשמורת', labelEn: 'Night', range: '00:00–03:59' },
  { key: 'dawn', hours: [4, 5, 6, 7], labelHe: 'שחר', labelEn: 'Dawn', range: '04:00–07:59' },
  { key: 'morning', hours: [8, 9, 10, 11], labelHe: 'בוקר', labelEn: 'Morning', range: '08:00–11:59' },
  { key: 'noon', hours: [12, 13, 14, 15], labelHe: 'צהריים', labelEn: 'Afternoon', range: '12:00–15:59' },
  { key: 'evening', hours: [16, 17, 18, 19], labelHe: 'ערב', labelEn: 'Evening', range: '16:00–19:59' },
  { key: 'prime', hours: [20, 21, 22, 23], labelHe: 'שיא לילה', labelEn: 'Prime Night', range: '20:00–23:59' },
];

const padHour = (h: number) => `${String(h).padStart(2, '0')}:00`;

export const SectionActivityHeatmap: React.FC<SectionActivityHeatmapProps> = ({
  data,
  sectionHeat,
  lang,
  loading = false,
  onRefresh,
}) => {
  const isHe = lang === 'he';
  const [granularity, setGranularity] = useState<GranularityMode>('hourly');
  const [metric, setMetric] = useState<MetricMode>('intensity');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<TooltipState | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(840);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const updateWidth = () => {
      const next = Math.max(520, Math.floor(el.clientWidth));
      setContainerWidth(next);
    };
    updateWidth();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filteredSections = useMemo(() => {
    if (!data?.sections) return [];
    const q = searchFilter.trim().toLowerCase();
    if (!q) return data.sections;
    return data.sections.filter(
      (s) =>
        s.sectionId.toLowerCase().includes(q) ||
        s.labelHe.toLowerCase().includes(q) ||
        s.labelEn.toLowerCase().includes(q)
    );
  }, [data?.sections, searchFilter]);

  const { columns, displayCells, columnTotals, maxValue, maxSectionHeat } = useMemo(() => {
    if (!data) {
      return {
        columns: [] as { key: string; label: string; subLabel: string }[],
        displayCells: [] as DisplayCell[],
        columnTotals: [] as { key: string; total: number }[],
        maxValue: 1,
        maxSectionHeat: 1,
      };
    }

    const sectionIds = new Set(filteredSections.map((s) => s.sectionId));
    const heatLookup = new Map<string, number>();
    let topHeat = 1;
    for (const s of data.sections) {
      const score = sectionHeat?.[s.sectionId] ?? s.heatScore ?? 0;
      heatLookup.set(s.sectionId, score);
      if (score > topHeat) topHeat = score;
    }

    const cols =
      granularity === 'hourly'
        ? Array.from({ length: 24 }, (_, h) => ({
            key: String(h),
            label: String(h).padStart(2, '0'),
            subLabel: `${String(h).padStart(2, '0')}:00–${String(h).padStart(2, '0')}:59`,
          }))
        : TIME_BLOCKS.map((b) => ({
            key: b.key,
            label: isHe ? b.labelHe : b.labelEn,
            subLabel: b.range,
          }));

    const cellsOut: DisplayCell[] = [];
    const colTotalMap = new Map<string, number>();
    for (const c of cols) colTotalMap.set(c.key, 0);

    const cellLookup = new Map<string, { count: number; intensity: number }>();
    for (const cell of data.cells) {
      cellLookup.set(`${cell.sectionId}:${cell.hour}`, {
        count: cell.count,
        intensity: cell.intensity,
      });
    }

    let peakVal = 0;

    for (const sec of filteredSections) {
      if (!sectionIds.has(sec.sectionId)) continue;
      const heatScore = heatLookup.get(sec.sectionId) ?? 0;

      if (granularity === 'hourly') {
        for (let h = 0; h < 24; h++) {
          const raw = cellLookup.get(`${sec.sectionId}:${h}`) ?? { count: 0, intensity: 0 };
          const val = metric === 'intensity' ? raw.intensity : raw.count;
          if (val > peakVal) peakVal = val;
          const colKey = String(h);
          colTotalMap.set(colKey, (colTotalMap.get(colKey) ?? 0) + val);
          cellsOut.push({
            sectionId: sec.sectionId,
            labelHe: sec.labelHe,
            labelEn: sec.labelEn,
            colKey,
            colLabel: String(h).padStart(2, '0'),
            timeRangeLabel: `${String(h).padStart(2, '0')}:00–${String(h).padStart(2, '0')}:59`,
            value: val,
            intensity: raw.intensity,
            count: raw.count,
            heatScore,
          });
        }
      } else {
        for (const blk of TIME_BLOCKS) {
          let sumCount = 0;
          let sumIntensity = 0;
          for (const h of blk.hours) {
            const raw = cellLookup.get(`${sec.sectionId}:${h}`) ?? { count: 0, intensity: 0 };
            sumCount += raw.count;
            sumIntensity += raw.intensity;
          }
          const val = metric === 'intensity' ? sumIntensity : sumCount;
          if (val > peakVal) peakVal = val;
          colTotalMap.set(blk.key, (colTotalMap.get(blk.key) ?? 0) + val);
          cellsOut.push({
            sectionId: sec.sectionId,
            labelHe: sec.labelHe,
            labelEn: sec.labelEn,
            colKey: blk.key,
            colLabel: isHe ? blk.labelHe : blk.labelEn,
            timeRangeLabel: blk.range,
            value: val,
            intensity: sumIntensity,
            count: sumCount,
            heatScore,
          });
        }
      }
    }

    return {
      columns: cols,
      displayCells: cellsOut,
      columnTotals: cols.map((c) => ({ key: c.key, total: colTotalMap.get(c.key) ?? 0 })),
      maxValue: Math.max(1, peakVal),
      maxSectionHeat: Math.max(1, topHeat),
    };
  }, [data, filteredSections, granularity, metric, sectionHeat, isHe]);

  // Render D3 SVG Matrix + Top Hourly Distribution Bars + Color Legend
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || filteredSections.length === 0 || columns.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = Math.max(580, containerWidth);
    const margin = {
      top: 56, // reserves room for top hourly intensity sparkbars + X labels
      right: 68, // reserves room for section heat score column
      bottom: 46, // reserves room for D3 gradient legend
      left: 146, // reserves room for localized section labels
    };

    const rowHeight = Math.max(25, Math.min(34, Math.floor(380 / Math.max(4, filteredSections.length))));
    const innerWidth = Math.max(280, width - margin.left - margin.right);
    const innerHeight = filteredSections.length * rowHeight;
    const totalHeight = margin.top + innerHeight + margin.bottom;

    svg
      .attr('viewBox', `0 0 ${width} ${totalHeight}`)
      .attr('width', '100%')
      .attr('height', totalHeight);

    const defs = svg.append('defs');
    const gradId = 'chatfxp-heat-gradient';
    const gradient = defs
      .append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');

    const rampStops = ['#140E18', '#4A0D1D', '#A31428', '#FF142B', '#D4A64A', '#FFE39A'];
    rampStops.forEach((hex, idx) => {
      gradient
        .append('stop')
        .attr('offset', `${Math.round((idx / (rampStops.length - 1)) * 100)}%`)
        .attr('stop-color', hex);
    });

    const colorScale = d3
      .scaleSequential<string>()
      .domain([0, maxValue])
      .interpolator(d3.interpolateRgbBasis(rampStops));

    const xScale = d3
      .scaleBand<string>()
      .domain(columns.map((c) => c.key))
      .range([0, innerWidth])
      .padding(granularity === 'hourly' ? 0.14 : 0.08);

    const yScale = d3
      .scaleBand<string>()
      .domain(filteredSections.map((s) => s.sectionId))
      .range([0, innerHeight])
      .padding(0.16);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Top Hourly / Block Aggregate Mini-Histogram
    const maxColTotal = Math.max(1, d3.max(columnTotals, (d) => d.total) ?? 1);
    const sparkScale = d3.scaleLinear().domain([0, maxColTotal]).range([0, 24]);

    g.selectAll('rect.spark-bar')
      .data(columnTotals)
      .enter()
      .append('rect')
      .attr('class', 'spark-bar')
      .attr('x', (d) => xScale(d.key) ?? 0)
      .attr('y', (d) => -28 - sparkScale(d.total))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => Math.max(2, sparkScale(d.total)))
      .attr('rx', 2)
      .attr('fill', (d) => (d.total === maxColTotal && d.total > 0 ? '#FFE39A' : '#D4A64A'))
      .attr('fill-opacity', (d) => (d.total > 0 ? 0.72 : 0.18));

    // X-axis column labels cleanly tucked between sparkbar and grid
    g.selectAll('text.x-label')
      .data(columns)
      .enter()
      .append('text')
      .attr('class', 'x-label')
      .attr('x', (d) => (xScale(d.key) ?? 0) + xScale.bandwidth() / 2)
      .attr('y', -9)
      .attr('text-anchor', 'middle')
      .attr('fill', '#C5BAC7')
      .style('font-family', 'JetBrains Mono, ui-monospace, monospace')
      .style('font-size', granularity === 'hourly' ? '10px' : '11px')
      .style('font-weight', '600')
      .text((d) => d.label);

    // Subtle row highlight stripes + Y-axis Section Labels + Right Heat Score column
    const rowGroup = g
      .selectAll('g.section-row')
      .data(filteredSections)
      .enter()
      .append('g')
      .attr('class', 'section-row');

    rowGroup
      .append('rect')
      .attr('x', -margin.left + 4)
      .attr('y', (d) => (yScale(d.sectionId) ?? 0) - 1)
      .attr('width', innerWidth + margin.left + margin.right - 8)
      .attr('height', yScale.bandwidth() + 2)
      .attr('rx', 4)
      .attr('fill', (d) =>
        selectedSectionId === d.sectionId ? 'rgba(212, 166, 74, 0.12)' : 'transparent'
      );

    rowGroup
      .append('text')
      .attr('x', -10)
      .attr('y', (d) => (yScale(d.sectionId) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', (d) => (selectedSectionId === d.sectionId ? '#FFE39A' : '#F3EAF1'))
      .style('font-size', '11.5px')
      .style('font-weight', (d) => (selectedSectionId === d.sectionId ? '700' : '600'))
      .style('cursor', 'pointer')
      .text((d) => (isHe ? d.labelHe : d.labelEn))
      .on('click', (_event, d) => {
        setSelectedSectionId((prev) => (prev === d.sectionId ? null : d.sectionId));
      });

    rowGroup
      .append('text')
      .attr('x', innerWidth + 10)
      .attr('y', (d) => (yScale(d.sectionId) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .attr('fill', '#D4A64A')
      .style('font-family', 'JetBrains Mono, ui-monospace, monospace')
      .style('font-size', '10.5px')
      .style('font-weight', '700')
      .text((d) => (sectionHeat?.[d.sectionId] ?? d.heatScore).toLocaleString());

    g.append('text')
      .attr('x', innerWidth + 10)
      .attr('y', -9)
      .attr('text-anchor', 'start')
      .attr('fill', '#A89BA8')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .text(isHe ? 'חום' : 'Heat');

    // Heatmap Cells
    g.selectAll('rect.heat-cell')
      .data(displayCells)
      .enter()
      .append('rect')
      .attr('class', 'heat-cell')
      .attr('x', (d) => xScale(d.colKey) ?? 0)
      .attr('y', (d) => yScale(d.sectionId) ?? 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 3)
      .attr('fill', (d) => (d.value <= 0 ? '#0D0910' : colorScale(d.value)))
      .attr('fill-opacity', (d) =>
        selectedSectionId && selectedSectionId !== d.sectionId ? 0.42 : 1
      )
      .attr('stroke', (d) =>
        d.value > 0 ? 'rgba(255, 227, 154, 0.16)' : 'rgba(197, 186, 199, 0.08)'
      )
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .style('transition', 'stroke 150ms ease, fill-opacity 150ms ease')
      .on('mouseenter', function (event: MouseEvent, d) {
        d3.select(this).attr('stroke', '#FFE39A').attr('stroke-width', 1.8);
        const box = wrapperRef.current?.getBoundingClientRect();
        if (box) {
          setHovered({
            cell: d,
            x: event.clientX - box.left,
            y: event.clientY - box.top,
          });
        }
      })
      .on('mousemove', (event: MouseEvent, d) => {
        const box = wrapperRef.current?.getBoundingClientRect();
        if (box) {
          setHovered({
            cell: d,
            x: event.clientX - box.left,
            y: event.clientY - box.top,
          });
        }
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this)
          .attr('stroke', d.value > 0 ? 'rgba(255, 227, 154, 0.16)' : 'rgba(197, 186, 199, 0.08)')
          .attr('stroke-width', 1);
        setHovered(null);
      })
      .on('click', (_event, d) => {
        setSelectedSectionId((prev) => (prev === d.sectionId ? null : d.sectionId));
      });

    // Bottom D3 Gradient Color Legend
    const legendWidth = Math.min(240, innerWidth * 0.55);
    const legendX = Math.max(0, innerWidth - legendWidth);
    const legendY = innerHeight + 18;
    const legendG = g.append('g').attr('transform', `translate(${legendX},${legendY})`);

    legendG
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', 8)
      .attr('rx', 4)
      .attr('fill', `url(#${gradId})`)
      .attr('stroke', 'rgba(212, 166, 74, 0.35)')
      .attr('stroke-width', 0.8);

    legendG
      .append('text')
      .attr('x', -8)
      .attr('y', 7)
      .attr('text-anchor', 'end')
      .attr('fill', '#A89BA8')
      .style('font-size', '10px')
      .text(isHe ? 'שקט (0)' : 'Quiet (0)');

    legendG
      .append('text')
      .attr('x', legendWidth + 8)
      .attr('y', 7)
      .attr('text-anchor', 'start')
      .attr('fill', '#FFE39A')
      .style('font-family', 'JetBrains Mono, ui-monospace, monospace')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .text(`${maxValue.toLocaleString()}`);
  }, [
    filteredSections,
    columns,
    displayCells,
    columnTotals,
    maxValue,
    containerWidth,
    granularity,
    selectedSectionId,
    sectionHeat,
    isHe,
  ]);

  if (loading && !data) {
    return (
      <div className="space-y-3 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded border border-[#C5BAC7]/10 bg-[#0A070C] animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded border border-[#C5BAC7]/10 bg-[#0A070C] animate-pulse" />
      </div>
    );
  }

  if (!data || data.sections.length === 0) {
    return (
      <div className="rounded border border-[#C5BAC7]/20 bg-[#0A070C] p-8 text-center">
        <Flame className="w-7 h-7 mx-auto mb-2 text-[#D4A64A]" />
        <p className="text-sm font-bold text-white">
          {isHe ? 'אין עדיין נתוני פעילות מתועדים' : 'No recorded section telemetry yet'}
        </p>
        <p className="mt-1 text-xs text-[#A89BA8]">
          {isHe
            ? 'מד החום יתעדכן אוטומטית ברגע שייפתחו דיונים, תגובות וביקורים במדורים.'
            : 'The matrix populates automatically as threads, posts, listings, and section visits are logged.'}
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-4 inline-flex items-center gap-1.5 rounded border border-[#D4A64A]/45 bg-[#1B120C] px-4 py-2 text-xs font-bold text-[#FFE39A] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isHe ? 'רענן נתונים' : 'Refresh Telemetry'}</span>
          </button>
        )}
      </div>
    );
  }

  const peakSection = data.sections.find((s) => s.sectionId === data.peakSectionId) ?? data.sections[0];
  const activeHoursCount = data.hourlyEventCounts.filter((c) => c > 0).length;
  const focusedSection = selectedSectionId
    ? data.sections.find((s) => s.sectionId === selectedSectionId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded border border-[#FF142B]/35 bg-[#0A070C] px-3.5 py-2.5">
          <p className="text-[11px] text-[#A89BA8]">{isHe ? 'שעת שיא בפורטל' : 'Peak Portal Hour'}</p>
          <p className="mt-1 font-mono text-lg font-black tabular-nums text-[#FFE39A]" dir="ltr">
            {padHour(data.peakHour)} – {String(data.peakHour).padStart(2, '0')}:59
          </p>
          <p className="mt-0.5 text-[11px] text-[#C5BAC7] tabular-nums">
            {data.hourlyEventCounts[data.peakHour]?.toLocaleString() ?? 0}{' '}
            {isHe ? 'אירועים מתועדים' : 'tracked events'}
          </p>
        </div>

        <div className="rounded border border-[#D4A64A]/35 bg-[#0A070C] px-3.5 py-2.5">
          <p className="text-[11px] text-[#A89BA8]">{isHe ? 'המדור החם ביותר' : 'Hottest Section'}</p>
          <p className="mt-1 text-base font-black text-white truncate">
            {peakSection ? (isHe ? peakSection.labelHe : peakSection.labelEn) : '—'}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-[#D4A64A] tabular-nums">
            {(sectionHeat?.[peakSection.sectionId] ?? peakSection.heatScore).toLocaleString()}{' '}
            {isHe ? 'נק׳ חום' : 'heat pts'}
          </p>
        </div>

        <div className="rounded border border-[#C5BAC7]/20 bg-[#0A070C] px-3.5 py-2.5">
          <p className="text-[11px] text-[#A89BA8]">{isHe ? 'סה״כ אינטראקציות' : 'Tracked Activity'}</p>
          <p className="mt-1 font-mono text-lg font-black tabular-nums text-[#FF142B]">
            {data.totalEvents.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[11px] text-[#A89BA8]">
            {isHe ? 'דיונים, תגובות, שוק וביקורים' : 'Threads, posts, market & visits'}
          </p>
        </div>

        <div className="rounded border border-[#C5BAC7]/20 bg-[#0A070C] px-3.5 py-2.5">
          <p className="text-[11px] text-[#A89BA8]">{isHe ? 'כיסוי שעות פעיל' : 'Active Hour Coverage'}</p>
          <p className="mt-1 font-mono text-lg font-black tabular-nums text-emerald-400" dir="ltr">
            {activeHoursCount} / 24h
          </p>
          <p className="mt-0.5 text-[11px] text-[#A89BA8]" dir="ltr">
            {data.timezone}
          </p>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded border border-[#D4A64A]/25 bg-[#0A070C] px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Granularity Toggle */}
          <div className="flex items-center rounded border border-[#C5BAC7]/20 bg-[#120B13] p-0.5">
            <button
              type="button"
              onClick={() => setGranularity('hourly')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                granularity === 'hourly'
                  ? 'bg-[#FF142B] text-white'
                  : 'text-[#C5BAC7] hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isHe ? 'רשת 24 שעות' : '24h Hourly'}</span>
            </button>
            <button
              type="button"
              onClick={() => setGranularity('blocks')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                granularity === 'blocks'
                  ? 'bg-[#FF142B] text-white'
                  : 'text-[#C5BAC7] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isHe ? 'גלי יממה (6 בלוקים)' : '6 Time Blocks'}</span>
            </button>
          </div>

          {/* Metric Mode Toggle */}
          <div className="flex items-center rounded border border-[#C5BAC7]/20 bg-[#120B13] p-0.5">
            <button
              type="button"
              onClick={() => setMetric('intensity')}
              className={`rounded px-2.5 py-1 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                metric === 'intensity'
                  ? 'bg-[#D4A64A] text-black'
                  : 'text-[#C5BAC7] hover:text-white'
              }`}
            >
              {isHe ? 'עוצמת חום משוקללת' : 'Weighted Intensity'}
            </button>
            <button
              type="button"
              onClick={() => setMetric('count')}
              className={`rounded px-2.5 py-1 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                metric === 'count'
                  ? 'bg-[#D4A64A] text-black'
                  : 'text-[#C5BAC7] hover:text-white'
              }`}
            >
              {isHe ? 'ספירת אירועים' : 'Event Count'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#A89BA8] absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={isHe ? 'סנן מדור...' : 'Filter section...'}
              className="w-40 rounded border border-[#C5BAC7]/25 bg-[#120B13] ps-8 pe-7 py-1 text-xs text-white placeholder:text-[#7D7080] focus:border-[#D4A64A] focus:outline-none"
            />
            {searchFilter && (
              <button
                type="button"
                aria-label={isHe ? 'נקה חיפוש' : 'Clear search'}
                onClick={() => setSearchFilter('')}
                className="absolute top-1/2 -translate-y-1/2 end-2 text-[#A89BA8] hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {selectedSectionId && (
            <button
              type="button"
              onClick={() => setSelectedSectionId(null)}
              className="rounded border border-[#D4A64A]/45 bg-[#1B120C] px-2.5 py-1 text-xs font-semibold text-[#FFE39A] cursor-pointer whitespace-nowrap"
            >
              {isHe ? 'בטל סינון מדור' : 'Clear Focus'}
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1 rounded border border-[#C5BAC7]/25 bg-[#120B13] px-2.5 py-1 text-xs font-semibold text-[#F3EAF1] hover:border-[#D4A64A] cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isHe ? 'רענן' : 'Refresh'}</span>
            </button>
          )}
        </div>
      </div>

      {/* D3 SVG Matrix Container */}
      <div
        ref={wrapperRef}
        className="relative overflow-x-auto rounded border border-[#D4A64A]/30 bg-[#08060B] p-3"
      >
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#FFE39A]">
            {isHe
              ? 'מטריצת חום מדורים × שעות היממה (D3 Telemetry)'
              : 'Section Heat × Time-of-Day Matrix (D3 Telemetry)'}
          </span>
          <span className="text-[11px] text-[#A89BA8]">
            {isHe
              ? 'לחצו על תא או מדור למיקוד · הבר העליון מציג עומס שעתי מצטבר'
              : 'Click a row or cell to focus · Top bars show aggregate hourly volume'}
          </span>
        </div>

        {filteredSections.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#A89BA8]">
            {isHe ? 'לא נמצאו מדורים תואמים לסינון.' : 'No sections match the current filter.'}
          </p>
        ) : (
          <div dir="ltr" className="min-w-[600px]">
            <svg ref={svgRef} className="block w-full select-none" />
          </div>
        )}

        {/* Interactive Hover Tooltip (XSS-safe React JSX overlay) */}
        {hovered && (
          <div
            dir={isHe ? 'rtl' : 'ltr'}
            style={{
              left: Math.min(Math.max(12, hovered.x + 14), Math.max(12, containerWidth - 230)),
              top: Math.max(12, hovered.y - 84),
            }}
            className="pointer-events-none absolute z-30 w-56 rounded border border-[#D4A64A]/65 bg-[#120A14]/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-md"
          >
            <p className="font-bold text-[#FFE39A] truncate">
              {isHe ? hovered.cell.labelHe : hovered.cell.labelEn}
            </p>
            <p className="font-mono text-[11px] text-[#C5BAC7]" dir="ltr">
              {hovered.cell.timeRangeLabel}
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-[#C5BAC7]/15 pt-1.5 text-[11px]">
              <span className="text-[#A89BA8]">{isHe ? 'עוצמה:' : 'Intensity:'}</span>
              <span className="font-mono font-bold text-[#FF142B] tabular-nums text-end">
                {hovered.cell.intensity.toLocaleString()}
              </span>
              <span className="text-[#A89BA8]">{isHe ? 'אירועים:' : 'Events:'}</span>
              <span className="font-mono font-bold text-white tabular-nums text-end">
                {hovered.cell.count.toLocaleString()}
              </span>
              <span className="text-[#A89BA8]">{isHe ? 'חום מדור:' : 'Section Heat:'}</span>
              <span className="font-mono font-bold text-[#D4A64A] tabular-nums text-end">
                {hovered.cell.heatScore.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Section Detail / Section Heat Ranking Breakdown */}
      <div className="rounded border border-[#C5BAC7]/20 bg-[#0A070C] p-3.5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-[#FFE39A]">
            {focusedSection
              ? isHe
                ? `פירוט פעילות: ${focusedSection.labelHe}`
                : `Focused Section: ${focusedSection.labelEn}`
              : isHe
              ? 'דירוג Section Heat השוואתי לפי מדור'
              : 'Comparative Section Heat Leaderboard'}
          </h4>
          {focusedSection && (
            <span className="font-mono text-[11px] text-[#C5BAC7] tabular-nums" dir="ltr">
              Peak {padHour(focusedSection.peakHour)} · {focusedSection.totalEvents} events
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {filteredSections.map((sec) => {
            const score = sectionHeat?.[sec.sectionId] ?? sec.heatScore;
            const pct = Math.max(2, Math.round((score / maxSectionHeat) * 100));
            const isSelected = selectedSectionId === sec.sectionId;
            return (
              <button
                key={sec.sectionId}
                type="button"
                onClick={() =>
                  setSelectedSectionId((prev) => (prev === sec.sectionId ? null : sec.sectionId))
                }
                className={`flex flex-col gap-1 rounded border px-2.5 py-2 text-start cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-[#D4A64A] bg-[#1D120D]'
                    : 'border-[#C5BAC7]/10 bg-[#0E0A12] hover:border-[#D4A64A]/45'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-white truncate">
                    {isHe ? sec.labelHe : sec.labelEn}
                  </span>
                  <span className="font-mono text-[11px] text-[#D4A64A] tabular-nums shrink-0">
                    {score.toLocaleString()} · {sec.totalEvents} {isHe ? 'אירו׳' : 'ev'} ·{' '}
                    <span dir="ltr">{padHour(sec.peakHour)}</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#19121F]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF142B] via-[#D4A64A] to-[#FFE39A]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
