import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layers, 
    Server, 
    Network, 
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Search,
    Rocket,
    ExternalLink
} from 'lucide-react';
import PortalLayout from '../../../../Layouts/PortalLayout';

const NewService = ({ project, environment, servers, services }) => {
    const [step, setStep] = useState(1);
    const [search, setSearch] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        service_type: '',
        destination_uuid: '',
    });

    const serviceList = Object.entries(services).map(([id, info]) => ({
        id,
        ...info
    })).filter(s => 
        s.id.toLowerCase().includes(search.toLowerCase()) || 
        (s.name && s.name.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('portal.project.resource.service.store', {
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
            <Head title="Deploy New Service" />

            <div className="max-w-4xl mx-auto py-10">
                <Link 
                    href={route('portal.project.resource.new', { project_uuid: project.uuid, environment_uuid: environment.uuid })}
                    className="flex items-center text-sm text-[#666] hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Selection
                </Link>

                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Deploy Service</h1>
                    <p className="text-[#888]">One-click deployments for popular open-source software.</p>
                </div>

                <div className="flex gap-2 mb-12 max-w-3xl mx-auto">
                    {[1, 2].map((s) => (
                        <div 
                            key={s} 
                            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= s ? 'bg-green-500' : 'bg-[#1a1a1a]'}`}
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
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <h2 className="text-xl font-semibold text-white">Select Template</h2>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                                        <input 
                                            type="text"
                                            placeholder="Search templates..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-green-500/50 outline-none w-full md:w-64"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                                    {serviceList.map((service) => (
                                        <button
                                            key={service.id}
                                            type="button"
                                            onClick={() => {
                                                setData('service_type', service.id);
                                                nextStep();
                                            }}
                                            className={`flex flex-col p-5 rounded-2xl border transition-all duration-300 text-left group h-full ${
                                                data.service_type === service.id 
                                                ? 'bg-green-500/5 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]' 
                                                : 'bg-black border-[#1a1a1a] hover:border-[#333]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-2.5 rounded-xl border border-[#1a1a1a] transition-colors ${data.service_type === service.id ? 'bg-green-500 text-white' : 'bg-[#0a0a0a] text-[#444] group-hover:bg-[#111]'}`}>
                                                    <Layers className="w-5 h-5" />
                                                </div>
                                                {service.documentation && (
                                                    <a href={service.documentation} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                                        <ExternalLink className="w-3.5 h-3.5 text-[#333] hover:text-[#888] transition-colors" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-white font-medium text-sm">{service.name || service.id}</div>
                                                <div className="text-[10px] text-[#555] mt-1 line-clamp-2 leading-normal">
                                                    {service.description || 'Pre-configured service template for one-click deployment.'}
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center text-[10px] text-[#333] font-bold uppercase tracking-widest group-hover:text-white transition-colors">
                                                Select
                                                <ChevronRight className="w-3 h-3 ml-1" />
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
                                className="max-w-2xl mx-auto space-y-8"
                            >
                                <div className="space-y-6">
                                    <h2 className="text-xl font-semibold text-white">Target Destination</h2>

                                    <div className="p-5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl flex items-center gap-4">
                                        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                            <Layers className="w-6 h-6 text-green-500" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-[#555] uppercase font-bold tracking-widest">Selected Service</div>
                                            <div className="text-white font-semibold text-lg">{services[data.service_type]?.name || data.service_type}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-[#888]">Server & Network</label>
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
                                                                    ? 'bg-green-500/5 border-green-500/50' 
                                                                    : 'bg-black border-[#1a1a1a] hover:border-[#222]'
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
                                        disabled={processing || !data.destination_uuid}
                                        className="flex-[2] bg-green-500 text-white py-4 rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(34,197,94,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Rocket className="w-5 h-5 fill-white" />
                                                Launch Service
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

NewService.layout = page => <PortalLayout children={page} />;

export default NewService;
