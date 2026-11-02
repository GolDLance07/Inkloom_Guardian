'use client';

import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const DEMO_EMAIL = 'demo@inkloom.io';
  const DEMO_PASSWORD = 'guardian-demo-2026';
  const DEMO_NAME = 'Senior Compliance Officer';
  const DEMO_ROLE = 'SecOps Level 3 • Governance Lead';

  const handleFillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both username/email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate authentication verification
    setTimeout(() => {
      setIsLoading(false);
      const isDemo = email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase();
      const user = {
        name: isDemo ? DEMO_NAME : email.split('@')[0],
        email: email.trim(),
        role: isDemo ? DEMO_ROLE : 'Brand Reviewer',
      };
      onLoginSuccess(user);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-[#070C1E] text-white overflow-hidden">
      {/* ================= LEFT SECTION: Inkloom Guardian Brand & Geometric Art ================= */}
      <div className="relative w-full lg:w-1/2 h-64 lg:h-full bg-[#050814] flex flex-col justify-between p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#1E293B] overflow-hidden select-none">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-crimson/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        {/* Geometric Vector Canvas / Wireframe Shapes */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid-pattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="0.5"
                  strokeOpacity="0.4"
                />
                <circle cx="0" cy="0" r="1.5" fill="#E11D48" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />

            {/* Sacred Geometry Interlocking Isometric Rings */}
            <g transform="translate(280, 340)">
              <polygon
                points="0,-140 121,-70 121,70 0,140 -121,70 -121,-70"
                fill="none"
                stroke="#E11D48"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.7"
              />
              <polygon
                points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1"
                opacity="0.5"
              />
              <polygon
                points="0,-80 69,-40 69,40 0,80 -69,40 -69,-40"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="1.5"
                opacity="0.8"
              />
              <circle cx="0" cy="0" r="45" fill="none" stroke="#E11D48" strokeWidth="1" opacity="0.6" />
              <circle cx="0" cy="0" r="4" fill="#E11D48" />
              <line x1="-150" y1="0" x2="150" y2="0" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="-150" x2="0" y2="150" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
            </g>
          </svg>
        </div>

        {/* Top Header Tag */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-crimson flex items-center justify-center text-white shadow-lg shadow-crimson/30">
            <span className="material-symbols-outlined text-[24px]">shield_lock</span>
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-red-400 font-bold">
            SECURE ACCESS PORTAL
          </span>
        </div>

        {/* Center Typography & Geometry */}
        <div className="relative z-10 my-auto py-8">
          <h1 className="font-display text-4xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            INKLOOM
            <br />
            <span className="text-red-500 font-serif italic font-normal tracking-normal">
              GUARDIAN
            </span>
          </h1>

          <div className="h-1 w-24 bg-gradient-to-r from-crimson to-transparent my-6" />

          <p className="font-sans text-sm lg:text-base text-slate-400 max-w-md leading-relaxed">
            Autonomous multi-tenant brand governance platform. Enforce deterministic policy compliance, RAG knowledge retrieval, and multi-modal asset screening across all enterprise copy.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>DETERMINISTIC RULES</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
              <span>PGVECTOR RAG</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-crimson" />
              <span>OCR ASSET SCREENING</span>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 text-xs font-mono text-slate-500 flex items-center justify-between">
          <span>FRAMEWORK: V4.2 ENTERPRISE</span>
          <span>IMMUTABLE AUDIT LOGGING</span>
        </div>
      </div>

      {/* ================= RIGHT SECTION: Login & Demo Account ================= */}
      <div className="w-full lg:w-1/2 h-full bg-[#FDFBF7] text-[#18181B] flex flex-col justify-center items-center p-6 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-widest text-crimson font-bold">
              PORTAL LOGIN
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#0B132B]">
              Sign in to Workspace
            </h2>
            <p className="text-xs text-slate-500">
              Authenticate to review drafts, configure brand policies, and inspect assets.
            </p>
          </div>

          {/* Demo Account Credentials Card */}
          <div className="bg-[#FAF8F2] border-2 border-dashed border-[#DFD6C2] rounded-xl p-4 flex flex-col gap-3 relative shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[18px]">
                  key
                </span>
                <span className="font-mono text-xs font-bold text-[#0B132B] uppercase tracking-wider">
                  Pre-Configured Demo Account
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 uppercase">
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-3 rounded-lg border border-[#E6DDD0]">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold">
                  Username / Email
                </span>
                <span className="text-[#0B132B] font-semibold select-all">
                  {DEMO_EMAIL}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold">
                  Password
                </span>
                <span className="text-[#0B132B] font-semibold select-all">
                  {DEMO_PASSWORD}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-3 rounded-lg bg-[#0B132B] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-400">
                bolt
              </span>
              <span>Fill Demo Credentials</span>
            </button>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-crimson text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter username or email"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D5CBB8] focus:border-crimson focus:ring-1 focus:ring-crimson text-sm bg-white text-[#0B132B] outline-none transition-all pl-10"
                  required
                />
                <span className="material-symbols-outlined text-slate-400 text-[18px] absolute left-3 top-3 pointer-events-none">
                  alternate_email
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-crimson font-medium cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D5CBB8] focus:border-crimson focus:ring-1 focus:ring-crimson text-sm bg-white text-[#0B132B] outline-none transition-all pl-10"
                  required
                />
                <span className="material-symbols-outlined text-slate-400 text-[18px] absolute left-3 top-3 pointer-events-none">
                  lock
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-[#D5CBB8] text-crimson focus:ring-crimson cursor-pointer"
                />
                <span>Remember session on this device</span>
              </label>
              <span className="text-slate-400">Demo Mode Active</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-sans font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md mt-2 cursor-pointer ${
                isLoading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-crimson hover:bg-red-700 text-white shadow-crimson/25 hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  <span>Authenticating credentials...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    login
                  </span>
                  <span>Enter Brand Workspace</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Help */}
          <div className="text-center text-xs text-slate-400 pt-4 border-t border-[#EDE5D5]">
            Inkloom Guardian Content Governance System &bull; Version 4.2
          </div>
        </div>
      </div>
    </div>
  );
};
