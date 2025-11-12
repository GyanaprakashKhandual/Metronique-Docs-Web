const welcomeTemplate = (name) => {
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
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                color: #333;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .message {
                font-size: 14px;
                color: #666;
                line-height: 1.8;
                margin-bottom: 30px;
            }
            .feature-list {
                list-style: none;
                padding: 0;
                margin: 20px 0;
            }
            .feature-list li {
                padding: 10px 0;
                padding-left: 30px;
                position: relative;
                font-size: 14px;
                color: #555;
            }
            .feature-list li:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #667eea;
                font-weight: bold;
                font-size: 16px;
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
                <h1>Welcome to Docs Clone!</h1>
            </div>
            <div class="content">
                <div class="greeting">
                    Hey ${name}!
                </div>
                <div class="message">
                    Thank you for signing up! We're thrilled to have you on board. Your account is now fully set up and ready to use.
                </div>
                <div class="message">
                    Here's what you can do with Docs Clone:
                </div>
                <ul class="feature-list">
                    <li>Create and edit documents collaboratively in real-time</li>
                    <li>Share documents with team members with custom permissions</li>
                    <li>Track document history and revert to previous versions</li>
                    <li>Leave comments and suggestions for collaborative feedback</li>
                    <li>Export documents in multiple formats (PDF, DOCX, etc.)</li>
                    <li>Organize documents with workspaces and folders</li>
                </ul>
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${process.env.FRONTEND_URL}/documents" class="cta-button">Get Started</a>
                </div>
                <div class="message">
                    If you have any questions, feel free to contact our support team. Happy documenting!
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

module.exports = welcomeTemplate;