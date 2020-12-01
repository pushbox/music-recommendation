const cheerio = require("cheerio");
const { httpGetByExtension, removeBlankToSpace } = require("./api");
const PouchDB = require("pouchdb").default;
PouchDB.plugin(require("pouchdb-find").default);

function wait(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms)
    });
}

// https://emumo.xiami.com/space/lib-artist

// const { removeBlankToSpace, httpGet } = require("./api");
// import md5 from "js-md5";

// import LastFM  from './lastfm'
// import Douban  from "./douban.js"
// var dailyDb = new PouchDB("daily_albums");

export class Exporter {
    constructor({ type, force = false, progress = function() {} }) {
        this.force = force
        this.type = type
        this.database = new PouchDB(`exporter_xiami_${type}`);
        this.isClosed = false
        this.state = null
        this.progressHandler = progress
        this.waitDuration = 2 * 1000;
    }

    async loadPage(url) {
        this.progressHandler && this.progressHandler({
            progressType: 'fetch',
            url: url
        });
        return await httpGetByExtension(url);
    }

    close() {
        this.isClosed = true
    }

    async waitTimer(du) {
        this.progressHandler && this.progressHandler({
            progressType: 'wait',
            duration: du
        });
        await wait(du)
    }

    async init() {
        console.log('init', 'force', this.force)
        const dataDocId = `${this.type}_rows`
        const stateDocId = 'last_state';
        const db  = this.database

        if(this.force) {
            try {
                await db.get(stateDocId).then(function (doc) {
                    doc._deleted = true;
                    return db.put(doc);
                });
            } catch (e) {
                console.log('clear databse failed', e)
            }

            try {
                await db.get(dataDocId).then(function (doc) {
                    doc._deleted = true;
                    return db.put(doc);
                });
            } catch (e) {
                console.log('clear databse failed', e)
            }
        }

        try {
            const eDoc = await this.database.get(stateDocId)
            console.log('init', 'last state', eDoc)
            this.state = eDoc.last_state
        } catch (e) {}

        try {
           
            const allData = await this.database.get(dataDocId)
            console.log('allData', allData)
        } catch (e) {}
    }

    async saveProgress(state) {
        const stateDocId = 'last_state';
        try {
            const eDoc = await this.database.get(stateDocId)
            eDoc.last_state = state
            eDoc.time = Date.now()
            await this.database.put(eDoc)
        } catch (e) {
            console.log('update failed try create', e)
            await this.database.put({
                _id: stateDocId,
                last_state: state,
                time: Date.now()
            })
        }

        const dataDocId = `${this.type}_rows`
        try {
            const dataDoc = await this.database.get(dataDocId)
            dataDoc.rows = [].concat(dataDoc.rows, state.pageData)
            dataDoc.time = Date.now()
            await this.database.put(dataDoc)
        } catch (e) {
            console.log('update failed try create')
            await this.database.put({
                _id: dataDocId,
                rows: state.pageData,
                time: Date.now()
            })
        }

        const allData = await this.database.get(dataDocId)
        console.log('allData', allData)
        this.progressHandler && this.progressHandler({
            progressType: 'pageend',
            type: this.type,
            state: state
        });
    }

    async getData() {
        const dataDocId = `${this.type}_rows`
        const dataDoc = await this.database.get(dataDocId)
        // dataDoc.rows = [].concat(dataDoc.rows, state.pageData)
        // dataDoc.time = Date.now()
        return dataDoc;
    }
    
    async export() {
        await this.init();
        if(this.state != null) {
            if(this.state.reachEnd) {
                console.log('reach end')
                return true;
            }
        }

        if(this.type == 'album') {
            return await this.exportAlbum();
        }

        if(this.type == 'artist') {
            return await this.exportArtist();
        }

        if(this.type == 'collect') {
            return await this.exportCollect();
        }

        if(this.type == 'song') {
            return await this.exportSong();
        }
    }

    async exportAlbum() {
        let pageUrl = 'https://emumo.xiami.com/space/lib-album';
        let currentPage = 0;
        if(this.state != null) {
            pageUrl = this.state.nextPageUrl
            if(this.state.currentPage) {
                currentPage = this.state.currentPage
            }
        }
        console.log('exportAlbum.start', {
            pageUrl,
            currentPage
        })
        for (let index = 0; index < 500; index++) {
            if(this.isClosed) {
                console.log('time to close')
                break;
            }
            if(currentPage > 200) break;
            try {
                let response = await this.loadPage(pageUrl);
                let $ = cheerio.load(response);
                let listItemDoms = $('.albumThread_list li');
                let pageData = []
                console.log('listItemDom', listItemDoms.eq)
                for (let index = 0; index < listItemDoms.length; index++) {
                    const listItemDom = listItemDoms.eq(index);
                    const rowData = {};
                    rowData.album_name = listItemDom.find('.name a').eq(0).text();
                    rowData.artist = listItemDom.find('.name a').eq(1).text();
                    rowData.cover = listItemDom.find('.cover img').attr('src');
                    rowData.faved_time = listItemDom.find('.faved_time').text();
                    rowData.tags = listItemDom.find('.tag_block a').map(function() {
                        return $(this).text();
                    }).get().filter(_ => _ != '' && _.indexOf('修改') == -1);
                    pageData.push(rowData);
                }

                let nextPageUrl = $('.p_redirect_l');
                if(nextPageUrl.length) {
                    currentPage++
                    pageUrl = 'https://emumo.xiami.com' + nextPageUrl.attr('href')
                    console.log('nextPage', pageUrl)
                }
                await this.saveProgress({
                    pageData: pageData,
                    page: currentPage,
                    currentPage: parseInt($('.p_curpage').text()),
                    reachEnd: nextPageUrl.length == 0,
                    nextPageUrl: pageUrl,
                    pageMeta: $('.all_page span').text()
                });
                if( nextPageUrl.length == 0) {
                    console.log('no more page')
                    break
                }
                console.log('pageData', pageData, nextPageUrl.attr('href'));
            } catch (e) {}
            await this.waitTimer(this.waitDuration);
            console.log('wait', '3 second')
        }

        return true;
    }


    async exportSong() {
        let pageUrl = 'https://emumo.xiami.com/space/lib-song';
        let currentPage = 0;
        if(this.state != null) {
            pageUrl = this.state.nextPageUrl
            if(this.state.currentPage) {
                currentPage = this.state.currentPage
            }
        }
        console.log('exportSong.start', {
            pageUrl,
            currentPage
        })
        for (let index = 0; index < 500; index++) {
            if(this.isClosed) {
                console.log('time to close')
                break;
            }
            if(currentPage > 200) break;
            try {
                let response = await this.loadPage(pageUrl);
                let $ = cheerio.load(response);
                let listItemDoms = $('.track_list .song_name');
                let pageData = []
                console.log('listItemDom', listItemDoms.eq)
                for (let index = 0; index < listItemDoms.length; index++) {
                    const listItemDom = listItemDoms.eq(index);
                    const rowData = {};
                    rowData.song_name = listItemDom.find('a').eq(0).text();
                    rowData.artist = listItemDom.find('a').eq(1).text();
                    pageData.push(rowData);
                }

                let nextPageUrl = $('.p_redirect_l');
                if(nextPageUrl.length) {
                    currentPage++
                    pageUrl = 'https://emumo.xiami.com' + nextPageUrl.attr('href')
                    console.log('nextPage', pageUrl)
                }
                await this.saveProgress({
                    pageData: pageData,
                    page: currentPage,
                    currentPage: parseInt($('.p_curpage').text()),
                    reachEnd: nextPageUrl.length == 0,
                    nextPageUrl: pageUrl,
                    pageMeta: $('.all_page span').text()
                });
                if( nextPageUrl.length == 0) {
                    console.log('no more page')
                    break
                }
                console.log('pageData', pageData, nextPageUrl.attr('href'));
            } catch (e) {}
            await this.waitTimer(this.waitDuration);
            console.log('wait', '3 second')
        }

        return true;
    }


    async exportCollect() {
        let pageUrl = 'https://emumo.xiami.com/space/collect';
        let currentPage = 0;
        if(this.state != null) {
            pageUrl = this.state.nextPageUrl
            if(this.state.currentPage) {
                currentPage = this.state.currentPage
            }
        }
        console.log('exportCollect.start', {
            pageUrl,
            currentPage
        })
        for (let index = 0; index < 500; index++) {
            if(this.isClosed) {
                console.log('time to close')
                break;
            }
            if(currentPage > 200) break;
            try {
                let response = await this.loadPage(pageUrl);
                let $ = cheerio.load(response);
                let listItemDoms = $('.collectThread_list li');
                let pageData = []
                console.log('listItemDom', listItemDoms.eq)
                for (let index = 0; index < listItemDoms.length; index++) {
                    if(this.isClosed) {
                        console.log('time to close')
                        break;
                    }
                    const listItemDom = listItemDoms.eq(index);
                    const rowData = {};
                    const detailUrl = 'https://emumo.xiami.com' + listItemDom.find('.name a').attr('href');
                    try {
                        let detailPageResponse = await this.loadPage(detailUrl);
                        let $$ = cheerio.load(detailPageResponse);
                        rowData.cover = $$('.bigImgCover').attr('href');
                        rowData.collect_name = $$('.info_collect_main h2').text().trim();
                        // rowData.collect_name = $$('.info_collect_main h2').text();
                        rowData.infos = $$('.cdinfo li').map(function() {
                            const values = $(this).text().trim().split("：")
                            return {
                                name: values[0].trim(),
                                value: values[1].trim(),
                            };
                        }).get();
                        rowData.full_desc = $$('.info_intro_full').html();
                        rowData.songs = $$('.quote_song_list li').map(function() {
                            const songNames = $$(this).find('.song_name').text().trim().split('-—');
                            return {
                                detail_url: $$(this).find('.song_name a').attr('href'),
                                song_name: songNames[0].trim(),
                                artist_name: songNames.length > 1 ? songNames[1].split("\n")[0].trim() : null,
                                quote: $$(this).find('.s_quote').eq(1).text(),
                            };
                        }).get();
                        console.log('detailPageResponse', rowData)
                        // break;
                        pageData.push(rowData);
                    } catch (e) {
                        console.log('fetch detail error', e)
                    }
                    await this.waitTimer(this.waitDuration);
                }

                let nextPageUrl = $('.p_redirect_l');
                if(nextPageUrl.length) {
                    currentPage++
                    pageUrl = 'https://emumo.xiami.com' + nextPageUrl.attr('href')
                    console.log('nextPage', pageUrl)
                }
                await this.saveProgress({
                    pageData: pageData,
                    page: currentPage,
                    nextPageUrl: pageUrl,
                    currentPage: parseInt($('.p_curpage').text()),
                    reachEnd: nextPageUrl.length == 0,
                    pageMeta: $('.all_page span').text()
                });

                if( nextPageUrl.length == 0) {
                    console.log('no more page')
                    break
                }
                // break;
                console.log('pageData', pageData, nextPageUrl.attr('href'));
            } catch (e) {}
            await this.waitTimer(this.waitDuration);
            console.log('wait', '3 second')
        }

        return true;
    }

    async exportArtist() {
        let pageUrl = 'https://emumo.xiami.com/space/lib-artist';
        let currentPage = 0;
        if(this.state != null) {
            pageUrl = this.state.nextPageUrl
            if(this.state.currentPage) {
                currentPage = this.state.currentPage
            }
        }
        console.log('exportArtist.start', {
            pageUrl,
            currentPage
        })
        for (let index = 0; index < 500; index++) {
            if(this.isClosed) {
                console.log('time to close')
                break;
            }
            if(currentPage > 200) break;
            try {
                let response = await this.loadPage(pageUrl);
                let $ = cheerio.load(response);
                let listItemDoms = $('.artistThread_list li');
                let pageData = []
                console.log('listItemDom', listItemDoms.eq)
                for (let index = 0; index < listItemDoms.length; index++) {
                    const listItemDom = listItemDoms.eq(index);
                    const rowData = {};
                    rowData.artist_name = listItemDom.find('.singer_names').text();
                    rowData.artist = listItemDom.find('.name a').attr('title');
                    if( rowData.artist_name ) {
                        rowData.artist = rowData.artist.replace(rowData.artist_name, '')
                        rowData.artist_name = rowData.artist_name.replace('(', '').replace(')', '')
                    }
                    rowData.cover = listItemDom.find('.buddy img').attr('src');
                    rowData.tags = listItemDom.find('.tag_block a').map(function() {
                        return $(this).text();
                    }).get().filter(_ => _ != '' && _.indexOf('修改') == -1);
                    pageData.push(rowData);
                }

                let nextPageUrl = $('.p_redirect_l');
                console.log('nextPage', nextPageUrl.length)
                if(nextPageUrl.length) {
                    currentPage++
                    pageUrl = 'https://emumo.xiami.com' + nextPageUrl.attr('href')
                    console.log('nextPage', pageUrl)
                }
                await this.saveProgress({
                    pageData: pageData,
                    page: currentPage,
                    nextPageUrl: pageUrl,
                    reachEnd: nextPageUrl.length == 0,
                    currentPage: parseInt($('.p_curpage').text()),
                    pageMeta: $('.all_page span').text()
                });
                if( nextPageUrl.length == 0) {
                    console.log('no more page')
                    break
                }
                // break;
                console.log('pageData', pageData, nextPageUrl.attr('href'));
            } catch (e) {}
            await this.waitTimer(this.waitDuration);
            console.log('wait', '3 second')
        }
        return true;
    }
}