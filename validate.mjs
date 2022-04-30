
import userModel from './model/userModel.mjs';
import bcrypt from 'bcrypt';

// Validate sign up form data
const validateSignup = async (user) => {
    try{
        let errors = {};
        let res = await userModel.User.findOne({username: user.username}); // Confirm username uniqueness
        if(await res){
            errors.usernameErr = 'Username already exists';
            console.log(errors.usernameErr);
            return false
        }

        res = await userModel.User.findOne({email: user.email}); // Confirm email uniqueness
        if(await res){
            errors.emailErr = 'Email already exists';
            console.log(errors.emailErr);
            return false;
        }
        
        if(await user.password !== user.password2 || user.password.length < 6){ // Confirm password match
            errors.passwordErr = 'Passwords do not match';
            console.log(errors.passwordErr);
            return false;
        }
        
        const newUser = await userModel.User(user);
        const salt = await bcrypt.genSalt(); // Generate salt
        newUser.password = await bcrypt.hash(newUser.password, salt); // hash password
        const result = await newUser.save();
        
        if(result) return result;
    } catch (err){
        console.log(err)
    }
}

const validateLogin = async (user) => {
    try{
        let res = await userModel.User.findOne({email: user.email}); // Find existing user
        // console.log(user.email, res.email);
        if(res){
            const auth = bcrypt.compare(res.password, user.password);
            if(auth){
                return user;
            }
            console.log('Incorrect Password Details');
        } else{
            console.log('Incorrect Email Details');
        }

    } catch (err){
        console.log(err)
    }
}

export default {
    validateSignup, 
    validateLogin,
}