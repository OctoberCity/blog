var mongodb=require("./db");

function User(user){

this.username=user.username;
this.password=user.password;
this.email =user.email;
}

module.exports=User;


//将方法写进原型链
User.prototype.save=function(cb){
    var user={
    	username:this.username,
    	password:this.password,
    	email:this.email
    };
     mongodb.open(function(err,db){
       if(err){
       	return cb(err);//错误通过回掉函数返回
       }
      db.collection("users",function(err,collection){
      	if(err){
      		mongodb.close();
      		return cb(err);
      	}
      	//将数据插入数据库中
      	collection.insert(user,{safe:true},function(err,doc){
      		mongodb.close();
      		if(err){
      			return cb(err);
      		}
      		cb(null,doc[0]);//回掉返回结果，null是err.
      	});
      });     

    });
}

//获取用户信息

User.get =function(name,cb){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){return cb(err); }
		db.collection("users",function(err,collection){
			if(err){
				mongodb.close();
				return cb(err);
			}
			collection.findOne({username:name},function(err,doc){
  				mongodb.close();
				if(err){return cb(err);}
        if(doc!=null){
          cb(null,doc);
        }else{
          cb(null,doc);
        }
			
			});
		});
	});
}