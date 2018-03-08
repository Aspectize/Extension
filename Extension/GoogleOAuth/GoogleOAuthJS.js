/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisense.js" />
/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.GoogleCalendarJS = {

    aasService: 'GoogleCalendar',

    serviceName: null,

    Connect: function (configuredServiceName) {

        this.serviceName = configuredServiceName;
        var cmdUrl = 'Server/' + configuredServiceName + '.RedirectToOAuthProvider.json.cmd.ashx';

        Aspectize.HttpForm('GET', cmdUrl, null, function (data) {

            var x = 14;

        });
    },

    GetEvents: function (start, end) {

        if (this.serviceName === null) return;

        var getEventsCmd = 'Server/' + this.serviceName + '.GetEvents';

        Aspectize.Host.ExecuteCommand(getEventsCmd);
    }
};

