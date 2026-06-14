const User = require("../model/users");

const rbacDao = {
  create: async (email, name, role, password, adminId) => {
    return await User.create({
      email: email.trim(),
      password: password,
      name: name,
      role: role,
      adminId: adminId,
    });
  },

  update: async (userId, name, role) => {
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({ name, role });
    }
    return user;
  },

  delete: async (userId) => {
    return await User.destroy({ where: { id: userId } });
  },

  getUsersByAdminId: async (adminId) => {
    return await User.findAll({
      where: { adminId },
      attributes: { exclude: ["password"] }
    });
  },
};

module.exports = rbacDao;
