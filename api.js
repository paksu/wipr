var fs = require('fs');

module.exports = (API_KEY) => {

  const api = require('axios').create({
    baseURL: 'https://slack.com/api',
    headers: {
      Authorization: `Bearer ${API_KEY}`
    }
  });

  const times = (n) => Array(n).fill().map((_, index) => index);

  const getFiles = () =>
    api.get('files.list')
      .then(({data}) => data.paging.pages)
      .then(pageCount => Promise.all(
        times(pageCount).map(n => api.get('files.list', {params: {page: n + 1}}))
      ))
      .then(responses =>
        responses.reduce((allFiles, response) => allFiles.concat(response.data.files), [])
      )
      .then(files =>
        files.sort((a,b) => a.created - b.created)
      )

  const downloadFile = (from, to) =>
    api.get(from, { responseType: 'stream'})
      .then((response) => response.data.pipe(fs.createWriteStream(to)));

  const deleteFile = (file) => api.post('files.delete', { file })

  return {
    getFiles,
    downloadFile,
    deleteFile
  }
}
