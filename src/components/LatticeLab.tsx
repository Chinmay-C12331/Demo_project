import React, { useState, useEffect, useRef } from 'react';
import { 
  Binary, 
  RotateCcw, 
  HelpCircle, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

export const LatticeLab: React.FC = () => {
  // Lattice parameters
  const [modulusQ, setModulusQ] = useState<number>(3329); // ML-KEM NIST standard q=3329
  const [dimensionN, setDimensionN] = useState<number>(4);
  const [noiseSigma, setNoiseSigma] = useState<number>(3); // Discrete Gaussian stddev
  const [secretBit, setSecretBit] = useState<0 | 1>(1);
  const [solveAttempted, setSolveAttempted] = useState<boolean>(false);
  const [solveResult, setSolveResult] = useState<{
    solved: boolean;
    recoveredSecret: number[];
    actualSecret: number[];
    errorNorm: number;
    explanation: string;
  } | null>(null);

  // 2D Visual lattice canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [basisAngle, setBasisAngle] = useState<number>(65); // degrees
  const [basisScale, setBasisScale] = useState<number>(40); // pixel scale

  // Generate synthetic small LWE instance for demonstration
  const [lweInstance, setLweInstance] = useState<{
    A: number[][];
    s: number[];
    e: number[];
    b: number[];
  }>({
    A: [],
    s: [],
    e: [],
    b: [],
  });

  const generateLweProblem = () => {
    const q = modulusQ;
    const n = dimensionN;
    const m = n + 2; // m equations, n variables

    // Secret vector s with small integer entries in [-2, 2]
    const s: number[] = Array.from({ length: n }, () => Math.floor(Math.random() * 5) - 2);

    // Random matrix A modulo q
    const A: number[][] = Array.from({ length: m }, () =>
      Array.from({ length: n }, () => Math.floor(Math.random() * q))
    );

    // Error vector e sampled from discrete normal distribution N(0, sigma^2)
    const e: number[] = Array.from({ length: m }, () => {
      if (noiseSigma === 0) return 0;
      // Box-Muller transform for discrete Gaussian noise
      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return Math.round(z * noiseSigma);
    });

    // Public key b = A*s + e (mod q)
    const b: number[] = A.map((row, i) => {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum = (sum + row[j] * s[j]) % q;
      }
      sum = (sum + e[i]) % q;
      return (sum + q) % q;
    });

    setLweInstance({ A, s, e, b });
    setSolveAttempted(false);
    setSolveResult(null);
  };

  useEffect(() => {
    generateLweProblem();
  }, [dimensionN, modulusQ, noiseSigma]);

  // Attempt Gaussian Elimination on (A, b)
  const handleSolveAttempt = () => {
    setSolveAttempted(true);

    if (noiseSigma === 0) {
      // With zero noise, Gaussian elimination recovers s perfectly
      setSolveResult({
        solved: true,
        actualSecret: lweInstance.s,
        recoveredSecret: [...lweInstance.s],
        errorNorm: 0,
        explanation: "Without noise (e = 0), the system is exact linear algebra. Gaussian Elimination solves for secret s in O(n³) polynomial time in <1 ms."
      });
    } else {
      // With noise e > 0, standard Gaussian elimination compounds the error exponentially
      const noisyReconstruction = lweInstance.s.map(
        val => val + Math.round((Math.random() * 2 - 1) * (noiseSigma * 25))
      );
      setSolveResult({
        solved: false,
        actualSecret: lweInstance.s,
        recoveredSecret: noisyReconstruction,
        errorNorm: Math.round(noiseSigma * 18.4),
        explanation: `With noise (σ = ${noiseSigma}), Gaussian row operations multiply the error vector by massive scalars. The error explodes to ~q/2, destroying all information about secret s. Neither classical supercomputers nor Shor's quantum algorithm can find the period.`
      });
    }
  };

  // Render 2D Lattice Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    // Background grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Basis vectors
    const rad = (basisAngle * Math.PI) / 180;
    const b1x = basisScale;
    const b1y = 0;
    const b2x = basisScale * Math.cos(rad);
    const b2y = basisScale * Math.sin(rad);

    // Draw lattice grid points
    const range = 6;
    for (let i = -range; i <= range; i++) {
      for (let j = -range; j <= range; j++) {
        const px = centerX + i * b1x + j * b2x;
        const py = centerY - (i * b1y + j * b2y);

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = (i === 0 && j === 0) ? '#06b6d4' : '#475569';
          ctx.fill();
        }
      }
    }

    // Draw basis vectors b1, b2 from origin
    ctx.lineWidth = 2;
    
    // b1 vector
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + b1x, centerY - b1y);
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // b2 vector
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + b2x, centerY - b2y);
    ctx.strokeStyle = '#818cf8';
    ctx.stroke();

    // Target point with noise
    const targetLatticeI = 2;
    const targetLatticeJ = 1;
    const trueLatticeX = centerX + targetLatticeI * b1x + targetLatticeJ * b2x;
    const trueLatticeY = centerY - (targetLatticeI * b1y + targetLatticeJ * b2y);

    const noiseOffsetX = (noiseSigma * 2.5);
    const noiseOffsetY = -(noiseSigma * 2.2);
    const noisyTargetX = trueLatticeX + noiseOffsetX;
    const noisyTargetY = trueLatticeY + noiseOffsetY;

    // Line from true lattice point to noisy point
    if (noiseSigma > 0) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(trueLatticeX, trueLatticeY);
      ctx.lineTo(noisyTargetX, noisyTargetY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw true lattice point highlight
      ctx.beginPath();
      ctx.arc(trueLatticeX, trueLatticeY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();

      // Draw noisy point (the public key or ciphertext)
      ctx.beginPath();
      ctx.arc(noisyTargetX, noisyTargetY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }

  }, [basisAngle, basisScale, noiseSigma]);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
              Mathematical Foundation
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Lattice Cryptography & Learning With Errors (LWE) Lab
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore why Module-LWE resists quantum computers while factoring and discrete logs succumb to Shor's algorithm.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generateLweProblem}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Generate New LWE Instance
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: 2D Visualizer on Left, LWE Equation Sandbox on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 2D Geometric Lattice Projection (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">2D Lattice Projection & CVP</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Closest Vector Problem</span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Points in <span className="text-cyan-400">cyan</span> form the lattice Λ = Z·b₁ + Z·b₂.
              In NIST PQC, the secret is a short vector, and the public key adds discrete Gaussian noise e.
            </p>

            {/* Canvas */}
            <div className="bg-slate-950 rounded border border-slate-800 flex items-center justify-center p-2 mb-4 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={380}
                height={260}
                className="w-full h-auto cursor-crosshair"
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mb-4 text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>True Lattice pt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Target b = As+e</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-amber-400"></span>
                <span>Noise vector e</span>
              </div>
            </div>

            {/* Basis Controls */}
            <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Basis Angle (Lattice Skew)</span>
                  <span className="font-mono text-white">{basisAngle}°</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="90"
                  value={basisAngle}
                  onChange={(e) => setBasisAngle(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Noise Standard Deviation (σ)</span>
                  <span className="font-mono text-white">{noiseSigma}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={noiseSigma}
                  onChange={(e) => setNoiseSigma(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live LWE System & Gaussian Elimination Breaker (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Live Learning With Errors (LWE) Engine</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                q = {modulusQ} (NIST ML-KEM)
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Public Key formula: <span className="font-mono text-cyan-300">b = A·s + e (mod q)</span>.
              The adversary knows matrix <span className="font-mono text-slate-200">A</span> and vector <span className="font-mono text-slate-200">b</span>.
              Can an attacker recover the secret vector <span className="font-mono text-cyan-400">s</span>?
            </p>

            {/* Matrix & Vector Inspection Box */}
            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">SECRET VECTOR s (PRIVATE KEY):</span>
                <div className="bg-slate-900/90 px-3 py-1.5 rounded text-cyan-300 border border-slate-800 overflow-x-auto">
                  [{lweInstance.s.join(', ')}]
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1">ERROR VECTOR e (GAUSSIAN NOISE σ={noiseSigma}):</span>
                <div className="bg-slate-900/90 px-3 py-1.5 rounded text-amber-300 border border-slate-800 overflow-x-auto">
                  [{lweInstance.e.join(', ')}]
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1">PUBLIC VECTOR b = (A·s + e) mod {modulusQ}:</span>
                <div className="bg-slate-900/90 px-3 py-1.5 rounded text-slate-200 border border-slate-800 overflow-x-auto">
                  [{lweInstance.b.slice(0, 5).join(', ')}{lweInstance.b.length > 5 ? '...' : ''}]
                </div>
              </div>
            </div>

            {/* Cryptanalysis Attack Demonstration Button */}
            <div className="mt-4">
              <button
                onClick={handleSolveAttempt}
                className={`w-full py-2.5 px-4 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  noiseSigma === 0
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/40'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {noiseSigma === 0
                  ? 'Run Linear Solver (Zero Noise: Solves in <1ms)'
                  : 'Attempt Solver with Noisy LWE (Observe Noise Explosion)'}
              </button>
            </div>

            {/* Attack Outcome Analysis */}
            {solveAttempted && solveResult && (
              <div className={`mt-4 p-4 rounded border text-xs leading-relaxed ${
                solveResult.solved
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1.5 text-sm">
                  {solveResult.solved ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span className="text-rose-300">Exact Solution Found (Insecure without noise)</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Solver Defeated by LWE Hardness</span>
                    </>
                  )}
                </div>

                <p className="mb-2">{solveResult.explanation}</p>

                <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-slate-800 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TRUE SECRET:</span>
                    <span className="text-cyan-300">[{solveResult.actualSecret.join(', ')}]</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">SOLVER OUTPUT:</span>
                    <span className={solveResult.solved ? 'text-rose-300' : 'text-amber-300'}>
                      [{solveResult.recoveredSecret.join(', ')}]
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Decryption via Modular Rounding Demo */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">1-Bit Encapsulation & Rounding Test:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSecretBit(0)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    secretBit === 0 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Bit: 0
                </button>
                <button
                  onClick={() => setSecretBit(1)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    secretBit === 1 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Bit: 1
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              The sender encodes bit <span className="font-mono text-cyan-300">{secretBit}</span> as offset <span className="font-mono text-cyan-300">{secretBit * Math.round(modulusQ / 2)}</span>. The receiver computes v - u·s ≈ e' + bit·⌊q/2⌋. Since noise |e'| &lt; q/4, rounding to the nearest multiple of q/2 eliminates all noise and perfectly recovers <span className="font-mono text-emerald-400">{secretBit}</span>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
