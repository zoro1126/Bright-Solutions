import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCheck, Stethoscope, Receipt, Shield, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { Button, Input, Card } from '../../components/ui';
import { BRAND_CONFIG, ROUTES } from '../../routes';

export function LoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const personas = [
    {
      role: 'RECEPTIONIST',
      username: 'receptionist_anita',
      name: 'Anita Sharma',
      title: 'Head Receptionist • Desk 1',
      route: ROUTES.RECEPTIONIST.DASHBOARD,
      icon: UserCheck,
      color: 'border-l-4 border-l-[#38BDF8]',
    },
    {
      role: 'DOCTOR',
      username: 'dr_kulkarni',
      name: 'Dr. Vikram Kulkarni, MD',
      title: 'Senior Physician • Cabin 01',
      route: ROUTES.DOCTOR.DASHBOARD,
      icon: Stethoscope,
      color: 'border-l-4 border-l-[#FFE500]',
    },
    {
      role: 'DOCTOR',
      username: 'dr_ananya',
      name: 'Dr. Ananya Roy, MBBS, DNB',
      title: 'Consultant Cardiologist • Cabin 02',
      route: ROUTES.DOCTOR.DASHBOARD,
      icon: Stethoscope,
      color: 'border-l-4 border-l-[#FFE500]',
    },
    {
      role: 'CASHIER',
      username: 'cashier_rahul',
      name: 'Rahul Verma',
      title: 'Senior Billing Cashier • Desk 1',
      route: ROUTES.CASHIER.DASHBOARD,
      icon: Receipt,
      color: 'border-l-4 border-l-[#34D399]',
    },
    {
      role: 'ADMIN',
      username: 'admin',
      name: 'Dr. Suresh Deshmukh',
      title: 'Hospital Medical Superintendent',
      route: ROUTES.ADMIN.DASHBOARD,
      icon: Shield,
      color: 'border-l-4 border-l-[#C084FC]',
    },
  ];

  async function handleOneClickLogin(persona) {
    setLoading(true);
    setError('');
    try {
      await loginUser(persona.username, 'password123');
      navigate(persona.route);
    } catch (err) {
      setError('Unable to authenticate persona.');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await loginUser(username, password);
      const role = res.user?.role || 'RECEPTIONIST';
      if (role === 'DOCTOR') navigate(ROUTES.DOCTOR.DASHBOARD);
      else if (role === 'CASHIER') navigate(ROUTES.CASHIER.DASHBOARD);
      else if (role === 'ADMIN') navigate(ROUTES.ADMIN.DASHBOARD);
      else navigate(ROUTES.RECEPTIONIST.DASHBOARD);
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F7FA] dark:bg-[#051A30] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#FFE500] selection:text-[#051A30]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl space-y-8"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0A2540] text-white shadow-md border border-[#1B456E]">
            <div className="w-7 h-7 rounded-lg bg-[#FFE500] text-[#051A30] font-black font-mono flex items-center justify-center text-sm">
              B
            </div>
            <span className="text-sm font-extrabold tracking-tight">
              {BRAND_CONFIG.name}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFE500]" />
            <span className="text-xs font-mono text-[#94A3B8]">
              {BRAND_CONFIG.systemName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A2540] dark:text-white pt-2">
            Clinical Staff Gateway
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
            Secure Outpatient Operating Suite. Select a 1-click clinical persona or enter formal credentials.
          </p>
        </div>

        {/* Bento Grid: 1-Click Personas on Left, Manual Form on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT: 1-Click Personas (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0A2540] p-6 rounded-2xl border border-[#CBD5E1] dark:border-[#1B456E] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] dark:border-[#1B456E]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FFE500]" />
                  1-Click Demo Personas
                </h2>
                <span className="text-[11px] font-mono text-[#64748B]">
                  Instant Role Portal Access
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {personas.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.username}
                      type="button"
                      disabled={loading}
                      onClick={() => handleOneClickLogin(p)}
                      className={`w-full p-3.5 rounded-xl bg-[#F6F7FA] dark:bg-[#0F355A] hover:bg-[#E2E8F0]/80 dark:hover:bg-[#1B456E] transition-all flex items-center justify-between text-left group shadow-xs ${p.color}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#0A2540] text-[#FFE500] shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#051A30] dark:text-white group-hover:text-[#0A2540]">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                            {p.title}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A2540] dark:text-[#FFE500] group-hover:translate-x-1 transition-transform">
                        <span className="hidden sm:inline text-[11px] font-mono">Launch</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-[#1B456E] flex items-center justify-between text-[11px] text-[#64748B] font-mono">
              <span>RBAC Matrix: Enforced</span>
              <span>FastAPI Proxy :8000</span>
            </div>
          </div>

          {/* RIGHT: Manual Credentials Form (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0A2540] p-6 rounded-2xl border border-[#CBD5E1] dark:border-[#1B456E] shadow-sm flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-[#F1F5F9] dark:border-[#1B456E]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-[#B89C14]" />
                  Staff Credentials
                </h2>
              </div>

              <form onSubmit={handleManualSubmit} className="mt-5 space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#DC2626]">
                    {error}
                  </div>
                )}

                <Input
                  label="Staff Username"
                  required
                  placeholder="e.g. dr_kulkarni"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full justify-center text-sm py-2.5 font-bold"
                  >
                    Sign In to Portal
                  </Button>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F1F5F9] dark:border-[#1B456E] text-center">
              <span className="text-[11px] text-[#94A3B8] font-mono">
                Default password for all staff: <strong className="text-[#0A2540] dark:text-white">password123</strong>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
