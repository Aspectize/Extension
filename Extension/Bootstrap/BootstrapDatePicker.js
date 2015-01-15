/* Bootstrap datetimepicker extension */
/* Build with http://eonasdan.github.io/bootstrap-datetimepicker */

Global.BootstrapExtension = {

    aasService: 'BootstrapExtension',
    aasPublished: false,
    aasUiExtension: true,

    BootstrapDatePicker: {
        Properties: { Value: null, AutoHide: false, MinDate: null, MaxDate: null, PickDate: true, PickTime: true, SideBySide: false, useMinutes: true, UseSeconds: true, UseCurrent: true },
        Events: ['OnValueChanged'],
        Init: function (elem) {

            var datePickerInitialized = false;

            function newPicker() {
                var options = {
                    minDate: Aspectize.UiExtensions.GetProperty(elem, 'MinDate') || '1/1/1900',
                    pickDate: Aspectize.UiExtensions.GetProperty(elem, 'PickDate'),
                    pickTime: Aspectize.UiExtensions.GetProperty(elem, 'PickTime')
                };

                var maxDate = Aspectize.UiExtensions.GetProperty(elem, 'MaxDate');

                if (maxDate) {
                    options.maxDate = maxDate;
                }
                var autoHide = Aspectize.UiExtensions.GetProperty(elem, 'AutoHide');

                $(elem).datetimepicker(options).on('dp.change', function (e) {
                    Aspectize.UiExtensions.ChangeProperty(elem, 'Value', e.date);

                    if (autoHide) {
                        $(elem).data("DateTimePicker").hide();
                    }
                });
            }

            Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

                if ('Value' in arg) {

                    $(sender).datetimepicker('setDate', arg.Value);
                }
            });

            newPicker();
        }
    }
};

