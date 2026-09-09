import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformSetting extends Document {
  key: string;
  value: any;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    updatedBy: {
      type: String,
      default: 'system',
    },
  },
  { timestamps: true }
);

export default mongoose.models.PlatformSetting ||
  mongoose.model<IPlatformSetting>('PlatformSetting', PlatformSettingSchema);
