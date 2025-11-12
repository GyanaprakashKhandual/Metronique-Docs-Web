const magicLinkTemplate = (name, magicLink) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                background-color: #f5f5f5;
                padding: 20px;
                margin: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px 20px;
                text-align: center;
                color: white;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 16px;
                color: #333;
                margin-bottom: 20px;
            }
            .message {
                font-size: 14px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 30px;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 14px;
                text-align: center;
            }
            .cta-button:hover {
                opacity: 0.9;
            }
            .link-text {
                font-size: 12px;
                color: #999;
                margin-top: 20px;
                word-break: break-all;
            }
            .footer {
                background-color: #f9f9f9;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #999;
                border-top: 1px solid #eee;
            }
            .expires {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 10px 15px;
                margin: 20px 0;
                font-size: 13px;
                color: #856404;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Your Magic Link</h1>
            </div>
            <div class="content">
                <div class="greeting">
                    Hi ${name},
                </div>
                <div class="message">
                    Someone (hopefully you!) requested a magic link to sign in to your account. Click the button below to verify your email and log in.
                </div>
                <div>
                    <a href="${magicLink}" class="cta-button">Verify Email & Login</a>
                </div>
                <div class="expires">
                    This link will expire in 15 minutes
                </div>
                <div class="link-text">
                    If the button doesn't work, copy and paste this link in your browser:<br>
                    <a href="${magicLink}">${magicLink}</a>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #999;">
                    If you didn't request this link, you can safely ignore this email.
                </div>
            </div>
            <div class="footer">
                <p>${new Date().getFullYear()} Google Docs Clone. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = magicLinkTemplate;