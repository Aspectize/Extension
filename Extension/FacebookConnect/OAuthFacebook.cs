using System;
using System.Collections.Generic;
using Aspectize.Core;
using System.Text.RegularExpressions;
using FacebookConnect;

namespace Aspectize.OAuth {

    
    public interface IFacebookOAuth {

        string GetApplictionApiKey ();

        [Command(Bindable = false)]
        void OAuth (string code, string state, string error, string error_description);

        void RedirectToOAuthProvider (string action);
    }

    public interface IFacebook {

        [Command(Bindable = false)]
        Dictionary<string, object> Authenticate (string userId, string secret, string chalenge);
    }

    [Service(Name = "FacebookConnect")]
    public class FacebookConnect : IFacebook, IFacebookOAuth, IMustValidate, IServiceName {
        const string FacebookAuthorizationUrl = "https://www.facebook.com/dialog/oauth";
        const string FacebookAccessTokenUrl = "https://graph.facebook.com/v2.6/oauth/access_token";
        const string FacebookDataUrl = "https://graph.facebook.com/v2.6/me";
        const string FacebookGraph = "https://graph.facebook.com";

        [ParameterAttribute(DefaultValue = null)]
        string OAuthClientApplictionApiKey = null;

        [ParameterAttribute(DefaultValue = null)]
        string OAuthClientApplictionApiSecret = null;

        [ParameterAttribute(DefaultValue = null)]
        string DataBaseServiceName = null;

        [ParameterAttribute(Optional=true, DefaultValue = false)]
        bool LogEnabled = false;

        void logMessage (string format, params object[] args) {

            if(LogEnabled) {

                Context.Log(InfoType.Information, format, args);
            }
        }

        string OAuthProviderAuthorizationUrl = FacebookAuthorizationUrl;

        string OAuthProviderAccessTokenUrl = FacebookAccessTokenUrl;

        string OAuthProviderDataUrl = FacebookDataUrl;

        const string ActionCreateUser = "create";
        const string ActionLoginUser = "login";

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

        #region IFacebookOAuth Members

        string IFacebookOAuth.GetApplictionApiKey() { return OAuthClientApplictionApiKey; }

        void IFacebookOAuth.RedirectToOAuthProvider (string action) {

            if (!String.IsNullOrEmpty(action)) {

                logMessage("Enter {0}.RedirectToOAuthProvider : action = {1}", svcName, action);

                action = action.ToLower();

                if ((action == ActionCreateUser) || (action == ActionLoginUser)) {

                    IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);
                    var em = dm as IEntityManager;

                    var oauthData = em.CreateInstance<Facebook.OAuthData>();

                    oauthData.Created = oauthData.Updated = DateTime.UtcNow;
                    oauthData.UserId = oauthData.UserSecret = oauthData.FirstName = oauthData.LastName = oauthData.Email = oauthData.PhotoUrl = oauthData.Data = String.Empty;

                    var state = action + oauthData.Id.ToString("N");

                    dm.SaveTransactional();

                    var url = OAuthHelper.GetAuthorizationDemandUrl(OAuthProviderAuthorizationUrl, OAuthClientApplictionApiKey, OAuthClientApplictionCallBackUrl, state, "public_profile,email");

                    ExecutingContext.RedirectUrl = url;

                    logMessage("Leave {0}.RedirectToOAuthProvider : action = {1}", svcName, action);
                }
            }
        }

        static Regex rxState = new Regex ("^(?<action>(login|create))(?<sid>[A-F0-9]{32})$", RegexOptions.IgnoreCase);

        void IFacebookOAuth.OAuth (string code, string state, string error, string error_description) {

            try {

                if (!String.IsNullOrEmpty(code) && !String.IsNullOrEmpty(state)) {

                    logMessage("Enter {0}.OAuth : state = {1}", svcName, state);

                    var m = rxState.Match(state);

                    if (m.Success) {

                        var action = m.Groups["action"].Value;
                        var sid = m.Groups["sid"].Value;

                        Guid id;

                        if (Guid.TryParse(sid, out id)) {

                            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);

                            var oauthData = dm.GetEntity<Facebook.OAuthData>(id);

                            if (oauthData != null) {

                                #region This call was requested by calling  GetAuthorizationUrl ()

                                var jsObj = OAuthHelper.GetAccessToken(OAuthProviderAccessTokenUrl, code, OAuthClientApplictionApiKey, OAuthClientApplictionCallBackUrl, OAuthClientApplictionApiSecret);
                                var aToken = jsObj.SafeGetValue<string>("access_token");

                                var data = OAuthHelper.GetData(OAuthProviderDataUrl, aToken, OAuthClientApplictionApiSecret);
                                var jsData = JsonSerializer.Eval(data) as JsonObject;

                                var providerId = jsData.SafeGetValue<string>("id");

                                var rxId = new Regex(String.Format(@"\b{0}\b", providerId));
                                data = rxId.Replace(data, "xxx");


                                var email = jsData.SafeGetValue<string>("email");
                                var externalUserId = String.Format("{0}@facebook", email).ToLower();
                                var internalUserId = String.Format("{0}@@{1}", email, svcName).ToLower();

                                var fName = jsData.SafeGetValue<string>("first_name");
                                var lName = jsData.SafeGetValue<string>("last_name");

                                var photoUrl = String.Format("{0}/{1}/picture?type=large", FacebookGraph, providerId);

                                logMessage("{0}.OAuth : email = {1}, fName = {2}, lName = {3}", svcName, email, fName, lName);

                                // hashed providerId used to prevent duplicate account creation !
                                var uniqueName = String.Format("{0}@{1}", providerId, svcName);

                                logMessage("{0}.OAuth : uniqueName = {1}", svcName, uniqueName);

                                var uniqueId = PasswordHasher.ComputeHash(uniqueName, HashHelper.Algorithm.SHA256Managed);

                                var existingUser = dm.GetEntity<Facebook.OAuthProviderUser>(uniqueId);

                                if (existingUser != null) {

                                    var existingUserId = existingUser.OAuthDataId;

                                    logMessage("{0}.OAuth : existingUserId = {1:N}", svcName, existingUserId);

                                    Facebook.OAuthData existingData;

                                    if (existingUserId != id) {

                                        oauthData.Delete();

                                        existingData = dm.GetEntity<Facebook.OAuthData>(existingUserId);

                                    } else existingData = oauthData;

                                    if (action == ActionCreateUser) {

                                        // in fact updating user
                                        existingData.UserId = internalUserId;
                                        existingData.FirstName = fName; existingData.LastName = lName;
                                        existingData.Email = email; existingData.PhotoUrl = photoUrl;
                                        existingData.Data = data;
                                        existingData.Updated = DateTime.UtcNow;

                                    } else if (action == ActionLoginUser) {

                                        existingData.Updated = DateTime.UtcNow;
                                    }

                                } else if (action == ActionCreateUser) {

                                    var em = dm as IEntityManager;

                                    var uniqueUser = em.CreateInstance<Facebook.OAuthProviderUser>();

                                    uniqueUser.Id = uniqueId;
                                    uniqueUser.OAuthDataId = id;

                                    oauthData.UserId = internalUserId;

                                    logMessage("{0}.OAuth : externalUserId = {1}", svcName, externalUserId);

                                    oauthData.UserSecret = PasswordHasherEx.ComputeHashForStorage(providerId, externalUserId); // providerId used as password !

                                    oauthData.FirstName = fName; oauthData.LastName = lName;
                                    oauthData.Email = email; oauthData.PhotoUrl = photoUrl;
                                    oauthData.Data = data;
                                    oauthData.Updated = DateTime.UtcNow;
                                }

                                dm.SaveTransactional();

                                logMessage("Leave {0}.OAuth : state = {1}", svcName, state);

                                #endregion
                            }
                        }
                    }
                }

            } catch (Exception x) {

                Context.LogException(x);
            }
        }

        static Regex rxFacebook = new Regex("@facebook", RegexOptions.IgnoreCase);

        Dictionary<string, object> IFacebook.Authenticate (string userId, string secret, string chalenge) {

            var Authenticated = false;
            var info = new Dictionary<string, object>();

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);
            var em = dm as IEntityManager;

            var internalUserId = rxFacebook.Replace(userId, String.Format("@@{0}", svcName)).ToLower();

            dm.LoadEntities<Facebook.OAuthData>(new QueryCriteria("UserId", ComparisonOperator.Equal, internalUserId));

            var data = em.GetAllInstances<Facebook.OAuthData>();

            if (data.Count == 1) {

                var d = data[0];
                var userSecret = d.UserSecret;

                var delta = Math.Abs((DateTime.UtcNow - d.Updated).TotalMinutes);

                if (delta < 1) {

                    Authenticated = PasswordHasherEx.CheckResponse(userSecret, chalenge, secret);

                    if (Authenticated) {

                        info.Add("Id", d.Id);
                        info.Add("Created", d.Created);
                        info.Add("FirstName", d.FirstName);
                        info.Add("LastName", d.LastName);
                        info.Add("Email", d.Email);
                        info.Add("PhotoUrl", d.PhotoUrl);
                        info.Add("Updated", d.Updated);
                        info.Add("RawData", d.Data);
                    }
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
