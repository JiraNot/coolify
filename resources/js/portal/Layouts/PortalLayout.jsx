import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, 
    Bell,
    ChevronsUpDown,
    Check,
    LogOut,
    Settings,
    Plus,
    User as UserIcon,
    Shield,
    ExternalLink
} from 'lucide-react';

const PortalLayout = ({ children }) => {
    const { url, props } = usePage();
    const { auth, project } = props;
    const { user, currentTeam } = auth || {};
    
    const [isTeamOpen, setIsTeamOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);
    
    const teamRef = useRef(null);
    const userRef = useRef(null);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (teamRef.current && !teamRef.current.contains(event.target)) setIsTeamOpen(false);
            if (userRef.current && !userRef.current.contains(event.target)) setIsUserOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitchTeam = (teamId) => {
        if (teamId === currentTeam?.id) return;
        router.post(route('portal.team.switch', { team_id: teamId }));
        setIsTeamOpen(false);
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-500/30">
            {/* Top Navigation Bar */}
            <nav className="border-b border-[#1f1f1f] sticky top-0 bg-black/80 backdrop-blur-md z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Logo */}
                        <Link href="/portal" className="flex items-center gap-3 mr-2">
                            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center transition-transform hover:scale-105 overflow-hidden">
                                <span className="text-black font-black text-sm italic">C</span>
                            </div>
                        </Link>

                        <ChevronRight className="w-4 h-4 text-zinc-700" />

                        {/* Team Switcher */}
                        <div className="relative" ref={teamRef}>
                            <button 
                                onClick={() => setIsTeamOpen(!isTeamOpen)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-900 transition-colors group"
                            >
                                <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center text-[10px] font-bold">
                                    {currentTeam?.name?.charAt(0) || 'T'}
                                </div>
                                <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate max-w-[120px]">
                                    {currentTeam?.name || 'Personal'}
                                </span>
                                <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                            </button>

                            <AnimatePresence>
                                {isTeamOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.1, ease: 'easeOut' }}
                                        className="absolute left-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl py-1 overflow-hidden pointer-events-auto"
                                    >
                                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                            Teams
                                        </div>
                                        {user?.teams?.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleSwitchTeam(t.id)}
                                                className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 bg-zinc-800 rounded flex items-center justify-center text-[10px]">
                                                        {t.name.charAt(0)}
                                                    </div>
                                                    <span className="truncate max-w-[140px]">{t.name}</span>
                                                </div>
                                                {t.id === currentTeam?.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                                            </button>
                                        ))}
                                        <div className="mt-1 pt-1 border-t border-zinc-800">
                                            <Link 
                                                href="/team/new" 
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Create New Team
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {project && (
                            <>
                                <ChevronRight className="w-4 h-4 text-zinc-700" />
                                <Link 
                                    href={`/portal/project/${project.uuid}`}
                                    className="text-sm font-medium text-zinc-200 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-zinc-900"
                                >
                                    {project.name}
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-md hover:bg-zinc-900">
                            <Bell className="w-4 h-4" />
                        </button>
                        
                        {/* User Profile Dropdown */}
                        <div className="relative" ref={userRef}>
                            <button 
                                onClick={() => setIsUserOpen(!isUserOpen)}
                                className="flex items-center gap-2 p-0.5 rounded-full hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-800"
                            >
                                <div className="w-7 h-7 bg-zinc-100 rounded-full flex items-center justify-center text-black font-bold text-xs ring-offset-black transition-transform active:scale-95 overflow-hidden">
                                     {user?.name ? user.name.charAt(0) : 'U'}
                                </div>
                            </button>

                            <AnimatePresence>
                                {isUserOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.1, ease: 'easeOut' }}
                                        className="absolute right-0 mt-2 w-64 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl py-1 z-[60]"
                                    >
                                        <div className="px-4 py-3 border-b border-zinc-800">
                                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                                        </div>
                                        
                                        <div className="py-1">
                                            <Link href="/portal" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors">
                                                <UserIcon className="w-4 h-4 text-zinc-500" />
                                                Dashboard
                                            </Link>
                                            <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors">
                                                <Settings className="w-4 h-4 text-zinc-500" />
                                                Settings
                                            </Link>
                                            {user?.is_instance_admin && (
                                                <a href="/" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors">
                                                    <Shield className="w-4 h-4 text-zinc-500" />
                                                    Admin Dashboard
                                                    <ExternalLink className="w-3 h-3 ml-auto text-zinc-600" />
                                                </a>
                                            )}
                                        </div>

                                        <div className="pt-1 border-t border-zinc-800">
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Sub-navigation TABS remain mostly same but updated with better spacing */}
                {(url === '/portal' || url.startsWith('/portal/settings')) && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center gap-6 text-sm border-t border-zinc-900">
                        <Link 
                            href="/portal" 
                            className={`${url === '/portal' ? 'text-white border-b border-white' : 'text-zinc-500 hover:text-white'} h-full flex items-center px-1 font-medium transition-colors`}
                        >
                            Overview
                        </Link>
                        <button className="text-zinc-500 hover:text-white transition-colors h-full flex items-center px-1">Integrations</button>
                        <button className="text-zinc-500 hover:text-white transition-colors h-full flex items-center px-1">Activity</button>
                        <button className="text-zinc-500 hover:text-white transition-colors h-full flex items-center px-1">Usage</button>
                        <Link 
                            href="/portal/settings/email" 
                            className={`${url.startsWith('/portal/settings') ? 'text-white border-b border-white' : 'text-zinc-500 hover:text-white'} h-full flex items-center px-1 font-medium transition-colors`}
                        >
                            Settings
                        </Link>
                    </div>
                )}

                {url.startsWith('/portal/project') && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center gap-6 text-sm border-t border-zinc-900">
                        <button className="text-white border-b border-white h-full flex items-center px-1 font-medium">Overview</button>
                        <button className="text-zinc-500 hover:text-white transition-colors h-full flex items-center px-1">Deployments</button>
                        <button className="text-zinc-500 hover:text-white transition-colors h-full flex items-center px-1">Logs</button>
                        <button className="text-zinc-500 hover:text-white transition-colors h-full flex items-center px-1">Settings</button>
                    </div>
                )}
            </nav>

            {/* Page Content */}
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
            
            <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-12 mt-20 border-t border-zinc-900 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-center gap-6 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                        All systems operational
                    </span>
                    <a href="#" className="hover:text-zinc-300 transition-colors">Documentation</a>
                    <a href="#" className="hover:text-zinc-300 transition-colors">Support</a>
                </div>
                <div className="text-[11px] text-zinc-600">
                    © 2026 Coolify PRO Suite • Vercel Interface Reforge
                </div>
            </footer>
        </div>
    );
};

export default PortalLayout;
