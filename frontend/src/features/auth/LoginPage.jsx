import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCheck,
  Stethoscope,
  Receipt,
  Shield,
  Sun,
  ArrowRight,
  Lock,
  User,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
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
      title: 'Head Receptionist • Counter 1',
      route: ROUTES.RECEPTIONIST.DASHBOARD,
      icon: UserCheck,
    },
    {
      role: 'DOCTOR',
      username: 'dr_kulkarni',
      name: 'Dr. Vikram Kulkarni, MD',
      title: 'Senior Physician • Cabin 01',
      route: ROUTES.DOCTOR.DASHBOARD,
      icon: Stethoscope,
    },
    {
      role: 'CASHIER',
      username: 'cashier_rahul',
      name: 'Rahul Verma',
      title: 'Billing Cashier • Desk 1',
      route: ROUTES.CASHIER.DASHBOARD,
      icon: Receipt,
    },
    {
      role: 'ADMIN',
      username: 'admin',
      name: 'Dr. Suresh Deshmukh',
      title: 'Medical Superintendent',
      route: ROUTES.ADMIN.DASHBOARD,
      icon: Shield,
    },
  ];

  async function handleOneClickLogin(persona) {
    setLoading(true);
    setError('');
    try {
      await loginUser(persona.username, 'password123');
      navigate(persona.route);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await loginUser(username, password);
      const roleTarget = {
        RECEPTIONIST: ROUTES.RECEPTIONIST.DASHBOARD,
        DOCTOR: ROUTES.DOCTOR.DASHBOARD,
        CASHIER: ROUTES.CASHIER.DASHBOARD,
        ADMIN: ROUTES.ADMIN.DASHBOARD,
      };
      navigate(roleTarget[res.user?.role] || ROUTES.RECEPTIONIST.DASHBOARD);
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] dark:bg-[#051A30] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      {/* Large 32px Rounded Content Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-4xl rounded-[32px] bg-[#FAF6EC] dark:bg-[#071D33] border border-[#EAE4D3] dark:border-[#1B456E] p-6 sm:p-10 shadow-sm"
      >
        {/* Header Branding */}
        <div className="text-center max-w-md mx-auto mb-8 space-y-2">
          <div className="w-12 h-12 mx-auto rounded-3xl bg-gradient-to-tr from-[#E08A00] via-[#FFC21A] to-[#FFD24D] flex items-center justify-center text-[#0A2540] shadow-[0_2px_12px_rgba(255,194,26,0.35)]">
            <Sun className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A2540] dark:text-white">
            Bright Solutions
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Outpatient Clinical Operating System & Point of Care Suite
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-3.5 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] text-xs font-semibold text-[#B91C1C] text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 1-Click Demo Personas (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-bold text-[#0A2540] dark:text-white">
                  1-Click Demo Personas
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Select an authorized staff profile for zero-friction evaluation.
                </p>
              </div>
              <Badge variant="amber" size="xs">INSTANT ACCESS</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personas.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.username}
                    type="button"
                    disabled={loading}
                    onClick={() => handleOneClickLogin(p)}
                    className="p-4 rounded-3xl bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#FFC21A] dark:hover:border-[#FFC21A] text-left transition-all group shadow-[0_1px_2px_0_rgba(10,37,64,0.02)] active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-2xl bg-[#0A2540] text-white flex items-center justify-center shrink-0 group-hover:bg-[#FFC21A] group-hover:text-[#0A2540] transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A740C] dark:text-[#FFE08A] bg-[#FFF7E0] dark:bg-[#0F355A] px-2 py-0.5 rounded-full">
                        {p.role}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-[#0A2540] dark:text-white group-hover:text-[#0A2540]">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 line-clamp-1">
                      {p.title}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#FAF6EC] dark:border-[#0F355A] flex items-center justify-between text-[11px] font-semibold text-[#8A740C] dark:text-[#FFE08A]">
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Credentials Login (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-6 bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] shadow-[0_1px_2px_0_rgba(10,37,64,0.02)]">
              <h3 className="text-sm font-bold text-[#0A2540] dark:text-white mb-1">
                Staff Credentials
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
                Sign in with hospital username & password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#0A2540] dark:text-[#CBD5E1] mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. dr_kulkarni"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#FAF6EC] dark:bg-[#0F355A] border border-[#EAE4D3] dark:border-[#1B456E] text-xs font-mono text-[#0A2540] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0A2540] dark:text-[#CBD5E1] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#FAF6EC] dark:bg-[#0F355A] border border-[#EAE4D3] dark:border-[#1B456E] text-xs font-mono text-[#0A2540] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  className="w-full font-bold shadow-xs mt-2"
                >
                  Authenticate
                </Button>
              </form>

              <div className="mt-4 pt-3 border-t border-[#FAF6EC] dark:border-[#1B456E] text-center text-[11px] text-[#64748B]">
                Default demo password: <strong className="text-[#0A2540] dark:text-white font-mono">password123</strong>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-[#EAE4D3] dark:border-[#1B456E] text-center text-xs text-[#94A3B8]">
          Copyright © 2026 Bright Solutions Clinical Suite • Secure HIPAA/NABH Compliant
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
