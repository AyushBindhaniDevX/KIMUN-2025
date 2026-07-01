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
      subject: 'Application Received - KIMUN 2025',
      html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;"> <h2 style="color: #4f46e5;">Application Received!</h2> <p>Dear Ayush,</p> <p>Thank you for applying to be a part of the KIMUN 2025. We have successfully received your application!</p> <p>Our Secretariat will review your responses and get back to you shortly regarding the next steps.</p> <br/> <p>Best Regards,</p> <p><strong>The KIMUN Organizing Committee</strong></p> </div>'
    });
    console.log('Success:', info);
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
