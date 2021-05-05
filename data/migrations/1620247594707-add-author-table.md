1. CREATE TABLE AUTHORS (id SERIAL PRIMARY KEY, name VARCHAR(255));
2. INSERT INTO authors(name) SELECT DISTINCT author FROM books;
3. ALTER TABLE books ADD COLUMN author_id INT;
4. UPDATE books SET author_id=author.id FROM (SELECT * FROM authors) AS  author WHERE books.author = author.name;
5. ALTER TABLE books DROP COLUMN author;
6. ALTER TABLE books ADD CONSTRAINT fk_authors FOREIGN KEY (author_id) REFERENCES authors(id);