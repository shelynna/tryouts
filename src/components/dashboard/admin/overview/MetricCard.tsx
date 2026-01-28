
import React from 'react';
import { Card } from '../../../ui';

export const MetricCard = ({ title, value, subtext, iconClass, colorClass, trend }: any) => (
    <Card className="p-4 md:p-6 flex flex-col justify-between h-full border-stone-200 shadow-sm">
        <div className="flex justify-between items-start mb-2 md:mb-4">
            <div className={`p-2 md:p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
                <i className={iconClass + " md:text-xl"}></i>
            </div>
        </div>
        <div>
            <h3 className="text-[10px] md:text-xs font-bold text-stone-500 uppercase tracking-widest truncate">{title}</h3>
            <div className="mt-1 text-xl md:text-3xl font-sans font-bold text-stone-900 tracking-tight">{value}</div>
        </div>
        {subtext && <p className="text-[10px] md:text-xs font-medium text-stone-400 mt-2 truncate">{subtext}</p>}
        {trend !== undefined && (
            <div className="mt-3 w-full bg-stone-100 rounded-full h-1 overflow-hidden">
                <div className={`h-full rounded-full ${colorClass.replace('text', 'bg')}`} style={{ width: `${trend}%` }}></div>
            </div>
        )}
    </Card>
);
