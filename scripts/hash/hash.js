const bcrypt = require('bcrypt');
const saltRounds = 11;

const plainPassword = process.argv[2]
const hash = bcrypt.hashSync(plainPassword, saltRounds);

console.log(hash)