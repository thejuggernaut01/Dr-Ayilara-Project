const { createClient } = require("smtpexpress");

const smtpexpressClient = createClient({
  projectId: process.env.SMTP_PROJECT_ID,
  projectSecret: process.env.SMTP_PROJECT_SECRET,
});

module.exports = smtpexpressClient;
