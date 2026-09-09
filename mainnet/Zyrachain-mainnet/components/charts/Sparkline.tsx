'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export interface SparklineDataPoint {
  time: string;
  value: number;
}

interface SparklineProps {
  data: SparklineDataPoint[];
  height?: number;
  color?: string;
  isPositive?: boolean;
}

export function Sparkline({
  data,
  height = 24,
  color,
  isPositive = true,
}: SparklineProps) {
  // Determine color based on positive/negative
  const lineColor = color || (isPositive ? 'hsl(142 71% 45%)' : 'hsl(0 84% 58%)');

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width={50} height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Generate mock 24h sparkline data from a start value to an end value
export function generateSparklineData(startValue: number, endValue: number, points = 24): SparklineDataPoint[] {
  const data: SparklineDataPoint[] = [];
  const step = (endValue - startValue) / (points - 1);

  for (let i = 0; i < points; i++) {
    const value = startValue + step * i + (Math.random() - 0.5) * Math.abs(endValue - startValue) * 0.1;
    data.push({
      time: `${i}h`,
      value: Math.max(0, value),
    });
  }

  return data;
}
