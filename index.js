const API_KEY = 'xxxx';
const api = require('./api')(API_KEY);
const chalk = require('chalk');
const fs = require('fs');
const filesize = require('filesize');
var yargs = require('yargs');

var argv =  yargs
  .option('count', {
    alias: 'c',
    describe: 'How many files to save and delete',
    number: true,
    default: 10
  })
  .option('dry-run', {
    describe: 'Do not delete files, only download',
    alias: 'd',
    boolean: true,
    default: false
  })
  .option('out-directory', {
    description: 'where should the files be downloaded',
    alias: 'o',
    required: true
  })
  .help()
  .argv;

if (!fs.existsSync(argv.outDirectory)) {
  fs.mkdirSync(argv.outDirectory);
}
console.log('Fetching list of files');
api.getFiles()
  .then(files => {
    console.log(chalk.green('Done! Found', chalk.greenBright(files.length), ' files'));
    return files.splice(0, argv.count);
  })
  .then(files => {
    console.log('Downloading', chalk.greenBright(files.length), 'files');
    return Promise.all(
      files.map(file => {
        const downloadTo = `${argv.outDirectory}/${file.created}_${file.name}`;
        return api.downloadFile(file.url_private, downloadTo)
          .then(() => {
            console.log('Downloaded', chalk.green(downloadTo), chalk.dim(filesize(file.size)));
            return file;
          })
      })
    )
  })
  .then(files => {
    const totalSize = files.reduce((totalSize, file) => totalSize + file.size, 0);
    if(!argv.dryRun) {
      console.log('Deleting files and freeing', chalk.greenBright(filesize(totalSize)), 'from Slack workspace');
      return Promise.all(
        files.map(file =>
          api.deleteFile(file.id)
            .then(() => {
              console.log('Deleted', chalk.green(file.name), chalk.dim(filesize(file.size)))
            })
        )
      )
      .then(() => console.log(chalk.greenBright('Done!')));
    } else {
      console.log('Did not delete files and free', chalk.greenBright(filesize(totalSize)), 'because this was a dry run')
    }
  })
