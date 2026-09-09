import dotenv from "dotenv";
export declare const dotenvConfig: dotenv.DotenvParseOutput | undefined;
interface ServerPiConfig {
    PI_BACKEND_HORIZON_MAINNET_URL: string;
    PI_BACKEND_HORIZON_MAINNET_PASSPHRASE: string;
    PI_BACKEND_HORIZON_TESTNET_URL: string;
    PI_BACKEND_HORIZON_TESTNET_PASSPHRASE: string;
    PI_BACKEND_HORIZON_DEFAULT_TIMEBOUNDS: number;
    PI_BACKEND_HORIZON_TIMEOUT_MS: number;
    PI_BACKEND_PLATFORM_BASE_URL: string;
    PI_API_KEY?: string;
    PI_ENV: string;
}
declare const serverPiConfig: ServerPiConfig;
export { serverPiConfig };
export default serverPiConfig;
//# sourceMappingURL=pi-config.d.ts.map