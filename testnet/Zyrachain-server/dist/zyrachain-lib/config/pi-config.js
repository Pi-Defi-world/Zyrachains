"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverPiConfig = exports.dotenvConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
exports.dotenvConfig = dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, `../../.env.${process.env.PI_ENV || 'local'}`),
}).parsed;
if (!exports.dotenvConfig) {
    console.warn(`Failed to load .env file for PI_ENV: ${process.env.PI_ENV || 'local'}`);
}
const serverPiConfig = {
    PI_BACKEND_HORIZON_MAINNET_URL: exports.dotenvConfig?.PI_BACKEND_HORIZON_MAINNET_URL ||
        process.env.PI_BACKEND_HORIZON_MAINNET_URL ||
        'https://api.minepi.com',
    PI_BACKEND_HORIZON_MAINNET_PASSPHRASE: exports.dotenvConfig?.PI_BACKEND_HORIZON_MAINNET_PASSPHRASE ||
        process.env.PI_BACKEND_HORIZON_MAINNET_PASSPHRASE ||
        'Pi Network',
    PI_BACKEND_HORIZON_TESTNET_URL: exports.dotenvConfig?.PI_BACKEND_HORIZON_TESTNET_URL ||
        process.env.PI_BACKEND_HORIZON_TESTNET_URL ||
        'https://api.testnet.minepi.com',
    PI_BACKEND_HORIZON_TESTNET_PASSPHRASE: exports.dotenvConfig?.PI_BACKEND_HORIZON_TESTNET_PASSPHRASE ||
        process.env.PI_BACKEND_HORIZON_TESTNET_PASSPHRASE ||
        'Pi Testnet',
    PI_BACKEND_HORIZON_DEFAULT_TIMEBOUNDS: 180,
    PI_BACKEND_HORIZON_TIMEOUT_MS: 20000,
    PI_BACKEND_PLATFORM_BASE_URL: exports.dotenvConfig?.PI_BACKEND_PLATFORM_BASE_URL ||
        process.env.PI_BACKEND_PLATFORM_BASE_URL ||
        'https://api.minepi.com',
    PI_API_KEY: exports.dotenvConfig?.PI_API_KEY ||
        process.env.PI_API_KEY,
    PI_ENV: process.env.PI_ENV || 'production'
};
exports.serverPiConfig = serverPiConfig;
const requiredServerVars = [
    'PI_BACKEND_HORIZON_MAINNET_URL',
    'PI_BACKEND_HORIZON_MAINNET_PASSPHRASE',
    'PI_BACKEND_HORIZON_TESTNET_URL',
    'PI_BACKEND_HORIZON_TESTNET_PASSPHRASE',
    'PI_BACKEND_PLATFORM_BASE_URL'
];
for (const varName of requiredServerVars) {
    if (!serverPiConfig[varName]) {
        console.warn(`Warning: Missing environment variable: ${varName}`);
    }
}
exports.default = serverPiConfig;
//# sourceMappingURL=pi-config.js.map