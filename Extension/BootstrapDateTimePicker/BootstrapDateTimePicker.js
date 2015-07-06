﻿/* Bootstrap datetimepicker extension */
/* Build with http://eonasdan.github.io/bootstrap-datetimepicker */

Aspectize.Extend("BootstrapDateTimePicker", {
    Properties: { Value: null, MinDate: null, MaxDate: null, Stepping: 1, Format: '' },
    Events: ['OnValueChanged'],
    Init: function (elem) {

        var datePickerInitialized = false;

        function newPicker() {
            var options = {
                minDate: Aspectize.UiExtensions.GetProperty(elem, 'MinDate') || false,
                maxDate: Aspectize.UiExtensions.GetProperty(elem, 'MaxDate') || false,
                stepping: Aspectize.UiExtensions.GetProperty(elem, 'Stepping') || 1,
                format: Aspectize.UiExtensions.GetProperty(elem, 'Format') || 'DD/MM/YYYY HH:mm'
            };

            $(elem).datetimepicker(options).on('dp.change', function (e) {
                Aspectize.UiExtensions.ChangeProperty(elem, 'Value', e.date);
            });
        }

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            if ('Value' in arg) {
                $(sender).datetimepicker('date', arg.Value);
            } else if ('MinDate' in arg) {
                var mindate = arg.MinDate || false;
                $(sender).data("DateTimePicker").minDate(mindate);
            } else if ('MaxDate' in arg) {
                var maxdate = arg.MaxDate || false;
                $(sender).data("DateTimePicker").maxDate(maxdate);
            } else if ('Stepping' in arg) {
                var stepping = arg.Stepping || 1;
                $(sender).data("DateTimePicker").stepping(stepping);
            } else if ('Format' in arg) {
                var format = arg.Format || 'DD/MM/YYYY HH:mm';
                $(sender).data("DateTimePicker").format(format);

            }
        });

        newPicker();
    }
});

