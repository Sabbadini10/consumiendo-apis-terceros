const path = require("path");
const db = require("../database/models");
const sequelize = db.sequelize;
const { Op} = require("sequelize");
const moment = require("moment");
const fetch = require("node-fetch");


//Aqui tienen otra forma de llamar a cada uno de los modelos
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;
const API = "http://www.omdbapi.com/?apikey=d4e35e92";

const moviesController = {
  list: (req, res) => {
    db.Movie.findAll({
      include: ["genre"],
    }).then((movies) => {
      res.render("moviesList.ejs", { movies });
    });
  },
  detail: (req, res) => {
    db.Movie.findByPk(req.params.id, {
      include: ["genre"],
    }).then((movie) => {
      res.render("moviesDetail.ejs", { movie });
    });
  },
  new: (req, res) => {
    db.Movie.findAll({
      order: [["release_date", "DESC"]],
      limit: 5,
    }).then((movies) => {
      res.render("newestMovies", { movies });
    });
  },
  recomended: (req, res) => {
    db.Movie.findAll({
      include: ["genre"],
      where: {
        rating: { [db.Sequelize.Op.gte]: 8 },
      },
      order: [["rating", "DESC"]],
    }).then((movies) => {
      res.render("recommendedMovies.ejs", { movies });
    });
  },
  //Aqui debo modificar para crear la funcionalidad requerida
  buscar: async (req, res) => {
    const { titulo } = req.query;
    const urlBase = "https://www.omdbapi.com/";
    const api_Key = process.env.apiKey;
   
    try {

  let movie = await db.Movie.findOne({ 
    where : {
    title :
  {[Op.substring] : titulo}
  }
})
if(!movie) {
let search = await fetch(`${urlBase}?apiKey=${api_Key}&t=${titulo}`);
movie = await search.json();

const {Title, Year, Awards, Runtime, imdbRating} = movie

let awardsArray = Awards.split(' ');
let awardsFilter = awardsArray.filter(char => !isNaN(char))
let awardsTotal = awardsFilter.reduce((acum, num) => parseInt(acum) + parseInt(num))


movie = await db.Movie.create({ 
  title : Title,
  release_date : moment(Year).format("YYYY"),
  awards: +awardsTotal,
  rating: imdbRating,
  length: parseInt(Runtime)
})

} else {
  const {title, release_date, length, awards, rating} = movie
  
  movie = {
    Title : title,
    Poster : movie.Poster ? movie.Poster : "http://localhost:3001/img/perfil-stewie.jpg",
    Year : moment(release_date).format('YYYY'),
    Awards : awards,
    Runtime: length,
    imdbRating: rating
  }
}

      return res.render("moviesDetailOmdb", {
      movie,
      });
    } catch (error) {
      console.log(error)
      res.send(error);
    }

  },
  //Aqui dispongo las rutas para trabajar con el CRUD
  add: function (req, res) {
    let promGenres = Genres.findAll();
    let promActors = Actors.findAll();

    Promise.all([promGenres, promActors])
      .then(([allGenres, allActors]) => {
        return res.render(path.resolve(__dirname, "..", "views", "moviesAdd"), {
          allGenres,
          allActors,
        });
      })
      .catch((error) => res.send(error));
  },
  create: function (req, res) {
    Movies
        .create(
            {
                title: req.body.title,
                rating: req.body.rating,
                awards: req.body.awards,
                release_date: req.body.release_date,
                length: req.body.length,
                genre_id: req.body.genre_id
            }
        )
        .then(() => {
            return res.redirect('/movies')
        })
        .catch(error => res.send(error))
},
  edit: function (req, res) {
    let movieId = req.params.id;
    let promMovies = Movies.findByPk(movieId, { include: ["genre", "actors"] });
    let promGenres = Genres.findAll();
    let promActors = Actors.findAll();
    Promise.all([promMovies, promGenres, promActors])
      .then(([Movie, allGenres, allActors]) => {
        Movie.release_date = moment(Movie.release_date).format("L");
        return res.render(
          path.resolve(__dirname, "..", "views", "moviesEdit"),
          { Movie, allGenres, allActors }
        );
      })
      .catch((error) => res.send(error));
  },
  update: function (req, res) {
    let movieId = req.params.id;
    Movies
        .update(
            {
                title: title && req.body.title,
                rating: rating && req.body.rating,
                awards: awards && req.body.awards,
                release_date: release_date && req.body.release_date,
                length: length && req.body.length,
                genre_id: genre_id && req.body.genre_id
            },
            {
                where: { id: movieId }
            })
        .then(() => {
            return res.redirect('/movies',)
        })
        .catch(error => res.send(error))
},
  delete: function (req, res) {
    let movieId = req.params.id;
    Movies.findByPk(movieId)
      .then((Movie) => {
        return res.render(
          path.resolve(__dirname, "..", "views", "moviesDelete"),
          { Movie }
        );
      })
      .catch((error) => res.send(error));
  },
  destroy: function (req, res) {
    let movieId = req.params.id;
    Movies.destroy({ where: { id: movieId }, force: true }) // force: true es para asegurar que se ejecute la acción
      .then(() => {
        return res.redirect("/movies");
      })
      .catch((error) => res.send(error));
  },
};

module.exports = moviesController;
