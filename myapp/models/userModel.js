const mongoose = require('mongoose');
const userModelSchema = require('./schema');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;



function createUser(params) {
    return new Promise((resolve, reject) => {


        userModelSchema.create(params).then((data) => {
            resolve(data);
        }).catch((error) => {
            reject(error)
        });
    });

}
function create(request) {
    return new Promise((resolve, reject) => {
        request.save().then((response) => {
            resolve(response);
        }).catch((err) => {
            reject(err);
        })
    });
}


// module.exports = router;

module.exports = {
    createUser,
    create

};