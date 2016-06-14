(function () {

    var fileToProcess = false;

    var path = require('path');
    var fs = require('fs');
    var chalk = require('chalk');
    var program = require('commander');
    var Q = require('q');
    var filepath = require('filepath');
    var lib = path.join(path.dirname(fs.realpathSync(__filename)), '../lib');
    var GpxSplit = require(lib + '/gpxsplit.js');

    require('pkginfo')(module, 'version');

    exports.run = function () {
        program
                .version(module.exports.version)
                .usage('[options] <gpxFile>')
                .option('-s, --split [value]', 'Split track by given point count', parseInt)
                .option('-w, --waypoints [value]', 'Make waypoint for every speciffied Km', parseInt)
                .option('-o, --output <value>', 'Converted GPX destination file', false)
                .option('-b, --backup', 'Do backup', false)
                .option('-d, --decimals [value]', 'Decimal digits precision for lat/long', parseInt)
                .option('-p, --postfix', 'Postfix added to converted file name', '-split')
                .option('--noNameFix', 'Do not shorten track name', false)
                .option('--noSplit', 'Do not split track')
                .option('--noWaypoints', 'Do not make waypoints')
                .action(function (gpxFile) {
                    fileToProcess = gpxFile;
                })
                .parse(process.argv);


        //----------------------------------------------------------------------

        program.fileToProcess = fileToProcess;
        program.version = module.exports.version;

        //----------------------------------------------------------------------

        if (!program.fileToProcess) {
            console.log(chalk.underline.yellow("Please specify GPX file to process"));
            program.outputHelp();
            process.exit();
        } else {

            var file = filepath.create(program.fileToProcess);

            if (!file.exists()) {
                console.log(chalk.underline.yellow("Specified input GPX file does not exists! ") + chalk.white(program.fileToProcess));
                process.exit();
            }

            console.log(chalk.green("Splitting file: ") + chalk.white(program.fileToProcess));

            var spliter = new GpxSplit(program);
            Q.fcall(spliter.read.bind(spliter))
                    .then(spliter.process.bind(spliter))
                    .then(spliter.save.bind(spliter))
                    .done();
        }
    }

}).call(this);