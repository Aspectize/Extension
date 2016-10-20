/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.FacebookConnectJS = {

    aasService: 'FacebookConnectJS',

    serviceName: null,
    cmdUrl: null,
    callBackCmd: null,

    Init: function (configuredServiceName, params) {

        if (configuredServiceName) {

            if (window.fbAsyncInit) return;

            this.serviceName = configuredServiceName;
            this.cmdUrl = 'Server/' + configuredServiceName + '.RedirectToOAuthProvider.json.cmd.ashx';

            var This = this;
            var info = Aspectize.Host.ExecuteCommand('Server/' + configuredServiceName + '.GetApplicationInfo');

            this.callBackCmd = info.AuthenticationCallback || null;

            window.fbAsyncInit = function () {

                var p = params || { version: 'v2.6', cookie: true };

                p.appId = info.ApiKey;

                FB.init(p);

                if (info.AutoLogin) {
            
                    This.Connect(false, true);
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

    Connect: function (rememberMe) {

        // Automatically called from Init
        var automaticCall = arguments.length > this.Connect.length;

        if (this.serviceName) {

            var configuredServiceName = this.serviceName;
            var cmdUrl = this.cmdUrl;
            var callBackCmd = this.callBackCmd;

            var callBack = function () {

                if (callBackCmd) Aspectize.Host.ExecuteCommand(callBackCmd);
            };

            var doJob = function () {
                
                var svc = Aspectize.Host.GetService('SecurityServices');

                FB.api('/me', 'get', { fields: 'id,name,gender,email' }, function (response) {

                    var params = automaticCall ? { action: 'validateUser' } : null;

                    Aspectize.HttpForm('GET', cmdUrl, params, function (data) {

                        var email = response.email || '404';
                        var fbId = response.id || null;
                        svc.Authenticate(email + '@Facebook', fbId, rememberMe);

                        callBack();
                    });
                });
            };

            FB.getLoginStatus(function (r) {

                var fbConnected = (r.status === 'connected');

                if (fbConnected) {

                    doJob();

                } else if(!automaticCall) {

                    FB.login(function (r) {

                        if (r.status === 'connected') doJob();
                    });
                }
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

