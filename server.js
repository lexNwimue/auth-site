import express from "express";
import ejs from "ejs";


const app = express();

app.set("view engine", "ejs");
app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));

app.listen(5000, (req, res) => {
  console.log("Listening for incoming request...");
});

app.get("/", (req, res) => {
  res.status(200).render("index");
});

app.get("/signup", (req, res) => {
  res.status(200).render("signup");
});

app.post('/signup', (req, res) => {
  let { name, username, email, phone, address, gender, password1, password2, dob } = req.body;
  console.log(name, username, email, dob)
  res.redirect('/dashboard')
});

app.get("/login", (req, res) => {
  res.status(200).render("login");
});

app.post("/login", (req, res) => {
  let {username, password} = req.body;
  console.log(username, password);
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
})

app.get("*", (req, res) => {
  res.status(404).render("404");
});
