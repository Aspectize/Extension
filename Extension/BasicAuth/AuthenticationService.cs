using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using Aspectize.Core;

namespace BasicAuth
{
    public interface IInscriptionService
    {
        bool SignUp(string userName, string pwd);
        bool IsUserNameAvailable(string userName);
    }

    [Service(Name = "BasicAuthenticationService", ConfigurationRequired = true)]
    public class BasicAuthenticationService : IAuthentication, IUserProfile, IPersistentAuthentication, IInscriptionService //, IInitializable, ISingleton
    {
        [ParameterAttribute]
        string DataBaseService = null;

        AspectizeUser IAuthentication.Authenticate(string userName, string secret, AuthenticationProtocol protocol, HashHelper.Algorithm algorithm, string challenge)
        {
            IDataManager dm = EntityManager.FromDataBaseService(DataBaseService);

            List<User> users = dm.GetEntities<User>(new QueryCriteria(User.Fields.UserName, ComparisonOperator.Equal, userName.ToLower().Trim()));

            if (users.Count > 0)
            {
                User user = users[0];

                bool match = PasswordHasher.CheckResponse(user.Password, challenge, algorithm, secret);

                if (match)
                {
                    Dictionary<string, object> dicoProperties = new Dictionary<string, object>();

                    dicoProperties.Add("UserName", user.UserName);

                    List<string> roles = new List<string>();

                    roles.Add("Registered");

                    user.DateLastLogin = DateTime.Now;

                    dm.SaveTransactional();

                    return AspectizeUser.GetAuthenticatedUser(user.Id.ToString(), null, roles.ToArray(), dicoProperties);
                }
            }

            return AspectizeUser.GetUnAuthenticatedUser();
        }

        DataSet IUserProfile.GetUserProfile()
        {
            AspectizeUser aspectizeUser = ExecutingContext.CurrentUser;

            if (aspectizeUser.IsAuthenticated)
            {
                Guid userId = new Guid(aspectizeUser.UserId);

                IDataManager dm = EntityManager.FromDataBaseService(DataBaseService);

                IEntityManager em = dm as IEntityManager;

                User user = dm.GetEntity<User>(userId);

                if (user != null)
                {
                    CurrentUser currentUser = em.CreateInstance<CurrentUser>();

                    em.AssociateInstance<IsUser>(currentUser, user);

                    em.Data.AcceptChanges();

                    return dm.Data;
                }
            }

            return null;
        }

        bool IPersistentAuthentication.ValidateUser(AspectizeUser user)
        {
            IDataManager dm = EntityManager.FromDataBaseService(DataBaseService);

            User appliUser = dm.GetEntity<User>(new Guid(user.UserId));

            if (appliUser != null)
            {
                user["UserName"] = appliUser.UserName;

                appliUser.DateLastLogin = DateTime.Now;

                dm.SaveTransactional();

                return true;
            }

            return false;
        }

        bool IInscriptionService.SignUp(string userName, string pwd)
        {
            IDataManager dm = EntityManager.FromDataBaseService(DataBaseService);

            IEntityManager em = dm as IEntityManager;

            List<User> users = dm.GetEntities<User>(new QueryCriteria(User.Fields.UserName, ComparisonOperator.Equal, userName.ToLower().Trim()));

            User user;

            if (users.Count == 0)
            {
                user = em.CreateInstance<User>();

                user.UserName = userName.ToLower().Trim();
                user.Password = pwd;

                dm.SaveTransactional();

                return true;
            }
            else
            {
                return false;
            }
        }

        bool IInscriptionService.IsUserNameAvailable(string userName)
        {
            IDataManager dm = EntityManager.FromDataBaseService(DataBaseService);

            IEntityManager em = dm as IEntityManager;

            List<User> users = dm.GetEntities<User>(new QueryCriteria(User.Fields.UserName, ComparisonOperator.Equal, userName.ToLower().Trim()));

            return (users.Count == 0);
        }

    }

}
