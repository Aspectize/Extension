
Global.GoogleLineChartBuilder = {

    aasService: 'GoogleLineChartBuilder',
    aasPublished: false,

    Build: function (controlInfo) {

        controlInfo.DrawGoogleTable = function (control, data) {

            var options = {
                title: Aspectize.UiExtensions.GetProperty(control, 'Title')
            };

            var chart = new google.visualization.LineChart(document.getElementById(control.id));
            chart.draw(data, options);
        }
    }
};

