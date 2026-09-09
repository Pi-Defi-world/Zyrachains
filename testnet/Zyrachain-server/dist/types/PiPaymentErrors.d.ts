import { PaymentDTO } from "./index";
import { PiPaymentApiValidationErrorCode, PiPaymentApiCreateErrorCode, PiPaymentApiCompleteErrorCode, PiPaymentApiCancelErrorCode } from "./errors";
import { OperationResultCode, TransactionResultCode } from "./utils";
export type PiPaymentSdkErrorCode = TransactionResultCode | OperationResultCode | "amount_not_number" | "api_key_not_string" | "invalid_wallet_private_seed" | "memo_not_string" | "metadata_not_object" | "missing_amount" | "missing_api_key" | "missing_memo" | "missing_metadata" | "missing_uid" | "missing_wallet_private_seed" | "payment_already_has_linked_txid" | "payment_data_not_object" | "private_seed_mismatch" | "uid_not_string" | "wallet_private_seed_not_56_chars_long" | "wallet_private_seed_not_starts_with_S" | "wallet_private_seed_not_string";
export type PiPaymentApiErrorCode = PiPaymentApiCancelErrorCode | PiPaymentApiCompleteErrorCode | PiPaymentApiCreateErrorCode | PiPaymentApiValidationErrorCode;
export type PiPaymentErrorCode = PiPaymentSdkErrorCode | PiPaymentApiErrorCode;
export interface PiPaymentErrorAdditionalData {
    data?: {
        payment?: PaymentDTO;
        paymentId?: string;
        txid?: string;
        verificationError?: string;
    };
    messageOverride?: string;
}
export interface IPiPaymentError {
    code: string;
    payment?: PaymentDTO;
    paymentId?: string;
    txid?: string;
    verificationError?: string;
}
export declare class PiPaymentError extends Error implements IPiPaymentError {
    code: string;
    payment?: PaymentDTO;
    paymentId?: string;
    txid?: string;
    verificationError?: string;
    constructor(code: PiPaymentErrorCode, data?: PiPaymentErrorAdditionalData);
}
//# sourceMappingURL=PiPaymentErrors.d.ts.map