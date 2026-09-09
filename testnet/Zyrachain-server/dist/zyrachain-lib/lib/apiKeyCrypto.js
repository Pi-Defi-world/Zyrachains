"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashOracleApiKey = hashOracleApiKey;
exports.generateOracleApiKey = generateOracleApiKey;
const crypto_1 = __importDefault(require("crypto"));
function hashOracleApiKey(plain) {
    const pepper = process.env.API_KEY_PEPPER || 'Zyrachain-oracle-default-pepper-change-in-production';
    return crypto_1.default.createHash('sha256').update(plain + pepper).digest('hex');
}
function generateOracleApiKey() {
    return `zyra_${crypto_1.default.randomBytes(24).toString('hex')}`;
}
//# sourceMappingURL=apiKeyCrypto.js.map