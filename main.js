const mysql = require('mysql2');
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
app.use(cookieParser('cck'));


var path = require('path');
const { url } = require('inspector');
const { NULL } = require('node-sass');
app.use(express.static(__dirname + '/public'));

const urlencodedParser = bodyParser.urlencoded({extended:false});

const pool = mysql.createPool({
    host: "localhost",
    user: "mysql",
    database: "izdat",
    password: "mysql"
});

const connection = mysql.createConnection({
    host: "localhost",
    user: "mysql",
    database: "izdat",
    password: "mysql"
});

app.set("view engine", "hbs");




app.get("/admin", function(req, res) {
    let userID = req.signedCookies['userID'];
    let login = req.signedCookies['login'];
    let password = req.signedCookies['password']; 
    pool.query("SELECT * FROM APuser", function(err, data){
        let isLogged = false;
        data.forEach(el =>{
            if( el.login == login && el.password == password){
                    isLogged = true;
               }
           })
        if (isLogged){
            res.render("admin.hbs",{
                userlg: login
            })
        }
        else{
            res.redirect('/admin/login');
        }
    })
})

app.post("/admin/registration",urlencodedParser, function(req, res){
    let nLogin = req.body.nLogin;
    let nPassword = req.body.nPassword;
    pool.query("INSERT INTO APuser(login, password) values ('"+nLogin+"','"+nPassword+"')", function(err, result){
        if(err) console.log(err.message);
        res.render("registration.hbs");

    })
})



 app.post("/admin/login", urlencodedParser, function (req, res){
    let login = req.body.login;
    let password = req.body.password;
    let isLogged = false;
    let userId;
    pool.query("SELECT * FROM APuser", function(err, data){
        data.forEach(el =>{
            if( el.login == login && el.password == password){
                userId = el.userID;
                isLogged= true;
            }
        })
        if(isLogged){
            res.cookie('login', login, {
                secure: true,
                signed: true
            });

            res.cookie('password', password, {
                secure: true,
                signed: true
            });

            res.cookie('userID', userId, {
                secure: true,
                signed: true
            });
        res.redirect("/admin")
        }
        else{
            res.redirect('/admin/login');
        }
    })
 })
 
app.post("/IZzakaz", urlencodedParser, function (req, res) {
    let treb1 = req.body.treb1 ?"Корректорская правка текста":"Нет";
    let treb2 = req.body.treb2 ?"Верстка текста книги":"Нет";
    let treb3 = req.body.treb3 ?"Дизайн и верстка обложки":"Нет";
    let treb4 = req.body.treb4 ?"Присвоить коды ISBN, УДК и др":"Нет";
    let page_amount = req.body.page_amount// == undefined ?req.body.pages:"0";
    let oblozhka = req.body.oblozhka //== undefined ?req.body.oblozhka:" ";
    let format = req.body.format //== undefined ?req.body.format:"";
    let tirazh = req.body.tirazh //== undefined ?req.body.ekz:"0";
    let name = req.body.name //== undefined ?req.body.name:" ";
    let tel = req.body.tel //== undefined ?req.body.tel:"0";
    let mail = req.body.mail //== undefined ?req.body.mail:" ";
    let exist = false;
    pool.query("INSERT INTO needs(treb1, treb2, treb3, treb4, page_amount, format, tirazh, oblozhka) VALUES ('"+treb1+"','"+treb2+"','"+treb3+"','"+treb4
    +"','"+page_amount+"','"+format+"','"+tirazh+"','"+oblozhka+"')",
    [treb1,treb2, treb3, treb4, page_amount, format, tirazh, oblozhka],function(err, result){
        if (err) throw  err
        pool.query("select * from users", function(err, check){
            check.forEach(ex =>{
                if( ex.name == name && ex.tel == tel){
                    exist = true;
                }
            })
        
        if( exist == false){           

            pool.query("INSERT INTO users(name, tel, email) VALUES (?,?,?)", [name, tel, mail], function(err, result2){
                if (err) throw err
            
                pool.query("insert into users_needs(user_id, needs_id) values (?,?)", [result2.insertId, result.insertId])
                res.redirect(req.headers.referer);
            })
        }
        else{
            pool.query("select user_id from users where name = '"+name+"' and tel = '"+tel+"'", function(err, usd){

                let gag = usd[0];
                pool.query("insert into users_needs(user_id, needs_id) values (?,?)", [gag.user_id, result.insertId])
                    res.redirect(req.headers.referer);
                })
        }
        })
    })
    

});

app.post("/check", urlencodedParser, function(req, res){
    let name = req.body.name;
    let tel = req.body.tel;
    let isLogged = false;
    let userID;
    pool.query("SELECT * FROM users", function(req, data){
        data.forEach(el =>{
            if( el.name == name && el.tel == tel){                      //поменял phone на tel в БД
                userID = el.user_id;
                isLogged= true;
            }
        })
        if(isLogged){
            res.cookie('name', name, {
                secure: true,
                signed: true
            });

            res.cookie('tel', tel, {
                secure: true,
                signed: true
            });

            res.cookie('userID', userID, {
                secure: true,
                signed: true
            });
        res.redirect("/check/list")
        }
        else{
            res.redirect('/check');
        }
        })
    })


    app.get("/check/list", function(req,res){
        let name = req.signedCookies['name'];
        let tel = req.signedCookies['tel'];
        let userID = req.signedCookies['userID'];
        

            pool.query("select user_id from users where name = '"+name+"' and tel = '"+tel+"'", function(err, userData){
            let uid = userData[0];
                pool.query("SELECT users_needs.needs_id, treb1, treb2, treb3, treb4, page_amount, format, tirazh, oblozhka FROM users_needs INNER JOIN needs on needs.needs_id = users_needs.needs_id WHERE user_id ='"+uid.user_id+"'", function(err, result){
                    
                            res.render("list.hbs",{
                                  needs: result, 
                                
                            })
                        })
                        
                    })
                    
    })



connection.connect(function(err) {
    if(err){
        return console.error("Error" + err.message);
    }
    else{
        console.log("MySql подключен");
    }
});


app.get("/", function(req,res){
    res.render("IZmain.hbs");
});

app.get("/IZzakaz", function(req,res){
    res.render("IZzakaz.hbs");
});

app.get("/us", function(req,res){
    res.render("us.hbs");
});

app.get("/otziv", function(req,res){
    res.render("otziv.hbs");
});

app.get("/contacts", function(req,res){
    res.render("Contacts.hbs");
});

app.get("/admin/login", function(req, res) {
    res.render("adminlogin.hbs")
})

app.get("/admin/registration", function(req, res){
    res.render("registration.hbs")
})

app.get("/check", function(req, res){
    res.render("check.hbs")
})

app.get("/check/list", function(req, res){
    res.render("list.hbs")
})




app.listen(8080, function() {
    console.log("Сервер ожидает подключения...");
});

