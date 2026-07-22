import nodemailer from 'nodemailer';
import { env } from './env.js';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: env.smtp.from,
    to: email,
    subject: `Kasa360 giriş kodun: ${code}`,
    text: `Kasa360 giriş kodun: ${code}\n\nBu kodu uygulamadaki Doğrulama ekranına yaz. Yaklaşık bir saat geçerlidir.`,
    html: `<h2>Giriş kodun</h2>
<p>Kasa360 için 6 haneli kodun:</p>
<p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
<p>Bu kodu uygulamadaki Doğrulama ekranına yaz.</p>`,
  });
}
