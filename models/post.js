var mongodb=require("./db");

function Post(name,title,post,tags){
	this.name=name;
	this.title=title;
	this.post=post;
  this.tags=tags;
}


module.exports=Post;

Post.prototype.save=function(cb){
   var  date=new Date();
   var time={
   	date:date,
   	year:date.getFullYear(),
   	month:date.getFullYear()+"-"+(date.getMonth()+1),
   	day:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(),
   	minute:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+"-"+(date.getMinutes()<10?"0"+date.getMinutes():date.getMinutes())
   }
   var post={
   	name:this.name,
   	title:this.title,
   	time:time,
   	post:this.post,
    tags:this.tags,
    comments:[],
    pv:0
   }

    mongodb.open(function(err,db){
    	if(err){
    		return  cb(err);
    	}
    	db.collection("posts",function(err,collection){
     		if(err){
    			mongodb.close();
    			return cb(err);
        }
            collection.insert(post,{safe:true},function(err,doc){
            	mongodb.close();
            	if(err){
            		return cb(err)
            	}
                cb(null,doc);  

            });
    	});
    });
}

Post.getTen=function(name,page,cb){
	mongodb.open(function(err,db){
        if(err){
          return cb(err);
        }
        db.collection("posts",function(err,collections){
        	if(err){
        		mongodb.close();
        		return  cb(err);
        	}
          var query={};
          if(name!=null){
            query.name=name;
          }
          collections.count(query,function(err,count){
        	collections.find(query,{limit:10,skip:(page-1)*10}).sort({time:-1}).toArray(function(err,doc){
           		mongodb.close();
                if(err){
                	return cb(err);
                } 
                 cb(null,doc,count);
        	});
        });
	   });
    });
};
Post.getOne=function(name,day,title,cb){
  mongodb.open(function(err,db){
    if(err){
      return  cb(err);
    }
    db.collection("posts",function(err,collections){
      if(err){
         mongodb.close();
        return  cb(err);
      }
       collections.findOne({
        "name":name,
        "title":title,
        "time.day":day
      },function(err,doc){
        if(doc){
          collections.update({
          "name":name,
        "title":title,
        "time.day":day},{$inc:{"pv":1}},function(err){
         mongodb.close();
        if(err){
          return cb(err);
        }
        cb(null,doc);    
      });
     }
   });
    });
  });
}

Post.edit=function(name,day,title,cb){
  mongodb.open(function(err,db){
    if(err){
      return  cb(err);
    }
    db.collection("posts",function(err,collections){
      if(err){
         mongodb.close();
        return  cb(err);
      }
       collections.findOne({
        "name":name,
        "title":title,
        "time.day":day
      },function(err,doc){
        mongodb.close();
        if(err){
          return cb(err);
        }
        cb(null,doc);
      });
    });
  });
}

Post.remove=function(name,day,title,cb){
  mongodb.open(function(err,db){
    if(err){
      return cb(err);
    }
    db.collection("posts",function(err,collections){
        if(err){
          db.close();
          return cb(err); 
        }
        collections.remove({
          "name":name,
          "time.day":day,
          "title":title},
          {w:1},function(err,doc){
            db.close();
            if(err){
              return cb(err);
            }
            return cb(null);
          });
    });

  });
}

Post.getTags=function(cb){
  mongodb.open(function(err,db){
    if(err){
      return cb(err);
    }
    db.collection("posts",function(err,collections){
        if(err){
          db.close();
          return cb(err); 
        }
        collections.distinct(
          "tags",function(err,doc){
            db.close();
            if(err){
              return cb(err);
            }
            return cb(null,doc);
          });
    });

  });
}
//根据特定tag查找文章
Post.getTag=function(tag,cb){
  mongodb.open(function(err,db){
    if(err){
      return cb(err);
    }
    db.collection("posts",function(err,collections){
        if(err){
          db.close();
          return cb(err); 
        }
        collections.find({
          "tags":tag}).sort({time:-1}).toArray(function(err,docs){
            mongodb.close();
            if(err){
              return cb(err);
            }
            cb(null,docs);
          });

  });
});
}

//模糊查询
Post.search=function(keyword,cb){
 mongodb.open(function(err,db){
    if(err){
      return cb(err);
    }
    db.collection("posts",function(err,collections){
        if(err){
          db.close();
          return cb(err); 
        }
        var pattern =new REgExp("^.*"+keyword+".*$",i);
        collections.find({
          "title":pattern}).sort({time:-1}).toArray(function(err,docs){
            mongodb.close();
            if(err){
              return cb(err);
            }
            cb(null,docs);
          });

  });
}); 
}




