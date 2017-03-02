/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Aspectize.Extend("GoogleMapPlaceInput", {
    Properties: { Longitude: null, Latitude: null, FullAdress: '', StreetNumber: '', Route: '', City: '', Zip: '', Country: '' },
    Events: ['OnLongitudeChanged', 'OnLatitudeChanged', 'OnFullAdressChanged', 'OnStreetNumberChanged', 'OnRouteChanged', 'OnCityChanged', 'OnZipChanged', 'OnCountryChanged'],
    Init: function (elem) {
        var autocomplete = new google.maps.places.Autocomplete(elem);

        google.maps.event.addListener(autocomplete, 'place_changed', function () {
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                return;
            }

            if (place.geometry.location) {
                Aspectize.UiExtensions.ChangeProperty(elem, 'Longitude', place.geometry.location.lng());
                Aspectize.UiExtensions.ChangeProperty(elem, 'Latitude', place.geometry.location.lat());
            }

            var address = '';
            if (place.address_components) {

                for (var i = 0; i < place.address_components.length; i++) {
                    var adressElement = place.address_components[i];

                    for (var j = 0; j < adressElement.types.length; j++) {
                        var type = adressElement.types[j];
                        var property;
                        if (type === "postal_code") {
                            property = "Zip";
                        } else if (type == "country") {
                            property = "Country";
                        } else if (type == "locality") { // "locality") {
                            property = "City";
                        } else if (type == "street_number") {
                            property = "StreetNumber";
                        } else if (type == "route") {
                            property = "Route";
                        } else continue;

                        value = adressElement.long_name;
                        Aspectize.UiExtensions.ChangeProperty(elem, property, value);
                        break;
                    }
                }
            }

            Aspectize.UiExtensions.ChangeProperty(elem, 'FullAdress', place.formatted_address);
        });

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {
            if ('FullAdress' in arg) {
                $(elem).val(arg.FullAdress);
            }
        });
    }
});
