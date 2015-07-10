/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Aspectize.Extend("GoogleMapPlaceInput", {
    Properties: { Longitude: '', Latitude: '', Adress: '' },
    Events: [],
    Init: function (elem) {
        var autocomplete = new google.maps.places.Autocomplete(elem);

        google.maps.event.addListener(autocomplete, 'place_changed', function () {
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                //window.alert("Autocomplete's returned place contains no geometry");
                return;
            }

            if (place.geometry.location) {
                Aspectize.UiExtensions.ChangeProperty(elem, 'Longitude', place.geometry.location.lng());
                Aspectize.UiExtensions.ChangeProperty(elem, 'Latitude', place.geometry.location.lat());
            }

            var address = '';
            if (place.address_components) {
                address = [
                  (place.address_components[0] && place.address_components[0].short_name || ''),
                  (place.address_components[1] && place.address_components[1].short_name || ''),
                  (place.address_components[2] && place.address_components[2].short_name || '')
                ].join(' ');

                Aspectize.UiExtensions.ChangeProperty(elem, 'Adress', address);
            }
        });

    }
});
