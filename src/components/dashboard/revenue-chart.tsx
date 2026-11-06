"use client";

import { useMemo, useRef, useState } from "react";
import type { DailyRevenue } from "@/lib/mock-data";
import { formatMoney, formatCompactMoney, formatDate } from "@/lib/format";

const W = 720;
const H = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 56 };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

export function RevenueChart({
  data,
  label = "Ingresos diarios de los últimos 30 días",
}: {
  data: DailyRevenue[];
  label?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { points, linePath, areaPath, ticks, x, labelIdx } = useMemo(() => {
    const max = niceMax(Math.max(...data.map((d) => d.revenue)) * 1.05);
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    // Con un solo día, el punto va centrado.
    const x = (i: number) =>
      data.length === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (data.length - 1)) * innerW;
    const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
    const points = data.map((d, i) => ({ x: x(i), y: y(d.revenue), d }));
    const linePath = points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
    const base = PAD.top + innerH;
    const areaPath = `${linePath} L${points.at(-1)!.x},${base} L${points[0].x},${base} Z`;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ v: max * t, y: y(max * t) }));
    // Hasta 5 fechas en el eje X, repartidas a lo largo del período.
    const labelIdx = [...new Set([0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * (data.length - 1))))];
    return { points, linePath, areaPath, ticks, x, labelIdx };
  }, [data]);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    if (data.length === 1) return setHover(0);
    const step = (W - PAD.left - PAD.right) / (data.length - 1);
    const i = Math.round((px - PAD.left) / step);
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  const active = hover !== null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none select-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          {/* Línea: de violeta oscuro a claro, como las barras de progreso. */}
          <linearGradient id="rev-line" x1="0" x2="1">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>
          <filter id="rev-glow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {ticks.map((t) => (
          <g key={t.v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={t.v === 0 ? undefined : "3 5"}
            />
            <text x={PAD.left - 10} y={t.y + 4} textAnchor="end" className="fill-subtle text-[11px]">
              {t.v === 0 ? "0" : formatCompactMoney(t.v)}
            </text>
          </g>
        ))}

        {labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor={data.length === 1 ? "middle" : i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
            className="fill-subtle text-[11px]"
          >
            {formatDate(data[i].date)}
          </text>
        ))}

        <path d={areaPath} fill="url(#rev-fill)" className="transition-opacity duration-700 starting:opacity-0" />
        {/* Resplandor debajo de la línea */}
        <path d={linePath} fill="none" stroke="#8b5cf6" strokeOpacity={0.45} strokeWidth={6} filter="url(#rev-glow)" />
        {/* La línea se dibuja de izquierda a derecha al aparecer (key: vuelve a animar si cambia el período). */}
        <path
          key={`${data.length}-${data[0]?.date}`}
          d={linePath}
          fill="none"
          stroke="url(#rev-line)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          className="transition-[stroke-dashoffset] duration-1000 ease-out [stroke-dashoffset:0] starting:[stroke-dashoffset:1]"
        />
        {/* Último día: punto luminoso con un anillo que late */}
        {data.length > 1 && !active && (
          <g>
            <circle cx={points.at(-1)!.x} cy={points.at(-1)!.y} r={9} fill="#8b5cf6" opacity={0.25} className="animate-ping [transform-box:fill-box] [transform-origin:center]" />
            <circle cx={points.at(-1)!.x} cy={points.at(-1)!.y} r={4.5} fill="#c4b5fd" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}

        {data.length === 1 && !active && (
          <circle cx={points[0].x} cy={points[0].y} r={4} fill="var(--series-1)" />
        )}

        {active && (
          <g>
            <line x1={active.x} x2={active.x} y1={PAD.top} y2={H - PAD.bottom} stroke="#8b5cf6" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="3 4" />
            <circle cx={active.x} cy={active.y} r={10} fill="#8b5cf6" opacity={0.2} />
            <circle cx={active.x} cy={active.y} r={5} fill="#c4b5fd" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg border border-border bg-surface-2/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
          style={{
            left: `${(active.x / W) * 100}%`,
            transform: `translateX(${active.x > W * 0.7 ? "calc(-100% - 12px)" : "12px"})`,
          }}
        >
          <p className="text-subtle">{formatDate(active.d.date)}</p>
          <p className="mt-1 flex items-center gap-2 font-medium text-foreground">
            <span className="size-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-400" />
            {formatMoney(active.d.revenue)}
          </p>
          <p className="mt-0.5 pl-4 text-muted">{active.d.orders} ventas</p>
        </div>
      )}
    </div>
  );
}
