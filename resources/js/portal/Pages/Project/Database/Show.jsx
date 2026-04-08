import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Database, 
    Copy, 
    Eye, 
    EyeOff, 
    Terminal, 
    Settings, 
    Trash2, 
    Play, 
    Square, 
    RotateCcw,
    ChevronRight,
    Loader2
} from 'lucide-react';
import PortalLayout from '../../../Layouts/PortalLayout';

const CopyableField = ({ label, value, type = 'text', hideable = false }) => {
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
            <label className="text-xs font-medium text-[#666] uppercase tracking-wider">{label}</label>
            <div className="flex w-full overflow-hidden bg-black border border-[#1f1f1f] rounded-lg focus-within:border-[#444] transition-colors relative group">
                <input
                    readOnly
                    type={hidden ? 'password' : type}
                    value={value || 'Not configured'}
                    className={`flex-1 bg-transparent border-none py-2 px-3 text-sm focus:outline-none focus:ring-0 ${!value ? 'text-[#444] italic' : 'text-[#ddd]'}`}
                />
                
                {value && (
                    <div className="flex items-center absolute right-1 top-1 bottom-1">
                        {hideable && (
                            <button 
                                onClick={() => setHidden(!hidden)}
                                className="p-1.5 text-[#555] hover:text-white transition-colors rounded-md hover:bg-[#111]"
                            >
                                {hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                        )}
                        <button 
                            onClick={handleCopy}
                            className="p-1.5 text-[#555] hover:text-white transition-colors rounded-md hover:bg-[#111]"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {copied && (
                    <div className="absolute inset-y-0 right-0 right-10 flex items-center pr-2">
                        <span className="text-[10px] text-green-500 font-medium bg-[#111] px-1.5 py-0.5 rounded">Copied!</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const DatabaseShow = ({ project, environment, database, environmentVariables, user, team }) => {
    const [activeTab, setActiveTab] = useState('connection');
    const [actioning, setActioning] = useState(null);

    const handleAction = (actionName) => {
        setActioning(actionName);
        router.post(`/portal/resource/database/${database.uuid}/${actionName}`, {}, {
            preserveScroll: true,
            onError: (err) => console.error(err),
            onFinish: () => setActioning(null)
        });
    };

    return (
        <>
            <Head title={`${database.name} - Database`} />

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-[#666] text-xs font-medium uppercase tracking-wider mb-3">
                    <Link href={`/portal/project/${project.uuid}`} className="hover:text-white transition-colors">{project.name}</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#888]">{environment.name}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-white">Database</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-center shrink-0">
                            <Database className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                                {database.name}
                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border border-[#1f1f1f] flex items-center gap-1.5 ${database.status === 'running' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-[#666] bg-[#111]'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${database.status === 'running' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-[#444]'}`}></span>
                                    {database.status}
                                </span>
                            </h1>
                            <p className="text-[#888] text-sm mt-1">{database.description || `Managed ${database.type} component`}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {database.status === 'running' ? (
                            <>
                                <button 
                                    onClick={() => handleAction('restart')} 
                                    disabled={actioning !== null}
                                    className="bg-[#0a0a0a] border border-[#1f1f1f] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:border-[#444] transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {actioning === 'restart' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                    Restart
                                </button>
                                <button 
                                    onClick={() => handleAction('stop')} 
                                    disabled={actioning !== null}
                                    className="bg-[#0a0a0a] border border-[#1f1f1f] text-[#888] px-3 py-1.5 rounded-md text-sm font-medium hover:border-[#444] hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {actioning === 'stop' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                                    Stop
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => handleAction('start')} 
                                disabled={actioning !== null}
                                className="bg-white text-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[#eaeaea] transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {actioning === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                Start
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-6 border-b border-[#111] mb-8">
                {[
                    { id: 'connection', label: 'Connection' },
                    { id: 'env', label: 'Environment Variables' },
                    { id: 'settings', label: 'Settings' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === tab.id 
                                ? 'text-white border-white' 
                                : 'text-[#666] border-transparent hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'connection' && (
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">Connection Details</h3>
                                    <p className="text-sm text-[#888] mb-4">Credentials and URLs to connect to your database instance.</p>
                                    
                                    <div className="bg-[#050505] border border-[#1f1f1f] rounded-xl p-5">
                                        <CopyableField label="Database Type" value={database.type.toUpperCase()} />
                                        <CopyableField label="Database Name" value={database.db_name} />
                                        <CopyableField label="Username" value={database.user} />
                                        <CopyableField label="Password" value={database.password} hideable={true} />
                                        {database.root_password && (
                                            <CopyableField label="Root Password" value={database.root_password} hideable={true} />
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">Connection URLs</h3>
                                    <p className="text-sm text-[#888] mb-4">Use these URIs directly in your application.</p>
                                    
                                    <div className="bg-[#050505] border border-[#1f1f1f] rounded-xl p-5 space-y-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="text-sm font-medium text-[#ddd]">Internal Connection</span>
                                            </div>
                                            <p className="text-xs text-[#666] mb-3">Available only to other resources within the same Coolify instance network.</p>
                                            <CopyableField label="Internal URL" value={database.internal_db_url} hideable={true} />
                                        </div>

                                        <div className="pt-4 border-t border-[#111]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-2 h-2 rounded-full ${database.is_public ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
                                                <span className="text-sm font-medium text-[#ddd]">Public Connection</span>
                                            </div>
                                            <p className="text-xs text-[#666] mb-3">
                                                {database.is_public 
                                                    ? 'Available from anywhere on the internet. Keep your credentials secure.' 
                                                    : 'Public access is currently disabled for this database.'}
                                            </p>
                                            {database.is_public && (
                                                <CopyableField label="External URL" value={database.external_db_url} hideable={true} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'env' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Environment Variables</h3>
                                    <p className="text-sm text-[#888]">Variables injected into the database container.</p>
                                </div>
                                <button className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-[#eaeaea] transition-colors">
                                    Add Variable
                                </button>
                            </div>
                            
                            <div className="bg-[#050505] border border-[#1f1f1f] rounded-xl overflow-hidden">
                                {environmentVariables.length > 0 ? (
                                    <table className="w-full text-left text-sm text-[#888]">
                                        <thead className="text-xs text-[#555] uppercase bg-[#0a0a0a] border-b border-[#1f1f1f]">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Key</th>
                                                <th className="px-4 py-3 font-medium">Value</th>
                                                <th className="px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {environmentVariables.map((env, index) => (
                                                <tr key={env.id} className="border-b border-[#111] last:border-0 hover:bg-[#0a0a0a] transition-colors">
                                                    <td className="px-4 py-3 font-mono text-[#ddd]">{env.key}</td>
                                                    <td className="px-4 py-3 font-mono">
                                                        <span className="bg-[#111] px-2 py-1 rounded text-[#888]">
                                                            {env.value ? '••••••••' : 'Empty'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button className="text-[#555] hover:text-white transition-colors p-1">
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-12 text-center">
                                        <Terminal className="w-8 h-8 text-[#333] mx-auto mb-3" />
                                        <p className="text-[#666] text-sm">No environment variables found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-2xl">
                            <h3 className="text-lg font-semibold text-white mb-1">Danger Zone</h3>
                            <p className="text-sm text-[#888] mb-6">Irreversible and destructive actions.</p>
                            
                            <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-red-500 font-medium">Delete Database</h4>
                                        <p className="text-sm text-[#888] mt-1">Permanently remove this database and all its data. This action cannot be undone.</p>
                                    </div>
                                    <button className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-md text-sm font-medium transition-colors shrink-0">
                                        Delete component
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </>
    );
};

DatabaseShow.layout = page => <PortalLayout children={page} />;

export default DatabaseShow;
