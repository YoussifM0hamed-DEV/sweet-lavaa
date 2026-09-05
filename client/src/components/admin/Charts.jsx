import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatCompact, formatPrice } from '../../utils/format.js';

/**
 * Chart palette drawn from the brand colours, ordered so adjacent series stay
 * distinguishable. Sequential where the data is one measure, categorical where
 * it is many.
 */
export const CHART_COLORS = ['#BE7B36', '#33241A', '#D68B94', '#DCAE4F', '#7C5F4C', '#C9B5A8', '#EACCA3'];

const AXIS = { stroke: '#A48876', fontSize: 11 };
const GRID = { stroke: '#EFE3D3', strokeDasharray: '4 4' };

const TooltipBox = ({ active, payload, label, currency = 'EGP', valueFormatter }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 shadow-lift">
      {label && <p className="text-xs font-semibold text-cocoa-700">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name} className="mt-1 flex items-center gap-2 text-xs text-cocoa-500">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color || entry.fill }} />
          {entry.name}:{' '}
          <span className="font-semibold text-cocoa-800">
            {valueFormatter ? valueFormatter(entry.value) : formatPrice(entry.value, currency)}
          </span>
        </p>
      ))}
    </div>
  );
};

export const SalesAreaChart = ({ data, currency }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
      <defs>
        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BE7B36" stopOpacity={0.32} />
          <stop offset="100%" stopColor="#BE7B36" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      <CartesianGrid {...GRID} vertical={false} />
      <XAxis
        dataKey="date"
        tick={AXIS}
        tickLine={false}
        axisLine={false}
        tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        minTickGap={24}
      />
      <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={52} />
      <Tooltip content={<TooltipBox currency={currency} />} />
      <Area
        type="monotone"
        dataKey="revenue"
        name="Revenue"
        stroke="#BE7B36"
        strokeWidth={2.5}
        fill="url(#revenueFill)"
        dot={false}
        activeDot={{ r: 4, strokeWidth: 2, stroke: '#FDF8F1' }}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export const OrdersBarChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
      <CartesianGrid {...GRID} vertical={false} />
      <XAxis
        dataKey="date"
        tick={AXIS}
        tickLine={false}
        axisLine={false}
        tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        minTickGap={24}
      />
      <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
      <Tooltip
        cursor={{ fill: 'rgba(190, 123, 54, 0.06)' }}
        content={<TooltipBox valueFormatter={(value) => `${value} order${value === 1 ? '' : 's'}`} />}
      />
      <Bar dataKey="orders" name="Orders" fill="#33241A" radius={[6, 6, 0, 0]} maxBarSize={28} />
    </BarChart>
  </ResponsiveContainer>
);

export const CategoryPieChart = ({ data, currency }) => (
  <ResponsiveContainer width="100%" height={280}>
    <PieChart>
      <Pie
        data={data}
        dataKey="revenue"
        nameKey="name"
        cx="50%"
        cy="50%"
        innerRadius={62}
        outerRadius={100}
        paddingAngle={2}
        stroke="#FDF8F1"
        strokeWidth={2}
      >
        {data.map((entry, index) => (
          <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip content={<TooltipBox currency={currency} />} />
      <Legend
        verticalAlign="bottom"
        iconType="circle"
        iconSize={8}
        formatter={(value) => <span className="text-xs text-cocoa-500">{value}</span>}
      />
    </PieChart>
  </ResponsiveContainer>
);

export const TopProductsBarChart = ({ data, currency }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
      <CartesianGrid {...GRID} horizontal={false} />
      <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
      <YAxis
        type="category"
        dataKey="name"
        tick={{ ...AXIS, fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        width={130}
        tickFormatter={(value) => (value.length > 22 ? `${value.slice(0, 21)}…` : value)}
      />
      <Tooltip cursor={{ fill: 'rgba(190, 123, 54, 0.06)' }} content={<TooltipBox currency={currency} />} />
      <Bar dataKey="revenue" name="Revenue" fill="#BE7B36" radius={[0, 6, 6, 0]} maxBarSize={22} />
    </BarChart>
  </ResponsiveContainer>
);
