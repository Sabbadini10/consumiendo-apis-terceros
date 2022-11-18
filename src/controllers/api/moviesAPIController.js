const path = require("path");
const db = require("../../database/models");
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require("moment");

//Aqui tienen otra forma de llamar a cada uno de los modelos
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;

const moviesAPIController = {
  list: (req, res) => {
    db.Movie.findAll({
      include: ["genre"],
    }).then((movies) => {
      let respuesta = {
        meta: {
          status: 200,
          total: movies.length,
          url: "api/movies",
        },
        data: movies,
      };
      res.json(respuesta);
    });
  },

  detail: (req, res) => {
    db.Movie.findByPk(req.params.id, {
      include: ["genre"],
    }).then((movie) => {
      let respuesta = {
        meta: {
          status: 200,
          total: movie.length,
          url: "/api/movie/:id",
        },
        data: movie,
      };
      res.json(respuesta);
    });
  },
  recomended: (req, res) => {
    db.Movie.findAll({
      include: ["genre"],
      where: {
        rating: { [db.Sequelize.Op.gte]: req.params.rating },
      },
      order: [["rating", "DESC"]],
    })
      .then((movies) => {
        let respuesta = {
          meta: {
            status: 200,
            total: movies.length,
            url: "api/movies/recomended/:rating",
          },
          data: movies,
        };
        res.json(respuesta);
      })
      .catch((error) => console.log(error));
  },
  create: async (req, res) => {
    try {
      const { title, rating, awards, release_date, length, genre_id } = req.body;
      const genre = await db.Genre.findAll();
      const movie = await db.Movie.create({
        title: title.trim(),
        rating: +rating,
        awards: +awards,
        release_date: moment(release_date).format("YYYY-MM-DD"),
        length: +length,
        genre_id: genre.forEach(genre => {
          genre.id   
        })
      });

      return res.status(201).json({
        ok: true,
        meta: {
          status: 200,
          total: movie.length,
          url: "api/movies/create",
        },
        msg: "Su pelicula se creo",
        data: movie,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        ok: false,
        errors: error.message,
      });
    }
  },
  update: async (req, res) => {
    const {title, rating, awards, release_date, length, genre_id } = req.body;
    //return res.send(req.body)
    try {
      let movie = await db.Movie.findByPk(req.params.id);
      movie.title = title?.trim() ? title : movie.title;
      movie.rating = rating ? rating : movie.rating;
      movie.awards = awards ? awards :  movie.awards;
      movie.release_date = release_date ? release_date : movie.release_date;
      movie.length = length ? length : movie.length;
      movie.genre_id = genre_id ? genre_id : movie.genre_id;

      await movie.save();

      return res.status(200).json({
        ok: true,
        meta: {
          status: 200,
          total: movie.length,
          url: "api/movies/update/:id",
        },
        msg: "Su pelicula se actualizo",
        data: {
          movie,
        },
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        ok: false,
        status: error.status,
        message: error.message,
      });
    }
  },
  destroy: async (req, res) => {

    try {
        let movieId = req.params.id;

       

        await Movies.destroy({
            where: {
                id: movieId
            },
            force: true// force: true es para asegurar que se ejecute la acción
        })

        return res.status(200).json({
            ok: true,
            meta: {
                status: 200,
                url: 'api/movies/delete/:id'
            },
            msg: "Pelicula eliminada con exito"
        })
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            status: error.status,
            message: error.message,
        })
    }
}
}

module.exports = moviesAPIController;
