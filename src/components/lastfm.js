const cheerio = require("cheerio");
const { httpGet, removeBlankToSpace } = require("./api");


class LastFM {
  constructor(_artist, _album) {
    this.artist = _artist;
    this.album = _album;
  }

  async getSimliarAlbums() {
    if (this.album && this.artist) {
      return await this.getSimliarAlbumsByAlbum();
    }
    return await this.getSimliarAlbumsByArtist();
  }

  async getSimliarAlbumsByAlbum() {
    console.log("getSimliarAlbumsByAlbum");
    const pageURL = `https://www.last.fm/music/${this.artist}/${this.album}`
      .replace(new RegExp(String.fromCharCode(160), "g"), " ")
      .split(" ")
      .join("+");
    console.log("pageURL", pageURL);
    const pageData = await this.extractPageData(pageURL);
    return pageData.simliarAlbums;
  }

  async extractPageData(url) {
    const pageHtml = await httpGet(url);
    const $ = cheerio.load(pageHtml);
    const simDoms = $(".similar-albums-item-wrap");
    let simliarAlbums = [];
    for (let index = 0; index < simDoms.length; index++) {
      const simDom = simDoms.eq(index);
      simliarAlbums.push({
        cover: simDom.find(".similar-albums-item-image img").attr("src"),
        artist: simDom.find(".similar-albums-item-artist").text(),
        album: simDom.find(".similar-albums-item-name").text(),
        listeners: simDom.find(".similar-albums-item-listeners").text(),
      });
    }

    let currentAlbum = null;
    currentAlbum = {
      type: "lastfm",
      album: this.album,
      artist: this.artist,
      listeners: $(".header-metadata-tnew-item--listeners abbr").attr("title"),
      plays: $(".header-metadata-tnew-item--scrobbles abbr").attr("title"),
      tags: $(".tags-list--global li a")
        .map(function() {
          return {
            name: $(this).text(),
          };
        })
        .get(),
    };

    simliarAlbums = simliarAlbums.map((_) => {
      _.rec_by = currentAlbum;
      _.artist = _.artist && _.artist.trim();
      _.album = _.album && _.album.trim();
      _.type = "lastfm"
      _.listeners = parseInt(
        _.listeners
          .trim()
          .replace(" listeners", "")
          .replace(new RegExp(",", "g"), "")
      );
      return _;
    }).map(_ => {
      _.album = removeBlankToSpace(_.album);
      _.artist = removeBlankToSpace(_.artist);
      _.song = removeBlankToSpace(_.song);
      return _;
    });

    console.log(simliarAlbums, $(".similar-albums-item-wrap").length);
    return {
      simliarAlbums,
    };
  }

  async getSimliarAlbumsByArtist() {
    return [];
  }
}

export default LastFM