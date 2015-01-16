
Global.BootStrapClientService = {

    aasService: 'BootStrapClientService',
    aasPublished: true,

    ResetAlert: function (alertClass, classToReset) {
        $('.' + alertClass).removeClass(classToReset);
        $('.' + alertClass).html('');
    },

    Navigate: function (viewName, schemaPath, id, title) {
        this.ShowView(viewName);

        this.CollapseNavBar();

        var history = Aspectize.Host.GetService('History');

        if (history) {
            history.PushState(viewName, schemaPath, id, title);
        }
    },

    CollapseNavBar: function () {
        if ($('.navbar-toggle').css('display') != 'none' && $('#mainnavbar').css('display') != 'none') {
            $(".navbar-toggle").trigger("click");
        }
    },

    Collapse: function (element) {
        $('.' + element).collapse('toggle');
    },

    CollapseDropdown: function () {
        $('.dropdown.open .dropdown-toggle').dropdown('toggle');
    },

    ActiveLiElement: function (element) {
        $('.' + element).parents('ul').siblings('ul').addBack().children('li').removeClass('active');
        $('.' + element).parent('li').addClass('active');
    },

    ShowModal: function (viewName, keyboard, backdrop) {
        if (keyboard && (typeof keyboard === 'string')) {

            keyboard = keyboard.toLowerCase() === 'true';
        }

        if (backdrop && (typeof backdrop === 'string')) {

            backdrop = backdrop.toLowerCase() === 'true';
        }

        if (keyboard == undefined) keyboard = true;
        if (backdrop == undefined) backdrop = true;

        var uiView = this.ShowView(viewName);

        if (uiView) {
            if ($('.ZoneModal').length) {
                $('.ZoneModal').removeClass('modal fade in').addClass('modal fade in');

                $('.ZoneModal').modal({
                    keyboard: keyboard,
                    backdrop: backdrop
                });
            }
            else {
                $('#' + viewName + ' .modal').modal({
                    show: true,
                    backdrop: backdrop,
                    keyboard: keyboard
                });

                $('#' + viewName).on('shown.bs.modal', function () {
                    $('#' + viewName+ ' [autofocus]:first').focus();
                });

                $('#' + viewName).on('hidden.bs.modal', function () {
                    var uiService = Aspectize.Host.GetService('UIService');

                    uiService.UnactivateView(viewName);
                });
            }
        }
    },

    CloseModal: function (viewName) {
        if ($('.ZoneModal').length) {
            $('.ZoneModal').modal('hide');
        } else if (viewName) {
            $('#' + viewName + ' .modal').modal('hide');
        }
    },

    ShowView: function (viewName) {
        var uiView = Aspectize.Host.ExecuteCommand('UIService.ShowView', viewName);

        $('#' + viewName + ' [autofocus]:first').focus();

        $('[data-ride="carousel"]').each(function () {
            var $carousel = $(this)
            $carousel.carousel($carousel.data())
        })

        return uiView;
    },

    InitBootstrap: function () {
        $('.ZoneModal').on('hidden.bs.modal', function () {

            $('.ZoneModalContent').children('.aasControl').each(function (index) {
                var viewName = this.id;

                if (viewName) {
                    var uiService = Aspectize.Host.GetService('UIService');

                    uiService.UnactivateView(viewName);
                }
            });
        })

        $('.ZoneModal').on('shown.bs.modal', function () {
            $('.ZoneModalContent [autofocus]:first').focus();
        })

    }

};

