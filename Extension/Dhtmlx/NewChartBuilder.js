/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

Global.NewChartBuilder = {

   aasService:'NewChartBuilder',
   aasPublished: false,

   Build: function (controlInfo) {

       function buildDhtmlxChart (control) {
          
           var cp = control.aasChartProperties;

           if (cp.dxChart && cp.MustRebuildChart) {

               cp.dxChart = null;
           }

           if (cp.dxChart === null) {

               if (!window.dhtmlXChart) throw new Error('Missing DHTMLX integration scripts in the app.ashx file ?');

               var chartType = controlInfo.PropertyBag.Type;
               var xAxis = cp.xAxis;
               var yAxis = cp.yAxis;
               var otherYAxis = cp.otherYAxis;
               
               var min = controlInfo.PropertyBag.yStart;
               var max = controlInfo.PropertyBag.yEnd;

               var chart = new dhtmlXChart({

                   view: chartType,
                   container: control.id,

                   value: '#' + yAxis + '#',
                   label: '#' + yAxis + 'Label#',

                   lines: controlInfo.PropertyBag.hLines,

                   xAxis: {
                       title: '',
                       template: '#' + xAxis + 'Label#',
                       lines: controlInfo.PropertyBag.vLines
                   },

                   yAxis: {

                       start: getGraphBegin(min, max),
                       end: getGraphEnd (min, max),
                       step: getGraphStep (min, max)
                   }

               });

               for (var i = 0; i < otherYAxis.length; i++) {

                   var axisName = otherYAxis[i];
                   var axis = cp.AllAxis[axisName];

                   chart.addSeries({
                       alpha: 0.2,
                       fill: '#0000ff',

                       value: '#' + axisName + '#',
                       label: '#' + axisName + 'Label#',
                       color: "#2FA783",
                       item: { radius: 1, borderColor: '#2FA783', color: '#2FA783', borderWidth: 1 },
                       line: { color: "#2FA783", width: 3 }
                   });
               }

               cp.dxChart = chart;
               cp.data = [];

               Aspectize.ProtectedCall(chart, chart.refresh);
           }

           cp.MustRebuildChart = false;
       }

       function buildAxisInfo(index) {

           var colors = ['#000000', '#D4D4D4', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];

           var color = colors[index % colors.length];

           return {
               Title: '', ShowLine: false,
               Start: null, End: null, Step: null,
               AlphaTransparency: 0.2, LineColor: color, LineWidth: 3,
               ItemColor: '#000000', ItemBorderColor: '#000000', ItemRadius: 4, ItemBorderWidth: 2,
               PointWidth: 50
           };
       }


       controlInfo.CreateInstance = function (ownerWindow, id) {

           var chart = Aspectize.createElement('div', ownerWindow);

           chart.aasSubControls = {};

           return chart;
       };

       controlInfo.ChangePropertyValue = function (property, newValue) {

           this.PropertyBag[property] = newValue;
       },

       controlInfo.InitGrid = function (control) {

           control.style.height = '350px';

           if (control.parentNode.width) {
               control.style.width = control.parentNode.width;
           }

           control.parentNode.style.overflowX = "auto";
           control.parentNode.style.overflowY = "hidden";

           var chartType = this.PropertyBag.Type;
           
           var columnInfos = controlInfo.columnInfos;

           var axisCount = columnInfos.length;
           var xAxis = (axisCount > 1) ? columnInfos[0].name : null;
           var yAxis = (axisCount > 1) ? columnInfos[1].name : null;

           var otherYAxis = [];          

           if (chartType !== 'pie') {
               for (var n = 2; n < axisCount; n++) otherYAxis.push(columnInfos[n].name);
           }                      
          
           control.aasChartProperties = {

               dxChart:null,
               MustRebuildChart: false,
               xAxis: xAxis, yAxis: yAxis, otherYAxis: otherYAxis, AllAxis: {},
               data: [],
           
               SetAxisProperty: function (axis, property, value) {

                   if (property === 'Value') {

                       var xy = (axis === this.xAxis) ? 'x' : 'y';

                       var minField = xy + 'Start';
                       var maxField = xy + 'End';

                       if (value < controlInfo.PropertyBag[minField]) {

                           controlInfo.PropertyBag[minField] = value;

                           this.MustRebuildChart = true;
                       }

                       if (value > controlInfo.PropertyBag[maxField]) {

                           controlInfo.PropertyBag[maxField] = value;

                           this.MustRebuildChart = true;
                       }

                   } else if (property in this.AllAxis[axis]) {

                       if (this.AllAxis[axis][property] !== value) {

                           this.AllAxis[axis][property] = value;
                           this.MustRebuildChart = true;
                       }                    
                   }
               },

               AddData: function (chartItem) {

                   this.data.push(chartItem);
               },

               RefreshData (id, field, value) {

                   buildDhtmlxChart(control);

                   if (this.data.length > 0) {

                       if (id) {

                           var index = this.dxChart.indexById(id);

                           if (index !== -1) {

                               chartData = this.data[index];

                               if (chartData[field] !== value) {

                                   chartData[field] = value;
                                   this.dxChart.remove(id);
                                   this.dxChart.add(chartData, index);
                               }
                           }

                       } else {

                           Aspectize.ProtectedCall(this.dxChart, this.dxChart.parse, this.data, 'json');
                       }
                   }
               }
           };

           control.aasChartProperties.AllAxis[xAxis] = buildAxisInfo(0);
           control.aasChartProperties.AllAxis[yAxis] = buildAxisInfo(1);

           for (var i = 0; i < otherYAxis.length; i++) {
               control.aasChartProperties.AllAxis[otherYAxis[i]] = buildAxisInfo (2 + i);
           }

           buildDhtmlxChart(control);
       };

       controlInfo.InitCellControl = function (control, cellControl, rowId, rowIndex, columnIndex, columnName) {

           cellControl.aasChartProperties = control.aasChartProperties;
           cellControl.aasAxisName = columnName;
           cellControl.aasRowId = rowId;
       };


       controlInfo.RowCreated = function (control, rowId, cellControls) {

           var chartItem = { id: rowId };
           control.aasChartProperties.AddData(chartItem);

           for (var n = 0; n < cellControls.length; n++) {

               var cellControl = cellControls[n];

               var v = cellControl.aasControlInfo.PropertyBag.Value;
               var l = cellControl.aasControlInfo.PropertyBag.Label;

               chartItem[cellControl.aasAxisName] = v;
               chartItem[cellControl.aasAxisName + 'Label'] = l;
           }
       };

       controlInfo.GridRendered = function (control, rowControls) {

           var xAxis = control.aasChartProperties.xAxis;
         
           var rowCount = rowControls.length; 

           control.aasRowCount = rowCount;

           var currentWidth = control.clientWidth;

           var pointWidth = control.aasChartProperties.AllAxis[xAxis].PointWidth;

           if (currentWidth < rowCount * pointWidth) {
               control.style.width = rowCount * pointWidth + 'px';
           }
           else {
               control.style.width = control.parentNode.clientWidth + 'px';
           }

           control.aasChartProperties.RefreshData();
           //Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.clearAll);
           //Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.refresh);

           //if (rowControls.length > 0) {

           //    Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.parse, data, 'json');
           //    Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.refresh);
           //    Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.resize);
           //}
       };

       controlInfo.OnCurrentIndexChanged = function (control, currentIndex) {

       };
   }

};

Global.NewAxisBuilder = {

    aasService: 'NewAxisBuilder',
    aasPublished: false,

    Build: function (controlInfo) {

        var dataProperties = {  };

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
                   // Aspectize.ProtectedCall(control.aasDxChart, control.aasDxChart.refresh);
                }

                if (!needsFlush) { needsFlush = true; setTimeout(flush, 0); }
            };

            controlInfo.ChangePropertyValue = function (property, newValue) {

                control.aasChartProperties.SetAxisProperty(control.aasAxisName, property, newValue);
                
                this.PropertyBag[property] = newValue;
                if ((property === 'Value') || (property === 'Label')) {

                    var field = (property === 'Value') ? control.aasAxisName : control.aasAxisName + 'Label';
                    control.aasChartProperties.RefreshData(control.aasRowId, field, newValue);
                } 
            };

            return control;
        };
    }
};


