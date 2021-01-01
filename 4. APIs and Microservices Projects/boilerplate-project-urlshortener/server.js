require("dotenv").config();
const express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// this project needs a db !!
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const linkSchema = new mongoose.Schema({
  _id: { type: String },
  link: "",
  created_at: "",
});

const Link = mongoose.model("Link", linkSchema);

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl/new", (req, res) => {
  let data = req.body.url;
  let urlRegex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

  // Check if data is a valid URL
  if (!urlRegex.test(data)) {
    res.json({ error: "invalid URL" });
  } else {
    Link.findOne({ link: data }, (err, doc) => {
      if (doc) {
        console.log("link found in db");
        res.json({
          original_url: data,
          short_url: doc._id,
        });
      } else {
        console.log("link NOT found in db, adding new link");
        let id = makeid();
        let link = new Link({
          _id: id,
          link: data,
          created_at: new Date(),
        });

        link.save(err, (doc) => {
          if (err) return console.error("Error: ", err);
          console.log(doc);
          res.json({
            original_url: data,
            short_url: link._id,
          });
        });
      }
    });
  }
});

app.get("/api/shorturl/:id?", (req, res) => {
  let id = req.params.id;
  Link.findOne({ _id: id }, (err, doc) => {
    if (doc) {
      res.redirect(doc.link);
    } else {
      res.redirect("/api/shorturl/new");
    }
  });
});

// app.get("/api/shorturl/new", (req, res) => {
//   res.json({ hello: "hi there..." });
// });

function makeid() {
  let randomText = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 5; i++) {
    randomText += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomText;
}

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
