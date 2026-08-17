import mongoose from "mongoose" ;

const userSchema = new mongoose.Schema({
    fullName : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    profilePicture : {
        type : String,
        default : ""
    },
    role: { 
        type: String,
        enum: ["user", "admin"],
        default: "user" 
    }
} , {timestamps : true}) ;

const GUsers = mongoose.model("gusers",userSchema);

export default GUsers ;

