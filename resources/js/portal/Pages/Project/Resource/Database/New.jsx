import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Database, 
    Server, 
    Network, 
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Shield,
    HardDrive,
    Database as DbIcon
} from 'lucide-react';
import PortalLayout from '../../../../Layouts/PortalLayout';

const NewDatabase = ({ project, environment, servers }) => {
    const [step, setStep] = useState(1);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: '',
        destination_uuid: '',
        image: '',
    });

    const dbTypes = [
        { id: 'postgresql', name: 'PostgreSQL', description: 'Advanced open-source relational database.', icon: DbIcon, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        { id: 'redis', name: 'Redis', description: 'In-memory data structure store.', icon: DbIcon, color: 'text-red-500', bgColor: 'bg-red-500/10' },
        { id: 'mongodb', name: 'MongoDB', description: 'NoSQL document-oriented database.', icon: DbIcon, color: 'text-green-500', bgColor: 'bg-green-500/10' },
        { id: 'mysql', name: 'MySQL', description: 'World\'s most popular open-source database.', icon: DbIcon, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
        { id: 'mariadb', name: 'MariaDB', description: 'Enhanced, drop-in replacement for MySQL.', icon: DbIcon, color: 'text-blue-600', bgColor: 'bg-blue-600/10' },
        { id: 'keydb', name: 'KeyDB', description: 'High performance multithreaded Redis fork.', icon: DbIcon, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
        { id: 'dragonfly', name: 'Dragonfly', description: 'Modern multithreaded Redis replacement.', icon: DbIcon, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
        { id: 'clickhouse', name: 'ClickHouse', description: 'Column-oriented DBMS for OLAP.', icon: DbIcon, color: 'text-yellow-600', bgColor: 'bg-yellow-600/10' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('portal.project.resource.database.store', {
            project_uuid: project.uuid,
            environment_uuid: environment.uuid
        }));
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    useEffect(() => {
        if (servers.length === 1 && servers[0].destinations.length === 1) {
            setData('destination_uuid', servers[0].destinations[0].uuid);
        }
    }, [servers]);

    return (
        <>
            <Head title="Provision New Database" />

            <div className="max-w-3xl mx-auto py-10">
                <Link 
                    href={route('portal.project.resource.new', { project_uuid: project.uuid, environment_uuid: environment.uuid })}
                    className="flex items-center text-sm text-[#666] hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Selection
                </Link>

                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Provision Database</h1>
                    <p className="text-[#888]">Setup a managed database instance in {environment.name}.</p>
                </div>

                <div className="flex gap-2 mb-12">
                    {[1, 2].map((s) => (
                        <div 
                            key={s} 
                            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= s ? 'bg-purple-500' : 'bg-[#1a1a1a]'}`}
                        />
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-xl font-semibold text-white mb-6">Select Engine</h2>
                                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                                    {dbTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => {
                                                setData('type', type.id);
                                                nextStep();
                                            }}
                                            className={`flex items-start p-5 rounded-2xl border transition-all duration-300 text-left group ${
                                                data.type === type.id 
                                                ? 'bg-purple-500/5 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.1)]' 
                                                : 'bg-black border-[#1a1a1a] hover:border-[#333]'
                                            }`}
                                        >
                                            <div className={`p-3 rounded-xl border border-[#1a1a1a] mr-4 transition-colors ${data.type === type.id ? 'bg-purple-500 text-white' : 'bg-[#0a0a0a] text-[#444] group-hover:bg-[#111]'}`}>
                                                <type.icon className={`w-5 h-5 ${data.type === type.id ? 'text-white' : type.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-white font-medium text-sm">{type.name}</div>
                                                <div className="text-[11px] text-[#555] mt-1 leading-relaxed">{type.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <h2 className="text-xl font-semibold text-white">Database Configuration</h2>

                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-[#888]">Database Name</label>
                                        <input 
                                            type="text"
                                            placeholder="my-db"
                                            className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                        />
                                        <p className="text-[10px] text-[#444]">Optional. Coolify will generate a name if left blank.</p>
                                    </div>

                                    {data.type === 'postgresql' && (
                                        <div className="space-y-4">
                                            <label className="block text-sm font-medium text-[#888]">Docker Image</label>
                                            <input 
                                                type="text"
                                                placeholder="postgres:16-alpine"
                                                className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all text-sm"
                                                value={data.image}
                                                onChange={e => setData('image', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-[#888]">Target Server</label>
                                        <div className="space-y-3">
                                            {servers.map(server => (
                                                <div key={server.id} className="space-y-2">
                                                    <div className="flex items-center text-[10px] font-bold text-[#444] px-2 uppercase tracking-widest">
                                                        <Server className="w-3 h-3 mr-2" />
                                                        {server.name}
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {server.destinations.map(dest => (
                                                            <button
                                                                key={dest.uuid}
                                                                type="button"
                                                                onClick={() => setData('destination_uuid', dest.uuid)}
                                                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                                                    data.destination_uuid === dest.uuid 
                                                                    ? 'bg-purple-500/5 border-purple-500/50' 
                                                                    : 'bg-black border-[#1a1a1a] hover:border-[#222]'
                                                                }`}
                                                            >
                                                                <div className="flex items-center">
                                                                    <div className={`p-2 rounded-lg mr-3 ${data.destination_uuid === dest.uuid ? 'bg-purple-500 text-white' : 'bg-[#0a0a0a] text-[#444]'}`}>
                                                                        <Network className="w-4 h-4" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-medium text-white">{dest.name}</div>
                                                                        <div className="text-[10px] text-[#555]">{dest.network}</div>
                                                                    </div>
                                                                </div>
                                                                {data.destination_uuid === dest.uuid && (
                                                                    <CheckCircle2 className="w-5 h-5 text-purple-500" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.destination_uuid && <p className="text-xs text-red-500">{errors.destination_uuid}</p>}
                                    </div>

                                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex gap-4">
                                        <Shield className="w-5 h-5 text-purple-500 shrink-0" />
                                        <div>
                                            <div className="text-sm font-medium text-white">Security & Backups</div>
                                            <p className="text-xs text-[#666] mt-1 leading-relaxed">
                                                Managed databases are isolated and come with automated daily backups by default. High Availability can be enabled after deployment.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        type="button" 
                                        onClick={prevStep}
                                        className="flex-1 bg-[#0a0a0a] text-white py-4 rounded-xl font-medium border border-[#1a1a1a] hover:bg-[#111] transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={processing || !data.destination_uuid}
                                        className="flex-[2] bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(168,85,247,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <DbIcon className="w-5 h-5 fill-white" />
                                                Provision {data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : 'Database'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </div>
        </>
    );
};

NewDatabase.layout = page => <PortalLayout children={page} />;

export default NewDatabase;
