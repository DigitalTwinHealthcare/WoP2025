import React from 'react';
import { X, AlertCircle, Info, CheckCircle } from 'lucide-react';

const InfoModal = ({ isOpen, onClose, title, content, type = "info" }) => {
  if (!isOpen) return null;

  const styles = {
    info: { border: "border-neuro-primary", icon: Info, color: "text-neuro-primary" },
    warning: { border: "border-neuro-warning", icon: AlertCircle, color: "text-neuro-warning" },
    danger: { border: "border-neuro-danger", icon: AlertCircle, color: "text-neuro-danger" },
    success: { border: "border-neuro-success", icon: CheckCircle, color: "text-neuro-success" }
  };

  const style = styles[type] || styles.info;
  const IconComponent = style.icon;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 animate-fade-in">
      <div className={`relative w-full max-w-md p-6 rounded-xl bg-neuro-panel border-l-4 ${style.border} shadow-2xl`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neuro-muted hover:text-neuro-text transition-colors"
          style={{ position: 'absolute', top: '16px', right: '16px' }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4">
          <div className={`mt-1 p-2 rounded-full bg-neuro-bg border border-white/5`}>
            <IconComponent className={`w-6 h-6 ${style.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neuro-text tracking-wide uppercase">{title}</h3>
            <p className="text-neuro-muted text-sm mt-2 leading-relaxed font-light">{content}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neuro-bg hover:bg-neuro-bg/80 border border-neuro-primary/20 rounded text-xs font-bold text-neuro-primary uppercase tracking-wider transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;