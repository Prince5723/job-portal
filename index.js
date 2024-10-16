const express = require("express");
const cors = require("cors")
const db = require('./src/db/index')
const dotenv = require('dotenv')

const app = express();

app.use(cors());

app.use(express.json())


dotenv.config({
    path: './.env'
})

//routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/jobs', require('./src/routes/jobRoutes'));

app.listen(8000, () => {
    console.log("Server is running at port 8000");
})

db.connectDB()
    .then(() => {
        console.log("Db connected successfully")
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    })