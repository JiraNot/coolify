import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

const Login = ({ errors = {}, status, csrf_token, is_registration_enabled = false, enabled_oauth_providers = [] }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <>
            <Head title="Sign In" />

            <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white/20" style={{ WebkitFontSmoothing: 'antialiased' }}>

                {/* Top Bar */}
                <nav className="border-b border-[#1a1a1a] h-14 flex items-center px-6">
                    <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                        <a href="/" className="flex items-center gap-2 group">
                            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
                                <span className="text-black font-bold text-sm">C</span>
                            </div>
                            <span className="text-sm font-medium text-[#888] hidden sm:block">Coolify</span>
                        </a>
                        {is_registration_enabled && (
                            <a href="/register" className="text-xs text-[#555] hover:text-white transition-colors">
                                Don't have an account? <span className="text-white underline underline-offset-2">Sign up →</span>
                            </a>
                        )}
                    </div>
                </nav>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center px-4 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="w-full max-w-sm"
                    >
                        {/* Header */}
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight text-white">Sign in</h1>
                            <p className="text-sm text-[#555] mt-1">to continue to your portal</p>
                        </div>

                        {/* Status messages */}
                        {status && (
                            <div className="mb-6 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
                                {status}
                            </div>
                        )}

                        {/* Error messages */}
                        {hasErrors && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                            >
                                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <div className="text-sm text-red-400">
                                    {Object.values(errors).flat().map((error, i) => (
                                        <p key={i}>{error}</p>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Login Form — submits to Coolify's existing POST /login */}
                        <form
                            action="/login"
                            method="POST"
                            onSubmit={() => setIsLoading(true)}
                            className="space-y-4"
                        >
                            <input type="hidden" name="_token" value={csrf_token} />

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-xs font-medium text-[#888] uppercase tracking-widest">
                                    Email
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] group-focus-within:text-[#666] transition-colors pointer-events-none" />
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        required
                                        placeholder="you@example.com"
                                        className="w-full bg-[#050505] border border-[#1f1f1f] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#444] focus:bg-black transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="text-xs font-medium text-[#888] uppercase tracking-widest">
                                        Password
                                    </label>
                                    <a href="/forgot-password" className="text-[11px] text-[#555] hover:text-white transition-colors">
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] group-focus-within:text-[#666] transition-colors pointer-events-none" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        autoComplete="current-password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-[#050505] border border-[#1f1f1f] rounded-lg py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#444] focus:bg-black transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-2 bg-white text-black py-2.5 rounded-lg text-sm font-medium hover:bg-[#eaeaea] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                        className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
                                    />
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#111]"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-3 bg-black text-[11px] text-[#444] uppercase tracking-widest">or</span>
                            </div>
                        </div>

                        {/* OAuth Buttons — only shown if providers are configured */}
                        {enabled_oauth_providers.length > 0 && (
                            <div className="space-y-2">
                                {enabled_oauth_providers.includes('google') && (
                                    <a href="/auth/google/redirect" className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[#1f1f1f] text-sm text-[#888] hover:border-[#333] hover:text-white transition-all">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81z"/></svg>
                                        Continue with Google
                                    </a>
                                )}
                                {enabled_oauth_providers.includes('github') && (
                                    <a href="/auth/github/redirect" className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[#1f1f1f] text-sm text-[#888] hover:border-[#333] hover:text-white transition-all">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                                        Continue with GitHub
                                    </a>
                                )}
                                {enabled_oauth_providers.filter(p => !['google','github'].includes(p)).map(provider => (
                                    <a key={provider} href={`/auth/${provider}/redirect`} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[#1f1f1f] text-sm text-[#888] hover:border-[#333] hover:text-white transition-all capitalize">
                                        Continue with {provider}
                                    </a>
                                ))}
                            </div>
                        )}

                        <p className="mt-8 text-center text-[11px] text-[#333]">
                            By signing in, you agree to our{' '}
                            <a href="#" className="underline underline-offset-2 hover:text-[#555] transition-colors">Terms</a>
                            {' '}and{' '}
                            <a href="#" className="underline underline-offset-2 hover:text-[#555] transition-colors">Privacy Policy</a>
                        </p>
                    </motion.div>
                </div>

                {/* Footer */}
                <footer className="border-t border-[#0f0f0f] px-6 py-4 text-center text-[11px] text-[#333]">
                    © 2026 Coolify — Self-hosted Cloud Platform
                </footer>
            </div>
        </>
    );
};

export default Login;
