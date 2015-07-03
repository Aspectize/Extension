/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.GoogleMapExtension = {

    aasService: 'GoogleMapExtension',
    aasPublished: false,
    aasUiExtension: true,

    GoogleMapPlaceInput: {
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
                    Aspectize.UiExtensions.ChangeProperty(elem, 'Longitude', place.geometry.location.getLongitude());
                    Aspectize.UiExtensions.ChangeProperty(elem, 'Latitude', place.geometry.location.getLatitude());
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
    },
};