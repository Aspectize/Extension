/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.AspectizeMangoPayJS = {

   aasService:'AspectizeMangoPayJS',
   aasPublished:true,
         
   RegisterCard: function (mangoServiceName, userId, cardNumber, cardExpirationMMYY, cardCVS) {

       var info = Aspectize.Host.ExecuteCommand('Server/' + mangoServiceName + '.GetRegistrationInfoForUser', userId);

       if (info.IsRegistered === 'yes') return;

       mangoPay.cardRegistration.baseURL = info.MangoUrl;
       mangoPay.cardRegistration.clientId = info.ClientId;

       mangoPay.cardRegistration.init({
           cardRegistrationURL: info.CardRegistrationURL,
           preregistrationData: info.PreregistrationData,
           accessKey: info.AccessKey,
           Id: info.Id
       });

       var card = {"cardNumber":cardNumber, "cardExpirationDate":cardExpirationMMYY, "cardCvx": cardCVS, "cardType": 'CB_VISA_MASTERCARD' };

       var OnSuccess = function (r) {
           
           Aspectize.Host.ExecuteCommand('Server/' + mangoServiceName + '.SetCardIdForUser', userId, r.CardId);
       };

       var OnError = function (r) {

           var code = r.ResultCode;
           var message = r.ResultMessage;

           if (code) alert(code + ':' + message);
       };

       mangoPay.cardRegistration.registerCard(card, OnSuccess, OnError);

   }
};

