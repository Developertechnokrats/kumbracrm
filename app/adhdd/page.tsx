import { Zap, Rocket, Brain, Target, Gauge } from 'lucide-react'

export default function ADHDDPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>

      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-slate-600 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="flex flex-col items-center text-center space-y-12 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium backdrop-blur-sm">
              <Zap className="w-4 h-4" />
              Built by ADHDD minds. For people who don't sit still.
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-slate-200 via-blue-300 to-slate-200 bg-clip-text text-transparent">
                  HyperCRM
                </span>
              </h1>
              <p className="text-xl sm:text-2xl md:text-3xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
                Because focus isn't about slowing down — it's about aiming chaos in the right direction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-16">
              <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <Gauge className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">Hyper-Focus Ready</h3>
                <p className="text-slate-400 text-sm">When you're in the zone, everything flows. Zero lag, instant actions.</p>
              </div>

              <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">Organized Chaos</h3>
                <p className="text-slate-400 text-sm">We don't just manage clients. We manage momentum.</p>
              </div>

              <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <Brain className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">Intelligent Design</h3>
                <p className="text-slate-400 text-sm">Where distraction becomes precision. Built by the distracted, perfected by the obsessed.</p>
              </div>
            </div>

            <div className="mt-16 space-y-8 max-w-3xl">
              <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-slate-200 mb-4">About HyperCRM</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  HyperCRM wasn't built in silence — it was born in a storm. Between dopamine hits, 4 a.m. ideas, and too many browser tabs, we created something powerful: a CRM that thinks like us.
                </p>
                <p className="text-slate-300 leading-relaxed mb-4">
                  It's fast. It's visual. It's alive. Because when your brain runs at 200 mph, your tools need to keep up.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  We call it HyperCRM — the platform designed for neurodivergent brilliance, built by ADHDD (Attention Deficit Hyper-Driven Development).
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-slate-200 mb-4">Our Philosophy</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  ADHD isn't a flaw — it's a feature. We just built software that understands that.
                </p>
                <ul className="space-y-2 text-slate-300">
                  <li>💥 Hyper-focus ready. When you're in the zone, everything flows.</li>
                  <li>⚙️ Instant actions. No 12-click workflows — just do it.</li>
                  <li>🧩 Modular chaos. Add what you need, ignore what you don't.</li>
                  <li>🧠 Neuro-intuitive design. Visual, dopamine-friendly, satisfying to use.</li>
                  <li>⏱️ Zero lag. Because your brain doesn't wait.</li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                <p className="text-slate-300 text-lg leading-relaxed mb-4 italic">
                  "I built HyperCRM because I got tired of CRMs that felt like homework. ADHD doesn't mean I can't focus — it means I need the right kind of focus. So I made one. A CRM that moves as fast as my brain."
                </p>
                <p className="text-slate-400 font-medium">
                  — Created by ADHDD
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-slate-200 mb-4">Slogans We Live By</h2>
                <div className="space-y-2 text-slate-300 text-sm">
                  <p>"Organized chaos, beautifully systemized."</p>
                  <p>"Built by the distracted. Perfected by the obsessed."</p>
                  <p>"Where hyper-focus meets hyper-growth."</p>
                  <p>"Dopamine-driven productivity."</p>
                  <p>"Because normal CRMs are boring."</p>
                  <p>"Made by ADHDD. Powered by caffeine."</p>
                  <p>"If you can think it, HyperCRM can handle it — before you forget."</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500 max-w-2xl">
              <span>⚡ Made by ADHDD</span>
              <span>•</span>
              <span>🧠 Where hyper-focus meets hyper-growth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
