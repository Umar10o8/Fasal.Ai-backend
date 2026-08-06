import { Resend } from 'resend'
import { env } from '../config/env.js'

let resend = null

const getResend = () => {
  if (!env.resendApiKey) {
    throw new Error(
      'RESEND_API_KEY is not set. Add it to your environment to send emails.'
    )
  }

  if (!resend) {
    resend = new Resend(env.resendApiKey)
  }

  return resend
}

const FROM_ADDRESS = env.resendFromEmail

export const sendVerificationEmail = async (email, otp) => {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Your FasalAI Verification Code',
      html: `
        <div style="margin:0;padding:0;background-color:#f4f6f4;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f4;padding:32px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px;text-align:center;">
                      <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                        FasalAI
                      </div>
                      <div style="font-size:12px;font-weight:600;color:#dcfce7;letter-spacing:2px;margin-top:6px;">
                        AGRICULTURAL ADVISORY
                      </div>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 40px 32px;text-align:center;">
                      <div style="font-size:40px;line-height:1;margin-bottom:16px;">📧</div>
                      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">
                        Verify Your Email
                      </h1>
                      <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4b5563;">
                        Use the code below to verify your FasalAI account.<br />
                        This code expires in 10 minutes.
                      </p>

                      <!-- OTP -->
                      <div style="display:inline-block;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 40px;">
                        <span style="font-size:34px;font-weight:700;letter-spacing:10px;color:#15803d;">
                          ${otp}
                        </span>
                      </div>

                      <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;">
                        If you didn't create a FasalAI account, ignore this email.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f0f0f0;">
                      <p style="margin:0;font-size:12px;color:#9ca3af;">
                        © 2024 FasalAI — Smart Farming for Pakistan 🌾
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </div>
      `
    })

    if (error) {
      throw error
    }

    return { emailSent: true, data }
  } catch (error) {
    const message = error?.message || 'Failed to send verification email'
    const fallback = env.nodeEnv !== 'production' || error?.statusCode === 422 || error?.statusCode === 403

    if (fallback) {
      console.warn(`[email] Falling back to local OTP delivery: ${message}`)
      return { emailSent: false, debugCode: otp, fallbackReason: message }
    }

    throw new Error(message)
  }
}
