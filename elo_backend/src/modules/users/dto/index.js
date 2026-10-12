const createUserSchema = require('./create-user.dto');
const updateUserSchema = require('./update-user.dto');
const searchUsersSchema = require('./search-users.dto');
const getUsersSchema = require('./get-users.dto');

module.exports = {
    createUserSchema,
    updateUserSchema,
    searchUsersSchema,
    getUsersSchema
};
