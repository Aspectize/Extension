/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

function PubNubChannel (name) {
    this.Name = name;
}

PubNubChannel.prototype.Receive = function (m) {

    alert(m.Value);
};

function AspectizePubNub(name) {

    this.Name = name;
    
    var info = Aspectize.Host.ExecuteCommand('Server/' + name + '.GetInfo');

    this.PAM = info.PAM;

    var keys = {};

    if(info.pubKey) keys.publish_key = info.pubKey;
    if(info.subKey) keys.subscribe_key = info.subKey;

    this.pubnub = PUBNUB.init(keys);

    if(info.autoChannels) {

        for(var n = 0; n < info.autoChannels.length; n++) {
            
            var channel = new PubNubChannel (info.autoChannels[n]);

            this.pubnub.subscribe ({ channel: channel.Name, message : channel.Receive });            
        }
    }   
}

var initPubNubService = (function () {

    var svcManager = {};

    return function (name) {

        if (!svcManager[name]) {

            svcManager[name] = new AspectizePubNub(name);
        }

        return svcManager[name];
    };
}) ();

Global.PubNub = {

   aasService:'PubNubJS',
   aasPublished:true,        

   SendChannelMessage: function (pubnubServiceName, channel, message) {

       var apn = initPubNubService(pubnubServiceName);

       apn.pubnub.publish(channel, message);
   }

   
};

