CREATE TABLE IF NOT EXISTS noticias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  resumo TEXT,
  autor VARCHAR(255),
  data_noticia DATETIME,
  noticia TEXT
);