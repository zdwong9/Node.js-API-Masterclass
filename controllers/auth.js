const crypto = require("crypto");
const { asyncHandler } = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const { sendEmail } = require("../utils/sendEmail");
const { sendTokenResponse } = require("../utils/sendTokenResponse");

//@desc Register user
//@route POST /api/v1/auth/register
//@access Public

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  //create token
  const token = user.getSignedJwtToken();

  res.status(200).json({ success: true, token });
});

//@desc Login user
//@route POST /api/v1/auth/login
//@access Public

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //validate email and password
  if (!email || !password) {
    return next(new ErrorResponse(`Please provide an email and password`, 400));
  }

  // check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse(`Invalid credentials`, 401));
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse(`Invalid credentials`, 401));
  }

  sendTokenResponse(user, 200, res);
});

//@desc Get current logged in user
//@route POST /api/v1/auth/me
//@access Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

//@desc Forgot password
//@route POST /api/v1/auth/forgotpassword
//@access Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse(`There is no user with that email`, 404));
  }

  //get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  // usually available in frontend route but now no frontend
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receving this email. Please make a put request to \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });

    res.status(200).json({ success: true, data: "email sent" });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("Email could not be sent", 500));
  }
});

//@desc Reset password
//@route PUT /api/v1/auth/resetpassword/:resettoken
//@access Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  //get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse(`Invalid token`, 400));
  }

  //Set new password
  user.password = req.body.password;
  user.resetToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

//@desc Update user details
//@route PUT /api/v1/auth/updatedetails
//@access Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@desc Update password
//@route PUT /api/v1/auth/updatepassword
//@access Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  //check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    next(new ErrorResponse(`Password is incorrect`, 401));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendTokenResponse(user, 200, res);
});
