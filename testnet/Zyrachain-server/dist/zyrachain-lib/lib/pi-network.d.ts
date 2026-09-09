import { AxiosInstance } from 'axios';
import { PaymentDTO, NetworkPassphrase } from '../../types';
export declare const createPlatformApiClient: (apiKey: string) => AxiosInstance;
export declare const isMainnet: (passphrase: NetworkPassphrase) => boolean;
export interface PiUser {
    uid: string;
    username?: string;
    wallet_address?: string;
}
export interface PiAuthResult {
    accessToken: string;
    user: PiUser;
}
export interface PiPaymentData {
    amount: number;
    memo: string;
    metadata: Record<string, any>;
}
export interface PiPaymentCallbacks {
    onReadyForServerApproval: (paymentId: string) => void;
    onReadyForServerCompletion: (paymentId: string, txid: string) => void;
    onCancel: (paymentId: string) => void;
    onError: (error: Error, payment?: PaymentDTO) => void;
}
export declare const LISTING_PAYMENTS: {
    readonly company: {
        readonly amount: 100;
        readonly memo: "Company listing fee for Zyrachain";
        readonly type: "company";
    };
    readonly business: {
        readonly amount: 20;
        readonly memo: "Business listing fee for Zyrachain";
        readonly type: "business";
    };
    readonly startup: {
        readonly amount: 50;
        readonly memo: "Startup listing fee for Zyrachain";
        readonly type: "startup";
    };
    readonly community: {
        readonly amount: 50;
        readonly memo: "Community listing fee for Zyrachain";
        readonly type: "community";
    };
    readonly influencer: {
        readonly amount: 50;
        readonly memo: "Influencer listing fee for Zyrachain";
        readonly type: "influencer";
    };
    readonly update: {
        readonly amount: 80;
        readonly memo: "Listing update fee for Zyrachain";
        readonly type: "update";
    };
    readonly oracle_api: {
        readonly amount: 100;
        readonly memo: "Oracle API key purchase for Zyrachain";
        readonly type: "oracle_api";
    };
};
export type ListingType = keyof typeof LISTING_PAYMENTS;
export declare class PiNetworkService {
    private piNetworkApi;
    private apiKey;
    constructor(apiKey: string);
    verifyUserToken(accessToken: string): Promise<PiUser>;
    getPayment(paymentId: string): Promise<any>;
    createPayment(paymentData: any): Promise<any>;
    approvePayment(paymentId: string): Promise<void>;
    completePayment(paymentId: string, txid: string): Promise<void>;
    cancelPayment(paymentId: string): Promise<void>;
    getIncompleteServerPayments(): Promise<any[]>;
    getListingPayment(type: ListingType, userId: string, listingData: Record<string, any>): PiPaymentData;
}
export declare function getPiNetworkService(): PiNetworkService;
export { serverPiConfig } from '../config/pi-config';
//# sourceMappingURL=pi-network.d.ts.map