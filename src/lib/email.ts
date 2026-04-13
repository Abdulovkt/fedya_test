import nodemailer from "nodemailer";
import { getSettings } from "@/lib/settings";

async function getTransporter() {
  const s = await getSettings();
  if (!s.smtp_user || !s.smtp_pass) return null;
  return nodemailer.createTransport({
    host: s.smtp_host || "smtp.gmail.com",
    port: Number(s.smtp_port) || 587,
    secure: s.smtp_secure === "true",
    auth: { user: s.smtp_user, pass: s.smtp_pass },
  });
}

async function getSiteUrl() {
  const s = await getSettings();
  return (s.site_url || "http://localhost:3000").replace(/\/$/, "");
}

async function getFrom() {
  const s = await getSettings();
  return s.smtp_from || s.smtp_user || "noreply@example.com";
}

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
  const transporter = await getTransporter();
  if (!transporter) return;

  const siteUrl = await getSiteUrl();
  const from = await getFrom();
  const chatUrl = `${siteUrl}/chat/${orderId}?token=${chatToken}`;

  await transporter.sendMail({
    from: `"SportNutrition" <${from}>`,
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
  const transporter = await getTransporter();
  if (!transporter) return;

  const siteUrl = await getSiteUrl();
  const from = await getFrom();
  const chatUrl = `${siteUrl}/chat/${orderId}?token=${chatToken}`;

  await transporter.sendMail({
    from: `"SportNutrition" <${from}>`,
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
