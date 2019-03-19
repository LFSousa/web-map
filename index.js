const request = require('request');

/**
 * Initialize the object structure
 */
function Structure(struct){

    this.struct = struct;
    this.struct.fill = this.fill;
    this.filled = {};
}

/**
 * @param {Object} values Object with `values` to be replaced in the structure
 */
Structure.prototype.fill = function(values){

    let newObject = JSON.stringify(this.struct);
    let params = newObject.match(/(?<={{\s*).*?(?=\s*}})/gs);
    if(params){
        params.forEach(param => {

            if(values[param]){
                if(typeof values[param]!=="object") {
                    newObject = newObject.replace(`{{${param}}}`, values[param]);
                }
            }
        });
    }
    this.filled = JSON.parse(newObject);
    return this;
}

/**
 * - Create an endpoints instance to use for extract parameters
 * - The endpoints could be cascade, so if you use more than one endpoint, the next can use parameters extracted from previous one
 * 
 * - Every parameter to be replaced must be like {{param_name}}
 * @param {Object[]} endpoints Endpoint list
 * @param {string} endpoints[].uri Endpoint URI
 * @param {string} endpoints[].method
 * @param {?Object} endpoints[].body
 * @param {?Object} endpoints[].headers
 * @param {Object} endpoints[].params Params for extraction
 */
function Endpoints(endpoints){

    this.endpoints = endpoints.map(end => new Structure(end));
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}


/**
 * @param {?Object} values Object with `values` to be replaced in the structure
 * 
 * @returns {Promise} Promise object with the extracted parameters
 */
Endpoints.prototype.extractParams = async function(values = {}) {

    if (values) this.endpoints = this.endpoints.map(end => end.fill(values));

    return new Promise((resolve, reject) => {

        let params = {}, ctr = 0;
        
        asyncForEach(this.endpoints, async endPoint => {
                
                await new Promise((next, error) => {
                    request(endPoint.filled, (err, res, body) => {
                        

                    if(err) {
                        error(err);
                    }else {
                        let req = {};
                        try {
                            req = JSON.parse(body);
                        } catch(e){
                            error(e);
                        }
                        let param = endPoint.filled["params"];

                        Object.keys(param).forEach(key => {
                            if((indexes = param[key].match(/(?<=\[\s*).*?(?=\s*\])/gs))) {
                                let obj = req;

                                indexes.forEach(index => {
                                    if(!(index in obj)) reject(`Key ${index} not exists at endpoint ${endPoint.filled.uri}`);
                                    else obj = obj[index];
                                });

                                params[key] = obj;
                            }else{
                                params[key] = req;
                            }
                        });

                        if (params) this.endpoints = this.endpoints.map(end => {
                            return end.fill(params)
                        });

                        next();
            
                        ctr++;
                        if(ctr == this.endpoints.length) {
                            resolve(params);
                        } 
                    }
                });
            }).catch(reject);
        });
    });

}

module.exports = {Structure, Endpoints};