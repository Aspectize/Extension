
Global.GoogleTableControlBuilder = {

    aasService: 'GoogleTableControlBuilder',
    aasPublished: false,

    Build: function (controlInfo) {

        controlInfo.DrawGoogleTable = function (control, data) {

            var pageSize = Aspectize.UiExtensions.GetProperty(control, 'PageSize');
            var page = 'disable';

            if (pageSize && pageSize > 0) {
                page = 'enable';
            }

            var options = {
                showRowNumber: Aspectize.UiExtensions.GetProperty(control, 'ShowRowNumber'),
                firstRowNumber:  Aspectize.UiExtensions.GetProperty(control, 'FirstRowNumber'),
                pageSize: pageSize,
                page: page
            };

            var table = new google.visualization.Table(document.getElementById(control.id));
            table.draw(data, options);

            google.visualization.events.addListener(table, 'select',
            function (e) {
                var selection = table.getSelection();
                Aspectize.UiExtensions.Notify(elem, 'OnRowClick', selection);
            });
        };

    }
};

