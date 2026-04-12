import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Box, 
    Copy, 
    Eye, 
    EyeOff, 
    Terminal as TerminalIcon, 
    Settings, 
    Trash2, 
    Play, 
    Square, 
    RotateCcw,
    ChevronRight,
    Loader2,
    Globe,
    GitBranch,
    Server,
    ExternalLink,
    RefreshCw,
    Activity,
    Cpu,
    Database,
    ShieldAlert,
    Download,
    Clock
} from 'lucide-react';
import PortalLayout from '../../../Layouts/PortalLayout';
import MetricsChart from '../../Components/MetricsChart';

const CopyableField = ({ label, value, type = 'text', hideable = false, link = false }) => {
    const [hidden, setHidden] = useState(hideable);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-1.5 mb-4 last:mb-0">
            <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em]">{label}</label>
            <div className="flex w-full overflow-hidden bg-black border border-[#1f1f1f] rounded-lg focus-within:border-[#444] transition-all relative group shadow-inner">
                {link ? (
                    <a 
                        href={value?.startsWith('http') ? value : `https://${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-transparent py-2 px-3 text-sm focus:outline-none text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 truncate font-medium"
                    >
                        {value || 'Not configured'}
                        <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                ) : (
                    <input
                        readOnly
                        type={hidden ? 'password' : type}
                        value={value || 'Not configured'}
                        className={`flex-1 bg-transparent border-none py-2 px-3 text-sm focus:outline-none focus:ring-0 ${!value ? 'text-[#444] italic' : 'text-[#ddd] font-mono'}`}
                    />
                )}
                
                {value && (
                    <div className="flex items-center absolute right-1 top-1 bottom-1 px-1 bg-black">
                        {hideable && (
                            <button 
                                onClick={() => setHidden(!hidden)}
                                className="p-1.5 text-[#444] hover:text-white transition-colors rounded-md hover:bg-[#111]"
                            >
                                {hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                        )}
                        <button 
                            onClick={handleCopy}
                            className="p-1.5 text-[#444] hover:text-white transition-colors rounded-md hover:bg-[#111]"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
                {copied && (
                    <div className="absolute inset-y-0 right-14 flex items-center">
                        <span className="text-[9px] text-green-500 font-bold bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded uppercase tracking-tighter">Copied</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const ApplicationShow = ({ project, environment, application, environmentVariables, user, team }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [actioning, setActioning] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteOptions, setDeleteOptions] = useState({
        delete_volumes: true,
        docker_cleanup: true,
        delete_configurations: true
    });

    const [logs, setLogs] = useState('');
    const [isPollingLogs, setIsPollingLogs] = useState(false);
    const logEndRef = useRef(null);

    // Initial log fetch & polling management
    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs();
            const interval = setInterval(fetchLogs, 3000);
            setIsPollingLogs(true);
            return () => {
                clearInterval(interval);
                setIsPollingLogs(false);
            };
        }
    }, [activeTab]);

    const fetchLogs = async () => {
        try {
            const response = await fetch(`/portal/application/${application.uuid}/logs?lines=200`);
            const data = await response.json();
            if (data.logs) {
                setLogs(data.logs);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        }
    };

    const scrollToBottom = () => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (activeTab === 'logs') {
            scrollToBottom();
        }
    }, [logs]);

    const handleAction = (actionName) => {
        setActioning(actionName);
        router.post(`/portal/resource/application/${application.uuid}/${actionName}`, {}, {
            preserveScroll: true,
            onFinish: () => setActioning(null)
        });
    };

    const handleDelete = () => {
        if (deleteConfirmation !== application.name) return;
        setDeleting(true);
        router.delete(`/portal/resource/application/${application.uuid}`, {
            data: deleteOptions,
            onFinish: () => {
                setDeleting(false);
                setShowDeleteModal(false);
            }
        });
    };

    const [showAddEnvModal, setShowAddEnvModal] = useState(false);
    const [envForm, setEnvForm] = useState({
        key: '',
        value: '',
        is_buildtime: true,
        is_runtime: true
    });

    const handleAddEnv = (e) => {
        e.preventDefault();
        router.post(`/portal/application/${application.uuid}/env`, envForm, {
            onSuccess: () => {
                setShowAddEnvModal(false);
                setEnvForm({ key: '', value: '', is_buildtime: true, is_runtime: true });
            }
        });
    };

    const handleDeleteEnv = (envId) => {
        if (confirm('Are you sure?')) {
            router.delete(`/portal/application/${application.uuid}/env/${envId}`, { preserveScroll: true });
        }
    };

    const settingsForm = useForm({
        name: application.name,
        description: application.description
    });

    const handleUpdateSettings = (e) => {
        e.preventDefault();
        settingsForm.post(`/portal/application/${application.uuid}`, {
            preserveScroll: true,
        });
    };

    const isRunning = application.status?.startsWith('running');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Info },
        { id: 'logs', label: 'Logs', icon: TerminalIcon },
        { id: 'performance', label: 'Performance', icon: Activity },
        { id: 'env', label: 'Environment', icon: Database },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <PortalLayout>
            <Head title={`${application.name} - Application`} />

            {/* Premium Header */}
            <div className="relative mb-10">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-pink-500/5 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="flex items-center gap-2 text-[#555] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                    <Link href={`/portal/project/${project.uuid}`} className="hover:text-pink-400 transition-colors">{project.name}</Link>
                    <ChevronRight className="w-3 h-3 text-[#333]" />
                    <span className="text-[#888]">{environment.name}</span>
                    <ChevronRight className="w-3 h-3 text-[#333]" />
                    <span className="text-white">Application</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#111] to-black border border-[#1f1f1f] flex items-center justify-center relative group shadow-2xl">
                            <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-sm" />
                            <Box className="w-7 h-7 text-pink-500 relative z-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-extrabold tracking-tight text-white">{application.name}</h1>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                                    isRunning ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500' : 'bg-zinc-500'} animate-pulse`} />
                                    {application.status || 'unknown'}
                                </div>
                            </div>
                            <p className="text-[#666] text-sm mt-1 font-medium">{application.description || 'Application Resource'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-[#0a0a0a] p-1 rounded-xl border border-[#1f1f1f] shadow-lg">
                        <a 
                            href={application.native_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-[#111] text-[#666] hover:text-white rounded-lg text-xs font-bold hover:bg-[#1a1a1a] border border-[#1f1f1f] transition-all flex items-center justify-center shadow-sm group/cog"
                            title="Configure in Coolify"
                        >
                            <Settings className="w-4 h-4 group-hover/cog:rotate-90 transition-transform duration-500" />
                        </a>
                        <div className="w-[1px] h-4 bg-[#1f1f1f] mx-1" />
                        {isRunning ? (
                            <>
                                <button 
                                    onClick={() => handleAction('redeploy')}
                                    disabled={actioning !== null}
                                    className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    {actioning === 'redeploy' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                    Redeploy
                                </button>
                                <button 
                                    onClick={() => handleAction('restart')}
                                    disabled={actioning !== null}
                                    className="px-4 py-2 bg-[#111] text-white rounded-lg text-xs font-bold hover:bg-[#1a1a1a] border border-[#1f1f1f] transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {actioning === 'restart' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                    Restart
                                </button>
                                <button 
                                    onClick={() => handleAction('stop')}
                                    disabled={actioning !== null}
                                    className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {actioning === 'stop' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                                    Stop
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => handleAction('start')}
                                disabled={actioning !== null}
                                className="px-6 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                {actioning === 'start' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                Start Application
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded-xl border border-[#1f1f1f] mb-8 w-fit shadow-xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 tracking-wide ${
                            activeTab === tab.id 
                                ? 'bg-[#161616] text-white shadow-inner border border-[#222]' 
                                : 'text-[#555] hover:text-[#888] hover:bg-[#0d0d0d]'
                        }`}
                    >
                        <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-pink-500' : 'text-zinc-600'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                    transition={{ duration: 0.3, ease: "circOut" }}
                >
                    {activeTab === 'overview' && (
                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <section className="premium-card p-6 bg-[#050505] border border-[#1f1f1f] rounded-2xl shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Globe className="w-24 h-24" />
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                                        <Globe className="w-4 h-4 text-blue-500 font-bold" />
                                        Deployment Information
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <CopyableField label="Public Domain" value={application.fqdn} link={true} />
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-6">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2 block font-bold">Build Pack</label>
                                                    <div className="text-xs text-white font-bold bg-[#111] px-4 py-2.5 rounded-lg border border-[#1f1f1f] inline-block capitalize tracking-wider shadow-inner">
                                                        {application.build_pack}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2 block font-bold">Exposed Port</label>
                                                    <div className="text-xs text-white font-mono font-bold bg-[#111] px-4 py-2.5 rounded-lg border border-[#1f1f1f] inline-block shadow-inner">
                                                        {application.ports_exposes || '80'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="premium-card p-6 bg-[#050505] border border-[#1f1f1f] rounded-2xl shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <GitBranch className="w-24 h-24" />
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                                        <GitBranch className="w-4 h-4 text-purple-500 font-bold" />
                                        Source Control
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <CopyableField label="Repository" value={application.git_repository} />
                                            <CopyableField label="Git Branch" value={application.git_branch} />
                                        </div>
                                        {application.git_commit_sha && (
                                            <div className="pt-2">
                                                <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2 block">Latest Commit Hash</label>
                                                <div className="font-mono text-[11px] text-[#aaa] bg-black p-3 rounded-xl border border-[#1f1f1f] shadow-inner break-all">
                                                    {application.git_commit_sha}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <div className="premium-card p-5 bg-gradient-to-br from-[#0a0a0a] to-black border border-[#1f1f1f] rounded-2xl shadow-xl">
                                    <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] mb-4">Infrastructure</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-[#1f1f1f]">
                                            <Server className="w-6 h-6 text-[#666]" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-bold">{application.destination?.server?.name || 'Local Server'}</p>
                                            <p className="text-[10px] text-[#555] font-mono mt-0.5">{application.destination?.server?.ip}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-[#111] space-y-4">
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <span className="text-[#555]">Container Platform</span>
                                            <span className="text-white">Docker</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <span className="text-[#555]">Network</span>
                                            <span className="text-white font-mono">{application.destination?.network || 'coolify'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-white bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                                        <TerminalIcon className="w-3.5 h-3.5 text-pink-500" />
                                        {application.name} stdout/stderr
                                    </div>
                                    {isPollingLogs && (
                                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Live</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={fetchLogs}
                                        className="p-1.5 text-[#555] hover:text-white transition-colors"
                                        title="Refresh Logs"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-pink-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <div className="bg-[#050505] border border-[#1f1f1f] rounded-2xl overflow-hidden shadow-2xl min-h-[500px] flex flex-col font-mono relative z-10">
                                    <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d0d] border-b border-[#1f1f1f] text-[10px] font-bold text-[#444] uppercase tracking-widest">
                                        <span>Terminal Output</span>
                                        <span className="text-[9px]">Last 200 lines</span>
                                    </div>
                                    <div className="flex-1 p-6 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-800">
                                        <div className="space-y-1">
                                            {logs ? (
                                                logs.split('\n').map((line, i) => (
                                                    <div key={i} className="flex gap-4 group/line">
                                                        <span className="text-[#333] text-[10px] select-none w-8 text-right pt-0.5">{i + 1}</span>
                                                        <span className="text-[#bbb] text-sm break-all leading-relaxed whitespace-pre-wrap">{line}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                                    <p className="text-sm font-bold uppercase tracking-widest">Retrieving logs...</p>
                                                </div>
                                            )}
                                            <div ref={logEndRef} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'performance' && (
                        <div className="space-y-6">
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div className="premium-card p-6 bg-[#050505] border border-[#1f1f1f] rounded-2xl shadow-xl">
                                    <h3 className="text-xs font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                                        <Cpu className="w-4 h-4 text-pink-500" />
                                        CPU Utilization
                                    </h3>
                                    <MetricsChart
                                        resourceUuid={application.uuid}
                                        resourceType="application"
                                        type="cpu"
                                        label="vCPU Core Usage"
                                    />
                                </div>
                                <div className="premium-card p-6 bg-[#050505] border border-[#1f1f1f] rounded-2xl shadow-xl">
                                    <h3 className="text-xs font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                                        <Database className="w-4 h-4 text-blue-500" />
                                        Memory Usage
                                    </h3>
                                    <MetricsChart
                                        resourceUuid={application.uuid}
                                        resourceType="application"
                                        type="memory"
                                        label="Allocated RAM (MB)"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'env' && (
                        <div className="space-y-6">
                            <section className="premium-card bg-[#050505] border border-[#1f1f1f] rounded-2xl shadow-2xl overflow-hidden">
                                <div className="p-6 border-b border-[#111] flex items-center justify-between bg-gradient-to-r from-black to-[#050505]">
                                    <div>
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Environment Configuration</h3>
                                        <p className="text-xs text-[#555] mt-1 font-medium">Critical runtime and build-time variables</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowAddEnvModal(true)}
                                        className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors shadow-lg"
                                    >
                                        Add Variable
                                    </button>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    {environmentVariables.length > 0 ? (
                                        <table className="w-full text-left text-sm text-[#888]">
                                            <thead className="text-[10px] text-[#444] uppercase bg-[#0a0a0a] border-b border-[#1f1f1f] font-bold tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-4">Variable Key</th>
                                                    <th className="px-6 py-4">Scope</th>
                                                    <th className="px-6 py-4">Value Reference</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#111]">
                                                {environmentVariables.map((env) => (
                                                    <tr key={env.id} className="hover:bg-[#0a0a0a] transition-colors group">
                                                        <td className="px-6 py-4 font-mono text-[#ddd] text-xs font-bold">{env.key}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-1.5">
                                                                {env.is_runtime && <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-tighter border border-blue-500/10">Runtime</span>}
                                                                {env.is_buildtime && <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[8px] font-black uppercase tracking-tighter border border-purple-500/10">Build</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-mono">
                                                            <span className="text-[#333] font-bold tracking-[0.3em] bg-black px-3 py-1 rounded-lg border border-[#111] text-[10px]">
                                                                ••••••••
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                onClick={() => handleDeleteEnv(env.id)}
                                                                className="text-[#444] hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/5 group-hover:opacity-100 opacity-30"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="py-20 text-center flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-3xl bg-[#0a0a0a] border border-[#1f1f1f] flex items-center justify-center mb-4">
                                                <Database className="w-8 h-8 text-[#222]" />
                                            </div>
                                            <p className="text-[#333] text-sm font-black uppercase tracking-widest">No variables defined</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-3xl space-y-8">
                            <section className="premium-card p-8 bg-[#050505] border border-[#1f1f1f] rounded-2xl shadow-xl">
                                <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-widest flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-[#888]" />
                                    General Configuration
                                </h3>
                                <p className="text-xs text-[#555] mb-8 font-medium">Update core resource attributes</p>
                                
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    settingsForm.post(`/portal/application/${application.uuid}`, { preserveScroll: true });
                                }} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2 block">Friendly Name</label>
                                            <input 
                                                type="text" 
                                                value={settingsForm.data.name}
                                                onChange={e => settingsForm.setData('name', e.target.value)}
                                                className="w-full bg-black border border-[#1f1f1f] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-2 block">Description</label>
                                            <input 
                                                type="text" 
                                                value={settingsForm.data.description || ''}
                                                onChange={e => settingsForm.setData('description', e.target.value)}
                                                className="w-full bg-black border border-[#1f1f1f] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            type="submit"
                                            disabled={settingsForm.processing}
                                            className="bg-white text-black px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {settingsForm.processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </section>

                            <section className="premium-card p-8 bg-red-500/[0.02] border border-red-500/10 rounded-2xl shadow-xl">
                                <h3 className="text-sm font-bold text-red-500/80 mb-1 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" />
                                    Danger Zone
                                </h3>
                                <p className="text-xs text-[#555] mb-8 font-medium">Irreversible actions that affect your production infrastructure</p>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 bg-black/40 border border-red-500/20 rounded-2xl">
                                    <div>
                                        <h4 className="text-white text-sm font-bold">Terminate Application</h4>
                                        <p className="text-xs text-[#666] mt-1 pr-4">Permanently destroy this application container and optionally its volumes. This cannot be undone.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowDeleteModal(true)}
                                        className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 shadow-lg shadow-red-500/5"
                                    >
                                        Delete Forever
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#050505] border border-red-500/20 rounded-3xl shadow-[0_0_100px_rgba(239,68,68,0.1)] overflow-hidden"
                        >
                            <div className="p-10">
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                                        <Trash2 className="w-7 h-7 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">Terminate Application</h3>
                                        <p className="text-[#666] text-sm font-medium">This is a destructive, one-way action.</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10 bg-black/30 p-6 rounded-2xl border border-[#111]">
                                    {[
                                        { id: 'delete_volumes', label: 'Purge Persistent Volumes' },
                                        { id: 'docker_cleanup', label: 'Force Docker Cleanup' },
                                        { id: 'delete_configurations', label: 'Erase Local Configurations' }
                                    ].map(option => (
                                        <label key={option.id} className="flex items-center gap-4 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input 
                                                    type="checkbox"
                                                    checked={deleteOptions[option.id]}
                                                    onChange={() => setDeleteOptions(prev => ({ ...prev, [option.id]: !prev[option.id] }))}
                                                    className="w-5 h-5 appearance-none bg-black border-2 border-[#1f1f1f] rounded-lg checked:bg-red-500 checked:border-red-500 transition-all cursor-pointer"
                                                />
                                                {deleteOptions[option.id] && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <Box className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-[#888] group-hover:text-white transition-colors">{option.label}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="mb-10">
                                    <label className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] mb-3 block">
                                        Enter <span className="text-red-500 select-all font-mono">{application.name}</span> to confirm
                                    </label>
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder={application.name}
                                        className="w-full bg-black border border-[#1f1f1f] rounded-xl py-3 px-5 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all font-mono shadow-inner uppercase tracking-wider h-14"
                                    />
                                </div>

                                <div className="flex items-center gap-4 text-xs">
                                    <button 
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 bg-transparent hover:bg-[#111] text-[#666] hover:text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all border border-transparent hover:border-[#1f1f1f]"
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        onClick={handleDelete}
                                        disabled={deleteConfirmation !== application.name || deleting}
                                        className="flex-[2] bg-red-500 text-white hover:bg-red-600 disabled:opacity-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-red-500/20 flex items-center justify-center gap-3"
                                    >
                                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                                        Terminate Permanent
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Env Modal */}
            <AnimatePresence>
                {showAddEnvModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddEnvModal(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[#050505] border border-[#1f1f1f] rounded-3xl shadow-2xl overflow-hidden p-8 sm:p-10"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                    <Database className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Add Environment Variable</h3>
                                    <p className="text-xs text-[#555] font-medium uppercase tracking-widest mt-0.5">Define new runtime configuration</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddEnv} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] mb-2.5 block">Variable Key</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={envForm.key}
                                        onChange={e => setEnvForm({ ...envForm, key: e.target.value.toUpperCase() })}
                                        className="w-full bg-black border border-[#1f1f1f] rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono uppercase tracking-wider"
                                        placeholder="DATABASE_URL"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] mb-2.5 block">Variable Value</label>
                                    <textarea 
                                        rows="3"
                                        value={envForm.value}
                                        onChange={e => setEnvForm({ ...envForm, value: e.target.value })}
                                        className="w-full bg-black border border-[#1f1f1f] rounded-xl px-5 py-3 text-sm text-[#ddd] focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                                        placeholder="postgresql://user:pass@localhost:5432/db"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center justify-between p-4 bg-black border border-[#1f1f1f] rounded-xl cursor-pointer hover:bg-[#0a0a0a] transition-all group">
                                        <span className="text-xs font-bold text-[#888] group-hover:text-white uppercase tracking-widest">Build-time</span>
                                        <input 
                                            type="checkbox" 
                                            checked={envForm.is_buildtime}
                                            onChange={e => setEnvForm({ ...envForm, is_buildtime: e.target.checked })}
                                            className="w-5 h-5 appearance-none bg-[#111] border border-[#222] rounded-lg checked:bg-purple-500 checked:border-purple-500 cursor-pointer transition-all"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-4 bg-black border border-[#1f1f1f] rounded-xl cursor-pointer hover:bg-[#0a0a0a] transition-all group">
                                        <span className="text-xs font-bold text-[#888] group-hover:text-white uppercase tracking-widest">Runtime</span>
                                        <input 
                                            type="checkbox" 
                                            checked={envForm.is_runtime}
                                            onChange={e => setEnvForm({ ...envForm, is_runtime: e.target.checked })}
                                            className="w-5 h-5 appearance-none bg-[#111] border border-[#222] rounded-lg checked:bg-blue-500 checked:border-blue-500 cursor-pointer transition-all"
                                        />
                                    </label>
                                </div>

                                <div className="flex items-center gap-4 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setShowAddEnvModal(false)}
                                        className="flex-1 bg-transparent hover:bg-zinc-900 text-[#555] hover:text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-transparent hover:border-[#1f1f1f]"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-2xl shadow-white/5 active:scale-95"
                                    >
                                        Register Variable
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PortalLayout>
    );
};

export default ApplicationShow;
