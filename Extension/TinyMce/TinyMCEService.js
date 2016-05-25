/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.TinyMCEService = {

   aasService:'TinyMCEService',
   aasPublished:true,
      
   UnloadTinyMCE: function (controlName) {

       function unloadTinyMCE() {
           if (typeof (tinyMCE) !== 'undefined') {
               tinymce.each(tinyMCE.editors, function (e) {
                   if (typeof (e) !== 'undefined' && e.id == controlName) {
                       try {
                           tinymce.remove(e);
                       }
                       catch (ex) {

                       }
                   }
               });
           }
       }

       unloadTinyMCE();
   }

};

