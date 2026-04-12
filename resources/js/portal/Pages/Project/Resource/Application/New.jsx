import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    Github, 
    Globe, 
    Box, 
    Server, 
    Network, 
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Info
} from 'lucide-react';
import PortalLayout from '../../../../Layouts/PortalLayout';

const NewApplication = ({ project, environment, servers, githubApps }) => {
    const [step, setStep] = useState(1);
    const [sourceType, setSourceType] = useState('public'); // 'github', 'public', 'docker'

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        git_repository: '',
        git_branch: 'main',
        build_pack: 'nixpacks',
        destination_uuid: '',
        port: 3000,
        source_id: '',
    });

    const sources = [
        { id: 'public', name: 'Public Repository', icon: Globe, description: 'Deploy any public Git repository.' },
        { id: 'github', name: 'GitHub App', icon: Github, description: 'Deploy private or public repos from GitHub.' },
        { id: 'docker', name: 'Docker Image', icon: Box, description: 'Deploy a pre-built image from any registry.' },
    ];

    const buildPacks = [
        { id: 'nixpacks', name: 'Nixpacks', description: 'Auto-detects language and builds.' },
        { id: 'dockerfile', name: 'Dockerfile', description: 'Uses your own Dockerfile.' },
        { id: 'dockercompose', name: 'Docker Compose', description: 'Multi-container deployments.' },
        { id: 'static', name: 'Static Store', description: 'Pure HTML/JS static site.' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('portal.project.resource.application.store', {
            project_uuid: project.uuid,
            environment_uuid: environment.uuid
        }));
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    // Auto-prefill destination if only one is available
    useEffect(() => {
        if (servers.length === 1 && servers[0].destinations.length === 1) {
            setData('destination_uuid', servers[0].destinations[0].uuid);
        }
    }, [servers]);

    return (
        <>
            <Head title="Deploy New Application" />

            <div className="max-w-3xl mx-auto py-10">
                <Link 
                    href={route('portal.project.resource.new', { project_uuid: project.uuid, environment_uuid: environment.uuid })}
                    className="flex items-center text-sm text-[#666] hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Selection
                </Link>

                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Deploy Application</h1>
                    <p className="text-[#888]">Follow the steps to deploy your code to {environment.name}.</p>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-12">
                    {[1, 2, 3].map((s) => (
                        <div 
                            key={s} 
                            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= s ? 'bg-blue-500' : 'bg-[#1a1a1a]'}`}
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
                                <h2 className="text-xl font-semibold text-white mb-6">Select Source</h2>
                                <div className="grid gap-4">
                                    {sources.map((source) => (
                                        <button
                                            key={source.id}
                                            type="button"
                                            onClick={() => {
                                                setSourceType(source.id);
                                                nextStep();
                                            }}
                                            className={`flex items-center p-5 rounded-2xl border transition-all duration-300 text-left group ${
                                                sourceType === source.id 
                                                ? 'bg-blue-500/5 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                                                : 'bg-black border-[#1a1a1a] hover:border-[#333]'
                                            }`}
                                        >
                                            <div className={`p-3 rounded-xl border border-[#1a1a1a] mr-4 transition-colors ${sourceType === source.id ? 'bg-blue-500 text-white' : 'bg-[#0a0a0a] text-[#666] group-hover:text-white'}`}>
                                                <source.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-white font-medium">{source.name}</div>
                                                <div className="text-sm text-[#666]">{source.description}</div>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 transition-transform ${sourceType === source.id ? 'text-blue-500 translate-x-1' : 'text-[#333]'}`} />
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
                                    <h2 className="text-xl font-semibold text-white">Repository Details</h2>

                                    {sourceType === 'github' && (
                                        <div className="space-y-4">
                                            <label className="block text-sm font-medium text-[#888]">GitHub Application</label>
                                            <select 
                                                className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all appearance-none"
                                                value={data.source_id}
                                                onChange={e => setData('source_id', e.target.value)}
                                            >
                                                <option value="">Select a GitHub App</option>
                                                {githubApps.map(app => (
                                                    <option key={app.id} value={app.id}>{app.name}</option>
                                                ))}
                                            </select>
                                            {githubApps.length === 0 && (
                                                <p className="text-xs text-yellow-500 flex items-center gap-2">
                                                    <Info className="w-3 h-3" />
                                                    No GitHub Apps connected. Use public repository or connect one in settings.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-[#888]">Repository URL</label>
                                        <input 
                                            type="text"
                                            placeholder="https://github.com/coollabsio/coolify-examples"
                                            className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                                            value={data.git_repository}
                                            onChange={e => setData('git_repository', e.target.value)}
                                        />
                                        {errors.git_repository && <p className="text-xs text-red-500">{errors.git_repository}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <label className="block text-sm font-medium text-[#888]">Branch</label>
                                            <input 
                                                type="text"
                                                className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all text-sm"
                                                value={data.git_branch}
                                                onChange={e => setData('git_branch', e.target.value)}
                                            />
                                            {errors.git_branch && <p className="text-xs text-red-500">{errors.git_branch}</p>}
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-sm font-medium text-[#888]">Exposed Port</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all text-sm"
                                                value={data.port}
                                                onChange={e => setData('port', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-[#888]">Build Pack</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {buildPacks.map(bp => (
                                                <button
                                                    key={bp.id}
                                                    type="button"
                                                    onClick={() => setData('build_pack', bp.id)}
                                                    className={`p-4 rounded-xl border text-left transition-all ${
                                                        data.build_pack === bp.id 
                                                        ? 'bg-blue-500/5 border-blue-500/50' 
                                                        : 'bg-black border-[#1a1a1a] hover:border-[#333]'
                                                    }`}
                                                >
                                                    <div className={`text-sm font-medium ${data.build_pack === bp.id ? 'text-blue-500' : 'text-white'}`}>{bp.name}</div>
                                                    <div className="text-[10px] text-[#555] mt-1">{bp.description}</div>
                                                </button>
                                            ))}
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
                                        type="button" 
                                        onClick={nextStep}
                                        disabled={!data.git_repository}
                                        className="flex-1 bg-white text-black py-4 rounded-xl font-medium hover:bg-[#eaeaea] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next Component
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <h2 className="text-xl font-semibold text-white">Deployment Target</h2>

                                    <div className="space-y-4 text-white">
                                        <label className="block text-sm font-medium text-[#888]">Application Name</label>
                                        <input 
                                            type="text"
                                            placeholder="my-cool-app"
                                            className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                        />
                                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-[#888]">Server & Network</label>
                                        <div className="space-y-3">
                                            {servers.map(server => (
                                                <div key={server.id} className="space-y-2">
                                                    <div className="flex items-center text-xs font-semibold text-[#555] px-2 uppercase tracking-wider">
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
                                                                    ? 'bg-green-500/5 border-green-500/50 ring-1 ring-green-500/20' 
                                                                    : 'bg-black border-[#1a1a1a] hover:border-[#333]'
                                                                }`}
                                                            >
                                                                <div className="flex items-center">
                                                                    <div className={`p-2 rounded-lg mr-3 ${data.destination_uuid === dest.uuid ? 'bg-green-500 text-white' : 'bg-[#0a0a0a] text-[#444]'}`}>
                                                                        <Network className="w-4 h-4" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-medium text-white">{dest.name}</div>
                                                                        <div className="text-[10px] text-[#555]">{dest.network}</div>
                                                                    </div>
                                                                </div>
                                                                {data.destination_uuid === dest.uuid && (
                                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.destination_uuid && <p className="text-xs text-red-500">{errors.destination_uuid}</p>}
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
                                        disabled={processing || !data.destination_uuid || !data.name}
                                        className="flex-[2] bg-blue-500 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(59,130,246,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Zap className="w-5 h-5 fill-white" />
                                                Deploy Application
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

NewApplication.layout = page => <PortalLayout children={page} />;

export default NewApplication;
