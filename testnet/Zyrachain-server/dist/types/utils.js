"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSubmitTransactionErrorResponse = exports.isMainnet = exports.createPlatformApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("./config");
const createPlatformApiClient = (apiKey) => {
    const axiosClient = axios_1.default.create({
        baseURL: config_1.config.PI_BACKEND_PLATFORM_BASE_URL + "/v2",
        timeout: config_1.config.PI_BACKEND_HORIZON_TIMEOUT_MS,
        headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
    });
    return axiosClient;
};
exports.createPlatformApiClient = createPlatformApiClient;
const isMainnet = (passphrase) => {
    return passphrase === config_1.config.PI_BACKEND_HORIZON_MAINNET_PASSPHRASE;
};
exports.isMainnet = isMainnet;
const isSubmitTransactionErrorResponse = (response) => {
    if (typeof response !== "object" || response === null)
        return false;
    const { title, status } = response;
    return typeof title === "string" && typeof status === "number";
};
exports.isSubmitTransactionErrorResponse = isSubmitTransactionErrorResponse;
//# sourceMappingURL=utils.js.map