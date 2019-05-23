const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const request = require('request');

let StartTime,EndTime;

let videoController=function(file){
   //Інформація про відеофайл
    function fileInfo() {

        ffmpeg.ffprobe(file,function(err, metadata) {
         //  console.log(require('util').inspect(metadata, false, null),err);
            let audioCodec = null;
            let videoCodec = null;
            let fileName = null;
            let fileW = null;
            let fileH = null;
            let createD= null;

            metadata.streams.forEach(function(stream){
                if (stream.codec_type === "video"){
                    videoCodec = stream.codec_name;
                    fileW=stream.width;
                    fileH=stream.height;
                } else if (stream.codec_type === "audio"){
                    audioCodec = stream.codec_name;
                }

            });
            fileName=metadata.format.filename;
            createD=metadata.format.tags.CREATION_TIME;

            console.log("-Video codec: %s\n-Audio codec: %s", videoCodec, audioCodec);
            console.log("-Width: %s Height: %s",fileW,fileH);
            console.log("-File Name:", fileName);
            console.log("-Create Date:", createD);
            });
     } 

    console.log('*Модуль роботи з відеофайлами підключено');
    console.log('===============================');

    console.log('Іфнормація про відеофайл:');
    fileInfo();

    let hashS='';
    let hashList = []; 
    const count = 20; //Кількість згнерованих скриншотів (n-1) 
    const timestamps = [];
    const startPositionPercent = 1;
    const endPositionPercent = 99;
    const addPercent = (endPositionPercent - startPositionPercent) / (count-1);
    let i = 0;

    if (!timestamps.length) {
        let i = 0;
        while (i < count) {
            timestamps.push(`${startPositionPercent + addPercent * i}%`);
            i = i + 1;
        }
    }

    //Відправленя запиту для збереження в блокчейні
    function addBlocks(rootHash){
        const url = " http://localhost:3001/mineBlock";
        request.post(
        url,
        { json: { 'data': rootHash} },
        
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
               console.log("-Блок створено");
            }else{
                console.log("*Помилка запису в блокчейн");
            }
            console.log('===============================');
            console.log('*Розпочато процес видалення скриншотів');
            delAllFromFolder();
        });

    }

    //Очистка директорії від зображень
    function delAllFromFolder(){

    const directory = './myvideo/screens';

    fs.readdir(directory, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
          if (err) throw err;
        });
      }
    });

        console.log('-Усі файли видалено');
        console.log('===============================');
        console.log('*Модуль взаємодії з відеофайлами завершив роботу');
        console.log('===============================');
        console.log('Початок:-',StartTime,' Кінець:- ',EndTime);
    }

    //Генерація хешів для зображень
    function createHash(i,file){
        
        const s = fs.ReadStream('./myvideo/screens/'+file.match(/\/([^/]*)\.\w+$/)[1]+'-'+i+'.png');
        const hash256 = crypto.createHash("sha256");
        s.on('data', function(d) {
            hash256.update(d);
        });   
             
        s.on('end', function() {
            const generated_hash = hash256.digest('hex');
            console.log( 'Згенеровано хеш-функцію для зображення #'+i+': '+generated_hash);
            //hashS+=generated_hash;
            hashList[i]=generated_hash;
        });
    }

    //Генерація дерева
    function createTree(){
        const hashingFn = (a, b) =>{
        let hash256 = crypto.createHash("sha256");
        hash256.update(a+b);
        hh=hash256.digest('hex');
      //   console.log(hh);
         return hh;
    };

    const chunkArray = (array, chunkSize) => Array.from(
        { length: Math.ceil(array.length / chunkSize) },
        (_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize)   
    );

    const getRootHash = (hashList) => {
        const hashPairs = chunkArray(hashList, 2);
        const nextLevelHashes = hashPairs.map(
        ([ leftHash, rightHash = leftHash ]) => hashingFn(leftHash, rightHash)
  );

     console.log(nextLevelHashes);

    if (nextLevelHashes.length > 1) {
        return getRootHash(nextLevelHashes);
    }

        return nextLevelHashes[0];
    };

    const rootHash = getRootHash(hashList);
    rootHash;

    createFile(rootHash);
};
    
    //Створення .тхт файлу з хешами зображень
    function createFile(rootHash){
        console.log('===============================');
        console.log('*Розпочато процес збереження хешів зображень');
        var stream = fs.createWriteStream("./hashLists/"+rootHash+".txt");
        stream.once('open', function(fd) {
            hashList.forEach(function(item,i,hashList){
                stream.write(hashList[i]+"\n");
            })
        stream.end();
        });
        console.log("-Файл - '"+rootHash+".txt' згенеровано");
        console.log('===============================');
        console.log('*Збереження кореня дерева для відеофайлу в блокчейні');
        addBlocks(rootHash);
    }

    //Створення скриншотів
    function takeScreenshots(file) {
        ffmpeg(file)
            .on("start", () => {
                if (i < 1) {
                    console.log(`*Розпочато процес створення скриншотів та визначення їх хеш-функцій (SHA256)`);
                    console.log('===============================');
                    //console.log('Час початку:');
                    StartTime=new Date().getTime();
                }
            })
            .on("end", () => {
                i = i + 1;
                if (i < count) 
                {
                    console.log(`Створено скриншот: ${i}`);
                    createHash(i,file);
                    takeScreenshots(file);
                } else {
                   // console.log('Час кінця:');
                    EndTime=new Date().getTime();
                    console.log('*Усі скриншоти успішно створено');
                    console.log('===============================');
                    console.log('*Розпочато процес створення дерева Меркла');
                    console.log('===============================');
                  //  createHashSum();
                    createTree();  
                }
            })
            .screenshots({
                count: 1,
                timemarks: [timestamps[i]],
                filename: `%b-${i + 1}.png`
            },path.join(path.dirname(file), 'screens'));
    }

    takeScreenshots(file);
    
};

module.exports=videoController;