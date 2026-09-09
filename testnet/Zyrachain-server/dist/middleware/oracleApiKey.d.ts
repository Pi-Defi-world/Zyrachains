import { Request, Response, NextFunction } from 'express';
import { IApiKey } from '../zyrachain-lib/lib/models/ApiKey';
export interface OracleAuthenticatedRequest extends Request {
    oracleKeyDoc?: IApiKey;
}
export declare function authenticateOracleApiKey(req: OracleAuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=oracleApiKey.d.ts.map