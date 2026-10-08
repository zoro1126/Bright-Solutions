import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Shield,
  Stethoscope,
  Receipt,
  CheckCircle2,
  XCircle,
  Search,
  Mail,
  Phone,
  Clock,
  RefreshCw,
  Key
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export default function StaffManagementPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New staff form state
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('DOCTOR');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shift, setShift] = useState('Morning (08:00 - 14:00)');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await api.getStaffList();
      setStaffList(data?.staff || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const updatedStatus = !user.is_active;
    try {
      await api.updateStaffStatus(user.id, updatedStatus);
      setStaffList((prev) =>
        prev.map((s) => (s.id === user.id ? { ...s, is_active: updatedStatus } : s))
      );
      addToast({
        type: updatedStatus ? 'success' : 'info',
        title: 'Status Updated',
        message: `${user.full_name} is now ${updatedStatus ? 'Active' : 'Suspended'}.`,
      });
    } catch {
      // handle error
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!fullName || !email) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Name and email are required.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createStaff({
        full_name: fullName,
        role,
        email,
        phone,
        shift,
        is_active: true,
      });
      setStaffList((prev) => [
        ...prev,
        {
          id: res.user_id || Date.now(),
          full_name: fullName,
          role,
          email,
          phone,
          shift,
          is_active: true,
        },
      ]);
      addToast({
        type: 'success',
        title: 'Staff Member Provisioned',
        message: `Account created for ${fullName} (${role}).`,
      });
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
    } catch {
      // fallback
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      (s.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.role || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
    return true;
  });

  const getRoleBadgeVariant = (userRole) => {
    switch (userRole) {
      case 'DOCTOR':
        return 'canary';
      case 'ADMIN':
        return 'red';
      case 'CASHIER':
        return 'ochre';
      case 'RECEPTIONIST':
        return 'navy';
      default:
        return 'navy';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ochre-600 dark:text-ochre-400">
              P-ADM-02 • Access & Duty Roster
            </span>
            <Badge variant="navy" size="xs">Identity & Access Management</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            Staff Provisioning & Duty Roster
          </h1>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            Manage clinical and administrative staff credentials, assigned shifts, and role-based access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 font-bold"
          >
            <UserPlus className="w-4 h-4 text-navy-950" />
            Provision New Staff
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-navy-50 dark:bg-navy-900/80 rounded-xl border border-navy-100 dark:border-navy-800">
            {['ALL', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'ADMIN'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  roleFilter === r
                    ? 'bg-canary-400 text-navy-950 shadow-sm font-bold'
                    : 'text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              placeholder="Search staff name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl text-xs text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-canary-400"
            />
          </div>
        </div>
      </Card>

      {/* Staff Roster Table */}
      <Card className="overflow-hidden border border-navy-100 dark:border-navy-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-navy-100 dark:border-navy-800 bg-navy-50/75 dark:bg-navy-900/60 text-navy-600 dark:text-navy-300 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Email & Phone</th>
                <th className="py-3 px-4">Assigned Shift</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-navy-50/40 dark:hover:bg-navy-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-navy-100 dark:bg-navy-800 text-navy-900 dark:text-canary-400 font-bold flex items-center justify-center font-mono">
                        {staff.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-navy-900 dark:text-white">
                          {staff.full_name}
                        </div>
                        <div className="font-mono text-[10px] text-navy-400">
                          UID #{staff.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={getRoleBadgeVariant(staff.role)} size="xs" className="font-bold">
                      {staff.role}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-navy-700 dark:text-navy-300">
                      <Mail className="w-3 h-3 text-navy-400" />
                      <span>{staff.email}</span>
                    </div>
                    {staff.phone && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-navy-400">
                        <Phone className="w-3 h-3 text-navy-400" />
                        <span>{staff.phone}</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-navy-600 dark:text-navy-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-navy-400" />
                      {staff.shift || 'Full Day'}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {staff.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500">
                        <XCircle className="w-3.5 h-3.5" /> Suspended
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant={staff.is_active ? 'outline' : 'secondary'}
                      size="xs"
                      onClick={() => handleToggleStatus(staff)}
                      className="font-semibold"
                    >
                      {staff.is_active ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Provision Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Staff Account"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-700 dark:text-navy-300 mb-1">
              Full Legal Name *
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Priya Nair, MD"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy-700 dark:text-navy-300 mb-1">
                System Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-semibold text-navy-900 dark:text-white focus:ring-2 focus:ring-canary-400"
              >
                <option value="DOCTOR">DOCTOR (Physician)</option>
                <option value="RECEPTIONIST">RECEPTIONIST (Front Desk)</option>
                <option value="CASHIER">CASHIER (Billing)</option>
                <option value="ADMIN">ADMIN (Hospital Governance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-700 dark:text-navy-300 mb-1">
                Assigned Shift *
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-semibold text-navy-900 dark:text-white focus:ring-2 focus:ring-canary-400"
              >
                <option value="Morning (08:00 - 14:00)">Morning (08:00 - 14:00)</option>
                <option value="Evening (14:00 - 20:00)">Evening (14:00 - 20:00)</option>
                <option value="Full Day">Full Day</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-700 dark:text-navy-300 mb-1">
              Work Email Address *
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. priya@brightsolutions.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-700 dark:text-navy-300 mb-1">
              Contact Phone
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43219"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submitting} className="font-bold">
              Provision Credentials
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
