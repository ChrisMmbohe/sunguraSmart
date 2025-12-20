import mongoose, { Schema, Model } from 'mongoose';
import { ISchedule } from './types';

const ScheduleSchema = new Schema<ISchedule>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    target_date: { type: Date, required: true, index: true }, // Index for finding upcoming tasks
    type: { 
        type: String, 
        enum: ['Breeding', 'Palpation', 'Kindling', 'Weaning', 'Vaccination', 'Admin'], 
        required: true, 
        index: true 
    },
    description: { type: String, required: true },
    is_completed: { type: Boolean, default: false, index: true },
    // e.g., buck 'x' to mate doe 'y' on date 12345
    related_rabbit_ids: [{ type: Schema.Types.ObjectId, ref: 'Rabbit', default: [] }], 
    related_entity_id: { type: Schema.Types.ObjectId, default: null },
}, { timestamps: true });

ScheduleSchema.index({ user_id: 1, target_date: 1, is_completed: 1 });

export const Schedule = (mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema)) as Model<ISchedule>;