const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        // Build service account from environment variables
        const serviceAccount = {
            type: process.env.FIREBASE_TYPE || 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
            token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
            universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com'
        };

        // Verify required fields are present
        if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
            throw new Error('Missing required Firebase environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✓ Firebase Admin SDK initialized with environment variables');
    } catch (error) {
        console.error('Firebase Admin SDK initialization error:', error.message);
        console.error('Make sure to set all required Firebase environment variables in .env file');
        process.exit(1);
    }
}

module.exports = admin;
