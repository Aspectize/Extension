using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using Aspectize.Core;
using System.Security.Permissions;
using PubNubMessaging.Core;

namespace AspectizePubNub.Aspectize {

    public interface IPubNubMessaging {

        Dictionary<string, object> GetInfo ();
        void SendChannelMessage (string channel, object message);
        void SubscribeChannelMessage (string channel);
    }

    [Service(Name = "PubNubMessaging")]
    public class PubNubMessaging : IPubNubMessaging, IMustValidate, IServiceName, IInitializable, ISingleton
    {
        // PAM : PubNub Acces Manager
        [ParameterAttribute(DefaultValue = false, Optional = true)]
        bool EnableAccessManager = false;

        [ParameterAttribute(DefaultValue = false, Optional = true)]
        bool ClientCanPublish = false;

        [ParameterAttribute(DefaultValue = false, Optional = true)]
        bool ClientCanSubscribe = false;

        // Comma seperated list of channel names. 
        // Special names App (for application multicast), User (for user specifique messages)
        [ParameterAttribute(DefaultValue = null, Optional = true)]
        string ClientAutoSubscribeChannels = null;

        [ParameterAttribute(DefaultValue = null)]
        string PublishKey = null;

        [ParameterAttribute(DefaultValue = null)]
        string SubscribeKey = null;

        [ParameterAttribute(DefaultValue = null)]
        string SecretKey = null;


        string svcName;

        Pubnub pubnub = null;

        void IInitializable.Initialize (Dictionary<string, object> parameters) {

            pubnub = new Pubnub(PublishKey, SubscribeKey, SecretKey);
        }

        string IMustValidate.ValidateConfiguration () {

            if (String.IsNullOrWhiteSpace(PublishKey)) return String.Format("Parameter PublishKey can not be NullOrWhiteSpace on PubNubMessaging '{0}' !", svcName);
            if (String.IsNullOrWhiteSpace(SubscribeKey)) return String.Format("Parameter SubscribeKey can not be NullOrWhiteSpace on PubNubMessaging '{0}' !", svcName);
            if (String.IsNullOrWhiteSpace(SecretKey)) return String.Format("Parameter SecretKey can not be NullOrWhiteSpace on PubNubMessaging '{0}' !", svcName);

            return null;
        }

        [PrincipalPermission(SecurityAction.Demand, Authenticated = true)]
        Dictionary<string, object>  IPubNubMessaging.GetInfo () {

            var info = new Dictionary<string, object>();

            if (ClientCanPublish) info.Add("pubKey", PublishKey);
            if (ClientCanSubscribe) info.Add("subKey", SubscribeKey);

            if(!String.IsNullOrEmpty (ClientAutoSubscribeChannels.Trim())) {

                var channels = ClientAutoSubscribeChannels.Split(',');
                
                for (var n = 0; n < channels.Length; n++) channels[n] = channels[n].Trim();

                info.Add("autoChannels", channels);
            }

            info.Add("PAM", EnableAccessManager);

            return info;
        }

        void onOk (object state) {

        }

        void onError (PubnubClientError e) {

        }

        void onConnect (object state) {

        }

        void onSubscribe (object state) {

        }

        void IPubNubMessaging.SendChannelMessage (string channel, object message) {

            pubnub.Publish(channel, message, onOk, onError);
        }

        void IPubNubMessaging.SubscribeChannelMessage (string channel) {

            pubnub.Subscribe(channel, onSubscribe, onConnect, onError);
        }

        void IServiceName.SetServiceName (string name) {
            svcName = name;
        }
    }

}
