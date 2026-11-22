import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ArrowUpRight, BarChart3, CheckCircle2, Loader2 } from 'lucide-react';
import type { LanguageCode, PollOption } from '../types';

interface QuickPollProps {
  threadId: number;
  threadTitle?: string;
  question: string;
  options: PollOption[];
  lang: LanguageCode;
  variant?: 'inline' | 'spotlight';
  onVote: (threadId: number, optionIndex: number) => Promise<void>;
  onOpenThread?: (threadId: number) => void;
}

interface PollChartDatum {
  key: string;
  index: number;
  label: string;
  votes: number;
  pct: number;
  isLeader: boolean;
  isSelected: boolean;
}

export const QuickPoll: React.FC<QuickPollProps> = ({
  threadId,
  threadTitle,
  question,
  options,
  lang,
  variant = 'inline',
  onVote,
  onOpenThread,
}) => {
  const isHe = lang === 'he';
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    try {
      const saved = window.sessionStorage.getItem(`chatfxp_poll_choice:${threadId}`);
      if (saved !== null) {
        const parsed = Number.parseInt(saved, 10);
        return Number.isFinite(parsed) ? parsed : null;
      }
    } catch {
      // Ignore storage access restrictions
    }
    return null;
  });
  const [submittingIdx, setSubmittingIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(360);

  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const initializedThreadRef = useRef<number | null>(null);

  // Sync persisted choice when threadId switches
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(`chatfxp_poll_choice:${threadId}`);
      if (saved !== null) {
        const parsed = Number.parseInt(saved, 10);
        setSelectedIndex(Number.isFinite(parsed) ? parsed : null);
      } else {
        setSelectedIndex(null);
      }
    } catch {
      setSelectedIndex(null);
    }
    setSubmittingIdx(null);
  }, [threadId]);

  useEffect(() => {
    const el = chartWrapRef.current;
    if (!el) return;
    const syncWidth = () => {
      const next = Math.max(240, Math.floor(el.clientWidth));
      setChartWidth(next);
    };
    syncWidth();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(syncWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalVotes = useMemo(
    () => options.reduce((sum, o) => sum + Math.max(0, Number(o.votes || 0)), 0),
    [options]
  );

  const maxVotes = useMemo(
    () => options.reduce((m, o) => Math.max(m, Number(o.votes || 0)), 0),
    [options]
  );

  const chartData: PollChartDatum[] = useMemo(
    () =>
      options.map((opt, idx) => {
        const votes = Math.max(0, Number(opt.votes || 0));
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        return {
          key: `${threadId}:${idx}:${opt.label}`,
          index: idx,
          label: opt.label,
          votes,
          pct,
          isLeader: maxVotes > 0 && votes === maxVotes,
          isSelected: selectedIndex === idx,
        };
      }),
    [options, totalVotes, maxVotes, threadId, selectedIndex]
  );

  // Real-time D3 animated horizontal bar chart
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || chartData.length === 0) return;

    const svg = d3.select(svgEl);
    const width = Math.max(240, chartWidth);
    const margin = { top: 8, right: 66, bottom: 22, left: 10 };
    const rowStep = 44;
    const innerWidth = Math.max(120, width - margin.left - margin.right);
    const innerHeight = chartData.length * rowStep;
    const totalHeight = margin.top + innerHeight + margin.bottom;

    svg
      .attr('viewBox', `0 0 ${width} ${totalHeight}`)
      .attr('width', '100%')
      .attr('height', totalHeight);

    // Ensure persistent defs + root <g> for smooth incremental transitions
    let defs = svg.select<SVGDefsElement>('defs.poll-defs');
    if (defs.empty()) {
      defs = svg.append('defs').attr('class', 'poll-defs');

      const goldGrad = defs
        .append('linearGradient')
        .attr('id', 'quickpoll-bar-gold')
        .attr('x1', '0%')
        .attr('x2', '100%');
      goldGrad.append('stop').attr('offset', '0%').attr('stop-color', '#9E7422');
      goldGrad.append('stop').attr('offset', '100%').attr('stop-color', '#FFE39A');

      const crimsonGrad = defs
        .append('linearGradient')
        .attr('id', 'quickpoll-bar-crimson')
        .attr('x1', '0%')
        .attr('x2', '100%');
      crimsonGrad.append('stop').attr('offset', '0%').attr('stop-color', '#8A0F24');
      crimsonGrad.append('stop').attr('offset', '100%').attr('stop-color', '#FF142B');
    }

    let root = svg.select<SVGGElement>('g.poll-root');
    const isFreshThread = initializedThreadRef.current !== threadId;
    if (root.empty() || isFreshThread) {
      svg.selectAll('g.poll-root').remove();
      root = svg.append('g').attr('class', 'poll-root');
      root.append('g').attr('class', 'poll-grid');
      root.append('g').attr('class', 'poll-rows');
      initializedThreadRef.current = threadId;
    }
    root.attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
    const yScale = d3
      .scaleBand<string>()
      .domain(chartData.map((d) => d.key))
      .range([0, innerHeight])
      .paddingInner(0.24)
      .paddingOuter(0.08);

    // Vertical gridlines (0%, 25%, 50%, 75%, 100%)
    const ticks = [0, 25, 50, 75, 100];
    const gridGroup = root.select<SVGGElement>('g.poll-grid');
    const gridLines = gridGroup.selectAll<SVGLineElement, number>('line.grid-tick').data(ticks, (d) => String(d));

    gridLines
      .enter()
      .append('line')
      .attr('class', 'grid-tick')
      .merge(gridLines)
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', 'rgba(197, 186, 199, 0.1)')
      .attr('stroke-dasharray', '2,3');
    gridLines.exit().remove();

    const gridLabels = gridGroup.selectAll<SVGTextElement, number>('text.grid-label').data(ticks, (d) => String(d));
    gridLabels
      .enter()
      .append('text')
      .attr('class', 'grid-label')
      .merge(gridLabels)
      .attr('x', (d) => xScale(d))
      .attr('y', innerHeight + 14)
      .attr('text-anchor', (d) => (d === 0 ? 'start' : d === 100 ? 'end' : 'middle'))
      .attr('fill', '#7D7080')
      .style('font-family', 'JetBrains Mono, ui-monospace, monospace')
      .style('font-size', '9.5px')
      .text((d) => `${d}%`);
    gridLabels.exit().remove();

    // Keyed row data join for smooth width transitions
    const rowsGroup = root.select<SVGGElement>('g.poll-rows');
    const rowSel = rowsGroup.selectAll<SVGGElement, PollChartDatum>('g.poll-row').data(chartData, (d) => d.key);

    rowSel.exit().remove();

    const rowEnter = rowSel.enter().append('g').attr('class', 'poll-row');
    rowEnter.append('text').attr('class', 'poll-opt-title');
    rowEnter.append('rect').attr('class', 'poll-bar-bg');
    rowEnter
      .append('rect')
      .attr('class', 'poll-bar-fill')
      .attr('width', 0);
    rowEnter.append('text').attr('class', 'poll-pct-label');

    const rowMerged = rowEnter.merge(rowSel);
    rowMerged.attr('transform', (d) => `translate(0, ${yScale(d.key) ?? 0})`);

    const barTop = 16;
    const barHeight = Math.max(12, yScale.bandwidth() - barTop);

    rowMerged
      .select<SVGTextElement>('text.poll-opt-title')
      .attr('x', 0)
      .attr('y', 11)
      .attr('fill', (d) =>
        hoveredIdx === d.index || d.isSelected ? '#FFE39A' : d.isLeader ? '#F3EAF1' : '#C5BAC7'
      )
      .style('font-size', '11px')
      .style('font-weight', (d) => (d.isLeader || d.isSelected ? '700' : '500'))
      .text((d) => (d.label.length > 38 ? `${d.label.slice(0, 36)}…` : d.label));

    rowMerged
      .select<SVGRectElement>('rect.poll-bar-bg')
      .attr('x', 0)
      .attr('y', barTop)
      .attr('width', innerWidth)
      .attr('height', barHeight)
      .attr('rx', 4)
      .attr('fill', '#140D17')
      .attr('stroke', (d) =>
        hoveredIdx === d.index || d.isSelected
          ? 'rgba(212, 166, 74, 0.65)'
          : 'rgba(197, 186, 199, 0.14)'
      )
      .attr('stroke-width', 1);

    const t = d3.transition().duration(620).ease(d3.easeCubicOut);

    rowMerged
      .select<SVGRectElement>('rect.poll-bar-fill')
      .attr('x', 0)
      .attr('y', barTop)
      .attr('height', barHeight)
      .attr('rx', 4)
      .attr('fill', (d) =>
        d.isLeader || d.isSelected ? 'url(#quickpoll-bar-gold)' : 'url(#quickpoll-bar-crimson)'
      )
      .attr('fill-opacity', (d) => (hoveredIdx !== null && hoveredIdx !== d.index ? 0.68 : 0.96))
      .transition(t)
      .attr('width', (d) => (d.pct > 0 ? Math.max(6, xScale(d.pct)) : 0));

    rowMerged
      .select<SVGTextElement>('text.poll-pct-label')
      .attr('x', innerWidth + 8)
      .attr('y', barTop + barHeight / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .attr('fill', (d) => (d.isLeader || d.isSelected ? '#FFE39A' : '#C5BAC7'))
      .style('font-family', 'JetBrains Mono, ui-monospace, monospace')
      .style('font-size', '11px')
      .style('font-weight', '700')
      .text((d) => `${d.pct}% (${d.votes})`);
  }, [chartData, chartWidth, threadId, hoveredIdx]);

  const handleSelectOption = async (idx: number) => {
    if (submittingIdx !== null) return;
    setSubmittingIdx(idx);
    try {
      await onVote(threadId, idx);
      setSelectedIndex(idx);
      try {
        window.sessionStorage.setItem(`chatfxp_poll_choice:${threadId}`, String(idx));
      } catch {
        // Ignore storage errors
      }
    } finally {
      setSubmittingIdx(null);
    }
  };

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      className={`rounded-md border border-[#D4A64A]/35 bg-[#0D0810] p-4 ${
        variant === 'spotlight' ? 'shadow-[0_10px_28px_rgba(0,0,0,0.45)]' : 'mt-4'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#C5BAC7]/12 pb-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FFE39A]">
            <BarChart3 className="w-4 h-4 text-[#D4A64A] shrink-0" />
            <span className="[text-wrap:balance]">{question}</span>
          </div>
          {variant === 'spotlight' && threadTitle && (
            <p className="mt-1 text-[11px] text-[#A89BA8] truncate">
              {isHe ? `מתוך הדיון הפעיל: ${threadTitle}` : `From active thread: ${threadTitle}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="font-mono text-[11px] font-bold tabular-nums text-[#D4A64A]">
            {totalVotes.toLocaleString()} {isHe ? 'הצבעות' : 'votes'}
          </span>
          {variant === 'spotlight' && onOpenThread && (
            <button
              type="button"
              onClick={() => onOpenThread(threadId)}
              className="inline-flex items-center gap-1 rounded border border-[#D4A64A]/45 bg-[#1B120C] px-2.5 py-1 text-[11px] font-bold text-[#FFE39A] hover:bg-[#D4A64A] hover:text-black transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{isHe ? 'לדיון' : 'Thread'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Options + Live D3 Horizontal Bar Chart */}
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-4 items-center">
        {/* Option Selector Buttons */}
        <div
          role="radiogroup"
          aria-label={question}
          className="flex flex-col gap-2"
        >
          {chartData.map((row) => {
            const isBusy = submittingIdx === row.index;
            const isChosen = row.isSelected;
            return (
              <button
                key={row.key}
                type="button"
                role="radio"
                aria-checked={isChosen}
                disabled={submittingIdx !== null}
                onMouseEnter={() => setHoveredIdx(row.index)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => void handleSelectOption(row.index)}
                className={`group flex items-center justify-between gap-2.5 rounded border px-3 py-2 text-start text-xs transition-all cursor-pointer disabled:opacity-70 ${
                  isChosen
                    ? 'border-[#D4A64A] bg-[#1E130D] text-white shadow-[0_0_12px_rgba(212,166,74,0.2)]'
                    : hoveredIdx === row.index
                    ? 'border-[#FF142B]/80 bg-[#1B0B14] text-white'
                    : 'border-[#C5BAC7]/20 bg-[#070609] text-[#E8DCE8] hover:border-[#FF142B]/65'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isBusy ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#D4A64A] animate-spin shrink-0" />
                  ) : isChosen ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4A64A] shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-[#C5BAC7]/45 group-hover:border-[#FF142B] shrink-0" />
                  )}
                  <span className="font-semibold truncate">{row.label}</span>
                </div>

                <span className="font-mono text-[11px] font-bold tabular-nums text-[#D4A64A] shrink-0">
                  {row.pct}%
                </span>
              </button>
            );
          })}
          {totalVotes === 0 && (
            <p className="text-[11px] text-[#A89BA8]">
              {isHe ? 'לחצו על אפשרות כדי להצביע ולהפעיל את גרף התוצאות.' : 'Select an option to cast the first vote.'}
            </p>
          )}
        </div>

        {/* Real-Time D3 Animated Horizontal Bar Chart */}
        <div
          ref={chartWrapRef}
          dir="ltr"
          className="rounded border border-[#C5BAC7]/12 bg-[#070609]/90 px-3 py-2.5"
        >
          <div className="mb-1 flex items-center justify-between text-[10.5px] text-[#A89BA8]" dir={isHe ? 'rtl' : 'ltr'}>
            <span>{isHe ? 'התפלגות הצבעות בזמן אמת (D3)' : 'Live Vote Distribution (D3)'}</span>
            <span className="font-mono tabular-nums text-[#C5BAC7]">0% – 100%</span>
          </div>
          <svg ref={svgRef} className="block w-full overflow-visible select-none" />
        </div>
      </div>
    </div>
  );
};
