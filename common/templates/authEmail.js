const verifyEmailTemplate = (token, name) => {
  return `
          <main>
            <p>Dear ${name},</p>
            <p>Welcome to University of Wolverhampton E-Library! 📚✨ To ensure the security of your account, we kindly ask you to verify your email address.</p>

            <p>Please click on the following link to complete the verification process: <a href="https://dr-ayilara-project.onrender.com/verify-email/${token}">Verification Link</a></p>

            <p>Note: This link is valid for the next 30 minutes. If you don't verify your account within this timeframe, you may need to request a new verification email.</p>

            <p>If you did not sign up for University of Wolverhampton E-Library, please ignore this email.</p>

            <p>Thank you for being a part of our reading community!</p>

            <p>Best,<br>
              University of Wolverhampton E-Library Team</p>
          </main>
    `;
};

const forgotPasswordEmailTemplate = (token, name) => {
  return `
          <main>
            <p>Dear ${name},</p>

            <p>We received a request to reset your password on Book Buddy. If you initiated this request, please click the link below to reset your password:</p>

            <p><a href="https://dr-ayilara-project.onrender.com/reset/${token}">Reset Password</a></p>

            <p>Note: This link is valid for the next 30 minutes. If you didn't request a password reset, please ignore this email. Your account security is important to us.</p>

            <p>Best,<br>
                University of Wolverhampton E-Library Team</p>
          </main>
    `;
};

const welcomeEmailTemplate = (name) => {
  return `
      <main>
        <p>Dear ${name},</p>

        <p>Welcome to University of Wolverhampton E-Library! 📚✨ We're thrilled to have you join our community of book lovers.</p>

        <p>Explore your personalized dashboard, share your favorite reads, and join discussions with fellow readers. Stay tuned for exciting updates!</p>

        <p>Need assistance? We're here for you. Happy reading!</p>

        <p>Best,<br>
          University of Wolverhampton E-Library Team</p>
      </main>
    `;
};

module.exports = {
  verifyEmailTemplate,
  forgotPasswordEmailTemplate,
  welcomeEmailTemplate,
};
