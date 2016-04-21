/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.FacebookConnectJS = {

    aasService: 'FacebookConnectJS',

    serviceName: null,
    cmdUrl: null,

    Init: function (configuredServiceName, params) {

        if (configuredServiceName) {

            if (window.fbAsyncInit) return;

            this.serviceName = configuredServiceName;
            this.cmdUrl = 'Server/' + configuredServiceName + '.RedirectToOAuthProvider.json.cmd.ashx';

            var This = this;
            var info = Aspectize.Host.ExecuteCommand('Server/' + configuredServiceName + '.GetApplictionInfo');

            window.fbAsyncInit = function () {

                var p = params || { version: 'v2.6', cookie: true };

                p.appId = info.ApiKey;

                FB.init(p);
                
                if (info.AutoLogin) {
                    
                    FB.getLoginStatus(function (r) {

                        if (r.status === 'connected') {
                            
                            var svc = Aspectize.Host.GetService('SecurityServices');

                            FB.api('/me', 'get', { fields: 'id,email' }, function (r) {

                                if (r.email && r.id) {

                                    Aspectize.HttpForm('GET', This.cmdUrl, { action: 'validateUser' }, function (data) {

                                        svc.Authenticate(r.email + '@Facebook', r.id, false);
                                    });
                                }
                            });
                        }
                    });
                }
            };

            (function (d, id) {

                if (d.getElementById(id)) return;

                var js = d.createElement('script'); js.id = id;
                js.src = "//connect.facebook.net/en_US/sdk.js";

                d.head.appendChild(js);

            }(document, 'facebook-jssdk'));
        }
    },

    Connect: function (login, rememberMe) {        

        if (this.serviceName) {

            var configuredServiceName = this.serviceName;
            var cmdUrl = this.cmdUrl;

            var doJob = function () {

                if (login) {

                    var svc = Aspectize.Host.GetService('SecurityServices');

                    FB.api('/me', 'get', { fields: 'id,email' }, function (r) {

                        if (r.email && r.id) {

                            Aspectize.HttpForm('GET', cmdUrl, null, function (data) {

                                svc.Authenticate(r.email + '@Facebook', r.id, rememberMe);
                            });
                        }                        
                    });                    

                } else {

                    Aspectize.HttpForm('GET', cmdUrl, null, function (r) { });
                }                
            };

            FB.getLoginStatus(function (r) {

                var fbConnected = (r.status === 'connected');

                if (!fbConnected) {

                    FB.login(function (r) {

                        if (r.status === 'connected') doJob();
                    });

                } else doJob();                               
            });

        } else Aspectize.Throw('FacebookConnectJS.Connect :  Init with configuredServiceName was not called !', -1);
    },

    SignOut: function (logOutFromFacebookAlso) {

        var svc = Aspectize.Host.GetService('SecurityServices');
        svc.SignOut();

        if (logOutFromFacebookAlso) {

            FB.logout(function (r) { });
        }
    }
};

