import mongoose, { Document } from 'mongoose';
export interface IPlatformSetting extends Document {
    key: string;
    value: any;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=PlatformSetting.d.ts.map