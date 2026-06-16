import { format, subDays } from "date-fns"
import { useMemo } from "react"
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type UtilizationChartProps = {
  runnerId: string
  runnerName: string
}

type UtilizationPoint = {
  date: string
  utilization: number
  jobCount: number
}

type ChartTooltipProps = {
  active?: boolean
  label?: string | number
  payload?: Array<{
    dataKey?: string | number
    value?: string | number
  }>
}

const cssVar = (name: string) => `var(${name})`

const hashSeed = (value: string) =>
  value.split("").reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0
  }, 2_166_136_261)

const createRandom = (seed: number) => {
  let state = seed || 1

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 4_294_967_296
  }
}

const formatComputeTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}h ${remainingMinutes}m`
}

const generateUtilizationData = (runnerId: string): UtilizationPoint[] => {
  const random = createRandom(hashSeed(runnerId))
  const baseUtilization = 35 + Math.round(random() * 35)

  return Array.from({ length: 14 }, (_, index) => {
    const date = subDays(new Date(), 13 - index)
    const wave = Math.sin((index / 13) * Math.PI * 2) * 18
    const variance = (random() - 0.5) * 28
    const utilization = Math.max(
      4,
      Math.min(98, Math.round(baseUtilization + wave + variance)),
    )
    const jobCount = Math.max(
      1,
      Math.round(utilization / 4 + random() * 12 + (index % 3) * 2),
    )

    return {
      date: date.toISOString(),
      utilization,
      jobCount,
    }
  })
}

function UtilizationTooltip({
  active,
  label,
  payload,
}: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null
  }

  const utilization = payload.find((item) => item.dataKey === "utilization")
  const jobCount = payload.find((item) => item.dataKey === "jobCount")

  return (
    <div className="rounded-lg border border-[var(--color-terminal-700)] bg-[var(--color-terminal-950)] px-3 py-2 shadow-xl shadow-black/30">
      <p className="text-xs font-medium text-[var(--color-slate-200)]">
        {typeof label === "string" ? format(new Date(label), "MMM d, yyyy") : label}
      </p>
      <div className="mt-2 space-y-1 text-xs">
        <p className="flex items-center gap-2 text-[var(--color-slate-400)]">
          <span className="h-2 w-2 rounded-full bg-[var(--color-pipeline-running)]" />
          Utilization:{" "}
          <span className="text-[var(--color-slate-200)]">
            {utilization?.value}%
          </span>
        </p>
        <p className="flex items-center gap-2 text-[var(--color-slate-400)]">
          <span className="h-2 w-2 rounded-full bg-[var(--color-pipeline-success)]" />
          Jobs:{" "}
          <span className="text-[var(--color-slate-200)]">{jobCount?.value}</span>
        </p>
      </div>
    </div>
  )
}

export function UtilizationChart({
  runnerId,
  runnerName,
}: UtilizationChartProps) {
  const data = useMemo(() => generateUtilizationData(runnerId), [runnerId])
  const peak = useMemo(
    () =>
      data.reduce((highest, point) =>
        point.utilization > highest.utilization ? point : highest,
      ),
    [data],
  )
  const avgJobs = Math.round(
    data.reduce((total, point) => total + point.jobCount, 0) / data.length,
  )
  const computeMinutes = data.reduce((total, point) => {
    return total + Math.round((point.utilization / 100) * 24 * 60)
  }, 0)
  const gradientId = `runner-utilization-${runnerId.replace(/[^a-zA-Z0-9_-]/g, "-")}`

  return (
    <section aria-label={`Utilization chart for ${runnerName}`}>
      <h3 className="text-sm font-medium text-[var(--color-slate-200)]">
        Utilization - last 14 days
      </h3>
      <div className="mt-3 h-64 bg-transparent">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart
            data={data}
            margin={{ bottom: 0, left: -20, right: -16, top: 12 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="1" y2="0">
                <stop offset="0%" stopColor={cssVar("--color-pipeline-running")} />
                <stop offset="100%" stopColor={cssVar("--color-pipeline-success")} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={cssVar("--color-terminal-700")}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              minTickGap={16}
              stroke={cssVar("--color-slate-500")}
              tickFormatter={(value: string) => format(new Date(value), "MMM d")}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke={cssVar("--color-slate-500")}
              tickFormatter={(value: number) => `${value}%`}
              tickLine={false}
              yAxisId="utilization"
            />
            <YAxis
              orientation="right"
              stroke={cssVar("--color-slate-500")}
              tickLine={false}
              yAxisId="jobs"
            />
            <Tooltip content={<UtilizationTooltip />} cursor={{ fill: "transparent" }} />
            <Bar
              dataKey="utilization"
              fill={`url(#${gradientId})`}
              name="Utilization"
              radius={[4, 4, 0, 0]}
              yAxisId="utilization"
            >
              {data.map((point) => (
                <Cell
                  fill={`url(#${gradientId})`}
                  fillOpacity={0.35 + point.utilization / 150}
                  key={point.date}
                />
              ))}
            </Bar>
            <Line
              activeDot={{ r: 4 }}
              dataKey="jobCount"
              dot={false}
              name="Jobs"
              stroke={cssVar("--color-pipeline-success")}
              strokeWidth={2}
              type="monotone"
              yAxisId="jobs"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid gap-2 text-xs text-[var(--color-slate-400)]">
        <div className="flex items-center justify-between rounded-lg bg-[var(--color-terminal-950)] px-3 py-2">
          <span>Peak utilization</span>
          <span className="text-[var(--color-slate-200)]">
            {peak.utilization}% on {format(new Date(peak.date), "MMM d")}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-[var(--color-terminal-950)] px-3 py-2">
          <span>Avg jobs/day</span>
          <span className="text-[var(--color-slate-200)]">{avgJobs} jobs</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-[var(--color-terminal-950)] px-3 py-2">
          <span>Total compute time</span>
          <span className="text-[var(--color-slate-200)]">
            {formatComputeTime(computeMinutes)} (last 14 days)
          </span>
        </div>
      </div>
    </section>
  )
}
