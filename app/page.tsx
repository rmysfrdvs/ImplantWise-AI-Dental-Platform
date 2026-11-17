'use client';

import dynamic from 'next/dynamic';

const ImplantViewer = dynamic(() => import('../components/ImplantViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-300 text-sm">
      3D İmplant Sahnesi Yükleniyor...
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <ImplantViewer />
      </div>
    </main>
  );
}