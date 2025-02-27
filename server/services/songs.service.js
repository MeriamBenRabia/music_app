const { FileSystemManager } = require("./file_system_manager");
const { dbService } = require("./database.service");
const DB_CONSTS = require("../utils/env");

const path = require("path");

class SongService {
  constructor () {
    this.JSON_PATH = path.join(__dirname + "../../data/songs.json");
    this.fileSystemManager = new FileSystemManager();
    this.dbService = dbService;
  }

  get collection () {
    return this.dbService.db.collection(DB_CONSTS.DB_COLLECTION_SONGS);
  }

  /**
   * TODO : Implémenter la récupération de toutes les chansons
   *
   * Retourne la liste de toutes les chansons
   * @returns {Promise<Array>}
   */
  async getAllSongs () {
    return await this.collection.find({}).toArray();
  }

  /**
   * TODO : Implémenter la récupération d'une chanson en fonction de son id
   *
   * Retourne une chanson en fonction de son id
   * @param {number} id identifiant de la chanson
   * @returns chanson correspondant à l'id
   */
  async getSongById (id) {
    const songs = await this.getAllSongs();
    return songs.find((song) => song.id === id);
  }

  /**
   * TODO : Implémenter l'inversement de l'état aimé d'une chanson
   *
   * Modifie l'état aimé d'une chanson par l'état inverse
   * @param {number} id identifiant de la chanson
   * @returns {boolean} le nouveau état aimé de la chanson
   */
  async updateSongLike (id) {
    const wantedSong = await this.getSongById(id);
    const songId = { "id": parseInt(wantedSong.id, 10) };
    const setQuery = { $set: { "liked": !(wantedSong.liked) } };
    await this.collection.updateMany(songId, setQuery);
    return await wantedSong.liked;
  }

  /**
   * TODO : Implémenter la recherche pour les 3 champs des chansons. Astuce : utilisez l'opérateur '$or' de MongoDB
   *
   * Cherche et retourne les chansons qui ont un mot clé spécifique dans leur description (name, artist, genre)
   * Si le paramètre 'exact' est TRUE, la recherche est sensible à la case
   * en utilisant l'option "i" dans la recherche par expression régulière
   * @param {string} substring mot clé à chercher
   * @param {boolean} exact si la recherche est sensible à la case
   * @returns toutes les chansons qui ont le mot clé cherché dans leur contenu (name, artist, genre)
   */
  async search (substring, exact) {
    if (exact) {
      const filter = {
        "$or": [{ name: { $regex: `${substring}` } }, { artist: { $regex: `${substring}` } }, { genre: { $regex: `${substring}` } }]
      };
      return await this.collection.find(filter).toArray();
    } else {
      const filter = {
        "$or": [{ name: { $regex: `${substring}`, $options: "i" } }, { artist: { $regex: `${substring}`, $options: "i" } }, { genre: { $regex: `${substring}`, $options: "i" } }]
      };
      return await this.collection.find(filter).toArray();
    }
  }

  async populateDb () {
    const songs = JSON.parse(await this.fileSystemManager.readFile(this.JSON_PATH)).songs;
    await this.dbService.populateDb(DB_CONSTS.DB_COLLECTION_SONGS, songs);
  }
}

module.exports = { SongService };
