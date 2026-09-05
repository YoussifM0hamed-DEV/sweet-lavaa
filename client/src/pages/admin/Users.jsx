import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiShield, FiTrash2, FiEdit2, FiCheck } from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { adminUserService } from '../../services/adminService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate, initials } from '../../utils/format.js';
import { ROLE_META } from '../../utils/constants.js';

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', password: '', role: 'support' };

const Users = () => {
  const { user: currentUser } = useAuth();

  const [staff, setStaff] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [roleTarget, setRoleTarget] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);

  const load = () => {
    Promise.allSettled([adminUserService.staff(), adminUserService.roles()])
      .then(([staffResult, rolesResult]) => {
        if (staffResult.status === 'fulfilled') {
          setStaff(staffResult.value.data.staff);
          setRolePermissions(staffResult.value.data.roles);
        }
        if (rolesResult.status === 'fulfilled') setAvailableRoles(rolesResult.value.data.roles);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const assignableRoles = availableRoles
    .filter((entry) => entry.role !== 'customer')
    .map((entry) => ({ value: entry.role, label: ROLE_META[entry.role]?.label || entry.role }));

  const create = async (event) => {
    event.preventDefault();

    const found = {};
    if (form.firstName.trim().length < 2) found.firstName = 'First name is required.';
    if (form.lastName.trim().length < 2) found.lastName = 'Last name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Please enter a valid email address.';
    if (form.password.length < 8) found.password = 'Password must be at least 8 characters.';

    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSaving(true);
    try {
      await adminUserService.create(form);
      toast.success('Team member added.');
      setIsCreating(false);
      setForm(EMPTY);
      load();
    } catch (error) {
      setErrors(error.toFieldMap?.() || {});
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveRole = async () => {
    setIsSaving(true);
    try {
      await adminUserService.updateRole(roleTarget._id, { role: newRole });
      toast.success('Role updated. They will need to sign in again.');
      setRoleTarget(null);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const removeStaff = async () => {
    try {
      await adminUserService.remove(removeTarget._id);
      toast.success('Removed from staff. Their account is now a customer account.');
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRemoveTarget(null);
    }
  };

  const columns = [
    {
      key: 'member',
      header: 'Team member',
      render: (member) => (
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cocoa-800 text-xs font-bold text-cream-100">
            {initials(member.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-cocoa-800">
              {member.fullName}
              {member._id === currentUser?.id && <span className="ml-1.5 text-xs text-cocoa-300">(you)</span>}
            </p>
            <p className="truncate text-xs text-cocoa-300">{member.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (member) => {
        const meta = ROLE_META[member.role] || ROLE_META.customer;
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: 'permissions',
      header: 'Permissions',
      hideOnMobile: true,
      render: (member) => <span className="text-xs text-cocoa-400">{member.permissions?.length || 0} granted</span>,
    },
    {
      key: 'joined',
      header: 'Added',
      hideOnMobile: true,
      render: (member) => <span className="text-cocoa-500">{formatDate(member.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (member) => (
        <Badge tone={member.isActive ? 'success' : 'danger'}>{member.isActive ? 'Active' : 'Disabled'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (member) => {
        const isSelf = member._id === currentUser?.id;
        return (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              disabled={isSelf}
              onClick={() => {
                setRoleTarget(member);
                setNewRole(member.role);
              }}
              aria-label="Change role"
              className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700 disabled:opacity-30"
            >
              <FiEdit2 className="text-sm" />
            </button>
            <button
              type="button"
              disabled={isSelf}
              onClick={() => setRemoveTarget(member)}
              aria-label="Remove from staff"
              className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
            >
              <FiTrash2 className="text-sm" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Users & roles" description="Who can access the dashboard, and what they can do.">
        <Button size="sm" icon={FiPlus} onClick={() => setIsCreating(true)}>
          Add team member
        </Button>
      </AdminPageHeader>

      <DataTable
        columns={columns}
        rows={staff}
        isLoading={isLoading}
        emptyTitle="No staff accounts yet"
        emptyMessage="Add a team member to give them dashboard access."
        emptyAction={{ label: 'Add team member', onClick: () => setIsCreating(true) }}
      />

      {/* Permission reference */}
      <section className="card mt-8 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
          <FiShield className="text-caramel-600" /> What each role can do
        </h2>
        <p className="mt-1 text-sm text-cocoa-400">
          Permissions are enforced on the server, so a hidden menu item is never the only thing standing in the way.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rolePermissions.map((entry) => {
            const meta = ROLE_META[entry.role] || ROLE_META.customer;
            return (
              <div key={entry.role} className="rounded-xl border border-cream-300 p-4">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <ul className="mt-3 space-y-1.5">
                  {entry.permissions.map((permission) => (
                    <li key={permission} className="flex items-start gap-1.5 text-xs text-cocoa-400">
                      <FiCheck className="mt-0.5 shrink-0 text-emerald-500" />
                      {permission.replace(':', ' · ')}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title="Add a team member">
        <form onSubmit={create} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="First name"
              value={form.firstName}
              onChange={(event) => setForm((c) => ({ ...c, firstName: event.target.value }))}
              error={errors.firstName}
              required
            />
            <Input
              label="Last name"
              value={form.lastName}
              onChange={(event) => setForm((c) => ({ ...c, lastName: event.target.value }))}
              error={errors.lastName}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((c) => ({ ...c, email: event.target.value }))}
            error={errors.email}
            required
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => setForm((c) => ({ ...c, phone: event.target.value }))}
            error={errors.phone}
          />

          <Input
            label="Temporary password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((c) => ({ ...c, password: event.target.value }))}
            error={errors.password}
            hint="They can change it from their profile after signing in."
            required
          />

          <Select
            label="Role"
            value={form.role}
            onChange={(event) => setForm((c) => ({ ...c, role: event.target.value }))}
            options={assignableRoles}
            error={errors.role}
            required
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingText="Adding...">
              Add team member
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(roleTarget)} onClose={() => setRoleTarget(null)} title="Change role" size="sm">
        <p className="text-sm text-cocoa-400">
          Changing the role for <strong className="text-cocoa-700">{roleTarget?.fullName}</strong> signs them out so the
          new permissions take effect immediately.
        </p>

        <Select
          label="New role"
          value={newRole}
          onChange={(event) => setNewRole(event.target.value)}
          options={assignableRoles}
          className="mt-5"
        />

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setRoleTarget(null)}>
            Cancel
          </Button>
          <Button onClick={saveRole} isLoading={isSaving}>
            Save role
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={removeStaff}
        title="Remove from staff?"
        message={`${removeTarget?.fullName} will lose dashboard access. Their account becomes a normal customer account and their history is kept.`}
        confirmLabel="Remove access"
      />
    </div>
  );
};

export default Users;
