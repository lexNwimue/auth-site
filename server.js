import express from "express";
import ejs from "ejs";
import formidable from 'formidable';
import fs from 'fs';
import mongoose from 'mongoose'
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import userModel from "./model/userModel.mjs";
import  jwt from "jsonwebtoken";
import validate from './validate.mjs';

dotenv.config();
const app = express();

app.set("view engine", "ejs");
app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to MongoDB



const uri = "mongodb+srv://lexNwimue:Kaycee<3@cluster0.bmtc1.mongodb.net/auth_db?retryWrites=true&w=majority";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        app.listen(process.env.PORT || 5000);
        console.log("Ready...");
    })
    .catch(err => console.log(err));


const expiration = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({id}, 'My little secret', {
    expiresIn:  expiration// token is valid for three days
  })
}

app.get("/", (req, res) => {
  res.status(200).render("index", {title: 'AuthSite'});
});

app.get("/signup", (req, res) => {
  res.status(200).render("signup", {title: 'Signup'});
});

app.post('/signup', async (req, res) => {
  try{
  const uploadFolder = "uploads\\";
  const form = await new formidable.IncomingForm();
  
  form.parse(req, async(err, fields, file) => {
    console.log(fields, file);
    // Check if uploaded file is an image
    if( file.profilePhoto.mimetype !== 'image/png' || 
        file.profilePhoto.mimetype !== 'image/jpg' || 
        file.profilePhoto.mimetype !== 'image/jpeg'
      ) {
        console.log('Invalid file type');
    }
    form.uploadDir = uploadFolder; // Set image upload directory
    // Get file extension
    let fileExt = [...file.profilePhoto.mimetype]; // Convert string to array
    fileExt = '.' + fileExt.slice(6).join('');
    fs.rename(file.profilePhoto.filepath, uploadFolder + fields.username + fileExt, () => {
      fields.profilePhoto = uploadFolder + fields.username + fileExt;
    });
    const user = await validate.validateSignup(fields);
    if (user){
      const token = createToken(user.email);
      res.cookie('jwt', token, {httpOnly: true, maxAge: expiration * 1000}) // maxAge is in milliseconds
      res.redirect(301, '/dashboard');
    } else{
      res.redirect(301, '/signup'); // If not user i.e. signup didnt succeed
    }
  })
  } catch(err){
    console.log(err);
  }

});

app.get("/login", (req, res) => {
  res.status(200).render("login", {title: 'Login'});
});

app.post("/login", async (req, res) => {
  let {email, password} = req.body;
  let user = {
    email,
    password
  };

  user = await validate.validateLogin(user);
  if(user){
    const token = createToken(user.email);
    res.cookie('jwt', token, {httpOnly: true, maxAge: expiration * 1000}) // maxAge is in milliseconds
    res.redirect('/dashboard');
  } else{
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {

  // Code to handle setting last login data
  const token = req.cookies.jwt;        
    if(token){
        jwt.verify(token, 'My little secret', async (err, decodedToken) => {
            if(err){
                console.log(err.message);
                res.locals.user = null
                next();
            } else{
               let user = await userModel.User.findOne({email: decodedToken.id});
               
               //Update login date data    
               const loginData = await userModel.User.updateOne({email: user.email}, 
               {$set: {lastLogin: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()}}); 
            }
        })
    }
  res.cookie('jwt', '', {maxAge: 1}); // Replace jwt token with empty string
  res.redirect(302, '/');
});

app.get('/dashboard', validate.requireAuth, validate.getCurrentUser, (req, res) => {
  res.render('dashboard', {title: 'User Dashboard'});
});

app.post('/edit-profile', validate.requireAuth, validate.getCurrentUser, (req, res) => {
  try{
    const uploadFolder = "uploads\\";
    const form = new formidable.IncomingForm();
    
    form.parse(req, async(err, fields, file) => {
      form.uploadDir = uploadFolder; // Set image upload directory
      // Get file extension
      let fileExt = [...file.profilePhoto.mimetype]; // Convert string to array
      fileExt = '.' + fileExt.slice(6).join('');

      // Save file with username
      fs.rename(file.profilePhoto.filepath, uploadFolder + fields.username + fileExt, () => { 
        fields.profilePhoto = uploadFolder + fields.username + fileExt;
      });
      const user = await validate.validateEdit(fields);
      res.redirect(301, '/dashboard');
    })
    } catch(err){
      console.log(err);
    }
});

app.get("*", (req, res) => {
  res.status(404).render("404");
});
