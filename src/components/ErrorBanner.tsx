import { AlertTriangle } from 'lucide-react';

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="glass-panel p-4 mb-6 flex items-center gap-3 border border-red-500/50 bg-red-500/20">
      <AlertTriangle size={20} className="text-red-400" style={{ flexShrink: 0 }} />
      <span className="text-text">{message}</span>
    </div>
  );
}
