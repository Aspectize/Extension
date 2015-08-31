/* Aspectize JQueryRateIt extension */
/*! RateIt | v1.0.22 / 05/27/2014 | https://rateit.codeplex.com/license
    http://rateit.codeplex.com | Twitter: @gjunge
*/

Aspectize.Extend("JQueryRateIt", {
    Properties: { Value: 0, EditMode: true, Min: 0, Max: 5, Step: 0.5, Resetable: false, StarWidth: 16, StarHeight: 16 },
    Events: ['OnValueChanged'],
    Init: function (elem) {

        var option = {
            value: Aspectize.UiExtensions.GetProperty(elem, 'Value'),
            readonly: !Aspectize.UiExtensions.GetProperty(elem, 'EditMode'),
            min: Aspectize.UiExtensions.GetProperty(elem, 'Min'),
            max: Aspectize.UiExtensions.GetProperty(elem, 'Max'),
            step: Aspectize.UiExtensions.GetProperty(elem, 'Step'),
            resetable: Aspectize.UiExtensions.GetProperty(elem, 'Resetable'),
            starwidth: Aspectize.UiExtensions.GetProperty(elem, 'StarWidth'),
            starheight: Aspectize.UiExtensions.GetProperty(elem, 'StarHeight')
        };

        $(elem).rateit(option);

        $(elem).bind('rated', function (event, value) {
            Aspectize.UiExtensions.ChangeProperty(elem, 'Value', value);
        });

        Aspectize.UiExtensions.AddPropertyChangeObserver(elem, function (sender, arg) {
            if (arg.Name === 'Value') {
                $(elem).rateit('value', arg.Value);
            } else if (arg.Name === 'EditMode') {
                $(elem).rateit('readonly', !arg.Value);
            } else if (arg.Name === 'Min') {
                $(elem).rateit('min', arg.Value);
            } else if (arg.Name === 'Max') {
                $(elem).rateit('max', arg.Value);
            } else if (arg.Name === 'Step') {
                $(elem).rateit('step', arg.Value);
            } else if (arg.Name === 'Resetable') {
                $(elem).rateit('resetable', arg.Value);
            } else if (arg.Name === 'StarWidth') {
                $(elem).rateit('starwidth', arg.Value);
            } else if (arg.Name === 'StarHeight') {
                $(elem).rateit('starheight', arg.Value);
            }
        });
    }
});


