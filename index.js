const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const SECRET = 'nicollyrocha';
require('dotenv').config();

const pool = new Pool({
  connectionString:
    'postgres://knfsktwyyseiqt:5fb727dd07e220e02e85d4c8944ec32b69d360ee0ed9cd417e594782bb92d3cb@ec2-34-235-31-124.compute-1.amazonaws.com:5432/d3h57i0h68jk1r',
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();

const PORT = process.env.PORT || 8000;

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

let listaUser = [];

function verifyJWT(req, res, next) {
  const token = req.headers['x-access-token'];
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).end();

    req.userName = decoded.userName;
    next();
  });
}

app.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM user_web');
    listaUser = rows.data;
    return res.status(200).send(rows);
  } catch (err) {
    console.error(err);
    return res.status(400).send(err);
  }
});

app.post('/user', async (req, res) => {
  const dados = req.body;
  try {
    const newUser = await pool.query(
      `INSERT INTO user_web(username, password) VALUES ('${dados.userName}', '${dados.password}')`
    );

    return res.status(200).send(newUser);
  } catch (err) {
    console.error(err);
    return res.status(400).send(err);
  }
});

app.post('/book', verifyJWT, async (req, res) => {
  console.log(req.userName + ' fez esta chamada!');
  const dados = req.body;
  try {
    const newUser = await pool.query(
      `INSERT INTO books(title, author, status, rating, username) VALUES ('${dados.title}', '${dados.author}', '${dados.status}', '${dados.rating}', '${req.userName}')`
    );

    return res.status(200).send(newUser);
  } catch (err) {
    console.error(err);
    return res.status(400).send(err);
  }
});

app.post('/userLogin/:userName/:password', async (req, res) => {
  let userValid = {
    userName: '',
    password: '',
  };
  try {
    const { rows } = await pool.query('SELECT * FROM user_web');
    listaUser = rows;
    console.log(rows);
    listaUser.forEach((item) => {
      if (
        item.username === req.params.userName &&
        item.password === req.params.password
      ) {
        userValid = {
          userName: item.username,
          password: item.password,
        };
      }
    });
    console.log('alow', listaUser);
    if (
      req.params.userName === userValid.userName &&
      req.params.password === userValid.password
    ) {
      const token = jwt.sign({ userName: req.params.userName }, SECRET, {
        expiresIn: 300,
      });
      return res.json({ auth: true, token: token });
    } else {
      res.status(401).end();
    }
  } catch (err) {
    console.error(err);
  }
});

app.post('/userLogout', async (req, res) => {
  return res.end();
});

app.listen(PORT, () => {
  console.log(`API started at port ${PORT}`);
});
