var os = require("os");
var fs = require('fs');
var path = require("path");

var elos = new Map();
var K = 150;

if(fs.existsSync('history'))
{
    var contents = fs.readFileSync('history', 'utf8');
    var lines = contents.split(/\r?\n/);
    console.log(lines.length);
    lines.forEach(function(line)
    {
        var args = line.split(' ');
        console.log(args.length);
        if(args.length >= 2 && args[0] != args[1])
        {
            var p1ID = args[0];
            var p2ID = args[1];
            var p1ELO = 1000;
            var p2ELO = 1000;
            if(elos.has(p1ID))
            {
                p1ELO = elos.get(p1ID);
            } 
            if(elos.has(p2ID))
            {
                p2ELO = elos.get(p2ID);
            }
            var E1 = 1/(1+Math.pow(10, ((p2ELO-p1ELO)/400)));
            var E2 = 1/(1+Math.pow(10, ((p1ELO-p2ELO)/400)));
            console.log('E1: ' + E1 + ' ----- E2: ' + E2);
            var p1UpdatedELO = Math.round(p1ELO + K*(1-E1));
            var p2UpdatedELO = Math.round(p2ELO + K*(0-E2));
            console.log('p1ELO: ' + p1ELO + ' ------- p2ELO: ' + p2ELO)
            console.log('p1UpdatedELO: ' + p1UpdatedELO + ' ------- p2UpdatedELO: ' + p2UpdatedELO)
            elos.set(p1ID, p1UpdatedELO);
            elos.set(p2ID, p2UpdatedELO);
        }
    });
}
else
{
    console.log('no history file');
}
var keys = Array.from(elos.keys());
keys.forEach(function(key) {
    fs.appendFileSync('elos', key + ' ' + elos.get(key) + os.EOL);
});
/*while(key = keys.next())
{
    fs.appendFileSync('elos', key + ' ' + elos.get(key) + os.EOL);
}*/
console.log('done');
process.exit();
