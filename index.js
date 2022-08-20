const express = require("express");
const admZip = require("adm-zip");
const fs = require('fs')
const path = require("path");
const multer = require("multer");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const { join } = require("path");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// upload directory as static

app.use(express.static(path.join(__dirname + "uploads")));

// multer configuration

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
  },
})

const upload = multer({ storage: storage }).single("file")

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

app.listen(5000, () => {
  console.log("App is listening on port 5000");
})

// post request which will handle the conversion process

app.post("/converttoimage", (req, res) => {
  // upload the pdf file

  upload(req, res, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(req.file.path)
      outputfile = "image-output"

      extZip = ".zip"
      extJpg = ".jpg"

      tmpImages = path.join('tmp' + '/' )
      let outputzip = new admZip();

      exec(
        `magick convert -density 380 ${req.file.path} -quality 100 tmp/`+outputfile+`-%03d`+extJpg, (err, stdout, stderr) => {
          if (err) {
            console.log(err)
          } else {
            // add the files to the zip file

            fs.readdir(tmpImages, function (err, files) {
              const jpgFiles = files.filter((el) => path.extname(el) === extJpg )

                console.log(jpgFiles)
                jpgFiles.forEach(file => {
                    console.log(tmpImages + file)
                    outputzip.addLocalFile(path.join(tmpImages + file)) 
                })

                outputzip.writeZip('out/'+ Date.now() + '-' + outputfile + extZip)
                console.log("Conversion Completed!")
                res.redirect(`http://localhost:5000/`)
              })
          }
        }
      )
    }
  })
})