/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Aspectize.Extend("Autosize", {
    Properties: {},
    Events: [],
    Init: function (elem) {
        autosize($(elem));
    }
});

Aspectize.Extend("JQueryButton", {
    Properties: {value:'', disabled:false},
    Events: ['click'],
    Init: function (elem) {
        $(elem).button();
        $(elem).on('click', function (e) { Aspectize.UiExtensions.Notify(elem, 'click', e); });
    }
});

Aspectize.Extend("JQueryAutoComplete", {
    Properties: { Url: '', value: '', Custom: false, MultiValue: false, MultiValueSeparator: ';', FillSelected: true },
    Events: ['OnSelectItem', 'OnSelectNewItem'],
    Init: function (elem) {
        $(elem).autocomplete({
            minLength: 0,
            focus: function () {
                // prevent value inserted on focus
                return false;
            }
        });
        function split(val) {
            return val.split(/,\s*/);
        }
        function extractLast(term) {
            return split(term).pop();
        }
        Aspectize.UiExtensions.AddPropertyChangeObserver(elem, function (sender, arg) {
            var url = Aspectize.UiExtensions.GetProperty(elem, 'Url');
            var multiValue = Aspectize.UiExtensions.GetProperty(elem, 'MultiValue');
            var fillSelected = Aspectize.UiExtensions.GetProperty(elem, 'FillSelected');

            if (arg.Name === 'Url') {
                url = arg.Value;
            } else if (arg.Name === 'MultiValue') {
                multiValue = arg.Value;
            } else if (arg.Name === 'FillSelected') {
                fillSelected = arg.Value;
            } else if (arg.Name === 'value') {
                $(sender).val(arg.Value);
            }

            $(function () {
                var jqVersion = jQuery.fn.jquery;
                var attribute = "autocomplete";

                if (jqVersion >= "1.9") {
                    attribute = "uiAutocomplete";
                }

                if (multiValue) {
                    $(elem).autocomplete({
                        source: function (request, response) {
                            $.getJSON(url, {
                                term: extractLast(request.term)
                            }, response);
                        },
                        select: function (event, ui) {
                            if (fillSelected) {
                                var currentValue = Aspectize.UiExtensions.GetProperty(elem, 'value');
                                var terms = split(currentValue);
                                // remove the current input
                                terms.pop();
                                terms.push(ui.item.label);

                                // add placeholder to get the comma-and-space at the end
                                terms.push("");
                                var newValue = terms.join(", ");
                                Aspectize.UiExtensions.ChangeProperty(elem, 'value', newValue);
                                $(elem).val(newValue);
                                //event.preventDefault();
                                event.stopPropagation();
                            }
                            Aspectize.UiExtensions.ChangeProperty(elem, 'Custom', false);
                            Aspectize.UiExtensions.Notify(elem, 'OnSelectItem', ui.item.value);
                            return false;
                        },
                        change: function (event, ui) {
                            if (ui.item == null) {
                                Aspectize.UiExtensions.Notify(elem, 'OnSelectNewItem', this.value);
                            }
                        }

                    }).data(attribute)._renderItem = function (ul, item) {
                        return $('<li class="ui-menu-item" role="presentation"></li>')
                            .data("item.autocomplete", item)
                            .append('<a><span class="' + item.type + '"></span>' + item.label + '</a>')
                            .appendTo(ul);
                    };

                } else {

                    $(elem).autocomplete({
                        source: url,
                        select: function (event, ui) {
                            if (fillSelected) {
                                Aspectize.UiExtensions.ChangeProperty(elem, 'value', ui.item.label);
                                $(elem).val(ui.item.label);
                            }
                            Aspectize.UiExtensions.ChangeProperty(elem, 'Custom', false);
                            Aspectize.UiExtensions.Notify(elem, 'OnSelectItem', ui.item.value);
                            return false;
                        },
                        change: function (event, ui) {
                            if (ui.item == null) {
                                Aspectize.UiExtensions.Notify(elem, 'OnSelectNewItem', this.value);
                            }
                        }
                    }).data(attribute)._renderItem = function (ul, item) {
                        return $('<li class="ui-menu-item" role="presentation"></li>')
                            .data("item.autocomplete", item)
                            .append('<a><span class="' + item.type + '"></span>' + item.label + '</a>')
                            .appendTo(ul);
                    };
                }
            });
        });

        $(elem).keyup(function () {
            var newValue = $(elem).val();
            Aspectize.UiExtensions.ChangeProperty(elem, 'value', newValue);
            Aspectize.UiExtensions.ChangeProperty(elem, 'Custom', true);
        });
    }
});

Aspectize.Extend("JQueryMask", {
    Properties: { Value: '', Mask: '' },
    Events: [],
    Init: function (elem) {

        var options = {
            onComplete: function (newValue) {
                var newValue = $(elem).data('mask').getCleanVal();
                if (newValue !== Aspectize.UiExtensions.GetProperty(elem, 'Value')) {
                    Aspectize.UiExtensions.ChangeProperty(elem, 'Value', newValue);
                }
            },
            onKeyPress: function (cep, event, currentField, options) {
                /*console.log('An key was pressed!:', cep, ' event: ', event, 'currentField: ', currentField, ' options: ', options);*/
            },
            onChange: function (newValue) {
                /*
                var newValue = $(elem).data('mask').getCleanVal();
                if (newValue !== Aspectize.UiExtensions.GetProperty(elem, 'Value')) {
                Aspectize.UiExtensions.ChangeProperty(elem, 'Value', newValue);
                }
                */
            }
        };

        var m = Aspectize.UiExtensions.GetProperty(elem, 'Mask');

        if (m) {
            $(elem).mask(m, options);
        }

        $(elem).on('blur', function () {
            Aspectize.UiExtensions.ChangeProperty(elem, 'Value', $(elem).data('mask').getCleanVal());
        });

        Aspectize.UiExtensions.AddPropertyChangeObserver(elem, function (sender, arg) {
            if (arg.Name == 'Mask') {
                $(sender).mask(arg.Value, options);
            }
            else if (arg.Name == 'Value') {
                $(sender).val(arg.Value);
            }
        });
    }
});

Aspectize.Extend("JQueryColorPicker", {
    Properties: { Value: '', DefaultValue: '', InLine: false, Theme: 'default' },
    Events: ['OnValueChanged'],
    Init: function (elem) {
        var jqminicolor = $(elem).minicolors ? $(elem).minicolors : $(elem).miniColors;

        jqminicolor.call($(elem), {
            change: function (hex, rgb) {
                Aspectize.UiExtensions.ChangeProperty(elem, 'Value', hex);
            }
        });

        Aspectize.UiExtensions.AddPropertyChangeObserver(elem, function (sender, arg) {
            if (arg.Name === 'Value') {
                jqminicolor.call($(elem), 'value', arg.Value);
            } else if (arg.Name === 'DefaultValue') {
                jqminicolor.call($(elem), 'settings', { 'defaultValue': arg.Value });
            } else if (arg.Name === 'InLine') {
                jqminicolor.call($(elem), 'settings', { 'inline': arg.Value });
            } else if (arg.Name === 'Theme') {
                jqminicolor.call($(elem), 'settings', { 'theme': arg.Value });
            }
        });
    }
});

Aspectize.Extend("JQueryDatePicker", {
    Properties: { Value: new Date(4100000000000), MinDate: null, MaxDate: null, DefaultDate: new Date(), Mask: '', DisplayFormat: '', FirstDay: 0, ChangeMonth: false, ChangeYear: false, YearRange: 'c-10:c+10', ShowButton: true, ShowOn: '', WithTime: false, ShowTime: true, OnlyTime: false, StepMinute: 1, TimeZone: null },
    Events: ['OnValueChanged'],
    Init: function (elem) {

        var datePickerInitialized = false;
        var modeWithTime = null;
        var modeOnlyTime = null;

        var dynOptionMap = {

            DefaultDate: 'defaultDate', DisplayFormat: 'dateFormat', FirstDay: 'firstDay',
            ChangeMonth: 'changeMonth', ChangeYear: 'changeYear', YearRange: 'yearRange',
            ShowTime: 'showTime', StepMinute: 'stepMinute'
        };

        function buildOptions(properties) {

            var langageInfo = Aspectize.CultureInfo.GetLanguageInfo();

            var showOnOption = Aspectize.UiExtensions.GetProperty(elem, 'ShowOn');

            if (!showOnOption) {
                showOnOption = Aspectize.UiExtensions.GetProperty(elem, 'ShowButton') ? 'button' : 'focus';
            }

            var dateCustomFormat = Aspectize.UiExtensions.JQuery.GetDateFormat();
            var boundFormat = Aspectize.UiExtensions.GetProperty(elem, 'DisplayFormat');

            if (boundFormat) dateCustomFormat = boundFormat;

            modeOnlyTime = Aspectize.UiExtensions.GetProperty(elem, 'OnlyTime');
            modeWithTime = modeOnlyTime || Aspectize.UiExtensions.GetProperty(elem, 'WithTime');

            var options = {

                showOn: showOnOption,
                dateFormat: dateCustomFormat,

                monthNamesShort: langageInfo.MonthNames[0],
                monthNames: langageInfo.MonthNames[1],
                dayNamesShort: langageInfo.DayNames[0],
                dayNames: langageInfo.DayNames[1],
                dayNamesMin: langageInfo.ShortDayNames,

                timeText: 'Time',
                hourText: 'Hour',
                minuteText: 'Minutes',
                currentText: 'Now',
                closeText: 'Close',

                buttonImage: "../Applications/JQueryExtension/images/date_add.png",
                buttonImageOnly: true,

                changeMonth: Aspectize.UiExtensions.GetProperty(elem, 'ChangeMonth'),
                changeYear: Aspectize.UiExtensions.GetProperty(elem, 'ChangeYear'),
                defaultDate: Aspectize.UiExtensions.GetProperty(elem, 'DefaultDate'),
                yearRange: Aspectize.UiExtensions.GetProperty(elem, 'YearRange'),
                stepMinute: Aspectize.UiExtensions.GetProperty(elem, 'StepMinute'),
                showTime: Aspectize.UiExtensions.GetProperty(elem, 'ShowTime'),
                firstDay: Aspectize.UiExtensions.GetProperty(elem, 'FirstDay'),
                /*controlType: 'select', */

                onSelect: function (dateText, inst) {

                    if (modeWithTime) return;

                    var value = $(elem).datepicker('getDate');

                    Aspectize.UiExtensions.ChangeProperty(elem, 'Value', value);
                },

                onClose: function (dateText, inst) {

                    if (modeWithTime) {

                        var value = $(elem).datetimepicker('getDate');

                        Aspectize.UiExtensions.ChangeProperty(elem, 'Value', value);
                    }
                }
            };           

            if (modeOnlyTime) options.timeOnly = true;

            var minDate = Aspectize.UiExtensions.GetProperty(elem, 'MinDate');

            if (minDate) {
                options.minDate = minDate;

                if (modeWithTime) {

                    options.minDateTime = minDate;
                }
            }

            var maxDate = Aspectize.UiExtensions.GetProperty(elem, 'MaxDate');

            if (maxDate) {

                options.maxDate = maxDate;

                if (modeWithTime) {

                    options.maxDateTime = maxDate;
                }
            }

            $(elem).on('change', function (e) {

                var f = modeWithTime ? 'datetimepicker' : 'datepicker';
                var value = $(elem)[f]('getDate');

                var v = value.valueOf();

                if ((!minDate && !maxDate) ||
                     (minDate && (minDate.valueOf() <= v)) ||
                     (maxDate && (maxDate.valueOf() >= v))
                ) {

                    Aspectize.UiExtensions.ChangeProperty(elem, 'Value', value);

                } else {

                    var errMessage = ""; 

                    if (minDate) {

                        errMessage = Aspectize.FormatString("{0:yyyy-MM-dd} must be greater than {1:yyyy-MM-dd}", value, minDate);

                    } else if (maxDate) {

                        errMessage = Aspectize.FormatString("{0:yyyy-MM-dd} must be less than {1:yyyy-MM-dd}", value, maxDate);
                    }
                }
            });

            return options;
        }

        var needsNewPicker = { WithTime: true, OnlyTime: true };

        function newPicker(control) {

            var options = buildOptions();
            var value = Aspectize.UiExtensions.GetProperty(elem, 'Value');

            if (modeWithTime) {

                $(elem).datetimepicker(options);
                $(elem).datetimepicker('setDate', value);

            } else {

                $(elem).datepicker(options);
                $(elem).datepicker('setDate', value);
            }

            var mask = Aspectize.UiExtensions.GetProperty(elem, 'Mask');
            if (mask) {

                $(elem).mask(mask, {
                    completed: function () {

                        //var newValue = this.val();

                        var value = $(elem).datepicker('getDate');

                        Aspectize.UiExtensions.ChangeProperty(elem, 'Value', value);
                    }
                });
            }
        }

        // Special treatment : Value, MinDate, MaxDate, ShowButton, WithTime, OnlyTime, readOnly
        function onPropertyChanged(sender, arg) {

            var jqSetter = modeWithTime ? $(sender).datetimepicker : $(sender).datepicker;

            if (arg.Name === 'Value') {

                jqSetter.call($(sender), 'setDate', arg.Value);

            } else if (arg.Name === 'MinDate') {

                if (modeWithTime) {

                    jqSetter.call($(sender), 'option', 'minDateTime', arg.Value);
                }

                jqSetter.call($(sender), 'option', 'minDate', arg.Value);

            } else if (arg.Name === 'MaxDate') {

                if (modeWithTime) {

                    jqSetter.call($(sender), 'option', 'maxDateTime', arg.Value);
                }

                jqSetter.call($(sender), 'option', 'maxDate', arg.Value);

            } else if (arg.Name === 'ShowButton') {

                var showOn = arg.Value ? 'button' : 'focus';

                jqSetter.call($(sender), 'option', 'showOn', showOn);

            } else if (arg.Name in dynOptionMap) {

                var option = dynOptionMap[arg.Name];

                jqSetter.call($(sender), 'option', option, arg.Value);

            } else if (arg.Name.toLowerCase() === 'readonly') {

                sender.readOnly = Boolean(arg.Value);

            } else {

                Aspectize.Throw(Aspectize.formatString("JQueryDatePicker: '{0}' is not a dynamically bound option !", arg.Name));
            }
        }

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            if (!datePickerInitialized) {

                newPicker(elem); datePickerInitialized = true;

            } else {

                var mustRebuildPicker = false;
                for (var p in arg) {

                    if (needsNewPicker[p]) { mustRebuildPicker = true; break; }

                    onPropertyChanged(elem, { Name: p, Value: arg[p] });
                }

                if (mustRebuildPicker) {

                    $(elem).datepicker('destroy');
                    newPicker(elem);
                }
            }
        });
    }
});


