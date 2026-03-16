import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Cpu, 
  GitBranch, 
  Settings, 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Github,
  ShieldCheck,
  Zap,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BuildStatus {
  isBuilding: boolean;
  logs: string[];
}

export default function App() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/torvalds/linux');
  const [branch, setBranch] = useState('master');
  const [defconfig, setDefconfig] = useState('vendor/generic_defconfig');
  const [enableKernelSU, setEnableKernelSU] = useState(true);
  const [enableSusfs, setEnableSusfs] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [buildComplete, setBuildComplete] = useState(false);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('build-status', (status: BuildStatus) => {
      setIsBuilding(status.isBuilding);
      setLogs(status.logs);
    });

    newSocket.on('log', (log: string) => {
      setLogs(prev => [...prev, log]);
    });

    newSocket.on('build-complete', () => {
      setBuildComplete(true);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleStartBuild = () => {
    if (!socket || isBuilding) return;
    setBuildComplete(false);
    socket.emit('start-build', {
      repoUrl,
      branch,
      defconfig,
      enableKernelSU,
      enableSusfs
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-900/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Cpu className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">KernelForge</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">v1.0.0</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", isBuilding ? "bg-emerald-500" : "bg-zinc-500")} />
              <span className="text-xs font-medium text-zinc-400">{isBuilding ? "Build in Progress" : "System Ready"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Configuration Panel */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Build Configuration</h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 ml-1">Kernel Repository</label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" 
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 ml-1">Branch</label>
                    <div className="relative">
                      <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text" 
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                        placeholder="master"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 ml-1">Defconfig</label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text" 
                        value={defconfig}
                        onChange={(e) => setDefconfig(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                        placeholder="generic_defconfig"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium">KernelSU</p>
                        <p className="text-[10px] text-zinc-500">Root solution</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEnableKernelSU(!enableKernelSU)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative",
                        enableKernelSU ? "bg-emerald-500" : "bg-zinc-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        enableKernelSU ? "left-6" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">SUSFS</p>
                        <p className="text-[10px] text-zinc-500">Hide root patches</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEnableSusfs(!enableSusfs)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative",
                        enableSusfs ? "bg-emerald-500" : "bg-zinc-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        enableSusfs ? "left-6" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleStartBuild}
                  disabled={isBuilding}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95",
                    isBuilding 
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                      : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  )}
                >
                  {isBuilding ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                      BUILDING...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      START KERNEL BUILD
                    </>
                  )}
                </button>
              </div>
            </section>

            {buildComplete && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <h3 className="font-bold text-emerald-400">Build Successful</h3>
                </div>
                <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                  Your kernel has been successfully compiled and patched. You can now download the flashable zip.
                </p>
                <button className="w-full py-2.5 bg-white text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors">
                  <Download className="w-4 h-4" />
                  DOWNLOAD ARTIFACTS
                </button>
              </motion.div>
            )}
          </div>

          {/* Terminal / Logs Panel */}
          <div className="lg:col-span-8">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col h-[600px] overflow-hidden shadow-2xl">
              <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Build Console</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-1.5 custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4">
                    <Terminal className="w-12 h-12 opacity-20" />
                    <p className="text-xs uppercase tracking-[0.2em]">Waiting for build initialization...</p>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "break-all",
                        log.includes('>>>') ? "text-emerald-400 font-bold mt-4" : "text-zinc-400",
                        log.includes('successfully') ? "text-emerald-500 font-bold" : ""
                      )}
                    >
                      <span className="opacity-30 mr-3 select-none">{(i + 1).toString().padStart(3, '0')}</span>
                      {log}
                    </motion.div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </div>

            <div className="mt-6 flex items-start gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Environment Notice</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Kernel building requires significant resources. This interface provides a managed build environment. 
                  If the build fails due to resource constraints, consider using a high-performance build node.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}} />
    </div>
  );
}
