// this currently will bind all fields with 'data-bind' attributes
// to the 'store'. 

app.addSetter('databind.onInput', (data, bindPath, value) => {
    // console.log(`binding ${bindPath} to ${value}`);
    put(data, bindPath, value);

    /*!
    * Add items to an object at a specific path
    * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
    * @param  {Object}       obj  The object
    * @param  {String|Array} path The path to assign the value to
    * @param  {*}            val  The value to assign
    */
    function put(obj, path, val) {

        /**
         * If the path is a string, convert it to an array
         * @param  {String|Array} path The path
         * @return {Array}             The path array
         */
        var stringToPath = function (path) {

            // If the path isn't a string, return it
            if (typeof path !== 'string') return path;

            // Create new array
            var output = [];

            // Split to an array with dot notation
            path.split('.').forEach(function (item, index) {

                // Split to an array with bracket notation
                item.split(/\[([^}]+)\]/g).forEach(function (key) {

                    // Push to the new array
                    if (key.length > 0) {
                        output.push(key);
                    }

                });

            });

            return output;

        };

        // Convert the path to an array if not already
        path = stringToPath(path);

        // Cache the path length and current spot in the object
        var length = path.length;
        var current = obj;

        // Loop through the path
        path.forEach(function (key, index) {

            // Check if the assigned key shoul be an array
            var isArray = key.slice(-2) === '[]';

            // If so, get the true key name by removing the trailing []
            key = isArray ? key.slice(0, -2) : key;

            // If the key should be an array and isn't, create an array
            if (isArray && Object.prototype.toString.call(current[key]) !== '[object Array]') {
                current[key] = [];
            }

            // If this is the last item in the loop, assign the value
            if (index === length - 1) {

                // If it's an array, push the value
                // Otherwise, assign it
                if (isArray) {
                    current[key].push(val);
                } else {
                    current[key] = val;
                }
            }

            // Otherwise, update the current place in the object
            else {

                // If the key doesn't exist, create it
                if (!current[key]) {
                    current[key] = {};
                }

                // Update the current place in the object
                current = current[key];

            }

        });

    };



});

Reef.databind = function(reef){

    let el = document.querySelector(reef.elem);
    let store = reef.store;

    if ( !store ){
        console.error("Databind only works when using a store.");
        return;
    }

    // bind all elements on the page that have a data-bind item
    const bindData = debounce(() => {
        let elems = el.querySelectorAll("[data-bind]");

        for ( let i = 0; i < elems.length; ++i ){
            let elem = elems[i];
            let bindName = elem.getAttribute("data-bind");

            if ( bindName ){
                let val = get(store.data, bindName, "");

                // dom values are strings, convert back so we can compare safely
                if ( typeof(val) == 'array' ){
                    let strs = [];
                    for ( let i = 0; i < val.length; ++i ){
                        strs.push(val[i].toString());
                    }
                    val = strs;
                } else {
                    val = val.toString();
                }
            
                // multiple selects need special handling
                if ( elem.tagName == "SELECT" && elem.matches("[multiple]") ){
                    let options = elem.querySelectorAll("option");
                    for ( let i = 0; i < options.length; ++i ){
                        if ( val.indexOf(options[i].value) > -1 ){
                            options[i].selected = true;
                        }
                    }
                } else if ( elem.type == "radio" || elem.type == "checkbox" ){
                    if ( elem.value == val.toString() ){
                        elem.checked = true;
                    } else {
                        elem.checked = false;
                    }
                } else {
                    elem.value = val;
                }
            }
        }
    });

        

    el.addEventListener('input', (evt) => {

        let target = evt.target;
        let bindPath = target.getAttribute("data-bind");
        
        if (bindPath) {
            let val = target.value;

            if ( target.type == "checkbox" ){
                if ( ! target.checked ){
                    val = null;
                }
            }

            // multiple selects need special handling
            if ( target.tagName == 'SELECT' && target.matches("[multiple]") ){
                val = [];
                let options = target.querySelectorAll("option");
                for ( let i = 0; i < options.length; ++i ){
                    if ( options[i].selected ){
                        val.push(parseString(options[i].value));
                    }
                }
            }

            // for checkbox, radio, and select fields - map numeric and boolean values to
            // actual types instead of strings
            else if ( target.type == 'checkbox' || target.type == 'radio' ){
                val = parseString(val);
            }
            
            store.do('databind.onInput', bindPath, val);
            //put(store.data, bindPath, val);
        }
    });
   
    el.addEventListener('render', (evt) => {
        bindData();
    });

    // convert booleans and numbers
    function parseString(str){
        if ( str == "true" ){
            return true;
        } else if ( str == "false" ){
            return false;
        } else {
            return parseFloat(str) || str;
        }
    }


    /**
     * Debounce functions for better performance
     * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
     * @param  {Function} fn The function to debounce
     */
    function debounce(fn) {

        // Setup a timer
        var timeout;

        // Return a function to run debounced
        return function () {

            // Setup the arguments
            var context = this;
            var args = arguments;

            // If there's a timer, cancel it
            if (timeout) {
                window.cancelAnimationFrame(timeout);
            }

            // Setup the new requestAnimationFrame()
            timeout = window.requestAnimationFrame(function () {
                fn.apply(context, args);
            });

        }

    };


    /*!
    * Get an object value from a specific path
    * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
    * @param  {Object}       obj  The object
    * @param  {String|Array} path The path
    * @param  {*}            def  A default value to return [optional]
    * @return {*}                 The value
    */
    function get(obj, path, def) {

        /**
         * If the path is a string, convert it to an array
         * @param  {String|Array} path The path
         * @return {Array}             The path array
         */
        var stringToPath = function (path) {

            // If the path isn't a string, return it
            if (typeof path !== 'string') return path;

            // Create new array
            var output = [];

            // Split to an array with dot notation
            path.split('.').forEach(function (item) {

                // Split to an array with bracket notation
                item.split(/\[([^}]+)\]/g).forEach(function (key) {

                    // Push to the new array
                    if (key.length > 0) {
                        output.push(key);
                    }

                });

            });

            return output;

        };

        // Get the path as an array
        path = stringToPath(path);

        // Cache the current object
        var current = obj;

        // For each item in the path, dig into the object
        for (var i = 0; i < path.length; i++) {

            // If the item isn't found, return the default (or null)
            if (!current[path[i]]) return def;

            // Otherwise, update the current  value
            current = current[path[i]];

        }

        return current;

    };

}
