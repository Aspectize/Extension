/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.FacebookConnectJS = {

   aasService:'FacebookConnectJS',
      
   CreateAccount: function (configuredServiceName) {

       if (configuredServiceName) {
           
           FB.login(function (r) {

               if (r.status === 'connected') {

                   var cmdUrl = 'Server/' + configuredServiceName + '.RedirectToOAuthProvider.json.cmd.ashx';

                   Aspectize.HttpForm('GET', cmdUrl, null, function (r) { });
               }
           });
          
       } else Aspectize.Throw('FacebookConnectJS.CreateAccount :  missing configuredServiceName', -1);
   },

   Authenticate: function () {

       var svc = Aspectize.Host.GetService('SecurityServices');

       FB.login(function (r) {

           if (r.status === 'connected') {
             
               FB.api('/me', function (r) {

                   if (r.email && r.id) {

                       svc.Authenticate(r.email + '@Facebook', r.id, true);
                   }
               });
           }
       });
   },

   SignOut: function (logOutFromFacebookAlso) {

       var svc = Aspectize.Host.GetService('SecurityServices');
       svc.SignOut();

       if (logOutFromFacebookAlso === 'true') {

           FB.logout(function (r) {  });
       }
   }
};

