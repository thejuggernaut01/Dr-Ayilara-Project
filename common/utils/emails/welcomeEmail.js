const { welcomeEmailTemplate } = require("../../templates/authEmail");
const { createClient } = require("smtpexpress");
const { getDB } = require("../../../utils/database");

const smtpexpressClient = createClient({
  projectId: process.env.SMTP_PROJECT_ID,
  projectSecret: process.env.SMTP_PROJECT_SECRET,
});

const welcomeEmail = async (email, res) => {
  const db = getDB();

  const user = await db.collection("users").updateOne(
    { email: email },
    {
      $set: {
        verified: true,
        verificationToken: undefined,
        verificationTokenExpiration: undefined,
      },
    }
  );

  await smtpexpressClient.sendApi.sendMail({
    subject: "Welcome to The University of Wolverhampton E-Library",
    message: welcomeEmailTemplate(user?.firstName),
    sender: {
      name: "University of Wolverhampton E-Library",
      email: process.env.SMTP_SENDER_ADDRESS,
    },
    recipients: {
      name: user?.firstName,
      email: email,
    },
  });

  return res.render("auth/verified", {
    path: "/verified",
    pageTitle: "You're account has been verified!",
  });
};

module.exports = welcomeEmail;
