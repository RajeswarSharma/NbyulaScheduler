const router = require('express').Router();
const appointmentImport = require('../models/appointment.model');
const { Appointment, Feedback } = appointmentImport;

/**
 * Add Meet Link
 */
router.route('/add-meet-link').put((req, res) => {
    const meetLink = req.body.meetLink;
    const appointmentId = req.body.appointmentId;

    Appointment.findOne({ _id: appointmentId }).then((appointment) => {
        if (appointment) {
            appointment.googleMeetLink = meetLink;
            console.log(`Recieved Google Meet Link: ${meetLink}`);

            appointment.save().then(() => {
                console.log(`Updated the Google Meet Link!!`);
                res.status(200).json({message: "Google Meet Link Updated!"})
            }) .catch ((err) => {
                console.log(`Cannot add Google Meet Link to the Appointment due to ${err}`);
                res.status(400).json({ message: `Cannot add Google Meet Link to the Appointment due to ${err}` });
            });
        }
    })
});

/**
 * Feedback
 */
router.route('/feedback').put((req, res) => {
    const appointmentId = req.body.appointmentId;
    const stars = req.body.stars;
    const title = req.body.title;
    const review = req.body.review;

    Appointment.findOne({ _id: appointmentId }).then((appointment) => {
        if (appointment) {
            appointment.feedback.stars = stars;
            appointment.feedback.title = title;
            appointment.feedback.review = review;
            appointment.feedback.given = true;

            appointment.save().then(() => {
                res.status(200).json({ message: `Feedback updated successfully!` });
            }).catch(err => {
                console.log(err);
                res.status(400).json(err);
            })
        }
    }).catch(err => {
        console.log(err);
        res.status(400).json(err);
    })
}) 

module.exports = router;