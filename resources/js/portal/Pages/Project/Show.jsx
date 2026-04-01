import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    ChevronLeft, 
    Settings, 
    Zap, 
    Database, 
    Layers, 
    MoreHorizontal,
    RotateCcw,
    Square,
    Play,
    Loader2,
    ExternalLink
} from 'lucide-react';
import PortalLayout from '../../Layouts/PortalLayout';

const ProjectShow = ({ project, user, team }) => {
    const [currentEnvId, setCurrentEnvId] = useState(project.environments[0]?.id);
    const currentEnv = project.environments.find(env => env.id === currentEnvId) || project.environments[0];
    const [actioning, setActioning] = useState({ id: null, action: null });

    const handleAction = (resource, actionName) => {
        setActioning({ id: resource.id, action: actionName });
        router.post(`/portal/resource/${resource.type}/${resource.uuid}/${actionName}`, {}, {
            preserveScroll: true,
            onError: (err) => console.error(err),
            onFinish: () => setActioning({ id: null, action: null })
        });
    };

    return (
        <>
            <Head title={`${project.name} - Project`} />

            {/* Project Header */}
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-[#666] text-xs font-medium uppercase tracking-wider mb-2">
                        <span>Project Overview</span>
                        <span className="w-1 h-1 bg-[#222] rounded-full"></span>
                        
                        {project.environments.length > 1 ? (
                            <div className="relative inline-block border border-transparent hover:border-[#333] hover:bg-[#111] rounded px-1 -ml-1 transition-colors">
                                <select 
                                    value={currentEnvId} 
                                    onChange={(e) => setCurrentEnvId(Number(e.target.value))}
                                    className="appearance-none bg-transparent text-blue-500 font-medium pr-5 py-0.5 focus:outline-none cursor-pointer"
                                >
                                    {project.environments.map(env => (
                                        <option key={env.id} value={env.id} className="text-black">{env.name}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-blue-500">
                                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                                </div>
                            </div>
                        ) : (
                            <span className="text-blue-500">{currentEnv?.name}</span>
                        )}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white">{project.name}</h1>
                    <p className="text-[#888] text-sm max-w-2xl leading-relaxed">
                        {project.description || 'Manage your project resources, deployments, and environment settings.'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-[#0a0a0a] border border-[#1f1f1f] text-[#888] px-4 py-2 rounded-md text-sm font-medium hover:border-[#444] hover:text-white transition-all flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Visit URL
                    </button>
                    <button className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-[#eaeaea] transition-all transform hover:scale-[1.02]">
                        Deploy Now
                    </button>
                </div>
            </div>

            {/* Resources Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#111] pb-4">
                    <h2 className="text-sm font-semibold text-white">Active Resources</h2>
                    <span className="text-[10px] bg-[#111] border border-[#1f1f1f] px-2 py-0.5 rounded text-[#666]">
                        {currentEnv?.resources.length || 0} Total
                    </span>
                </div>
                
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: { transition: { staggerChildren: 0.04 } }
                    }}
                    className="grid gap-3"
                >
                    {currentEnv && currentEnv.resources.length > 0 ? currentEnv.resources.map((resource) => (
                        <motion.div
                            key={resource.id}
                            variants={{
                                hidden: { opacity: 0, x: -10 },
                                visible: { opacity: 1, x: 0 }
                            }}
                        >
                            <div className="bg-black border border-[#1f1f1f] rounded-xl p-4 flex items-center justify-between hover:border-[#333] hover:bg-[#050505] transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg border border-[#1f1f1f] flex items-center justify-center bg-[#0a0a0a] group-hover:border-[#333] transition-colors">
                                        {resource.type === 'application' && <Zap className="w-5 h-5 text-blue-500" />}
                                        {resource.type === 'database' && <Database className="w-5 h-5 text-purple-500" />}
                                        {resource.type === 'service' && <Layers className="w-5 h-5 text-green-500" />}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-[#eee] group-hover:text-white transition-colors">{resource.name}</h4>
                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-[#555] group-hover:text-[#888] transition-colors uppercase tracking-tight">
                                            <span className="flex items-center">
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${resource.status === 'running' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-zinc-700'}`}></span>
                                                {resource.status}
                                            </span>
                                            <span>•</span>
                                            <span>{resource.updated_at}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <a 
                                        href={resource.url} 
                                        target="_blank" 
                                        className="p-2 hover:bg-[#111] rounded-md text-[#666] hover:text-white transition-colors"
                                        title="Settings"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </a>

                                    {actioning.id === resource.id ? (
                                        <div className="p-2 text-[#888] flex items-center gap-2 text-xs font-medium">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="capitalize">{actioning.action}...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {resource.status === 'running' ? (
                                                <>
                                                    <button onClick={() => handleAction(resource, 'restart')} className="p-2 hover:bg-blue-500/10 rounded-md text-[#666] hover:text-blue-500 transition-colors" title="Restart">
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleAction(resource, 'stop')} className="p-2 hover:bg-red-500/10 rounded-md text-[#666] hover:text-red-500 transition-colors" title="Stop">
                                                        <Square className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => handleAction(resource, 'start')} className="p-2 hover:bg-green-500/10 rounded-md text-[#666] hover:text-green-500 transition-colors" title="Start">
                                                    <Play className="w-4 h-4" />
                                                </button>
                                            )}
                                        </>
                                    )}

                                    <div className="h-4 w-px bg-[#1f1f1f] mx-1"></div>
                                    <button className="p-2 hover:bg-[#111] rounded-md text-[#666]">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="py-20 text-center border border-dashed border-[#1f1f1f] rounded-xl text-[#444] text-sm bg-[#020202]">
                            <Layers className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            <p>No resources found in this environment.</p>
                            <button className="mt-4 text-xs text-blue-500 hover:text-blue-400 transition-colors font-medium">Add your first resource</button>
                        </div>
                    )}
                </motion.div>
            </div>
        </>
    );
};

ProjectShow.layout = page => <PortalLayout children={page} />;

export default ProjectShow;
