import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <main className="app startup">
      <div className="wordmark">TRIROX</div>
      <div className="startup-content" role="status" aria-live="polite">
        <div className="startup-mark" aria-label="TRIROX">
          <Activity size={44} strokeWidth={2.25} />
        </div>
        <h1>正在開啟 TRIROX</h1>
        <p>正在準備你的訓練計畫</p>
      </div>
    </main>
  );
}
