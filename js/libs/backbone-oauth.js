/*!
 * oauth2.js v0.2.2
 * Copyright 2013, Hannes Moser (@eliias)
 */

/*  11/22/14 - KSM
 * Extended for OAuth 2.0 authorization code flow for Chrome Extension
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone) {


    var OAuthLocalStorage = function(options) {
        this.storageKey = options && options.key ? options.key : '__oauth2',
        this.storage  = window.localStorage;
    }
    _.extend(OAuthLocalStorage.prototype, {
        load: function() {
            var state = this.storage.getItem(this.storageKey);
            //return state ? JSON.parse(state) : {};
            return null;
        },
        save: function(state) {
           this.storage.setItem(this.storageKey, JSON.stringify(state)); 
        },
        clear: function() {
            if (this.storage.getItem(this.storageKey)) {
                this.storage.removeItem(this.storageKey);
            }
        }
    });


    /**
     * The interval between two checks if token expires
     * Default value is 60000 ms = 1 minute
     *
     * @type Number Time in ms
     */
    var AUTO_REFRESH_TIME = 60000;

    /**
     * The maximum time before an access_token must be renewed
     * Default value is 600000ms = 10 minutes
     *
     * @type Number Time in ms
     */
    var REFRESH_MAX_TIME = 600000;


    /**
     * Backbone.OAuth2 object
     *
     * @type Backbone.OAuth2
     */
    var OAuth2 = function(opts) {

        /**
         * Extend defaults with options
         * @type {*|void}
         */
        options = _.extend({
            storage: new OAuthLocalStorage(),
            autoRefresh : true
        }, opts);

        if (options.authzUrl)       this.authzUrl = options.authzUrl;
        if (options.accessUrl)      this.accessUrl = options.accessUrl;
        if (options.redirectUrl)    this.redirectUrl = options.redirectUrl;
        if (options.refreshUrl)     this.refreshUrl = options.refreshUrl;
        if (options.revokeUrl)      this.revokeUrl = options.revokeUrl;
        if (options.grantType)      this.grantType = options.grantType;
        if (options.clientId)       this.clientId = options.clientId;
        if (options.clientSecret)   this.clientSecret = options.clientSecret;
        if (options.scopes)         this.scopes = options.scopes;
        if (options.storage)        this.storage = options.storage;


        /**
         * Set current state object to null. This object is later used to
         * store the last response object from either an valid or invalid
         * authentication attempt.
         *
         * Example:
         * {
         *   "access_token": "52d8670532483516dbe1dfc55d3de2b148b63995",
         *   "expires_in": "2419200",
         *   "token_type": "bearer",
         *   "scope": null,
         *   "time": null,
         *   "refresh_token": "be4b157c57bfbd79f0183b9ebd7879326d080ad8"
         * }
         *
         * @type {object}
         */
        this.state = {
            access_token: null,
            refresh_token: null,
            token_type: null,
            expires_in: null,
            scope: null,
            time: null
        };
        this.load();

        /**
         * If autorefresh is enabled, check expiration date of access_token
         * every second.
         */
        if (options.autoRefresh) {
            var self = this;
            var triggerRefresh = function myself (auth) {
                if (self.isAuthenticated()) {
                    if (self.expiresIn() < REFRESH_MAX_TIME) {
                        console.info('A new access-token/refresh-token has been requested.');
                        auth.refresh();
                    }
                    setTimeout(triggerRefresh, AUTO_REFRESH_TIME, auth);
                }
            };
            setTimeout(triggerRefresh, AUTO_REFRESH_TIME, self);
        }

        /*
         * Invoke initialize method
         */
        this.initialize.apply(this, arguments);
    };

    /**
     * Setup all inheritable <strong>Backbone.OAuth2</strong> properties and methods.
     */
    _.extend(OAuth2.prototype, Backbone.Events, {
        /**
         * Initialize is an empty function by default. Override it with your
         * own initialization logic.
         *
         * @returns {void}
         */
        initialize: function () {
        },

        /**
         * Verify if the current state is "authenticated".
         *
         * @returns {Boolean}
         */
        isAuthenticated: function () {
            // Always load
            this.load();

            // Check for expired access_token
            var time = new Date().getTime();

            if (typeof this.state !== 'undefined' && this.state !== null) {
                // Check if token has already expired
                if (this.state.expires_in + this.state.time > time) {
                    return true;
                }
            }

            return false;
        },

        hasRefreshToken: function() {
           return _.isObject(this.state) && _.isString(this.state.refresh_token);
        },

        /**
         * Get epxiration time for the access-token. This method should be used to
         * request a new access-token after ~50% of the access-token lifetime.
         * This method always returns a positive integer or 0 if not authenticated.
         *
         * @returns {int} Seconds until access-token will be expired
         */
        expiresIn: function () {
            if (this.isAuthenticated()) {
                var time = new Date().getTime();
                return (this.state.time + this.state.expires_in) - time;
            }
            return 0;
        },

        /**
         * Capitalizes a given string in order to return the correct name for the
         * token type.
         *
         * @param {string} str
         * @returns {string}
         */
        getNormalizedTokenType: function (str) {
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },

        /**
         * Returns the full authorization header
         *
         * @returns {object}
         */
        getAuthorizationHeader: function () {
            if (this.isAuthenticated()) {
                return {
                    'Authorization': this.getNormalizedTokenType(this.state.token_type) + ' ' + this.state.access_token
                };
            }
            throw 'Unauthorized, please use access() to authenticate first';
        },

        /**
         * Get value for STORAGE_KEY from localStorage
         *
         * @returns {object,boolean}
         */
        load: function () {
            // Load
            this.state = this.storage.load();
            return this.state;
        },

        /**
         * Save state with STORAGE_KEY to localStorage
         *
         * @param {object} state
         * @returns {void}
         */
        save: function (state) {
            // Save
            this.state = state;
            this.storage.save(state);
        },

        /**
         * Clear value assigned to STORAGE_KEY from localStorage
         *
         * @returns {void}
         */
        clear: function () {
            this.state = null;
            this.storage.clear();
        },

        /**
         * Authenticate
         *
         * @returns {jQuery Deferred Object}
         */
        authenticate: function () {
            var self = this;

            return self.authorize().pipe(function(response) {
                return self.access(response.code)
            })
        },


        authorize: function() {

            var self = this;
            var flowDfr = $.Deferred();

            console.log("[OAuth 2.0 Authorization Code Flow] => obtaining authorization_code");
            window.chrome.identity.launchWebAuthFlow({
              url: self.authzUrl + 
                  '?response_type=code' + 
                  '&client_id=' + self.clientId + 
                  '&scope=' + encodeURIComponent(self.scopes.join(' ')) + 
                  '&redirect_uri=' + encodeURIComponent(self.redirectUrl),
              interactive: true
            }, function(responseUrl) {
                console.log("[OAuth 2.0 Authorization Code Flow] <= authorization_code response %s", responseUrl);
                if (!_.isEmpty(responseUrl)) {
                    var parser = document.createElement('a');
                    parser.href = responseUrl;
                  
                    var params = {}, queries, temp, i, l;
                    queries = parser.search.indexOf("?") === 0 ? parser.search.substring(1) : parser.search;
                    queries = queries.split("&");
                    for (i = 0, l = queries.length; i < l; i++ ) {
                      temp = queries[i].split('=');
                      params[temp[0]] = temp[1];
                    }

                    self.trigger('authorize', params, self);
                    flowDfr.resolve(params);
                } else {
                    self.trigger('error', 'No authorization code found, please authorize this application.', this);
                    flowDfr.reject();
                }
            });

            return flowDfr;
        },

        /**
         * Redeems authorization_code grant for access_token with OAuth 2.0 token endpoint
         *
         * @param {string} code
         * @returns {jQuery Deferred Object}
         */
        access: function (code) {
            // Store a reference to the object
            var self = this;

            // Check if we have already authenticated
            if (this.isAuthenticated()) {
                self.trigger('success', this.state, this);
                console.log("[OAuth 2.0 Authorization Code Flow] <= existing access_token is valid");
                return $.Deferred().resolve(this.state);
            }

            /*
             * Save time before request to avoid race conditions with expiration timestamps
             */
            var time = new Date().getTime();

            console.log("[OAuth 2.0 Authorization Code Flow] => redeeming authorization_code for access_token");

            // Request a new access-token/refresh-token
            return $.ajax({
                url: self.accessUrl,
                type: 'POST',
                data: {
                    grant_type      : 'authorization_code',
                    client_id       : self.clientId,
                    client_secret   : self.clientSecret,
                    code            : code,
                    redirect_uri    : self.redirectUrl
                },
                dataType: 'json',

                /**
                 * Success event, triggered on every successfull
                 * authentication attempt.
                 *
                 * @param {object} response
                 * @returns {void}
                 */
                success: function (response, status, xhr) {
                    console.log("[OAuth 2.0 Authorization Code Flow] <= access_token response %s", JSON.stringify(response));
                    
                    /*
                     * Extend response object with current time
                     */
                    response.time = time;

                    // Cast expires_in to Int and multiply by 1000 to get ms
                    response.expires_in = parseInt(response.expires_in) * 1000;

                    // Store to localStorage too(to avoid double authentication calls)
                    //self.save(response, response.expires_in - timediff);
                    self.save(response);
                    self.trigger('access', response, this);
                },

                /**
                 * Error event, triggered on every failed authentication attempt.
                 *
                 * @param {object} response
                 * @returns {void}
                 */
                error: function (xhr, status, errorThrown) {
                    self.trigger('error', xhr.responseText, this);
                }
            });
        },

        /**
         * Request a new access_token and request_token by sending a valid
         * refresh_token
         *
         * @returns {jQuery Deferred Object}
         */
        refresh: function () {
            // Store a reference to the object
            var self = this;

            // Load
            if (!self.hasRefreshToken()) {
                self.trigger('error', 'No authorization state found, please use the access method first.', this);
                return $.Deferred().reject(JSON.stringify({
                    error: "invalid_grant",
                    error_description: "Invalid refresh token"
                }));
            }

            /*
             * Save time before request to avoid race conditions with expiration
             * timestamps
             */
            var time = new Date().getTime();

            console.log("[OAuth 2.0 Authorization Code Flow] => requesting new access_token with existing refresh_token");

            // Request a new access-token/refresh-token
            return $.ajax({
                url: self.refreshUrl,
                type: 'POST',
                dataType: 'json',
                data: {
                    grant_type      : 'refresh_token',
                    client_id       : self.clientId,
                    client_secret   : self.clientSecret,
                    refresh_token   : self.state.refresh_token
                },
          
                /**
                 * Success event, triggered on every successfull
                 * authentication attempt.
                 *
                 * @param {object} response
                 * @returns {void}
                 */
                success: function (response, status, xhr) {
                    console.log("[OAuth 2.0 Authorization Code Flow] <= access_token response %s", JSON.stringify(response));
                    
                    /*
                     * Extend response object with current time
                     * Get timediff before and after request for localStorage
                     */
                    response.time = time;

                    // Cast expires_in to Int and multiply by 1000 to get ms
                    response.expires_in = parseInt(response.expires_in) * 1000;

                    // Store to localStorage too(faster access)
                    //self.save(response, response.expires_in - timediff);
                    self.save(response);
                    self.trigger('refresh', response, this);
                },

                /**
                 * Error event, triggered on every failed authentication attempt.
                 *
                 * @param {object} response
                 * @returns {void}
                 */
                error: function (xhr, status, errorThrown) {
                    self.trigger('error', xhr.responseText, this);
                }
            });
        },

        /**
         * Revoke OAuth2 access if a valid token exists and clears related
         * properties (access_token, refresh_token)
         *
         * @returns {void}
         */
        revoke: function () {
            // Store a reference to the object
            var self = this;

            /*
             * If we are not authenticated, just clear state property
             */
            if (!this.isAuthenticated()) {
                self.clear();
                return self.trigger('revoke', null, this);
            }

            // Build header
            var accessToken = this.state.access_token;


            console.log("[OAuth 2.0 Authorization Code Flow] => revoking refresh_token");


            // Request a new access-token/refresh-token
            return $.ajax({
                url: self.revokeUrl,
                type: 'POST',
                dataType: 'text', // Force text, maybe someone tries to be cool and set application/json with no content
                data: {
                    token           : accessToken,
                    token_type_hint : 'access_token'
                },
                headers: this.getAuthorizationHeader(),

                /**
                 * Success event, triggered on every successfull
                 * revokation attempt.
                 *
                 * @param {object} response
                 * @returns {void}
                 */
                success: function (response, status, xhr) {
                    self.clear();
                    self.trigger('revoke', response, this);
                },

                /**
                 * Error event, triggered on every failed authentication attempt.
                 *
                 * @param {object} xhr
                 * @param {object} ajaxOptions
                 * @param {object} thrownError
                 * @returns {void}
                 */
                error: function (xhr, status, errorThrown) {
                    self.trigger('error', xhr.responseText, this);
                }
            });
        },
        authorizedSync: function(method, model, options) {
            options = options ? _.clone(options) : {};
            if (options.headers === undefined) options.headers = {};
            _.extend(options.headers, this.getAuthorizationHeader());
            return Backbone.sync(method, model, options)
        },

        sync: function(method, model, options) {
            var self = this;

            if (this.isAuthenticated()) {
                return self.authorizedSync(method, model, options);
            } else {
                if (self.hasRefreshToken()) {
                    return self.refresh().pipe(function() {
                        return self.authorizedSync(method, model, options);
                    }, function(error) {
                        console.log("Unable to obtain a new access_token with existing refresh_token due to error %s", 
                            _.isObject(error) ? JSON.stringify(error) : error);
                        self.authenticate().pipe(function() {
                            return self.authorizedSync(method, model, options);
                        });
                    });
                } else {
                    self.authenticate().pipe(function() {
                        return self.authorizedSync(method, model, options);
                    });
                }
            }
        }
    });

    return OAuth2;
});