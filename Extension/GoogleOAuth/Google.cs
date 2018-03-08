using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Security.Permissions;
using System.Text;
using Aspectize.Core;

namespace GoogleOAuth {

    public interface IGoogleOAuth {

        Dictionary<string, object> GetApplicationInfo();

        [Command(Bindable = false)]
        void OAuth(string code, string state, string error, string error_description);

        string GetRedirectToOAuthProviderUrl();
    }


    public interface IGoogleCalendar {

        DataSet GetEvents(DateTime? start, DateTime? end);
    }


    [Service(Name = "GoogleOAuth")]
    public class Google : IServiceName, IGoogleOAuth, IGoogleCalendar {

        const string OAuthProviderAuthorizationUrl = "https://accounts.google.com/o/oauth2/auth";
        const string OAuthProviderTokenUrl = "https://accounts.google.com/o/oauth2/token";

        const string googleCalendarUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

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

        Dictionary<string, object> IGoogleOAuth.GetApplicationInfo() {
            throw new NotImplementedException();
        }

        void IGoogleOAuth.OAuth(string code, string state, string error, string error_description) {

            if (!String.IsNullOrEmpty(code) && !String.IsNullOrEmpty(state)) {

                var gtxId = new Guid(state);

                IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);

                var gtx = dm.GetEntity<GoogleOAuth.GoogleTokenExchange>(gtxId);

                if (gtx != null) {

                    var userId = new Guid(gtx.UserId);

                    var jsObj = GoogleConnect.OAuthHelper.PostAccessToken(OAuthProviderTokenUrl, code, OAuthClientApplictionApiKey, OAuthClientApplictionServerCallBackUrl, OAuthClientApplictionApiSecret);

                    var aToken = jsObj.SafeGetValue<string>("access_token");
                    var rToken = jsObj.SafeGetValue<string>("refresh_token");
                    var expires_in = jsObj.SafeGetValue<int>("expires_in");

                    var gInfo = dm.GetEntity<GoogleOAuth.GoogleTokenInfo>(userId);

                    gInfo.Token = aToken;
                    if (!String.IsNullOrEmpty(rToken)) gInfo.RefreshToken = rToken;

                    gInfo.ValidityInSeconds = expires_in;
                    gInfo.RefreshedTime = DateTime.UtcNow;

                    dm.SaveTransactional();
                }
            }
        }

        [PrincipalPermission(SecurityAction.Demand, Authenticated = true)]
        string IGoogleOAuth.GetRedirectToOAuthProviderUrl() {

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);
            var em = dm as IEntityManager;
            var gtx = em.CreateInstance<GoogleOAuth.GoogleTokenExchange>();

            gtx.UserId = ExecutingContext.CurrentUser.UserId;
            gtx.Timestamp = DateTime.UtcNow;
            string state = gtx.Id.ToString("N");

            var userId = new Guid(ExecutingContext.CurrentUser.UserId);

            var gInfo = dm.GetEntity<GoogleOAuth.GoogleTokenInfo>(userId);

            if (gInfo == null) {

                gInfo = em.CreateInstance<GoogleOAuth.GoogleTokenInfo>();
                gInfo.Id = userId;
            }

            dm.SaveTransactional();

            var scopes = new[] {

                "https://www.googleapis.com/auth/calendar",
                "https://www.googleapis.com/auth/calendar.readonly"
            };

            var scope = String.Join("+", scopes);

            var url = GoogleConnect.OAuthHelper.GetAuthorizationDemandUrl(OAuthProviderAuthorizationUrl, OAuthClientApplictionApiKey, OAuthClientApplictionServerCallBackUrl, state, scope);

            //ExecutingContext.RedirectUrl = url;

            return url;
        }

        DateTime? getDateTime(JsonObject dtObj) {

            var dt = dtObj.SafeGetValue<string>("dateTime");
            if (dt != null) {

                return DateTime.Parse(dt);

            } else {

                var d = dtObj.SafeGetValue<string>("date");

                if (d != null) {

                    return DateTime.Parse(d);
                }
            }

            return null;
        }
        [PrincipalPermission(SecurityAction.Demand, Authenticated = true)]
        DataSet IGoogleCalendar.GetEvents(DateTime? start, DateTime? end) {

            if (!start.HasValue) start = DateTime.UtcNow.AddDays(-1.0);
            if (!end.HasValue) end = start.Value.AddMonths(1);

            var userId = new Guid(ExecutingContext.CurrentUser.UserId);
            var dm = EntityManager.FromDataBaseService(DataBaseServiceName) as IDataManager;

            var gInfo = dm.GetEntity<GoogleOAuth.GoogleTokenInfo>(userId);

            var aToken = gInfo.Token;
            int refreshedSince = (int)((DateTime.UtcNow - gInfo.RefreshedTime).TotalSeconds);

            if (refreshedSince > gInfo.ValidityInSeconds - 300) {

                var jsObj = GoogleConnect.OAuthHelper.RefreshToken(OAuthProviderTokenUrl, gInfo.RefreshToken, OAuthClientApplictionApiKey, OAuthClientApplictionApiSecret);

                aToken = jsObj.SafeGetValue<string>("access_token");
                gInfo.ValidityInSeconds = jsObj.SafeGetValue<int>("expires_in");

                gInfo.Token = aToken;
                gInfo.RefreshedTime = DateTime.UtcNow;

                dm.SaveTransactional();
            }

            var headers = new Dictionary<string, string>();
            headers.Add("Authorization", String.Format("Bearer {0}", aToken));

            var timeMax = $"{end:yyyy-MM-dd}T{end:HH:mm:ss}Z";
            var timeMin = $"{start:yyyy-MM-dd}T{start:HH:mm:ss}Z";

            var parameters = new Dictionary<string, object>() {

                {"timeMax", timeMax }, {"timeMin", timeMin }
            };

            var data = AspectizeHttpClient.Get(googleCalendarUrl, parameters, headers);

            var jsonData = JsonSerializer.Eval(data) as JsonObject;

            var jsonEvents = jsonData.SafeGetValue<JsonObject>("items").ToArray<JsonObject>();

            bool hasEvents = jsonEvents.Length > 0;

            if (hasEvents) {

                var edm = EntityManager.FromDataBaseService(DataBaseServiceName) as IDataManager;
                var em = edm as IEntityManager;

                for (var n = 0; n < jsonEvents.Length; n++) {

                    var evt = jsonEvents[n];

                    var id = evt.SafeGetValue<string>("id").ToGuid();
                    var title = evt.SafeGetValue<string>("summary");

                    //var creator = evt.SafeGetValue<JsonObject>("creator");
                    //var cn = creator.SafeGetValue<string>("displayName");

                    var startInfo = evt.SafeGetValue<JsonObject>("start");
                    var sdt = getDateTime(startInfo);

                    var endInfo = evt.SafeGetValue<JsonObject>("end");
                    var edt = getDateTime(endInfo);

                    if (sdt.HasValue && edt.HasValue) {

                        var gEvt = em.CreateInstance<GoogleOAuth.GoogleEvent>();

                        gEvt.Id = id;
                        gEvt.Title = title;

                        gEvt.EventStart = sdt.Value;
                        gEvt.EventEnd = edt.Value;

                        var allDay = (edt.Value - sdt.Value).TotalDays >= 1.0;
                        gEvt.AllDayEvent = allDay;
                    }
                }

                edm.Data.AcceptChanges();

                return edm.Data;

            } else return null;
        }
    }
}
