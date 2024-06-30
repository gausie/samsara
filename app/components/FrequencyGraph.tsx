import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type Datum = { date: string; count: number };
type Props = { data: Datum[]; inSeasonTo?: string | null };

export function FrequencyGraph({ data, inSeasonTo }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} title="Ascensions over time">
        <XAxis
          type="number"
          dataKey={(d: Datum) => new Date(d.date).getTime()}
          tick={{ fontSize: 9 }}
          tickFormatter={(ts: number) => new Date(ts).getFullYear().toString()}
          domain={["dataMin", "dataMax"]}
        />
        <YAxis tick={{ fontSize: 9 }} domain={[0, "auto"]} />
        <Line type="monotone" dataKey="count" dot={false} />
        {inSeasonTo && (
          <ReferenceLine x={new Date(inSeasonTo).getTime()} stroke="red" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}