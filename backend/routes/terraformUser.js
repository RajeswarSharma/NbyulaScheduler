const router = require('express').Router();
const jwt = require('jsonwebtoken');
const stripe = require('stripe')("sk_test_51IabQNSCj4BydkZ38AsoDragCM19yaMzGyBVng5KUZnCNrxCJuj308HmdAvoRcUEe2PEdoORMosOaRz1Wl8UX0Gt00FCuSwYpz");
const { v4: uuidv4 } = require('uuid');
const appointmentModel = require('../models/appointment.model');
const TerrformUser = require('../models/terraformUser.model');
const { Appointment } = appointmentModel;

/**
 * Get all user TerraformUsers
 */
router.route('/').get((req, res) => {
    TerrformUser.find().then(terraformuser =>{
        res.status(200).json(terraformuser);
    }).catch((err) => {
        res.status(400).json(`Error: ${err}`);
    })
})

/**
 * Add TerraForm User
 */
router.route('/add').post((req, res) => {
    const googleId = req.body.googleId;
    const name = req.body.name;
    const picture = req.body.picture;

    const newTerraformUser = new TerrformUser({
        googleId, name, picture
    })

    newTerraformUser.save().then(() => {
        res.status(200).json('TerraformUser Added');
    }).catch(err => {
        res.status(400).json(`Error: ${err}`)
    })
})

/**
 * Update Phone Number
 */
router.route('/update-phone').put((req, res) => {
    const googleId = req.body.googleId;

    TerrformUser.findOne({ googleId: googleId }).then(terraformuser => {
        if (terraformuser) {
            terraformuser.phoneNumber = req.body.phoneNumber;

            terraformuser.save().then(() => {
                res.status(200).json('Terraform\'s phone Number updated');
            }).catch(err => {
                res.status(400).json({ message: `Error: ${err}` });
            });
        }
    });
})

/**
 * Login
 */
router.route('/login').post(async (req, res) => {
    try {
        const tokenId = req.body.tokenId;

        // Decode JWT
        const decoded = jwt.decode(tokenId, process.env.KEY);
        const googleId = await decoded.sub;

        // Check if user already in database
        const terrformuser = await TerrformUser.findOne({ googleId: googleId });
        // If not Found
        if (terrformuser == null) {
            const { email, name, picture } = decoded;
            const newTerraformUser = new TerrformUser({
                googleId, email, name, picture
            });
            const savedPromise = await newTerraformUser.save();
            if (savedPromise) {
                return res.status(200).json({ phoneNumberExists: false });
            } else {
                throw savedPromise;
            }
        }
        // If Phone Number is not present 
        else if (terrformuser.phoneNumber == undefined) {
            return res.status(200).json({phoneNumberExists: false});
        } else {
            return res.status(200).json({ phoneNumberExists: true });
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
});

/**
 * Get TerraformUser Details
 */
router.route('/getDetails/:googleId').get(async (req, res) => {
    try {
        const googleId = req.params.googleId;
        const terraformUser = await TerrformUser.findOne({ googleId: googleId });
        
        if (terraformUser) {
            return res.status(200).json(terraformUser);
        } else {
            return res.status(201).json({message: "TerraformUser not found"});
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({message: err});
    }
});

/**
 * Check Previous Appointments
 */
router.route('/prev-appoinments').post(async (req, res) => {
    try {
        const googleId = req.body.googleId;
        const appoinments = await Appointment.find({ terraformId: googleId});

        const date = new Date();
        let currDateTime = date.getFullYear().toString();
        const month = date.getMonth() + 1
        const day = date.getDate()
        const hour = date.getHours()
        const minutes = date.getMinutes()
        const seconds  = date.getSeconds()

        currDateTime += month < 10 ? ('-0' + month.toString()) : '-' + month.toString()
        currDateTime += day < 10 ? ('-0' + day.toString()) : '-' + day.toString()
        currDateTime += hour < 10 ? ('T0' + hour.toString()) : 'T' + hour.toString()
        currDateTime += minutes < 10 ? (':0' + minutes.toString()) : ':' + minutes.toString()
        currDateTime += seconds < 10 ? (':0' + seconds.toString()) : ':' + seconds.toString()
        
        const filterAppointments = appoinments.filter((appointment) => {
            return Date.parse(currDateTime) >= Date.parse(appoinment.date + 'T' + appoinment.slotTime)
        });
        const sortedAppointments = filterAppointments.sort((a, b) => {
            return Date.parse(b.date + 'T' + b.slotTime) - Date.parse(a.date + 'T' + a.slotTime)
        });
    } catch (err) {
        console.log(err)
        res.status(400).json(err)
    }
});

/**
 * Upcoming Appointments
 */
router.route('/upcoming-appointments').post(async (req, res) => {
    try {
        const googleId = req.body.googleId
        const appointments = Appointment.find({ terraformId: googleId });

        // Get current dateTime
        const date = new Date()
        let currDateTime = date.getFullYear().toString()
        const month = date.getMonth() + 1
        const day = date.getDate()
        const hour = date.getHours()
        const minutes = date.getMinutes()
        const seconds = date.getSeconds()

        currDateTime += month < 10 ? ('-0' + month.toString()) : '-' + month.toString()
        currDateTime += day < 10 ? ('-0' + day.toString()) : '-' + day.toString()
        currDateTime += hour < 10 ? ('T0' + hour.toString()) : 'T' + hour.toString()
        currDateTime += minutes < 10 ? (':0' + minutes.toString()) : ':' + minutes.toString()
        currDateTime += seconds < 10 ? (':0' + seconds.toString()) : ':' + seconds.toString()

        const filteredAppointments = appointments.filter((appointment) => {
            return Date.parse(currDateTime) <= Date.parse(appointment.date + 'T' + appointment.slotTime)
        })

        const sortedAppointments = filteredAppointments.sort((a, b) => {
            return Date.parse(a.date + 'T' + a.slotTime) - Date.parse(b.date + 'T' + b.slotTime)
        })

        res.status(200).json(sortedAppointments);
    } catch (err) {
        console.log(err)
        res.status(400).json(err)
    }
});

/**
 * Payment
 */
router.route('/payment').post(async (req, res) => {
    const { finalBalance, token } = req.body;
    // An idempotency key is a unique value generated by the client which the server uses to recognize 
    // subsequent retries of the same request
    const idempotencyKey = uuidv4();

    return stripe.customers
        .create({
            email: token.email,
            source: token.id
        })
        .then(customer => {
            stripe.charges
                .create(
                    {
                        amount: finalBalance * 100,
                        currency: 'Rs',
                        customer: customer.id,
                        reciept_email: token.email,
                        description: `Appointment Booked Successfully`,
                        shipping: {
                            address: {
                                line1: token.card.address_line1,
                                line2: token.card.address_line2,
                                city: token.card.address_city,
                                country: token.card.address_country,
                                postal_code: token.card.address_zip
                            }
                        }
                    },
                    {
                        idempotencyKey
                    }
                )
                .then(result => res.status(200).json(result))
                .catch(err => {
                    console.log(err);
                    res.status(400).json(err);
                });
        })
        .catch((err) => {
            console.log(err)
            res.status(400).json(err);
        });
})

module.exports = router;