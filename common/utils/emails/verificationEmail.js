const { createClient } = require("smtpexpress");

const smtpexpressClient = createClient({
  projectId: process.env.SMTP_PROJECT_ID,
  projectSecret: process.env.SMTP_PROJECT_SECRET,
});
const { verifyEmailTemplate } = require("../../templates/authEmail");
const { getDB } = require("../../../utils/database");

const verificationEmail = async (email, res, token, next) => {
  const db = getDB();

  try {
    // if if email exists, update the db
    const user = await db.collection("users").findOneAndUpdate(
      { email },
      {
        $set: {
          verificationToken: token,
          verificationTokenExpiration: Date.now() + 1800000,
        },
      },
      { returnOriginal: false }
    );

    await smtpexpressClient.sendApi.sendMail({
      subject: "Verify your email address",
      message: verifyEmailTemplate(token, user.firstName),
      sender: {
        name: "University of Wolverhampton E-Library",
        email: process.env.SMTP_SENDER_ADDRESS,
      },
      recipients: {
        name: user?.firstName,
        email: email,
      },
    });

    return res.redirect("/verify-email");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

module.exports = verificationEmail;
