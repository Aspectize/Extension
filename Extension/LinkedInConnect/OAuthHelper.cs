using System;
using System.Collections.Generic;
using Aspectize.Core;

namespace LinkedInConnect {

    public static class OAuthHelper {
       
        static internal string GetAuthorizationDemandUrl (string oauthProviderAuthorizationUrl, string client_id, string redirect_uri, string state) {

            return GetAuthorizationDemandUrl(oauthProviderAuthorizationUrl, client_id, redirect_uri, state, null);
        }

        static internal string GetAuthorizationDemandUrl (string oauthProviderAuthorizationUrl, string client_id, string redirect_uri, string state, string scope) {

            var p = new List<string>();

            p.Add("response_type=code");
            p.Add(String.Format("client_id={0}", client_id));

            if (!String.IsNullOrEmpty(redirect_uri)) p.Add(String.Format("redirect_uri={0}", redirect_uri));
            if (!String.IsNullOrEmpty(state)) p.Add(String.Format("state={0}", state));
            if (!String.IsNullOrEmpty(scope)) p.Add(String.Format("scope={0}", scope));


            var qs = String.Join("&", p.ToArray());

            return String.Format("{0}?{1}", oauthProviderAuthorizationUrl, qs);
        }

        static Dictionary<string, object> buildAccessTokenDemandParameters (string code, string client_id, string redirect_uri, string secret) {

            var p = new Dictionary<string, object>();

            p.Add("grant_type", "authorization_code");
            p.Add("code", code);
            p.Add("redirect_uri", redirect_uri);
            p.Add("client_id", client_id);
            p.Add("client_secret", secret);

            return p;
        }

        static internal JsonObject GetAccessToken (string oauthProviderAccessTokenUrl, string code, string client_id, string redirect_uri, string secret) {

            var parameters = buildAccessTokenDemandParameters(code, client_id, redirect_uri, secret);

            var json = AspectizeHttpClient.Get(oauthProviderAccessTokenUrl, parameters, null);

            return JsonSerializer.Eval(json) as JsonObject;
        }

        static internal JsonObject PostAccessToken (string oauthProviderAccessTokenUrl, string code, string client_id, string redirect_uri, string secret) {

            var parameters = buildAccessTokenDemandParameters(code, client_id, redirect_uri, secret);

            var json = AspectizeHttpClient.Post(oauthProviderAccessTokenUrl, parameters);

            return JsonSerializer.Eval(json) as JsonObject;
        }
        
        static internal string GetData (string oauthProviderRequest, string accessToken) {

            var headers = new Dictionary<string, string>();
            headers.Add("Authorization", String.Format("Bearer {0}", accessToken));

            return AspectizeHttpClient.Get(oauthProviderRequest, null, headers);
        }

        static void Usage () {

            // Linkedin demo case

            //STEP 0 : get an API key and a secret key from oauth provider.

            var linkedinApiKey = "your key here";
            var linkedinAuthorizationUrl = "https://www.linkedin.com/uas/oauth2/authorization";
            
            //An Aspectize Command Url for the callback. Format : Host/ApplicationName/ServiceName.OAuth.json.cmd.ashx;
            var callbackUrl = "";

            var state = Guid.NewGuid().ToString("N");

            //STEP 1 : send user to authUrl
            var authUrl = OAuthHelper.GetAuthorizationDemandUrl(linkedinAuthorizationUrl, linkedinApiKey, callbackUrl, state);

            //STEP 2 : receive on callbackUrl (code and state) or (error and error_description)

            //STEP 3 : Request access token by posting 
            string code = null;  // code received on STEP 2
            string secretKey = null; // key generated in STEP 0

            var linkedinAccessTokenUrl = "https://www.linkedin.com/uas/oauth2/accessToken";
            var jsObj = OAuthHelper.PostAccessToken(linkedinAccessTokenUrl, code, linkedinApiKey, callbackUrl, secretKey);

            //STEP 4 : Post result is a JSON object with : access_token and expires_in

            //STEP 5 : make HTTP Get request with Header Authorization = Bearer access_token
        }
    }
}
