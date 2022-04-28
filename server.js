import express from "express";
import articleRoutes from './routes/articleRoutes.mjs';
import ejs from 'ejs';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('views'));
app.use(express.urlencoded({extended: true}));

app.listen(5000, (req, res) => {
    console.log('Listening for incoming request...');
});

app.get('/', (req, res) => {
    res.status(200).render('index');
});

app.use('/article', articleRoutes);

app.get('*', (req, res) => {
    res.status(404).render('404');
})