const nodemailer = require('nodemailer');
async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: { user: 'resend', pass: 're_J79PF5sS_79WzUSiPsV28if1zjU3B4r1b' }
  });
  try {
    const info = await transporter.sendMail({
      from: 'onboarding@kimun.in.net',
      to: 'ayushbindhani001@gmail.com',
      subject: 'Test Resend Deliverability',
      text: 'This is a test email to verify Resend SMTP delivery.'
    });
    console.log('Success:', info);
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
