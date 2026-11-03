export type AlgorithmCategory = 'KEM' | 'Signature' | 'Classical_KEM' | 'Classical_Sig' | 'Hybrid';

export interface PQCAlgorithm {
  id: string;
  name: string;
  standard: string; // e.g. "NIST FIPS 203", "Classical", "RFC draft"
  category: AlgorithmCategory;
  family: 'Lattice (MLWE)' | 'Lattice (NTRU)' | 'Hash-Based' | 'Elliptic Curve' | 'RSA' | 'Hybrid';
  nistLevel: 1 | 2 | 3 | 5 | 0; // 0 for broken by quantum
  publicKeyBytes: number;
  privateKeyBytes: number;
  cipherOrSigBytes: number;
  quantumResistant: boolean;
  keygenCycles: number; // in thousands of cycles
  encOrSignCycles: number;
  decOrVerifyCycles: number;
  description: string;
  networkImpact: string;
}

export type HandshakeProtocol = 'TLS_1_3' | 'SSH_2' | 'WIREGUARD' | 'IPSEC_IKEV2';

export interface HandshakeSuite {
  id: string;
  name: string;
  protocol: HandshakeProtocol;
  kem: string;
  signature: string;
  symmetric: string;
  isQuantumSafe: boolean;
  isHybrid: boolean;
  clientHelloBytes: number;
  serverHelloBytes: number;
  certChainBytes: number;
  totalHandshakeBytes: number;
  tcpSegmentsAt1500MTU: number;
  amplificationFactor: number;
  description: string;
}

export interface HandshakeStep {
  stepNumber: number;
  source: 'Client' | 'Server';
  messageName: string;
  packetSize: number;
  description: string;
  fragmented: boolean;
  segmentsCount: number;
  cryptographicOperation: string;
  hexPreview: string;
  quantumVulnerable: boolean;
}

export interface NetworkNode {
  id: string;
  name: string;
  role: string;
  ip: string;
  protocol: 'HTTPS / TLS 1.3' | 'SSH' | 'IPsec IKEv2' | 'mTLS / Envoy' | 'Database Wire';
  currentSuite: string;
  isUpgraded: boolean;
  vulnerabilityStatus: 'CRITICAL_VULNERABLE' | 'HARVEST_RISK' | 'PROTECTED_HYBRID' | 'FULLY_QUANTUM_RESISTANT';
  mtu: number;
  activeSessions: number;
  recommendedUpgrade: string;
  rfcStandard: string;
  notes: string;
}
