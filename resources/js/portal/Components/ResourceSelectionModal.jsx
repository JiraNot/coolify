import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    Database, 
    Layers, 
    ArrowRight,
    Search,
    X,
    Server,
    Globe,
    Layout
} from 'lucide-react';
import { Link } from '@inertiajs/react';

const ResourceCard = ({ type, project, environment, onClose }) => {
    const config = {
        application: {
            name: 'Application',
            description: 'Deploy code from GitHub, GitLab, or Docker.',
            icon: Zap,
            color: 'text-blue-500',
            borderColor: 'hover:border-blue-500/30',
            bgColor: 'bg-blue-500/5',
            glowColor: 'bg-blue-500/20'
        },
        database: {
            name: 'Database',
            description: 'PostgreSQL, MySQL, Redis, or other databases.',
            icon: Database,
            color: 'text-purple-500',
            borderColor: 'hover:border-purple-500/30',
            bgColor: 'bg-purple-500/5',
            glowColor: 'bg-purple-500/20'
        },
        service: {
            name: 'Service',
            description: 'One-click WordPress, Ghost, or Plausible.',
            icon: Layers,
            color: 'text-green-500',
            borderColor: 'hover:border-green-500/30',
            bgColor: 'bg-green-500/5',
            glowColor: 'bg-green-500/20'
        }
    }[type];

    const Icon = config.icon;

    return (
        <Link
            href={`/portal/project/${project.uuid}/environment/${environment.uuid}/new?type=${type}`}
            onClick={onClose}
            className={`group relative flex flex-col bg-[#050505] border border-[#1f1f1f] rounded-2xl p-5 transition-all duration-300 ${config.borderColor} hover:bg-[#080808] overflow-hidden shadow-2xl`}
        >
            <div className={`w-10 h-10 rounded-xl border border-[#1f1f1f] flex items-center justify-center bg-[#0a0a0a] mb-5 transition-colors group-hover:bg-[#111]`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            
            <h3 className="text-sm font-bold text-white mb-2">
                {config.name}
            </h3>
            <p className="text-[#555] text-xs leading-relaxed mb-6 group-hover:text-[#888] transition-colors">
                {config.description}
            </p>

            <div className="mt-auto flex items-center text-[10px] font-black uppercase tracking-widest text-[#333] group-hover:text-white transition-colors">
                Continue
                <ArrowRight className="w-3 h-3 ml-2 transform group-hover:translate-x-1 transition-transform" />
            </div>

            <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 blur-3xl transition-opacity ${config.glowColor}`}></div>
        </Link>
    );
};

const ResourceSelectionModal = ({ isOpen, onClose, project, environment }) => {
    const [search, setSearch] = useState('');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[#1f1f1f] rounded-3xl shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-[#111] flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">Add New Resource</h2>
                                <p className="text-[10px] text-[#555] font-black uppercase tracking-[0.2em] mt-1">To {environment?.name} environment</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 text-[#444] hover:text-white hover:bg-[#111] rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-8 py-4 bg-[#050505]/50 border-b border-[#111]">
                            <div className="relative group/search">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333] group-focus-within/search:text-white transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="Search templates, databases, stacks..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-[#111] border border-[#1f1f1f] rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#444] transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="p-8 grid sm:grid-cols-3 gap-4">
                            <ResourceCard type="application" project={project} environment={environment} onClose={onClose} />
                            <ResourceCard type="database" project={project} environment={environment} onClose={onClose} />
                            <ResourceCard type="service" project={project} environment={environment} onClose={onClose} />
                        </div>

                        {/* Footer / Helper Info */}
                        <div className="px-8 py-5 bg-[#050505] border-t border-[#111] flex flex-wrap items-center gap-6 justify-center sm:justify-start">
                            <div className="flex items-center gap-2">
                                <Server className="w-3.5 h-3.5 text-[#333]" />
                                <span className="text-[9px] text-[#444] font-black uppercase tracking-widest">Auto-Provisioning</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-[#333]" />
                                <span className="text-[9px] text-[#444] font-black uppercase tracking-widest">Global CDN</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Layout className="w-3.5 h-3.5 text-[#333]" />
                                <span className="text-[9px] text-[#444] font-black uppercase tracking-widest">One-Click Stacks</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ResourceSelectionModal;
