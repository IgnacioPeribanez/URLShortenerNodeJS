// Importamos nanoid
const nanoid = require('nanoid');

// Importamos express
const express = require('express');

// Importamos body-parser
const bodyParser = require('body-parser');

// Importamos session
const session = require('express-session');

// Importamos MySql
const mysql = require('mysql2');

// Importamos url
const url = require('url');

// Importamos passport
const passport = require('passport');

// Importamos passport-google-oauth
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Inicializamos express
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// Creamos la conexion a MySql
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: 'urlsortered'
});

// Definimos el motor de los templates
app.set('view engine', 'ejs');

// Inicializamos la session 
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'SECRET'
}));

// Elegimos el puerto donde se ejecutara la web
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('App listening on port ' + port));

// Inicializamos la variable del usuario
var userProfile;

// Inicializamos passport con la sesion
app.use(passport.initialize());
app.use(passport.session());

// Gestionamos los atributos del usuario
passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

// Introducimos los atributos del cliente al que nos conectaremos
const GOOGLE_CLIENT_ID = '247565121641-nju5sboc99b00537ku8lei55uh63i3ka.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
// Nos conectamos al cliente
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback"
},
  function (accessToken, refreshToken, profile, done) {
    userProfile = profile;
    return done(null, userProfile);
  }
));

// Gestionamos la funcion GET que se ejecutara al dirigirnos a /auth/google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

// Gestionamos la funcion GET que se ejecutara al dirigirnos a /auth/google/callback
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/error' }),
  function (req, res) {
    // Si se inicia sesion correctamente iremos a /success
    res.redirect('/success');
  });

// Gestionamos la funcion GET que se ejecutara si no se consigue logear el usuario
app.get('/error', (req, res) => res.send("error logging in"));

// Gestionamos la funcion GET que se ejecutara al entrar en nuestra web 
app.get('/', function (req, res) {
  // Dividimos la url
  const parsedUrl = url.parse(req.url, true);
  // Almacenamos el atributo id si es que lo tiene. Este id es la url short
  const id = parsedUrl.query.id;
  // Condicion (Si el atributo id no existe)
  if (!id) {
    // Iniciamos el proceso de inicio de sesion
    res.render('pages/auth');
  } else {
    // Buscamos la id de la URL en nuestra base de datos
    db.query('SELECT url_Original FROM `url` WHERE `url_Nueva` = ?', [id], (error, results) => {
      // Codicion (Si existe en la base de datos)
      if (results.length != 0) {
        // Redireccionamos a la web real y aumentamos las interacciones con la sort
        db.query('SELECT interacciones FROM `url` WHERE `url_Nueva` = ?', [id], (error, results) => {
          interacciones = results[0].interacciones
          db.query('UPDATE url SET interacciones = interacciones + 1 WHERE `url_Nueva` = ?', [id], (error, results) => { })
        })
        res.redirect(results[0].url_Original);
      } else {
        // Iniciamos el proceso de inicio de sesion
        res.render('pages/auth');
      }
    })
  }
});

// Gestionamos la funcion GET que se ejecutara al entrar en /success 
app.get('/success', (req, res) => {
  // Buscamos las url creadas por el usuario 
  db.query('SELECT * FROM `url` WHERE `id_Usuario` = ?', [userProfile.id], (error, results) => {
    res.render('pages/success', { user: userProfile, urls: results });
  })
});

// Gestionamos la funcion POST que se ejecutara al dirigirnos a /shorturl (Se ejecutara una vez el usuario intente acortar una URL)
app.post("/shorturl", (req, res) => {
  // URL que intenta acortar
  const fullUrl = req.body.fullUrl;
  // Comprobamos si ya ha sido acortada por el usuario
  db.query('SELECT * FROM `url` WHERE `url_Original` = ? and `id_Usuario` = ?', [fullUrl, userProfile.id], (error, results) => {
    // Condicion (Si no ha sido acortada se acorta y se almacena)
    if (results.length === 0) {
      // Se crea in identificador unico que sera la nueva url
      const short = nanoid.nanoid();
      let creacion = new Date;
      // Se inserta el registro
      db.query("INSERT INTO url (id_Usuario, url_Original, url_Nueva, interacciones, creacion) VALUES (?, ?, ?, ?, ?)",
      [userProfile.id, fullUrl, short, 0, creacion.toISOString().slice(0, 10)], (err, res) => {});
    }
  });
  // Redireccionamos a la pagina principal del usuario
  res.redirect('/success');
});

