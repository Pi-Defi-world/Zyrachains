"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.dotenvConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
exports.dotenvConfig = dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, `../.env.${process.env.PI_ENV}`),
}).parsed;
if (!exports.dotenvConfig) {
    throw new Error(`Failed to load .env file`);
}
const config = {
    PI_BACKEND_HORIZON_MAINNET_URL: exports.dotenvConfig.PI_BACKEND_HORIZON_MAINNET_URL,
    PI_BACKEND_HORIZON_MAINNET_PASSPHRASE: exports.dotenvConfig.PI_BACKEND_HORIZON_MAINNET_PASSPHRASE,
    PI_BACKEND_HORIZON_TESTNET_URL: exports.dotenvConfig.PI_BACKEND_HORIZON_TESTNET_URL,
    PI_BACKEND_HORIZON_TESTNET_PASSPHRASE: exports.dotenvConfig.PI_BACKEND_HORIZON_TESTNET_PASSPHRASE,
    PI_BACKEND_HORIZON_DEFAULT_TIMEBOUNDS: 180,
    PI_BACKEND_HORIZON_TIMEOUT_MS: 20000,
    PI_BACKEND_PLATFORM_BASE_URL: exports.dotenvConfig.PI_BACKEND_PLATFORM_BASE_URL,
};
exports.config = config;
for (const key in config) {
    if (!config[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}
//# sourceMappingURL=config.js.map