const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        let mongoURI;

        if (process.env.NODE_ENV === 'production') {
            mongoURI = process.env.MONGODB_URI_PROD;
        } else if (process.env.NODE_ENV === 'staging') {
            mongoURI = process.env.MONGODB_URI_STAGING;
        } else {
            mongoURI = process.env.MONGODB_URI_DEV;
        }

        if (!mongoURI) {
            throw new Error('MongoDB URI not found in environment variables');
        }

        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            retryReads: true,
            appName: 'GoogleDocsClone',
            monitorCommands: process.env.DEBUG_MONGO === 'true'
        };

        const connection = await mongoose.connect(mongoURI, options);

        console.log('MongoDB Connected:', connection.connection.host);
        console.log('Database:', connection.connection.name);

        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected from MongoDB');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('Mongoose connection closed due to application termination');
            process.exit(0);
        });

        await createIndexes();

        return connection;
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

const createIndexes = async () => {
    try {
        const db = mongoose.connection;

        if (db.collection('documents')) {
            await db.collection('documents').createIndex({ title: 'text', 'content.text': 'text' });
        }

        if (db.collection('folders')) {
            await db.collection('folders').createIndex({ name: 'text', description: 'text' });
        }

        if (db.collection('templates')) {
            await db.collection('templates').createIndex({ name: 'text', description: 'text' });
        }

        if (db.collection('documents')) {
            await db.collection('documents').createIndex({ workspace: 1, owner: 1 });
            await db.collection('documents').createIndex({ workspace: 1, createdAt: -1 });
        }

        if (db.collection('activities')) {
            await db.collection('activities').createIndex({ workspace: 1, createdAt: -1 });
            await db.collection('activities').createIndex({ actor: 1, createdAt: -1 });
        }

        if (db.collection('comments')) {
            await db.collection('comments').createIndex({ document: 1, createdAt: -1 });
        }

        if (db.collection('notifications')) {
            await db.collection('notifications').createIndex({ recipient: 1, isRead: 1, createdAt: -1 });
        }

        if (db.collection('users')) {
            await db.collection('users').createIndex({ email: 1 }, { unique: true });
            await db.collection('users').createIndex({ 'workspaces.workspace': 1 });
        }

        if (db.collection('workspaces')) {
            await db.collection('workspaces').createIndex({ slug: 1 }, { unique: true });
            await db.collection('workspaces').createIndex({ owner: 1 });
        }

        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error.message);
    }
};

const checkDBHealth = async () => {
    try {
        const admin = mongoose.connection.db.admin();
        const status = await admin.ping();
        return {
            status: 'healthy',
            connected: mongoose.connection.readyState === 1,
            responseTime: status
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            connected: false,
            error: error.message
        };
    }
};

const getConnectionStats = () => {
    const connection = mongoose.connection;
    return {
        state: ['disconnected', 'connected', 'connecting', 'disconnecting'][connection.readyState],
        name: connection.name,
        host: connection.host,
        port: connection.port,
        models: connection.modelNames().length
    };
};

const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error disconnecting MongoDB:', error);
        throw error;
    }
};

module.exports = connectDB;
module.exports.checkDBHealth = checkDBHealth;
module.exports.getConnectionStats = getConnectionStats;
module.exports.disconnectDB = disconnectDB