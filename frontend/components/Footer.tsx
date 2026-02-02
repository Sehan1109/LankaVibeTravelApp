import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-slate-950 text-slate-300 pt-16 pb-8 overflow-hidden border-t border-slate-800">

      {/* --- Futuristic Background Elements --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
        {/* Subtle Glow on right side */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-emerald-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* --- Main Content Area --- */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">

          {/* Left: Brand & Socials */}
          <div className="max-w-md space-y-6">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tighter text-white">
                Lanka<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Vibe</span>
              </span>
            </Link>

            <p className="text-slate-400 leading-relaxed">
              The first AI-powered travel concierge for Sri Lanka. We blend neural networks with local knowledge to craft journeys that adapt to you.
            </p>

            
          </div>

          {/* Right: Platform Links */}
          <div className="w-full md:w-auto md:text-right">
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4">
              {[
                {
                  label: 'Home',
                  path: '/',
                  onClick: () =>
                    window.scrollTo({ top: 0, behavior: 'smooth' }),
                },
                {
                  label: 'AI Planner',
                  path: '/planner',
                },
                {
                  label: 'Tour Packages',
                  path: '/packages',
                },
              ].map((item) => (
                <li key={item.label}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={item.onClick}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2 group md:flex-row-reverse transition-colors
             ${isActive
                        ? 'text-emerald-400'
                        : 'text-slate-400 hover:text-emerald-400'
                      }`
                    }
                  >
                    {/* Dot */}
                    <span
                      className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-emerald-400 transition-colors"
                    ></span>

                    {/* Text */}
                    <span className="transition-transform group-hover:translate-x-1 md:group-hover:-translate-x-1">
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* --- Bottom Bar --- */}
        <div className="pt-8 border-t border-slate-800 flex justify-center items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} LankaVibe. Powered by Neural Networks.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;