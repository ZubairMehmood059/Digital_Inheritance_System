import emailjs from "@emailjs/browser";

// EmailJS initialize karo
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

// Nominee ko alert email bhejo
export async function sendAlertEmail(nomineeEmail, nomineeName, userName, daysInactive) {
  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        to_email: nomineeEmail,
        nominee_name: nomineeName,
        user_name: userName,
        days: daysInactive,
      }
    );
    console.log("Email sent to:", nomineeEmail);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
}