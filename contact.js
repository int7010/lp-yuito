const nodemailer = require("nodemailer");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return Object.fromEntries(new URLSearchParams(req.body));
  }

  return {};
}

function redirect(res, location) {
  res.statusCode = 303;
  res.setHeader("Location", location);
  res.end();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  const data = parseBody(req);

  if (data._honey) {
    redirect(res, "/thanks.html");
    return;
  }

  const name = data["お名前（漢字）"] || "";
  const kana = data["お名前（かな）"] || "";
  const tel = data["お電話番号"] || "";
  const email = data.email || "";
  const message = data["ご質問内容"] || "";

  if (!name || !kana || !email || !message) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      "<!doctype html><meta charset=\"utf-8\"><p>必須項目が不足しています。入力内容をご確認ください。</p><p><a href=\"/#contact\">フォームへ戻る</a></p>"
    );
    return;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;
  const mailTo = process.env.MAIL_TO || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom || !mailTo) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      "<!doctype html><meta charset=\"utf-8\"><p>メール送信設定が未完了です。管理者にお問い合わせください。</p><p><a href=\"/#contact\">フォームへ戻る</a></p>"
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  const submittedAt = new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo"
  });

  const html = `
    <h2>無料相談・お問い合わせフォームから送信がありました</h2>
    <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;">
      <tr><th align="left">お名前（漢字）</th><td>${escapeHtml(name)}</td></tr>
      <tr><th align="left">お名前（かな）</th><td>${escapeHtml(kana)}</td></tr>
      <tr><th align="left">お電話番号</th><td>${escapeHtml(tel)}</td></tr>
      <tr><th align="left">メールアドレス</th><td>${escapeHtml(email)}</td></tr>
      <tr><th align="left">ご質問内容</th><td>${escapeHtml(message).replace(/\n/g, "<br>")}</td></tr>
      <tr><th align="left">送信日時</th><td>${escapeHtml(submittedAt)}</td></tr>
    </table>
  `;

  const text = [
    "無料相談・お問い合わせフォームから送信がありました",
    "",
    `お名前（漢字）: ${name}`,
    `お名前（かな）: ${kana}`,
    `お電話番号: ${tel}`,
    `メールアドレス: ${email}`,
    "",
    "ご質問内容:",
    message,
    "",
    `送信日時: ${submittedAt}`
  ].join("\n");

  try {
    await transporter.sendMail({
      from: `"結叶フォーム" <${smtpFrom}>`,
      to: mailTo,
      replyTo: email,
      subject: "無料相談のご予約・お問い合わせ",
      text,
      html
    });

    redirect(res, "/thanks.html");
  } catch (error) {
    console.error("Mail send failed:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      "<!doctype html><meta charset=\"utf-8\"><p>送信中にエラーが発生しました。時間をおいて再度お試しください。</p><p><a href=\"/#contact\">フォームへ戻る</a></p>"
    );
  }
};
