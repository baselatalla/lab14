'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');

const PORT = process.env.PORT || 3000;
const server = express();

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
const methodOverride = require('method-override');
server.set('view engine','ejs');

server.use(express.urlencoded({extended:true}));
server.use(express.static(__dirname + '/public'));
server.use(methodOverride('_method'));

server.get('/', homehandler);
server.get('/hello',(req,res)=>{
  res.render('pages/index');
});

server.get('/searches/new', (req,res)=>{ res.render('pages/searches/new');});
server.post('/searches', searchHandler);
server.post('/books', addHandler);
server.get('/bookDetail/:bookID', getOnebookDetails);
server.put('/updateBook/:bookID', updateBookHandler);
server.delete('/deleteBook/:bookID', deleteBookHandler);

function searchHandler(req,res){
  let searchValue = req.body.search;
  let term = req.body.searchBy;
  let googleBookURL = `https://www.googleapis.com/books/v1/volumes?q=search+${term}:${searchValue}`;
  superagent.get(googleBookURL)
    .then((booksData)=>{
      let bookslist = booksData.body.items.map((Element)=> new BooksData(Element));
      res.render('pages/searches/show', {bookslistArr: bookslist });
    }).catch (error=>{
      console.log(error);
      res.render('pages/error');
    });

}

function addHandler(req,res){
  let SQL1 = `INSERT INTO books (authors,title,isbn,image,description) VALUES($1,$2,$3,$4,$5) RETURNING *;`;
  let safevalues = [req.body.authors, req.body.title, req.body.isbn, req.body.image, req.body.description];
  client.query(SQL1, safevalues)
    .then(result => {
      res.redirect(`/bookDetail/${result.rows[0].id}`);
    });
}

function getOnebookDetails(req,res){
  let bookId = req.params.bookID;
  let SQL = `SELECT * FROM books WHERE id=$1;`;
  let safeValue = [bookId];
  client.query(SQL,safeValue)
    .then(result=>{
      res.render('pages/books/show',{book:result.rows[0]});
    });
}



function BooksData(data){
  this.title = data.volumeInfo.title || '* not available*';
  this.authors = data.volumeInfo.authors || '* not available*';
  if(data.volumeInfo.description ) {
    this.description = data.volumeInfo.description;}else{
    this.description = '*The description is not available*';}
  if (data.volumeInfo.imageLinks.thumbnail){
    this.image = data.volumeInfo.imageLinks.thumbnail;}else{
    this.image = `https://i.imgur.com/J5LVHEL.jpg`;}
  if(data.volumeInfo.industryIdentifiers.length ){
    this.isbn = data.volumeInfo.industryIdentifiers[0].identifier;}else{
    this.isbn = 'NOT available';}

}


function updateBookHandler(req,res){
  let {authors,title,isbn,image,description} = req.body;
  let SQL = `UPDATE books SET authors=$1,title=$2,isbn=$3,image=$4,description=$5 WHERE id=$6;`;
  let safeValues = [authors,title,isbn,image,description,req.params.bookID];
  console.log(req.params.bookID);
  client.query(SQL,safeValues)
    .then(()=>{
      res.redirect(`/bookDetail/${req.params.bookID}`);
    });
}

function deleteBookHandler(req,res){
  let SQL=`DELETE FROM books WHERE id=$1;`;
  let value=[req.params.bookID];
  client.query(SQL,value)
    .then(()=>{
      res.redirect('/');
    });
}

function homehandler(req,res){
  let SQL=`SELECT * FROM books `;
  client.query(SQL)
    .then(result => {
      res.render('pages/index', { book: result.rows });
    });
}
server.get('*',(req,res)=>{
  res.render('pages/error');
});

client.connect()
  .then(() => {
    server.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
  });

