const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const postSchema = new mongoose.Schema({
    id: ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    body1: String,
    title: String,

});

const postModel = mongoose.model('post', postSchema);

function model() {
    return postModel;
}

function createPost(params) {
    try {
        console.log(params)
        return new Promise((resolve, reject) => {
            var postReq = {
                userId: params.userId,
                body1: params.body1,
                title: params.title
            };

            postModel.create(postReq).then((data) => {
                console.log(data)
                resolve(data);
            }).catch((error) => {
                reject(error)
            })
        });
    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    createPost,
    model
}