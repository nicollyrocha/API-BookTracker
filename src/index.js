const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const gerarQueries = require('./gerarQueries');
const SECRET = 'nicollyrocha';
const bcrypt = require('bcryptjs');
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

let db = [
  { 1: { Nome: 'Cliente 1', Idade: '20' } },
  { 2: { Nome: 'Cliente 2', Idade: '20' } },
  { 3: { Nome: 'Cliente 3', Idade: '20' } },
];

app.get('/', (req, res) => {
  return res.json(db);
});

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
    const { rows } = await pool.query(gerarQueries.gerarQuerySelectAllUsers());

    return res.status(200).send(rows);
  } catch (err) {
    console.error(err);
    return res.status(400).send(err);
  }
});

app.get('/books/:username', async (req, res) => {
  const userName = req.params.username;
  try {
    const { rows } = await pool.query(
      gerarQueries.gerarQuerySelectBooksByUser(userName)
    );

    return res.status(200).send(rows);
  } catch (err) {
    console.error(err);
    return res.status(400).send(err);
  }
});

app.put('/book/:username', async (req, res) => {
  const userName = req.params.username;
  const dados = req.body;
  try {
    const { rows } = await pool.query(
      gerarQueries.gerarQueryUpdateBook(userName, dados)
    );

    return res.status(200).send(rows);
  } catch (err) {
    console.error(err);
    return res.status(400).send(err);
  }
});

app.post('/user', async (req, res) => {
  const dados = req.body;
  const rounds = 10;
  const hashPassword = async () => {
    const hash = await bcrypt.hash(dados.password, rounds);
    try {
      const newUser = await pool.query(
        gerarQueries.gerarQueryRegisterUser(dados, hash)
      );

      return res.status(200).send(newUser);
    } catch (err) {
      console.error(err);
      return res.status(400).send(err);
    }
  };
  hashPassword();
});

app.post('/book', async (req, res) => {
  const dados = req.body;
  try {
    const newUser = await pool.query(
      gerarQueries.gerarQueryRegisterBook(dados)
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
  let hash;
  let hash2;
  let item2;
  const userName = req.params.userName;
  const hashPassword = async () => {
    try {
      const rowsPassword = await pool.query(
        gerarQueries.gerarQueryPassword(userName)
      );
      const password_hash = rowsPassword.rows[0];
      hash = await bcrypt.compare(req.params.password, password_hash.password);

      try {
        const { rows } = await pool.query(gerarQueries.gerarQueryLogin());
        listaUser = rows;
        listaUser.forEach((item) => {
          item2 = item;

          if (item.username === req.params.userName && hash === true) {
            userValid = {
              userName: item.username,
              password: item.password,
            };
          }
        });
        hash2 = await bcrypt.compare(
          req.params.password,
          password_hash.password
        );
        if (req.params.userName === userValid.userName && hash2 === true) {
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
    } catch (err) {
      console.error(err);
    }
  };
  hashPassword();
});

app.delete('/book', async (req, res) => {
  const dados = req.body;
  try {
    const deleteBook = await pool.query(
      gerarQueries.gerarQueryDeleteBook(dados)
    );

    return res.status(200).send(deleteBook);
  } catch (err) {
    console.error(err);
    return res.status(400).send(err);
  }
});

app.post('/userLogout', async (req, res) => {
  return res.end();
});

app.listen(PORT, () => {
  console.log(`API started at port ${PORT}`);
});
