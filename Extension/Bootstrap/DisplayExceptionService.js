
Global.DisplayExceptionService = {

    aasService: 'DisplayExceptionService',
    aasPublished: true,

    Display: function (x, m) {

        if (Aspectize.Host.IsLocalHost) alert(m);

        var uiService = Aspectize.Host.GetService('UIService');

        var message = '';

        if (x.Level && x.Level > 0) {
            message = x.Message;
        }
        else {
            message = "Your request did not succeed, we are sorry for inconvenience.";
            message = message + "<br />";
            message = message + "<br />";
            message = message + "If the problem persists, contact us."
        }

        uiService.SetContextValue('ErrorMessage', message);

        var bootStrapClientService = Aspectize.Host.GetService('BootStrapClientService');

        bootStrapClientService.ShowModal('ErrorModal');

        if (x.EndDisplay) {
            x.EndDisplay();
        }
    }
};

