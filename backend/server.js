const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const terraformUserRouter = require('./routes/terraformUser');
const terraformRouter = require('./routes/terraform');
const appointmentRouter = require('./routes/appointments')

require('dotenv').config();

app.use(express.json())
app.use(cors(
    {
        origin: "*", 
        methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
        credentials: true
    }
));

// Routes
app.use('/terraformUser', terraformUserRouter);
app.use('/terraform', terraformRouter);
app.use('/appointments', appointmentRouter);

const port = process.env.PORT || 5000;
let uri = '';
process.env.NODE_ENV = 'test' ? uri = process.env.ATLAS_URI_TEST : uri = process.env.ATLAS_URI;

mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false}, (err) => {
    if (!err) {
        console.log("Connection to database Successful!!");
    }
});

function getCurrentTime() {
    const date = new Date();
    console.log(date)
}

function getEndDateTime(dateTime) {
    const hrs = (parseInt(dateTime.split('T')[1].split(':')[0]) + 1).toString().padStart(2, '0')
    const time = hrs + ':00:00'
    const date = dateTime.split('T')[0]
    
    return date + 'T' + time
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
    console.log(`NODE_ENV = ${process.env.NODE_ENV}`)
    getCurrentTime();
    getEndDateTime("2022-10-22T09:00:00")
})

app.get('/', (req, res) => {
    res.status(200).json("Hello");
})

module.exports = app;