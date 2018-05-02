using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using Aspectize.Core;

namespace MicrosoftGraph {
    // https://apps.dev.microsoft.com/#/appList
    public interface IMicrosoftGraphOAuth {

        [Command(Bindable = false)]
        void OAuth(string code, string state, string error, string error_description);

        string GetRedirectToOAuthProviderUrl();
    }

    [Service(Name = "MicrosoftGraphOAuth")]
    public class MicrosoftGraphOAuth : IServiceName, IMicrosoftGraphOAuth //, IInitializable, ISingleton
    {
        const string OAuthProviderAuthorizationUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
        const string OAuthProviderTokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

        const string msCalendarUrl = "";

        [ParameterAttribute(DefaultValue = null)]
        string OAuthClientApplictionApiKey = null;

        [ParameterAttribute(DefaultValue = null)]
        string OAuthClientApplictionApiSecret = null;

        [ParameterAttribute(DefaultValue = null)]
        string DataBaseServiceName = null;

        string svcName;
        void IServiceName.SetServiceName(string name) {
            svcName = name;
        }

        string OAuthClientApplictionServerCallBackUrl {

            get {

                var host = Context.HostUrl;
                var appName = Context.CurrentApplication.Name;
                return String.Format("{0}{1}/{2}.OAuth.json.cmd.ashx", host, appName, svcName);
            }
        }

        string getScope () {

            var scopes = new[] {

                "Calendars.ReadWrite"
            };

            return String.Join(" ", scopes);
        }

        void IMicrosoftGraphOAuth.OAuth(string code, string state, string error, string error_description) {

            if (!String.IsNullOrEmpty(code) && !String.IsNullOrEmpty(state)) {

                var msxId = new Guid(state);

                IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);

                var mstx = dm.GetEntity<MicrosoftGraph.MsTokenExchange>(msxId);

                if (mstx != null) {

                    var userId = new Guid(mstx.UserId);

                    var scope = getScope();

                    var jsObj = MicrosoftGraph.OAuthHelper.PostAccessToken(OAuthProviderTokenUrl, code, OAuthClientApplictionApiKey, OAuthClientApplictionServerCallBackUrl, OAuthClientApplictionApiSecret, scope);

                    var aToken = jsObj.SafeGetValue<string>("access_token");
                    var rToken = jsObj.SafeGetValue<string>("refresh_token");
                    var expires_in = jsObj.SafeGetValue<int>("expires_in");

                    var msInfo = dm.GetEntity<MicrosoftGraph.MsTokenInfo>(userId);

                    msInfo.Token = aToken;
                    if (!String.IsNullOrEmpty(rToken)) msInfo.RefreshToken = rToken;

                    msInfo.ValidityInSeconds = expires_in;
                    msInfo.RefreshedTime = DateTime.UtcNow;

                    dm.SaveTransactional();
                }
            }
        }

        string IMicrosoftGraphOAuth.GetRedirectToOAuthProviderUrl() {

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);
            var em = dm as IEntityManager;
            var mstx = em.CreateInstance<MicrosoftGraph.MsTokenExchange>();

            mstx.UserId = ExecutingContext.CurrentUser.UserId;
            mstx.Timestamp = DateTime.UtcNow;
            string state = mstx.Id.ToString("N");

            var userId = new Guid(ExecutingContext.CurrentUser.UserId);

            var msInfo = dm.GetEntity<MicrosoftGraph.MsTokenInfo>(userId);

            if (msInfo == null) {

                msInfo = em.CreateInstance<MicrosoftGraph.MsTokenInfo>();
                msInfo.Id = userId;
            }

            dm.SaveTransactional();

            var scope = getScope();

            var url = MicrosoftGraph.OAuthHelper.GetAuthorizationDemandUrl(OAuthProviderAuthorizationUrl, OAuthClientApplictionApiKey, OAuthClientApplictionServerCallBackUrl, state, scope);

            return url;
        }
    }

}
