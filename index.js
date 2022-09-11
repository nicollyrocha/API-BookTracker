const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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

app.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM user_web');
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

app.listen(PORT, () => {
  console.log(`API started at port ${PORT}`);
});
