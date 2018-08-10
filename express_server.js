function generateRandomString() {
  let resultStr = '';
  let possibleOutcomes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
  for (let i = 0; i < 6; i++) {
    resultStr += possibleOutcomes.charAt(Math.floor(Math.random() * possibleOutcomes.length));
  }
  
  return resultStr;
}

var express = require("express");
    // employ the express library
var app = express();
var PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set("view engine", "ejs");


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

var users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "password",
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "password2",
  },
}



app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase, 
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.clearCookie("user_id");
  // res.cookie("user_id", genRandom);
  res.redirect("/urls");
})

app.post("/urls", (req, res) => {
  let gnShortUrl = generateRandomString();
  
  urlDatabase[gnShortUrl] = req.body.longURL;
  // console.log(urlDatabase);  
  res.redirect("http://localhost:8080/urls/" + gnShortUrl);         
});


app.get("/register", (req, res) => {
  res.render("registration")
});


app.post("/register", (req, res) => {
  if(req.body.email && req.body.password){
    for (let user in users) {
      console.log(users[user])
      if (req.body.email === users[user].email) {
        res.status(400).send("NOPE"); 
        return
      } else {
      let genRandom = generateRandomString();
        users[genRandom] = {
        id: genRandom,
        email: req.body.email,
        password: req.body.password}
        res.cookie("user_id", genRandom);
        res.redirect("/urls");
      }
    } 
  } else {
    res.status(400).send("NOPE");
}
});

app.post("/login", (req, res) => {
  let userFound = false;
  console.log('jimmy: '+req.cookies.user_id);
  let foundUser;
  for(let user in users) {
    // console.log("in for loop");
    // console.log(users[user].email);
    // console.log(users[user].password);
    // console.log(req.body.email);
    // console.log(req.body.password);
    if(users[user].email === req.body.email && users[user].password === req.body.password){
      userFound = true;
      foundUser = users[user]
      console.log("is true!")
    }
  }
  if(userFound === true) {
    res.cookie("user_id", foundUser.id);
    res.redirect("/urls");

  } else{
  res.status(403).send("incorrect login details");
  }// console.log(req.body.username);
  // res.redirect("/urls");
});
app.get("/urls/:id", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["user"],
  };
  // console.log(req.params);
  res.render("urls_show", templateVars);
});
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] =req.body.longURL;
  res.redirect("/urls/" + req.params.id);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  // console.log(req.params.id)
  res.redirect("/urls")  
});

app.post("/urls:id/edit", (req, res) => {
  res.redirect("/urls/:id")
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

