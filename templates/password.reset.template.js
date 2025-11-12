const passwordResetTemplate = (name, resetLink) => {
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
            .alert {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
                font-size: 13px;
                color: #856404;
            }
            .message {
                font-size: 14px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 20px;
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
            }
            .footer {
                background-color: #f9f9f9;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #999;
                border-top: 1px solid #eee;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Reset Your Password</h1>
            </div>
            <div class="content">
                <div class="alert">
                    If you didn't request a password reset, please ignore this email and contact our support team immediately.
                </div>
                <div class="message">
                    Hi ${name},
                </div>
                <div class="message">
                    We received a request to reset your password. Click the button below to set a new password. This link will expire in 1 hour.
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" class="cta-button">Reset Password</a>
                </div>
                <div class="message" style="font-size: 12px; color: #999;">
                    If you're having trouble clicking the link, copy and paste this URL in your browser:<br>
                    <code>${resetLink}</code>
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

module.exports = passwordResetTemplate;