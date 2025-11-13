const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const environment = {
    node: {
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT, 10) || 5000,
        host: process.env.HOST || 'localhost'
    },

    database: {
        dev: process.env.MONGODB_URI_DEV,
        staging: process.env.MONGODB_URI_STAGING,
        prod: process.env.MONGODB_URI_PROD,
        debugMode: process.env.DEBUG_MONGO === 'true'
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '90d'
    },

    oauth: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackUrl: process.env.GOOGLE_CALLBACK_URL
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackUrl: process.env.GITHUB_CALLBACK_URL
        }
    },

    frontend: {
        url: process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL_PROD
            : process.env.FRONTEND_URL || 'http://localhost:3000'
    },

    email: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        from: {
            email: process.env.SMTP_FROM_EMAIL,
            name: process.env.SMTP_FROM_NAME
        }
    },

    session: {
        secret: process.env.SESSION_SECRET,
        timeout: process.env.SESSION_TIMEOUT || '24h',
        cookie: {
            secure: process.env.COOKIE_SECURE === 'true',
            httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
            sameSite: process.env.COOKIE_SAME_SITE || 'lax'
        }
    },

    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
        s3: {
            bucket: process.env.AWS_S3_BUCKET,
            url: process.env.AWS_S3_URL
        }
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB, 10) || 0
    },

    fileUpload: {
        maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 104857600,
        maxSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 100,
        allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'doc', 'docx', 'txt']
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
        dir: process.env.LOG_DIR || './logs'
    },

    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
        },
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    },

    debug: {
        enabled: process.env.DEBUG === 'true',
        mongo: process.env.DEBUG_MONGO === 'true',
        routes: process.env.DEBUG_ROUTES === 'true'
    },

    websocket: {
        enabled: process.env.WS_ENABLED !== 'false',
        port: parseInt(process.env.WS_PORT, 10) || 3001,
        path: process.env.WS_PATH || '/socket.io'
    },

    stripe: {
        publicKey: process.env.STRIPE_PUBLIC_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },

    slack: {
        botToken: process.env.SLACK_BOT_TOKEN,
        webhookUrl: process.env.SLACK_WEBHOOK_URL
    },

    sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY
    },

    api: {
        docsEnabled: process.env.API_DOCS_ENABLED === 'true',
        swaggerEnabled: process.env.SWAGGER_ENABLED === 'true'
    },

    monitoring: {
        sentryDsn: process.env.SENTRY_DSN,
        mixpanelToken: process.env.MIXPANEL_TOKEN
    }
};

const validateEnvironment = () => {
    const required = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'SESSION_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (environment.node.env === 'production') {
        const prodRequired = ['MONGODB_URI_PROD', 'FRONTEND_URL_PROD'];
        const prodMissing = prodRequired.filter(key => !process.env[key]);

        if (prodMissing.length > 0) {
            console.warn(`Warning: Missing production environment variables: ${prodMissing.join(', ')}`);
        }
    }
};

const getMongoURI = () => {
    const env = environment.node.env;

    if (env === 'production') {
        return environment.database.prod;
    } else if (env === 'staging') {
        return environment.database.staging;
    } else {
        return environment.database.dev;
    }
};

const isProduction = () => environment.node.env === 'production';
const isDevelopment = () => environment.node.env === 'development';
const isStaging = () => environment.node.env === 'staging';

module.exports = environment;
module.exports.validateEnvironment = validateEnvironment;
module.exports.getMongoURI = getMongoURI;
module.exports.isProduction = isProduction;
module.exports.isDevelopment = isDevelopment;
module.exports.isStaging = isStaging;