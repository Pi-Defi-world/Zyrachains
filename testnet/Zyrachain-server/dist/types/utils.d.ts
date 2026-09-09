import { NetworkPassphrase } from "./index";
export declare const createPlatformApiClient: (apiKey: string) => import("axios").AxiosInstance;
export declare const isMainnet: (passphrase: NetworkPassphrase) => boolean;
export type TransactionResultCode = "tx_failed" | "tx_too_early" | "tx_too_late" | "tx_missing_operation" | "tx_bad_seq" | "tx_bad_auth" | "tx_insufficient_balance" | "tx_no_source_accout" | "tx_insufficient_fee" | "tx_bad_auth_extra" | "tx_internal_error";
export type OperationResultCode = "op_bad_auth" | "op_no_source_account" | "op_not_supported" | "op_too_many_subentries" | "op_exceeded_work_limit";
export interface SubmitTransactionErrorResponse {
    detail: string;
    extras?: {
        envelope_xdr?: string;
        result_codes?: {
            transaction?: TransactionResultCode;
            operations?: OperationResultCode[];
        };
        result_xdr?: string;
    };
    status: number;
    title: string;
    type: string;
}
export declare const isSubmitTransactionErrorResponse: (response: any) => response is SubmitTransactionErrorResponse;
//# sourceMappingURL=utils.d.ts.map