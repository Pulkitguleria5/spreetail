import { useEffect, useState } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";
import Can from "../components/Can";

function ManageUsers() {
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Select",
  });

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${serverEndpoint}/users/`, {
        withCredentials: true,
      });
      setUsers(response.data.users || []);
    } catch (error) {
      setErrors({ message: "Unable to fetch users, please try again" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (formData.role === "Select") newErrors.role = "Role is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setActionLoading(true);
    try {
      const response = await axios.post(
        `${serverEndpoint}/users/`,
        formData,
        { withCredentials: true }
      );
      setUsers([...users, response.data.user]);
      setMessage("User added successfully!");
      setFormData({ name: "", email: "", role: "Select" });
      setErrors({});
    } catch (error) {
      setErrors({ message: "Unable to add user, please try again" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-10 w-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Alerts */}
      {errors.message && (
        <div className="mb-4 rounded bg-red-100 px-4 py-3 text-red-700">
          {errors.message}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded bg-green-100 px-4 py-3 text-green-700">
          {message}
        </div>
      )}

      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Manage <span className="text-blue-600">Users</span>
        </h2>
        <p className="text-gray-500">
          View and manage all the users along with their permissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Add User Form */}
        <Can requiredPermission="canCreateUsers">
        <div className="md:col-span-3">
          <div className="bg-white shadow rounded-lg">
            <div className="border-b px-4 py-3 font-semibold">
              Add Member
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 w-full rounded border px-3 py-2 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 w-full rounded border px-3 py-2 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`mt-1 w-full rounded border px-3 py-2 ${
                    errors.role ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="Select">Select</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-red-600">{errors.role}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
              >
                {actionLoading ? "Adding..." : "Add"}
              </button>
            </form>
          </div>
        </div>
</Can>
        {/* Users Table */}
        <div className="md:col-span-9">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b px-6 py-4 font-semibold">
              Team Members
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-center">Name</th>
                    <th className="px-4 py-3 text-center">Email</th>
                    <th className="px-4 py-3 text-center">Role</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">
                        No users found. Start by adding one!
                      </td>
                    </tr>
                  )}

                  {users.map((user) => (
                    <tr key={user._id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">{user.name}</td>
                      <td className="px-4 py-3 text-center">{user.email}</td>
                      <td className="px-4 py-3 text-center">{user.role}</td>
                      <td className="px-4 py-3 text-center space-x-3">
                        <button className="text-blue-600 hover:underline">
                          Edit
                        </button>
                        <button className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>

  );
} 


export default ManageUsers;
