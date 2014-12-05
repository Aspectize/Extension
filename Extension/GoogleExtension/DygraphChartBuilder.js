Global.DygraphChartBuilder = {

    aasService: 'DygraphChartBuilder',
    aasPublished: false,

    Build: function (controlInfo) {

        controlInfo.DrawGoogleTable = function (control, data) {

            controlInfo.aasDygraph = new Dygraph(control, data);
        };

        controlInfo.GoogleTableUpdated = function (control, data) {

            controlInfo.aasDygraph.updateOptions({ 'file': data });
        };
    }
};