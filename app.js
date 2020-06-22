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

app.get('/',function(req,res){
    res.sendFile(path.join(__dirname+'/template/Home.html'));
});

app.get('/signup',function(req,res){
    res.sendFile(path.join(__dirname+'/template/Signup.html'));
});

app.get('/login',function(req,res){
    res.sendFile(path.join(__dirname+'/template/Login.html'));
});


app.post('/signup',function(req,res){
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
			res.redirect('/login');
			return;
		}
	});
});

app.post('/login',function(req,res){
	const em=req.body.email;
	const ps=req.body.pass;
	connection.query('Select * from staff where email=? and password=?',[em,ps],function(err,dbres,fields){
		if(dbres.length==1){

		}
	});
    res.sendFile(path.join(__dirname+'/template/Login.html'));
});

app.get('/page',function(req,res){
	res.sendFile(path.join(__dirname+'/template/page.html'));
});

app.post('/register_book',function(req,res){

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
	res.redirect('/page'); 
});


app.listen(3000);