import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Database as DatabaseIcon, 
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
    Activity,
    Cpu,
    Info,
    ShieldAlert,
    Clock,
    Shield,
    Download,
    Globe,
    ExternalLink,
    RefreshCw,
    Lock,
    Zap
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
                        className={`flex-1 bg-transparent border-none py-2 px-3 text-sm focus:outline-none focus:ring-0 ${!value ? 'text-[#444] italic' : 'text-[#ddd] font-mono font-bold'}`}
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

const DatabaseShow = ({ project, environment, database, environmentVariables, backups = [], user, team }) => {
    const [activeTab, setActiveTab] = useState('connection');
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
            const response = await fetch(`/portal/database/${database.uuid}/logs?lines=200`);
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
        router.post(`/portal/resource/database/${database.uuid}/${actionName}`, {}, {
            preserveScroll: true,
            onFinish: () => setActioning(null)
        });
    };

    const handleDelete = () => {
        if (deleteConfirmation !== database.name) return;
        setDeleting(true);
        router.delete(`/portal/resource/database/${database.uuid}`, {
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
        router.post(`/portal/database/${database.uuid}/env`, envForm, {
            onSuccess: () => {
                setShowAddEnvModal(false);
                setEnvForm({ key: '', value: '' });
            }
        });
    };

    const handleDeleteEnv = (envId) => {
        if (confirm('Are you sure?')) {
            router.delete(`/portal/database/${database.uuid}/env/${envId}`, { preserveScroll: true });
        }
    };

    const settingsForm = useForm({
        name: database.name,
        description: database.description,
        is_public: database.is_public,
        public_port: database.public_port,
    });

    const handleUpdateSettings = (e) => {
        e.preventDefault();
        settingsForm.post(`/portal/database/${database.uuid}`, {
            preserveScroll: true,
        });
    };

    const isRunning = database.status?.toLowerCase().includes('running') || database.status?.toLowerCase().includes('healthy');

    const tabs = [
        { id: 'connection', label: 'Access', icon: Lock },
        { id: 'logs', label: 'Terminal', icon: TerminalIcon },
        { id: 'metrics', label: 'Performance', icon: Activity },
        { id: 'backups', label: 'Recovery', icon: Shield },
        { id: 'env', label: 'Config', icon: Info },
        { id: 'settings', label: 'Control', icon: Settings },
    ];

    return (
        <PortalLayout>
            <Head title={`${database.name} - Database Node`} />

            {/* Premium Header */}
            <div className="relative mb-10">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="flex items-center gap-2 text-[#555] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                    <Link href={`/portal/project/${project.uuid}`} className="hover:text-purple-400 transition-colors">{project.name}</Link>
                    <ChevronRight className="w-3 h-3 text-[#333]" />
                    <span className="text-[#888] font-bold">{environment.name}</span>
                    <ChevronRight className="w-3 h-3 text-[#333]" />
                    <span className="text-white font-bold">Database</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#111] to-black border border-[#1f1f1f] flex items-center justify-center relative group shadow-2xl">
                            <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-sm" />
                            <DatabaseIcon className="w-7 h-7 text-purple-500 relative z-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-extrabold tracking-tight text-white">{database.name}</h1>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${
                                    isRunning ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-zinc-500'} animate-pulse`} />
                                    {database.status || 'unknown'}
                                </div>
                            </div>
                            <p className="text-[#666] text-sm mt-1 font-medium italic">{database.description || `Managed ${database.type} component`}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-[#0a0a0a] p-1 rounded-xl border border-[#1f1f1f] shadow-lg">
                        <a 
                            href={database.native_url}
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
                                    onClick={() => handleAction('restart')}
                                    disabled={actioning !== null}
                                    className="px-4 py-2 bg-white text-black rounded-lg text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    {actioning === 'restart' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                    Bounce
                                </button>
                                <button 
                                    onClick={() => handleAction('stop')}
                                    disabled={actioning !== null}
                                    className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {actioning === 'stop' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                                    Halt
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => handleAction('start')}
                                disabled={actioning !== null}
                                className="px-8 py-2 bg-white text-black rounded-lg text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                {actioning === 'start' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                                Online Node
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
                        className={`px-5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 tracking-widest uppercase ${
                            activeTab === tab.id 
                                ? 'bg-[#161616] text-white shadow-inner border border-[#222]' 
                                : 'text-[#555] hover:text-[#888] hover:bg-[#0d0d0d]'
                        }`}
                    >
                        <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-purple-500' : 'text-zinc-600'}`} />
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
                    {activeTab === 'connection' && (
                        <div className="grid lg:grid-cols-2 gap-8 font-bold">
                            <section className="premium-card p-8 bg-[#050505] border border-[#1f1f1f] rounded-3xl shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Lock className="w-32 h-32" />
                                </div>
                                <h3 className="text-xs font-black text-white mb-8 flex items-center gap-2 uppercase tracking-[0.2em]">
                                    <Lock className="w-4 h-4 text-purple-500 font-bold" />
                                    Security Credentials
                                </h3>
                                <div className="space-y-2">
                                    <CopyableField label="Engine" value={database.type?.toUpperCase()} />
                                    <CopyableField label="Instance Name" value={database.db_name} />
                                    <CopyableField label="Auth Identity" value={database.user} />
                                    <CopyableField label="Access Secret" value={database.password} hideable={true} />
                                    {database.root_password && (
                                        <CopyableField label="Global Root Secret" value={database.root_password} hideable={true} />
                                    )}
                                </div>
                            </section>

                            <section className="premium-card p-8 bg-[#050505] border border-[#1f1f1f] rounded-3xl shadow-2xl relative overflow-hidden group font-bold">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Zap className="w-32 h-32" />
                                </div>
                                <h3 className="text-xs font-black text-white mb-8 flex items-center gap-2 uppercase tracking-[0.2em]">
                                    <Zap className="w-4 h-4 text-blue-500 font-bold" />
                                    Network Topology
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                            <span className="text-[10px] font-black text-[#444] uppercase tracking-widest">Internal Backend URI</span>
                                        </div>
                                        <CopyableField label="Cluster URL" value={database.internal_db_url} hideable={true} />
                                    </div>

                                    <div className="pt-6 border-t border-[#111]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`w-2 h-2 rounded-full ${database.is_public ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`}></div>
                                            <span className="text-[10px] font-black text-[#444] uppercase tracking-widest">External Access Gateway</span>
                                        </div>
                                        {database.is_public ? (
                                            <CopyableField label="Public Proxy URL" value={database.external_db_url} hideable={true} />
                                        ) : (
                                            <div className="bg-black border border-red-500/10 rounded-2xl p-5 text-xs text-[#555] flex items-center gap-3 italic font-medium">
                                                <EyeOff className="w-4 h-4 text-red-500/30" />
                                                Public exposure is currently hard-locked.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-5 font-bold">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-white bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                                        <TerminalIcon className="w-3.5 h-3.5 text-purple-500" />
                                        {database.type} stdout
                                    </div>
                                    {isPollingLogs && (
                                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Listening</span>
                                        </div>
                                    )}
                                </div>
                                <button onClick={fetchLogs} className="p-2 text-[#444] hover:text-white transition-colors">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-purple-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <div className="bg-[#050505] border border-[#1f1f1f] rounded-[32px] overflow-hidden shadow-2xl min-h-[550px] flex flex-col font-mono relative z-10">
                                    <div className="flex items-center justify-between px-8 py-3 bg-[#0d0d0d] border-b border-[#1f1f1f] text-[10px] font-black text-[#444] uppercase tracking-[0.3em]">
                                        <span>Node Runtime Output</span>
                                        <div className="flex items-center gap-4">
                                            <span>Buffer: <span className="text-white">Live-200</span></span>
                                            <TerminalIcon className="w-3.5 h-3.5 text-purple-500" />
                                        </div>
                                    </div>
                                    <div className="flex-1 p-8 overflow-y-auto max-h-[650px] scrollbar-thin scrollbar-thumb-zinc-800">
                                        <div className="space-y-1.5">
                                            {logs ? (
                                                logs.split('\n').map((line, i) => (
                                                    <div key={i} className="flex gap-6 group/line">
                                                        <span className="text-[#222] text-[10px] select-none w-10 text-right pt-1 font-black">{i + 1}</span>
                                                        <span className="text-[#bbb] text-sm break-all leading-loose whitespace-pre-wrap">{line}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-24 opacity-20">
                                                    <Loader2 className="w-10 h-10 animate-spin mb-6 text-purple-500" />
                                                    <p className="text-sm font-black uppercase tracking-[0.3em]">Querying Node Logs...</p>
                                                </div>
                                            )}
                                            <div ref={logEndRef} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'metrics' && (
                        <div className="space-y-8 font-bold">
                            <div className="grid lg:grid-cols-2 gap-8">
                                <div className="premium-card p-8 bg-[#050505] border border-[#1f1f1f] rounded-[32px] shadow-xl relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Processing Load</h4>
                                            <p className="text-[9px] text-[#444] uppercase tracking-widest mt-1">vCPU Utilization Cycle</p>
                                        </div>
                                        <div className="p-2.5 bg-pink-500/10 rounded-xl border border-pink-500/20">
                                            <Cpu className="w-5 h-5 text-pink-500" />
                                        </div>
                                    </div>
                                    <MetricsChart resourceUuid={database.uuid} resourceType="database" type="cpu" label="Core Power" />
                                </div>
                                <div className="premium-card p-8 bg-[#050505] border border-[#1f1f1f] rounded-[32px] shadow-xl relative overflow-hidden font-bold">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Memory Pressure</h4>
                                            <p className="text-[9px] text-[#444] uppercase tracking-widest mt-1">Assigned RAM Registry</p>
                                        </div>
                                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 font-bold">
                                            <DatabaseIcon className="w-5 h-5 text-blue-500" />
                                        </div>
                                    </div>
                                    <MetricsChart resourceUuid={database.uuid} resourceType="database" type="memory" label="Occupied RAM (MB)" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'backups' && (
                        <div className="space-y-8 font-bold">
                            <section className="bg-[#050505] border border-[#1f1f1f] rounded-[32px] overflow-hidden shadow-2xl">
                                <div className="px-10 py-6 bg-[#0d0d0d] border-b border-[#1f1f1f] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-6 h-6 text-green-500 font-bold" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Disaster Recovery Plan</h3>
                                    </div>
                                    <span className="text-[10px] text-green-500 font-black uppercase tracking-widest bg-green-500/5 px-4 py-1 rounded-full border border-green-500/10">Active Protection</span>
                                </div>
                                
                                <div className="p-10 font-bold">
                                    {backups.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="text-[10px] text-[#333] uppercase tracking-[0.3em] font-black border-b border-[#111]">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left">Schedule</th>
                                                        <th className="px-6 py-4 text-left">Latest Point</th>
                                                        <th className="px-6 py-4 text-left">Strategy</th>
                                                        <th className="px-6 py-4 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#111]">
                                                    {backups.map(backup => (
                                                        <tr key={backup.id} className="hover:bg-white/[0.01] transition-colors group">
                                                            <td className="px-6 py-6 font-black text-white uppercase tracking-tighter text-base">{backup.frequency}</td>
                                                            <td className="px-6 py-6 font-mono text-xs text-[#555] group-hover:text-[#aaa] transition-colors">
                                                                {backup.last_successful_at || 'Vault empty'}
                                                            </td>
                                                            <td className="px-6 py-6">
                                                                <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full border transition-all ${
                                                                    backup.is_enabled 
                                                                        ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' 
                                                                        : 'text-zinc-600 border-zinc-800 bg-zinc-900'
                                                                }`}>
                                                                    {backup.is_enabled ? 'In Pipeline' : 'Hibernating'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-6 text-right">
                                                                <button className="p-3 bg-black border border-[#1f1f1f] rounded-2xl text-[#333] hover:text-white hover:border-[#444] transition-all">
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="py-20 flex flex-col items-center justify-center italic opacity-30">
                                            <ShieldAlert className="w-12 h-12 mb-6" />
                                            <p className="text-sm font-black uppercase tracking-[0.3em]">No redundancy layers established</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'env' && (
                        <div className="space-y-6">
                            <section className="bg-[#050505] border border-[#1f1f1f] rounded-[32px] overflow-hidden shadow-2xl font-bold">
                                <div className="p-10 border-b border-[#111] flex items-center justify-between bg-[#0d0d0d]">
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Environment Registry</h3>
                                        <p className="text-[10px] text-[#444] mt-1 font-black uppercase tracking-[0.2em]">Encrypted node-level variables</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowAddEnvModal(true)}
                                        className="bg-white text-black px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-white/5 active:scale-95 shadow-xl"
                                    >
                                        Add Key-Value
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    {environmentVariables.length > 0 ? (
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-[10px] text-[#333] uppercase bg-[#0a0a0a] border-b border-[#1f1f1f] font-black tracking-widest">
                                                <tr>
                                                    <th className="px-10 py-5">Registry Key</th>
                                                    <th className="px-10 py-5">Vault Hash</th>
                                                    <th className="px-10 py-5 text-right">Control</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#111]">
                                                {environmentVariables.map((env) => (
                                                    <tr key={env.id} className="hover:bg-[#0a0a0a] transition-colors group">
                                                        <td className="px-10 py-6 font-mono text-xs text-white uppercase tracking-widest">{env.key}</td>
                                                        <td className="px-10 py-6 font-mono">
                                                            <span className="text-[#1a1a1a] font-black tracking-[0.6em] bg-black px-4 py-1.5 rounded-xl border border-[#111] text-[10px]">
                                                                ••••••••••••••
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-6 text-right">
                                                            <button 
                                                                onClick={() => handleDeleteEnv(env.id)}
                                                                className="text-[#222] hover:text-red-500 transition-colors p-3 rounded-2xl hover:bg-red-500/5 group-hover:opacity-100 opacity-20"
                                                            >
                                                                <Trash2 className="w-4 h-4 font-bold" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="py-24 text-center flex flex-col items-center italic">
                                            <div className="w-20 h-20 rounded-[32px] bg-[#0a0a0a] border border-[#1f1f1f] flex items-center justify-center mb-8 shadow-inner">
                                                <Info className="w-10 h-10 text-[#0d0d0d]" />
                                            </div>
                                            <p className="text-[#1a1a1a] text-sm font-black uppercase tracking-[0.4em]">Empty Registry</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-4xl space-y-10 font-bold">
                            <section className="premium-card p-10 bg-[#050505] border border-[#1f1f1f] rounded-[40px] shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-500/5 blur-[100px] rounded-full group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
                                <h3 className="text-xs font-black text-white mb-1 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-[#444]" />
                                    Node Sovereignty
                                </h3>
                                <p className="text-[10px] text-[#444] mb-12 font-black uppercase tracking-[0.2em]">Administrative metadata & network posture</p>
                                
                                <form onSubmit={handleUpdateSettings} className="space-y-10">
                                    <div className="grid md:grid-cols-2 gap-10">
                                        <div>
                                            <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em] mb-4 block">Alias Identification</label>
                                            <input 
                                                type="text" 
                                                value={settingsForm.data.name}
                                                onChange={e => settingsForm.setData('name', e.target.value)}
                                                className="w-full bg-black border border-[#1f1f1f] rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all shadow-inner font-black tracking-tight"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em] mb-4 block">Context Tag</label>
                                            <input 
                                                type="text" 
                                                value={settingsForm.data.description || ''}
                                                onChange={e => settingsForm.setData('description', e.target.value)}
                                                className="w-full bg-black border border-[#1f1f1f] rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all shadow-inner italic font-medium"
                                                placeholder="e.g. Primary persistence layer"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-[#111]">
                                        <div className="flex flex-col gap-6">
                                            <div 
                                                className="flex items-center justify-between p-8 bg-black border border-[#1f1f1f] rounded-3xl hover:border-blue-500/30 hover:bg-blue-500/[0.02] transition-all cursor-pointer group shadow-inner" 
                                                onClick={() => settingsForm.setData('is_public', !settingsForm.data.is_public)}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-14 h-14 rounded-2xl border border-[#1f1f1f] flex items-center justify-center transition-all ${settingsForm.data.is_public ? 'text-green-500 bg-green-500/10' : 'text-[#222] bg-[#0a0a0a]'}`}>
                                                        {settingsForm.data.is_public ? <Globe className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white uppercase tracking-tight">Public Gateway Exposure</p>
                                                        <p className="text-[10px] text-[#555] font-black uppercase tracking-widest mt-1">Bind component to public-facing IO ports</p>
                                                    </div>
                                                </div>
                                                <div className={`w-12 h-6 rounded-full relative transition-all shadow-inner ${settingsForm.data.is_public ? 'bg-green-600' : 'bg-[#1a1a1a]'}`}>
                                                    <div className={`absolute top-1 bottom-1 w-4 h-4 bg-white rounded-full transition-all shadow-xl ${settingsForm.data.is_public ? 'left-7' : 'left-1'}`} />
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {settingsForm.data.is_public && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="pl-8 border-l-4 border-blue-500/10 overflow-hidden"
                                                    >
                                                        <label className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] block mb-3 pl-1">Exposed Port Key</label>
                                                        <input 
                                                            type="number" 
                                                            value={settingsForm.data.public_port || ''}
                                                            onChange={e => settingsForm.setData('public_port', e.target.value)}
                                                            className="w-40 bg-black border-2 border-blue-500/10 rounded-2xl px-6 py-4 text-lg text-white font-mono focus:outline-none focus:border-blue-500/50 shadow-2xl shadow-blue-500/10"
                                                            placeholder="5432"
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            type="submit"
                                            disabled={settingsForm.processing}
                                            className="bg-white text-black px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-2xl shadow-white/5 active:scale-95 disabled:opacity-30"
                                        >
                                            {settingsForm.processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply State Sync'}
                                        </button>
                                    </div>
                                </form>
                            </section>

                            <section className="premium-card p-10 bg-red-500/[0.02] border border-red-500/10 rounded-[40px] shadow-xl font-bold">
                                <h3 className="text-xs font-black text-red-500/80 mb-1 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" />
                                    Terminal Decommission
                                </h3>
                                <p className="text-[10px] text-[#444] mb-12 font-black uppercase tracking-[0.2em]">Absolute removal of persistence layer</p>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10 p-10 bg-black/40 border border-red-500/20 rounded-[32px]">
                                    <div>
                                        <h4 className="text-white text-base font-black uppercase tracking-tight">Expunge Persistence Node</h4>
                                        <p className="text-xs text-[#555] mt-3 max-w-sm font-medium leading-relaxed italic">This protocol will permanently overwrite and destroy all relational data structures and configuration hooks. Restoration is impossible.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowDeleteModal(true)}
                                        className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 shadow-2xl shadow-red-500/10 active:scale-95"
                                    >
                                        Purge Database Node
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
                                        <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tighter">Decommission?</h3>
                                        <p className="text-red-500/60 text-xs font-black uppercase tracking-widest mt-1">Terminal infrastructure purge</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-12 bg-black/50 p-8 rounded-[32px] border border-red-500/10">
                                    {[
                                        { id: 'delete_volumes', label: 'Purge persistence storage clusters' },
                                        { id: 'docker_cleanup', label: 'Force container lifecycle termination' },
                                        { id: 'delete_configurations', label: 'Overlay removal of node hooks' }
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
                                                        <DatabaseIcon className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-sm font-black text-[#555] group-hover:text-white transition-colors uppercase tracking-widest">{option.label}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="mb-12">
                                    <label className="text-[10px] font-black text-[#666] uppercase tracking-[0.3em] mb-4 block">
                                        Authenticating Alias <span className="text-red-500 select-all font-mono font-black">{database.name}</span>
                                    </label>
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder="Confirm alias..."
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
                                        disabled={deleteConfirmation !== database.name || deleting}
                                        className="flex-[2] bg-red-600 text-white hover:bg-red-700 disabled:opacity-5 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-red-600/20 flex items-center justify-center gap-4 text-xs active:scale-95"
                                    >
                                        {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                                        Final Purge
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
                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shadow-inner">
                                    <DatabaseIcon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Hook Variable</h3>
                                    <p className="text-[10px] text-purple-500/60 font-black uppercase tracking-[0.2em] mt-1">Runtime node configuration</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddEnv} className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em] mb-4 block">Key Hook</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={envForm.key}
                                        onChange={e => setEnvForm({ ...envForm, key: e.target.value.toUpperCase() })}
                                        className="w-full bg-black border border-[#1f1f1f] rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono uppercase tracking-widest shadow-inner h-14"
                                        placeholder="DB_EXT_KEY"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em] mb-4 block">Registry Value</label>
                                    <textarea 
                                        rows="4"
                                        value={envForm.value}
                                        onChange={e => setEnvForm({ ...envForm, value: e.target.value })}
                                        className="w-full bg-black border border-[#1f1f1f] rounded-2xl px-6 py-4 text-sm text-[#ddd] focus:outline-none focus:border-purple-500/50 transition-all font-mono shadow-inner leading-relaxed"
                                        placeholder="Secure payload..."
                                    />
                                </div>
                                
                                <div className="flex items-center gap-4 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setShowAddEnvModal(false)}
                                        className="flex-1 bg-transparent hover:bg-zinc-900 text-[#444] hover:text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-[#1f1f1f]"
                                    >
                                        Rollback
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] bg-white text-black hover:bg-zinc-200 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-white/10 active:scale-95"
                                    >
                                        Inject State
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

export default DatabaseShow;
