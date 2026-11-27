import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border bg-white animate-fade-in transition-all">
      <div className={`p-1.5 rounded-lg ${isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <p className="text-sm font-semibold text-slate-800">{message}</p>
      <button 
        onClick={onClose} 
        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
        aria-label="Kapat"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
