const router = require("express").Router();
const terraform = require("../models/terraform.model");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const appointmentImport = require("../models/appointment.model");
const { Terraform, Slot, DateSchedule } = terraform;
const { Appointment, Feedback } = appointmentImport;
const bcrypt = require('../bcrypt/bcrypt');

function createDate(date) {
    return new DateSchedule({
        date: date,
        slots: [
            new Slot({
                time: "09:00:00",
                isBooked: false,
            }),
            new Slot({
                time: "12:00:00",
                isBooked: false,
            }),
            new Slot({
                time: "15:00:00",
                isBooked: false,
            }),
        ],
    });
}

/**
 * Get Terraform
 */
router.route('/').get((req, res) => {
    Doctor.find()
        .then((terraform) => {
            res.json(terraform);
        })
        .catch((err) => {
            res.status(400).json(`Error: ${err}`);
        });
})

/**
 * Add a Terraform
 */
router.route('/add').post((req, res) => {
    const username = req.body.username; 
    const pass = req.body.pass;
    const name = req.body.name;
    const phoneNumber = req.body.phoneNumber;
    const feesPerSession = req.body.feesPerSession;

    const newTerrform = new Terraform({
        username,
        password,
        name,
        phoneNumber,
        feesPerSession,
    });

    newTerrform.save()
        .then(() => {
            res.json("Terraform Added!!");
        })
        .catch((err) => {
            res.status(400).json(`Error: ${err}`)
        });
});

/**
 * Update Terraform
 */
router.route('/update').put((req, res) => {
    const username = req.body.username; 

    Terraform.findOne({username: username}).then((terraform) => {
        if (terraform) {
            terraform.name = req.body.name;
            terraform.phoneNumber = req.body.phoneNumber;
            terraform.feesPerSession = req.body.feesPerSession;

            terraform.save()
                .then(() => {
                    res.json("Terraform Updated")
                })
                .catch((err) => {
                    res.status(400).json(`Error: ${err}`)
                });
        }
    });
});

/**
 * Terraform Login
 */
router.route('/login').post(async (req, res) => {
    try {
        const username = req.body.username;

        // Password entered by the user
        const plainTextPassword = req.body.password;
        // Password Salt for hashing purpose
        const passwordSalt = process.env.PASSWORD_SALT;
        // Encrypted password after hashing operation
        const encryptedPassword = bcrypt.hash(plainTextPassword, passwordSalt);

        const terrform = await Terraform.findOne({
            username: username,
            password: encryptedPassword
        });
        console.log(terraform);

        if (terraform == null) {
            return res.status(200).json({message: "Wrong Username or Password"});
        } 

        // When Terraform Found, return token to client side
        const token = jwt.sign(
            JSON.stringify(terraform),
            process.env.KEY,
            {
                algorithm: process.env.ALGORITHM,
            }
        );
        return res.status(200).json({ token: token.toString() });
    } catch(err) {
        console.log(err);
        return res.status(400).json(err);
    }
});

/**
 * Get Slots available for the date
 */
router.route('/get-slots').post(async (req, res) => {
    try {
        const id = req.body.terraformId; 
        const date = req.body.date;

        const terraform = await Terraform.findOne({ _id: id })

        if (terraform == null) {
            console.log("Terraform not found in the Database!!");
            return res.status(201).json({
                message: "Terraform not found in the Database!!",
            });
        }

        // Find Date
        let cnt = 0;
        for (const i of terraform.dates) {
            if (i.date == date) {
                return res.status(200).json(i);
            }
            cnt++;
        }

        const oldLength = cnt;
        // Add new slots if date not found in the database
        const dateSchedule = createDate(date);
        const updatedTerraform = await Terraform.findOneAndUpdate(
            { _id: terraform._id },
            { $push: { dates: dateSchedule } },
            { new: true }
        );
        if (updatedTerraform) {
            return res.status(200).json(updatedTerraform.dates[oldLength]);
        } else {
            const err = { err: "An Error Occurred!" };
            throw err;
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            message: err,
        });
    }
});

/**
 * Book a Slot
 */
router.route('/book-slot').post((req, res) => {
    const terraformUserId = req.body.googleId;
    const terraformUserName = req.body.userName;
    const terraformId = req.body.terraformId;
    const slotId = req.body.slotId;
    const dateId = req.body.dateId;
    const meetLink = "";

    Terraform.findOne({ _id: terraformId }).then((terraform) => {
        const date = terraform.dates.id(dateId);
        const slot = terraform.slots.id(slotId);
        slot.isBooked = true;
        terraform
            .save()
            .then(() => {
                const newAppointment = new Appointment({
                    terraformId,
                    dateId,
                    slotId,
                    terraformUserId,
                    date: date.date,
                    slotTime: slot.time,
                    terraformName: terraform.name,
                    terraformEmail: terraform.email,
                    terraformUserName: terraformUserName,
                    googleMeetLink: meetLink,
                    feedback: new Feedback()
                });
                console.log(newAppointment);
                newAppointment
                    .save()
                    .then(() => {
                        return res.status(200).json(appointment);
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(400).json(err);
                    });
            })
            .catch ((err) => {
                console.log(err);
                res.status(400).json({
                    message: `An error occurred : ${err}`,
                });
            });
    });
});

/**
 * Appointments
 */
router.route('/appointments').post(async (req, res) => {
    try {
        const terraformId = req.body.terraformId;
        const appointments = await Appointment.find({
            terraformId: terraformId,
        });
        const sortedAppointments = appointments.sort((a, b) => {
            return (
                Date.parse(b.date + "T" + b.slotTime) -
                Date.parse(a.date + "T" + a.slotTime)
            )
        });
        res.status(200).json(sortedAppointments);
    } catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
});

/**
 * Get Appointment by _id
 */
router.route('/appointment/:id').get(async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const appointment = await Appointment.findOne({
            _id: appointmentId,
        });

        res.status(200).json(appointment);
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
});

/**
 * Today's Appointments
 */
router.route('/todays-appointments').post(async (req, res) => {
    try {
        const date = new Date()
        let currDate = date.getFullYear().toString()
        const month = date.getMonth() + 1
        const day = date.getDate()

        currDate += month < 10 ? ('-0' + month.toString()) : '-' + month.toString()
        currDate += day < 10 ? ('-0' + day.toString()) : '-' + day.toString()

        const terraformId = req.body.terraformId;
        const appointments = await Appointment.find({ terraformId: terraformId, date: currDate });

        const sortedAppointments = appointments.sort((a, b) => {
            return (
                Date.parse(a.date + "T" + a.slotTime) - Date.parse(b.date + "T" + b.slotTime)
            );
        });

        res.status(200).json(sortedAppointments);
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
});

/**
 * Previous Appointments
 */
router.route('/previous-appointments').post(async (req, res) => {
    try {
        const terraformId = req.body.terraformId;
        const appointments = await Appointment.find({ terraformId: terraformId });

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
            return Date.parse(currDateTime) >= Date.parse(appointment.date + 'T' + appointment.slotTime)
        })

        const sortedAppointments = filteredAppointments.sort((a, b) => {
            return Date.parse(b.date + 'T' + b.slotTime) - Date.parse(a.date + 'T' + a.slotTime)
        })

        res.status(200).json(sortedAppointments);
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
});

module.exports = router;