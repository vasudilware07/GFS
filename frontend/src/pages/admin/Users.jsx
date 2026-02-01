import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiUser, FiMail, FiPhone, FiCheck, FiX, FiEdit2, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { userAPI } from '../../api';
import { PageLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll({ limit: 100 });
      const data = res.data.data;
      setUsers(Array.isArray(data) ? data : (data?.users || []));
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await userAPI.updateStatus(userId, { isActive: !currentStatus });
      setUsers(users.map(u => 
        u._id === userId ? { ...u, isActive: !currentStatus } : u
      ));
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = 
      user.shopName?.toLowerCase().includes(search.toLowerCase()) ||
      user.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = 
      filter === 'ALL' ||
      (filter === 'ACTIVE' && user.isActive) ||
      (filter === 'INACTIVE' && !user.isActive) ||
      (filter === 'ADMIN' && user.role === 'ADMIN');
    return matchSearch && matchFilter;
  });

  if (loading) return <PageLoading />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          <p className="text-sm text-gray-500">Total Users</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.isActive).length}</p>
          <p className="text-sm text-gray-500">Inactive</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'ADMIN').length}</p>
          <p className="text-sm text-gray-500">Admins</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, shop, or email..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field md:w-40"
          >
            <option value="ALL">All Users</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <FiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">User</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Contact</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Address</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">Orders</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">Status</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <FiUser className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.shopName}</p>
                          <p className="text-sm text-gray-500">{user.ownerName}</p>
                          {user.role === 'ADMIN' && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Admin</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="flex items-center gap-2 text-gray-600">
                        <FiMail className="w-4 h-4" /> {user.email}
                      </p>
                      <p className="flex items-center gap-2 text-gray-600 text-sm">
                        <FiPhone className="w-4 h-4" /> {user.phone || '-'}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.address?.city ? (
                        <>
                          {user.address.city}, {user.address.state}
                          <br />
                          <span className="text-sm">{user.address.pincode}</span>
                        </>
                      ) : '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-medium">{user.orderCount || 0}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.isActive 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {user.isActive ? (
                          <><FiCheck className="inline w-3 h-3 mr-1" /> Active</>
                        ) : (
                          <><FiX className="inline w-3 h-3 mr-1" /> Inactive</>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/admin/users/${user._id}`}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/orders?customer=${user._id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Orders"
                        >
                          <FiShoppingBag className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
