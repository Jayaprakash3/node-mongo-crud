var express = require('express');
const userModelSchema = require('../models/schema');
var router = express.Router();

router.post('/createNewUser', async function (req, res) {
  var params = req.body;
  console.log(params)
  await userModel.createUser(params).then(async (userObj) => {
    if (userObj) {
      // res.status(200).send({
      //   user: userData
      // })
      console.log(userObj)
      var postReq = {
        title: params.title,
        body1: params.body1,
        userId: userObj._id
      }
      await postModel.createPost(postReq).then((postData) => {
        var result = {
          message: "User & Post saved successfully.",
          userData: userObj,

          postData: postData
        }

        console.log(result)
        res.status(200).send({
          result
        })
      }).catch((error) => {
        console.log()
        res.status(403).send({
          message: "Post creation Failed",
          data: error
        })
      })
    } else {
      res.status(403).send({
        message: "Databse Error"
      })
    }
  }).catch((error) => {
    res.status(403).send({
      message: "User data not found",
      data: error
    })

  })

});

router.put('/update', async (req, res, next) => {

  var userId = req.body.id;
  const updatedProperty = req.body.propertyName;
  const updatedValue = req.body.propertyValue;

  await userModelSchema.updateOne(
    { _id: userId },
    { $set: { [updatedProperty]: updatedValue } }
  );

  res.send("Updated successfully");
})

router.delete('/delete', async (req, res, next) => {
  var userId = req.body.id;

  var response = await userModelSchema.deleteMany({ _id: userId });
  res.send("Collection Deleted")
})


module.exports = router;
