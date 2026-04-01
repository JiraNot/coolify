import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Plus, Search, ExternalLink, FolderOpen } from 'lucide-react';
import PortalLayout from '../Layouts/PortalLayout';

const Dashboard = ({ projects = [], user, team }) => {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        if (!query.trim()) return projects;
        const q = query.toLowerCase();
        return projects.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.description || '').toLowerCase().includes(q)
        );
    }, [projects, query]);

    return (
        <>
            <Head title="Dashboard" />

            {/* Page Header */}
            <div className="mb-10">
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                    {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Dashboard'}
                </h1>
                <p className="text-sm text-[#555] mt-1">
                    {projects.length} project{projects.length !== 1 ? 's' : ''} in <span className="text-[#888]">{team?.name || 'your team'}</span>
                </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
                <div className="relative flex-1 max-w-sm group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] group-focus-within:text-[#888] transition-colors pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search projects…"
                        className="w-full bg-black border border-[#1f1f1f] rounded-md py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#444] transition-colors placeholder:text-[#444]"
                    />
                </div>
                <a
                    href="/projects/new"
                    className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-[#eaeaea] transition-all flex items-center gap-2 shrink-0 justify-center"
                >
                    <Plus className="w-4 h-4" />
                    Add New
                </a>
            </div>

            {/* Projects Grid with Staggered Animation */}
            <AnimatePresence mode="wait">
                {filtered.length > 0 ? (
                    <motion.div
                        key="grid"
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {filtered.map((project) => (
                            <motion.div
                                key={project.id}
                                layout
                                variants={{
                                    hidden: { opacity: 0, y: 12 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
                                }}
                            >
                                <Link
                                    href={`/portal/project/${project.uuid}`}
                                    className="bg-black border border-[#1f1f1f] rounded-xl p-5 transition-all hover:border-[#333] hover:bg-[#040404] group block h-full"
                                >
                                    {/* Card header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg flex items-center justify-center group-hover:border-[#2a2a2a] transition-colors shrink-0">
                                                <LayoutGrid className="w-5 h-5 text-[#555] group-hover:text-[#999] transition-colors" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-[#ddd] group-hover:text-white transition-colors truncate">{project.name}</h3>
                                                <div className="flex items-center text-[11px] text-[#555] mt-0.5 group-hover:text-[#666] transition-colors">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 shadow-[0_0_6px_rgba(59,130,246,0.4)] shrink-0"></span>
                                                    <span className="truncate">{project.uuid.substring(0, 8)}.coolify.io</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-1.5 hover:bg-[#111] rounded-md transition-colors text-[#333] group-hover:text-[#666] shrink-0">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-[#555] mb-5 line-clamp-2 leading-relaxed group-hover:text-[#777] transition-colors min-h-[2.5rem]">
                                        {project.description || 'No description provided for this project.'}
                                    </p>

                                    {/* Footer meta */}
                                    <div className="flex items-center justify-between text-[10px] font-medium tracking-widest uppercase text-[#333] border-t border-[#0f0f0f] pt-3 group-hover:border-[#1a1a1a] transition-colors">
                                        <div className="flex gap-3">
                                            {project.environments.map(env => (
                                                <span key={env.id} className="flex items-center gap-1 group-hover:text-[#555] transition-colors">
                                                    {env.name}<span className="text-[#222] group-hover:text-[#444] ml-0.5">{env.resources_count}</span>
                                                </span>
                                            ))}
                                        </div>
                                        <span className="group-hover:text-[#555] transition-colors">Updated recently</span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="py-32 text-center border border-dashed border-[#1a1a1a] rounded-2xl bg-[#030303]"
                    >
                        <FolderOpen className="w-10 h-10 mx-auto mb-4 text-[#222]" />
                        {query ? (
                            <>
                                <p className="text-[#444] text-sm">No projects match <span className="text-[#666]">"{query}"</span></p>
                                <button onClick={() => setQuery('')} className="mt-3 text-xs text-blue-500 hover:text-blue-400 transition-colors">
                                    Clear search
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-[#444] text-sm">No projects in this team yet.</p>
                                <a href="/projects/new" className="mt-3 inline-block text-xs text-white underline underline-offset-4 hover:text-[#bbb] transition-colors">
                                    Create your first project
                                </a>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

Dashboard.layout = page => <PortalLayout children={page} />;

export default Dashboard;

