const User = require('../model/users');

const userDao = {
    findByEmail: async (email) => {
        return await User.findOne({ where: { email } });
    },

    create: async (userData) => {
        try {
            return await User.create(userData);
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                const err = new Error('User already exists');
                err.code = 'USER_EXIST';
                throw err;
            } else {
                console.error(error);
                const err = new Error('Something went wrong while communicating with DB');
                err.code = 'INTERNAL_SERVER_ERROR';
                throw err;
            }
        }
    }
};

module.exports = userDao;