//const express = require('express');
//const fs = require('fs'); //fisiere
//const path = require('path'); //căi
//const sharp = require('sharp'); 

//var app = express(); //am creat serverul

//cu require includem pachetele folosite in proiect

const express = require('express');
const url = require('url');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ejs = require('ejs');
var ip = require('ip');
const { exec } = require('child_process');

var app = express();

app.use(express.static(path.join(__dirname, "resurse")));
app.use(express.static(path.join(__dirname, "resurse/style")));
//app.set("/resurse", express.static(__dirname + "/resurse")); //dirname - toata calea

console.log("Proiectul se afla la ", __dirname);

function verificaImagini() {
    var textFisier = fs.readFileSync("resurse/json/galerie.json")
    var jsi = JSON.parse(textFisier);

    var caleGalerie = jsi.cale_galerie;
    let vectImagini = []
    for (let im of jsi.imagini) {
        var imVeche = path.join(caleGalerie, im.cale_relativa);
        var ext = path.extname(im.cale_relativa);
        var numeFisier = path.basename(im.cale_relativa, ext);
        let imNoua = path.join(caleGalerie + "/mic/", numeFisier + "-mic" + ".webp");
        let imNouaMediu = path.join(caleGalerie + "/mediu/", numeFisier + "-mediu" + ".webp");
        vectImagini.push({ mare: imVeche, mediu: imNouaMediu, mic: imNoua, nume: im.nume, descriere: im.descriere, timp: im.timp });
        if (!fs.existsSync(imNoua))
            sharp(imVeche)
                .resize(150)
                .toFile(imNoua, function (err) {
                    if (err)
                        console.log("eroare conversie", imVeche, "->", imNoua, err);
                });
        if (!fs.existsSync(imNouaMediu))
            sharp(imVeche)
                .resize(250)
                .toFile(imNouaMediu, function (err) {
                    if (err)
                        console.log("eroare conversie", imVeche, "->", imNouaMediu, err);
                });
    }
    return vectImagini;
}

function verificaOra(imagini) {
    var data = new Date();
    var ora = data.getHours();
    var vector = [];
    console.log(imagini);
    for (let imagine of imagini) {
        if (ora >= 5 && ora <= 12 && imagine.timp == "dimineata")
            vector.push(imagine);
        if (ora >= 12 && ora <= 20 && imagine.timp == "zi")
            vector.push(imagine);
        if (((ora >= 20 && ora <= 23) || (ora >= 0 && ora <= 5)) && imagine.timp == "noapte")
            vector.push(imagine);
    }
    return vector;
}

var imagini_init = verificaImagini();
var imagini_verif = verificaOra(imagini_init);
console.log(imagini_verif);
var vectorValori = [6, 8, 10, 12];
var randomPoz = Math.floor(Math.random() * vectorValori.length);
console.log(vectorValori[randomPoz]);
var imaginiRandom = [];
while (vectorValori[randomPoz])
{
    var poz = Math.floor(Math.random()* imagini_init.length);
    if(!imaginiRandom.includes(imagini_init[poz]))
    {
        imaginiRandom.push(imagini_init[poz]);
        vectorValori[randomPoz]--;
    }
}
//console.log(imaginiRandom);
ip = ip.address();

app.set("view engine", "ejs");
app.use("/resurse", express.static(__dirname + "/resurse"));

app.get(["/","/index"], function(req /*request */, res/*response*/){
    /*console.log("ceva");

    res.setHeader("Content-Type", "text/html");
    res.write("<!DOCTYPE html><html><head><title>ceva</title></head><body><p>ceva</p></body></html>");
    */
    const ip = req.ip;
    /*console.log(ip);
    res.render("pagini/index", { ip: ip });*/
    res.render("pagini/index", { imagini_verif, ip: ip, imaginiRandom }); //relativ intotdeauna la folderul views
}); //functie callback

app.get("/articole", function (req, res) {
    res.render("pagini/articole", { imagini_verif });
});

app.get("/galerie-statica", function (req, res) {
    res.render("pagini/galerie-statica", { imagini_verif });
});


/*app.get("/descriere", function (req, res) {
    res.render("pagini/descriere");
});*/

app.get("*/galerie.json", function (req, res) {
    res.status(403).render("pagini/403");
});

app.get("*/galerie-animata.css",function(req, res){
    res.setHeader("Content-Type","text/css");//pregatesc raspunsul de tip css
    let sirScss=fs.readFileSync("./resurse/style/galerie-animata.scss").toString("utf-8");//citesc scss-ul cs string
    let nrImagini = imaginiRandom.length;
    let rezScss=ejs.render(sirScss,{nrImagini});// transmit culoarea catre scss si obtin sirul cu scss-ul compilat
    fs.writeFileSync("./temp/galerie-animata.scss",rezScss);//scriu scss-ul intr-un fisier temporar
    exec("sass ./temp/galerie-animata.scss ./temp/galerie-animata.css", (error, stdout, stderr) => {//execut comanda sass (asa cum am executa in cmd sau PowerShell)
        if (error) {
            console.log(`error: ${error.message}`);
            res.end();//termin transmisiunea in caz de eroare
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            res.end();
            return;
        }
        console.log(`stdout: ${stdout}`);
        //totul a fost bine, trimit fisierul rezultat din compilarea scss
        res.sendFile(path.join(__dirname,"temp/galerie-animata.css"));
    });

});


/*app.get("/articole", function(req, res){

    res.setHeader("Content-Type", "text/html");
    res.write("<!DOCTYPE html><html><head><title>ceva</title></head><body>" + new Date() +"</body></html>");
});*/


app.get("/*", function(req, res){
    console.log(req.url);
    res.render("pagini" +req.url, function(err, rezultatRandare){
        if(err)
        {
            if(err.message.includes("Failed to lookup view"))
            {
                res.status(404).render("pagini/404");
            }
            else
            {
                throw err;
            }
        }
        else 
        {
            res.send(rezultatRandare); 
        }
    });
    /*console.log("Cerere generala");
    res.setHeader("Content-Type", "text/html");
    res.write("<!DOCTYPE html><html><head><title>hi</title></head><body>hi</body></html>");
    res.end();*/

});

console.log("altceva"); //se afiseaza primul
//verificaImagini();
//verificaOra();
app.listen(8080); 
console.log("Serverul asculta pe portul 8080!");
