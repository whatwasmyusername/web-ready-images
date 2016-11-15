var sharp = require('sharp');
var Promise = require('bluebird');
var zip = require('jszip');
var fs = require('fs');
/*global sails*/
/*global conversion*/

module.exports = {
    handleZip: function(z){
        return new Promise(function(resolve, reject){
            fs.readFile(z.fd, function(err, data){
                if (err){
                    reject(err);
                }
                var zipFile = new zip();

                zipFile.loadAsync(data).then(function(zipFile){
                    var promises = [];
                    var names = [];
                    zipFile.forEach(function(name, file){
                        if (name.indexOf(".") !==0 && name.lastIndexOf('/')!=name.length-1){
                            var newName = conversion.jpgName(name);
                            promises.push(new Promise(function(resolve2, reject2){
                                var outName = sails.config.appPath + '/.tmp/uploads/' + name;
                                conversion.ensureDirectory(outName);
                                names.push(newName);
                                console.log("Loading: " + name);
                                zipFile
                                    .file(name)
                                    .nodeStream()
                                    .pipe(fs.createWriteStream(outName))
                                    .on("finish", function(){
                                        conversion.handleImage(outName, newName).then(function(result){
                                            resolve2(result);
                                        });
                                    });
                            }));
                        }
                    });
                    Promise.all(promises).then(function(){
                        resolve(names);
                    });
                });
                
            });
        });
    },
    
    jpgName: function(fn){
       var parts = fn.split(".");
       var ext = parts.pop().toLowerCase();
       if (ext != "jpg"){
           fn = parts.join(".") + ".jpg";
       }
        return fn;        
    },
    
    handleFile: function(f){
        if (f.type == 'application/zip'){
            return this.handleZip(f);
        }
       var path = f.fd;
       var fn = this.jpgName(f.filename);
       return this.handleImage(path, fn);
    },
    
    ensureDirectory(outName){
        var dir = outName.substr(0, outName.lastIndexOf('/'));
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
    },
    
    handleImage: function(path, fn){
       var outPath = sails.config.appPath +"/assets/converted/" + fn;
       this.ensureDirectory(outPath);
        console.log("Converting image: " + path, outPath);
       return new Promise(function(resolve, reject){
           var file = sharp(path);
           file.metadata(function(err, data){
               if (err){
                   return reject(err);
                }
                
                file
                    .background({r:255, g: 255, b:255, a: 1})
                    .flatten();
                if (data.width > 1024 || data.height > 1024){
                    file.resize(1024, 1024)
                    .embed();
                }
                    
                file.toFile(outPath, function(err){
                    if (err){
                        return reject(err);
                    }
                    resolve(fn);
                });
           });
            
        });
	}
}