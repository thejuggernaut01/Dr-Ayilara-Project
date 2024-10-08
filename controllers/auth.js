const bcryptjs = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/user");

const { getDB } = require("../utils/database");
const { validationResult } = require("express-validator");
const { getMsgForPath } = require("../utils/helper");
const verificationEmail = require("../common/utils/emails/verificationEmail");
const welcomeEmail = require("../common/utils/emails/welcomeEmail");
const forgotPasswordEmail = require("../common/utils/emails/forgotPasswordEmail");

// const PORT = process.env.PORT;

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login into your account!",
    errorMessage: false,
    oldInput: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      age: "",
    },
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Create an account!",
    firstNameErrMsg: "",
    lastNameErrMsg: "",
    emailErrMsg: "",
    pwErrMsg: "",

    oldInput: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });
};

exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    // query db to check for user
    const user = await User.findOne(email);

    // check if user does not exist
    // render the page with appropriate error message
    if (!user) {
      return res.status(401).render("auth/login", {
        path: "/login",
        pageTitle: "Login into your account!",
        errorMessage: "Invalid email or password.",
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: [],
      });
    }

    // check if user is not verified
    // render the page with appropriate error message
    if (!user.verified) {
      return res.status(401).render("auth/login", {
        path: "/login",
        pageTitle: "Login into your account!",
        errorMessage:
          "Your account hasn't been verified, check your email and verify.",
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: [],
      });
    }

    // compare inputted password with hashed password stored in db
    const doMatch = await bcryptjs.compare(password, user.password);

    // if password match, user is authenticated
    if (doMatch) {
      req.session.isLoggedIn = true;
      req.session.isAdmin = email === "talk2tobi2004@gmail.com";
      req.session.user = user;
      // return req.session.save(async (err) => {
      //   res.redirect("/");
      // });
      return req.session.save((err) => {
        if (err) {
          return next(err);
        }
        res.redirect("/");
      });
    }

    // if password does not match
    // render the page with appropriate error message
    return res.status(401).render("auth/login", {
      path: "/login",
      pageTitle: "Login into your account!",
      errorMessage: "Invalid email or password.",
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: [],
    });
  } catch (error) {
    if (!error.statusCode) {
      err.statusCode = 500;
    }
    next(error);
  }
};

exports.postSignUp = async (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const favorite = { books: [] };
  const verified = false;

  const errors = validationResult(req);
  const errorArray = errors.array();

  // check if there's validation error
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Create an account!",
      firstNameErrMsg: getMsgForPath(errorArray, "firstName"),
      lastNameErrMsg: getMsgForPath(errorArray, "lastName"),
      emailErrMsg: getMsgForPath(errorArray, "email"),
      pwErrMsg: getMsgForPath(errorArray, "password"),

      oldInput: {
        email,
        password,
        firstName,
        lastName,
      },
    });
  }

  // generate random number (size = 32)
  crypto.randomBytes(32, async (err, buffer) => {
    // checking an error occured after generating random values
    if (err) {
      return res.redirect("/signup");
    }

    try {
      // query db whether user already exists
      const user = await User.findOne(email);

      // return to sign up page if user exists
      if (user) {
        return res.redirect("/signup");
      }

      // converted the randomBytes buffer to hex string
      const token = buffer.toString("hex");

      // hash user password
      const hashedPassword = await bcryptjs.hash(password, 12);

      // save user
      const newUser = new User(
        firstName,
        lastName,
        email,
        hashedPassword,
        favorite,
        verified
      );
      await newUser.save();

      // send verification email
      await verificationEmail(email, res, token, next);
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/login");
  });
};

exports.verifyEmail = (req, res, next) => {
  res.render("auth/verify-email", {
    path: "/verify-email",
    pageTitle: "Verify your email!",
  });
};

exports.verifiedUser = async (req, res, next) => {
  const token = req.params.tokenId;

  try {
    const db = getDB();
    const user = await db.collection("users").findOne({
      verificationToken: token,
      verificationTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      const error = new Error("Email verification failed");
      error.statusCode = 401;
      throw error;
    }

    await welcomeEmail(user.email, res);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset your password",
    errorMessage: "",

    emailErrMsg: "",

    oldInput: {
      email: "",
    },
  });
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;

  // get validation error
  const errors = validationResult(req);
  const errorArray = errors.array();

  // check if there's validation error
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/reset", {
      path: "/reset",
      pageTitle: "Reset your password",
      emailErrMsg: getMsgForPath(errorArray, "email"),

      oldInput: {
        email,
      },
    });
  }

  try {
    // generate 32 bit token
    crypto.randomBytes(32, async (err, buffer) => {
      // check if an error occured when generating token
      if (err) {
        return res.redirect("/reset");
      }

      // converted buffer to hex string
      const token = buffer.toString("hex");
      // query db to check whether such email exists
      const user = await User.findOne(email);

      // if user does not exists in db
      if (!user) {
        return res.status(422).render("auth/reset", {
          path: "/reset",
          pageTitle: "Reset your password",
          errorMessage: "User email not found!",
        });
      }

      await forgotPasswordEmail(user.email, res, token, next);
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getResetPassword = (req, res, next) => {
  res.render("auth/reset-password", {
    path: "/reset-password",
    pageTitle: "Reset your password!",
  });
};

exports.getNewPassword = async (req, res, next) => {
  const token = req.params.tokenId;
  const db = getDB();

  try {
    const user = await db.collection("users").findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    console.log(user);

    if (!user) {
      return res.redirect("/reset");
    }

    res.render("auth/new-password", {
      path: "/new-password",
      pageTitle: "New Password",
      userId: user._id.toString(),
      passwordToken: token,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.postNewPassword = async (req, res, next) => {
  const passwordToken = req.params.tokenId;
  const newPassword = req.body.password;

  const db = getDB();

  try {
    // query db to check for a user based on the specified field
    const user = await db.collection("users").findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
    });

    // if such user does not exist
    if (!user) {
      return res.redirect("/reset");
    }

    // hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 12);

    // update the users password with new password
    // cleaar resetToken and resetTokenVerification
    await db.collection("users").updateOne(
      { email: user.email },
      {
        $set: {
          password: hashedPassword,
          resetToken: undefined,
          resetTokenExpiration: undefined,
        },
      }
    );

    res.redirect("/login");
  } catch (error) {
    console.log(error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
