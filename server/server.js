const express = require('express');
const db = require('./db');
const authRoutes = require('./routes/auth');

const app = express();

app.use(express.json());
app.use('/api', authRoutes); // all auth routes start with /api

const sessionRoutes = require('./routes/sessions'); // does something related to rammerhead...
app.use('/api', sessionRoutes);

app.get('/', (req, res) => {
    res.send('Phoenix server is running!');
});

app.listen(3000, () => {
    console.log('Phoenix is running on http://localhost:3000');
});
// The browser asks you something like "What's the correct password for Bob's account". This is a req
// You answer "Bob's password is i@1hwoQ83gl3brUh". That's a res. A code line would be like res.json('bob-password')
// How does server.js know to send Bob's password and not Rob's profile picture? That's called "routing", or basically instructions on what to do with each req
// The req could also be "Here, save Bob's cookie clicker data". A res (response) would be to save the data and respond "I did it"
// Think of port as like a house number. The browser goes to house 3000 and knocks on the door, asking for Bob's password.