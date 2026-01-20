import { EmailTemplateSettings } from './EmailTemplateSettingsCard';

interface EmailTemplatePreviewProps {
  settings: EmailTemplateSettings;
}

export function EmailTemplatePreview({ settings }: EmailTemplatePreviewProps) {
  return (
    <div className="max-w-lg mx-auto bg-[#f4f4f5] rounded-lg overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="bg-white rounded-xl overflow-hidden shadow">
          {/* Header */}
          <div 
            className="p-6 text-center"
            style={{ 
              background: `linear-gradient(135deg, ${settings.header_color_start} 0%, ${settings.header_color_end} 100%)` 
            }}
          >
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="h-8 mx-auto mb-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <h1 className="text-white text-lg font-semibold m-0">
              {settings.company_name || 'Company Name'}
            </h1>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <h2 className="text-zinc-800 text-base font-semibold mb-3">
              Reset Your Password
            </h2>
            
            <p className="text-zinc-600 text-sm mb-4">
              Hi John,
            </p>
            
            <p className="text-zinc-600 text-sm mb-6">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div className="text-center my-6">
              <span 
                className="inline-block text-white text-sm font-semibold px-6 py-3 rounded-lg cursor-pointer"
                style={{ 
                  background: `linear-gradient(135deg, ${settings.button_color_start} 0%, ${settings.button_color_end} 100%)`,
                  boxShadow: `0 4px 14px ${settings.button_color_start}66`
                }}
              >
                Reset Password
              </span>
            </div>
            
            <p className="text-zinc-500 text-xs">
              This link will expire in <strong>1 hour</strong>. If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>
          
          {/* Footer */}
          <div className="bg-zinc-50 p-4 text-center border-t border-zinc-100">
            <p className="text-zinc-400 text-xs m-0">
              © {new Date().getFullYear()} {settings.company_name || 'Company Name'}. All rights reserved.
            </p>
            <p className="text-zinc-400 text-xs mt-1 m-0">
              {settings.footer_text || 'This is an automated message, please do not reply.'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Sender Info Preview */}
      <div className="p-3 bg-zinc-200/50 text-center">
        <p className="text-xs text-zinc-500 m-0">
          From: <strong>{settings.from_name}</strong> &lt;{settings.from_email}&gt;
        </p>
      </div>
    </div>
  );
}
