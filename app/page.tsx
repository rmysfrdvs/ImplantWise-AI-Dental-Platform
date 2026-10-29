import ImplantViewer from "@/components/ImplantViewer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-slate-900 text-white">
      <header className="w-full max-w-5xl flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-blue-400">
          ImplantWise 3D
        </h1>
        <p className="text-sm text-slate-400">Implant Goruntuleyici</p>
      </header>

      <div className="w-full max-w-5xl h-[600px] bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 relative">
        <ImplantViewer />
      </div>

      <footer className="mt-8 text-xs text-slate-500">
        ImplantWise - Three.js Projesi
      </footer>
    </main>
  );
}