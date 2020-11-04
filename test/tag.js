

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

function getTagsWithOrder(albums) {
    const allTags = {};
    const uniquerAlbums = {};
    albums.map(_ => _.rec_by).forEach(_ => {
        const key = `${_.album} ${_.artist}`
        uniquerAlbums[key] = _;
    })

    Object.keys(uniquerAlbums).map(_ => {
        return uniquerAlbums[_]
    }).forEach(_ => {
        _.tags.slice(0, 2).forEach(tag => {
            allTags[tag.name] =  allTags[tag.name] || 0;
            allTags[tag.name]++
        })
    })
    const tagsOrder = Object.keys(allTags).sort(function (a, b) {
        return allTags[b] - allTags[a]
    }).map(_ => {
        return {
            name: _,
            count: allTags[_]
        }
    });
    console.log(tagsOrder, Object.keys(uniquerAlbums).length)
}


