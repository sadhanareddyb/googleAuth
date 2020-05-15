//jshint esversion:6
require('dotenc').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt= require('mongoose-encryption');
const passport=require ("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const app = express();

//ejs 

app.set('view engine', 'ejs');

// middleware body-parser used

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//mongodb connected,created users db

mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true});

//post schema created
const postSchema = {
  title: String,
  content: String
};
const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/compose",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//models for post and users 
const User = new mongoose.model("User", userSchema);

const Post = mongoose.model("Post", postSchema);

//home page route

app.get("/", function(req, res){

  Post.find({}, function(err, posts){
    res.render("home", {
      
      posts: posts
      });
  });
});
//// Routes for creating a new post/submission

app.get("/compose", function(req, res){
  res.render("register");
});

app.post("/compose", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });
  post.save(function(err){//save to db
    if (!err){
        res.redirect("/");
    }
  });
});
//open post with that postId
app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content
    });
  });

});

//// Routes for creating a new user
app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){
  const newUser=new User({
    email:req.body.username,
    password:req.body.password,
  });
  newUser.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("compose");
    }
  
});
});

  

app.get("/corona", function(req, res){
  res.redirect("https://www.indiatoday.in/coronavirus");
});
app.get("/Livetv", function(req, res){
  res.redirect("https://www.indiatoday.in/livetv");
});

////login rout 
app.get("/login", function(req, res){
  res.render("login");
});

//check user and password
app.post("/login", function(req, res){

 
    username= req.body.username;
    password= req.body.password;
  
User.findOne({email:username},function(err,foundUser){

  if (err) {
    return res.status(422).send({error:"please enter all fields"})
  } else {
    if(foundUser){
      if(foundUser.password===password){
        res.redirect('/');
      }
    }
  }

});
});
//edit news
app.get("/edit/:id", (req, res) => {
  const requestedId = req.params.id;
  console.log(req.body);
  Post.findOne({
    _id: requestedId
  }, (err, post) => {
    if (!err) {
      res.render("edit", {
        title: post.title,
        content: post.content
      });
    }
  });
});


//delete news
app.post("/delete", (req, res) => {
  const deletePost = req.body.delete;

  Post.findByIdAndDelete(deletePost, (err) => {
    if (!err) {
      res.redirect("/");
    }
  });
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
