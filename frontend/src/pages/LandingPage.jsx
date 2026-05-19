import { Link } from 'react-router-dom';
import { Leaf, Shield, QrCode, Link2, Cpu, ChevronRight, Check, Zap, Globe } from 'lucide-react';

const features = [
  {
    icon: Link2,
    title: 'Blockchain Immutability',
    desc: 'Every supply chain event is cryptographically recorded on blockchain — tamper-proof and transparent.',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    icon: QrCode,
    title: 'QR Verification',
    desc: 'Consumers scan a QR code to instantly verify product authenticity, origin, and full traceability history.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Shield,
    title: 'Tamper Detection',
    desc: 'SHA-256 hash chaining ensures any data manipulation is immediately detected and flagged.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Cpu,
    title: 'AI Sensor Ready',
    desc: 'Architecture is future-ready for AI E-Tongue sensors to detect adulteration and verify herb purity.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Globe,
    title: 'End-to-End Traceability',
    desc: 'Track every step from farm harvest to consumer — farmer, lab, manufacturer, distributor, regulator.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Zap,
    title: 'Real-Time Alerts',
    desc: 'WebSocket-powered live notifications for every supply chain event across all stakeholders.',
    color: 'from-violet-500 to-purple-600',
  },
];

const timeline = [
  { step: '01', label: 'Harvest', desc: 'Farmer logs herb harvest with GPS location', color: 'bg-green-500' },
  { step: '02', label: 'Lab Testing', desc: 'NABL-certified lab verifies quality parameters', color: 'bg-blue-500' },
  { step: '03', label: 'Manufacturing', desc: 'GMP-compliant processing under blockchain record', color: 'bg-purple-500' },
  { step: '04', label: 'Packaging', desc: 'QR-sealed tamper-proof packaging generated', color: 'bg-amber-500' },
  { step: '05', label: 'Distribution', desc: 'Supply chain dispatched with tracking', color: 'bg-pink-500' },
  { step: '06', label: 'Verification', desc: 'Regulator approves, consumer scans QR', color: 'bg-emerald-500' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-chain-dark overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-5 border-b border-white/[0.06] backdrop-blur-sm sticky top-0 z-10 bg-chain-dark/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-neon">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">RASA-CHAIN</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/verify" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
            Verify Product
          </Link>
          <Link to="/login" className="btn-secondary text-sm px-4 py-2">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 lg:px-16 pt-24 pb-32 text-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-2 text-sm text-indigo-400 mb-8">
            <div className="w-2 h-2 rounded-full bg-indigo-400 node-pulse" />
            Phase 1 MVP · Blockchain-Powered
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
            Authenticate Every
            <br />
            <span className="gradient-text">Herbal Product</span>
            <br />
            on Blockchain
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            RASA-CHAIN brings full traceability to Ayurvedic & herbal products.
            From farm to shelf — every step immutably recorded, instantly verifiable by anyone.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-3.5">
              Start Tracing Products
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link to="/verify" className="btn-secondary flex items-center gap-2 text-base px-8 py-3.5">
              <QrCode className="w-5 h-5" />
              Verify a Product
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16">
            {[
              { value: '6+', label: 'Stakeholder Roles' },
              { value: '100%', label: 'Immutable Records' },
              { value: '∞', label: 'Scalable' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-black gradient-text">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Why RASA-CHAIN?</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Built for the ₹50,000 crore Indian herbal industry to combat adulteration and build consumer trust.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div key={feature.title} className="glass-card-hover p-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supply Chain Timeline */}
      <section className="px-6 lg:px-16 py-24 bg-white/[0.01]">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Full Supply Chain Coverage</h2>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-purple-500 to-emerald-500 opacity-30 hidden sm:block" />
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={item.step} className="flex items-start gap-6 pl-0 sm:pl-4">
                  <div className={`w-9 h-9 rounded-full ${item.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative z-10`}>
                    {item.step}
                  </div>
                  <div className="glass-card flex-1 p-4 flex items-center gap-4">
                    <div>
                      <h4 className="font-bold text-white">{item.label}</h4>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                    <Check className="w-5 h-5 text-emerald-400 ml-auto flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="px-6 lg:px-16 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Built for Every Stakeholder</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {[
            { role: 'Admin', emoji: '⚡', desc: 'Full system control' },
            { role: 'Farmer', emoji: '🌿', desc: 'Harvest logging' },
            { role: 'Manufacturer', emoji: '🏭', desc: 'Batch management' },
            { role: 'Quality Lab', emoji: '🔬', desc: 'Testing & reports' },
            { role: 'Regulator', emoji: '🏛️', desc: 'Compliance review' },
            { role: 'Consumer', emoji: '👤', desc: 'QR verification' },
          ].map((item) => (
            <div key={item.role} className="glass-card p-4 text-center hover:border-indigo-500/30 transition-all duration-300 cursor-default">
              <div className="text-3xl mb-2">{item.emoji}</div>
              <p className="text-sm font-bold text-white">{item.role}</p>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-16 py-24">
        <div className="max-w-3xl mx-auto text-center neon-border rounded-3xl p-12 bg-indigo-600/5">
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to Secure Your
            <br />
            <span className="gradient-text">Herbal Supply Chain?</span>
          </h2>
          <p className="text-gray-400 mb-8">Join the blockchain-powered revolution in Ayurvedic product traceability.</p>
          <Link to="/register" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2">
            Launch Your Chain
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-chain-border px-6 lg:px-16 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-indigo-400" />
            <span className="text-sm gradient-text font-bold">RASA-CHAIN</span>
            <span className="text-xs text-gray-600">v1.0.0 · Phase 1 MVP</span>
          </div>
          <p className="text-xs text-gray-600">Blockchain-powered Herbal Supply Chain Traceability Platform</p>
        </div>
      </footer>
    </div>
  );
}
