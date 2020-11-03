const cheerio = require("cheerio");
const { httpGet, removeBlankToSpace } = require("./api");

class Douban {
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
    const searchUrl =
      `https://search.douban.com/music/subject_search?search_text=` +
      encodeURIComponent(`${this.artist} ${this.album}`);
    console.log("searchUrl", searchUrl);
    const pageData = await this.extractPageData(searchUrl);
    return pageData.simliarAlbums;
  }

  async extractPageData(url) {
    const apiURL =
      "https://api.douban.com/v2/music/search?q=" +
      encodeURIComponent(`${this.artist} ${this.album}`);
    const searchReult = await httpGet(apiURL);

    function safeCompare(v1, v2) {
      return (
        v1
          .replace(new RegExp(String.fromCharCode(160), "g"), " ")
          .indexOf(v2.replace(new RegExp(String.fromCharCode(160), "g"), " ")) >
        -1
      );
    }
    let simliarAlbums = [];
    let netPageUrl = null;
    let albumMeta = null;
    if (searchReult.count) {
      searchReult.musics = searchReult.musics.filter((_) => {
        _.attrs.singer = _.attrs.singer.map((c) =>
          c.replace(new RegExp(String.fromCharCode(160), "g"), " ")
        );
        if (
          safeCompare(_.title, this.album) &&
          _.attrs.singer.indexOf(this.artist) > -1
        ) {
          return true;
        }
        console.log({
          title: _.title,
          ceck: _.title
            .toLocaleLowerCase()
            .replace(new RegExp(String.fromCharCode(160), "g"), " ")
            .indexOf(
              this.album
                .toLocaleLowerCase()
                .replace(new RegExp(String.fromCharCode(160), "g"), " ")
            ),
          ac: _.attrs.singer.indexOf(this.artist),
          singer: _.attrs.singer,
        });
        return false;
      });

      if (searchReult.musics.length) {
        albumMeta = searchReult.musics[0];
        netPageUrl = albumMeta.alt;
        // albumMeta =
      }
    }

    if (netPageUrl == null) {
      return {
        simliarAlbums,
      };
    }

    // console.log(
    //   searchReult,
    //   "searchReult",
    //   this.album,
    //   this.artist,
    //   netPageUrl
    // );
    const pageHtml = await httpGet(netPageUrl);
    const $ = cheerio.load(pageHtml);
    const simDoms = $("#db-rec-section .subject-rec-list");

    for (let index = 0; index < simDoms.length; index++) {
      const simDom = simDoms.eq(index);
      simliarAlbums.push({
        cover: simDom.find(".m_sub_img").attr("src"),
        // artist: simDom.find(".similar-albums-item-artist").text(),
        album: simDom.find("dd").text(),
        album_id: simDom.find("dd a").attr("href"),
        // listeners: simDom.find(".similar-albums-item-listeners").text(),
      });
    }

    let currentAlbum = null;
    currentAlbum = {
      type: "douban",
      album: this.album,
      artist: this.artist,
      rating: albumMeta.rating,
      tags: albumMeta.tags,
      attr: albumMeta.attrs,
      detail: netPageUrl,
    };
    simliarAlbums = simliarAlbums.map((_) => {
      _.rec_by = currentAlbum;
      _.album = _.album && _.album.trim();
      _.album = removeBlankToSpace(_.album);
      _.album_id = _.album_id && _.album_id.split("/")[4];
      _.type = "douban";
      return _;
    });

    console.log(
      simliarAlbums,
      albumMeta,
      $(".similar-albums-item-wrap").length
    );
    return {
      simliarAlbums,
    };
  }

  async getSimliarAlbumsByArtist() {
    return [];
  }
}



export default Douban