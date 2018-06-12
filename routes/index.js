//MD5加密
var crypto =require("crypto");
var  User =require("../models/user.js");
var  Post =require("../models/post.js");
var  Comment=require("../models/comments.js");
var express = require('express');
var fs      =require("fs");
var router = express.Router();


/*中间方法*/
function checklogin(req,res,next){
  if(!req.session.user){
     req.flash("error","未登录");
     res.redirect("/login");
  } 
 next();
}

function checknotlogin(req,res,next){
 if(req.session.user){
 	req.flash("error","已经登录");
     res.redirect("back");
 }
next();
}




/* GET home page. */
router.get('/', function(req, res, next) {
	console.log(req.query);
	var page=req.query.p ? parseInt(req.query.p) :1;
	Post.getTen(null,page,function(err,posts,total){
		if(err){
			posts=[];
		}
		console.log(page+"-------");
		  res.render('index', { 
		  	     title: '主页' ,
		         user:req.session.user,
		         posts:posts,
		         page:page,
		         isFirstPage:(page-1) ==0,
		         isLastPage:((page-1)*10+posts.length)==total,
		         success:req.flash("success").toString(),
		         error:req.flash("error").toString()          
		      	  });
		        });
});
router.get("/reg",checknotlogin);
router.get("/reg",function(req,res,next){
	res.render('reg',{
		title:"注册",
		 user:req.session.user,
         success:req.flash("success").toString(),
         error:req.flash("error").toString()
	});
});
router.post("/reg",checknotlogin);
router.post("/reg",function(req,res,next){
	//注册的表单提交
   var username=req.body.username,
        password=req.body.password,
        password_re=req.body["password-repeat"];

   if(password!= password_re){
   	return res.redirect("/reg");//返回注册页面
   }
   //通过散列值进行MD5加密；
   var MD5=crypto.createHash("md5");
   var password=MD5.update(password).digest("hjw"); 
   var newuser =new User({
   	username:username,
   	password:password,
   	email:req.body.email
   });
    
    User.get(newuser.username,function(err,user){
    	if(user){
    		req.flash("error","用户已存在！");
    		return res.redirect("/reg");
    	}
    	//不存在执行新增用户
    	newuser.save(function(err,newuser){
    		if(err){
    			req.flash("error",err);
    		     return res.redirect("/reg");
    		}
    		req.session.user =user;
    		req.flash("success","注册成功");
            res.redirect("/");//注册成功
    	});
    });
});


router.get("/login",checknotlogin);
router.get("/login",function(req,res,next){
	res.render('login',{title:"登录",
          user:req.session.user,
         success:req.flash("success").toString(),
         error:req.flash("error").toString() 
         });
});


router.post("/login",checknotlogin);
router.post("/login",function(req,res,next){
   //登陆验证
    var username=req.body.username;
    var md5=crypto.createHash("md5");
    var password=md5.update(req.body.password).digest("hjw");
    User.get(username,function(err,user){
         if(!user){
         	//不存在则执行重定向注册页面
         	req.flash("error","该用户不存在");
            return res.redirect("/login");
         }
         //console.log(user);
        if(password==user.password){
         	//不存在则执行重定向注册页面
         	req.flash("error","密码错误");
         	return res.redirect("/login");
         } 
         req.session.user=user;
         req.flash("success","登录成功");
         res.redirect("/"); 
    });
 });
router.get("/post",checklogin);
router.get("/post",function(req,res,next){
	res.render('post',{title:"发表",
         user:req.session.user,
         success:req.flash("success").toString(),
         error:req.flash("error").toString() 
           });
});
router.post("/post",checklogin);
router.post("/post",function(req,res,next){
     //发表
     var name =req.session.user.username;
     var tags =[req.body.tag1,req.body.tag2,req.body.tag3];
     var  post =new Post(name,req.body.title,req.body.post,tags);
     post.save(function(err){
             if(err){
            	req.flash("error",err);
            	return req.redrect("/");
            }
            req.flash("success","发布成功");
            res.redirect("/");

     });
 });
router.get("/logout",checklogin);
router.get("/logout",function(req,res,next){
       req.session.user=null;
       req.flash("success","登出成功");  
       res.redirect("/");
 });

//上传文件
router.get("/upload",checklogin);
router.get("/upload",function(req,res,next){
	res.render("upload",{
		title:"上传",
		user:req.session.user,
		error:req.flash("error").toString(),
		success:req.flash("success").toString()
	});
});

router.post("/upload",checklogin);
router.post("/upload",function(req,res,next){
	console.log(req);
for( var i in req.files){
	if(req.files[i].size==0){
    //使用同步删除文件
    fs.unlinkSync(req.files[i].path);
    console.log("成功溢出空的文件");
	}else{
    var  target_path="./public/images"+req.files[i].name;
    fs.renameSync(req.files[i].path,target_path);
    console.log("成功重命名");
	}
}

});


//用户页面
router.get("/u/:name",function(req,res){
    User.get(req.params.name,function(err,user){
    	if(!user){
          req.flash("error","用户不存在");
          return   res.redirect("/");
    	}
    	var page=req.query.p ?parseInt(req.query.p) :1;
    	Post.getTen(req.params.name,page,function(err,posts,total){
    		if(err){
             req.flash("error",err);
             return res.redirect("/");
    		}
    		res.render("user",{
    			title:user.username,
    			posts:posts,
    			isFirstPage:(page-1)==0,
    			isLastPage:((page-1)*10+posts.length)==total,
    			page:page,
    			user:req.session.user,
    			success:req.flash("success").toString(),
    			error:req.flash("error").toString()

    		});
    	});
    });
});
//文章页面
router.get("/u/:name/:title/:day",function(req,res){
    Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
    		if(err){
             req.flash("error",err);
             return res.redirect("/");
    		}
    		console.log(post);
     		res.render("article",{
    			title:req.params.title,
    			post:post,
    			user:req.session.user,
    			success:req.flash("success").toString(),
    			error:req.flash("error").toString()
    		});
    	});
    });

//文章编辑操作
router.get("/edit/:name/:day/:title",checklogin);
router.get("/edit/:name/:day/:title",function(req,res){
   Post.edit(req.params.name,req.params.day,req.params.title,function(err,post){
   	if(err){
   		req.flash("error",err);
   		return res.redirect("/");
   	}
   	res.render("edit",{
   		title:"编辑",
   		user:req.session.user,
   		error:req.flash("error").toString(),
   		success:req.flash("success").toString(),
   		post:post
   	});
   });
});

router.post("/edit/:name/:day/title",checklogin);
router.post("/edit/:name/:day/title",function(req,res){
     Post.update(req.params.name,req.params.day,req.params.title,function(err){
     	var url="/u/"+req.params.name+"/"+req.params.day+"/"+req.params.title;
   	if(err){
   		req.flash("error",err);
   		return res.redirect(url);
   	}
   	req.flash("success","修改成功");
   	res.redirect(url);
   });

});
//文章删除操作
router.get("/remove/:name/:day/:title",checklogin);
router.get("/remove/:name/:day/:title",function(req,res){
   Post.remove(req.params.name,req.params.day,req.params.title,function(err,post){
    	if(err){
   		req.flash("error",err);
   		return res.redirect("/");
   	}
   	req.flash("success","删除成功");
   	res.redirect("/");

   });
});


//添加评论
 router.post("/u/:name/:title/:day",function(req,res){
   var  date=new Date();
   var time=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+":"+(date.getMinutes()<10?"0"+date.getMinutes():date.getMinutes());
   var comment={
  	name:req.body.name,
  	time:time,
  	content:req.body.content,
  	website:req.body.website,
  	email:req.body.email
  };
  var newcomment= new Comment(req.params.name,req.params.day,req.params.title,comment);
   newcomment.save(function(err){
   	if(err){
   		req.flash("error",err);
   		return res.redirect("back");
   	}
   	req.flash("success","留言成功");
   	res.redirect("back");
   });
  });
 


 //标签
 router.get("/tags",function(req,res){
 	Post.getTags(function(err,posts){
 		if(err){
 			req.flash("error",err);
 			return res.redirect("/");
 		}
 		res.render("tags",{
 			title:"标签",
 			posts:posts,
 			user:req.session.user,
 			error:req.flash("error").toString(),
 			success:req.flash("success").toString()
 		});
 	});
 });
 router.get("/tags/:tag",function(req,res){
 	Post.getTag(req.params.tag,function(err,posts){
 		if(err){
 			req.flash("error",err);
 			return res.redirect("/");
 		}
 		res.render("tag",{
 			title:"TAG"+req.params.tag,
 			posts:posts,
 			user:req.session.user,
 			error:req.flash("error").toString(),
 			success:req.flash("success").toString()
 		});
 	});
 });
 //搜素
router.get("/search",function(req,res){
	Post.search(req.body.keyword,function(err,posts){
		if(err){
			req.flash("error",err);
			return res.redirect("/");
		}
		res.render("search",{
			title:"SEARCH"+req.body.keyword,
 			posts:posts,
 			user:req.session.user,
 			error:req.flash("error").toString(),
 			success:req.flash("success").toString()
		});
	});
});
















module.exports = router;
