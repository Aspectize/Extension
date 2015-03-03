/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

function jq(myid) {
    return "#" + myid.replace(/(:|;|\.|\[|\])/g, "\\$1");
}

Global.JQueryClientService = {

   aasService:'JQueryClientService',
   aasPublished:true,
      
   PositionFlyOut: function (controlSourceName, flyOutPanelName, myPosition, atPosition) {
       if (flyOutPanelName) {
           var uiService = Aspectize.Host.GetService('UIService');
           var view = uiService.ToggleView(flyOutPanelName);

           if (view) {
               myPosition = myPosition || 'left top';
               atPosition = atPosition || 'left bottom';
               var options = {
                   my: myPosition,
                   at: atPosition,
                   of: jq(controlSourceName)
               };
               $("#" + flyOutPanelName).css({
                   position: 'absolute',
                   right: 'auto',
                   bottom: 'auto'
               });

               $("#" + flyOutPanelName).position(options);
           }
       }
   }
};

