const express = require("express");
const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require("../controllers/bootcamps");
const { advancedResults } = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");
const { errorHandler } = require("../middleware/error");
const Bootcamp = require("../models/Bootcamp");

//Include other resource routers
const courseRouter = require("./courses");

const router = express.Router();

// passes every request to the courseRouter
router.use("/:bootcampId/courses", courseRouter);

router
  .route("/")
  .get(
    advancedResults(Bootcamp, [
      { path: "courses", select: "title description" },
      { path: "user", select: "name role" },
    ]),
    getBootcamps
  )
  .post(protect, createBootcamp);

router
  .route("/:id")
  .get(getBootcamp)
  .put(protect, updateBootcamp)
  .delete(protect, deleteBootcamp);

router
  .route("/:id/photo")
  .put(protect, authorize("publisher", "admin"), bootcampPhotoUpload);

router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);

// must be put last
router.use(errorHandler);

module.exports = router;
