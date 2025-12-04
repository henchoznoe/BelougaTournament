import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type EmailPayload = {
    to: string
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
    if (!process.env.RESEND_API_KEY) {
        console.warn(
            'RESEND_API_KEY is not set. Email would have been sent to:',
            to,
        )
        return { success: false, error: 'Missing API Key' }
    }

    try {
        const data = await resend.emails.send({
            from: 'Belouga Tournament <noreply@belouga.com>', // Update this with a verified domain later
            to,
            subject,
            html,
        })

        return { success: true, data }
    } catch (error) {
        console.error('Failed to send email:', error)
        return { success: false, error }
    }
}

export function generateRegistrationEmailHtml(
    tournamentTitle: string,
    status: string,
) {
    return `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Registration Received</h1>
      <p>Thank you for registering for <strong>${tournamentTitle}</strong>.</p>
      <p>Your current registration status is: <strong>${status}</strong>.</p>
      <p>We will notify you if there are any changes to your status.</p>
      <br/>
      <p>Best regards,</p>
      <p>The Belouga Tournament Team</p>
    </div>
  `
}

export function generateStatusUpdateEmailHtml(
    tournamentTitle: string,
    status: string,
) {
    return `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Registration Status Update</h1>
      <p>Your registration status for <strong>${tournamentTitle}</strong> has been updated.</p>
      <p>New Status: <strong>${status}</strong></p>
      <br/>
      <p>Best regards,</p>
      <p>The Belouga Tournament Team</p>
    </div>
  `
}
