const express = require('express');
const routes = express.Router();

let db = [
  { 1: { Nome: 'Cliente 1', Idade: '20' } },
  { 2: { Nome: 'Cliente 2', Idade: '20' } },
  { 3: { Nome: 'Cliente 3', Idade: '20' } },
];

routes.get('/', (req, res) => {
  return res.json(db);
});

routes.get('/livros', (req, res) => {
  return res.json(db);
});

routes.post('/add', (req, res) => {
  const body = req.body;

  if (!body) {
    return res.status(400).end();
  }

  db.push(body);
  return res.json(body);
});

const CarsController = require('../src/controllers/teste');

routes.get('/cars', CarsController.all);
routes.post('/cars', CarsController.create);

const Cars = require('../src/controllers/teste');

routes.get('/cars', Cars.all);

routes.delete('/delete/:id', (req, res) => {
  const id = req.params.id;

  let newDb = db.filter((item) => {
    if (!item[id]) return id;
  });

  db = newDb;

  return res.send(newDb);
});

module.exports = routes;
