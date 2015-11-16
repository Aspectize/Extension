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

    this.Connect = function (m) { this.Receive({ Type: 'Connect', Message: m }); };
    this.Disconnect = function (m) { this.Receive({ Type: 'Disconnect', Message: m }); };
    this.Reconnect = function (m) { this.Receive({ Type: 'Reconnect', Message: m }); };
    this.Presence = function (m) { this.Receive({ Type: 'Presence', Message: m }); };
    this.Error = function (m) { this.Receive({ Type: 'Error', Message: m }); };        
}

function getSubscriptionParams(channelName, mergeData, handler) {

    var channel = new PubNubChannel(channelName, mergeData, handler);
    var params = { channel: channel.Name, message: channel.Receive };

    if (channel.Connect) params.connect = channel.Connect;
    if (channel.Disconnect) params.disconnect = channel.Disconnect;
    if (channel.Reconnect) params.reconnect = channel.Reconnect;
    if (channel.Presence) params.presence = channel.Presence;
    if (channel.Error) params.error = channel.Error;

    return params;
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
                                        
                var params = getSubscriptionParams(info.autoChannels[n], mergeData, handler);
                this.pubnub.subscribe(params);
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

   SubscribeChannel : function (pubnubServiceName, channel, mergeData, customHandlerOrCommand) {

       var apn = initPubNubService(pubnubServiceName);

       var params = getSubscriptionParams(channel, mergeData, customHandlerOrCommand);
       apn.pubnub.subscribe(params);
   },

   UnsubscribeChannel: function (pubnubServiceName, channel) {

       var apn = initPubNubService(pubnubServiceName);

       apn.pubnub.unsubscribe({ channel: channel });
   },

   SendChannelMessage: function (pubnubServiceName, channel, message) {

       var apn = initPubNubService(pubnubServiceName);
      
       var obj = {}; 
       obj.channel = channel;
       obj.message = message;
       apn.pubnub.publish(obj);
   }
   
};

