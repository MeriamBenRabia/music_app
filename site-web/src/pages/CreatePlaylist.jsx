import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SERVER_URL } from "../assets/js/consts";
import PlaylistContext from "../contexts/PlaylistContext";

export default function CreatePlaylist() {
  const api = useContext(PlaylistContext).api;
  const params = useParams();
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [addedSongs, setAddedSongs] = useState([""]);
  const [data, setData] = useState({
    name: "",
    description: "",
    songs: [],
    thumbnail: "",
  });
  const [preview, setPreview] = useState("");
  const imageInputRef = useRef(null);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    api.getAllSongs().then((songs) => {
      setSongs(songs);
      if (params.id) {
        api.getPlaylistById(params.id).then((playlist) => {
          const songsInPlaylist = playlist.songs.map((song) => getNameFromId(song.id, songs));
          setAddedSongs(songsInPlaylist);
          setPreview(`${SERVER_URL}/${playlist.thumbnail}`);
          setData(playlist);
          loadForEdit(playlist);
        });
      }
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!data.name || !data.description || !data.thumbnail) return;
    // TODO : envoyer la bonne requête pour ajouter ou modifier une playlist en fonction de l'attribut params.id
    if (params.id) {
      await api.updatePlaylist({...data, id: params.id});
    } else {
      await api.addNewPlaylist({...data, id: params.id});
    }
    navigate("/index");
  };

  const addItemSelect = (event) => {
    event.preventDefault();
    setAddedSongs([...addedSongs, ""]);
  };

  const removeItemSelect = (event, index) => {
    event.preventDefault();
    const newArr = [...addedSongs];
    newArr.splice(index, 1);
    setAddedSongs(newArr);
    const allSongs = newArr.map((song) => {
      const id = getIdFromName(song);
      if (id !== -1) return { id };
    });
    setData({ ...data, songs: allSongs });
  };

  const getIdFromName = (elementName) => {
    const element = songs.find((element) => element.name === elementName);
    const id = element ? element.id : -1;
    return id;
  };

  const getNameFromId = (elementId, songs) => {
    const song = songs.find((song) => song.id === elementId);
    const name = song ? song.name : "";
    return name;
  };

  const getImageInput = async (input, reader = new FileReader()) => {
    if (input && input.files && input.files[0]) {
      const image = await new Promise((resolve) => {
        reader.onload = (e) => resolve(reader.result);
        reader.readAsDataURL(input.files[0]);
      });
      return image;
    }
  };

  const handleChangeInput = (event, index) => {
    const newSongChoises = addedSongs;
    newSongChoises[index] = event.target.value;
    setAddedSongs(newSongChoises);
    const allSongs = addedSongs
      .map((song) => {
        const id = getIdFromName(song);
        if (id !== -1) return { id };
      })
      .filter((x) => x !== undefined);
    setData({ ...data, songs: allSongs });
  };

  // TODO : Gérer le changement de nom
  const handleNameChange = (event) => {
    setData({ ...data, name: event.target.value});
  };

  // TODO : Gérer le changement de description
  const handleDescriptionChange = (event) => {
    setData({...data, description: event.target.value});
  };

  const handleFileChange = async (event) => {
    setPreview(URL.createObjectURL(event.target.files[0]));
    const image = await getImageInput(event.target);
    setData({ ...data, thumbnail: image });
  };

  // TODO : Envoyer une requête de supression au serveur et naviguer vers la page principale
  const deletePlaylist = async (id) => {
    await api.deletePlaylist(params.id);
    navigate("/index");
  };

  const loadForEdit = async (playlist) => {
    const blob = await (await fetch(`${SERVER_URL}/${playlist.thumbnail}`)).blob();
    const dataTransfer = new DataTransfer();
    const file = new File([blob], `${playlist.thumbnail}`, {
      type: blob.type,
    });
    dataTransfer.items.add(file);
    const fileInput = imageInputRef.current;
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
  };

  return (
    <main id="main-area" className="flex-row">
      <form className="form-group" id="playlist-form">
        <div id="general-info" className="flex-row">
          <fieldset className="form-control">
            <legend>Informations générales</legend>
            <div className="form-control flex-row">
              <label htmlFor="name">Nom: </label>
              {/*TODO : lier au nom de la playlist */}
              <input
                type="text"
                id="name"
                placeholder="Playlist#1"
                value={data.name}
                required
                onChange={handleNameChange}
              />
            </div>
            <div className="form-control flex-row">
              <label htmlFor="description">Description: </label>
              {/*TODO : lier à la description de la playlist */}
              <input
                type="text"
                id="description"
                placeholder="Nouvelle playlist"
                value={data.description}
                required
                onChange={handleDescriptionChange}
              />
            </div>
            <div className="form-control flex-row">
              <label htmlFor="image">Image: </label>
              <input type="file" id="image" accept="image/*" onChange={handleFileChange} ref={imageInputRef} />
            </div>
          </fieldset>
          <img id="image-preview" width="200px" height="200px" alt="" src={preview} />
        </div>
        <fieldset className="form-control">
          <legend>Chansons</legend>
          {/*TODO : construire les choix de chansons dans des éléments <option> */}
          <datalist id="song-dataList">
          {songs?.map((song) => (
            <option key={(song.id)} value={song.name} />
          ))}
          </datalist>
          <button id="add-song-btn" className="fa fa-plus" onClick={addItemSelect}></button>
          <div id="song-list">
            {addedSongs.map((x, index) => (
              <div key={index}>
                <label htmlFor={`song-${index+3}`}>#{index + 1}</label>
                <input
                  className="song-input"
                  id={`song-${index+3}`}
                  type="select"
                  list="song-dataList"
                  value={x}
                  onChange={(e) => handleChangeInput(e, index)}
                  required
                />
                {index ? <button className="fa fa-minus" onClick={(e) => removeItemSelect(e, index)}></button> : <></>}
              </div>
            ))}
          </div>
        </fieldset>
        {/*TODO : afficher "Modifier la playlist" ou "Ajouter la playlist" en fonction de l'état du formulaire */}
        {!params.id ? (
        <input type="submit" value={"Ajouter la playlist"} onClick={handleSubmit} id="playlist-submit" />
        ) : 
        <input type="submit" value={"Modifier la playlist"} onClick={handleSubmit} id="playlist-submit" /> }
      </form>
      {params.id ? (
        <button
          className="fa fa-trash"
          id="playlist-delete"
          onClick={() => {
            deletePlaylist(params.id);
          }}
        ></button>
      ) : (
        <></>
      )}
    </main>
  );
}
