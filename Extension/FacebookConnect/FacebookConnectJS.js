/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.FacebookConnectJS = {

   aasService:'FacebookConnectJS',
   
   serviceName: null,

   Init : function (configuredServiceName) {

       if (configuredServiceName) {

           this.serviceName = configuredServiceName;

           var key = Aspectize.Host.ExecuteCommand('Server/' + configuredServiceName + '.GetApplictionApiKey');

           window.fbAsyncInit = function () {
               FB.init({ appId: key, xfbml: true, version: 'v2.5'});
           };           

           (function (d, id) {

               if (d.getElementById(id)) return;

               var js = d.createElement('script'); js.id = id;               
               js.src = "//connect.facebook.net/en_US/sdk.js";

               d.head.appendChild(js);

           }(document, 'facebook-jssdk'));
       }
   },

   CreateAccount: function () {

       if (this.serviceName) {
           
           var configuredServiceName = this.serviceName;
           var cmdUrl = 'Server/' + configuredServiceName + '.RedirectToOAuthProvider.json.cmd.ashx';

           FB.getLoginStatus(function (r) {
               
               if (r.status !== 'connected') {

                   FB.login(function (r) {

                       if (r.status === 'connected') {

                           Aspectize.HttpForm('GET', cmdUrl, { action: 'create' });
                       }
                   });

               } else Aspectize.HttpForm('GET', cmdUrl, { action: 'create' });

           });
                     
       } else Aspectize.Throw('FacebookConnectJS.CreateAccount :  Init with configuredServiceName was not called !', -1);
   },

   Authenticate: function () {

       if (this.serviceName) {

           var configuredServiceName = this.serviceName;

           var svc = Aspectize.Host.GetService('SecurityServices');

           FB.login(function (r) {

               if (r.status === 'connected') {

                   var cmdUrl = 'Server/' + configuredServiceName + '.RedirectToOAuthProvider.json.cmd.ashx';
                   Aspectize.HttpForm('GET', cmdUrl, { action: 'login' });

                   FB.api('/me', 'get', { fields:'id,email' }, function (r) {

                       if (r.email && r.id) {

                           svc.Authenticate(r.email + '@Facebook', r.id, true);
                       }
                   });
               }
           });

       } else Aspectize.Throw('FacebookConnectJS.Authenticate :  Init with configuredServiceName was not called !', -1);
   },

   SignOut: function (logOutFromFacebookAlso) {

       var svc = Aspectize.Host.GetService('SecurityServices');
       svc.SignOut();

       if (logOutFromFacebookAlso) {

           FB.logout(function (r) {  });
       }
   }
};

