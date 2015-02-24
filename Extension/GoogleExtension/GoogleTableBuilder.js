
Global.GoogleTableBuilder = {

    aasService: 'GoogleTableBuilder',
    aasPublished: false,

    Build: function (controlInfo) {

        function getColumnTypeFromValue(value) {

            if (value !== null) {

                if (value.constructor === Number) return "number";
                if (value.constructor === Date) return "datetime";
                if (value.constructor === String) return "string";
                if (value.constructor === Boolean) return "boolean";
            }

            return 'string';
        }

        controlInfo.CreateInstance = function (ownerWindow, id) {

            var div = Aspectize.createElement('div', ownerWindow);

            div.aasSubControls = {};

            return div;
        };

        //        controlInfo.InitGrid = function (control) {

        //        };

        controlInfo.InitCellControl = function (control, cellControl, rowId, rowIndex, columnIndex, columnName) {

            cellControl.aasColumnName = columnName;
            cellControl.aasColumnIndex = columnIndex;
            cellControl.aasRowIndex = rowIndex;
            cellControl.aasParentGrid = control;
        };

        controlInfo.GridRendered = function (control, rowControls) {

            var data = new google.visualization.DataTable();
            var columns = [];

            controlInfo.aasGoogleTable = data;

            var columnsBuilt = (data.getNumberOfColumns() > 0);

            if (!columnsBuilt) {
                var columns = {};

                for (var n = 0; n < rowControls.length; n++) {
                    var tryNextRow = false;

                    var rowControl = rowControls[n];

                    var cellControls = rowControl.CellControls;

                    for (var j = 0; j < cellControls.length; j++) {
                        var cellControl = cellControls[j];

                        var columnName = cellControl.aasColumnName;

                        if (!columns[columnName]) {
                            var rowValue = cellControl.aasControlInfo.PropertyBag.Value;

                            if (rowValue) {
                                data.addColumn(getColumnTypeFromValue(rowValue), columnName);

                                columns[columnName] = true;
                            } else {
                                tryNextRow = true;
                            }
                        }
                    }

                    if (!tryNextRow) break;
                }
            }

            columnsBuilt = true;

            var rows = [];

            for (var n = 0; n < rowControls.length; n++) {

                var row = [];

                var rowControl = rowControls[n];

                //var columnsBuilt = (data.getNumberOfColumns() > 0);

                var cellControls = rowControl.CellControls;

                for (var j = 0; j < cellControls.length; j++) {

                    var cellControl = cellControls[j];

                    var rowValue = cellControl.aasControlInfo.PropertyBag.Value;

                    //if (!columnsBuilt) {

                    //    var columnName = cellControl.aasColumnName;

                    //    data.addColumn(getColumnTypeFromValue(rowValue), columnName);
                    //}

                    //                    if (cellControl.aasDataBindings.Value && cellControl.aasDataBindings.Value.Format) {
                    //                        var rowValueWithFormat = Aspectize.formatString(rowValue, cellControl.aasDataBindings.Value.Format);
                    //                        rowValue = { v: rowValue, f: rowValueWithFormat };
                    //                    }

                    row.push(rowValue);
                }

                //row = ['Mike', { v: 10000, f: '$10,000' }, true];
                rows.push(row);
            }

            data.addRows(rows);

            if (columnsBuilt) {

                if (controlInfo.DrawGoogleTable) {

                    controlInfo.DrawGoogleTable(control, data);
                }
            }

        };

    }
};


Global.GoogleColumnBuilder = {

    aasService: 'GoogleColumnBuilder',
    aasPublished: false,

    Build: function (controlInfo) {

        controlInfo.IsExtendedCell = true;

        controlInfo.CreateInstance = function (ownerWindow, id) {

            var control = Aspectize.createElement('div', ownerWindow);

            return control;
        };

        controlInfo.InitCell = function (cell) {

            var skipFirst = true;

            Aspectize.UiExtensions.AddPropertyChangeObserver(cell, function (sender, arg) {

                if (skipFirst) { skipFirst = false; return; }

                var data = cell.aasParentGrid.aasControlInfo.aasGoogleTable;
                data.setCell(cell.aasRowIndex, cell.aasColumnIndex, cell.aasControlInfo.PropertyBag.Value);

                if (cell.aasParentGrid.aasControlInfo.GoogleTableUpdated) {
                    cell.aasParentGrid.aasControlInfo.GoogleTableUpdated(cell.aasParentGrid, data);
                }
            });

        };

    }
};