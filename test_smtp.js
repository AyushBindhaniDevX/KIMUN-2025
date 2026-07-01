const nodemailer = require('nodemailer');
async function test() {
  const transporter = nodemailer.createTransport({
    host: 'exolive.subedge.com',
    port: 465,
    secure: true,
    tls: { rejectUnauthorized: false },
    auth: { user: 'info@exolive.subedge.com', pass: 'Nanda@5152' }
  });
  try {
    const info = await transporter.sendMail({
      from: '"KIMUN 2025" <info@exolive.subedge.com>',
      to: 'ayushbindhani001@gmail.com',
      subject: 'Test Email Deliverability',
      text: 'This is a test email to verify SMTP delivery.'
    });
    console.log('Success:', info);
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
