/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.BasicAuthClientService = {

   aasService:'BasicAuthClientService',
   aasPublished:true,
      
   SignUp: function (userName, pwd, pwdConfirm, basicAuthServiceName) {

       var message = '';

       if (!userName) {
           message = 'Invalid User Name';
       }

       if (!pwd || !pwdConfirm) {
           message = message || 'Invalid password';
       }

       if (pwd !== pwdConfirm) {
           message = message || 'Password and confirmation do not match';
       }

       if (!message) {
           var userValid = Aspectize.Host.ExecuteCommand('Server/' + basicAuthServiceName + '.IsUserNameAvailable', userName);

           if (!userValid) {
               message = 'User Name is not available';
           }
       }

       if (message) {
           $('.RegisterAlert').addClass('alert-danger');
           $('.RegisterAlert').html(message);
           $('.RegisterAlert').alert();
           return;
       }

       $('.RegisterAlert').removeClass('alert-danger');
       $('.RegisterAlert').html('');

       var pwdhash = Aspectize.Md5HashBase64(pwd);
       var result = Aspectize.Host.ExecuteCommand('Server/' + basicAuthServiceName +'.SignUp', userName, pwdhash);

       if (result) {
           $('.RegisterAlert').addClass('alert-success');
           $('.RegisterAlert').html('Register succeeded');
           $('.RegisterAlert').alert();

           this.Login(userName, pwd);

       } else {
           $('.RegisterAlert').addClass('alert-danger');
           $('.RegisterAlert').html('Register failed');
           $('.RegisterAlert').alert();
       }

   },

   Login: function (userName, pwd) {

       Aspectize.Host.ExecuteCommand('Browser/SecurityServices.Authenticate', userName, pwd);

       var currentUser = Aspectize.ExecutingContext.GetCurrentUser();

       if (!currentUser.IsAuthenticated) {

           $('.LoginAlert').addClass('alert-danger');
           $('.LoginAlert').html('Invalid user name or password.');
           $('.LoginAlert').alert();
       }
   }

};

