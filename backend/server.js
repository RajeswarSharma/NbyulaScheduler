const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const terraformUserRouter = require('./routes/terraformUser');
const terraformRouter = require('./routes/terraform');
const appointmentRouter = require('./routes/appointments')
const http = require("http");

require('dotenv').config();

app.use(express.json())
app.use(cors(
    {
        origin: "*", 
        methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
        credentials: true
    }
));


let port = process.env.PORT || 5000;
let uri = '';
process.env.NODE_ENV === 'test' ? uri = process.env.ATLAS_URI_TEST : uri = process.env.ATLAS_URI;


mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false}, (err) => {
    if (!err) {
        console.log("Connection to database Successful!!");
    }
    else{
        console.error("ERR: DB unavailable");
    }
});

// Port setup
const normPort = (val) => {
    let port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
};

const onError = (error) => {
    if (error.syscall !== "listen") {
    throw error;
}
const bind = typeof port === "string" ? "pipe " + port : "port " + port;
switch (error.code) {
    case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            default:
                throw error;
            }
        };
        
const onListening = () => {
    const addr = server.address();
    const bind = typeof port === "string" ? "pipe " + port : "port " + port;
};
        
port = normPort(port);
app.set("port", port);

const server = http.createServer(app);
server.on("error", onError);
server.on("listening", onListening);
server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

// Routes
app.use('/terraformUser', terraformUserRouter);
app.use('/terraform', terraformRouter);
app.use('/appointments', appointmentRouter);
app.get('/', (req, res) => {
    res.status(200).json("Hello");
})
        