// const axios = require("axios");
const _ = require("lodash");
// const fs = require("fs");
const cheerio = require("cheerio");
const moment = require("moment");
const PouchDB = require("pouchdb").default;
const { removeBlankToSpace, httpGet } = require("./api");
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

// function httpGet(url, timeout = 5000) {
//   return new Promise((resolve, reject) => {
//     console.log("window.$_musichelper", url);
//     window.$_musichelper.httpGet({ url: url }, function(error, data) {
//       //   console.log("window.$_musichelper", error, data);
//       if (error) {
//         reject(error);
//       } else {
//         resolve(data);
//       }
//     });
//     setTimeout(function() {
//       reject("timeout");
//     }, timeout);
//   });
// }

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

async function getSimliarAlbumsByPlatform(type, topAlbums, conCount, progressListenner) {
  let totalAlbums = []
  const stepItems = chunk(topAlbums, conCount);
  console.log(
    "stepItems",
    stepItems,
    "getSimliarAlbumsByPlatform",
    type, conCount
  );

  let sucessCount = 0;
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
      results.forEach((_, index) => {
        if (_.length) {
          sucessCount++;
          totalAlbums = totalAlbums.concat(_);
          // notify progress
        }
      });
      if(progressListenner) {
        progressListenner({
          items: [].concat(results[0], results[1]),
          total: totalAlbums,
          type: type,
        });
      }
      console.log('results', results, stepAlbums)
    } catch (e) {
      console.log('run.error', e)
    }
    console.log("step", index, "done", stepItems.length, stepAlbums);
  }

  console.log("getSimliarAlbumsByPlatform", type, "done", topAlbums.length, 'sucessCount', sucessCount);
  return totalAlbums;
}

async function getSimliarAlbums(albums, progressListenner) {
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
          return getSimliarAlbumsByPlatform(_.type, albums, cCount, progressListenner);
        })
      );
      results.forEach((_, index) => {
        if (_.length) {
          totalAlbums = totalAlbums.concat(_);
          // progressListenner({
          //   items: _,
          //   total: totalAlbums,

          // });
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


export async function getAlbumsByRecId(docId) {
  let caceDoc = null;
  try {
    caceDoc = await dailyDb.get(docId);
  } catch (e) {}
  return caceDoc;
}

export async function getAlbums(recentSongs, opts = {}) {
  const songhash = md5(JSON.stringify(recentSongs));
  // console.log(topAlbums, topArtists);
  let totalAlbums = [];
  let topAlbums = getTop(i => {
    return [i.album, i.artist].join("==");
  }, recentSongs).map(_ => {
    return {
      artist: _.name.split("==")[1],
      album: _.name.split("==")[0],
      count: _.count,
    };
  }).filter(_ => _.album);

  topAlbums =
    topAlbums.length > 10
      ? [].concat(topAlbums.slice(0, 10), _.shuffle(topAlbums.slice(10, topAlbums.length).slice(0, 5)))
      : topAlbums;
  // const topArtists = getTop(i => {
  //   return [i.artist].join("==");
  // }, recentSongs);
  const todyStr = moment().format("YYYYMMDD");
  const indexPrefix = opts.type || 'daily';
  const docId = `${indexPrefix}_${todyStr}_albums`;
  const force = opts.force || true;
  let uniqueAlbums = [];
  let startTime = Date.now();
  let progressListenner = opts.progress || function() {};
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
    totalAlbums = await getSimliarAlbums(topAlbums, progressListenner);
    const byImages = _.groupBy(totalAlbums, "cover");
    uniqueAlbums = Object.keys(byImages).map((_) => {
      byImages[_][0].repeatCount = byImages[_].length;
      return byImages[_][0];
    });
    console.log("uniqueAlbums", uniqueAlbums, uniqueAlbums.length);
    var doc = {
      _id: docId,
      albums: uniqueAlbums,
      songhash: songhash,
      updateTime: Date.now(),
    };
    if (caceDoc == null) {
      var res = await dailyDb.put(doc);
      console.log('create doc');
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
  console.log("uniqueAlbums", uniqueAlbums, uniqueAlbums.length, spend);

  uniqueAlbums = JSON.parse(JSON.stringify(uniqueAlbums))
  return {
    id: docId,
    // songs: ,
    albums: uniqueAlbums
  };
}

function isDesktop() {
  return window.$_musichelper && window.$_musichelper.isDesktop;
}

const axios = require("axios");
const api = axios.create({
  baseURL: "http://localhost:8956",
  timeout: 30000,
});

export async function getXiamiCollect() {
  try {
    if (isDesktop()) {
      const { data } = await api.get("/api/song/query", {
        params: {
          dsl: {
            where: {
              type: "xiami",
            },
            order: [["id", "desc"]],
          },
        },
      });
      console.log("getXiamiCollect", data);
      return data.map(_ => {
        return {
          type: "xiami",
          album: removeBlankToSpace(_.album_name),
          artist: removeBlankToSpace(_.artist_name),
          song: removeBlankToSpace(_.song_name),
        };
      });
    }
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
  if (isDesktop()) {
    const { data } = await api.get("/api/song/query", {
      params: {
        dsl: {
          where: {
            type: "cloudmusic",
          },
          order: [["id", "desc"]],
        },
      },
    });
    console.log("getXiamiCollect", data);
    return data.map((_) => {
      return {
        type: "cloudmusic",
        album: removeBlankToSpace(_.album_name),
        artist: removeBlankToSpace(_.artist_name),
        song: removeBlankToSpace(_.song_name),
      };
    });
  }
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
