function getGraphStep(minValue, maxValue, step) {

    if (step) return step;

    var copy = maxValue;

    if (minValue < 0) {
        copy = maxValue - minValue;
    }

    var pow = 1

    while (copy > 10) {

        copy = copy / 10;
        pow++;
    }

    return Math.pow(10, pow - 1);
}

function getGraphEnd(minValue, maxValue, s) {
    var step = getGraphStep(minValue, maxValue, s);

    var max = 0;

    while (max < maxValue) {

        max += step;
    }

    return max;
}

function getGraphBegin(minValue, maxValue, s) {
    if (minValue > 0) return 0;

    var step = getGraphStep(minValue, maxValue, s);
    var min = 0;

    while (min > minValue) {

        min -= step;
    }

    return min;
}

function getDxChart(graphControl) {

    if (graphControl) {

        if (graphControl.aasDxChart) {

            return graphControl.aasDxChart;

        } else if (graphControl.aasChartProperties) {

            return graphControl.aasChartProperties.dxChart;
        }
    }

    return null;
}
Global.DhtmlxChartService = {

    aasService: 'DhtmlxChartService',
    aasPublished: true,

    GetGraphEnd: function (minValue, maxValue) {
        return getGraphEnd(minValue, maxValue);
    },

    GetGraphStep: function (minValue, maxValue) {
        return getGraphStep(minValue, maxValue);
    },

    GetGraphBegin: function (minValue, maxValue) {
        return getGraphBegin(minValue, maxValue);
    },

    RefreshGraph: function (graphControlId) {

        var graphControl = document.getElementById(graphControlId);

        if (graphControl.aasChartProperties) {

            gc.aasChartProperties.MustRebuildChart = true;
            gc.aasChartProperties.RefreshData();

        } else {

            var dxChart = getDxChart(graphControl);

            if (graphControl && dxChart) {

                var rowCount = graphControl.aasRowCount;

                var currentWidth = graphControl.parentNode.clientWidth;

                graphControl.style.width = graphControl.parentNode.clientWidth + 'px';

                var xAxis = graphControl.aasChartProperties.xAxis;

                var pointWidth = graphControl.aasChartProperties.AllAxis[xAxis].PointWidth;

                if (currentWidth <= rowCount * pointWidth) {
                    graphControl.style.width = rowCount * pointWidth + 'px';
                }
                else {
                    graphControl.style.width = graphControl.parentNode.clientWidth + 'px';
                }

                Aspectize.ProtectedCall(dxChart, dxChart.refresh);
                Aspectize.ProtectedCall(dxChart, dxChart.resize);
            }
        }
    },

    SetChartProperties: function (graphControlId, dhtmlxProperties) {

        var graphControl = document.getElementById(graphControlId);

        if (graphControl && graphControl.aasDxChart) {

            for (var k in dhtmlxProperties) {

                Aspectize.ProtectedCall(graphControl.aasDxChart, graphControl.aasDxChart.define, k, dhtmlxProperties[k]);
            }

            Aspectize.ProtectedCall(graphControl.aasDxChart, graphControl.aasDxChart.refresh);
        }
    },

    SetChartData: function (graphControlId, data) {

        var graphControl = document.getElementById(graphControlId);

        if (graphControl && graphControl.aasDxChart) {

            Aspectize.ProtectedCall(graphControl.aasDxChart, graphControl.aasDxChart.parse, data, 'json');
        }
    }

};



Global.DhtmlxChartBuilder = {

    aasService: 'DhtmlxChartBuilder',
    aasPublished: false,

    Build: function (controlInfo) {

        var ChartTypes = { Area: { View: 'area' }, Bar: { View: 'bar' }, StackedBar: { View: 'stackedBar' }, Line: { View: 'line' }, Spline: { View: 'spline' }, Pie: { View: 'pie' }, Radar: { View: 'radar' } };

        controlInfo.CreateInstance = function (ownerWindow, id) {

            var chart = Aspectize.createElement('div', ownerWindow);

            chart.aasSubControls = {};

            return chart;
        };

        controlInfo.InitGrid = function (control) {

            //control.style.height = '350px';
            control.style.height = '100%';
            control.style.width = '100%';
            control.style.minHeight = '100%';
            control.style.minWidth = '100%';

            if (control.parentNode.width) {
                control.style.width = control.parentNode.width;
            }

            control.parentNode.style.overflowX = "auto";
            control.parentNode.style.overflowY = "hidden";

            var chartType = null;

            switch (control.aasControlInfo.name) {

                case 'DhtmlxAreaChart': chartType = ChartTypes.Area; break;
                case 'DhtmlxBarChart': chartType = ChartTypes.Bar; break;
                case 'DhtmlxStackedBarChart': chartType = ChartTypes.StackedBar; break;
                case 'DhtmlxLineChart': chartType = ChartTypes.Line; break;
                case 'DhtmlxSplineChart': chartType = ChartTypes.Spline; break;
                case 'DhtmlxPieChart': chartType = ChartTypes.Pie; break;
                case 'DhtmlxRadarChart': chartType = ChartTypes.Radar; break;
                default: chartType = ChartTypes.Line; break;
            }

            var xAxis = null;
            var yAxis = null;
            var otherYAxis = [];

            var columnInfos = controlInfo.columnInfos;

            for (var n = 0; n < columnInfos.length; n++) {

                var columnInfo = columnInfos[n];

                var typeNameParts = columnInfo.typeName.split('.');

                var typeName = typeNameParts[typeNameParts.length - 1];

                switch (typeName) {

                    case 'DhtmlxChartXAxis': xAxis = columnInfo.name; break;
                    case 'DhtmlxChartYAxis':
                        {
                            if (yAxis === null) {

                                yAxis = columnInfo.name;
                            }
                            else {

                                if (control.aasControlInfo.name !== 'DhtmlxPieChart') {

                                    otherYAxis.push(columnInfo.name);
                                }
                            }

                            break;
                        }
                    default: break;
                }
            }

            if (!window.dhtmlXChart) throw new Error('Missing DHTMLX integration scripts in the app.ashx file ?');

            var chart = new dhtmlXChart({
                view: chartType.View,
                container: control.id,
                value: '#' + yAxis + '#',
                lines: false,
                label: '#' + yAxis + 'LabelValue#',
                xAxis: {
                    title: '',
                    template: '#' + xAxis + 'Label#',
                    lines: false
                }

                //                pieInnerText: function(obj) {
                //                    var sum = chart.sum('#' + yAxis + '#');
                //                    return Math.round(obj[yAxis] / sum * 100) + "%";
                //                }
            });

            for (var i = 0; i < otherYAxis.length; i++) {

                chart.addSeries({
                    value: '#' + otherYAxis[i] + '#',
                    label: '#' + otherYAxis[i] + 'LabelValue#',
                    color: "#2FA783",
                    item: { radius: 1, borderColor: '#2FA783', color: '#2FA783', borderWidth: 1 },
                    line: { color: "#2FA783", width: 3 }
                });
            }

            control.aasDxChart = chart;
            control.aasDxChartXAxis = xAxis;
            control.aasDxChartYAxis = yAxis;

            control.aasChartProperties = { XAxis: { Title: '', Label: '', PointWidth: 50 }, YAxis: {} };

            control.aasChartProperties.YAxis[yAxis] = { Title: '', LabelValue: '', ShowLine: false, Start: null, End: null, Step: null, LineColor: '#D4D4D4', LineWidth: 3, ItemColor: '#000000', ItemBorderColor: '#000000', ItemRadius: 4, ItemBorderWidth: 2 };

            for (var i = 0; i < otherYAxis.length; i++) {
                control.aasChartProperties.YAxis[otherYAxis[i]] = { Title: '', LabelValue: '', ShowLine: false, Start: null, End: null, Step: null, LineColor: '#D4D4D4', LineWidth: 3, ItemColor: '#000000', ItemBorderColor: '#000000', ItemRadius: 4, ItemBorderWidth: 2 };
            }

            //control.style.width = '2000px';

        };

        controlInfo.InitCellControl = function (control, cellControl, rowId, rowIndex, columnIndex, columnName) {

            cellControl.aasDxChart = control.aasDxChart;
            cellControl.aasDxChartXAxis = control.aasDxChartXAxis;
            cellControl.aasDxChartYAxis = control.aasDxChartYAxis;
            cellControl.aasChartProperties = control.aasChartProperties;
            cellControl.aasColumnName = columnName;

        };


        controlInfo.RowCreated = function (control, rowId, cellControls) {

            var chartItem = { id: rowId };

            for (var n = 0; n < cellControls.length; n++) {

                var cellControl = cellControls[n];

                chartItem[cellControl.aasColumnName] = cellControl.aasControlInfo.PropertyBag.Value.toString();

                if (cellControl.aasControlInfo.name == 'DhtmlxChartXAxis') {
                    if (cellControl.aasControlInfo.PropertyBag.Label != null) {
                        chartItem[cellControl.aasColumnName + 'Label'] = cellControl.aasControlInfo.PropertyBag.Label;
                    }
                    else {
                        chartItem[cellControl.aasColumnName + 'Label'] = cellControl.aasControlInfo.PropertyBag.Value.toString();
                    }
                }
                else if (cellControl.aasControlInfo.name == 'DhtmlxChartYAxis') {
                    if (cellControl.aasControlInfo.PropertyBag.LabelValue != null) {
                        chartItem[cellControl.aasColumnName + 'LabelValue'] = cellControl.aasControlInfo.PropertyBag.LabelValue;
                    }
                    else {
                        chartItem[cellControl.aasColumnName + 'LabelValue'] = cellControl.aasControlInfo.PropertyBag.Value.toString();
                    }
                }

                cellControl.aasChartItem = chartItem;
            }

            //control.aasDxChart.add(chartItem);
        };

        controlInfo.GridRendered = function (control, rowControls) {

            var data = []; var min = null; var max = null; var field = control.aasDxChartYAxis;

            for (var n = 0; n < rowControls.length; n++) {

                var rowControl = rowControls[n];

                if (rowControl.CellControls.length > 0) {

                    var chartItem = rowControl.CellControls[0].aasChartItem;

                    data.push(chartItem);

                    var fv = Number(chartItem[field]);

                    if (min == null) min = fv;
                    if (fv < min) min = fv;

                    if (max == null) max = fv;
                    if (fv > max) max = fv;
                }
            }

            var start = control.aasChartProperties.YAxis[control.aasDxChartYAxis].Start;
            if (!start) start = getGraphBegin(min, max);

            var step = control.aasChartProperties.YAxis[control.aasDxChartYAxis].Step;
            if (!step) step = getGraphStep(min, max);

            var end = control.aasChartProperties.YAxis[control.aasDxChartYAxis].End;
            if (!end) end = getGraphEnd(min, max);

            control.aasDxChart.define('yAxis', {
                start: start,
                end: end,
                step: step
            });

            var rowCount = rowControls.length; // control.aasDxChart.data.dataCount();

            control.aasRowCount = rowCount;

            var currentWidth = control.clientWidth;

            var pointWidth = control.aasChartProperties.XAxis.PointWidth;

            if (currentWidth < rowCount * pointWidth) {
                control.style.width = rowCount * pointWidth + 'px';
            }
            else {
                control.style.width = control.parentNode.clientWidth + 'px';
            }

            Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.clearAll);
            Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.refresh);

            if (rowControls.length > 0) {

                Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.parse, data, 'json');
                Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.refresh);
                Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.resize);
            }
        };

        controlInfo.OnCurrentIndexChanged = function (control, currentIndex) {

        };
    }
};

Global.DhtmlxChartAxisBuilder = {

    aasService: 'DhtmlxChartAxisBuilder',
    aasPublished: false,

    Build: function (controlInfo) {

        function translateToObjectProperty(p) {

            var obj = null;
            var property = null;

            if (p.indexOf('Line') === 0) obj = 'line';
            else if (p.indexOf('Item') === 0) obj = 'item';
            else obj = 'yAxis';

            switch (obj) {

                case 'line':
                case 'item': {

                    var stripedObj = p.substring(4);
                    property = stripedObj[0].toLowerCase() + stripedObj.substring(1);
                }

                case 'yAxis': {

                    property = (p === 'ShowLine') ? 'lines' : p.toLowerCase();
                }
            }

            return { Obj: obj, Property: property };
        }

        controlInfo.CreateInstance = function (ownerWindow, id) {

            var control = Aspectize.createElement('div', ownerWindow);

            controlInfo.aasLastSetValue = null;

            var needsFlush = false;
            function deferredFlush() {

                function flush() {

                    needsFlush = false;
                    Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.refresh);
                }

                if (!needsFlush) { needsFlush = true; setTimeout(flush, 0); }
            };

            controlInfo.ChangePropertyValue = function (property, newValue) {

                if (property === 'LabelValue') return;

                controlInfo.PropertyBag[property] = newValue;

                if (property === 'Value') {

                    if (controlInfo.aasLastSetValue !== newValue) {

                        controlInfo.aasLastSetValue = newValue;

                        if (control.aasChartItem) {

                            control.aasChartItem[control.aasColumnName] = newValue;

                            var index = control.aasDxChart.indexById(control.aasChartItem.id);

                            if (index !== -1) {

                                control.aasDxChart.remove(control.aasChartItem.id);
                                control.aasDxChart.add(control.aasChartItem, index);

                                deferredFlush();
                            }
                            else {

                                // Old point : should never happen !!!
                            }
                        }
                    }

                } else {

                    if (newValue === null) return;

                    if (controlInfo.name == 'DhtmlxChartXAxis') {

                        if (control.aasChartProperties.XAxis[property] !== newValue) {

                            control.aasChartProperties.XAxis[property] = newValue;

                            //                            if (property === 'Label') {
                            //                                control.aasDxChart.define('xAxis', {
                            //                                    template: function (obj) { return '' }
                            //                                });
                            //                            }

                            control.aasDxChart.define('xAxis', {
                                title: control.aasChartProperties.XAxis.Title,
                                template: '#' + control.aasDxChartXAxis + 'Label#'
                            });

                            deferredFlush();
                        }

                    } else if (controlInfo.name == 'DhtmlxChartYAxis') {

                        if (control.aasChartProperties.YAxis[control.aasColumnName][property] !== newValue) {

                            control.aasChartProperties.YAxis[control.aasColumnName][property] = newValue;

                            var t = translateToObjectProperty(property);

                            var o = {}; o[t.Property] = newValue;

                            control.aasDxChart.define(t.Obj, o);

                            //control.aasDxChart.define('yAxis', {
                            //    title: control.aasChartProperties.YAxis[control.aasColumnName].Title,
                            //    start: control.aasChartProperties.YAxis[control.aasColumnName].Start,
                            //    end: control.aasChartProperties.YAxis[control.aasColumnName].End,
                            //    step: control.aasChartProperties.YAxis[control.aasColumnName].Step,
                            //    lines: control.aasChartProperties.YAxis[control.aasColumnName].ShowLine
                            //});

                            //control.aasDxChart.define('item', {
                            //    borderColor: control.aasChartProperties.YAxis[control.aasColumnName].ItemBorderColor,
                            //    color: control.aasChartProperties.YAxis[control.aasColumnName].ItemColor,
                            //    borderWidth: control.aasChartProperties.YAxis[control.aasColumnName].ItemBorderWidth,
                            //    radius: control.aasChartProperties.YAxis[control.aasColumnName].ItemRadius
                            //});

                            //control.aasDxChart.define('line', {
                            //    color: control.aasChartProperties.YAxis[control.aasColumnName].LineColor,
                            //    width: control.aasChartProperties.YAxis[control.aasColumnName].LineWidth
                            //});

                            //                            if (!control.aasChartProperties.YAxis.LabelValue) {
                            //                                control.aasDxChart.define('label', '');
                            //                            }

                            deferredFlush();
                        }
                    }
                }
            };

            return control;
        };
    }
};

