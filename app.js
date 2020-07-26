var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var moment = require('moment');

const { request } = require('https');

const {
    sess_name='sid',
    sess_secret='rahulanand',
    sess_life=3600*1000*100
} =process.env

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'library',
	multipleStatements: true
});

app.use(express.static(path.join(__dirname, '/')));

app.use(session({
	secret: sess_secret,
	resave: false,
    saveUninitialized: false,
    name: sess_name,
    cookie:{
        maxAge:sess_life,
        sameSite:true,
        secure:false
    }
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
const redirectlogin =(req,res,next)=>{
	//console.log(req.session.user);
    if(req.session.user){
        next();
    }
    else{
        res.redirect('/login');
    }
}

const redirectprofile =(req,res,next)=>{
    if(!req.session.user){
        next();
    }
    else{
        res.redirect('/profile');
    }
}


app.get('/',function(req,res){
    res.sendFile(path.join(__dirname+'/template/Home.html'));
});

app.get('/signup', redirectprofile,function(req,res){
    res.sendFile(path.join(__dirname+'/template/Signup.html'));
});

app.get('/login',redirectprofile,function(req,res){
    res.sendFile(path.join(__dirname+'/template/Login.html'));
});


app.post('/signup',redirectprofile,function(req,res){
	const nm=req.body.Name;
	const id=req.body.id;
	const em=req.body.email;
	const ps=req.body.pass;
	const reps=req.body.repass;
	if(reps==ps){
	connection.query('Select * from staff where email=?',[em],function(err,dbres,fields){
		if(err || dbres.length){
			res.send("<script language='javascript'>window.alert('Email already exists.');window.location='/signup';</script>");
			return;
		}
		else{
			connection.query('Insert into staff(name,Id,email,password,admin) values(?,?,?,?,1)',[nm ,id ,em ,ps],function(err1,dbres1,fields1){
			});
			res.send("<script language='javascript'>window.alert('Signup Successfull');window.location='/login';</script>");
		}
	});}
	else{
		//console.log("fail");
		res.send("<script language='javascript'>window.alert('Both passwords are not same');window.location='/signup';</script>");
	}
});

app.get('/profile',redirectlogin, function(req,res){
	res.sendFile(path.join(__dirname+'/template/profile.html'));
});

app.get('/staff_profile',redirectlogin, function(req,res){
	res.sendFile(path.join(__dirname+'/template/staff_profile.html'));
});

app.get('/issue_book',redirectlogin, function(req,res){
	res.sendFile(path.join(__dirname+'/template/issue_book.html'));
});

app.get('/return_book',redirectlogin, function(req,res){
	res.sendFile(path.join(__dirname+'/template/return_book.html'));
});

app.get('/add_books',redirectlogin, function(req,res){
	res.sendFile(path.join(__dirname+'/template/add_books.html'));
});

app.post('/login',redirectprofile,function(req,res){
	const em=req.body.email;
	const ps=req.body.pass;
	connection.query('Select * from staff where email=? and password=?',[em,ps],function(err,dbres,fields){
		if(dbres.length==1){
			req.session.user=dbres[0].email;
			req.session.admin=dbres[0].admin;
			req.session.staff=dbres[0].id;
			if(req.session.admin===1){
				res.redirect('/profile');
			}
			else{
				res.redirect('/staff_profile');
			}
			
		}
		else{
			res.send("<script language='javascript'>window.alert('Email and Password not match');window.location='/login';</script>");
		}
	});
});

app.post('/add_books',redirectlogin, function(req,res){

	const Book_id=req.body.b_id;
	const book=req.body.b_name;
	const author=req.body.a_name;
	const year=Number(req.body.publ_year);
	var Quantity=Number(req.body.quantity);
	var remaining=Quantity;
	if(Quantity<=0){
		res.send("<script language='javascript'>window.alert('Quantity should be positive');window.location='/add_books';</script>");
		return;
	}
	connection.query('select * from Books where bid=?',[Book_id],function(err,dbres,fields){
		if(err){
			res.send("<script language='javascript'>window.alert('Error');window.location='/add_books';</script>");
		}
		else if(dbres.length==1){
			remaining=remaining+dbres[0]['remaining'];
			Quantity=Quantity+dbres[0]['total_no'];
				connection.query('delete from Books where bid=?',[Book_id],function(err2,dbres2,fields2){
					connection.query('Insert into Books(bid,aname,bname,published_year,total_no,remaining) values(?,?,?,?,?,?)',[Book_id,book,author,year,Quantity,remaining],function(err1,dbres1,fields1){
					});
				});
		}else{
			connection.query('Insert into Books(bid,aname,bname,published_year,total_no,remaining) values(?,?,?,?,?,?)',[Book_id,book,author,year,Quantity,remaining],function(err1,dbres1,fields1){
			});
		}
	});
	res.send("<script language='javascript'>window.alert('Successfully registered');window.location='/add_books';</script>");
});


app.post('/get_books',function(req,res){
	var str=req.body.name;
	console.log(str);
	var lstr=str.toLowerCase();
	lstr='%'+lstr;
	lstr+='%';
	console.log(lstr);
	if(req.body.type=='B'){
	connection.query("Select bname , aname, published_year from Books where lower(bname) like ? ",[lstr],function(err,dbres,fields){
		if(err){
			res.redirect('/');
		}
		else{
		console.log(dbres.length);
		res.render('book_list',{data:dbres});}
		
	});}
	else{
		connection.query("Select bname , aname, published_year from Books where lower(aname) like ? ",[lstr],function(err,dbres,fields){
			if(err){
				res.redirect('/');
			}
			console.log(dbres.length);
			res.render('book_list',{data:dbres});
			
		});	
	}
	
});

app.get('/add_students',redirectlogin, function(req,res){
	res.sendFile(path.join(__dirname+'/template/add_students.html'));
});

app.post('/add_students', redirectlogin, function(req,res){
	var name=req.body.s_name;
	var roll=req.body.r_no;
	connection.query('Select * from Students where Roll_no=?',[roll],function(err,dbres,fields){
		if(err){
			res.send("<script language='javascript'>window.alert('Something error occurred');window.location='/add_students';</script>");
		}
		else if(dbres.length!=0){
			res.send("<script language='javascript'>window.alert('Roll no already exists');window.location='/add_students';</script>");
		}
		else{
			connection.query('Insert into Students(Roll_no,Name) values(?,?)',[roll,name],function(err1,dbres1,fields1){
				if(err){
					res.send("<script language='javascript'>window.alert('Something error occurred');window.location='/add_students';</script>");
				}
				else{
					res.send("<script language='javascript'>window.alert('Successfully Registered');window.location='/add_students';</script>");
				}
			});
		}
	});
	
});

app.get('/add_staffs',redirectlogin, function(req,res){
	res.sendFile(path.join(__dirname+'/template/add_staffs.html'));
});

app.post('/add_staffs',redirectlogin, function(req,res){
	const nm=req.body.Name;
	const id=req.body.id;
	const em=req.body.email;
	const ps=req.body.pass;
	const reps=req.body.repass;
	if(reps==ps){
		connection.query('Select * from staff where email=? or Id',[em,id],function(err,dbres,fields){
			if(err || dbres.length){
				if(dbres[0].id==id){
					res.send("<script language='javascript'>window.alert('Id already exists');window.location='/add_staffs';</script>");
				}
				else{
					res.send("<script language='javascript'>window.alert('Email id already exists');window.location='/add_staffs';</script>");
				}
			}
			else{
				connection.query('Insert into staff(Name,id,email,password,admin) values(?,?,?,?,0)',[nm ,id ,em ,ps],function(err1,dbres1,fields1){
				});
				//console.log('success');
				res.send("<script language='javascript'>window.alert('Successfully Registered');window.location='/add_staffs';</script>");
			}
		});
	}
	else{
		//console.log("fail");
		res.send("<script language='javascript'>window.alert('Please enter same password in both field');window.location='/add_staffs';</script>");
	}

});


app.post('/issue_book',function(req,res){
	var bid=req.body.b_id;
	var sid=req.body.s_id;
	connection.query('Select * from Books where bid=?',[bid],function(err,dbres,fields){
		if(dbres.length==0){
			res.send("<script language='javascript'>window.alert('Please enter valid Book id');window.location='/issue_book';</script>");
		}
		else if(dbres[0]['remaining']==0){
			res.send("<script language='javascript'>window.alert('These book is currently not available');window.location='/issue_book';</script>");
		}
		else{
			connection.query('Select no_of_book_issued as t from Students where Roll_no=?',[sid],function(err1,dbres1,fields1){
				if(dbres1.length==0){
					res.send("<script language='javascript'>window.alert('Please enter valid Student roll no');window.location='/issue_book';</script>");
				}
				else if(dbres1[0]['t']>2){
					res.send("<script language='javascript'>window.alert('Sorry, this student have already 3 books.');window.location='/issue_book';</script>");
				}
				else{
					//console.log(req.session.staff);
					connection.query('insert into issued_books(staff_id,id,Roll_no,issued_date) values(?,?,?,curdate());update Students set no_of_book_issued=no_of_book_issued+1 where Roll_no=?; update Books set remaining=remaining-1 where bid=?;',   [req.session.staff,bid,sid,sid,bid],function(err2,dbres2,fields2){
						if(err2){
							//console.log(err2);
							res.send("<script language='javascript'>window.alert('Error');window.location='/issue_book';</script>");
						}
						else{
							res.send("<script language='javascript'>window.alert('Successfully registered');window.location='/issue_book';</script>");
						}
					})
				}
			})
		}
	});
});

app.get('/logout', redirectlogin, function(req,res){
	req.session.destroy();
	res.redirect('/');
});

app.listen(3000);

