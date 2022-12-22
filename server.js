const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const path = require("path");
const app = express();
const ExpressMongoSanitize = require("express-mongo-sanitize");
const { default: helmet } = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");

// Load env vars
dotenv.config({ path: "./config/config.env" });

const connectDB = require("./config/db");
// Connect to database
connectDB();

// Body parser
app.use(express.json());

app.use(cookieParser());

// Sanitize data
app.use(ExpressMongoSanitize());

// Set security headers
app.use(helmet());

//Prevent XSS attacks
app.use(xss());

//enable cors
app.use(cors());

// limit requests
app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000, //1000
    max: 100,
  })
);

//prevent http param pollution
app.use(hpp());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//file uploading library
app.use(fileUpload());

// set static folder
app.use(express.static(path.join(__dirname, "public")));

// Route files
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const users = require("./routes/users");
const { errorHandler } = require("./middleware/error");

// Mount routers
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
