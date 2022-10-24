const knex = require('knex')({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING || 'local',
  searchPath: ['public'],
});

module.exports = knex;