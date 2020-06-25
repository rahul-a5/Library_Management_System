var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const { request } = require('https');

const {
    sess_name='sid',
    sess_secret='rahulanand',
    sess_life=3600*1000
} =process.env

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'library'
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
	const em=req.body.email;
	const ps=req.body.pass;
	const reps=req.body.repass;
	connection.query('Select * from staff where email=?',[em],function(err,dbres,fields){
		if(err || dbres.length || ps!=reps){
			res.redirect('/signup');
			return;
		}
		else{
			connection.query('Insert into staff(email,password,admin) values(?,?,1)',[em,ps],function(err1,dbres1,fields1){
			});

			res.send('<script>alert("Signup Successfull")</script>');
			
			
		}
	});
});

app.get('/profile',redirectlogin, function(req,res){
	res.sendFile(path.join(__dirname+'/template/profile.html'));
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
			res.redirect('/profile');
		}
		else{
			res.redirect('/login');
		}
	});
});

app.post('/add_books',redirectlogin, function(req,res){

	const Book_id=req.body.b_id;
	const book=req.body.b_name;
	const author=req.body.a_name;
	const year=Number(req.body.publ_year);
	var Quantity=Number(req.body.quantity);
	var remaining=0;
	connection.query('select * from Books where bid=?',[Book_id],function(err,dbres,fields){
		if(dbres.length==1){
			remaining=dbres[0]['remaining'];
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
	res.redirect('/add_books');
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
		console.log(dbres.length);
		res.render('book_list',{data:dbres});
		
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
	
});

app.get('/add_staffs',redirectlogin, function(req,res){
	res.sendFile(path.join(__dirname+'/template/add_staffs.html'));
});

app.post('/add_staffs',redirectlogin, function(req,res){

});

app.get('/logout', redirectlogin, function(req,res){
	req.session.destroy();
	res.redirect('/');
});

app.listen(3000);