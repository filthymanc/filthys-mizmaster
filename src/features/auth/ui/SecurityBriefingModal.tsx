import React from 'react';
import { 
    XIcon, 
    ShieldIcon, 
    KeyIcon, 
    CurrencyDollarIcon, 
    LightBulbIcon 
} from '../../../shared/ui/Icons';
import { useFocusTrap } from '../../../shared/hooks/useFocusTrap';

interface SecurityBriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SecurityBriefingModal: React.FC<SecurityBriefingModalProps> = ({ isOpen, onClose }) => {
    const modalRef = useFocusTrap(isOpen, onClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity">
            <div 
                ref={modalRef}
                className="bg-app-frame border border-app-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp"
                role="dialog"
                aria-modal="true"
                aria-labelledby="security-briefing-title"
                tabIndex={-1}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-app-border bg-app-canvas/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-app-brand/10 text-app-brand rounded-lg">
                            <ShieldIcon className="h-6 w-6" />
                        </div>
                        <h2 id="security-briefing-title" className="text-xl font-bold text-app-primary">
                            Security Briefing
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-app-tertiary hover:text-app-primary p-2 rounded-lg hover:bg-app-surface transition-colors"
                        aria-label="Close dialog"
                    >
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-app-secondary text-sm leading-relaxed custom-scrollbar">
                    
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-app-primary font-bold text-base">
                            <KeyIcon className="h-5 w-5 text-app-brand" />
                            <h3>Why Do We Need Keys?</h3>
                        </div>
                        <p>
                            MizMaster requires direct access to Google's Gemini AI to interpret mission data and generate code. By providing your own API key, you ensure a direct, unmediated connection between your device and Google's servers.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-app-primary font-bold text-base">
                            <ShieldIcon className="h-5 w-5 text-green-500" />
                            <h3>Data Privacy & Storage</h3>
                        </div>
                        <p>
                            <strong>Your key never leaves your browser.</strong> It is stored locally using IndexedDB and LocalStorage. We do not have backend servers, and we never see or store your key. You maintain complete control over your credentials.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-app-primary font-bold text-base">
                            <CurrencyDollarIcon className="h-5 w-5 text-yellow-500" />
                            <h3>Cost & Usage Control</h3>
                        </div>
                        <p>
                            Google offers a generous Free Tier for the Gemini API. By using your own key, you operate under your own quotas. You can monitor usage and set limits directly within Google AI Studio to prevent unexpected charges.
                        </p>
                        <div className="mt-2">
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-app-surface hover:bg-app-border border border-app-border rounded-lg text-app-brand font-semibold transition-colors"
                            >
                                Get a Free Gemini API Key
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </section>

                    <section className="space-y-3 p-4 bg-app-canvas rounded-lg border border-app-border">
                        <div className="flex items-center gap-2 text-app-primary font-bold text-base">
                            <LightBulbIcon className="h-5 w-5 text-app-brand" />
                            <h3>The Anti-Hallucination Mandate</h3>
                        </div>
                        <p>
                            While the AI is powerful, it is not infallible. Our core philosophy is <strong>"Verify before Writing"</strong>. The AI is designed to act as a highly capable assistant, but you remain the commanding officer. Always review generated code and logic before deployment.
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-app-border bg-app-canvas/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-app-brand hover:bg-opacity-90 text-white font-bold rounded-lg transition-colors shadow-lg shadow-app-brand/20"
                    >
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecurityBriefingModal;