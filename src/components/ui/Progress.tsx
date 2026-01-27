
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const MotionDiv = motion.div as any;
const MotionCircle = motion.circle as any;

export const ProgressRing: React.FC<{ 
  progress: number, 
  size?: number, 
  stroke?: number,
  trackColor?: string,
  progressColor?: string 
}> = ({ 
  progress, 
  size = 180, 
  stroke = 8,
  trackColor = "text-stone-100",
  progressColor = "text-brand-500"
}) => {
  const radius = (size / 2) - (stroke * 1.5);
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className={trackColor}
          strokeWidth={stroke}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <MotionCircle
          className={progressColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-serif font-bold text-current">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export const ProgressBar: React.FC<{ progress: number; className?: string; barClassName?: string }> = ({ progress, className = '', barClassName = "bg-brand-900" }) => (
  <div className={cn("w-full bg-stone-100 rounded-full h-1.5 overflow-hidden", className)}>
    <MotionDiv 
      className={cn("h-full transition-all duration-700 ease-out", barClassName)} 
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
);
