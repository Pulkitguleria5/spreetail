const userDao = require('../dao/userDao');

const profileController = {

  // Get logged-in user info
  getUserInfo: async (request, response) => {
    try {
      const email = request.user.email;

      const user = await userDao.findByEmail(email);

      if (!user) {
        return response.status(404).json({
          message: 'User not found'
        });
      }

      return response.json({
        user: user
      });

    } catch (error) {
      return response.status(500).json({
        message: 'Internal server error'
      });
    }
  }

};

module.exports = profileController;
