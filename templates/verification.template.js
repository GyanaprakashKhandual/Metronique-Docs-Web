const verificationTemplate = (name, verificationLink) => {
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
            .message {
                font-size: 14px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .verification-code {
                background-color: #f0f0f0;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                text-align: center;
                font-size: 24px;
                letter-spacing: 2px;
                font-weight: bold;
                color: #667eea;
                margin: 20px 0;
                font-family: 'Courier New', monospace;
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
                <h1>Verify Your Email</h1>
            </div>
            <div class="content">
                <div class="message">
                    Hi ${name},
                </div>
                <div class="message">
                    Please verify your email address by clicking the button below to confirm your email and complete your account setup.
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" class="cta-button">Verify Email</a>
                </div>
                <div class="message" style="text-align: center; font-size: 12px; color: #999;">
                    If you didn't create an account, you can safely ignore this email.
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

module.exports = verificationTemplate;