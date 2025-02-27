const { FileSystemManager } = require("./file_system_manager");
const { dbService } = require("./database.service");
const DB_CONSTS = require("../utils/env");
const path = require("path");
const { randomUUID } = require("crypto");
const fs = require("fs");

class PlaylistService {
  constructor () {
    this.JSON_PATH = path.join(__dirname + "../../data/playlists.json");
    this.fileSystemManager = new FileSystemManager();
    this.dbService = dbService;
  }

  get collection () {
    return this.dbService.db.collection(DB_CONSTS.DB_COLLECTION_PLAYLISTS);
  }

  /**
   * TODO : Implémenter la récupération de toutes les playlists
   * Retourne toutes les playlists disponibles
   * @returns {Promise<Array>} la liste de toutes les playlists
   */
  async getAllPlaylists () {
    return await this.collection.find({}).toArray();
  }

  /**
   * TODO : Implémenter la récupération d'une playlist en fonction de son id
   * Retourne une playlist en fonction de son id
   * @param {string} id
   * @returns Retourne la playlist en fonction de son id
   */
  async getPlaylistById (id) {
    const playlists = await this.getAllPlaylists();
    if (playlists.find((playlist) => playlist.id === id)) {
      return playlists.find((playlist) => playlist.id === id);
    } else {
      return null;
    }
  }

  /**
   * TODO : Implémenter l'ajout d'une nouvelle playlist
   * Ajoute une playlist dans le fichier de toutes les playlists
   * @param {Object} playlist nouvelle playlist à ajouter
   * @returns retourne la playlist ajoutée
   */
  async addPlaylist (playlist) {
    playlist.id = randomUUID();
    await this.savePlaylistThumbnail(playlist);
    await this.collection.insertOne(playlist);
    return playlist;
  }

  /**
   * TODO : Implémenter la mise à jour d'une playlit existante
   * Modifie une playlist en fonction de son id et met à jour le fichier de toutes les playlists
   * @param {Object} playlist nouveau contenu de la playlist
   */
  async updatePlaylist (playlist) {
    delete playlist._id; // _id est immutable
    await this.savePlaylistThumbnail(playlist);
    const newID = { "id": playlist.id };
    const setQuery = { $set: { "name": playlist.name, "description": playlist.description, "songs": playlist.songs } };
    return await this.collection.updateOne(newID, setQuery);
  }

  /**
   * Extrait le type d'image d'une notation base64 d'une image
   * @param {string} picture image représentée sous le format base64
   * @returns {string} le type de l'image
   */
  async chooseProperEncoding (picture) {
    if (picture.startsWith("data:image/jpeg;base64,")) {
      return "jpeg";
    } else if (picture.startsWith("data:image/png;base64,")) {
      return "png";
    } else if (picture.startsWith("data:image/bmp;base64,")) {
      return "bmp";
    } else if (picture.startsWith("data:image/jpg;base64,")) {
      return "jpg";
    } else {
      throw new Error("Invalid image format");
    }
  }

  /**
   * @param {string} id identifiant de la playlist
   * @returns {Promise<boolean>} true si la playlist a été supprimée, false sinon
   */
  async deletePlaylist (id) {
    const res = await this.collection.findOneAndDelete({ id });
    if (res.value) {
      const tnail = res.value.thumbnail;
      await this.deletePlaylistThumbnail(tnail);
    }
    return res.value !== null;
  }

  /**
   * Supprime un fichier sur disque
   * @param {string} filePath chemin vers le fichier à supprimer
   * @returns {Promise<void>} une promesse avec 'undefined' en cas de réussite
   */
  async deletePlaylistThumbnail (filePath) {
    return fs.promises.unlink(filePath);
  }

  /**
   * Sauvegarde l'image de prévisualisation d'une playlist sur disque
   * @param {Object} playlist playlist pour laquelle sauvegarder l'image
   */
  async savePlaylistThumbnail (playlist) {
    const fileFormat = await this.chooseProperEncoding(playlist.thumbnail);
    const thumbnailData = playlist.thumbnail.replace(`data:image/${fileFormat};base64,`, "");
    const thumbnailFileName = `assets/img/${playlist.id}.${fileFormat}`;
    const filePath = path.join(__dirname + `../../assets/img/${playlist.id}.${fileFormat}`);
    await fs.promises.writeFile(filePath, thumbnailData, { encoding: "base64" });
    playlist.thumbnail = thumbnailFileName;
  }

  /**
   * TODO : Implémenter la recherche pour les 3 champs des playlists. Astuce : utilisez l'opérateur '$or' de MongoDB
   *
   * Cherche et retourne les playlists qui ont un mot clé spécifique dans leur description (name, description)
   * Si le paramètre 'exact' est TRUE, la recherche est sensible à la case
   * en utilisant l'option "i" dans la recherche par expression régulière
   * @param {string} substring mot clé à chercher
   * @param {boolean} exact si la recherche est sensible à la case
   * @returns toutes les playlists qui ont le mot clé cherché dans leur contenu (name, description)
   */
  async search (substring, exact) {
    if (exact) {
      const filter = {
        "$or": [{ name: { $regex: `${substring}` } }, { description: { $regex: `${substring}` } }]
      };
      return await this.collection.find(filter).toArray();
    } else {
      const filter = {
        "$or": [{ name: { $regex: `${substring}` } }, { description: { $regex: `${substring}` } }]
      };
      return await this.collection.find(filter).toArray();
    }
  }

  async populateDb () {
    const playlists = JSON.parse(await this.fileSystemManager.readFile(this.JSON_PATH)).playlists;
    await this.dbService.populateDb(DB_CONSTS.DB_COLLECTION_PLAYLISTS, playlists);
  }
}
module.exports = { PlaylistService };
