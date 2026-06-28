import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from './index';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, description, trend, className }: StatCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={cn("bg-white p-6 rounded-2xl border border-slate-200 shadow-sm", className)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-slate-900">{value}</span>
        {description && (
          <span className="text-sm text-slate-500 mt-1">{description}</span>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-slate-400 ml-2">vs last month</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
