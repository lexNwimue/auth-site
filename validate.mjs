
import userModel from './model/userModel.mjs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

let currentUser;
// Validate sign up form data
const validateSignup = async (user) => {
    try{
        let res = await userModel.User.findOne({username: user.username}); // Confirm username uniqueness
        if(res){
            return false
        }

        res = await userModel.User.findOne({email: user.email}); // Confirm email uniqueness
        if(await res){
            return false;
        }
        
        if(await user.password !== user.password2 || user.password.length < 6){ // Confirm password match
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

// Validate login form data
const validateLogin = async (user) => {
    try{
        let res = await userModel.User.findOne({email: user.email}); // Find existing user
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

const validateEdit = async (user) => {
    try{
        const res = await userModel.User.updateOne({email: currentUser.email}, {$set: user}); //Update user document
        console.log('Updating profile... ', res);
        return res;
    } catch (err){
        console.log(err);
    }
}

// Middleware for protecting routes
const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
        
    if(token){
        jwt.verify(token, 'My little secret', (err, decodedToken) => {
            if(err){
                console.log(err.message);
                res.redirect('/login');
            } else{
                next();
            }
        })
    } else{
        res.redirect('/login');
    }
}

// Get current user
const getCurrentUser = async (req, res, next) => {
    const token = req.cookies.jwt;        
    if(token){
        jwt.verify(token, 'My little secret', async (err, decodedToken) => {
            if(err){
                console.log(err.message);
                res.locals.user = null
                next();
            } else{
                let user = await userModel.User.findOne({email: decodedToken.id});
                res.locals.user = user;
                currentUser = user;
                next();
                return currentUser;
            }
        })
    } else{
        res.locals.user = null;
        next();
    }
}


export default {
    currentUser,
    validateSignup, 
    validateLogin,
    validateEdit,
    requireAuth,
    getCurrentUser
}