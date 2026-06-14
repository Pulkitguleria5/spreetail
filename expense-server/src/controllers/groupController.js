const groupDao = require("../dao/groupDao");
const userDao = require('../dao/userDao');

const groupController = {

    create: async (request, response) => {
        try {
            const user = request.user;
            const userInfo = await userDao.findByEmail(request.user.email);

            // Backward compatibility
            if (userInfo.credits === undefined) {
                userInfo.credits = 1;
            }

            const hasActiveSubscription =
                userInfo.subscription &&
                userInfo.subscription.status === "active";

            if (Number(userInfo.credits) === 10 && !hasActiveSubscription) {
                return response.status(400).json({
                    message: 'You do not have enough credits to perform this operation'
                });
            }




            const { name, description, membersEmail, thumbnail } = request.body;

            let allMembers = [user.email];
            if (membersEmail && Array.isArray(membersEmail)) {
                allMembers = [...new Set([...allMembers, ...membersEmail])];
            }

            const newGroup = await groupDao.createGroup({
                name,
                description,
                adminEmail: user.email,
                membersEmail: allMembers,
                thumbnail,
                paymentStatus: {
                    amount: 0,
                    currency: 'INR',
                    date: Date.now(),
                    isPaid: false
                }
            });
            if (!hasActiveSubscription) {
                userInfo.credits -= 1;
                await userInfo.save();
            }

            response.status(201).json({
                message: 'Group created successfully',
                groupId: newGroup._id
            });


        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    update: async (request, response) => {
        try {
            const updatedGroup = await groupDao.updateGroup(request.body);
            if (!updatedGroup) {
                return response.status(404).json({ message: "Group not found" });
            }
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error updating group" });
        }
    },

    addMembers: async (request, response) => {
        try {
            const { groupId, emails } = request.body;
            const updatedGroup = await groupDao.addMembers(groupId, ...emails);
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error adding members" });
        }
    },

    removeMembers: async (request, response) => {
        try {
            const { groupId, emails } = request.body;
            const updatedGroup = await groupDao.removeMembers(groupId, ...emails);
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error removing members" });
        }
    },

    getGroupsByUser: async (request, response) => {
        try {
            const email = request.user.email;

            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 10;

            const skip = (page - 1) * limit;      //for record not for page number, so if page 1 then skip 0, if page 2 then skip 10 and so on.

            const sortBy = request.query.sortBy;
            

            let sortOptions = { createdAt: -1 }; 

            if (sortBy === 'asc') {
                sortOptions = { name: 1 };
            } else if (sortBy === 'desc') {
                sortOptions = { name: -1 };
            } else if (sortBy === 'oldest') {
                sortOptions = { createdAt: 1 };
            } else if (sortBy === 'newest') {
                sortOptions = { createdAt: -1 };
            }




            const { groups, total } = await groupDao.getGroupsPaginated(email, limit, skip, sortOptions);
            response.status(200).json({
                groups: groups,
                pagination: {
                    totalItems: total,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    itemsPerPage: limit

                }
            });


        }
        catch (error) {
            console.error("getGroupsByUser ERROR:", error);
            response.status(500).json({
                message: "Error fetching groups",
                error: error.message
            });
        }
    },

    getGroupsByPaymentStatus: async (request, response) => {
        try {
            const { isPaid } = request.query;
            const status = isPaid === 'true';
            const groups = await groupDao.getGroupByStatus(status);
            response.status(200).json(groups);
        } catch (error) {
            response.status(500).json({ message: "Error filtering groups" });
        }
    },

    getAudit: async (request, response) => {
        try {
            const { groupId } = request.params;
            const lastSettled = await groupDao.getAuditLog(groupId);
            response.status(200).json({ lastSettled });
        } catch (error) {
            response.status(500).json({ message: "Error fetching audit log" });
        }
    },

    getGroupById: async (request, response) => {
        try {
            const user = request.user;
            const { groupId } = request.params;

            const groups = await groupDao.getGroupByEmail(user.email);
            const group = groups.find(g => g._id.toString() === groupId);

            if (!group) {
                return response.status(403).json({ message: "User is not a member of the group" });
            }

            const groupById = await groupDao.getGroupById(groupId);
            if (!groupById) {
                return response.status(404).json({ message: "Group not found" });
            }

            response.status(200).json(groupById);
        } catch (error) {
            response.status(500).json({ message: "Error fetching group" });
        }
    }
};

module.exports = groupController;