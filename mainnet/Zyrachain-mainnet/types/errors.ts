export type PiPaymentApiNotFoundErrorCode = "payment_not_found";

export type PiPaymentApiValidationErrorCode =
  | PiPaymentApiNotFoundErrorCode
  | "invalid_amount"
  | "invalid_arguments"
  | "invalid_metadata"
  | "unknown_error";

export type PiPaymentApiCreateErrorCode =
  | PiPaymentApiNotFoundErrorCode
  | "altered_amount"
  | "invalid_address"
  | "missing_scope"
  | "missing_wallet"
  | "ongoing_payment_found"
  | "feature_not_available"
  | "too_many_cancelled_payments"
  | "too_many_payments"
  | "user_not_found";

export type PiPaymentApiCreateError<
  ErrorCode extends PiPaymentApiCreateErrorCode | PiPaymentApiValidationErrorCode =
    | PiPaymentApiCreateErrorCode
    | PiPaymentApiValidationErrorCode,
> =
  | {
      error: Exclude<ErrorCode, "ongoing_payment_found">;
      error_message: string;
    }
  | {
      error: "ongoing_payment_found";
      error_message: string;
      payment: PaymentDTO;
    };

export type PiPaymentApiCompleteErrorCode =
  | PiPaymentApiNotFoundErrorCode
  | "already_completed"
  | "cancelled_payment"
  | "missing_param"
  | "missing_txid"
  | "not_verified"
  | "txid_mismatch"
  | "verification_failed";

export type PiPaymentApiCompleteError =
  | {
      error: "verification_failed";
      error_message: string;
      verification_error: string;
    }
  | {
      error: Exclude<PiPaymentApiCompleteErrorCode, "verification_failed">;
      error_message: string;
    };

export type PiPaymentApiCancelErrorCode =
  | PiPaymentApiNotFoundErrorCode
  | "already_completed"
  | "cancelled_payment"
  | "forbidden"
  | "payment_tx_present";

export type PiPaymentApiCancelError<ErrorCode extends PiPaymentApiCancelErrorCode = PiPaymentApiCancelErrorCode> =
  | {
      error: Exclude<ErrorCode, "already_completed" | "cancelled_payment" | "forbidden">;
      error_message: string;
    }
  | {
      error: "already_completed" | "cancelled_payment" | "forbidden";
      error_message: string;
      payment: PaymentDTO;
    };

// Moved PaymentDTO type definition here to avoid server dependency
export interface PaymentDTO {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: any;
  from_address: string;
  to_address: string;
  direction: 'user_to_app' | 'app_to_user';
  created_at: string;
  network: string;
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
  transaction?: {
    txid: string;
    verified: boolean;
    _link: string;
  };
}

// Add missing PiApplication error types
export interface PiApplicationClientError {
  type: 'client_error';
  message: string;
  code?: string;
}

export interface PiApplicationServerError {
  type: 'server_error';
  message: string;
  code?: string;
}

export interface PiApplicationUnknownError {
  type: 'unknown_error';
  message: string;
  code?: string;
}

export type PiNetworkError = PiApplicationClientError | PiApplicationServerError | PiApplicationUnknownError;
