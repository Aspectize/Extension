/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.LinkedInConnectJS = {

   aasService:'LinkedInConnectJS',
   
   CreateAccount: function (configuredServiceName) {

       if (configuredServiceName) {

           IN.User.authorize(function () {

               var cmdUrl = 'Server/' + configuredServiceName + '.RedirectToOAuthProvider.json.cmd.ashx';

               Aspectize.HttpForm('GET', cmdUrl, null, function (r) { });

           }, this);

       } else Aspectize.Throw('LinkedInConnectJS.CreateAccount :  missing configuredServiceName', -1);
   },

   Authenticate: function () {

       var svc = Aspectize.Host.GetService('SecurityServices');

       IN.User.authorize(function () {

           IN.API.Raw('/people/~:(id,email-address)?scope=r_basicprofile+r_emailaddress').method('GET').result(function (r) {
               
               if(r.emailAddress && r.id) {

                   svc.Authenticate (r.emailAddress + '@LinkedIn', r.id, true);
               }
           });

       }, this);            
   },

   SignOut: function (logOutFromLinkedInAlso) {

       var svc = Aspectize.Host.GetService('SecurityServices');
       svc.SignOut();

       if (logOutFromLinkedInAlso === 'true') {

           IN.User.logout(function () {  }, this);
       }
   }
};


Aspectize.Extend("SignInButton", {

    Properties: { },
    Events: ['Click'],

    Init: function (elem) {

        elem.className = "LinkedInConnect";
        elem.innerHTML = '<a style=""> </a>';
        
        Aspectize.AddHandler(elem, "click", function () {

            Global.LinkedInConnectJS.Authenticate();

            Aspectize.UiExtensions.Notify(elem, 'Click', { Html: elem.innerHTML });
        });

        //Aspectize.UiExtensions.AddPropertyChangeObserver(elem, function (sender, arg) {

        //    if (arg.Name === 'Html') {

        //       // elem.innerHTML = arg.Value || "";
        //    }
        //});
    }

});
