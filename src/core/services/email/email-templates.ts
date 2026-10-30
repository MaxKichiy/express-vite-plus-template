export function verificationEmail(to: string, url: string) {
  return {
    to: to,
    subject: "Email Verification",
    body: {
      text: `Click here to verify your email address: ${url}`,
      html: `<a href="${url}"><b><center>Click here to verify your email address</center></b></a>`,
    },
  };
}

export function resetPasswordEmail(to: string, url: string) {
  return {
    to: to,
    subject: "Reset Password",
    body: {
      text: `Click here to reset password: ${url}`,
      html: `<a href="${url}"><b>Click here to reset password</b></a>`,
    },
  };
}
