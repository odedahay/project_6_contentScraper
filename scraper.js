var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var json2csv = require('json2csv');

// Target URL
var baseUrl = 'http://www.shirts4mike.com/';
var catalogueUrl = baseUrl + "shirts.php";


// Error Function
function logErrorMessage(err){
    console.log('There\’s been a 404 error. Cannot connect to the to http://shirts4mike.com');

    if (err && (err.code = 'ENOTFOUND')) {

        var errorMessage = '[' + new Date() + '] - ';
        	errorMessage += 'There’s been a 404 error. Cannot connect to the to http://shirts4mike.com\n';
        	errorMessage += err + '\n';
    }

    fs.readFile('scraper-error.log', (err)=>{
        
        if (err && (err.code = 'ENOENT')) {
            
            fs.writeFile('scraper-error.log', errorMessage);

        } else {
        
	        fs.appendFile('scraper-error.log', errorMessage, (error)=>{
	          if (error) return error;
          
        });

        }
    }) 
} 

// Create a folder 
function createCSVData(){
    fs.stat('./data/', (err)=>{

        if (err && (err.code === 'ENOENT')) {
        	
            fs.mkdir('./data');
        }
    })
}


function scrapeWebsite(){
    
    return new Promise((result, err)=>{

        request(catalogueUrl, (err, res, next)=>{

        	var arrayOfShirtsPages = [];
            
            if (!err && res.statusCode === 200) {

                $ = cheerio.load(next);
                $( ".products li" ).each(function(){

                    let fullUrl = baseUrl + $(this).find('a').attr('href');
                    arrayOfShirtsPages.push(fullUrl);
                
                });

                result(arrayOfShirtsPages)

            } else {
                logErrorMessage(err);
            }
        }); 
    }) 
} 


// Get all data requires
function scrapeShirtDetails(getUrl){
    
    var data = getUrl.map(function(dataPath){

        return new Promise((result, error)=>{
        
            request(dataPath, (err, res, next)=>{

                var $ = cheerio.load(next);
                var data = {
                    title: $('.shirt-details h1').text().substr(4),
                    price: $('.price').text(),
                    picture: $('.shirt-picture img').attr('src'),
                    url: dataPath,
                    time: new Date().toLocaleString(),
                }

                result(data)
            })
        }) 
    })

    return Promise.all(data)
} 


// Save the data in csv file
function writeCSVFile(shirtsData){

   	var dataFields = ['title', 'price', 'picture', 'url', 'time'];

    var csv = json2csv({ 
    			data: shirtsData, 
    			dataFields: dataFields 
    		});

    var nameOfTheFile = new Date().toISOString().slice(0, 10);

    fs.writeFile('./data/' + nameOfTheFile + '.csv', csv, function(err){
   
      if (err) return err;
   
      console.log('Website scrape is complete, please check data folder');
    });
}


var scrapeShirtCatalogue = new Promise((res, err) => {
    return res();
})

// Initialize the apps
scrapeShirtCatalogue.then(createCSVData).then(scrapeWebsite).then(scrapeShirtDetails).then(writeCSVFile)



