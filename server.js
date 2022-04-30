import express from "express";
import ejs from "ejs";
import formidable from 'formidable';
import fs from 'fs';
import mongoose from 'mongoose'
import cookieParser from "cookie-parser";

import  jwt from "jsonwebtoken";
import { requireAuth } from "./requireAuth.mjs";
import validate from './validate.mjs';

const app = express();

app.set("view engine", "ejs");
app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const expiration = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({id}, 'My little secret', {
    expiresIn:  expiration// token is valid for three days
  })
}

const mongodb = 'mongodb://localhost/auth-site-db';
mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        app.listen(5000);
        console.log("Ready...");
    })
    .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.status(200).render("index", {title: 'AuthSite'});
});

app.get("/signup", (req, res) => {
  res.status(200).render("signup", {title: 'Signup'});
});

app.post('/signup', async (req, res) => {
  try{
  const uploadFolder = "C:\\Users\\Azula\\Documents\\Code\\auth-site\\views\\uploads\\";
  const form = new formidable.IncomingForm();
  form.maxFileSize = 50 * 1024 * 1024; //5MB
  form.uploadDir = uploadFolder; // Set image upload directory
  
  form.parse(req, async(err, fields, file) => {
    
    // Check if uploaded file is an image
    if( file.profilePhoto.mimetype !== 'image/png' || 
        file.profilePhoto.mimetype !== 'image/jpg' || 
        file.profilePhoto.mimetype !== 'image/jpeg'
      ) {
        console.log('Invalid file type');
    }
    
    // Get file extension
    let fileExt = [...file.profilePhoto.mimetype]; // Convert string to array
    // console.log(fileExt);
    // console.log(fileExt.lastIndexOf('/'));
    fileExt = '.' + fileExt.slice(6).join('');
    fs.rename(file.profilePhoto.filepath, uploadFolder + fields.username + fileExt, () => {
      fields.profilePhoto = uploadFolder + fields.username + fileExt;
    });
    const user = await validate.validateSignup(fields);
    if (user){
      const token = createToken(user.email);
      res.cookie('jwt', token, {httpOnly: true, maxAge: expiration * 1000}) // maxAge is in milliseconds
      res.redirect(301, '/dashboard');
    }
    res.redirect(301, '/signup'); // If not user i.e. signup didnt succeed
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

  console.log(user);

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
  res.redirect(302, '/');
});

app.get('/dashboard', requireAuth, (req, res) => {

  res.render('dashboard', {title: 'User Dashboard'});
});

app.get("*", (req, res) => {
  res.status(404).render("404");
});
