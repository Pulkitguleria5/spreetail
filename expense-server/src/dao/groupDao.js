const Group = require("../model/group");
const GroupMember = require("../model/groupMember");
const { Op } = require("sequelize");

const groupDao = {
    createGroup: async (data) => {
        const { membersEmail, paymentStatus, ...groupData } = data;
        
        // Extract payment status fields if present
        if (paymentStatus) {
            groupData.paymentAmount = paymentStatus.amount;
            groupData.paymentCurrency = paymentStatus.currency;
            groupData.paymentDate = paymentStatus.date;
            groupData.paymentIsPaid = paymentStatus.isPaid;
        }

        const group = await Group.create(groupData);

        if (membersEmail && Array.isArray(membersEmail)) {
            for (const email of membersEmail) {
                await GroupMember.create({
                    groupId: group.id,
                    email: email.trim(),
                    joinedAt: new Date(),
                    leftAt: null
                });
            }
        }

        return await Group.findByPk(group.id, {
            include: [{ model: GroupMember, as: 'members' }]
        });
    },

    updateGroup: async (data) => {
        const { groupId, paymentStatus, ...updateFields } = data;
        const group = await Group.findByPk(groupId);
        if (!group) return null;

        if (paymentStatus) {
            updateFields.paymentAmount = paymentStatus.amount;
            updateFields.paymentCurrency = paymentStatus.currency;
            updateFields.paymentDate = paymentStatus.date;
            updateFields.paymentIsPaid = paymentStatus.isPaid;
        }

        await group.update(updateFields);

        return await Group.findByPk(groupId, {
            include: [{ model: GroupMember, as: 'members' }]
        });
    },

    addMembers: async (groupId, ...membersEmails) => {
        for (const email of membersEmails) {
            const trimmedEmail = email.trim();
            // Check if there's an active membership already
            const existing = await GroupMember.findOne({
                where: { groupId, email: trimmedEmail, leftAt: null }
            });
            if (!existing) {
                await GroupMember.create({
                    groupId,
                    email: trimmedEmail,
                    joinedAt: new Date(),
                    leftAt: null
                });
            }
        }
        return await Group.findByPk(groupId, {
            include: [{ model: GroupMember, as: 'members' }]
        });
    },

    removeMembers: async (groupId, ...membersEmails) => {
        for (const email of membersEmails) {
            const trimmedEmail = email.trim();
            // Soft delete: set leftAt date instead of deleting the record
            await GroupMember.update(
                { leftAt: new Date() },
                { where: { groupId, email: trimmedEmail, leftAt: null } }
            );
        }
        return await Group.findByPk(groupId, {
            include: [{ model: GroupMember, as: 'members' }]
        });
    },

    getGroupByEmail: async (email) => {
        const memberships = await GroupMember.findAll({
            where: { email: email.trim() },
            attributes: ['groupId']
        });
        const groupIds = [...new Set(memberships.map(m => m.groupId))];
        return await Group.findAll({
            where: { id: groupIds },
            include: [{ model: GroupMember, as: 'members' }]
        });
    },

    getGroupByStatus: async (status) => {
        return await Group.findAll({
            where: { paymentIsPaid: status },
            include: [{ model: GroupMember, as: 'members' }]
        });
    },

    getAuditLog: async (groupId) => {
        const group = await Group.findByPk(groupId);
        return group ? group.paymentDate : null;
    },

    getGroupsPaginated: async (email, limit, skip, sortOptions = { createdAt: -1 }) => {
        const memberships = await GroupMember.findAll({
            where: { email: email.trim() },
            attributes: ['groupId']
        });
        const groupIds = [...new Set(memberships.map(m => m.groupId))];

        let order = [['createdAt', 'DESC']];
        if (sortOptions.name) {
            order = [['name', sortOptions.name === 1 ? 'ASC' : 'DESC']];
        } else if (sortOptions.createdAt) {
            order = [['createdAt', sortOptions.createdAt === 1 ? 'ASC' : 'DESC']];
        }

        const { rows, count } = await Group.findAndCountAll({
            where: { id: groupIds },
            include: [{ model: GroupMember, as: 'members' }],
            order,
            limit,
            offset: skip
        });

        return { groups: rows, total: count };
    },

    getGroupById: async (groupId) => {
        return await Group.findByPk(groupId, {
            include: [{ model: GroupMember, as: 'members' }]
        });
    },

    unsettleGroup: async (groupId) => {
        const group = await Group.findByPk(groupId);
        if (group) {
            await group.update({ paymentIsPaid: false });
        }
        return await Group.findByPk(groupId, {
            include: [{ model: GroupMember, as: 'members' }]
        });
    },
};

module.exports = groupDao;