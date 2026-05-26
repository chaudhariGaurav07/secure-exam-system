import mongoose, { Schema, models } from "mongoose";

const TemplateSchema = new Schema(
    {
        title: String,
        subject: String,
        totalMarks: Number,

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        structure: [
            {
                questionNo: String,
                subQuestion: String,
                marks: Number,
                candidatesNeeded: Number,
            },
        ],
        
    },
    {
        timestamps: true,
    }
);
export const Template = models.Template || mongoose.model("Template", TemplateSchema);