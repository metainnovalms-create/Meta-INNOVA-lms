import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  userName?: string;
  appUrl: string;
}

// Send email using Resend API directly
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Meta Skills Academy <noreply@edu.metasageacademy.com>",
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Resend API error:", errorData);
    throw new Error(errorData.message || "Failed to send email");
  }

  const result = await response.json();
  console.log("Email sent successfully:", result);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName, appUrl }: PasswordResetRequest = await req.json();

    if (!email || !appUrl) {
      return new Response(
        JSON.stringify({ error: "Email and appUrl are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up user by email to get user_id
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      // Don't reveal if email exists - return success anyway for security
      console.log(`No user found for email: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset link has been sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a secure random token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // Store token in database (expires in 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_id: userData.id,
        email: email,
        token: token,
        expires_at: expiresAt,
        used: false,
      });

    if (insertError) {
      console.error("Failed to create reset token:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create reset token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build reset URL
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    const displayName = userName || userData.name || email.split('@')[0];

    // Send email via Resend
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Meta Skills Academy
              </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px; font-weight: 600;">
                Reset Your Password
              </h2>
              
              <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                Hi ${displayName},
              </p>
              
              <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                  Reset Password
                </a>
              </div>
              
              <p style="margin: 0 0 16px 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                This link will expire in <strong>1 hour</strong>. If you didn't request this password reset, you can safely ignore this email.
              </p>
              
              <div style="background-color: #fafafa; border-radius: 8px; padding: 16px; margin-top: 24px;">
                <p style="margin: 0; color: #71717a; font-size: 12px; line-height: 1.5;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #6366f1; word-break: break-all;">${resetUrl}</a>
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © ${new Date().getFullYear()} Meta Skills Academy. All rights reserved.
              </p>
              <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 12px;">
                This is an automated message, please do not reply.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(email, "Reset Your Password - Meta Skills Academy", emailHtml);

    console.log("Password reset email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Reset link sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
