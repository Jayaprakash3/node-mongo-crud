/**
 * @swagger
 * /users/registerPatient:
 *   post:
 *     tags:
 *       - Users
 *     description: register patient api
 *     produces:
 *       - application/json
 *     parameters:
 *        - name: body
 *          description: send params for register patient
 *          in: body
 *          default: '{"first_name":"Karthik","last_name":"Sridharan","dob":"11-04-2009","email":"kscbe90@gmail.com","password":"123456","deviceId":"123","role":"doctor","deviceType":"web","fcmId":"5154646"}'
 *          schema:
 *            $ref: '#/definitions/registerPatientRef'
 *     responses:
 *       200:
 *         description: add patient and return the patient information
 */

/**
 * @swagger
 * definitions:
 *    registerPatientRef:
 *      properties:
 *        first_name:
 *          type: string
 *        last_name:
 *          type: string
 *        email:
 *          type: string
 *        healthConditions:
 *          type: [string]
 *        dob:
 *          type: string
 *        gender:
 *          type: string
 *        heightFt:
 *          type: integer
 *        heightIn:
 *          type: integer
 *        weight:
 *          type: integer
 *        password:
 *          type: string
 *        deviceId:
 *          type: string
 *        deviceType:
 *          type: string
 *        fcmId:
 *          type: string
 */
router.post('/registerPatient', function (req, res, next) {

    req.body.email = req.body.email.toLowerCase();
    var params = req.body;

    //console.log('params', params);

    var result = userService.validateFields({
        email: true,
        password: true,
        role: true,
        deviceId: true,
        //healthConditions: true,
        deviceType: true,
        fcmId: true,
        first_name: true,
        last_name: true,
        dob: true,
        gender: true,
        heightFt: false,
        heightIn: false,
        weight: false
    }, req.body, res);

    if (result.success == false) {
        return;
    }

    userModel.registerPatient(params).then((userData) => {
        if (userData) {
            var deviceInfo = {
                deviceId: params.deviceId,
                userId: userData._id,
                deviceType: params.deviceType,
                fcmId: params.fcmId
            }
            deviceModel.createOrUpdateDevice(deviceInfo).then(async (deviceData) => {
                var token = utils.generateJwtToken({
                    userId: userData._id,
                    deviceInfo: deviceInfo
                });

                userService.sendWelcomeEmail(userData.email);

                var firebaseAdmin = new FireBaseAdmin();
                firebaseAdmin.isUserDataAvail(userData._id).then((data1) => {
                    if (data1 == false) {
                        firebaseAdmin.addUserData(userData._id, userData);
                    }
                }).catch((error) => {
                    console.log('FireBaseAdmin', error.message)
                });

                await userModel.model().updateOne({
                    _id: userData._id
                }, {
                    $set: {
                        timezone: utils.getTimeSlotFromHeaders(req)
                    }
                })

                res.status(200).send({
                    message: "User registered successfully.",
                    data: userData,
                    deviceData: deviceData,
                    token: token
                })
            }).catch((error) => {
                res.status(403).send({
                    message: "Device creation failed.",
                    data: error
                })
            });
        } else {
            res.status(403).send({
                message: "Something wrong in register."
            })
        }
    }).catch((error) => {
        res.status(403).send({
            message: error.message,
            data: error
        })
    })
});



// function registerPatient(params) {
//     return new Promise((resolve, reject) => {1
//         // Perform asynchronous registration process
//         // For simplicity, we'll simulate it with a setTimeout

//         setTimeout(() => {
//             // Simulating a successful registration
//             const userData = {
//                 _id: '123456',
//                 name: params.name,
//                 age: params.age,
//                 email: params.email
//                 // Additional patient data
//             };

//             resolve(userData); // Resolve the promise with user data
//         }, 2000); // Simulate registration process taking 2 seconds
//     });
// }

// // Usage example:
// const params = {
//     name: 'John Doe',
//     age: 30,
//     email: 'johndoe@example.com'
//     // Additional registration parameters
// };

// registerPatient(params)
//     .then((userData) => {
//         console.log('Registration successful:', userData);

//         // Perform additional operations using the registered user data
//         var deviceInfo = {
//             deviceId: params.deviceId,
//             userId: userData._id,
//             deviceType: params.deviceType,
//             fcmId: params.fcmId
//         };

//         console.log('Device info:', deviceInfo);
//         // Continue with other logic
//     })
//     .catch((error) => {
//         console.error('Registration failed:', error);
//         // Handle the error, if registration fails
//     });



var express = require('express');
var router = express.Router();

router.post('/emp', async function (req, res) {
    var value = req.body;
    console.log("function is working");
    let newemp = new EmployeeModel({
        id: value.id,
        name: value.name,
        username: value.username,
        email: value.email,
        phone: value.phone,
        website: value.website,

    });

    await newemp.save(newemp);




    res.send(value);

});

module.exports = router;


/////////////////   deviveModel.js   /////////////-easy to understand update and add using mango and node 

var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const deviceSchema = new Schema({
    id: ObjectId,
    deviceId: String,
    type: String,
    fcmId: String,
    userId: { type: Schema.Types.ObjectId, ref: 'user' }
});

const deviceModel = mongoose.model('device', deviceSchema);

function model() {
    return deviceModel;
}

function createOrUpdateDevice(params) {
    return new Promise((resolve, reject) => {
        //console.log("0")
        deviceModel.findOne({
            "deviceId": params.deviceId,
            userId: params.userId
        }).then((data) => {
            if (data) {
                deviceModel.updateOne({
                    "_id": data._id
                }, {
                    fcmId: params.fcmId
                }).then((data) => {
                    resolve(data);
                }).catch((error) => {
                    reject(error);
                })
            } else {
                deviceModel.create({
                    deviceId: params.deviceId,
                    type: params.deviceType,
                    fcmId: params.fcmId,
                    userId: params.userId
                }).then((data) => {
                    resolve(data);
                }).catch((error) => {
                    reject(error);
                })
            }
        }).catch((error) => {
            reject(error);
        })
    })
}

function getFCMIds(params, callback) {
    model().find({ userId: { $in: params }, fcmId: { $nin: ["", null] } }, { fcmId: 1, type: 1, userId: 1 }, function (err, data) {
        return err ? callback(err, null) : callback(null, data)
    });
}

module.exports = {
    model,
    createOrUpdateDevice,
    getFCMIds
}



/////////////////   deviveModel.js   /////////////-easy to understand update and add using mango and node 



var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
var userService = require('../services/user');
var facilityUserMappingModel = require('./../models/facilityUserMappingModel');

const userSchema = new Schema({
    id: ObjectId,
    first_name: String,
    last_name: String,
    gender: String,
    weight: Number,
    heightFt: Number,
    heightIn: Number,
    address: {
        type: String,
        default: ''
    },
    facilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'facilityList',
        required: false
    },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    speciality: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'specializationSchema'
    },
    city: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: ''
    },
    postalCode: {
        type: String,
        default: ''
    },
    email: String,
    dob: Date,
    healthConditions: [String],
    password: String,
    phoneNo: {
        type: String,
        default: ''
    },
    temporaryPassword: String,
    profilePic: {
        type: String,
        default: ''
    },
    appointmentTypes: {
        type: [String],
        // 1- clinical visit
        // 2- video conference
        // 3- Immediate care clinic
        // 4- In-home visit
    },
    bio: { type: String, required: false },
    licenseNumber: String,
    stateLicense: String,
    expirationDate: Date,
    licenseDocument: String,
    // availabilties: [Object], // [{"day":"mon","hours":{"startDate":"10:25 AM","endDate":"6.00 PM"}},{"day":"tue","hours":{"startDate":"10:25 AM","endDate":"6.00 PM"}},{"day":"wed","hours":{"startDate":"10:25 AM","endDate":"6.00 PM"}}]
    role: String, // 'patient', 'doctor', 'admin', 'super admin'
    userVerified: { // for doctor
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
    },
    location: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
            required: false
        },
        coordinates: {
            type: [Number],
            required: false
        }
    },
    insuranceName: { type: String, default: null },
    memberId: { type: String, default: null },
    years_of_experience: String,
    allow_notification: { type: Boolean, default: true },
    badge_count: { type: Number, default: 0 },
    last_login_time: { type: Date, required: false },
    created_date: { type: Date, required: false },
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },
    request_date: { type: Date, required: false },
    is_declined: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_blocked: { type: Boolean, default: false },
    user_verification_code: { type: String },
    timezone: {
        type: String
    }
});
userSchema.index({
    location: "2dsphere"
})

const userModel = mongoose.model('user', userSchema);

function model() {
    return userModel;
}

function login(params) {
    return userModel.findOne({
        email: params.email,
        password: params.password,
        role: params.role,
        status: true
    })
}

function registerPatient(params) {
    return new Promise((resolve, reject) => {
        userModel.findOne({
            email: params.email
        }).then((data) => {
            if (!data) {
                var apiParams = {
                    first_name: params.first_name,
                    last_name: params.last_name,
                    dob: params.dob,
                    healthConditions: params.healthConditions ? params.healthConditions : [],
                    email: params.email,
                    weight: params.weight,
                    heightFt: params.heightFt,
                    heightIn: params.heightIn,
                    password: params.password,
                    created_date: new Date(),
                    gender: params.gender,
                    role: 'patient',
                    status: true,
                    userVerified: true
                }

                if (params.height) {
                    apiParams.height = params.height
                }

                if (params.weight) {
                    apiParams.weight = params.weight
                }

                userModel.create(apiParams).then((data) => {
                    resolve(data);
                }).catch((error) => {
                    reject(error)
                })
            } else {
                reject({
                    message: "The user is already registered."
                })
            }
        }).catch((error) => {
            reject(error)
        })
    })
}

function registerDoctor(params) {
    console.log(params.licenseDocument);
    return new Promise((resolve, reject) => {
        userModel.findOne({
            email: params.email
        }).then((data) => {
            if (!data) {
                userModel.create({
                    first_name: params.first_name,
                    last_name: params.last_name,
                    //dob: params.dob,
                    email: params.email,
                    password: params.password,
                    role: 'doctor',
                    created_date: new Date(),
                    speciality: params.speciality_id,
                    //gender: params.gender,
                    licenseNumber: params.licenseNumber,
                    stateLicense: params.stateLicense,
                    expirationDate: params.expirationDate,
                    licenseDocument: params.licenseDocument,
                    appointmentTypes: params.appointmentTypes,
                    years_of_experience: params.years_of_experience,
                    status: true,
                    userVerified: true
                }).then((data) => {
                    resolve(data);
                }).catch((error) => {
                    reject(error)
                })
            } else {
                reject({
                    message: "The email address is already exists."
                })
            }
        }).catch((error) => {
            reject(error)
        })
    })
}


function getAvailableProvidersByDistance(data, callback) {
    var matchQuery = {
        city: data.city,
        role: "doctor",
        userVerified: true,
        speciality: mongoose.Types.ObjectId(data.health_issue),
        appointmentTypes: {
            $in: Object.values(data.appointmentTypes)
        }
    };
    var aggregateQuery = [{
        $geoNear: {
            near: {
                type: "Point",
                // coordinates: [77.828345 , 12.723179]
                coordinates: [Number(data.lon), Number(data.lat)]
            },
            distanceField: "dist.calculated",
            includeLocs: "dist.location",
            spherical: true
        }

    },
    {
        "$lookup": {
            'from': "doctor_reviews",
            'localField': "_id",
            'foreignField': "doctorId",
            'as': "doctor_reviews"
        }
    },
    {
        "$unwind": {
            'path': "$doctor_reviews",
            'preserveNullAndEmptyArrays': true
        }
    },
    {
        "$lookup": {
            'from': "facility_lists",
            'localField': "_id",
            'foreignField': "doctorId",
            'as': "facility"
        }
    },
    {
        "$unwind": {
            'path': "$facility"
        }
    },
    {
        "$match": matchQuery
    },

    {
        '$group': {
            _id: "$doctor_reviews.doctorId",
            "overall": {
                $avg: "$doctor_reviews.rating"
            },
            'name': {
                "$first": {
                    $concat: ["$first_name", " ", "$last_name"]
                },
            },
            'distance': { "$first": "$dist.calculated" },
            'profilePic': { "$first": "$profilePic" },
            'faclity_name': { "$first": "$facility.facilityName" },
            'facility_address': { "$first": "$facility.facilityAddress" }

        }
    },
    {
        "$sort": { "distance": 1 }
    }

    ]
    model().aggregate(

        aggregateQuery,
        function (error, response) {
            if (error) {
                callback(error, response);
            } else {
                callback(error, response);
            }
        }
    );
}


function getAvailableProvidersByRating(data, callback) {
    var matchQuery = {
        // city: data.city,
        role: "doctor",
        userVerified: true,
        speciality: mongoose.Types.ObjectId(data.health_issue),
        appointmentTypes: {
            $in: Object.values(data.appointmentTypes)
        }
    };
    var aggregateQuery = [
        //     {
        //     $geoNear: {
        //         near: {
        //             type: "Point",
        //             // coordinates: [77.828345 , 12.723179]
        //             coordinates: [Number(data.lon), Number(data.lat)]

        //         },
        //         distanceField: "dist.calculated",
        //         includeLocs: "dist.location",
        //         spherical: true
        //     }
        // }, 
        {
            "$lookup": {
                'from': "doctor_reviews",
                'localField': "_id",
                'foreignField': "doctorId",
                'as': "doctor_reviews"
            }
        },
        {
            "$unwind": {
                'path': "$doctor_reviews",
                'preserveNullAndEmptyArrays': true
            }
        },
        {
            "$lookup": {
                'from': "facility_lists",
                'localField': "_id",
                'foreignField': "doctorId",
                'as': "facility"
            }
        },
        {
            "$unwind": {
                'path': "$facility"
            }
        },

        {
            "$match": matchQuery
        },
        {
            '$group': {
                _id: "$_id",
                "overall": {
                    $avg: "$doctor_reviews.rating"
                },
                'name': {
                    "$first": {
                        $concat: ["$first_name", " ", "$last_name"]
                    },
                },
                // 'distance': { "$first": "$dist.calculated" },
                'profilePic': { "$first": "$profilePic" },
                'faclity_name': { "$first": "$facility.facilityName" },
                'facility_address': { "$first": "$facility.facilityAddress" }
            }
        },
        {
            '$sort': {
                'overall': -1
            }
        }
    ]
    model().aggregate(
        aggregateQuery,
        function (error, response) {
            if (error) {
                callback(error, response);
            } else {
                callback(error, response);
            }
        }
    );
}

function getNewAvailableProvidersByRating(data, callback) {
    var matchQuery = {
        "users.is_deleted": false,
        "users.role": "doctor",
        "users.userVerified": true,
        "users.appointmentTypes": {
            $in: [data.appointmentTypes, parseInt(data.appointmentTypes)]
        },
        "users.speciality": mongoose.Types.ObjectId(data.health_issue),
        "facility_lists.isDeleted": false
    };
    var aggregateQuery = [
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "users"
            }
        },
        {
            $unwind: {
                path: "$users"
            }
        },
        {
            $lookup: {
                from: "facility_lists",
                localField: "facility_id",
                foreignField: "_id",
                as: "facility_lists"
            }
        },
        {
            $unwind: {
                path: "$facility_lists"
            }
        },
        {
            $match: matchQuery
        },
        {
            $lookup: {
                from: "doctor_reviews",
                localField: "userId",
                foreignField: "doctorId",
                as: "doctor_reviews"
            }
        },
        {
            $project: {
                _id: "$userId",
                facility_id: 1,
                first_name: "$users.first_name",
                last_name: "$users.last_name",
                speciality: "$users.speciality",
                profilePic: "$users.profilePic",
                email: "$users.email",
                userCreatedDate: "$users.created_date",
                //doctor_reviews: 1,
                //doctorAvgRating: { $avg: "$doctor_reviews.rating" },
                overall: { $cond: [{ $avg: "$doctor_reviews.rating" }, { $round: [{ $avg: "$doctor_reviews.rating" }, 1] }, 0] },
                "faclity_name": "$facility_lists.facilityName",
                "facility_address": "$facility_lists.facilityAddress",
                "city": "$facility_lists.city",
                "state": "$facility_lists.state",
                "zipcode": "$facility_lists.zipcode",
            }
        },
        {
            $sort: {
                overall: -1,
                "userCreatedDate": 1
            }
        }]
    facilityUserMappingModel.model().aggregate(
        aggregateQuery,
        function (error, response) {
            if (error) {
                callback(error, response);
            } else {
                callback(error, response);
            }
        }
    );
}



function getDoctorDetails(params, callback) {
    var matchQuery = {
        _id: mongoose.Types.ObjectId(params.doctor_id),

    }
    var aggregateQuery = [
        //     {
        //     $geoNear: {
        //         near: {
        //             type: "Point",
        //             coordinates: [Number(params.lon), Number(params.lat)]
        //         },
        //         distanceField: "dist.calculated",
        //         includeLocs: "dist.location",
        //         spherical: true
        //     }
        // }, 
        {
            "$match": matchQuery
        },
        {
            "$lookup": {
                'from': "specializations",
                'localField': "speciality",
                'foreignField': "_id",
                'as': "specialization"
            }
        },
        {
            "$unwind": {
                'path': "$specialization",
                'preserveNullAndEmptyArrays': true
            }
        },
        {
            "$lookup": {
                'from': "availabilities",
                'localField': "_id",
                'foreignField': "doctor_id",
                'as': "availability"
            }
        },
        {
            "$unwind": {
                'path': "$availability",
                'preserveNullAndEmptyArrays': true
            }
        },
        {
            "$lookup": {
                'from': "doctor_reviews",
                'localField': "_id",
                'foreignField': "doctorId",
                'as': "doctor_reviews"
            }
        },
        {
            "$unwind": {
                'path': "$doctor_reviews",
                'preserveNullAndEmptyArrays': true
            }
        },
        {
            "$lookup": {
                'from': "facility_lists",
                'localField': "_id",
                'foreignField': "doctorId",
                'as': "facility"
            }
        },
        {
            "$unwind": {
                'path': "$facility",
                'preserveNullAndEmptyArrays': true
            }
        },

        {
            '$group': {
                _id: "$doctor_reviews.doctorId",
                "overall": {
                    $avg: "$doctor_reviews.rating"
                },
                'name': {
                    "$first": {
                        $concat: ["$first_name", " ", "$last_name"]
                    },
                },
                // 'distance': { "$first": "$dist.calculated" },
                'profilePic': { "$first": "$profilePic" },
                'facility_id': { "$first": "$facility._id" },
                'faclity_name': { "$first": "$facility.facilityName" },
                'facility_address': { "$first": "$facility.facilityAddress" },
                'availability': { "$first": "$availability.days" },
                'bio': { "$first": "$bio" },
                'specialization': { "$first": "$specialization.speciality_name" },
                'appointmentTypes': { "$first": "$appointmentTypes" },
                'years_of_experience': { "$first": "$years_of_experience" }

            }
        },
    ]

    model().aggregate(aggregateQuery, function (error, response) {
        if (error) {
            callback(error, response);
        } else {
            callback(error, response);
        }
    });
}

function finishPatientProfile(params, callback) {
    var id = params.id;
    var first_name = params.first_name;
    var last_name = params.last_name;
    var email = params.email;
    var profilePic = params.profilePic;
    var insuranceName = params.insuranceName;
    var memberId = params.memberId;

    var setModelParams = {
        email: email,
        first_name: first_name,
        last_name: last_name,
        insuranceName: insuranceName,
        memberId: memberId
    };

    if (profilePic) {
        setModelParams.profilePic = profilePic
    }

    model().findOneAndUpdate({ "_id": id },
        {
            $set: setModelParams
        }, { new: true }, function (error, response) {
            callback(error, response);
        });
}


function getDoctorFacilityListWithAvailability(doctorId, callback) {
    var doctorId = mongoose.Types.ObjectId(doctorId)
    var matchQuery = { _id: doctorId }
    var aggregateQuery = [
        {
            "$match": matchQuery
        }, {
            "$lookup": {
                'from': "availabilities",
                'localField': "_id",
                'foreignField': "doctor_id",
                'as': "availability"
            }
        },
        {
            "$unwind": {
                'path': "$availability"
            }
        },
        {
            "$lookup": {
                'from': "facility_lists",
                'localField': "_id",
                'foreignField': "doctorId",
                'as': "facility"
            }
        },
        {
            "$unwind": {
                'path': "$facility"
            }
        },
        {
            "$project": {
                "doctorId": "$_id",
                "facilityName": "$facility.facilityName",
                "facilityAddress": "$facility.facilityAddress",
                "availability": "$availability.days"
            }
        }


    ]

    model().aggregate(aggregateQuery, function (error, response) {
        if (error) { callback(error, response) }
        else { callback(error, response) }
    })
}


function getDoctorProfile(doctorId, callback) {
    var doctorId = mongoose.Types.ObjectId(doctorId);
    var matchQuery = { "_id": doctorId }
    var aggregateQuery = [{
        "$match": matchQuery
    }, {
        "$lookup": {
            'from': "specializations",
            'localField': "speciality",
            'foreignField': "_id",
            'as': "specialization"
        }
    },
    {
        "$unwind": {
            'path': "$specialization"
        }
    }
    ]
    model().aggregate(aggregateQuery, function (error, response) {
        if (error) { callback(error, response) }
        else { callback(error, response) }
    })
}

function updateNotificationSettings(params, callback) {
    model().findOneAndUpdate({
        "_id": params.userId
    }, {
        "allow_notification": params.allow_notification
    }, { new: true }, function (err, user) {
        if (err) {
            return callback(err, user);
        } else {
            return callback(err, user);
        }
    });
}


function setBatchNotificationRead(params, callback) {
    model().updateOne({ _id: params }, { $set: { badge_count: 0 } }, function (errc, response) {
        if (errc) {
            callback(errc, null);
        } else {
            callback(null, response);
        }
    });
}


function getAdminProfile(adminId, callback) {
    var adminId = mongoose.Types.ObjectId(adminId);
    model().findOne({ _id: adminId }, { first_name: 1, last_name: 1, email: 1, profilePic: 1, allow_notification: 1 }, function (error, response) {
        callback(error, response);
    });
}

function updateAdminProfile(params, callback) {
    var id = params.id;
    var first_name = params.first_name;
    var last_name = params.last_name;
    var email = params.email;
    var profilePic = params.profilePic;

    var request = {
        email: email,
        first_name: first_name,
        last_name: last_name,
    };

    if (profilePic) {
        request.profilePic = profilePic
    }

    model().findOneAndUpdate({ "_id": id },
        { $set: request }, function (error, response) {
            callback(error, response);
        });
}


function registerAdminUser(params) {
    return new Promise((resolve, reject) => {
        userModel.findOne({
            email: params.email
        }).then((data) => {
            if (!data) {
                var adminUser = {
                    first_name: params.first_name,
                    last_name: params.last_name,
                    email: params.email,
                    created_date: new Date(),
                    role: "admin",
                    status: true,
                    user_verification_code: params.user_verification_code,
                    userVerified: false
                };
                console.log(adminUser);
                userModel.create(adminUser).then((data) => {
                    resolve(data);
                }).catch((error) => {
                    reject(error)
                })
            } else {
                reject({
                    message: "The email address is already exists."
                })
            }
        }).catch((error) => {
            reject(error)
        })
    })
}

function getDoctorsBySpeciality(params, callback) {
    var speciality_id = mongoose.Types.ObjectId(params.speciality_id);
    var facility_id = mongoose.Types.ObjectId(params.facility_id);

    var aggregateQuery = [
        {
            "$lookup": {
                "from": "specializations",
                "localField": "speciality",
                "foreignField": "_id",
                "as": "specializations"
            }
        },
        {
            "$unwind": {
                "path": "$specializations"
            }
        },
        {
            "$lookup": {
                "from": "facility_user_mappings",
                "localField": "_id",
                "foreignField": "userId",
                "as": "facility_user_mappings"
            }
        },
        {
            "$unwind": {
                "path": "$facility_user_mappings"
            }
        },
        {
            "$match": {
                "specializations._id": speciality_id,
                "facility_user_mappings.facility_id": facility_id
            }
        },
        {
            "$project": {
                "specializations_id": "$specializations._id",
                "specializations": "$specializations.speciality_name",
            }
        }
    ];

    model().aggregate(aggregateQuery, function (error, response) {
        if (error) { callback(error, response) }
        else { callback(error, response) }
    })
}


function addDoctor(params) {
    return new Promise((resolve, reject) => {
        userModel.findOne({
            email: params.email
        }).then((data) => {
            if (!data) {
                var doctor = {
                    first_name: params.first_name,
                    last_name: params.last_name,
                    email: params.email,
                    role: "doctor",
                    status: false,
                    userVerified: false,
                    address: params.address,
                    city: params.city,
                    state: params.state,
                    created_date: new Date(),
                    postalCode: params.postalCode,
                    appointmentTypes: params.appointmentTypes
                };

                if (params.specialityId) {
                    doctor.speciality = params.specialityId;
                }

                console.log(doctor);
                userModel.create(doctor).then((data) => {
                    resolve(data);
                }).catch((error) => {
                    reject(error)
                })
            } else {
                reject({
                    message: "The email address is already exists."
                })
            }
        }).catch((error) => {
            reject(error)
        })
    })
}

function getDoctorsListForAdmin(params, callback) {
    var limit = parseInt(params.limit);
    var skip = parseInt(params.skip);
    var aggregate = [
        {
            "$facet": {
                "totalData": [
                    {
                        "$lookup": {
                            "from": "specializations",
                            "localField": "speciality",
                            "foreignField": "_id",
                            "as": "specializations"
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$specializations",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        "$lookup": {
                            'from': "facility_user_mappings",
                            'localField': "_id",
                            'foreignField': "userId",
                            'as': "facility_user_mappings"
                        }
                    },
                    {
                        $match: {
                            "role": "doctor",
                            "is_deleted": false,
                            "facility_user_mappings.facility_id": params.facilityId
                        }
                    },
                    {
                        $project: {
                            "_id": 1,
                            "dateRequested": 1,
                            "licenseNumber": 1,
                            "email": 1,
                            "profilePic": 1,
                            "name": {
                                "$concat": [
                                    "$first_name",
                                    " ",
                                    "$last_name"
                                ]
                            },
                            "speciality_name": "$specializations.speciality_name",
                            "is_blocked": 1
                        }
                    },
                    {
                        "$skip": skip
                    },
                    {
                        "$limit": limit
                    }

                ],
                "totalCount": [
                    {
                        "$lookup": {
                            'from': "facility_user_mappings",
                            'localField': "_id",
                            'foreignField': "userId",
                            'as': "facility_user_mappings"
                        }
                    },
                    {
                        "$match": {
                            "role": "doctor",
                            "is_deleted": false,
                            "facility_user_mappings.facility_id": params.facilityId
                        }
                    },
                    {
                        "$count": "count"
                    }
                ]
            }
        }];

    model().aggregate(aggregate, function (error, response) {
        callback(error, response);
    });
}


function getDoctorsListForSuperAdmin(params, callback) {
    var limit = parseInt(params.limit);
    var skip = parseInt(params.skip);
    var aggregate = [
        {
            "$facet": {
                "totalData": [
                    {
                        "$lookup": {
                            "from": "specializations",
                            "localField": "speciality",
                            "foreignField": "_id",
                            "as": "specializations"
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$specializations",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        "$match": {
                            "role": "doctor",
                            "is_deleted": false
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "dateRequested": 1,
                            "licenseNumber": 1,
                            "email": 1,
                            "profilePic": 1,
                            "name": {
                                "$concat": [
                                    "$first_name",
                                    " ",
                                    "$last_name"
                                ]
                            },
                            "speciality_name": "$specializations.speciality_name",
                            "is_blocked": 1
                        }
                    },
                    {
                        "$skip": skip
                    },
                    {
                        "$limit": limit
                    }
                ],
                "totalCount": [
                    {
                        "$match": {
                            "role": "doctor",
                            "is_deleted": false
                        }
                    },
                    {
                        "$count": "count"
                    }
                ]
            }
        }
    ];
    model().aggregate(aggregate, function (error, response) {
        callback(error, response);
    });
}

function getDoctorProfileForSuperAdmin(doctorId, callback) {
    var doctorId = mongoose.Types.ObjectId(doctorId);

    var aggregate = [
        {
            "$lookup": {
                "from": "specializations",
                "localField": "speciality",
                "foreignField": "_id",
                "as": "specializations"
            }
        },
        {
            "$unwind": {
                "path": "$specializations",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "facility_user_mappings",
                "localField": "_id",
                "foreignField": "userId",
                "as": "facility_user_mappings"
            }
        },
        {
            "$unwind": {
                "path": "$facility_user_mappings",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "facility_lists",
                "localField": "facility_user_mappings.facility_id",
                "foreignField": "_id",
                "as": "facility_lists"
            }
        },
        {
            "$unwind": {
                "path": "$facility_lists",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "facility_doctor_availability_mapping",
                "localField": "_id",
                "foreignField": "doctor_id",
                "as": "facility_doctor_availability_mapping"
            }
        },
        {
            "$unwind": {
                "path": "$facility_doctor_availability_mapping",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "facility_doctor_availability_mapping",
                "localField": "facility_lists._id",
                "foreignField": "facility_id",
                "as": "facility_doctor_availability_mapping1"
            }
        },
        {
            "$unwind": {
                "path": "$facility_doctor_availability_mapping1",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$match": {
                "role": "doctor",
                "_id": doctorId
            }
        },
        {
            "$project": {
                "profilePic": "$profilePic",
                "name": {
                    "$concat": [
                        "Dr.",
                        "$first_name",
                        " ",
                        "$last_name"
                    ]
                },
                "speciality": "$specializations.speciality_name",
                "licenseNumber": "$licenseNumber",
                "stateOfLicense": "$stateLicense",
                "expirationDate": "$expirationDate",
                "yearsOfExperience": "$years_of_experience",
                "email": "$email",
                "appointmentTypes": "$appointmentTypes",
                "facilityName": "$facility_lists.facilityName",
                "facilityAddress": "$facility_lists.facilityName",
                "city": "$facility_lists.city",
                "state": "$facility_lists.state",
                "zipCode": "$facility_lists.zipCode",
                "facility_doctor_availability_mapping": 1,
                licenseDocument: 1
            }
        }
    ];

    model().aggregate(aggregate, function (error, response) {
        callback(error, response);
    });
}

function getAdminsListForSuperAdmin(params, callback) {
    var limit = parseInt(params.limit);
    var skip = parseInt(params.skip);

    var aggregate = [
        {
            "$facet": {
                "totalData": [
                    {
                        "$match": {
                            "role": "admin",
                            "is_deleted": false
                        }
                    },
                    {
                        "$lookup": {
                            "from": "admin_managements",
                            "localField": "_id",
                            "foreignField": "user_id",
                            "as": "admin_managements"
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$admin_managements"
                        }
                    },
                    {
                        "$match": {
                            "role": "admin"
                        }
                    },
                    {
                        "$project": {
                            "user_details": {
                                "name": {
                                    "$concat": [
                                        "Dr.",
                                        "$first_name",
                                        " ",
                                        "$last_name"
                                    ]
                                },
                                "email": "$email",
                                "first_name": "$first_name",
                                "last_name": "$last_name",
                                "role": "$role",
                            },
                            "admin_management_details": {
                                "_id": "$admin_managements._id",
                                "patients_access": "$admin_managements.patients_access",
                                "notification_access": "$admin_managements.notification_access",
                                "email_templates_access": "$admin_managements.email_templates_access",
                                "doctors_access": "$admin_managements.doctors_access",
                                "facilities_access": "$admin_managements.facilities_access",
                                "mobile_app_access": "$admin_managements.mobile_app_access",
                                "admin_management_access": "$admin_managements.admin_management_access",
                                "appointment_management_access": "$admin_managements.appointment_management_access",
                                "is_deleted": "$admin_managements.is_deleted",
                                "facility_id": "$admin_managements.facility_id",
                                "is_deactivated": "$admin_managements.is_deactivated",
                                "created_date_time": new Date("$admin_managements.created_date_time", "yyyy-MM-dd")
                            }
                        }
                    },
                    {
                        "$skip": skip
                    },
                    {
                        "$limit": limit
                    }
                ],
                "totalCount": [
                    {
                        "$match": {
                            "role": "admin"
                        }
                    },
                    {
                        "$count": "count"
                    }
                ]
            }
        }
    ];
    model().aggregate(aggregate, function (error, response) {
        callback(error, response);
    });
}

function getDoctorRequestsForSuperAdmin(params, callback) {
    var limit = parseInt(params.limit);
    var skip = parseInt(params.skip);

    var aggregate = [
        {
            "$facet": {
                "totalData": [
                    {
                        "$lookup": {
                            "from": "specializations",
                            "localField": "speciality",
                            "foreignField": "_id",
                            "as": "specializations"
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$specializations",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        "$match": {
                            "role": "doctor",
                            "userVerified": false,
                            "is_declined": {
                                $in: [false, null]
                            },
                        }
                    },
                    {
                        "$project": {
                            "name": {
                                "$concat": [
                                    "Dr.",
                                    "$first_name",
                                    " ",
                                    "$last_name"
                                ]
                            },
                            "speciality": "$specializations.speciality_name",
                            "licenseNumber": "$licenseNumber",
                            "is_declined": "$is_declined",
                            "status": "$status",
                            "email": "$email",
                            created_date: 1,
                        }
                    },
                    {
                        "$skip": skip
                    },
                    {
                        "$limit": limit
                    }
                ],
                "totalCount": [
                    {
                        "$lookup": {
                            "from": "specializations",
                            "localField": "speciality",
                            "foreignField": "_id",
                            "as": "specializations"
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$specializations",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        "$match": {
                            "role": "doctor",
                            "userVerified": false,
                            "is_declined": {
                                $in: [false, null]
                            },
                        }
                    },
                    {
                        "$count": "count"
                    }
                ]
            }
        }
    ];

    console.log(JSON.stringify(aggregate));
    model().aggregate(aggregate, function (error, response) {
        callback(error, response);
    });
}

function addPatient(params) {
    return new Promise((resolve, reject) => {
        userModel.findOne({
            email: params.email
        }).then((data) => {
            if (!data) {
                var patientUser = {
                    first_name: params.first_name,
                    last_name: params.last_name,
                    email: params.email,
                    role: "patient",
                    "created_date": new Date(),
                    status: true,
                    userVerified: false
                };
                userModel.create(patientUser).then((data) => {
                    resolve(data);
                }).catch((error) => {
                    reject(error)
                })
            } else {
                reject({
                    message: "The email address is already exists."
                })
            }
        }).catch((error) => {
            reject(error)
        })
    })
}

function getPatientsListForSuperAdmin(params, callback) {
    var limit = parseInt(params.limit);
    var skip = parseInt(params.skip);
    var aggregate = [
        {
            "$facet": {
                "totalData": [
                    {
                        "$match": {
                            "role": "patient",
                            "is_deleted": false,
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "created_date": 1,
                            "email": 1,
                            "profilePic": 1,
                            "name": {
                                "$concat": [
                                    "$first_name",
                                    " ",
                                    "$last_name"
                                ]
                            },
                            "status": 1,
                            "is_blocked": 1
                        }
                    },
                    {
                        "$skip": skip
                    },
                    {
                        "$limit": limit
                    }
                ],
                "totalCount": [
                    {
                        "$match": {
                            "role": "patient",
                            "is_deleted": false
                        }
                    },
                    {
                        "$count": "count"
                    }
                ]
            }
        }
    ];
    model().aggregate(aggregate, function (error, response) {
        callback(error, response);
    });
}


function getPatientProfileForAdmin(params, callback) {
    var patientId = mongoose.Types.ObjectId(params.patientId);

    var aggregate = [
        {
            "$facet": {
                "totalData": [
                    {
                        "$lookup": {
                            "from": "patient_diagnoses",
                            "localField": "_id",
                            "foreignField": "userId",
                            "as": "patient_diagnoses"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "diagnoses",
                            "localField": "patient_diagnoses.diagnosisId",
                            "foreignField": "_id",
                            "as": "diagnoses"
                        }
                    },
                    {
                        "$match": {
                            "_id": patientId
                        }
                    },
                    {
                        "$project": {
                            diagnoses: 1,
                            "profilePic": "$profilePic",
                            "first_name": "$first_name",
                            "height": {
                                "$concat": [
                                    {
                                        "$convert": {
                                            "input": "$heightFt",
                                            "to": "string"
                                        }
                                    },
                                    "'",
                                    {
                                        "$convert": {
                                            "input": "$heightIn",
                                            "to": "string"
                                        }
                                    },
                                    "\u0022"
                                ]
                            },
                            "insurance_policy": {
                                "$concat": [
                                    "$insuranceName",
                                    " ",
                                    "$memberId"
                                ]
                            },
                            "gender": "$gender",
                            "date_of_birth": "$dob",
                            "weight": {
                                "$concat": [
                                    {
                                        "$convert": {
                                            "input": "$weight",
                                            "to": "string"
                                        }
                                    },
                                    " lbs"
                                ]
                            },

                        }
                    }
                ],
                "documents": [
                    {
                        "$lookup": {
                            "from": "document_managers",
                            "localField": "_id",
                            "foreignField": "userId",
                            "as": "document_managers"
                        }
                    },
                    {
                        "$match": {
                            "_id": patientId
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$document_managers"
                        }
                    },
                    {
                        "$project": {
                            "url": "$document_managers.documentUrl",
                            "documentName": "$document_managers.documentName",
                            "documentDetails": "$document_managers.documentDetails",
                            createdDate: "$document_managers.createdDate"
                        }
                    }
                ],
                "medications": [
                    {
                        "$lookup": {
                            "from": "prescriptions",
                            "localField": "_id",
                            "foreignField": "userId",
                            "as": "prescriptions"
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$prescriptions"
                        }
                    },
                    {
                        "$match": {
                            "_id": patientId
                        }
                    },
                    {
                        "$project": {
                            "medication": "$prescriptions.medication",
                            "prescriptionDate": "$prescriptions.prescriptionDate",
                            "userId": "$prescriptions.userId",
                            "name": "$first_name",

                            "beforeFood": "$prescriptions.beforeFood",
                            "stillTaking": "$prescriptions.stillTaking",
                            "createdDate": "$prescriptions.createdDate",
                            "isDeleted": "$prescriptions.isDeleted",
                            "medicationType": "$prescriptions.medicationType",
                            "dose": "$prescriptions.dose",
                            "doseUnit": "$prescriptions.doseUnit",
                            "morningDoseCount": "$prescriptions.morningDoseCount",
                            "afternoonDoseCount": "$prescriptions.afternoonDoseCount",
                            "eveningDoseCount": "$prescriptions.eveningDoseCount",
                            "bedtimeDoseCount": "$prescriptions.bedtimeDoseCount",
                            "treatmentLength": "$prescriptions.treatmentLength",
                            "treatmentUnit": "$prescriptions.treatmentUnit",
                            "prescriptionNote": "$prescriptions.prescriptionNote",
                        }
                    }
                ]
            }
        }
    ];
    model().aggregate(aggregate, function (error, response) {
        callback(error, response);
    });
};


function getDoctorsBySpecialityForFacility(params, callback) {
    var facilityId = mongoose.Types.ObjectId(params.facilityId);
    var specialityId = mongoose.Types.ObjectId(params.specialityId);

    var aggregate = [
        {
            "$lookup": {
                "from": "specializations",
                "localField": "speciality",
                "foreignField": "_id",
                "as": "specializations"
            }
        },
        {
            "$unwind": {
                "path": "$specializations"
            }
        },
        {
            "$lookup": {
                "from": "facility_user_mappings",
                "localField": "_id",
                "foreignField": "userId",
                "as": "facility_user_mappings"
            }
        },
        {
            "$unwind": {
                "path": "$facility_user_mappings"
            }
        },
        {
            "$lookup": {
                "from": "facility_lists",
                "localField": "facility_user_mappings.facility_id",
                "foreignField": "_id",
                "as": "facility_lists"
            }
        },
        {
            "$unwind": {
                "path": "$facility_lists"
            }
        },
        {
            "$match": {
                "role": "doctor",
                "facility_lists._id": facilityId,
                "specializations._id": specialityId
            }
        },
        {
            "$project": {
                "name": {
                    "$concat": [
                        "Dr.",
                        "$first_name",
                        " ",
                        "$last_name"
                    ]
                }
            }
        }
    ];
    model().aggregate(aggregate, function (error, response) {
        callback(error, response);
    });
};

function getDoctorsBySpecialityForFacility(params, callback) {
    var doctorId = params.doctorId;
    model().aggregate(aggregate, function (error, response) {
        callback(error, response);
    });
}

function getDoctorDetailsForAdminApproval(doctor_id, callback) {
    var match = {
        _id: mongoose.Types.ObjectId(doctor_id),
        'facility.isPrimary': true
    }
    var aggregate = [

        {
            "$lookup": {
                'from': "specializations",
                'localField': "speciality",
                'foreignField': "_id",
                'as': "specialization"
            }
        },
        {
            "$unwind": {
                'path': "$specialization"
            }
        },

        {
            "$lookup": {
                'from': "doctor_reviews",
                'localField': "_id",
                'foreignField': "doctorId",
                'as': "doctor_reviews"
            }
        },
        {
            "$unwind": {
                'path': "$doctor_reviews",
                'preserveNullAndEmptyArrays': true
            }
        },
        {
            "$lookup": {
                'from': "facility_lists",
                'localField': "_id",
                'foreignField': "doctorId",
                'as': "facility"
            }
        },
        {
            "$unwind": {
                'path': "$facility"
            }
        },
        {
            "$match": match
        },
        {
            '$group': {
                _id: "$doctor_reviews.doctorId",
                'name': {
                    "$first": {
                        $concat: ["$first_name", " ", "$last_name"]
                    },
                },
                'profilePic': { "$first": "$profilePic" },
                'facility_id': { "$first": "$facility._id" },
                'faclity_name': { "$first": "$facility.facilityName" },
                'facility_address': { "$first": "$facility.facilityAddress" },
                'bio': { "$first": "$bio" },
                'specialization': { "$first": "$specialization.speciality_name" },
                'appointmentTypes': { "$first": "$appointmentTypes" },
                'years_of_experience': { "$first": "$years_of_experience" },
                'licenseNumber': { "$first": "$licenseNumber" },
                'expirationDate': { "$first": "$expirationDate" },
                'licenseDocument': { "$first": "$licenseDocument" }
            }
        },
    ]

    model().aggregate(aggregate, function (error, response) {
        if (error) {
            callback(error, response);
        } else {
            callback(error, response);
        }
    });
}


function getDoctorRequestsForSuperAdminApproval(params, callback) {
    var limit = parseInt(params.limit);
    var skip = parseInt(params.skip);

    var aggregate = [
        {
            "$facet": {
                "totalData": [
                    {
                        "$match": {
                            "role": "doctor",
                            "userVerified": false
                        }
                    },
                    {
                        "$project": {
                            "name": {
                                "$concat": [
                                    "$first_name",
                                    " ",
                                    "$last_name"
                                ]
                            },
                            "licenseNumber": "$licenseNumber",
                            "status": "$status",
                            "email": "$email",
                            "created_date": "$created_date"
                        }
                    },
                    {
                        "$skip": skip
                    },
                    {
                        "$limit": limit
                    }
                ],
                "totalCount": [
                    {
                        "$match": {
                            "role": "doctor",
                            "userVerified": false
                        }
                    },
                    {
                        "$count": "count"
                    }
                ]
            }
        }
    ];

    model().aggregate(aggregate, function (error, response) {
        callback(error, response);
    });
}


function getDoctorDetailForSuperAdminApproval(doctor_id, callback) {
    console.log(doctor_id);
    var match = {
        _id: mongoose.Types.ObjectId(doctor_id),
        'facility_lists1.isPrimary': true,
        "role": "doctor"
    }
    var aggregate = [
        {
            "$lookup": {
                'from': "facility_user_mappings",
                'localField': "_id",
                'foreignField': "userId",
                'as': "facility_user_mappings"
            }
        },
        {
            "$unwind": {
                'path': "$facility_user_mappings"
            }
        },
        {
            "$lookup": {
                'from': "facility_lists",
                'localField': "_id",
                'foreignField': "doctorId",
                'as': "facility_lists1"
            }
        },
        {
            "$unwind": {
                'path': "$facility_lists1"
            }
        },
        {
            "$lookup": {
                'from': "specializations",
                'localField': "speciality",
                'foreignField': "_id",
                'as': "specialization"
            }
        },
        {
            "$unwind": {
                'path': "$specialization"
            }
        },
        {
            "$match": match
        },
        {
            "$project": {
                'name': {
                    $concat: [
                        "$first_name",
                        " ",
                        "$last_name"
                    ]
                },
                'profilePic': "$profilePic",
                "license_no": "$licenseNumber",
                "license_document": "$licenseDocument",
                "speciality": "$specialization.speciality_name",
                "is_primary": "$facility_lists1.isPrimary",
                "stateLicense": "$stateLicense",
                "years_of_experience": "$years_of_experience",
                "expirationDate": "$expirationDate",
                "appointmentTypes": "$appointmentTypes",
                "facility_name": "$facility_lists1.facilityName",
                "facility_address": "$facility_lists1.facilityAddress",
                "city": "$facility_lists1.city",
                "state": "$facility_lists1.state",
                "zipCode": "$facility_lists1.zipCode",

            }
        }
    ];

    model().aggregate(aggregate, function (error, response) {
        callback(error, response);
    });
}



module.exports = {
    model,
    login,
    registerPatient,
    registerDoctor,
    getAvailableProvidersByRating,
    getNewAvailableProvidersByRating,
    getAvailableProvidersByDistance,
    getDoctorDetails,
    finishPatientProfile,
    getDoctorFacilityListWithAvailability,
    getDoctorProfile,
    updateNotificationSettings,
    setBatchNotificationRead,
    getAdminProfile,
    updateAdminProfile,
    registerAdminUser,
    getDoctorsBySpeciality,
    addDoctor,
    getDoctorsListForSuperAdmin,
    getDoctorsListForAdmin,
    getDoctorProfileForSuperAdmin,
    getAdminsListForSuperAdmin,
    getDoctorRequestsForSuperAdmin,
    addPatient,
    getPatientsListForSuperAdmin,
    getPatientProfileForAdmin,
    getDoctorsBySpecialityForFacility,
    getDoctorDetailsForAdminApproval,
    getDoctorRequestsForSuperAdminApproval,
    getDoctorDetailForSuperAdminApproval,
}