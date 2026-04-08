import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Zap, 
    Database, 
    Layers, 
    ArrowRight,
    Search,
    Plus
} from 'lucide-react';
import PortalLayout from '../../Layouts/PortalLayout';

const SelectResourceType = ({ project, environment }) => {
    const resourceTypes = [
        {
            id: 'application',
            name: 'Application',
            description: 'Deploy your code from GitHub, GitLab, or a Docker Image.',
            icon: Zap,
            color: 'text-blue-500',
            borderColor: 'hover:border-blue-500/30',
            bgColor: 'group-hover:bg-blue-500/10',
            href: `/project/${project.uuid}/environment/${environment.uuid}/new?type=application`
        },
        {
            id: 'database',
            name: 'Database',
            description: 'Provision a managed PostgreSQL, MySQL, Redis, or other database.',
            icon: Database,
            color: 'text-purple-500',
            borderColor: 'hover:border-purple-500/30',
            bgColor: 'group-hover:bg-purple-500/10',
            href: `/project/${project.uuid}/environment/${environment.uuid}/new?type=database`
        },
        {
            id: 'service',
            name: 'Service',
            description: 'Deploy one-click services like WordPress, Ghost, or Plausible.',
            icon: Layers,
            color: 'text-green-500',
            borderColor: 'hover:border-green-500/30',
            bgColor: 'group-hover:bg-green-500/10',
            href: `/project/${project.uuid}/environment/${environment.uuid}/new?type=service`
        }
    ];

    return (
        <>
            <Head title="Select Resource Type" />

            <div className="max-w-4xl mx-auto py-12">
                <div className="mb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Add New Resource</h1>
                        <p className="text-[#888] text-sm max-w-lg mx-auto leading-relaxed">
                            Select the type of resource you want to deploy to your <span className="text-white font-medium">{environment.name}</span> environment in <span className="text-white font-medium">{project.name}</span>.
                        </p>
                    </motion.div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {resourceTypes.map((type, index) => (
                        <motion.div
                            key={type.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <Link
                                href={type.href}
                                className={`group relative flex flex-col h-full bg-black border border-[#1f1f1f] rounded-2xl p-6 transition-all duration-300 ${type.borderColor} hover:bg-[#050505] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] overflow-hidden`}
                            >
                                <div className={`w-12 h-12 rounded-xl border border-[#1f1f1f] flex items-center justify-center bg-[#0a0a0a] mb-6 transition-colors ${type.bgColor}`}>
                                    <type.icon className={`w-6 h-6 ${type.color}`} />
                                </div>
                                
                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">
                                    {type.name}
                                </h3>
                                <p className="text-[#666] text-sm leading-relaxed mb-8 group-hover:text-[#888] transition-colors">
                                    {type.description}
                                </p>

                                <div className="mt-auto flex items-center text-xs font-medium text-[#444] group-hover:text-white transition-colors">
                                    Continue
                                    <ArrowRight className="w-3.5 h-3.5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                                </div>

                                {/* Subtle background glow */}
                                <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-opacity ${type.id === 'application' ? 'bg-blue-500' : type.id === 'database' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 pt-8 border-t border-[#111]">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg">
                                <Search className="w-5 h-5 text-[#444]" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-[#eee]">Search Templates</h4>
                                <p className="text-xs text-[#555]">Find a specific service or stack from our community library.</p>
                            </div>
                        </div>
                        <button className="bg-white text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#eaeaea] transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Browse Community
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

SelectResourceType.layout = page => <PortalLayout children={page} />;

export default SelectResourceType;
