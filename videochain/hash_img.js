//var ffmpeg = require('fluent-ffmpeg');



//ffmpeg.ffprobe('./myvideo/video.mp4',function(err, metadata) {
//  console.log(require('util').inspect(metadata, false, null),err);
//    console.log("it's work");
//});


//ffmpeg('./myvideo/video.mp4')
 // .on('filenames', function(filenames) {
  //  console.log('Will generate ' + filenames.join(', '))
 // })
 // .on('end', function() {
 //   console.log('Screenshots taken');
 // })
 // .screenshots({
    // Will take screens at 20%, 40%, 60% and 80% of the video
 //   count: 6,
 //   folder: './screens'
 // });

 var crypto = require("crypto");

const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
var request = require('request');
let StartTime,EndTime;

let videoController=function(file){


    function fileInfo() {
    
        ffmpeg.ffprobe(file,function(err, metadata) {
         //  console.log(require('util').inspect(metadata, false, null),err);
            var audioCodec = null;
            var videoCodec = null;
            var fileName = null;
            var fileW = null;
            var fileH = null;
            var createD= null;

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

  //  console.log('Іфнормація про відеофайл:');
  //  fileInfo();

    let hashS='';
    let hashList = [];
    let hashSumList = [];
    const count = 120;
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

    function createHashSum() {

        console.log('Лист хешів:');
        hashList.forEach(function(item,i,hashList){
            console.log('i=',i,'  Element=',item);
            })
        
        for(i=1;i<count-1;i++){
         //   console.log('Block - ', i,' sum_el=', hashList[i]+hashList[i+1]);
            //  hashSumList[i]=hashList[i]+hashList[i+1];
            hash256 = crypto.createHash("sha256");
            hash256.update(hashList[i]+hashList[i+1]);
            hashSumList[i]=hash256.digest('hex');


        }
        // console.log( 'Згенеровано хеш-функцію для відеофайлу: '+generated_hash);
         console.log('Суми хеш-функцій для кардів:');
        hashSumList.forEach(function(item,i,hashSumList){
         //   console.log('i=',i,'  Element=',item);
            })
        console.log('===============================');
        console.log('*Розпочато процес видалення скриншотів');
      //  delAllFromFolder();

      //  addBlocks();
    }

    function addBlocks(){
        var url = " http://localhost:3001/mineBlock";

        hashSumList.forEach(function(item,i,hashSumList){
      
      request.post(
    url,
    { json: { 'data': item} },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
         //   console.log(body)
        }
    }
);
            })
    }

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

    function createHash(i){
        console.log('test'+i);
            var s = fs.ReadStream('./myvideo/screens/myfile'+i+'.png');
            var hash256 = crypto.createHash("sha256");
            s.on('data', function(d) {
            hash256.update(d);
            });   
             
            s.on('end', function() {
            var generated_hash = hash256.digest('hex');
            console.log( 'Згенеровано хеш-функцію для зображення #'+i+': '+generated_hash);
            //hashS+=generated_hash;
            hashList[i]=generated_hash;
            });
    }


    function takeScreenshots(file) {
        ffmpeg(file)
            .on("start", () => {
                if (i < 1) {
                    console.log(`*Розпочато процес створення скриншотів та визначення їх хеш-функцій (SHA256)`);
                    console.log('===============================');
                    console.log('Час початку:');
                    StartTime=new Date().getTime();
                }
            })
            .on("end", () => {
                i = i + 1;
                if (i < count) 
                {
                    console.log(`Створено скриншот: ${i}`);
                    createHash(i);
                    takeScreenshots(file);
                } else {
                    console.log('Час кінця:');
                    EndTime=new Date().getTime();
                    console.log('*Усі скриншоти успішно створено');
                  //  console.log('===============================');
                  //  console.log('*Розпочато процес сумування хеш-функцій');
                  //  console.log('===============================');
                  //  createHashSum()


                }
            })
            .screenshots({
                count: 1,
                timemarks: [timestamps[i]],
                filename: `%b-${i + 1}.jpg`
            },path.join(path.dirname(file), 'screens'));
    }

  //  takeScreenshots(file);

  function hashImms()
  {   
  while(i<count){  
    setTimeout(createHash, 2000,i);
    i++;
}
  }
   hashImms(); 
    
};

videoController();
///module.exports=videoController;