/**
 * ConvertController
 *
 * @description :: Server-side logic for managing Converts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
/*global conversion*/
/*global sails*/

var Promise = require('bluebird');
var zip = require('jszip');
var fs = require('fs');

module.exports = {
	index: function(req, res){
	    res.view();
	},
	
	upload: function(req, res){
	    req.file("uploads").upload({ maxBytes: 15000000000 }, function(err, files){
	        if (err){
	            return res.serverError(err);
	        }
	        var promises = [];
	       for(var i=0;i<files.length;i++){
	           var f = files[i];
	           promises[promises.length] = conversion.handleFile(f);
	       }
           var zipFile = new zip();
	       Promise.each(promises, function(items){
               if (!Array.isArray(items)){
                   items = [items];
               }
               items.forEach(function(item){
	               zipFile.file(item, fs.readFileSync(sails.config.appPath + "/assets/converted/" + item));
               });
	       }).then(function(){
   	           res.attachment();
	           zipFile.generateNodeStream({base64: false, compress: 'DEFLATE'}).pipe(res);
	       });
	    });
	},
	

};

