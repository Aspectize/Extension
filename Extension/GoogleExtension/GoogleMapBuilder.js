var uniquePositionMarker;

function getGoogleInfo(controlMap) {
    var controlInfo = document.getElementById(controlMap).aasControlInfo;
    if (controlInfo) {
        var googleInfo = controlInfo.aasGoogleInfo;
        if (googleInfo) {
            return googleInfo;
        }
    }
    return null;
}

Global.GoogleMapService = {

    aasService: 'GoogleMapService',
    aasPublished: true,

    GetDirectionUrl: function (addr) {
        var rootUrl = 'http://maps.apple.com/';

        if (addr) {
            rootUrl = rootUrl + '?daddr=' + addr.trim().replace(/\s/g, "+");
        }

        var urlEncode = encodeURI(rootUrl);

        return urlEncode;
    },

    CloseInfoBubble: function (controlMap) {
        var googleInfo = getGoogleInfo(controlMap);

        var currentInfoBubble = googleInfo.InfoBubble;

        if (currentInfoBubble) currentInfoBubble.close();
    },

    ClikOnMarker: function (controlMap, id) {
        var googleInfo = getGoogleInfo(controlMap);
        if (googleInfo) {
            google.maps.event.trigger(googleInfo.Markers[id], 'click');
        }
    },

    GotoPosition: function (controlMap, lat, lng, zoom) {
        var googleInfo = getGoogleInfo(controlMap);
        if (googleInfo) {
            var location = new google.maps.LatLng(lat, lng);
            googleInfo.GotoPosition(location, zoom);
        }
    },

    GotoMyPosition: function (controlMap, zoom) {
        var googleInfo = getGoogleInfo(controlMap);
        if (googleInfo) {
            if (typeof (navigator.geolocation) != 'undefined') {
                navigator.geolocation.getCurrentPosition(function (position) {
                    //googleInfo.GotoPosition(position);
                    initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    googleInfo.GotoPosition(initialLocation, zoom);
                });
            }
        }
    },

    GotoAdress: function (controlMap, adress) {
        var googleInfo = getGoogleInfo(controlMap);
        if (googleInfo) {
            googleInfo.GotoAdress(adress);
        }
    },

    Center: function (controlMap, lat, long) {
        var googleInfo = getGoogleInfo(controlMap);
        if (googleInfo) {
            var center = new google.maps.LatLng(lat, long);
            googleInfo.Map.setCenter(center);
        }
    },

    Refresh: function (controlMap) {
        var googleInfo = getGoogleInfo(controlMap);
        if (googleInfo) {
            google.maps.event.trigger(googleInfo.Map, "resize");
        }
    },

    ZoomPlus: function (controlMap) {
        var googleInfo = getGoogleInfo(controlMap);
        if (googleInfo) {
            var zoom = googleInfo.Map.getZoom();
            zoom++;
            googleInfo.Map.setZoom(zoom);
        }
    },

    ZoomMinus: function (controlMap) {
        var googleInfo = getGoogleInfo(controlMap);
        if (googleInfo) {
            var zoom = googleInfo.Map.getZoom();
            zoom--;
            googleInfo.Map.setZoom(zoom);
        }
    },

    Zoom: function (controlMap, zoom) {
        var googleInfo = getGoogleInfo(controlMap);
        if (googleInfo) {
            googleInfo.Map.setZoom(zoom);
        }
    },

    AddUniquePositionMarker: function (controlMap, myPosition) {
        var googleInfo = getGoogleInfo(controlMap);

        if (uniquePositionMarker) {
            uniquePositionMarker.setMap(null);
        }

        uniquePositionMarker = new google.maps.Marker({
            position: myPosition,
            map: googleInfo.Map,
            optimized: false
        });

        var test = uniquePositionMarker;
    },

    RemoveUniquePositionMarker: function () {
        if (uniquePositionMarker) {
            uniquePositionMarker.setMap(null);
        }
    },


    GeoCode: function (controlMap, latitude, longitude, autoCompleteControl) {
        var googleInfo = getGoogleInfo(controlMap);
        if (googleInfo) {
            var googleMapService = Aspectize.Host.GetService('GoogleMapService');
            var geocoder = googleInfo.GeoCoder;
            if (geocoder) {
                if (latitude && longitude) {
                    var location = new google.maps.LatLng(latitude, longitude);
                    geocoder.geocode({ 'location': location }, function (results, status) {
                        var adressComponent = { Latitude: location.lat(), Longitude: location.lng(), FormatAdress: '', country: '', locality: '', postal_code: '', route: '', street_number: '' };
                        if (status == google.maps.GeocoderStatus.OK) {
                            if (results[0]) {
                                if (autoCompleteControl) {

                                    var input = document.getElementById(autoCompleteControl);

                                    if (input) {
                                        input.value = results[0].formatted_address;
                                    }

                                    googleMapService.AddUniquePositionMarker(controlMap, location);
                                }
                            }
                        }
                        else googleMapService.RemoveUniquePositionMarker();
                    });
                }
                else googleMapService.RemoveUniquePositionMarker();
            }
        }
    }

};

Global.GoogleMapControlBuilder = {

    aasService: 'GoogleMapControlBuilder',
    aasPublished: false,

    Build: function (controlInfo) {

        controlInfo.aasGoogleInfo = {
            Map: null,
            Markers: {},
            GeoCoder: null,
            InfoWindow: null,
            InfoBubble: null,
            AutoComplete: null,
            GotoPosition: function (position, zoom) {
                gotoPosition(this.Map, position, zoom);
            },
            GotoAdress: function (adress) {
                gotoAdress(this.Map, this.GeoCoder, adress);
            }
        };

        controlInfo.CreateInstance = function (ownerWindow, id) {

            var map = Aspectize.createElement('div', ownerWindow);

            map.aasSubControls = {};

            return map;
        };

        function addMarker(latitude, longitude, map, id) {

            var info = { IsNewMarker: false, Marker: null };

            var markers = controlInfo.aasGoogleInfo.Markers;

            if (id in markers) {

                info.Marker = markers[id];

                info.Marker.setMap(map);

            } else {

                info.IsNewMarker = true;

                var location = new google.maps.LatLng(latitude, longitude);

                info.Marker = new google.maps.Marker({ position: location, map: map });

                controlInfo.aasGoogleInfo.Markers[id] = info.Marker;
            }

            return info;
        }

        // Removes the overlays from the map, but keeps them in the array
        function hideOverlays() {

            var markers = controlInfo.aasGoogleInfo.Markers;

            for (id in markers) {

                markers[id].setMap(null);
            }
        }

        // delete invisible overlays
        function clearOverlays() {

            var markers = controlInfo.aasGoogleInfo.Markers;

            for (var id in markers) {
                if (markers[id].getMap() === null) {
                    delete markers[id];
                    break;
                }
            }
        }

        function gotoAdress(map, geocoder, adress) {
            geocoder.geocode({ 'address': adress }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    gotoPosition(map, results[0].geometry.location);
                }
            });
        }

        function gotoPosition(map, position, zoom) {
            var option = {
                center: position
            };

            if (zoom) {
                map.setZoom(zoom);
            }

            //map.setOptions(option);
            map.panTo(position);
        }

        controlInfo.InitGrid = function (control) {

            var controlMap = control;

            controlMap.className = 'GoogleMap';

            google.maps.visualRefresh = true;

            var location = new google.maps.LatLng(48.857713, 2.344894);

            var initLat = Aspectize.UiExtensions.GetProperty(control, 'InitLat');
            var initLng = Aspectize.UiExtensions.GetProperty(control, 'InitLng');

            if (initLat && initLng) {
                location = new google.maps.LatLng(initLat, initLng);
            }

            var mapOptions = {
                center: location,
                disableDoubleClickZoom: Aspectize.UiExtensions.GetProperty(control, 'DisableDoubleClickZoom'),
                scrollwheel: Aspectize.UiExtensions.GetProperty(control, 'Scrollwheel'),
                zoom: Aspectize.UiExtensions.GetProperty(control, 'Zoom'),
                disableDefaultUI: Aspectize.UiExtensions.GetProperty(control, 'DisableDefaultUI'),
                zoomControl: false
            };

            var map = new google.maps.Map(controlMap, mapOptions);

            controlInfo.aasGoogleInfo.Map = map;

            // Styles de la map
            var styles = [
                {
                // stylers: [
                // { hue: "#7e4eA3" },
                // { saturation: 100 } //-100 N&B
                // ]
            }, {
                featureType: "road",
                elementType: "geometry",
                stylers: [
                { lightness: 100 },
                { visibility: "simplified" }
                ]
            }, {
                featureType: "road",
                elementType: "labels",
                stylers: [
                { visibility: "on" }
                ]
            }
            ];

            map.setOptions({ styles: styles });

            var geocoder = new google.maps.Geocoder();

            controlInfo.aasGoogleInfo.GeoCoder = geocoder;

            //var infoBubble = new InfoBubble({
            //    map: map,
            //    shadowStyle: 1,
            //    padding: 0,
            //    arrowSize: 10,
            //    borderWidth: 1,
            //    borderColor: '#bbb',
            //    disableAutoPan: false,
            //    arrowPosition: 50,
            //    disableAnimation: true,
            //    hideCloseButton: true,
            //    arrowStyle: 2,
            //    minHeight: 122
            //});

            //controlInfo.aasGoogleInfo.InfoBubble = infoBubble;

            var addMarkerOnClick = Aspectize.UiExtensions.GetProperty(control, 'AddMarkerOnClick');

            google.maps.event.addListener(map, 'click', function (event) {

                var currentInfoBubble = controlInfo.aasGoogleInfo.InfoBubble;

                if (currentInfoBubble) currentInfoBubble.close();

                if (addMarkerOnClick) {

                    var defaultMarkerUrlIcon = Aspectize.UiExtensions.GetProperty(control, 'DefaultMarkerUrlIcon');

                    geocoder.geocode({ 'location': event.latLng }, function (results, status) {
                        var adressComponent = { Latitude: event.latLng.lat(), Longitude: event.latLng.lng(), FormatAdress: '', country: '', locality: '', postal_code: '', route: '', street_number: '' };
                        if (status == google.maps.GeocoderStatus.OK) {
                            if (results[0]) {
                                adressComponent['FormatAdress'] = results[0].formatted_address;
                                for (var i = 0; i < results[0].address_components.length; i++) {
                                    var address_component = results[0].address_components[i];
                                    var infoType = address_component.types[0];
                                    if (infoType in adressComponent) {
                                        adressComponent[infoType] = address_component.long_name;
                                    }
                                }
                            }
                        }
                        Aspectize.UiExtensions.Notify(control, 'OnMapClick', adressComponent);
                    });
                }
            });
        };

        controlInfo.BeforeRender = function (control) {
            hideOverlays();
        };

        controlInfo.RowCreated = function (control, rowId, cellControls) {

            var item = { id: rowId };

            var map = controlInfo.aasGoogleInfo.Map;
            var geocoder = controlInfo.aasGoogleInfo.GeoCoder;
            var infoWindow = controlInfo.aasGoogleInfo.InfoWindow;
            var infoBubble = controlInfo.aasGoogleInfo.InfoBubble;

            var controlMarker = cellControls[0];  // une seule colonne de type GoogleMarkerPart

            var title = Aspectize.UiExtensions.GetProperty(controlMarker, 'Title');
            var latitude = Aspectize.UiExtensions.GetProperty(controlMarker, 'Latitude');
            var longitude = Aspectize.UiExtensions.GetProperty(controlMarker, 'Longitude');

            var draggable = Aspectize.UiExtensions.GetProperty(controlMarker, 'Draggable');
            var visible = Aspectize.UiExtensions.GetProperty(controlMarker, 'Visible');
            var urlIcon = Aspectize.UiExtensions.GetProperty(controlMarker, 'UrlIcon');
            var infoWindowText = Aspectize.UiExtensions.GetProperty(controlMarker, 'InfoWindowText');

            var data = addMarker(latitude, longitude, map, rowId);

            if (data.IsNewMarker) {

                var marker = data.Marker;

                marker.setVisible(visible);
                marker.setDraggable(draggable);
                marker.setTitle(title);
                marker.infoWindowText = infoWindowText;

                controlMarker.aasMarkerInfo = marker;

                if (urlIcon) {

                    //if (Aspectize.Host.MobileMode) {
                    //    var parts = Aspectize.Host.MobileUrl.split('/');
                    //    parts[parts.length - 1] = '';
                    //    urlIcon = parts.join('/') + urlIcon;
                    //}

                    var image = new google.maps.MarkerImage(urlIcon, new google.maps.Size(32, 32), new google.maps.Point(0, 0),

                        new google.maps.Point(16, 32) // The anchor for this image is the base of the flagpole
                    );

                    marker.setIcon(image);
                }

                //marker.setMap(map);

                google.maps.event.addListener(marker, 'click', function () {
                    Aspectize.UiExtensions.SetCurrent(control, item.id);
                    Aspectize.UiExtensions.Notify(controlMarker, 'OnMarkerClick', { 'marker': marker, 'item': item, 'infoWindow': infoWindow, 'infoBubble': infoBubble });
                });

                if (draggable) {
                    google.maps.event.addListener(marker, 'dragstart', function () {
                        Aspectize.UiExtensions.SetCurrent(control, item.id);
                        Aspectize.UiExtensions.Notify(controlMarker, 'OnDragBegin', { 'marker': marker, 'item': item });
                    });

                    google.maps.event.addListener(marker, 'dragend', function () {
                        var newLatitude = marker.getPosition().lat();
                        var newLongitude = marker.getPosition().lng();
                        Aspectize.UiExtensions.ChangeProperty(controlMarker, 'Longitude', newLongitude);
                        Aspectize.UiExtensions.ChangeProperty(controlMarker, 'Latitude', newLatitude);
                        Aspectize.UiExtensions.Notify(controlMarker, 'OnDragEnd', { 'marker': marker, 'item': item });
                    });
                }
            } else {

                controlMarker.aasMarkerInfo = data.Marker;
            }
        };

        controlInfo.GridRendered = function (control, rowControls) {
            clearOverlays();

            var autoCompleteControl = Aspectize.UiExtensions.GetProperty(control, 'AutoComplete');

            if (autoCompleteControl) {
                if (!control.aasControlInfo.aasGoogleInfo.AutoComplete) {

                    var input = document.getElementById(autoCompleteControl);

                    if (input) {
                        var autoComplete = new google.maps.places.Autocomplete(input);

                        google.maps.event.addListener(autoComplete, 'place_changed', function () {

                            var map = control.aasControlInfo.aasGoogleInfo.Map;

                            var place = autoComplete.getPlace();
                            if (!place.geometry) {
                                // Inform the user that the place was not found and return.
                                return;
                            }

                            // If the place has a geometry, then present it on a map.
                            if (place.geometry.viewport) {
                                map.fitBounds(place.geometry.viewport);
                            } else {
                                map.setCenter(place.geometry.location);
                                map.setZoom(14);
                            }

                            Aspectize.UiExtensions.Notify(control, 'OnAutoComplete', { 'place': place });

                        });

                        control.aasControlInfo.aasGoogleInfo.AutoComplete = autoComplete;
                    }
                }
            }
        };
    }
};


Global.GoogleMapControlMarkerBuilder = {

    aasService: 'GoogleMapControlMarkerBuilder',
    aasPublished: false,

    Build: function (controlInfo) {

        controlInfo.IsExtendedCell = true;

        controlInfo.CreateInstance = function (ownerWindow, id) {

            var control = Aspectize.createElement('div', ownerWindow);

            return control;
        };

        controlInfo.InitCell = function (cell) {

            Aspectize.UiExtensions.AddMergedPropertyChangeObserver(cell, function (sender, arg) {

                var marker = cell.aasMarkerInfo;

                if (marker) {
                    if ('UrlIcon' in arg) {
                        var urlIcon = arg.UrlIcon;

                        if (Aspectize.Host.MobileMode) {
                            var parts = Aspectize.Host.MobileUrl.split('/');
                            parts.splice(0, parts.length);
                            urlIcon = parts.join('/') + urlIcon;
                        }

                        var iconWidth = ('IconWidth' in arg) ? arg.IconWidth : 32;
                        var iconHeight = ('IconHeight' in arg) ? arg.IconHeight : 32;
                        var iconOriginX = ('IconOriginX' in arg) ? arg.IconOriginX : 0;
                        var iconOriginY = ('IconOriginY' in arg) ? arg.IconOriginY : 0;
                        var iconAnchorX = ('IconAnchorX' in arg) ? arg.IconAnchorX : 16;
                        var iconAnchorY = ('IconAnchorY' in arg) ? arg.IconAnchorY : 32;

                        var image = new google.maps.MarkerImage(urlIcon,
                            new google.maps.Size(iconWidth, iconHeight),
                            new google.maps.Point(iconOriginX, iconOriginY),

                            new google.maps.Point(iconAnchorX, iconAnchorY)); // The anchor for this image is the base of the flagpole.

                        marker.setIcon(image);
                    }

                    if ('Title' in arg) {
                        marker.setTitle(arg.Title);
                    }

                    if ('Longitude' in arg || 'Latitude' in arg) {
                        var currentPosition = marker.getPosition();
                        var longitude = ('Longitude' in arg) ? arg.Longitude : currentPosition.lng();
                        var latitude = ('Latitude' in arg) ? arg.Latitude : currentPosition.lat();

                        var newPosition = new google.maps.LatLng(latitude, longitude);
                        marker.setPosition(newPosition);
                    }
                }
            });

            /*
            Aspectize.UiExtensions.AddPropertyChangeObserver(cell, function (sender, arg) {

                var marker = cell.aasMarkerInfo;

                if (marker) {

                    switch (arg.Name) {

                        case 'UrlIcon':
                            {
                                var urlIcon = arg.Value;

                                if (Aspectize.Host.MobileMode) {
                                    var parts = Aspectize.Host.MobileUrl.split('/');
                                    parts.splice(0, parts.length);
                                    urlIcon = parts.join('/') + urlIcon;
                                }
                                var image = new google.maps.MarkerImage(arg.Value,
                                new google.maps.Size(32, 32),
                                new google.maps.Point(0, 0),

                                new google.maps.Point(16, 32)); // The anchor for this image is the base of the flagpole.

                                marker.setIcon(image);

                            } break;

                        case 'Title': marker.setTitle(arg.Value); break;

                        case 'Longitude':
                        case 'Latitude':

                            var currentPosition = marker.getPosition();
                            var longitude = (arg.Name === 'Longitude') ? arg.Value : currentPosition.lng();
                            var latitude = (arg.Name === 'Latitude') ? arg.Value : currentPosition.lat();

                            var newPosition = new google.maps.LatLng(latitude, longitude);
                            marker.setPosition(newPosition);
                            break;
                    }
                }
            });
            */
        };

    }
};
