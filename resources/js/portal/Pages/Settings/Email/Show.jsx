import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, 
    Shield, 
    Server, 
    Send, 
    ChevronRight, 
    CheckCircle2, 
    AlertCircle,
    Loader2,
    Lock,
    Globe,
    Zap
} from 'lucide-react';
import PortalLayout from '../../../Layouts/PortalLayout';

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-[#888]">{subtitle}</p>
    </div>
);

const FormField = ({ label, description, children, error }) => (
    <div className="mb-8 last:mb-0">
        <label className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2 block">{label}</label>
        {description && <p className="text-xs text-[#555] mb-3 leading-relaxed">{description}</p>}
        {children}
        {error && <p className="text-xs text-red-500 mt-2 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
);

const Input = ({ ...props }) => (
    <input
        className="w-full bg-black border border-[#1f1f1f] rounded-lg px-4 py-2.5 text-sm text-[#ddd] focus:outline-none focus:border-[#444] transition-all placeholder:text-[#333]"
        {...props}
    />
);

const Toggle = ({ label, description, enabled, onChange, disabled = false }) => (
    <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${enabled ? 'bg-white/5 border-white/20' : 'bg-[#050505] border-[#1f1f1f] hover:border-[#2a2a2a]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="flex-1">
            <h4 className="text-sm font-medium text-white">{label}</h4>
            {description && <p className="text-xs text-[#666] mt-0.5">{description}</p>}
        </div>
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-white' : 'bg-[#222]'}`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5 shadow-[0_0_8px_rgba(255,255,255,0.7)] bg-black' : 'translate-x-0'}`}
            />
        </button>
    </div>
);

const EmailShow = ({ emailSettings, instanceSettings }) => {
    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testSuccess, setTestSuccess] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        use_instance_email_settings: emailSettings.use_instance_email_settings,
        smtp_enabled: emailSettings.smtp_enabled,
        smtp_from_address: emailSettings.smtp_from_address || '',
        smtp_from_name: emailSettings.smtp_from_name || '',
        smtp_host: emailSettings.smtp_host || '',
        smtp_port: emailSettings.smtp_port || 587,
        smtp_encryption: emailSettings.smtp_encryption || 'tls',
        smtp_username: emailSettings.smtp_username || '',
        smtp_password: '', // Hidden by default
        smtp_timeout: emailSettings.smtp_timeout || 10,
        resend_enabled: emailSettings.resend_enabled,
        resend_api_key: '', // Hidden by default
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/portal/settings/email', {
            preserveScroll: true
        });
    };

    const handleSendTest = async () => {
        if (!testEmail) return;
        setSendingTest(true);
        setTestSuccess(null);
        
        try {
            await axios.post('/portal/settings/email/test', { email: testEmail });
            setTestSuccess(true);
        } catch (err) {
            setTestSuccess(false);
        } finally {
            setSendingTest(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Head title="Email Settings - Portal" />

            <div className="flex items-center gap-2 text-[#666] text-xs font-medium uppercase tracking-wider mb-6">
                <span>Settings</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white">Email Server</span>
            </div>

            <div className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Email Configuration</h1>
                <p className="text-[#888]">Configure how the portal sends transactional emails and notifications.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12 pb-20">
                {/* Global Provider Switch */}
                <section>
                    <SectionHeader 
                        title="Delivery Strategy" 
                        subtitle="Choose between using the instance defaults or providing your own credentials." 
                    />
                    <Toggle 
                        label="Use Instance Email Settings"
                        description="Leverage the pre-configured global Coolify email server."
                        enabled={data.use_instance_email_settings}
                        onChange={val => setData('use_instance_email_settings', val)}
                    />
                </section>

                <AnimatePresence mode="wait">
                    {!data.use_instance_email_settings && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-12 overflow-hidden"
                        >
                            {/* Resend Provider */}
                            <div className="bg-[#050505] border border-[#1f1f1f] rounded-2xl p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Resend</h3>
                                        <p className="text-xs text-[#666]">The modern email API for developers.</p>
                                    </div>
                                    <div className="ml-auto">
                                        <Toggle 
                                            enabled={data.resend_enabled}
                                            onChange={val => {
                                                setData(d => ({ ...d, resend_enabled: val, smtp_enabled: val ? false : d.smtp_enabled }));
                                            }}
                                        />
                                    </div>
                                </div>

                                {data.resend_enabled && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6 pt-6 border-t border-[#111]"
                                    >
                                        <FormField 
                                            label="API Key" 
                                            description="Create an API key in your Resend dashboard with 'Sending' permissions."
                                            error={errors.resend_api_key}
                                        >
                                            <Input 
                                                type="password"
                                                placeholder="re_123456789..."
                                                value={data.resend_api_key}
                                                onChange={e => setData('resend_api_key', e.target.value)}
                                            />
                                        </FormField>
                                    </motion.div>
                                )}
                            </div>

                            {/* SMTP Provider */}
                            <div className="bg-[#050505] border border-[#1f1f1f] rounded-2xl p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center">
                                        <Server className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">SMTP</h3>
                                        <p className="text-xs text-[#666]">Use any custom SMTP relay or provider.</p>
                                    </div>
                                    <div className="ml-auto">
                                        <Toggle 
                                            enabled={data.smtp_enabled}
                                            onChange={val => {
                                                setData(d => ({ ...d, smtp_enabled: val, resend_enabled: val ? false : d.resend_enabled }));
                                            }}
                                        />
                                    </div>
                                </div>

                                {data.smtp_enabled && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-8 pt-6 border-t border-[#111]"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <FormField label="Host" error={errors.smtp_host}>
                                                <Input 
                                                    placeholder="smtp.mailgun.org"
                                                    value={data.smtp_host}
                                                    onChange={e => setData('smtp_host', e.target.value)}
                                                />
                                            </FormField>
                                            <FormField label="Port" error={errors.smtp_port}>
                                                <Input 
                                                    type="number"
                                                    placeholder="587"
                                                    value={data.smtp_port}
                                                    onChange={e => setData('smtp_port', e.target.value)}
                                                />
                                            </FormField>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <FormField label="Username" error={errors.smtp_username}>
                                                <Input 
                                                    placeholder="postmaster@domain.com"
                                                    value={data.smtp_username}
                                                    onChange={e => setData('smtp_username', e.target.value)}
                                                />
                                            </FormField>
                                            <FormField label="Password" error={errors.smtp_password}>
                                                <Input 
                                                    type="password"
                                                    placeholder="••••••••••••"
                                                    value={data.smtp_password}
                                                    onChange={e => setData('smtp_password', e.target.value)}
                                                />
                                            </FormField>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <FormField label="From Address" error={errors.smtp_from_address}>
                                                <Input 
                                                    placeholder="notifications@yourdomain.com"
                                                    value={data.smtp_from_address}
                                                    onChange={e => setData('smtp_from_address', e.target.value)}
                                                />
                                            </FormField>
                                            <FormField label="From Name" error={errors.smtp_from_name}>
                                                <Input 
                                                    placeholder="Portal Notifications"
                                                    value={data.smtp_from_name}
                                                    onChange={e => setData('smtp_from_name', e.target.value)}
                                                />
                                            </FormField>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="sticky bottom-8 left-0 right-0 py-4 px-6 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl z-40">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center shadow-lg transform hover:-translate-y-1 transition-transform">
                                <Mail className="w-4 h-4 text-white" />
                            </div>
                            <div className="w-8 h-8 rounded-full border-2 border-black bg-zinc-900 flex items-center justify-center shadow-lg transform hover:-translate-y-1 transition-transform">
                                <Shield className="w-4 h-4 text-[#888]" />
                            </div>
                        </div>
                        <div className="text-xs">
                            <p className="text-white font-medium">Verify Connection</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <input 
                                    type="email" 
                                    value={testEmail}
                                    onChange={e => setTestEmail(e.target.value)}
                                    placeholder="test@example.com"
                                    className="bg-transparent border-none p-0 text-[11px] text-[#666] focus:ring-0 focus:outline-none w-32 placeholder:text-[#333]"
                                />
                                <button 
                                    type="button"
                                    onClick={handleSendTest}
                                    disabled={!testEmail || sendingTest}
                                    className="text-[10px] text-white hover:text-blue-400 font-bold uppercase tracking-wider disabled:opacity-30 flex items-center gap-1.5"
                                >
                                    {sendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    Test
                                </button>
                                {testSuccess === true && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                {testSuccess === false && <AlertCircle className="w-3 h-3 text-red-500" />}
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={processing}
                        className="bg-white text-black px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-[#eaeaea] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95"
                    >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

EmailShow.layout = page => <PortalLayout children={page} />;

export default EmailShow;
