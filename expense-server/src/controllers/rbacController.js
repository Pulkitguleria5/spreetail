const bcrypt = require("bcryptjs");
const rbacDao = require("../dao/rbacDao");
const { generateTemporaryPassword } = require("../utility/passwordUtil");
const emailService = require("../services/emailService");
const { USER_ROLES } = require("../utility/userRoles");

const rbacController = {
  // =========================
  // CREATE USER (Admin only)
  // =========================
  create: async (request, response) => {
    try {
      const adminUser = request.user;
      const { name, email, role } = request.body;

      // Validate role
      if (!USER_ROLES.includes(role)) {
        return response.status(400).json({
          message: "Invalid role",
        });
      }

      // Generate & hash temporary password
      const tempPassword = generateTemporaryPassword(8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      // Create user
      const user = await rbacDao.create(
        email,
        name,
        role,
        hashedPassword,
        adminUser.adminId
      );

      // Send temporary password via email
      try {
        await emailService.send(
          email,
          "Temporary Password",
          `Your temporary password is: ${tempPassword}`
        );
      } catch (error) {
        // User creation should not fail if email fails
        console.log(
          `Error sending email, temporary password is ${tempPassword}`,
          error
        );
      }

      return response.status(200).json({
        message: "User created!",
        user: user,
      });
    } catch (error) {
      console.log(error);
      response.status(500).json({ message: "Internal server error" });
    }
  },

  // =========================
  // UPDATE USER
  // =========================
  update: async (request, response) => {
    try {
      const { userId, name, role } = request.body;

      const user = await rbacDao.update(userId, name, role);

      return response.status(200).json({
        message: "User updated!",
        user: user,
      });
    } catch (error) {
      console.log(error);
      response.status(500).json({ message: "Internal server error" });
    }
  },

  // =========================
  // DELETE USER
  // =========================
  delete: async (request, response) => {
    try {
      const { userId } = request.body;

      await rbacDao.delete(userId);

      return response.status(200).json({
        message: "User deleted!",
      });
    } catch (error) {
      console.log(error);
      response.status(500).json({ message: "Internal server error" });
    }
  },

  // =========================
  // GET ALL USERS (Admin scope)
  // =========================
  getAllUsers: async (request, response) => {
    try {
      const adminId = request.user.adminId;

      const users = await rbacDao.getUsersByAdminId(adminId);

      return response.status(200).json({
        users: users,
      });
    } catch (error) {
      console.log(error);
      response.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = rbacController;
