// Modify the responseText and paste it into your browser console
(function() {
    // create XMLHttpRequest proxy object
    var oldXMLHttpRequest = XMLHttpRequest;
    
    // define constructor for my proxy object
    XMLHttpRequest = function() {
        var actual = new oldXMLHttpRequest();
        var self = this;
        
        function modResponse(actualResponse) {
            // Modify the response here and return it
            console.log("actual response: " + actualResponse);
            return actualResponse.replace('<ORIGINAL_DATA>', '<NEW_DATA>');
        }
        
        // generic function for modifying the response that can be used by
        // multiple event handlers
        function handleResponse(prop) {
            return function() {
                if (this.responseText && self[prop]) {
                    self.responseText = modResponse(this.responseText);
                }
                // call callback that was assigned on our object
                if (self[prop]) {
                    return self[prop].apply(self, arguments);
                }
            }
        }
        
        function handleLoadEvent(fn, capture) {
            return actual.addEventListener("load", function(e) {
               if (this.responseText) {
                    self.responseText = modResponse(this.responseText);
                }
                return fn.apply(self, arguments);
            }, capture);
        }
        
        // properties we don't proxy because we override their behavior
        this.onreadystatechange = null;
        this.responseText = null;
        this.onload = null;
        if (actual.addEventListener) {
            this.addEventListener = function(event, fn, capture) {
                if (event === "load") {
                    return handleLoadEvent(fn, capture);
                } else {
                    return actual.addEventListener.apply(actual, arguments);
                }
            }
        }
        
        // this is the actual handler on the real XMLHttpRequest object
        actual.onreadystatechange = handleResponse("onreadystatechange");        
        actual.onload = handleResponse("onload");
        
        // iterate all properties in actual to proxy them according to their type
        // For functions, we call actual and return the result
        // For non-functions, we make getters/setters
        // If the property already exists on self, then don't proxy it
        for (var prop in actual) {
            // skip properties we already have - this will skip both the above defined properties
            // that we don't want to proxy and skip properties on the prototype belonging to Object
            if (!(prop in self)) {
                // create closure to capture value of prop
                (function(prop) {
                    if (typeof actual[prop] === "function") {
                    // define our own property that calls the same method on the actual
                        Object.defineProperty(self, prop, {
                            value: function() {return actual[prop].apply(actual, arguments);}
                        });
                    } else {
                        // define our own property that just gets or sets the same prop on the actual
                        Object.defineProperty(self, prop, {
                            get: function() {return actual[prop];},
                            set: function(val) {actual[prop] = val;}
                        });
                    }
                })(prop);
            }
        }
    }
})();
