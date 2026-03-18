import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { message } = await req.json()

  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")

  const htmlContent = `
  <div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:20px;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
      
      <div style="background:#111827; padding:20px; text-align:center;">
        <h1 style="color:#ffffff; margin:0;">CommunitySafeConnect</h1>
        <p style="color:#9ca3af; margin:5px 0 0;">Powered by Armstrong Pack Company</p>
      </div>

      <div style="padding:30px;">
        <h2 style="color:#111827;">🚨 New Report Submitted</h2>
        
        <p style="color:#374151; line-height:1.6;">
          A new report has been submitted to your organization dashboard.
        </p>

        <div style="background:#f9fafb; padding:15px; border-radius:6px; margin:20px 0;">
          <strong>Report Details:</strong>
          <p style="margin-top:10px; color:#374151;">
            ${message}
          </p>
        </div>

        <a href="http://localhost:3002/dashboard/admin"
           style="display:inline-block; background:#2563eb; color:#ffffff; padding:12px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">
           View in Dashboard
        </a>
      </div>

      <div style="background:#f3f4f6; padding:15px; text-align:center; font-size:12px; color:#6b7280;">
        © ${new Date().getFullYear()} Armstrong Pack Company. All rights reserved.
      </div>

    </div>
  </div>
  `

  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: "Frombizz16295@gmail.com" }]
        }
      ],
      from: { email: "Frombizz16295@gmail.com" },
      subject: "🚨 New Report Submitted - CommunitySafeConnect",
      content: [
        {
          type: "text/html",
          value: htmlContent
        }
      ]
    })
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  })
})
