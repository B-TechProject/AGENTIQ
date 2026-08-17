import mongoose from "mongoose" ;
import bycrypt from "bcryptjs";

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
    password : {
        type : String,
        required : true,
        minLength : 6
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

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    
    try {
        const salt = await bycrypt.genSalt(10);
        this.password = await bycrypt.hash(this.password, salt);
        // next();
    } catch (error) {
        next(error);
    }
})

userSchema.methods.matchPassword = async function(enteredPassword){
    const isMatch = await bycrypt.compare(enteredPassword, this.password) ;
    return isMatch ;
}

const Users = mongoose.model("users",userSchema);

export default Users ;

