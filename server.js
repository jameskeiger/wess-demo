const express = require("express");
const app = express();
const port = 80;

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var https = require("https");

var Datastore = require("nedb");
var db = new Datastore({ filename: "database", autoload: true });

app.get("/", (req, res) =>
  res.send("Hello World! How are you?! Does it work?")
);

app.post("/say-name", (req, res) => {
  var their_name = req.body.name;
  db.find({ name: their_name }, function(error, docs) {
    if (docs.length > 0) {
      var them = docs[0];
      console.log(docs);
      var times_seen = them.times_seen || 0;
      db.update(
        { name: their_name },
        { name: their_name, times_seen: times_seen + 1 },
        function(error) {
          console.log(error);
        }
      );
      res.send(
        `I've heard of you, ${their_name}, and seen you ${times_seen} times.`
      );
    } else {
      db.insert({ name: their_name, times_seen: 1 }, function(error) {
        console.log(error);
        res.send("Now I know you, " + req.body.name);
      });
    }
  });
});

app.get("/popularity", (req, res) => {
  db.find({})
    .sort({ times_seen: -1 })
    .exec(function(error, docs) {
      res.json(docs);
    });
});

app.get("/songs-by", (req, res) => {
  var artist = req.query.artist;
  var url = `https://www.songsterr.com/a/ra/songs.json?pattern=${artist}&size=10`;
  console.log("Requesting data from", url);
  https.get(url, function(songResponse) {
    console.log("Data is incoming");
    var body = "";

    songResponse.on("data", function(chunk) {
      body += chunk;
    });

    songResponse.on("end", function() {
      var songs = JSON.parse(body);

      var result = "<ul>";
      songs
        .map(song => song.title)
        .sort()
        .forEach(function(title) {
          result += `<li>${title}</li>`;
        });
      result += "</ul>";
      res.send(`Songs by ${artist}: ${result}`);
    });
  });
});

app.use(express.static("files"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
