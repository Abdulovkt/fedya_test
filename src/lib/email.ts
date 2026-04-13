import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderId,
  chatToken,
}: {
  to: string;
  customerName: string;
  orderId: number;
  chatToken: string;
}) {
  if (!process.env.SMTP_USER) return; // email not configured — skip silently

  const chatUrl = `${SITE}/chat/${orderId}?token=${chatToken}`;

  await getTransporter().sendMail({
    from: `"SportNutrition" <${FROM}>`,
    to,
    subject: `Заказ #${orderId} оформлен — SportNutrition`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1d2a38">
        <h2 style="color:#e02c5c">Спасибо за заказ, ${customerName}!</h2>
        <p>Ваш заказ <strong>#${orderId}</strong> успешно принят. Мы свяжемся с вами в ближайшее время.</p>
        <p>Если у вас есть вопросы — напишите нам в чат прямо сейчас:</p>
        <a href="${chatUrl}"
           style="display:inline-block;margin-top:12px;padding:12px 24px;background:#e02c5c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Открыть чат с магазином
        </a>
        <p style="margin-top:24px;font-size:13px;color:#7d879c">
          Ссылка на чат привязана к вашему заказу и действует постоянно.
        </p>
      </div>
    `,
  });
}

export async function sendNewMessageEmail({
  to,
  customerName,
  orderId,
  chatToken,
  messageText,
}: {
  to: string;
  customerName: string;
  orderId: number;
  chatToken: string;
  messageText: string;
}) {
  if (!process.env.SMTP_USER) return;

  const chatUrl = `${SITE}/chat/${orderId}?token=${chatToken}`;

  await getTransporter().sendMail({
    from: `"SportNutrition" <${FROM}>`,
    to,
    subject: `Новое сообщение по заказу #${orderId}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1d2a38">
        <h2 style="color:#e02c5c">Новое сообщение от продавца</h2>
        <p>Здравствуйте, ${customerName}!</p>
        <p>По вашему заказу <strong>#${orderId}</strong> пришёл ответ:</p>
        <blockquote style="border-left:4px solid #e02c5c;margin:16px 0;padding:12px 16px;background:#fdf2f5;border-radius:4px;font-style:italic">
          ${messageText}
        </blockquote>
        <a href="${chatUrl}"
           style="display:inline-block;margin-top:12px;padding:12px 24px;background:#e02c5c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Открыть чат
        </a>
      </div>
    `,
  });
}
