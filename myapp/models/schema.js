const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    // id: ObjectId,
    "name": String,
    "username": String,
    "email": String,
    "department": String,
    "college": String
});

const userModelSchema = mongoose.model('user', userSchema);

module.exports=userModelSchema;

