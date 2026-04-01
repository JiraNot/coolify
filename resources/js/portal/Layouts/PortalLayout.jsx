import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, 
    Bell
} from 'lucide-react';

const PortalLayout = ({ children }) => {
    const { url, props } = usePage();
    const { team, project, user } = props;

    // Helper to determine breadcrumbs based on current route/page props
    const getBreadcrumbs = () => {
        const crumbs = [
            { label: team?.name || 'Personal', href: '/portal' }
        ];

        if (project) {
            crumbs.push({ label: project.name, href: `/portal/project/${project.uuid}` });
        }

        return crumbs;
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
            {/* Top Navigation Bar */}
            <nav className="border-b border-[#1f1f1f] sticky top-0 bg-black/80 backdrop-blur-md z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Logo */}
                        <Link href="/portal" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
                                <span className="text-black font-bold text-lg">C</span>
                            </div>
                        </Link>

                        <div className="h-5 w-px bg-[#1f1f1f] mx-2"></div>

                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm">
                            {getBreadcrumbs().map((crumb, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && <ChevronRight className="w-4 h-4 text-[#444]" />}
                                    <Link 
                                        href={crumb.href}
                                        className={`hover:text-white transition-colors ${index === getBreadcrumbs().length - 1 ? 'text-white font-medium' : 'text-[#888]'}`}
                                    >
                                        {crumb.label}
                                    </Link>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2 text-[#555] hover:text-white transition-colors rounded-md hover:bg-[#0f0f0f]">
                            <Bell className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 cursor-pointer group">
                            <div className="w-7 h-7 bg-gradient-to-br from-zinc-700 to-zinc-900 border border-[#2a2a2a] rounded-full flex items-center justify-center group-hover:border-[#444] transition-colors">
                                <span className="text-[10px] font-semibold text-white uppercase">
                                    {user?.name ? user.name.charAt(0) : 'U'}
                                </span>
                            </div>
                            <span className="text-xs text-[#555] group-hover:text-[#888] transition-colors hidden sm:block">
                                {user?.name?.split(' ')[0] || 'Account'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sub-navigation: Dashboard tabs */}
                {url === '/portal' && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center gap-6 text-sm border-t border-[#111]">
                        <Link href="/portal" className="text-white border-b border-white h-full flex items-center px-1 font-medium">
                            Overview
                        </Link>
                        <button className="text-[#666] hover:text-white transition-colors h-full flex items-center px-1">Integrations</button>
                        <button className="text-[#666] hover:text-white transition-colors h-full flex items-center px-1">Activity</button>
                        <button className="text-[#666] hover:text-white transition-colors h-full flex items-center px-1">Domains</button>
                        <button className="text-[#666] hover:text-white transition-colors h-full flex items-center px-1">Settings</button>
                    </div>
                )}

                {/* Sub-navigation: Project tabs */}
                {url.startsWith('/portal/project') && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center gap-6 text-sm border-t border-[#111]">
                        <button className="text-white border-b border-white h-full flex items-center px-1 font-medium">Overview</button>
                        <button className="text-[#666] hover:text-white transition-colors h-full flex items-center px-1">Deployments</button>
                        <button className="text-[#666] hover:text-white transition-colors h-full flex items-center px-1">Logs</button>
                        <button className="text-[#666] hover:text-white transition-colors h-full flex items-center px-1">Settings</button>
                    </div>
                )}
            </nav>

            {/* Page Content with Framer Motion Page Transition */}
            <AnimatePresence mode="wait">
                <motion.main
                    key={url}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
                >
                    {children}
                </motion.main>
            </AnimatePresence>
            
            {/* Vercel Footer Signature */}
            <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-12 mt-20 border-t border-[#111] flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-center gap-4 text-[11px] text-[#444]">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                        All systems operational
                    </span>
                    <a href="#" className="hover:text-[#888] transition-colors">Documentation</a>
                    <a href="#" className="hover:text-[#888] transition-colors">Pricing</a>
                </div>
                <div className="text-[11px] text-[#444]">
                    © 2026 Reforged Coolify - Vercel UI Suite
                </div>
            </footer>
        </div>
    );
};

export default PortalLayout;
