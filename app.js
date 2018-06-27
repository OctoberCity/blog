var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session =require("express-session");
var flash =require("connect-flash");
var MongoStore = require("connect-mongo")(session);
var settings =require("./settings");
var bodyparser=require("body-parser");
var indexRouter = require('./routes/index'); 
//添加日志文件
var fs=require("fs");
var accesslog=fs.createWriteStream("access.log",{"flags":"a"});
var errorlog=fs.createWriteStream("error.log",{"flags":"a"});
var app = express();
//添加第三方登入
var passport=require("passport");
var githubStrategy=require("passport-github").Strategy;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(logger('dev'));
app.use(logger({stream:accesslog}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyparser.urlencoded({keepExtensions:true,uploadDir:"./public/images"}));
app.use(cookieParser());
app.use(session({
	secret :settings.cookieSecret,
	key    :settings.db,
	cookie :{maxAge :1000*60*60},
	store :new MongoStore({
		db:settings.db,
		url: 'mongodb://localhost/blog',
		collection : "sessions"
	}) 
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err,req,res,next){
	var meta='['+new Date()+']'+req.url+"\n"
	errorlog.write(meta+err.stack+'\n');
	next();
});
app.use(passport.initialize());
app.use('/', indexRouter);
 
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

passport.use(new githubStrategy({
	clientID:"d56e9a55e29d2871710e",
	clientSecret:"a53aad5f08b4b0eddba6a0cedb3cb0021ea09b68",
	callbackURL:"http://localhost:3000/login/github/callback"
},function(accessToken,refreshToken,profile,done){
	done(null,profile);
}));
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
