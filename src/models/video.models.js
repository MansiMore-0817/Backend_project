import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary url used to store video
            required: true
        },
        thumbnail: {
            type: String, 
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true,   //removes whitespace from both ends of a string
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number, // we can take this info from cloudinary response
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,    //mongoose schema type
            ref: "User", // reference to User model   (we always write ref after mongoose schema type i.e the line above)
            required: true
        }



    },
    {
        timestamps: true,  //createdAt, updatedAt fields will be added automatically by mongoose
    }
)


videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);