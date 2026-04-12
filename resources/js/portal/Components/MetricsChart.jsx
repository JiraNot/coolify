import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Cpu } from 'lucide-react';

const MetricsChart = ({ resourceUuid, resourceType, type = 'cpu', label = 'Usage' }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMetrics = async () => {
        try {
            const response = await fetch(`/portal/${resourceType}/${resourceUuid}/metrics`);
            const result = await response.json();
            
            if (result.error) {
                setError(result.error);
                return;
            }

            const metrics = type === 'cpu' ? result.cpu : result.memory;
            if (metrics && Array.isArray(metrics)) {
                // Keep only last 20 points
                setData(metrics.slice(-20));
            }
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch metrics');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [resourceUuid, resourceType, type]);

    if (error) return <div className="text-[10px] text-red-500/50 uppercase font-medium">{error}</div>;
    if (loading && data.length === 0) return <div className="h-24 flex items-center justify-center"><Activity className="w-4 h-4 text-[#222] animate-pulse" /></div>;

    const values = data.map(d => d[1]);
    const max = Math.max(...values, 100);
    const min = 0;
    
    // SVG path generation
    const width = 200;
    const height = 60;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d[1] - min) / (max - min)) * height;
        return `${x},${y}`;
    }).join(' ');

    const lastValue = values[values.length - 1]?.toFixed(1) || 0;
    const isHigh = lastValue > 80;

    return (
        <div className="bg-[#050505] border border-[#1f1f1f] rounded-xl p-4 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${isHigh ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-[#0a0a0a] border-[#1f1f1f] text-[#666]'}`}>
                        {type === 'cpu' ? <Cpu className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-[#555] uppercase tracking-widest">{label}</p>
                        <p className={`text-lg font-bold tracking-tight ${isHigh ? 'text-red-500' : 'text-white'}`}>
                            {lastValue}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative h-[60px] w-full mt-2">
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={type === 'cpu' ? '#3b82f6' : '#a855f7'} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={type === 'cpu' ? '#3b82f6' : '#a855f7'} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    
                    <motion.polyline
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1 }}
                        fill="none"
                        stroke={type === 'cpu' ? '#3b82f6' : '#a855f7'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                    />
                    
                    <path
                        d={`M 0,${height} L ${points} L ${width},${height} Z`}
                        fill={`url(#gradient-${type})`}
                    />
                </svg>
            </div>
            
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
        </div>
    );
};

export default MetricsChart;
