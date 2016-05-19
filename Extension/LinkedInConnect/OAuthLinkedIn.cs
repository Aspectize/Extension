using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using Aspectize.Core;
using System.Text.RegularExpressions;
using LinkedInConnect;

namespace Aspectize.OAuth {

    class MyGuid {

        static Regex rxGuid = new Regex("^[0-9A-F]{32}$");
        static internal bool TryParse (string s, out Guid g) {

            if (!String.IsNullOrEmpty(s)) {

                s = s.ToUpper();

                if (rxGuid.IsMatch(s)) {

                    g = new Guid(s);
                    return true;
                }
            }

            g = Guid.Empty;
            return false;
        }
    }

    public interface ILinkedInOAuth {

        [Command(Bindable = false)]
        void OAuth (string code, string state, string error, string error_description);

        void RedirectToOAuthProvider ();
    }

    public interface ILinkedIn {

        [Command(Bindable = false)]
        Dictionary<string, object> Authenticate (string userId, string secret, string chalenge);
    }

    [Service(Name = "LinkedInConnect")]
    public class LinkedInConnect : ILinkedIn, ILinkedInOAuth, IMustValidate, IServiceName {

        const string LinkedInAuthorizationUrl = "https://www.linkedin.com/uas/oauth2/authorization";
        const string LinkedInAccessTokenUrl = "https://www.linkedin.com/uas/oauth2/accessToken";
        const string LinkedInDataUrl = "https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,headline,picture-urls::(original))?format=json";

        [ParameterAttribute(DefaultValue = null)]
        string OAuthClientApplictionApiKey = null;

        [ParameterAttribute(DefaultValue = null)]
        string OAuthClientApplictionApiSecret = null;

        [ParameterAttribute(DefaultValue = null)]
        string DataBaseServiceName = null;

        string OAuthProviderAuthorizationUrl = LinkedInAuthorizationUrl;

        string OAuthProviderAccessTokenUrl = LinkedInAccessTokenUrl;

        string OAuthProviderDataUrl = LinkedInDataUrl;

        #region IServiceName Members

        string svcName;
        public void SetServiceName (string name) {
            svcName = name;
        }

        #endregion

        string OAuthClientApplictionCallBackUrl {

            get {

                var host = Context.HostUrl;
                var appName = Context.CurrentApplication.Name;
                return String.Format("{0}{1}/{2}.OAuth.json.cmd.ashx", host, appName, svcName);
            }
        }

        #region ILinkedInOAuth Members

        void ILinkedInOAuth.RedirectToOAuthProvider () {

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);
            var em = dm as IEntityManager;

            var oauthData = em.CreateInstance<LinkedIn.OAuthData>();

            oauthData.Created = oauthData.Updated = DateTime.UtcNow;
            oauthData.UserId = oauthData.UserSecret = oauthData.FirstName = oauthData.LastName = oauthData.Email = oauthData.PhotoUrl = oauthData.Data = String.Empty;

            var state = oauthData.Id.ToString("N");

            dm.SaveTransactional();

            ExecutingContext.RedirectUrl = OAuthHelper.GetAuthorizationDemandUrl(OAuthProviderAuthorizationUrl, OAuthClientApplictionApiKey, OAuthClientApplictionCallBackUrl, state);
        }

        void ILinkedInOAuth.OAuth (string code, string state, string error, string error_description) {

            if (!String.IsNullOrEmpty(code) && !String.IsNullOrEmpty(state)) {

                Guid id;

                if (MyGuid.TryParse(state, out id)) {

                    IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);

                    var oauthData = dm.GetEntity<LinkedIn.OAuthData>(id);

                    if (oauthData != null) { // This call was requested by calling  GetAuthorizationUrl ()

                        var jsObj = OAuthHelper.PostAccessToken(OAuthProviderAccessTokenUrl, code, OAuthClientApplictionApiKey, OAuthClientApplictionCallBackUrl, OAuthClientApplictionApiSecret);
                        var aToken = jsObj.SafeGetValue<string>("access_token");

                        var data = OAuthHelper.GetData(OAuthProviderDataUrl, aToken);

                        var jsData = JsonSerializer.Eval(data) as JsonObject;

                        var providerId = jsData.SafeGetValue<string>("id");

                        var rxId = new Regex(String.Format(@"\b{0}\b", providerId));
                        data = rxId.Replace(data, "xxx");

                        var email = jsData.SafeGetValue<string>("emailAddress");
                        var externalUserId = String.Format("{0}@linkedin", email).ToLower();

                        var internalUserId = String.Format("{0}@@{1}", email, svcName).ToLower();

                        var pictureUrls = jsData.SafeGetValue<JsonObject>("pictureUrls");
                        var count = pictureUrls.SafeGetValue<int>("_total");
                        var photoUrl = String.Empty;

                        if (count > 0) {

                            var urls = pictureUrls.SafeGetValue<JsonObject>("values");

                            photoUrl = urls.SafeGetValue<string>(0);
                        }

                        var fName = jsData.SafeGetValue<string>("firstName");
                        var lName = jsData.SafeGetValue<string>("lastName");


                        // hashed providerId used to prevent duplicate account creation !
                        var uniqueName = String.Format("{0}@{1}", providerId, svcName);
                        var uniqueId = PasswordHasher.ComputeHash(uniqueName, HashHelper.Algorithm.SHA256Managed);

                        var existingUser = dm.GetEntity<LinkedIn.OAuthProviderUser>(uniqueId);

                        if (existingUser != null) {

                            var existingUserId = existingUser.OAuthDataId;

                            LinkedIn.OAuthData existingData;

                            if (existingUserId != id) {

                                oauthData.Delete();

                                existingData = dm.GetEntity<LinkedIn.OAuthData>(existingUserId);

                            } else existingData = oauthData;

                            existingData.UserId = internalUserId;
                            existingData.FirstName = fName; existingData.LastName = lName;
                            existingData.Email = email; existingData.PhotoUrl = photoUrl;
                            existingData.Data = data;
                            existingData.Updated = DateTime.UtcNow;

                        } else {

                            var em = dm as IEntityManager;

                            var uniqueUser = em.CreateInstance<LinkedIn.OAuthProviderUser>();

                            uniqueUser.Id = uniqueId;
                            uniqueUser.OAuthDataId = id;

                            oauthData.UserId = internalUserId;

                            oauthData.UserSecret = PasswordHasherEx.ComputeHashForStorage(providerId, externalUserId); // providerId used as password !

                            oauthData.FirstName = fName; oauthData.LastName = lName;
                            oauthData.Email = email; oauthData.PhotoUrl = photoUrl;
                            oauthData.Data = data;
                            oauthData.Updated = DateTime.UtcNow;
                        }

                        dm.SaveTransactional();
                    }
                }
            }
        }

        static Regex rxLinkedin = new Regex("@linkedin$", RegexOptions.IgnoreCase);

        Dictionary<string, object> ILinkedIn.Authenticate (string userId, string secret, string chalenge) {

            var Authenticated = false;
            var info = new Dictionary<string, object>();

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);
            var em = dm as IEntityManager;

            var internalUserId = rxLinkedin.Replace(userId, String.Format("@@{0}", svcName)).ToLower();

            dm.LoadEntities<LinkedIn.OAuthData>(new QueryCriteria("UserId", ComparisonOperator.Equal, internalUserId));

            var data = em.GetAllInstances<LinkedIn.OAuthData>();

            if (data.Count == 1) {

                var d = data[0];
                var userSecret = d.UserSecret;

                Authenticated = PasswordHasherEx.CheckResponse(userSecret, chalenge, secret);

                if (Authenticated) {

                    info.Add("Created", d.Created);
                    info.Add("FirstName", d.FirstName);
                    info.Add("LastName", d.LastName);
                    info.Add("Email", d.Email);
                    info.Add("PhotoUrl", d.PhotoUrl);
                    info.Add("Updated", d.Updated);
                    info.Add("RawData", d.Data);
                }
            }

            info.Add("Authenticated", Authenticated);

            return info;
        }

        #endregion

        #region IMustValidate Members

        public string ValidateConfiguration () {

            if (String.IsNullOrEmpty(DataBaseServiceName)) {

                return String.Format("DataBaseServiceName can not be null or empty !");
            }

            if (String.IsNullOrEmpty(OAuthClientApplictionApiKey)) {

                return String.Format("OAuthClientApplictionApiKey can not be null or empty ! This key is provided by the OAuth provider.");
            }

            if (String.IsNullOrEmpty(OAuthClientApplictionApiSecret)) {

                return String.Format("OAuthClientApplictionApiSecret can not be null or empty ! This key is provided by the OAuth provider.");
            }

            return null;
        }

        #endregion

    }

}
