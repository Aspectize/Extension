/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.LinkedInConnectJS = {

    aasService: 'LinkedInConnectJS',

    serviceName: null,
    cmdUrl: null,
    autoLogin: false,

    Init: function (configuredServiceName, params) {

        if (configuredServiceName) {

            if (window.lnAspectizeInit) return;

            this.serviceName = configuredServiceName;
            this.cmdUrl = 'Server/' + configuredServiceName + '.RedirectToOAuthProvider.json.cmd.ashx';

            var info = Aspectize.Host.ExecuteCommand('Server/' + configuredServiceName + '.GetApplictionInfo');

            var This = this;
            window.lnAspectizeInit = function () {

                if (info.AutoLogin) {

                    This.Connect(false, true);
                }
            };

            (function (d) {

                var initData = "\napi_key:" + info.ApiKey;
                initData += "\nonLoad:lnAspectizeInit\n"
                initData += "\nauthorize:" + (info.AutoLogin ? "true\n" : "false\n");

                var js = d.createElement('script');;
                js.src = "//platform.linkedin.com/in.js";
                js.innerHTML = initData;

                d.head.appendChild(js);

            })(document);

        }
    },

    Connect: function (rememberMe) {

        // Automatically called from Init
        var automaticCall = arguments.length > this.Connect.length;

        if (this.serviceName) {

            var configuredServiceName = this.serviceName;
            var cmdUrl = this.cmdUrl;

            var doJob = function () {

                var svc = Aspectize.Host.GetService('SecurityServices');

                IN.API.Raw('/people/~:(id,email-address)?scope=r_basicprofile+r_emailaddress').method('GET').result(function (r) {

                    var params = automaticCall ? { action: 'validateUser' } : null;

                    Aspectize.HttpForm('GET', cmdUrl, params, function (data) {

                        var email = r.emailAddress || '404';
                        var lnId = r.id || null;
                        svc.Authenticate(email + '@LinkedIn', lnId, rememberMe);
                    });
                });
            };

            if (IN.User.isAuthorized()) {

                doJob();

            } else if (!automaticCall) {

                IN.User.authorize(doJob);
            }

        } else Aspectize.Throw('LinkedInConnectJS.Connect :  Init with configuredServiceName was not called !', -1);
    },

    SignOut: function (logOutFromLinkedInAlso) {

        var svc = Aspectize.Host.GetService('SecurityServices');
        svc.SignOut();

        if (logOutFromLinkedInAlso) {

            IN.User.logout(function () { });
        }
    }
};


Aspectize.Extend("SignInButton", {

    Properties: {},
    Events: ['Click'],

    Init: function (elem) {

        elem.className = "LinkedInConnect";
        elem.innerHTML = '<a style=""> </a>';

        Aspectize.AddHandler(elem, "click", function () {

            Global.LinkedInConnectJS.Connect(true, false);

            Aspectize.UiExtensions.Notify(elem, 'Click', { Html: elem.innerHTML });
        });

        //Aspectize.UiExtensions.AddPropertyChangeObserver(elem, function (sender, arg) {

        //    if (arg.Name === 'Html') {

        //       // elem.innerHTML = arg.Value || "";
        //    }
        //});
    }

});
