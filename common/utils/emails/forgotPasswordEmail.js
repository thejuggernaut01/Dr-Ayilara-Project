const { createClient } = require("smtpexpress");

const smtpexpressClient = createClient({
  projectId: process.env.SMTP_PROJECT_ID,
  projectSecret: process.env.SMTP_PROJECT_SECRET,
});
const { forgotPasswordEmailTemplate } = require("../../templates/authEmail");
const { getDB } = require("../../../utils/database");

const forgotPasswordEmail = async (email, res, token, next) => {
  const db = getDB();

  try {
    // if if email exists, update the db
    const user = await db.collection("users").findOneAndUpdate(
      { email },
      {
        $set: {
          resetToken: token,
          resetTokenExpiration: Date.now() + 1800000,
        },
      },
      { returnOriginal: false }
    );

    await smtpexpressClient?.sendApi?.sendMail({
      subject: "Reset Your Password",
      message: forgotPasswordEmailTemplate(token, user.firstName),
      sender: {
        name: "University of Wolverhampton E-Library",
        email: process.env.SMTP_SENDER_ADDRESS,
      },
      recipients: {
        name: user.firstName,
        email: email,
      },
    });

    return res.redirect("/reset-password");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

module.exports = forgotPasswordEmail;
