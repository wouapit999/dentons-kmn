// EmailJS Configuration — Dentons KMN
import emailjs from "@emailjs/browser";

const EMAILJS_CONFIG = {
  publicKey:        "u1X9Xcvbo4a0oxzvH",
  serviceId:        "service_dentons",
  otpTemplateId:    "template_otp",
  inviteTemplateId: "template_invite",
};

// Initialise once at app startup
emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });

export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<boolean> {
  try {
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.otpTemplateId,
      {
        to_email:  toEmail,
        to_name:   "Administrator",
        otp_code:  otpCode,
        firm_name: "Dentons KMN",
      }
    );
    return true;
  } catch (err) {
    console.error("OTP email error:", err);
    return false;
  }
}

export async function sendInviteEmail(
  toEmail: string,
  toName: string,
  role: string,
  tempPassword: string
): Promise<boolean> {
  try {
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.inviteTemplateId,
      {
        to_email:      toEmail,
        to_name:       toName,
        role:          role,
        firm_name:     "Dentons KMN",
        temp_password: tempPassword,
        login_url:     window.location.origin,
        invited_by:    "Administrator",
      }
    );
    return true;
  } catch (err) {
    console.error("Invite email error:", err);
    return false;
  }
}

export default EMAILJS_CONFIG;