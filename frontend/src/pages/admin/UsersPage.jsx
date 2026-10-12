/**
 * ThalCare Admin Users Page
 * Manage all system users
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Shield,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  User as UserIcon,
} from 'lucide-react';
import {
  Card,
  CardBody,
  Badge,
  Spinner,
  Input,
  Select,
  Avatar,
} from '../../components/common';
import { formatRelativeTime } from '../../utils';
import { USER_ROLE_LABELS } from '../../constants';
import { ConfirmModal } from '../../components/common/Modal';
import { adminAPI } from '../../api/endpoints';

const ROLE_COLORS = {
  doctor: { bg: 'bg-blue-100', text: 'text-blue-700' },
  lab_technician: { bg: 'bg-green-100', text: 'text-green-700' },
  admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

export default function UsersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        search: search || undefined,
        role: roleFilter || undefined,
      };

      const response = await adminAPI.getUsers(params);

      const mappedUsers = (Array.isArray(response) ? response : []).map(u => ({
        ...u,
        name: `${u.first_name} ${u.last_name}`,
        isActive: u.is_active,
        department: u.department || 'General',
        lastActive: u.updated_at || u.created_at,
      }));

      // Client-side status filtering if backend doesn't support it yet
      let filtered = mappedUsers;
      if (statusFilter === 'active') {
        filtered = filtered.filter(u => u.isActive);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(u => !u.isActive);
      }

      setUsers(filtered);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    try {
      await adminAPI.deleteUser(deleteModal.user.id);
      setDeleteModal({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      await adminAPI.updateUser(user.id, { is_active: !user.isActive });
      fetchUsers();
    } catch (err) {
      console.error('Update status error:', err);
    }
    setActionMenuOpen(null);
  };

  const totalPages = Math.ceil(users.length / itemsPerPage);

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">
            Manage system users and their permissions
          </p>
        </div>
        <Link to="/admin/users/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add New User
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-blue-600">
              {users.filter((u) => u.role === 'doctor').length}
            </p>
            <p className="text-sm text-gray-500">Doctors</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.role === 'lab_technician').length}
            </p>
            <p className="text-sm text-gray-500">Lab Technicians</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-purple-600">
              {users.filter((u) => u.role === 'admin').length}
            </p>
            <p className="text-sm text-gray-500">Admins</p>
          </CardBody>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <Select
                label="Role"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'doctor', label: 'Doctor' },
                  { value: 'lab_technician', label: 'Lab Technician' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setRoleFilter('');
                    setStatusFilter('');
                    setSearch('');
                    setCurrentPage(1);
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size="md" />
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="w-3 h-3" />
                        {user.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      className={`${ROLE_COLORS[user.role]?.bg || 'bg-gray-100'} ${ROLE_COLORS[user.role]?.text || 'text-gray-700'}`}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {USER_ROLE_LABELS[user.role] || user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {user.isActive ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-700 font-medium">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-700 font-medium">Inactive</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatRelativeTime(user.lastActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDeleteModal({ open: true, user })}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {actionMenuOpen === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActionMenuOpen(null)}
                          ></div>
                          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1">
                              <Link
                                to={`/admin/users/${user.id}/edit`}
                                className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                Edit User
                              </Link>
                              <button
                                onClick={() => toggleUserStatus(user)}
                                className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {user.isActive ? (
                                  <>
                                    <XCircle className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                    Activate
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteModal({ open: true, user });
                                  setActionMenuOpen(null);
                                }}
                                className="group flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-500" />
                                Delete User
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, users.length)}
              </span>{' '}
              of <span className="font-medium">{users.length}</span> users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-4">
              {search || roleFilter || statusFilter
                ? 'Try adjusting your filters'
                : 'Start by adding a new user'}
            </p>
            <Link to="/admin/users/new" className="btn-primary inline-flex">
              <Plus className="w-4 h-4 mr-2" />
              Add New User
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteModal.user?.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
