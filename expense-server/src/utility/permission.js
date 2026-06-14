const { ADMIN_ROLE,VIEWER_ROLE,MANAGER_ROLE } = require("./userRoles")
const permissions = {
    [ADMIN_ROLE]: [
        'user:create',
        'user:update',
        'user:delete',
        'user:view',
        'group:create',
        'group:update',
        'group:delete',
        'group:view',
        'expense:create',
        'expense:update',
        'expense:delete',
        'expense:view',
        'payment:create',
        'subscription:create'

        


    ]

    ,
    [VIEWER_ROLE]: [
        'user:view',
        'group:view',
        'expense:view',
        'expense:delete',
        'expense:update',
        'expense:create',

        
        



    ]
    ,
    [MANAGER_ROLE]: [
        'user:view',
        'group:view',
        'group:update',
        'group:create',
        'expense:view',
        'expense:delete',
        'expense:update',
        'expense:create',
        
        
       




    ]
}
module.exports = permissions;
module.exports
