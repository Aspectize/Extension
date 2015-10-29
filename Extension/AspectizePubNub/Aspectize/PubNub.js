/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

function PubNubChannel(name, mergeData, handler) {

    var executeCall = null;

    function mergeAspectizeData(data) {

        return Aspectize.Host.MergeRecievedData(data, mergeData);
    }
    
    function both(m) {

        if (!mergeAspectizeData(m)) {

            executeCall(m);
        }
    }

    this.Name = name;

    if (handler) {

        var type = typeof (handler);
        if (type === 'string') {

            this.Receive = executeCall = function (m) {

                Aspectize.Host.ExecuteCommand(handler, m, name);
            };

        } else if (type === 'function') {

            this.Receive = executeCall = function (m) {

                handler(m, name);
            };

        } else Aspectize.Throw(1, 'AspectizePubNub extension : bad handler type ' + type + " expected string or function. Check PubNubJS.InitializeReceive's second parameter !");

        if (mergeData) this.Receive = both;

    } else if (mergeData) this.Receive = mergeAspectizeData;
        
}


function AspectizePubNub(name, mergeData, handler) {

    this.Name = name;
    
    var info = Aspectize.Host.ExecuteCommand('Server/' + name + '.GetInfo');

    this.PAM = info.PAM;

    var keys = {};

    if(info.pubKey) keys.publish_key = info.pubKey;
    if(info.subKey) keys.subscribe_key = info.subKey;

    this.pubnub = PUBNUB.init(keys);

    if(info.autoChannels) {

        if(mergeData || handler) {

            for(var n = 0; n < info.autoChannels.length; n++) {
            
                var channel = new PubNubChannel(info.autoChannels[n], mergeData, handler);
                this.pubnub.subscribe ({ channel: channel.Name, message : channel.Receive });            
            }
        }
    }   
}

var initPubNubService = (function () {

    var svcManager = {};

    return function (name, mergeData, handler) {

        if (!svcManager[name]) {

            svcManager[name] = new AspectizePubNub(name, mergeData, handler);
        }

        return svcManager[name];
    };
}) ();

Global.PubNub = {

   aasService:'PubNubJS',
   aasPublished:true,        

   InitializeReceive: function (pubnubServiceName, mergeData, customHandlerOrCommand) {

       initPubNubService(pubnubServiceName, mergeData, customHandlerOrCommand);
   },

   SendChannelMessage: function (pubnubServiceName, channel, message) {

       var apn = initPubNubService(pubnubServiceName);
      
       var obj = {}; 
       obj.channel = channel;
       obj.message = message;
       apn.pubnub.publish(obj);
   }
   
};

