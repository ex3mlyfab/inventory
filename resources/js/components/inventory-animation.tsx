import { motion } from 'framer-motion';
import { Package, Truck, Boxes, ScanLine, ArrowUpRight } from 'lucide-react';

export default function InventoryAnimation() {
    return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            {/* Background glowing elements */}
            <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-emerald-500/20 blur-[80px]" />
            <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-[80px]" />

            <div className="relative z-10 w-full max-w-sm xl:max-w-md">
                {/* Floating Tech UI (Front Layer) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="absolute -left-8 top-10 z-20 rounded-xl border border-white/10 bg-black/60 p-3 shadow-2xl backdrop-blur-md"
                >
                    <div className="flex items-center space-x-2">
                        <ScanLine className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-mono text-emerald-400">SCAN: OK</span>
                    </div>
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="absolute -right-8 bottom-20 z-20 rounded-xl border border-white/10 bg-black/60 p-3 shadow-2xl backdrop-blur-md"
                >
                    <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-mono text-blue-400">DISPATCHED</span>
                    </div>
                </motion.div>

                {/* 3D Isometric Layering */}
                <div className="relative h-[350px] w-full" style={{ perspective: '1200px' }}>
                    <motion.div 
                        initial={{ rotateX: 60, rotateZ: -45, y: 20 }}
                        animate={{ y: [20, 10, 20] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative mx-auto h-64 w-64"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Base Grid Plane (Warehouse Floor) */}
                        <div 
                            className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-2 border border-emerald-500/30 bg-emerald-950/40 p-2 shadow-[0_0_50px_rgba(16,185,129,0.2)] backdrop-blur-sm"
                            style={{ transform: 'translateZ(0px)' }}
                        >
                            {Array.from({ length: 16 }).map((_, i) => (
                                <div key={i} className="rounded-sm border border-emerald-500/20 bg-emerald-500/10" />
                            ))}
                        </div>

                        {/* Automated Forklift / Node 1 */}
                        <motion.div 
                            animate={{ 
                                x: [0, 120, 120, 0, 0], 
                                y: [0, 0, 120, 120, 0] 
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute left-4 top-4 flex h-14 w-14 items-center justify-center rounded-lg border border-emerald-400 bg-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                            style={{ transform: 'translateZ(30px)' }}
                        >
                            <Package className="h-7 w-7 text-emerald-50" />
                        </motion.div>

                        {/* Automated Forklift / Node 2 */}
                        <motion.div 
                            animate={{ 
                                x: [120, 0, 0, 120, 120], 
                                y: [120, 120, 0, 0, 120] 
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute left-4 top-4 flex h-14 w-14 items-center justify-center rounded-lg border border-blue-400 bg-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                            style={{ transform: 'translateZ(45px)' }}
                        >
                            <Package className="h-7 w-7 text-blue-50" />
                        </motion.div>

                        {/* Central Processing Hub */}
                        <motion.div 
                            className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border-2 border-amber-400 bg-amber-500/90 shadow-[0_0_40px_rgba(245,158,11,0.6)]"
                            style={{ transform: 'translateZ(60px)' }}
                        >
                            <div className="flex h-full w-full items-center justify-center">
                                <Boxes className="h-10 w-10 text-amber-50" />
                            </div>
                            {/* Scanning Beam Animation */}
                            <motion.div 
                                animate={{ top: ['-10%', '110%', '-10%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 w-full h-1 bg-white shadow-[0_0_15px_2px_rgba(255,255,255,1)]"
                            />
                        </motion.div>
                        
                        {/* Data flowing up */}
                        <motion.div 
                            animate={{ opacity: [0, 1, 0], z: [60, 150] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                            className="absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-md"
                        >
                            <ArrowUpRight className="h-3 w-3 text-white" />
                        </motion.div>
                    </motion.div>
                </div>
            </div>
            
            {/* Descriptive text at the bottom */}
            <div className="absolute bottom-10 w-full max-w-sm px-6 text-center">
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-3xl font-bold tracking-tight text-white"
                >
                    Intelligent Inventory Management
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-3 text-sm leading-relaxed text-zinc-400"
                >
                    Visualize your inventory with real-time stock levels and added advantage of tracking products with batch numbers and expiry dates.
                </motion.p>
            </div>
        </div>
    );
}
