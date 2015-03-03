/// <reference path="S:\Delivery\Aspectize.core\Aspectize.runTime.js" />

Global.DhtmlxGridBuilder = {

    aasService: 'DhtmlxGridBuilder',
    aasPublished: false,

    Build: function(controlInfo) {

        controlInfo.CreateInstance = function(ownerWindow, id) {

            var grid = Aspectize.createElement('div', ownerWindow);

            grid.aasSubControls = {};

            return grid;
        };

        function buildHeader(control, columnInfos, aasWindow) {

            var grid = control.aasDHtmlXGrid;

            //grid.setHeader("Column 1,Column 2");
            //grid.setInitWidths("*,*");
            //grid.setColTypes("ro,ch");
            //grid.setColAlign("left,left");
            //grid.attachHeader("#text_filter,#select_filter,#numeric_filter");
            //grid.setColSorting("str,int,date,na");

            var names = [];
            var widths = [];
            var types = [];
            var align = [];
            var activeContent = [];
            var colSorting = [];

            for (var n = 0; n < columnInfos.length; n++) {

                var columnInfo = columnInfos[n];

                names.push(columnInfo.name);
                widths.push('*');
                align.push('left');
                activeContent.push('#text_filter');

                switch (columnInfo.typeName) {

                    case 'DxReadOnlyPart': types.push('ro'); colSorting.push('str'); break;
                    case 'DxCheckBoxPart': types.push('ch'); colSorting.push('int'); break;
                    case 'DxTextBoxPart': types.push('ed'); colSorting.push('str'); break;
                    default: types.push('ro'); colSorting.push('na'); break;
                }
            }

            grid.setHeader(names.join(','));
            grid.setInitWidths(widths.join(','));
            grid.setColTypes(types.join(','));
            grid.setColAlign(align.join(','));

            grid.attachHeader(activeContent.join(','));

            grid.setColSorting(colSorting.join(','));
        }

        controlInfo.InitGrid = function(control) {

            var grid = new dhtmlXGridObject(control.id);

            control.aasDHtmlXGrid = grid;

            grid.setImagePath(Aspectize.MapPath('~/codebase/imgs/'));
            grid.setEditable(true);
            grid.setSkin('light');
            grid.enableAutoHeight(true);

            grid.attachEvent('onEditCell', function(stage, rowId, columnIndex, newValue, oldValue) {

                if (stage === 2) {

                    var subControlId = control.id + '-' + rowId + '-' + columnIndex;

                    var subControl = control.aasSubControls[subControlId];

                    subControl.aasSetProperty('Text', newValue);

                }

                return true;
            });

            grid.attachEvent('onCheck', function(rowId, columnIndex, state) {

                var subControlId = control.id + '-' + rowId + '-' + columnIndex;

                var subControl = control.aasSubControls[subControlId];

                subControl.aasSetProperty('Text', state);

            });

            grid.attachEvent('onSelectStateChanged', function(id) {

                var itemIndex = grid.getRowIndex(id);

                var listManager = control.aasControlInfo.ListManager;

                listManager.SetCurrentIndex.call(listManager, itemIndex);

            });

            buildHeader(control, controlInfo.columnInfos, control.aasWindow);

            grid.init();

        };

        controlInfo.InitCellControl = function (control, cellControl, rowId, rowIndex, columnIndex, columnName) {

            var grid = control.aasDHtmlXGrid;

            if (!grid.doesRowExist(rowId)) {

                grid.addRow(rowId, '', grid.getRowsNum());
            }

            cellControl.aasDxGrid = grid;
            cellControl.aasRowId = rowId;
            cellControl.aasColumnIndex = columnIndex;
        };

        controlInfo.OnCurrentIndexChanged = function(control, currentIndex) {

            var grid = control.aasDHtmlXGrid;

            var selId = grid.getSelectedId();
            var selIndex = grid.getRowIndex(selId);

            if (selIndex !== currentIndex) {

                grid.selectRow(currentIndex);
            }
        };
    }
};

Global.DhtmlxGridPartBuilder = {

    aasService: 'DhtmlxGridPartBuilder',
    aasPublished: false,

    Build: function(controlInfo) {

        controlInfo.CreateInstance = function(ownerWindow, id) {

            var control = Aspectize.createElement('div', ownerWindow);

            controlInfo.aasLastSetText = null;

            controlInfo.ChangePropertyValue = function(property, newValue) {

                controlInfo.PropertyBag[property] = newValue;

                if (property === 'Text') {

                    if (controlInfo.aasLastSetText !== newValue) {

                        controlInfo.aasLastSetText = newValue;

                        control.aasDxGrid.cellById(control.aasRowId, control.aasColumnIndex).setValue(newValue);

                        controlInfo.Notify('OnValueChanged', { IsEventArg: true, Value: property });
                    }
                }
                else if (property === 'HeaderText') {

                    var label = control.aasDxGrid.getColLabel(control.aasColumnIndex);

                    if (label !== newValue) {

                        control.aasDxGrid.setColumnLabel(control.aasColumnIndex, newValue);
                    }
                }
            };

            return control;
        };
    }
};
