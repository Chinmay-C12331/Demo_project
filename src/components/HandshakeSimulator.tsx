import React, { useState, useEffect } from 'react';
import { HANDSHAKE_SUITES } from '../data/pqcAlgorithms';
import { HandshakeSuite, HandshakeStep } from '../types/pqc';
import { 
  Play, 
  RotateCcw, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Layers, 
  Zap,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  FileCode2
} from 'lucide-react';

interface HandshakeSimulatorProps {
  onHighlightLattice?: () => void;
}

export const HandshakeSimulator: React.FC<HandshakeSimulatorProps> = ({ onHighlightLattice }) => {
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('suite-hybrid-standard');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mtuSize, setMtuSize] = useState<number>(1500);
  const [simulatedPacketLoss, setSimulatedPacketLoss] = useState<number>(0);
  const [attackTriggered, setAttackTriggered] = useState<boolean>(false);
  const [attackResult, setAttackResult] = useState<{
    success: boolean;
    title: string;
    description: string;
    recoveredSecret?: string;
  } | null>(null);

  const suite: HandshakeSuite = HANDSHAKE_SUITES.find(s => s.id === selectedSuiteId) || HANDSHAKE_SUITES[0];

  // Derive steps based on suite and MTU
  const calculateSteps = (currentSuite: HandshakeSuite, mtu: number): HandshakeStep[] => {
    const isHybrid = currentSuite.isHybrid;
    const isClassical = !currentSuite.isQuantumSafe;
    const clientHelloBytes = currentSuite.clientHelloBytes;
    const serverHelloBytes = currentSuite.serverHelloBytes;
    const certChainBytes = currentSuite.certChainBytes;

    const effectiveMss = mtu - 40; // 20B IPv4/IPv6 + 20B TCP header

    return [
      {
        stepNumber: 1,
        source: 'Client',
        messageName: 'ClientHello + KeyShare',
        packetSize: clientHelloBytes,
        description: isClassical 
          ? 'Client offers X25519 public key (32 bytes) + standard cipher suites.' 
          : isHybrid 
            ? 'Client offers dual KeyShare: X25519 (32B) + ML-KEM-768 public key (1,184B). Total key share: 1,216 bytes.'
            : 'Client offers NIST FIPS 203 ML-KEM-768 public key (1,184 bytes).',
        fragmented: clientHelloBytes > effectiveMss,
        segmentsCount: Math.ceil(clientHelloBytes / effectiveMss),
        cryptographicOperation: isClassical 
          ? 'ECDH KeyGen: sk_c ∈ [1, 2^256-1], pk_c = sk_c * G' 
          : 'ML-KEM.KeyGen(): A ∈ R_q^(k×k), s, e ← χ, pk = (A·s + e, seed_A)',
        hexPreview: isClassical
          ? '16 03 01 01 7e 01 00 01 7a 03 03 72 e9 a4 22 81 ... [382 bytes total]'
          : '16 03 01 06 1c 01 00 06 18 03 03 4b 88 19 a0 92 ... [KeyShare: 1,216 bytes - Ext 0x6399]',
        quantumVulnerable: isClassical
      },
      {
        stepNumber: 2,
        source: 'Server',
        messageName: 'ServerHello + KeyShare (Encapsulation)',
        packetSize: serverHelloBytes,
        description: isClassical
          ? 'Server responds with X25519 public key share (32 bytes) and selected cipher.'
          : isHybrid
            ? 'Server performs ML-KEM.Encaps(pk_client) returning 1,088B ciphertext + 32B X25519 share.'
            : 'Server encapsulates shared secret using ML-KEM-768 producing 1,088B ciphertext.',
        fragmented: serverHelloBytes > effectiveMss,
        segmentsCount: Math.ceil(serverHelloBytes / effectiveMss),
        cryptographicOperation: isClassical
          ? 'ECDH Compute: SS = sk_s * pk_c (X25519 scalar mult)'
          : 'ML-KEM.Encaps(pk): (c, K) ← ML-KEM.Encaps(pk_c); HKDF-Extract(SS_ecdh || K)',
        hexPreview: isClassical
          ? '16 03 03 00 7a 02 00 00 76 03 03 9a 11 44 2f ... [246 bytes total]'
          : '16 03 03 05 28 02 00 05 24 03 03 12 3a fe 09 ... [Ciphertext c: 1,088 bytes]',
        quantumVulnerable: isClassical
      },
      {
        stepNumber: 3,
        source: 'Server',
        messageName: 'EncryptedExtensions + Certificate + CertVerify + Finished',
        packetSize: certChainBytes,
        description: currentSuite.signature.includes('ML-DSA')
          ? 'Server sends post-quantum ML-DSA-65 certificate chain (3 certificates @ ~3.3KB sig each). High packet bloat!'
          : 'Server sends classic ECDSA or Ed25519 certificate chain and cryptographic proof.',
        fragmented: certChainBytes > effectiveMss,
        segmentsCount: Math.ceil(certChainBytes / effectiveMss),
        cryptographicOperation: currentSuite.signature.includes('ML-DSA')
          ? 'ML-DSA-65.Sign(sk_server, HandshakeTranscriptHash): generates 3,309B signature'
          : 'ECDSA.Sign(sk_server, Hash): generates 64-byte signature (r, s)',
        hexPreview: currentSuite.signature.includes('ML-DSA')
          ? '17 03 03 2e 40 [Record Length: 11,840 bytes split across multiple TCP frames] ...'
          : '17 03 03 0a 5a [Record Length: 2,650 bytes, ECDSA secp256r1 signature] ...',
        quantumVulnerable: isClassical
      },
      {
        stepNumber: 4,
        source: 'Client',
        messageName: 'Client Finished & Key Confirmation',
        packetSize: 64,
        description: 'Client decapsulates ML-KEM ciphertext (or validates ECDH), confirms handshake transcript hash, and activates symmetric AES-GCM / ChaCha keys.',
        fragmented: false,
        segmentsCount: 1,
        cryptographicOperation: 'K = ML-KEM.Decaps(sk_c, c); Derive client_app_key & server_app_key via HKDF-Expand',
        hexPreview: '17 03 03 00 34 [HMAC-SHA256 Transcript verification tag: 32 bytes]',
        quantumVulnerable: isClassical
      },
      {
        stepNumber: 5,
        source: 'Client',
        messageName: 'Secure Application Data (HTTP/2 / HTTP/3)',
        packetSize: 512,
        description: 'Session now operational. Symmetric encryption using AES-256-GCM. 256-bit symmetric keys provide 128-bit quantum security under Grover\'s algorithm.',
        fragmented: false,
        segmentsCount: 1,
        cryptographicOperation: 'AES-256-GCM Encrypt(nonce, app_key, "GET /api/v1/financial-ledger")',
        hexPreview: '17 03 03 02 00 e4 81 99 2f c1 0a ... [Authenticated Encrypted Payload]',
        quantumVulnerable: false
      }
    ];
  };

  const steps = calculateSteps(suite, mtuSize);

  // Auto-play timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, steps.length]);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setAttackTriggered(false);
    setAttackResult(null);
  };

  const executeQuantumAttack = () => {
    setAttackTriggered(true);
    if (!suite.isQuantumSafe) {
      // Classical attack succeeds via Shor's algorithm
      setAttackResult({
        success: true,
        title: "Session Compromised by Shor's Algorithm",
        description: "A quantum computer executing Shor's Algorithm solved the Elliptic Curve Discrete Logarithm Problem (ECDLP) in polynomial time O((log N)³). The pre-master secret was extracted from the intercepted ClientHello and ServerHello wire logs.",
        recoveredSecret: "0x7F9B1E42A9C3048591823485E924B701F92EAA314890B7CD81"
      });
    } else {
      // Post-quantum or hybrid resists Shor's algorithm
      setAttackResult({
        success: false,
        title: "Quantum Decryption Failed: Lattice Hardness Intact",
        description: `Shor's Algorithm cannot be applied to Module-LWE (ML-KEM-768). There is no periodic hidden subgroup over lattice vector spaces. Grover's search algorithm on AES-256 only yields a quadratic speedup, leaving 128-bit quantum security (2¹²⁸ quantum operations, mathematically intractable). Confidentiality is preserved against Harvest-Now-Decrypt-Later (HNDL).`
      });
    }
  };

  const currentStep = steps[currentStepIndex];

  return (
    <div className="space-y-6">
      {/* Top Protocol Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
              Interactive Protocol Workbench
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              TLS 1.3 & VPN Handshake Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare packet wire footprints, TCP fragmentation thresholds, and quantum cryptanalysis resistance.
            </p>
          </div>

          {/* Handshake suite selector */}
          <div className="flex flex-wrap items-center gap-2">
            {HANDSHAKE_SUITES.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSuiteId(s.id);
                  handleReset();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  selectedSuiteId === s.id
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Suite Technical Kicker */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Key Exchange (KEM)</span>
            <span className="font-mono text-cyan-300 font-medium">{suite.kem}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Authentication / Cert</span>
            <span className="font-mono text-slate-200 font-medium">{suite.signature}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Total Wire Size</span>
            <span className="font-mono text-slate-200 font-medium">{suite.totalHandshakeBytes.toLocaleString()} bytes</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Quantum Status</span>
            <span className={`font-mono font-medium flex items-center gap-1.5 ${
              suite.isQuantumSafe ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {suite.isQuantumSafe ? <CheckCircle2 className="w-3.5 h-3.5 inline" /> : <AlertTriangle className="w-3.5 h-3.5 inline" />}
              {suite.isQuantumSafe ? (suite.isHybrid ? 'Protected (Hybrid)' : 'Quantum Safe') : 'Vulnerable (HNDL)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Handshake Stage: 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Handshake Flow & Packet Wire Sequence (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-slate-200">
                  Step {currentStep.stepNumber} of {steps.length}: {currentStep.messageName}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Origin: <span className="text-cyan-400 font-semibold">{currentStep.source}</span>
              </div>
            </div>

            {/* Visual Client <---> Server wire diagram */}
            <div className="my-6 relative py-4 px-6 bg-slate-950/60 rounded border border-slate-800/80">
              <div className="flex justify-between items-center mb-6 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-cyan-300 font-semibold">Client (Web Browser / Host)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-300 font-semibold">Server (Edge CDN / Gateway)</span>
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                </div>
              </div>

              {/* Steps timeline in wire */}
              <div className="space-y-3">
                {steps.map((st, idx) => {
                  const isActive = idx === currentStepIndex;
                  const isPast = idx < currentStepIndex;
                  const isClientOrigin = st.source === 'Client';

                  return (
                    <div
                      key={st.stepNumber}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`cursor-pointer p-2 rounded transition-all flex items-center justify-between text-xs ${
                        isActive
                          ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-100 shadow-sm'
                          : isPast
                          ? 'text-slate-400 hover:bg-slate-800/60'
                          : 'text-slate-500 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px]">
                          {st.stepNumber}
                        </span>
                        <span className="font-medium">{st.messageName}</span>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-400">{st.packetSize} B</span>
                        {st.fragmented && (
                          <span className="text-amber-400 text-[10px] flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            {st.segmentsCount} segs
                          </span>
                        )}
                        <span className={isClientOrigin ? 'text-cyan-400' : 'text-indigo-400'}>
                          {isClientOrigin ? 'Client ➔ Server' : 'Server ➔ Client'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Step Technical Breakdown */}
            <div className="space-y-3 bg-slate-950/80 p-4 rounded border border-slate-800">
              <div className="text-xs text-slate-300 leading-relaxed">
                {currentStep.description}
              </div>

              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  CRYPTOGRAPHIC OPERATION:
                </span>
                <div className="bg-slate-900 px-3 py-2 rounded font-mono text-xs text-cyan-300 border border-slate-800 break-all">
                  {currentStep.cryptographicOperation}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  PACKET WIRE HEX PREVIEW:
                </span>
                <div className="bg-slate-900 px-3 py-2 rounded font-mono text-[11px] text-slate-300 border border-slate-800 break-all leading-tight">
                  {currentStep.hexPreview}
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 rounded transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNextStep}
                disabled={currentStepIndex === steps.length - 1}
                className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-medium rounded transition-colors flex items-center gap-1"
              >
                Next Step
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors flex items-center gap-1"
              >
                <Play className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-400 fill-amber-400' : ''}`} />
                {isPlaying ? 'Pause' : 'Auto Flow'}
              </button>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Right Column: MTU Fragmentation & Quantum Threat Analysis (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* MTU & Fragmentation Meter */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Network MTU & Fragmentation</h3>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                MTU: {mtuSize} bytes
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Standard Ethernet Maximum Transmission Unit (MTU) is 1,500 bytes. When a TLS record exceeds this limit, IP fragmentation or TCP MSS segmentation occurs.
            </p>

            {/* Interactive MTU selector */}
            <div className="flex gap-2 mb-4">
              {[
                { label: 'Standard (1500B)', val: 1500 },
                { label: 'IPv6 Min (1280B)', val: 1280 },
                { label: 'Jumbo Cloud (9000B)', val: 9000 },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setMtuSize(opt.val)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors font-mono ${
                    mtuSize === opt.val
                      ? 'bg-slate-700 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Visual Packet vs MTU Bar */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Current Step Packet Size</span>
                  <span className="text-white font-semibold">{currentStep.packetSize} bytes</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 relative">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentStep.packetSize > mtuSize ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (currentStep.packetSize / mtuSize) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {currentStep.packetSize > mtuSize ? (
                <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">TCP Segmentation Detected</span>
                    Packet exceeds MTU of {mtuSize}B. Split into <strong>{currentStep.segmentsCount} TCP packets</strong>.
                    If packet loss occurs, head-of-line blocking adds 1 RTT latency.
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fits cleanly inside 1 standard IP packet. Zero fragmentation.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quantum Threat Simulator (Shor's & HNDL) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Quantum Adversary Simulation</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Shor's & Grover's Test
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Simulate an adversary equipped with a Cryptanalytically Relevant Quantum Computer (CRQC) executing Shor's quantum period-finding attack against this active session.
            </p>

            <button
              onClick={executeQuantumAttack}
              className={`w-full py-2.5 px-4 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                suite.isQuantumSafe
                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
              }`}
            >
              <Zap className="w-4 h-4" />
              {suite.isQuantumSafe ? 'Test Quantum Resistance on ML-KEM' : 'Execute Shor\'s Quantum Attack on Session'}
            </button>

            {attackTriggered && attackResult && (
              <div className={`mt-4 p-4 rounded border text-xs leading-relaxed ${
                attackResult.success
                  ? 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                  : 'bg-cyan-950/50 border-cyan-500/40 text-cyan-200'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1.5 text-sm">
                  {attackResult.success ? (
                    <>
                      <Unlock className="w-4 h-4 text-rose-400" />
                      <span className="text-rose-300">{attackResult.title}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-300">{attackResult.title}</span>
                    </>
                  )}
                </div>

                <p className="mb-2">{attackResult.description}</p>

                {attackResult.recoveredSecret && (
                  <div className="mt-2 bg-slate-950 p-2.5 rounded font-mono text-[11px] text-rose-300 border border-rose-900/60 break-all">
                    <span className="text-slate-400 block mb-0.5 text-[10px]">RECOVERED PRE-MASTER SECRET:</span>
                    {attackResult.recoveredSecret}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
