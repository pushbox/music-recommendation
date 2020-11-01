// const axios = require("axios");
const _ = require("lodash");
// const fs = require("fs");
const cheerio = require("cheerio");
const moment = require("moment");
const PouchDB = require("pouchdb").default;
const { removeBlankToSpace } = require("./api");
import md5 from "js-md5";

import LastFM  from './lastfm'
import Douban  from "./douban.js"

PouchDB.plugin(require("pouchdb-find").default);
var dailyDb = new PouchDB("daily_albums");
// var trash = new PouchDB("trash-articles");
// const recentSongs = fs
//   .readFileSync("./list", "utf-8")
//   .split("\n")
//   .map(_ => _.split("\t"))
//   .map(_ => {
//     return {
//       song: _[0],
//       artist: _[1],
//       album: _[2]
//     };
//   });

function httpGet(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    console.log("window.$_musichelper", url);
    window.$_musichelper.httpGet({ url: url }, function(error, data) {
      //   console.log("window.$_musichelper", error, data);
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
    setTimeout(function() {
      reject("timeout");
    }, timeout);
  });
}

function getTop(typeFn, recentSongs) {
  const topAlbums = recentSongs.reduce((total, row) => {
    const key = typeFn(row);
    if (!total[key]) {
      total[key] = 1;
    } else {
      total[key]++;
    }
    return total;
  }, {});
  const ar = Object.keys(topAlbums).map(_ => {
    return {
      name: _,
      count: topAlbums[_]
    };
  });
  return _.sortBy(ar, "count").reverse();
}

// class LastFM {
//   constructor(_artist, _album) {
//     this.artist = _artist;
//     this.album = _album;
//   }

//   async getSimliarAlbums() {
//     if (this.album && this.artist) {
//       return await this.getSimliarAlbumsByAlbum();
//     }
//     return await this.getSimliarAlbumsByArtist();
//   }

//   async getSimliarAlbumsByAlbum() {
//     console.log("getSimliarAlbumsByAlbum");
//     const pageURL = `https://www.last.fm/music/${this.artist}/${this.album}`
//       .replace(new RegExp(String.fromCharCode(160), "g"), " ")
//       .split(" ")
//       .join("+");
//     console.log("pageURL", pageURL);
//     const pageData = await this.extractPageData(pageURL);
//     return pageData.simliarAlbums;
//   }

//   async extractPageData(url) {
//     const pageHtml = await httpGet(url);
//     const $ = cheerio.load(pageHtml);
//     const simDoms = $(".similar-albums-item-wrap");
//     let simliarAlbums = [];
//     for (let index = 0; index < simDoms.length; index++) {
//       const simDom = simDoms.eq(index);
//       simliarAlbums.push({
//         cover: simDom.find(".similar-albums-item-image img").attr("src"),
//         artist: simDom.find(".similar-albums-item-artist").text(),
//         album: simDom.find(".similar-albums-item-name").text(),
//         listeners: simDom.find(".similar-albums-item-listeners").text()
//       });
//     }

//     let currentAlbum = null;
//     currentAlbum = {
//       type: 'lastfm',
//       album: this.album,
//       artist: this.artist,
//       listeners: $(".header-metadata-tnew-item--listeners abbr").attr("title"),
//       plays: $(".header-metadata-tnew-item--scrobbles abbr").attr("title"),
//       tags: $(".tags-list--global li a")
//         .map(function() {
//           return {
//             name: $(this).text(),
//           };
//         })
//         .get()
//     };

//     simliarAlbums = simliarAlbums.map(_ => {
//       _.rec_by = currentAlbum;
//       _.artist = _.artist && _.artist.trim();
//       _.album = _.album && _.album.trim();
//       _.listeners = parseInt(
//         _.listeners
//           .trim()
//           .replace(" listeners", "")
//           .replace(new RegExp(",", "g"), "")
//       );
//       return _;
//     });

//     console.log(simliarAlbums, $(".similar-albums-item-wrap").length);
//     return {
//       simliarAlbums
//     };
//   }

//   async getSimliarAlbumsByArtist() {
//     return [];
//   }
// }

// class Douban {
//   constructor(_artist, _album) {
//     this.artist = _artist;
//     this.album = _album;
//   }

//   async getSimliarAlbums() {
//     if (this.album && this.artist) {
//       return await this.getSimliarAlbumsByAlbum();
//     }
//     return await this.getSimliarAlbumsByArtist();
//   }

//   async getSimliarAlbumsByAlbum() {
//     console.log("getSimliarAlbumsByAlbum");
//     const searchUrl =
//         `https://search.douban.com/music/subject_search?search_text=` +
//         encodeURIComponent(`${this.artist} ${this.album}`);
//     console.log("searchUrl", searchUrl);
//     const pageData = await this.extractPageData(searchUrl);
//     return pageData.simliarAlbums;
//   }

//   async extractPageData(url) {
//     const apiURL ="https://api.douban.com/v2/music/search?q=" +  encodeURIComponent(`${this.artist} ${this.album}`);
//     const searchReult = await httpGet(apiURL);

//     function safeCompare(v1, v2) {
//       return v1
//         .replace(new RegExp(String.fromCharCode(160), "g"), " ")
//         .indexOf(v2.replace(new RegExp(String.fromCharCode(160), "g"), " ")) > -1;
//     }
//     let simliarAlbums = [];
//     let netPageUrl = null
//     let albumMeta = null
//     if (searchReult.count) {
//       searchReult.musics = searchReult.musics.filter(_ => {
//         _.attrs.singer = _.attrs.singer.map(c =>
//           c.replace(new RegExp(String.fromCharCode(160), "g"), " ")
//         );
//         if (
//           safeCompare(_.title, this.album) &&
//           _.attrs.singer.indexOf(this.artist) > -1
//         ) {
//           return true;
//         }
//         console.log({
//           title: _.title,
//           ceck: _.title
//             .toLocaleLowerCase()
//             .replace(new RegExp(String.fromCharCode(160), "g"), " ")
//             .indexOf(
//               this.album
//                 .toLocaleLowerCase()
//                 .replace(new RegExp(String.fromCharCode(160), "g"), " ")
//             ),
//           ac: _.attrs.singer.indexOf(this.artist),
//           singer: _.attrs.singer,
//         });
//         return false
//       });

//       if(searchReult.musics.length) {
//         albumMeta = searchReult.musics[0];
//         netPageUrl = albumMeta.alt;
//         // albumMeta = 
//       }
//     } 

//     if (netPageUrl == null) {
//       return {
//         simliarAlbums,
//       };
//     }

//       // console.log(
//       //   searchReult,
//       //   "searchReult",
//       //   this.album,
//       //   this.artist,
//       //   netPageUrl
//       // );
//     const pageHtml = await httpGet(netPageUrl);
//     const $ = cheerio.load(pageHtml);
//     const simDoms = $("#db-rec-section .subject-rec-list");


//     for (let index = 0; index < simDoms.length; index++) {
//       const simDom = simDoms.eq(index);
//       simliarAlbums.push({
//         cover: simDom.find(".m_sub_img").attr("src"),
//         // artist: simDom.find(".similar-albums-item-artist").text(),
//         album: simDom.find("dd").text(),
//         album_id: simDom.find("dd a").attr('href'),
//         // listeners: simDom.find(".similar-albums-item-listeners").text(),
//       });
//     }

//     let currentAlbum = null;
//     currentAlbum = {
//       type: 'douban',
//       album: this.album,
//       artist: this.artist,
//       rating: albumMeta.rating,
//       tags: albumMeta.tags,
//       attr: albumMeta.attrs,
//     };
//     simliarAlbums = simliarAlbums.map((_) => {
//       _.rec_by = currentAlbum;
//       _.album = _.album && _.album.trim();
//       _.album_id = _.album_id && _.album_id.split("/")[4];
//       // _.type = "dou"
//       return _;
//     });

//     console.log(simliarAlbums, albumMeta, $(".similar-albums-item-wrap").length);
//     return {
//       simliarAlbums,
//     };
//   }

//   async getSimliarAlbumsByArtist() {
//     return [];
//   }
// }


async function getSimliarAlbumsByPlatform(type, topAlbums, conCount) {
  let totalAlbums = []
  const stepItems = chunk(topAlbums, conCount);
  console.log(
    "stepItems",
    stepItems,
    "getSimliarAlbumsByPlatform",
    type, conCount
  );
  for (let index = 0; index < stepItems.length; index++) {
    const stepAlbums = stepItems[index];
    try {
      const results = await Promise.all(
        stepAlbums.map((al) => {
          const driver = type == 'lastfm' ? new LastFM(al.artist, al.album) : new Douban(al.artist, al.album); 
          return driver.getSimliarAlbums();
        })
      );
      // const albums = await type.getSimliarAlbums();
      // if (albums.length) {
      //   allAlbums = allAlbums.concat(albums);
      // }
      results.forEach((_) => {
        if (_.length) {
          totalAlbums = totalAlbums.concat(_);
        }
      });
    } catch (e) {
      console.log('run.error', e)
    }
    console.log("step", index, "done", stepItems.length, stepAlbums);
  }
  return totalAlbums;
}

async function getSimliarAlbums(albums) {
  const types = [
    {
      type: "lastfm",
    },
    {
      type: "douban",
      count: 1
    },
  ];
  let totalAlbums = [];
  try {
      const results = await Promise.all(
        types.map((_) => {
          const cCount = _.count || 5;
          return getSimliarAlbumsByPlatform(_.type, albums, cCount);
        })
      );
      results.forEach((_, index) => {
        if (_.length) {
          totalAlbums = totalAlbums.concat(_);
          console.log("found.album", _.length, types[index]);
        }
      });
  } catch (e) {}
 
  console.log("getSimliarAlbums.totalAlbums", totalAlbums.length, totalAlbums);
  return totalAlbums;
}

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

export async function getAlbums(recentSongs, opts = {}) {
  const songhash = md5(JSON.stringify(recentSongs));
  console.log(topAlbums, topArtists);
  let totalAlbums = [];
  const topAlbums = getTop(i => {
    return [i.album, i.artist].join("==");
  }, recentSongs).map(_ => {
    return {
      artist: _.name.split("==")[1],
      album: _.name.split("==")[0]
    };
  });
  const topArtists = getTop(i => {
    return [i.artist].join("==");
  }, recentSongs);

  const todyStr = moment().format("YYYYMMDD");
  const docId = `${todyStr}_albums_v2`;
  const force = opts.force || false;
  let uniqueAlbums = [];
  let startTime = Date.now();
  let conCount = 1;
  let caceDoc = null;
  try {
    caceDoc = await dailyDb.get(docId);
  } catch (e) {}

  console.log(
    "caceDoc.songhash",
    caceDoc && caceDoc.songhash,
    songhash,
    topAlbums
  );
  if (
    caceDoc == null ||
    (caceDoc != null && caceDoc.albums.length == 0) ||
    (caceDoc != null && !caceDoc.songhash) ||
    (caceDoc != null && caceDoc.songhash && caceDoc.songhash != songhash) ||
    force
  ) {
    // const stepItems = chunk(topAlbums, conCount);
    // console.log("stepItems", stepItems);
    // for (let index = 0; index < stepItems.length; index++) {
    //   const stepAlbums = stepItems[index];
    //   try {
    //     const results = await Promise.all(
    //       stepAlbums.map(al => {
    //         return getSimliarAlbums(al);
    //       })
    //     );
    //     results.forEach(_ => {
    //       if (_.length) {
    //         totalAlbums = totalAlbums.concat(_);
    //       }
    //     });
    //   } catch (e) {}
    //   // const p = [];
    //   // for (let c = 0; c < stepAlbums.length; c++) {
    //   //   const topAlbum = topAlbums[c];
    //   //   p.push(getSimliarAlbums(topAlbum));
    //   // }
    //   // try {
    //   //   const results = await Promise.all(p);
    //   //   results.forEach(_ => {
    //   //     if (_.length) {
    //   //       totalAlbums = totalAlbums.concat(_);
    //   //     }
    //   //   });
    //   //   console.log(results);
    //   // } catch (e) {}
    //   // break;
    //   // console.log("step", index, "done", stepItems.length, stepAlbums);
    // }
    // return []
    totalAlbums = await getSimliarAlbums(topAlbums);
    const byImages = _.groupBy(totalAlbums, "cover");
    uniqueAlbums = Object.keys(byImages).map((_) => {
      byImages[_][0].repeatCount = byImages[_].length;
      return byImages[_][0];
    });
    console.log("uniqueAlbums", uniqueAlbums.length);
    var doc = {
      _id: docId,
      albums: uniqueAlbums,
      songhash: songhash,
      updateTime: Date.now(),
    };
    if (caceDoc == null) {
      var res = await dailyDb.put(doc);
    } else {
      console.log("save", doc);
      await dailyDb.get(caceDoc._id).then(function(doc) {
        const saveDoc = Object.assign({
          _id: caceDoc._id,
          _rev: doc._rev,
          albums: uniqueAlbums,
          songhash: songhash,
        });
        console.log("saveDoc", saveDoc);
        return dailyDb.put(saveDoc);
      });
    }
  } else {
    uniqueAlbums = caceDoc.albums;
  }
  const spend = Date.now() - startTime;
  console.log(uniqueAlbums, uniqueAlbums.length, spend);
  return uniqueAlbums;
}

export async function getXiamiCollect() {
  try {
    const recentSongs = await httpGet(
      "https://emumo.xiami.com/playersong/getgradesong?_ksTS=1604148909907_835"
    );
    if (recentSongs.status === false) {
      throw new Error("not login");
    }
    const allSongs = recentSongs.data.songs.map(_ => {
      return {
        type: "xiami",
        album: removeBlankToSpace(_.album_name),
        artist: removeBlankToSpace(_.artist_name),
        song: removeBlankToSpace(_.name),
      };
    });
    return allSongs;
  } catch (e) {}
  return [];
}

export async function getCloudMusicCollect() {
  try {
    return await _getCloudMusicCollect();
  } catch (e) {
    console.log("cloud failed", e);
  }
  return [];
}

export async function _getCloudMusicCollect() {
  const pagetml = await httpGet("https://music.163.com");
  const data = pagetml.substring(
    pagetml.indexOf("var GUser="),
    pagetml.indexOf(`};`, pagetml.indexOf("var GUser="))
  );

  console.log("data", data);
  if (data.indexOf("userId") == -1) {
    console.log("not login");
    throw new Error("not login");
  }
  // new Function(
  //   "window.wx = {}; window.handlerNickname = function(){};" +
  //     code +
  //     "; return window.wx;"
  // )();
  const userData = new Function(
    "window.wx = {}; window.handlerNickname = function(){};" +
      data +
      "}; return GUser;"
  )();

  const userHomeUrl = `https://music.163.com/user/home?id=${userData.userId}`;
  // new Function(`${data} } return GUser;`);
  // const userHomeHtml = await httpGet(userHomeUrl);
  const homePage = await new Promise((resolve, reject) => {
    window.$_musichelper.getPage(
      {
        url: userHomeUrl,
        wait: 5000,
        code:
          'document.getElementById("g_iframe").contentWindow.document.body.innerHTML'
      },
      function(er, data) {
        // console.log(er, data);
        resolve(data[0]);
      }
    );
  });

  const $ = cheerio.load(homePage);
  const payList = $("#cBox li").eq(0);
  const playListUrl = "https://music.163.com" + payList.find("a").attr("href");

  const playListHtml = await new Promise((resolve, reject) => {
    window.$_musichelper.getPage(
      {
        url: playListUrl,
        wait: 12 * 1000,
        code:
          'document.getElementById("g_iframe").contentWindow.document.getElementsByClassName("m-table")[0].outerHTML'
      },
      function(er, data) {
        // console.log(er, data);
        resolve(data[0]);
      }
    );
  });
  const $$ = cheerio.load(playListHtml);

  const rows = $$("tr")
    .map(function() {
      const obj = $(this);
      return {
        type: "cloudmusic",
        song: obj
          .find("td")
          .eq(1)
          .find("b")
          .attr("title"),
        artist: obj
          .find("td")
          .eq(3)
          .find("span")
          .attr("title"),
        album: obj
          .find("td")
          .eq(4)
          .find("a")
          .attr("title")
      };
    })
    .get();
  rows.shift();
  console.log(playListUrl, $$("*"), rows);
  //   const playListHtml = await httpGet(playListUrl);
  // console.log(playListHtml);
  return rows.map(_ => {
    _.album = removeBlankToSpace(_.album)
    _.artist = removeBlankToSpace(_.artist);
    _.song = removeBlankToSpace(_.song);
    return _;
  });
}
