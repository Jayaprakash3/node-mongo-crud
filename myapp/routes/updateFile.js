var express = require('express');
var router = express.Router();


router.put('/update', async (req, res, next) => {

    var id = req.body.id;
    var name = req.body.name;
    console.log(id);
    console.log(name)
    await userModel.updateOne({ _id: id }, { $set: { name: name } });
    //  await userModel.updateOne({ _id:id}, { name:name });
    res.send("Updated successfully");
})

module.exports = router;
