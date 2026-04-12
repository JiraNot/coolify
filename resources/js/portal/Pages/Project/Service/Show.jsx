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
    Shield,
    ShieldAlert,
    Database,
    Layers,
    Clock,
    Shield,
    Download
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
            <div className="flex w-full overflow-hidden bg-black border border-[#1f1f1f] rounded-lg focus-within:border-[#444] transition-all relative group shadow-inner font-bold">
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

const ServiceShow = ({ project, environment, service, serviceApplications, serviceDatabases, environmentVariables, user, team }) => {
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
    const [logTarget, setLogTarget] = useState(serviceApplications[0]?.uuid || serviceDatabases[0]?.uuid || null);
    const logEndRef = useRef(null);

    // Initial log fetch & polling management
    useEffect(() => {
        if (activeTab === 'logs' && logTarget) {
            setLogs(''); // Clear when target changes
            fetchLogs();
            const interval = setInterval(fetchLogs, 3000);
            setIsPollingLogs(true);
            return () => {
                clearInterval(interval);
                setIsPollingLogs(false);
            };
        }
    }, [activeTab, logTarget]);

    const fetchLogs = async () => {
        if (!logTarget) return;
        try {
            const response = await fetch(`/portal/service/${service.uuid}/logs?target_uuid=${logTarget}&lines=200`);
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
        router.post(`/portal/resource/service/${service.uuid}/${actionName}`, {}, {
            preserveScroll: true,
            onFinish: () => setActioning(null)
        });
    };

    const handleDelete = () => {
        if (deleteConfirmation !== service.name) return;
        setDeleting(true);
        router.delete(`/portal/resource/service/${service.uuid}`, {
            data: deleteOptions,
            onFinish: () => {
                setDeleting(false);
                setShowDeleteModal(false);
            }
        });
    };

    const [showAddEnvModal, setShowAddEnvModal] = useState(false);
    const [envForm, setEnvForm] = useState({ key: '', value: '' });

    const handleAddEnv = (e) => {
        e.preventDefault();
        router.post(`/portal/service/${service.uuid}/env`, envForm, {
            onSuccess: () => {
                setShowAddEnvModal(false);
                setEnvForm({ key: '', value: '' });
            }
        });
    };

    const handleDeleteEnv = (envId) => {
        if (confirm('Are you sure?')) {
            router.delete(`/portal/service/${service.uuid}/env/${envId}`, { preserveScroll: true });
        }
    };

    const settingsForm = useForm({
        name: service.name,
        description: service.description
    });

    const handleUpdateSettings = (e) => {
        e.preventDefault();
        settingsForm.post(`/portal/service/${service.uuid}`, {
            preserveScroll: true,
        });
    };

    const isRunning = service.status?.toLowerCase().includes('running') || service.status?.toLowerCase().includes('healthy');

    const tabs = [
        { id: 'overview', label: 'Stack View', icon: Layers },
        { id: 'logs', label: 'Live Logs', icon: TerminalIcon },
        { id: 'performance', label: 'Metrics', icon: Activity },
        { id: 'backups', label: 'Backups', icon: Shield },
        { id: 'env', label: 'Variables', icon: Database },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <PortalLayout>
            <Head title={`${service.name} - Service Stack`} />

            {/* Premium Header */}
            <div className="relative mb-10">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="flex items-center gap-2 text-[#555] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                    <Link href={`/portal/project/${project.uuid}`} className="hover:text-green-400 transition-colors">{project.name}</Link>
                    <ChevronRight className="w-3 h-3 text-[#333]" />
                    <span className="text-[#888]">{environment.name}</span>
                    <ChevronRight className="w-3 h-3 text-[#333]" />
                    <span className="text-white font-bold">Service Stack</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#111] to-black border border-[#1f1f1f] flex items-center justify-center relative group shadow-2xl">
                            <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-sm" />
                            <Layers className="w-7 h-7 text-green-500 relative z-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 font-bold">
                                <h1 className="text-3xl font-extrabold tracking-tight text-white">{service.name}</h1>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                                    isRunning ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500' : 'bg-zinc-500'} animate-pulse`} />
                                    {service.status || 'unknown'}
                                </div>
                            </div>
                            <p className="text-[#666] text-sm mt-1 font-medium italic">{service.description || 'Docker Compose Service Stack'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-[#0a0a0a] p-1 rounded-xl border border-[#1f1f1f] shadow-lg">
                        <a 
                            href={service.native_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-[#111] text-[#666] hover:text-white rounded-lg text-xs font-bold hover:bg-[#1a1a1a] border border-[#1f1f1f] transition-all flex items-center justify-center shadow-sm group/cog font-bold"
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
                                Start All Components
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
                        <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-green-500' : 'text-zinc-600'}`} />
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
                            <div className="lg:col-span-2 space-y-6 font-bold">
                                {serviceApplications.length > 0 && (
                                    <section className="bg-[#050505] border border-[#1f1f1f] rounded-2xl overflow-hidden shadow-2xl">
                                        <div className="px-6 py-4 bg-[#0d0d0d] border-b border-[#1f1f1f] flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Box className="w-4 h-4 text-blue-500 font-bold" />
                                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Applications</h3>
                                            </div>
                                            <span className="text-[10px] text-[#444] font-black uppercase tracking-widest bg-black px-2 py-0.5 rounded border border-[#1f1f1f]">
                                                {serviceApplications.length} Members
                                            </span>
                                        </div>
                                        <div className="divide-y divide-[#111]">
                                            {serviceApplications.map(app => (
                                                <div key={app.uuid} className="px-6 py-4 flex items-center justify-between hover:bg-[#080808] transition-colors group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-black border border-[#1f1f1f] flex items-center justify-center group-hover:border-blue-500/30 transition-colors">
                                                            <Box className="w-5 h-5 text-[#444] group-hover:text-blue-500 transition-colors" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{app.name}</h4>
                                                            <p className="text-[10px] text-[#555] font-mono mt-0.5">{app.image}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                                                            app.status?.startsWith('running') ? 'text-green-500 border-green-500/10 bg-green-500/5' : 'text-[#444] border-[#1f1f1f] bg-black'
                                                        }`}>
                                                            {app.status}
                                                        </div>
                                                        {app.fqdn && (
                                                            <a href={app.fqdn.startsWith('http') ? app.fqdn : `https://${app.fqdn}`} target="_blank" className="p-2 text-[#444] hover:text-white transition-colors">
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {serviceDatabases.length > 0 && (
                                    <section className="bg-[#050505] border border-[#1f1f1f] rounded-2xl overflow-hidden shadow-2xl">
                                        <div className="px-6 py-4 bg-[#0d0d0d] border-b border-[#1f1f1f] flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Database className="w-4 h-4 text-purple-500 font-bold" />
                                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Databases</h3>
                                            </div>
                                            <span className="text-[10px] text-[#444] font-black uppercase tracking-widest bg-black px-2 py-0.5 rounded border border-[#1f1f1f]">
                                                {serviceDatabases.length} Members
                                            </span>
                                        </div>
                                        <div className="divide-y divide-[#111]">
                                            {serviceDatabases.map(db => (
                                                <div key={db.uuid} className="px-6 py-4 flex items-center justify-between hover:bg-[#080808] transition-colors group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-black border border-[#1f1f1f] flex items-center justify-center group-hover:border-purple-500/30 transition-colors">
                                                            <Database className="w-5 h-5 text-[#444] group-hover:text-purple-500 transition-colors" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{db.name}</h4>
                                                            <p className="text-[10px] text-[#555] font-mono mt-0.5">{db.image}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                                                        db.status?.startsWith('running') ? 'text-green-500 border-green-500/10 bg-green-500/5' : 'text-[#444] border-[#1f1f1f] bg-black'
                                                    }`}>
                                                        {db.status}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>

                            <div className="space-y-6">
                                <section className="premium-card p-5 bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl shadow-xl">
                                    <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] mb-4">Stack Infrastructure</h3>
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-4 pb-5 border-b border-[#111]">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-[#1f1f1f]">
                                                <Server className="w-6 h-6 text-[#666]" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white font-bold">{service.destination?.server?.name || 'Target Server'}</p>
                                                <p className="text-[10px] text-[#555] font-mono mt-0.5">{service.destination?.server?.ip}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 font-bold">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-[#444] uppercase tracking-wider">Service Type</span>
                                                <span className="text-xs text-[#aaa] capitalize">{service.service_type || 'Compose'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-[#444] uppercase tracking-wider">Network</span>
                                                <span className="text-xs font-mono text-green-500">{service.destination?.network || 'coolify'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-[#444] uppercase tracking-wider">Created At</span>
                                                <span className="text-[10px] text-[#666]">{new Date(service.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                
                                <section className="premium-card p-5 bg-blue-500/[0.02] border border-blue-500/10 rounded-2xl shadow-xl">
                                    <h3 className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.2em] mb-4">External Control</h3>
                                    <a 
                                        href={`/project/${project.uuid}/environment/${environment.uuid}/service/${service.uuid}`}
                                        target="_blank"
                                        className="w-full flex items-center justify-between p-3 bg-black border border-[#1f1f1f] rounded-xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
                                    >
                                        <span className="text-xs text-[#888] group-hover:text-white transition-colors">Advanced Config</span>
                                        <ExternalLink className="w-4 h-4 text-[#333] group-hover:text-blue-500 transition-colors" />
                                    </a>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-5 font-bold">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] mr-2">Component:</span>
                                    {serviceApplications.map(app => (
                                        <button 
                                            key={app.uuid}
                                            onClick={() => setLogTarget(app.uuid)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                logTarget === app.uuid 
                                                    ? 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                                                    : 'bg-[#111] text-[#555] border-[#1f1f1f] hover:border-[#333]'
                                            }`}
                                        >
                                            {app.name}
                                        </button>
                                    ))}
                                    {serviceDatabases.map(db => (
                                        <button 
                                            key={db.uuid}
                                            onClick={() => setLogTarget(db.uuid)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                logTarget === db.uuid 
                                                    ? 'bg-purple-500 text-white border-purple-600 shadow-lg shadow-purple-500/20' 
                                                    : 'bg-[#111] text-[#555] border-[#1f1f1f] hover:border-[#333]'
                                            }`}
                                        >
                                            {db.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    {isPollingLogs && (
                                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Streaming</span>
                                        </div>
                                    )}
                                    <button onClick={fetchLogs} className="p-2 text-[#444] hover:text-white transition-colors">
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-green-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <div className="bg-[#050505] border border-[#1f1f1f] rounded-2xl overflow-hidden shadow-2xl min-h-[550px] flex flex-col font-mono relative z-10">
                                    <div className="flex items-center justify-between px-6 py-3 bg-[#0d0d0d] border-b border-[#1f1f1f] text-[10px] font-black text-[#555] uppercase tracking-widest">
                                        <span>Stdout / Stderr Pipeline</span>
                                        <div className="flex items-center gap-4">
                                            <span>Target: <span className="text-white">{serviceApplications.find(a => a.uuid === logTarget)?.name || serviceDatabases.find(d => d.uuid === logTarget)?.name || 'None'}</span></span>
                                            <TerminalIcon className="w-3.5 h-3.5 text-green-500" />
                                        </div>
                                    </div>
                                    <div className="flex-1 p-8 overflow-y-auto max-h-[650px] scrollbar-thin scrollbar-thumb-zinc-800">
                                        <div className="space-y-1.5">
                                            {logs ? (
                                                logs.split('\n').map((line, i) => (
                                                    <div key={i} className="flex gap-6 group/line">
                                                        <span className="text-[#222] text-[10px] select-none w-10 text-right pt-1 font-black">{i + 1}</span>
                                                        <span className="text-[#aaa] text-sm break-all leading-loose whitespace-pre-wrap">{line}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-24 opacity-20">
                                                    <Loader2 className="w-10 h-10 animate-spin mb-6 text-green-500" />
                                                    <p className="text-sm font-black uppercase tracking-[0.3em]">Connecting to Container...</p>
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
                        <div className="space-y-10 font-bold">
                            {serviceApplications.map(app => (
                                <div key={`p-${app.uuid}`} className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <Box className="w-4 h-4 text-blue-500 font-bold" />
                                        <h3 className="text-xs font-black text-[#555] uppercase tracking-widest">{app.name} Utilization</h3>
                                    </div>
                                    <div className="grid lg:grid-cols-2 gap-6">
                                        <div className="premium-card p-6 bg-[#050505] border border-[#1f1f1f] rounded-2xl shadow-xl">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-[10px] font-black text-[#444] uppercase tracking-widest">CPU Usage</h4>
                                                <Cpu className="w-4 h-4 text-pink-500/50" />
                                            </div>
                                            <MetricsChart resourceUuid={app.uuid} resourceType="service/application" type="cpu" label="vCPU Core" />
                                        </div>
                                        <div className="premium-card p-6 bg-[#050505] border border-[#1f1f1f] rounded-2xl shadow-xl">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-[10px] font-black text-[#444] uppercase tracking-widest">Memory RAM</h4>
                                                <Database className="w-4 h-4 text-blue-500/50" />
                                            </div>
                                            <MetricsChart resourceUuid={app.uuid} resourceType="service/application" type="memory" label="Memory (MB)" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {serviceDatabases.map(db => (
                                <div key={`p-${db.uuid}`} className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <Database className="w-4 h-4 text-purple-500 font-bold" />
                                        <h3 className="text-xs font-black text-[#555] uppercase tracking-widest">{db.name} Utilization</h3>
                                    </div>
                                    <div className="grid lg:grid-cols-2 gap-6">
                                        <div className="premium-card p-6 bg-[#050505] border border-[#1f1f1f] rounded-2xl shadow-xl">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-[10px] font-black text-[#444] uppercase tracking-widest">CPU Usage</h4>
                                                <Cpu className="w-4 h-4 text-pink-500/50" />
                                            </div>
                                            <MetricsChart resourceUuid={db.uuid} resourceType="service/database" type="cpu" label="vCPU Core" />
                                        </div>
                                        <div className="premium-card p-6 bg-[#050505] border border-[#1f1f1f] rounded-2xl shadow-xl">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-[10px] font-black text-[#444] uppercase tracking-widest">Memory RAM</h4>
                                                <Database className="w-4 h-4 text-blue-500/50" />
                                            </div>
                                            <MetricsChart resourceUuid={db.uuid} resourceType="service/database" type="memory" label="Memory (MB)" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'backups' && (
                        <div className="space-y-8 font-bold">
                            {serviceDatabases.length > 0 ? (
                                serviceDatabases.map(db => (
                                    <section key={`b-${db.uuid}`} className="bg-[#050505] border border-[#1f1f1f] rounded-2xl overflow-hidden shadow-2xl">
                                        <div className="px-8 py-5 bg-[#0d0d0d] border-b border-[#1f1f1f] flex items-center justify-between font-bold">
                                            <div className="flex items-center gap-3">
                                                <Shield className="w-5 h-5 text-green-500 font-bold" />
                                                <h3 className="text-sm font-black text-white uppercase tracking-widest">{db.name} Backups</h3>
                                            </div>
                                            <span className="text-[10px] text-green-500/80 font-black uppercase tracking-widest bg-green-500/5 px-3 py-1 rounded-full border border-green-500/10">Protected</span>
                                        </div>
                                        <div className="p-8">
                                            {db.scheduledBackups && db.scheduledBackups.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="text-[10px] text-[#444] uppercase tracking-widest border-b border-[#111]">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left font-black">Frequency</th>
                                                                <th className="px-4 py-3 text-left font-black">Destination</th>
                                                                <th className="px-4 py-3 text-left font-black">Retention</th>
                                                                <th className="px-4 py-3 text-right font-black">Latest</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[#111]">
                                                            {db.scheduledBackups.map(backup => (
                                                                <tr key={backup.uuid} className="hover:bg-white/[0.02] transition-colors">
                                                                    <td className="px-4 py-5 font-bold text-white uppercase tracking-tighter">{backup.frequency}</td>
                                                                    <td className="px-4 py-5 font-mono text-xs text-[#666]">{backup.s3?.name || 'Local'}</td>
                                                                    <td className="px-4 py-5 text-xs text-[#aaa]">{backup.number_of_backups_locally} Keeps</td>
                                                                    <td className="px-4 py-5 text-right">
                                                                        <button className="p-2 text-[#444] hover:text-white transition-colors bg-white/5 rounded-lg border border-[#1f1f1f]">
                                                                            <Download className="w-4 h-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="py-12 flex flex-col items-center justify-center opacity-30 italic">
                                                    <ShieldOff className="w-10 h-10 mb-4" />
                                                    <p className="text-sm uppercase tracking-widest font-black">No scheduled backups found</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                ))
                            ) : (
                                <div className="py-24 text-center bg-[#050505] border border-[#1f1f1f] rounded-3xl shadow-xl italic font-bold">
                                    <Shield className="w-12 h-12 text-[#222] mx-auto mb-4" />
                                    <p className="text-[#333] text-sm uppercase tracking-widest font-black">This service stack contains no database components with backups.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'env' && (
                        <div className="space-y-6">
                            <section className="bg-[#050505] border border-[#1f1f1f] rounded-2xl shadow-2xl overflow-hidden font-bold">
                                <div className="p-8 border-b border-[#111] flex items-center justify-between bg-gradient-to-r from-black to-[#050505]">
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Service Environment</h3>
                                        <p className="text-[10px] text-[#444] mt-1 font-black uppercase tracking-[0.2em]">Shared variables for the entire stack</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowAddEnvModal(true)}
                                        className="bg-white text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 active:scale-95"
                                    >
                                        Add stack variable
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    {environmentVariables.length > 0 ? (
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-[10px] text-[#444] uppercase bg-[#0a0a0a] border-b border-[#1f1f1f] font-black tracking-widest">
                                                <tr>
                                                    <th className="px-8 py-4 font-bold">Key</th>
                                                    <th className="px-8 py-4 font-bold">Encrypted Value</th>
                                                    <th className="px-8 py-4 text-right font-bold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#111]">
                                                {environmentVariables.map((env) => (
                                                    <tr key={env.id} className="hover:bg-[#0a0a0a] transition-colors group">
                                                        <td className="px-8 py-5 font-mono text-xs text-white uppercase tracking-wider">{env.key}</td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[#222] font-black tracking-[0.4em] bg-black px-3 py-1 rounded-lg border border-[#111] text-[10px]">
                                                                    ••••••••••••
                                                                </span>
                                                                {env.is_shown_once && <span className="text-[8px] text-blue-500 font-black uppercase border border-blue-500/20 px-1 rounded">Shown</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            <button 
                                                                onClick={() => handleDeleteEnv(env.id)}
                                                                className="text-[#333] hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-red-500/5 group-hover:opacity-100 opacity-20"
                                                            >
                                                                <Trash2 className="w-4 h-4 font-bold" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="py-24 text-center flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-3xl bg-[#0a0a0a] border border-[#1f1f1f] flex items-center justify-center mb-6">
                                                <Database className="w-8 h-8 text-[#111]" />
                                            </div>
                                            <p className="text-[#222] text-xs font-black uppercase tracking-[0.4em]">No variables registered</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-4xl space-y-8 font-bold">
                            <section className="premium-card p-10 bg-[#050505] border border-[#1f1f1f] rounded-3xl shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/5 blur-[80px] rounded-full group-hover:bg-green-500/10 transition-colors pointer-events-none" />
                                <h3 className="text-xs font-black text-white mb-1 uppercase tracking-widest flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-[#444]" />
                                    Global Stack Configuration
                                </h3>
                                <p className="text-[10px] text-[#444] mb-10 font-black uppercase tracking-[0.2em]">Maintain stack metadata & metadata</p>
                                
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    settingsForm.post(`/portal/service/${service.uuid}`, { preserveScroll: true });
                                }} className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em] mb-3 block">Display Name</label>
                                            <input 
                                                type="text" 
                                                value={settingsForm.data.name}
                                                onChange={e => settingsForm.setData('name', e.target.value)}
                                                className="w-full bg-black border border-[#1f1f1f] rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all shadow-inner font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em] mb-3 block">Stack Purpose</label>
                                            <input 
                                                type="text" 
                                                value={settingsForm.data.description || ''}
                                                onChange={e => settingsForm.setData('description', e.target.value)}
                                                className="w-full bg-black border border-[#1f1f1f] rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all shadow-inner font-medium italic"
                                                placeholder="e.g. Production microservice mesh"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            type="submit"
                                            disabled={settingsForm.processing}
                                            className="bg-white text-black px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-2xl shadow-white/5 active:scale-95 disabled:opacity-30"
                                        >
                                            {settingsForm.processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Synchronize Settings'}
                                        </button>
                                    </div>
                                </form>
                            </section>

                            {service.extra_fields && Object.keys(service.extra_fields).length > 0 && (
                                <section className="premium-card p-10 bg-[#050505] border border-[#1f1f1f] rounded-3xl shadow-2xl">
                                    <h3 className="text-xs font-black text-white mb-1 uppercase tracking-widest flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-[#444]" />
                                        Template Parameters
                                    </h3>
                                    <p className="text-[10px] text-[#444] mb-10 font-black uppercase tracking-[0.2em]">Values provided by the service template</p>
                                    
                                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-2">
                                        {Object.entries(service.extra_fields).map(([key, field]) => (
                                            <CopyableField
                                                key={key}
                                                label={field.label || key}
                                                value={field.value}
                                                hideable={field.type === 'password' || key.toLowerCase().includes('password')}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section className="premium-card p-10 bg-red-500/[0.02] border border-red-500/10 rounded-3xl shadow-xl">
                                <h3 className="text-xs font-black text-red-500/80 mb-1 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" />
                                    Stack Retirement
                                </h3>
                                <p className="text-[10px] text-[#444] mb-10 font-black uppercase tracking-[0.2em]">Final & Destructive Infrastructure adjustments</p>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 p-10 bg-black/40 border border-red-500/20 rounded-3xl">
                                    <div>
                                        <h4 className="text-white text-base font-black uppercase tracking-tight">Decommission Entire Stack</h4>
                                        <p className="text-xs text-[#555] mt-2 max-w-md font-medium">This will halt all containers in the compose stack and permanently remove all associated network and volume configurations from the server.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowDeleteModal(true)}
                                        className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 shadow-2xl shadow-red-500/10 active:scale-95"
                                    >
                                        Delete Entire Service
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
                            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-xl bg-[#050505] border border-red-500/30 rounded-[40px] shadow-[0_0_150px_rgba(239,68,68,0.15)] overflow-hidden font-bold"
                        >
                            <div className="p-12">
                                <div className="flex items-center gap-6 mb-10">
                                    <div className="w-16 h-16 rounded-[24px] bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20 shadow-inner">
                                        <Trash2 className="w-8 h-8 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tighter">Confirm Deletion</h3>
                                        <p className="text-red-500/60 text-xs font-black uppercase tracking-widest mt-1">Irrevocable infrastructure destruction</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-12 bg-black/50 p-8 rounded-[32px] border border-red-500/10">
                                    {[
                                        { id: 'delete_volumes', label: 'Erase all persistent data/volumes' },
                                        { id: 'docker_cleanup', label: 'Force Docker network cleanup' },
                                        { id: 'delete_configurations', label: 'Purge local config metadata' }
                                    ].map(option => (
                                        <label key={option.id} className="flex items-center gap-5 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input 
                                                    type="checkbox"
                                                    checked={deleteOptions[option.id]}
                                                    onChange={() => setDeleteOptions(prev => ({ ...prev, [option.id]: !prev[option.id] }))}
                                                    className="w-6 h-6 appearance-none bg-black border-2 border-[#1f1f1f] rounded-xl checked:bg-red-500 checked:border-red-500 transition-all cursor-pointer shadow-inner"
                                                />
                                                {deleteOptions[option.id] && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <Box className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-sm font-black text-[#555] group-hover:text-white transition-colors uppercase tracking-tight">{option.label}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="mb-12">
                                    <label className="text-[10px] font-black text-[#666] uppercase tracking-[0.3em] mb-4 block">
                                        Type ID <span className="text-red-500 select-all font-mono font-black">{service.name}</span> to authenticate
                                    </label>
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder="Confirm stack name..."
                                        className="w-full bg-black border-2 border-[#1f1f1f] rounded-2xl py-4 px-8 text-lg text-white focus:outline-none focus:border-red-500/50 transition-all font-mono shadow-inner uppercase tracking-widest h-16"
                                    />
                                </div>

                                <div className="flex items-center gap-6">
                                    <button 
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 bg-transparent hover:bg-[#111] text-[#444] hover:text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all border border-transparent hover:border-[#1f1f1f] text-xs"
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        onClick={handleDelete}
                                        disabled={deleteConfirmation !== service.name || deleting}
                                        className="flex-[2] bg-red-600 text-white hover:bg-red-700 disabled:opacity-5 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-red-600/20 flex items-center justify-center gap-4 text-xs active:scale-95"
                                    >
                                        {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                                        Destroy Stack
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-bold">
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
                            className="relative w-full max-w-lg bg-[#050505] border border-[#1f1f1f] rounded-[40px] shadow-2xl overflow-hidden p-10 sm:p-12"
                        >
                            <div className="flex items-center gap-5 mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-inner">
                                    <Database className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Stack Variable</h3>
                                    <p className="text-[10px] text-blue-500/60 font-black uppercase tracking-[0.2em] mt-1">Shared compose configuration</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddEnv} className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em] mb-3 block">Variable Key</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={envForm.key}
                                        onChange={e => setEnvForm({ ...envForm, key: e.target.value.toUpperCase() })}
                                        className="w-full bg-black border border-[#1f1f1f] rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono uppercase tracking-widest shadow-inner h-14"
                                        placeholder="API_SECRET"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em] mb-3 block">Variable Value</label>
                                    <textarea 
                                        rows="4"
                                        value={envForm.value}
                                        onChange={e => setEnvForm({ ...envForm, value: e.target.value })}
                                        className="w-full bg-black border border-[#1f1f1f] rounded-2xl px-6 py-4 text-sm text-[#ddd] focus:outline-none focus:border-blue-500/50 transition-all font-mono shadow-inner leading-relaxed"
                                        placeholder="Secret payload..."
                                    />
                                </div>
                                
                                <div className="flex items-center gap-4 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setShowAddEnvModal(false)}
                                        className="flex-1 bg-transparent hover:bg-zinc-900 text-[#444] hover:text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-[#1f1f1f]"
                                    >
                                        Dismiss
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] bg-white text-black hover:bg-zinc-200 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-white/10 active:scale-95"
                                    >
                                        Inject Variable
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

export default ServiceShow;
