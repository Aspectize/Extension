/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />


Aspectize.Extend("BootstrapSlider", {

    Properties: { V1: 0, V2: 0, MinValue: 0, MaxValue: 100, Step: 1, Orientation: 'horizontal', Enabled: true, Ticks: "", TickLabels: "" },
    Events: ['OnV1Changed', 'OnV2Changed'],
    Init: function (elem) {

        var optionMap = { MinValue: 'min', MaxValue: 'max', Step: 'step', Orientation: 'orientation' };
        var theSlider = null;

        var hasTwoValues = false;

        function buildNewSlider() {

            if (theSlider) theSlider.destroy();

            var value = 0;

            var initialValues = Aspectize.UiExtensions.GetProperty(elem, 'InitialValues');

            if (initialValues) {

                var errMessage = '';

                if (initialValues.constructor === Array) {

                    value = initialValues[0];
                    Aspectize.UiExtensions.ChangeProperty(elem, 'V1', value);
                    Aspectize.UiExtensions.Notify(elem, 'OnV1Changed', value);

                    if (initialValues.length === 2) {

                        value = initialValues;
                        hasTwoValues = true;

                        Aspectize.UiExtensions.ChangeProperty(elem, 'V2', initialValues[1]);
                        Aspectize.UiExtensions.Notify(elem, 'OnV2Changed', initialValues[1]);

                    } else if (initialValues.length > 2) errMessage = ' You have ' + initialValues.length + '.';

                } else errMessage = " You don't have an array.";

                if (errMessage) {

                    Aspectize.Throw(elem.id + ' BootstrapSlider : InitialValues can only be set to an array of one or two numbers !' + errMessage);
                }
            }

            var options = { value: value };
            for (var p in optionMap) {

                options[optionMap[p]] = Aspectize.UiExtensions.GetProperty(elem, p);
            }

            var sTicks = Aspectize.UiExtensions.GetProperty(elem, 'Ticks');
            if (sTicks) {

                var parts = sTicks.split(',');
                var ticks = [];
                for (var n = 0; n < parts.length; n++) {

                    ticks.push(Number(parts[n].trim()));
                }
                options.ticks = ticks;
            }

            var sLabels = Aspectize.UiExtensions.GetProperty(elem, 'TickLabels');
            if (sLabels) {

                options.ticks_labels = sLabels.split(',');
            }

            theSlider = new Slider(elem, options);


            theSlider.on('slideStop', function (x) {

                var v = theSlider.getValue();
                if (hasTwoValues) {

                    var v1 = v[0];
                    var V1 = Aspectize.UiExtensions.GetProperty(elem, 'V1');

                    if (v1 !== V1) {
                        Aspectize.UiExtensions.ChangeProperty(elem, 'V1', v1);
                        Aspectize.UiExtensions.Notify(elem, 'OnV1Changed', v1);
                    }

                    var v2 = v[1];
                    var V2 = Aspectize.UiExtensions.GetProperty(elem, 'V2');

                    if (v2 !== V2) {

                        Aspectize.UiExtensions.ChangeProperty(elem, 'V2', v2);
                        Aspectize.UiExtensions.Notify(elem, 'OnV2Changed', v2);
                    }

                } else {

                    Aspectize.UiExtensions.ChangeProperty(elem, 'V1', v);
                    Aspectize.UiExtensions.Notify(elem, 'OnV1Changed', v);
                }
            });

        }

        buildNewSlider();

        var currentOptions = theSlider.getAttribute();

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            var refresh = false;
            var currentOptions = theSlider.getAttribute();

            if (arg.Ticks || arg.TickLabels) {

                buildNewSlider();

            } else {

                for (var p in arg) {

                    switch (p) {

                        case 'V1': theSlider.setValue(arg.V1); break;

                        case 'Enabled': {

                            if (arg.Enabled && !currentOptions.enabled) {

                                theSlider.enable();

                            } else if (!arg.Enabled && currentOptions.enabled) {

                                theSlider.disable();
                            }

                        } break;

                        default: {

                            if (p in optionMap) {

                                theSlider.setAttribute(optionMap[p], arg[p]);
                                refresh = true;
                            }
                        } break;
                    }
                }
            }

            if (refresh) theSlider.refresh();

        });

    }
});


